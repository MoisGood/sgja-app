# Offline-first — Plan de Implementación

> **Decisión:** Offline-first desde el inicio del módulo académico
> **Enfoque:** Paso a paso, no todo de una vez
> **Fecha:** 22 Jun 2026 — Última actualización: 24 Jun 2026

---

## Índice

1. [Arquitectura General](#1-arquitectura-general)
2. [Paso 1: Capa de sincronización base](#2-paso-1-capa-de-sincronización-base)
3. [Paso 2: Migrar tabla desempeño a offline-first](#3-paso-2-migrar-tabla-desempeño-a-offline-first)
4. [Paso 3: Migrar actividades y catálogos](#4-paso-3-migrar-actividades-y-catálogos)
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

API real:
- `syncEngine.status` → `'online' | 'offline' | 'syncing'` (getter)
- `subscribe(fn)` → escucha cambios de estado, retorna unsubscribe
- `processQueue()` → ejecuta operaciones pendientes
- `start()` → registra listeners online/offline + procesa cola inicial

Responsabilidades:
- Detectar cambios de conectividad (eventos `online`/`offline`)
- Mantener cola FIFO de operaciones pendientes (crear, actualizar, eliminar)
- Procesar cola cuando hay internet (uno por uno)
- Si falla una operación → reintenta, luego sigue con la siguiente

### 2.2 Crear el store base

**Archivo:** `src/services/offlineStore.ts`

API real:
- `getAll(table)` → todos los registros
- `getById(table, id)` → un registro
- `put(table, id, data)` → guarda + encola sync (`_synced: false`)
- `putSilent(table, id, data)` → guarda sin encolar sync (`_synced: true`)
- `remove(table, id)` → elimina + encola sync
- `clear(table)` → limpia tabla local
- `getPendingSync()` → devuelve cola ordenada por fecha
- `markSynced(id)` → elimina de cola
- `getMetadata(key)` / `setMetadata(key)` → timestamps de sync

### 2.3 Esquema IndexedDB

```
DB name: 'sgja-offline'
Versión: 1

Object stores actuales:
  salas_aprendizaje  → key: string, value: Record + _synced + _updated_at
  asignaturas        → key: string, value: Record + _synced + _updated_at
  periodos           → key: string, value: Record + _synced + _updated_at
  actividades        → key: string, value: Record + _synced + _updated_at
  desempeno          → key: string, value: Record + _synced + _updated_at
  sync_queue         → key: number (autoIncrement)
                       { id, table, operation, record_id, data, created_at, retries }
  metadata           → key: string, value: { last_sync_at: number }
```

### 2.4 Sync automático

En `src/App.tsx`:
1. Al cargar la app, llamar `syncEngine.start()`
2. Cuando pasa a online → `processQueue()`
3. Después de cada `offlineStore.put()` → se encola automáticamente

En `src/components/Header.tsx`:
- Indicador visual: badge con contador de pendientes + estado

En `src/hooks/useOfflineSync.ts`:
- Hook que expone `{ status, pendingCount, isOnline, isSyncing }`

### Checklist Paso 1

- [x] Instalar/configurar `idb` (ya estaba en package.json)
- [x] Crear `src/services/offlineStore.ts` con CRUD genérico
- [x] Crear `src/services/syncEngine.ts` con cola de operaciones
- [x] Crear hook `src/hooks/useOfflineSync.ts`
- [x] Mostrar indicador visual en Header (badge + spinner)
- [x] Test: escribir y leer de IndexedDB offline (9 tests)
- [x] Test: syncEngine subscribe/status (5 tests)

---

## 3. Paso 2: Migrar tabla desempeño a offline-first

### 3.1 Servicio de desempeño

**Archivo:** `src/services/performanceService.ts`

API real:
- `saveDesempeno(data)` → guarda en IndexedDB, encola sync, retorna inmediato
- `saveDesempenoBatch(items)` → batch save (planilla)
- `updateDesempeno(id, data)` → merge parcial sobre registro existente
- `getDesempenoByActividad(actividadId)` → filtra por actividad
- `getDesempenoByEstudiante(estudianteId)` → filtra por estudiante
- `getDesempeno(id)` → un registro (offline → supabase fallback)
- `removeDesempeno(id)` → elimina + encola sync
- `calcularPromedio(estudianteId, asignaturaId, periodoId, actividadesOverride?)` → promedio ponderado, detecta riesgo (< 4.0)
- `getPendingCount()` → contador de desempeños pendientes de sync

### Checklist Paso 2

- [x] Crear `src/services/performanceService.ts`
- [x] Test: CRUD offline (9 tests)
- [x] Test: promedio ponderado + detección de riesgo
- [ ] Reemplazar llamadas a Supabase directas (no hay componentes aún)
- [ ] Probar: crear desempeño offline → aparece en UI → sync al volver
- [ ] Probar: editar nota existente offline → sync correcto
- [ ] Agregar badge de estado sync por registro

---

## 4. Paso 3: Migrar actividades y catálogos

### Tablas migradas

| Tabla | Prioridad | Servicio | Estado |
|-------|-----------|----------|--------|
| `actividades` | Alta | `actividades.service.ts` | ✅ |
| `salas_aprendizaje` | Alta | `catalogo.service.ts` | ✅ |
| `asignaturas` | Media | `catalogo.service.ts` | ✅ |
| `periodos` | Media | `catalogo.service.ts` | ✅ |

### Servicios creados

**`src/services/actividades.service.ts`:**
- `getAll({ activoOnly })` → ordenado por fecha descendente
- `getById(id)` → offline → supabase fallback
- `getByPeriodo(periodoId)` / `getByAsignatura(asignaturaId)`
- `save(data)` → offlineStore.put + encola sync
- `update(id, data)` → merge parcial
- `remove(id)` → elimina + encola sync

**`src/services/academico/catalogo.service.ts`:**
- Catálogos con patrón offline-first: lee offline → cache → supabase
- `precacheCatalogs()` → carga desde Supabase a IndexedDB sin encolar sync (usa `putSilent`)
- CRUD completo para salas, asignaturas, periodos

### SQL en Supabase

Migration `027_create_tablas_academicas.sql` aplicada en Supabase:
- `salas_aprendizaje`, `asignaturas`, `periodos`, `actividades`, `desempeno`, `promedios`
- Con RLS, índices, constraints y policies

### Checklist Paso 3

- [x] Migrar `actividades` al patrón offline-first
- [x] Migrar `salas_aprendizaje` como catálogo cacheado
- [x] Migrar `asignaturas` como catálogo cacheado
- [x] Migrar `periodos` como catálogo cacheado
- [x] Migration SQL creada y aplicada
- [x] Test: CRUD actividades (10 tests)
- [ ] Probar: crear actividad offline → aparece en selector de desempeño
- [ ] Probar: precargar salas desde Supabase → funcionan offline

---

## 5. Paso 4: Evaluaciones QR offline

*Sin cambios — cuando llegue a Fase 2 (QR)*

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
Paso 1: Sync engine + Store base      ✅ + tests (14)
Paso 2: Desempeño offline              ✅ service + tests (9)
     └── Falta: integración UI + badge por registro
Paso 3: Actividades + catálogos        ✅ services + tests (10) + SQL
     └── Falta: integración UI + precache automático
Paso 4: Evaluaciones QR                ⏳ Q4 2026
Paso 5: Módulos existentes             ⏳ Q1 2027
```

### Reglas de oro

1. **IndexedDB primero, siempre.** Toda escritura va a IndexedDB antes que a Supabase.
2. **Cola FIFO.** Las operaciones se ejecutan en orden. Si una falla, se reintenta.
3. **\_synced flag.** Todo registro en IndexedDB tiene `_synced: boolean`.
4. **Sin bloqueos.** El usuario nunca espera a que sincronice.
5. **Indicador visible.** El monitor siempre sabe si está online/offline y cuántas operaciones están pendientes.

### Resolución de conflictos

| Escenario | Estrategia |
|-----------|------------|
| Dos monitores editan mismo registro offline | **Last-write-wins** |
| Registro eliminado en Supabase pero modificado offline | **Abortar**, notificar al monitor |
| Sync falla por validación en Supabase | **Reintentar** 3 veces, luego marcar error |

---

## 8. Próximas decisiones pendientes (antes de escribir UI)

1. ¿El registro de desempeño debe tener captura de datos offline desde el inicio? → **Sí, offline-first**
2. ¿El monitor registra uno por uno o necesita una vista tipo planilla?
3. ¿El blog necesita comentarios o solo es lectura?
4. ¿Quién escribe: usuario revisa borrador de IA o publica directo?
5. ¿Tema visual: mantener light (consistente con app actual) o migrar a dark (como prototipo)?
6. ¿Fechas push: Q3 2026 para Push 1 (desempeño)?

---

*Documento actualizado el 24 Jun 2026.*
*Próxima acción: responder preguntas pendientes antes de escribir UI.*
