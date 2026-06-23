# Offline-first — Plan de Implementación

> **Decisión:** Offline-first desde el inicio del módulo académico
> **Enfoque:** Paso a paso, no todo de una vez
> **Fecha:** 22 Jun 2026

---

## Índice

1. [Arquitectura General](#1-arquitectura-general)
2. [Paso 1: Capa de sincronización base](#2-paso-1-capa-de-sincronización-base)
3. [Paso 2: Migrar tabla desempeño a offline-first](#3-paso-2-migrar-tabla-desempeño-a-offline-first)
4. [Paso 3: Migrar actividades y salas](#4-paso-3-migrar-actividades-y-salas)
5. [Paso 4: Evaluaciones QR offline](#5-paso-4-evaluaciones-qr-offline)
6. [Paso 5: Migrar módulos existentes (opcional)](#6-paso-5-migrar-módulos-existentes-opcional)
7. [Pauta de Implementación](#7-pauta-de-implementación)

---

## 1. Arquitectura General

### Hoy (Online-first)

```
App → Supabase API → PostgreSQL
```

### Mañana (Offline-first)

```
App → IndexedDB (siempre)
         ↓
      Sync Engine (en segundo plano)
         ↓
      Supabase API → PostgreSQL
```

### Flujo de escritura

```
Usuario guarda → IndexedDB (inmediato)
                     ↓
                ¿Hay internet?
                   ├── Sí → Sync a Supabase
                   └── No → Queda en cola pendiente
                              ↓
                           Cuando vuelve internet → Sync automático
```

### Flujo de lectura

```
App pide datos → ¿Hay en IndexedDB?
                   ├── Sí → Devuelve inmediato (rápido)
                   └── No → Busca en Supabase → Guarda en IndexedDB → Devuelve
```

---

## 2. Paso 1: Capa de sincronización base

### 2.1 Crear el sync engine

**Archivo:** `src/services/syncEngine.ts`

```typescript
// Propósito: Cola de operaciones pendientes + sincronización
// API:
//   - enqueue(table, operation, data)  → agrega operación a cola
//   - processQueue()                   → ejecuta operaciones pendientes
//   - isOnline()                       → true/false
//   - onOnline(callback)               → escucha cambio de conectividad
```

**Responsabilidades:**
- Detectar cambios de conectividad (eventos `online`/`offline`)
- Mantener cola FIFO de operaciones pendientes (crear, actualizar, eliminar)
- Procesar cola cuando hay internet (uno por uno)
- Si falla una operación → reintentar 3 veces, luego reportar conflicto

### 2.2 Crear el store base

**Archivo:** `src/services/offlineStore.ts`

```typescript
// Propósito: CRUD genérico sobre IndexedDB usando idb
// API:
//   - getAll(table)       → todos los registros de una tabla
//   - getById(table, id)  → un registro
//   - put(table, data)    → guardar (insert o update)
//   - remove(table, id)   → eliminar
//   - clear(table)        → limpiar tabla local
```

### 2.3 Esquema IndexedDB

```typescript
// DB name: 'sgja_offline'
// Versión: 1

// Object stores iniciales:
//   - sync_queue:     { id, table, operation, data, created_at, retries }
//   - sync_meta:      { table, last_sync_at, last_row_version }
```

### 2.4 Sync automático

```typescript
// En App.tsx o useOfflineSync.ts:
//   1. Al cargar la app, registrar listener online/offline
//   2. Cuando pasa a online → processQueue()
//   3. Cada 30 segundos si está online → processQueue()
//   4. Después de cada operación local exitosa → processQueue()
```

### Checklist Paso 1

- [ ] Instalar/y configurar `idb` (ya está en package.json pero no se usa)
- [ ] Crear `src/services/offlineStore.ts` con CRUD genérico
- [ ] Crear `src/services/syncEngine.ts` con cola de operaciones
- [ ] Crear hook `src/hooks/useOfflineSync.ts` (estado de conexión, cola pendiente)
- [ ] Mostrar indicador visual: 🟢 Online / 🟡 Sincronizando / 🔴 Offline (cola: 3)
- [ ] Test: escribir y leer de IndexedDB offline
- [ ] Test: encolar operación sin internet → procesar cuando vuelve

---

## 3. Paso 2: Migrar tabla desempeño a offline-first

### 3.1 Schema IndexedDB

```typescript
// En la migración v2 de la DB:
//   - desempeno:      { id, id_actividad, id_estudiante, nota, observaciones, created_at, activo, _synced }
//   - actividades:    { id, id_asignatura, id_periodo, id_sala, nombre, ponderacion, fecha, activo, _synced }
```

### 3.2 Reemplazar servicio Supabase por offline service

**Hoy:** `supabase.from('desempeno').insert(...)` directo en el componente.

**Mañana:**
```typescript
// Ejemplo de uso en el componente
import { performanceService } from '@/services/performanceService';

// Guardar (va a IndexedDB, sync en background)
await performanceService.saveDesempeno(data);

// Leer (viene de IndexedDB, siempre rápido)
const data = await performanceService.getDesempenoByActividad(id);
```

### 3.3 Servicio de desempeño

**Archivo:** `src/services/performanceService.ts`

```typescript
// saveDesempeno(data):
//   1. Guarda en IndexedDB
//   2. Encola sync a Supabase
//   3. Retorna inmediato

// getDesempenoByActividad(id):
//   1. Busca en IndexedDB
//   2. Si no encuentra → busca en Supabase → cachea en IndexedDB
//   3. Retorna

// syncDesempeno():
//   1. Toma registros con _synced = false
//   2. Envía a Supabase
//   3. Marca _synced = true
```

### Checklist Paso 2

- [ ] Crear tabla `desempeno` en IndexedDB (v2)
- [ ] Crear `src/services/performanceService.ts`
- [ ] Reemplazar llamadas a Supabase directas en componentes académicos
- [ ] Probar: crear desempeño offline → aparece en UI → sync al volver
- [ ] Probar: editar nota existente offline → sync correcto
- [ ] Agregar badge de estado sync en cada registro (✅ sincronizado / ⏳ pendiente)

---

## 4. Paso 3: Migrar actividades y salas

Mismo patrón que desempeño, pero para tablas maestras:

### Tablas a migrar

| Tabla | Prioridad | Tipo de datos |
|-------|-----------|---------------|
| `actividades` | Alta | El monitor las crea y edita |
| `salas_aprendizaje` | Alta | Se consultan siempre (catálogo) |
| `asignaturas` | Media | Se consultan siempre (catálogo) |
| `periodos` | Media | Se consultan siempre (catálogo) |

### Estrategia para catálogos (salas, asignaturas, periodos)

Estas tablas cambian poco. Estrategia:
1. Primera carga: fetch desde Supabase → cachear en IndexedDB
2. Lecturas: siempre desde IndexedDB
3. Re-sync: al abrir la app (si hay internet), actualizar cache

### Checklist Paso 3

- [ ] Migrar `actividades` al patrón offline-first
- [ ] Migrar `salas_aprendizaje` como catálogo cacheado
- [ ] Migrar `asignaturas` como catálogo cacheado
- [ ] Migrar `periodos` como catálogo cacheado
- [ ] Probar: crear actividad offline → aparece en selector de desempeño
- [ ] Probar: precargar salas desde Supabase → funcionan offline

---

## 5. Paso 4: Evaluaciones QR offline

Cuando llegue a Fase 2 (QR), el patrón ya está listo. Solo hay que agregar las tablas nuevas:

| Tabla | Tipo |
|-------|------|
| `preguntas` | Catálogo (cambia poco) |
| `pruebas` | El monitor las crea offline |
| `pruebas_estudiante` | Se genera offline con QR |
| `respuestas` | Se capturan offline (cámara) |
| `resultados_prueba` | Se calculan offline |

### Checklist Paso 4

- [ ] Agregar tablas de evaluación a IndexedDB
- [ ] Cachear `preguntas` como catálogo
- [ ] Generar prueba offline → imprimir QR después cuando haya internet
- [ ] Capturar respuestas offline → sync resultados

---

## 6. Paso 5: Migrar módulos existentes (opcional)

Cuando el patrón esté sólido, se puede migrar los módulos actuales:

| Módulo | Prioridad | Dependencia offline |
|--------|-----------|---------------------|
| Tickets | Media | El técnico podría registrar tickets sin internet |
| Equipos | Baja | CRUD pesado, menos crítico offline |
| Mapa | Baja | Ya se descarga JSON, es offline-friendly |

**No recomendado para ahora.** Primero el módulo académico.

---

## 7. Pauta de Implementación

### Orden sugerido

```
Paso 1: Sync engine + Store base     → Semana 1
Paso 2: Desempeño offline             → Semana 2
Paso 3: Actividades + catálogos       → Semana 3
     ├── Test: ciclo completo offline
     └── Push 1: Registro de Desempeño
Paso 4: Evaluaciones QR               → Q4 2026 (cuando toque)
Paso 5: Módulos existentes            → Q1 2027 (si aplica)
```

### Reglas de oro

1. **IndexedDB primero, siempre.** Toda escritura va a IndexedDB antes que a Supabase.
2. **Cola de sincronización FIFO.** Las operaciones se ejecutan en orden. Si una falla, se reintenta.
3. **\_synced flag.** Todo registro en IndexedDB tiene `_synced: boolean` para saber si está pendiente.
4. **Sin bloqueos.** El usuario nunca espera a que sincronice. La UI es responsiva siempre.
5. **Indicador visible.** El monitor siempre sabe si está online/offline y cuántas operaciones están pendientes.

### Resolución de conflictos

Para la primera versión (Fase 1), el conflicto es improbable porque solo el monitor escribe. Estrategia:

| Escenario | Estrategia |
|-----------|------------|
| Dos monitores editan mismo registro offline | **Last-write-wins** (el último que sincroniza gana) |
| Registro eliminado en Supabase pero modificado offline | **Abortar** la operación, notificar al monitor |
| Sync falla por validación en Supabase | **Reintentar** 3 veces, luego marcar como error y notificar |

Para Fase 3 (estudiante escribe desde sala), se puede implementar CRDT o resolución manual.

---

*Documento generado el 22 Jun 2026. Siguiente acción: implementar Paso 1.*
