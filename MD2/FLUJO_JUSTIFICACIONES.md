# Análisis de Flujo — Módulo de Justificaciones

## Estado actual (código existente)

### Roles involucrados (hoy)

| Rol | Acceso |
|-----|--------|
| ADMIN | Todo: registrar, ver, gestionar pases, justificar atrasos, ausencias funcionarios, mantenedor motivos |
| INSPECTOR | Registrar justificaciones, ver justificaciones, gestión de pases, justificaciones de atrasos |
| PROFESOR | Registrar justificaciones (vista limitada), gestión de pases (solo sus propios pases) |
| ESTUDIANTE | Sin páginas propias de justificación |
| APODERADO | Sin páginas propias de justificación |

### Páginas existentes (se mantienen las 3 + 1)

| Ruta | Componente | Roles | Propósito real |
|------|-----------|-------|----------------|
| `/registrar` | `RegistrarJustificacion.tsx` | ADMIN, INSPECTOR, PROFESOR | Justificación general: tabla con filtros (estado, RUT, curso, fecha), modal con selección de motivo. Escucha injustificadas + justificadas en tiempo real. Acción: `justificarSolicitud()` → INSERT en justificadas + DELETE de injustificadas. |
| `/ver-justificaciones` | `VerJustificaciones.tsx` | ADMIN, INSPECTOR | Visualización de solicitudes justificadas e injustificadas con pestañas separadas, filtros por RUT, curso, fecha. También permite justificar desde modal. Escucha tiempo real. |
| `/justificaciones` | `JustificacionesAtrasos.tsx` | ADMIN, INSPECTOR | Especializada en atrasos e inasistencias pendientes. Filtro por tipo (todos/atrasos/inasistencias). Modal con motivo + observaciones + respaldo. Solo escucha `injustificadas`. Acción: `actualizarSolicitud()` → UPDATE en `injustificadas`, NO mueve a `justificadas`. |
| `/gestion-pases` | `GestionPases.tsx` | ADMIN, INSPECTOR, PROFESOR | Creación de pases (profesor selecciona curso → estudiante → tipo → fecha/hora). Visualización y anulación de pases propios. Acción: `crearSolicitud()` → INSERT en tabla según estado. |

### Problemas identificados en el código actual

1. **Modelo híbrido**: `justificadas` e `injustificadas` como tablas separadas, más `solicitudes` (tabla unificada) definida en SQL pero no usada en TypeScript. Tres fuentes de verdad.
2. **Inconsistencia**: `justificarSolicitud()` hace INSERT en `justificadas` + DELETE de `injustificadas`, pero `actualizarSolicitud()` solo hace UPDATE en `injustificadas` (cambiando estado a JUSTIFICADA, pero el registro nunca sale de `injustificadas`). Así, una solicitud puede existir en ambas tablas con estado inconsistente.
3. **Sin rol PARADOCENTE**: el código solo maneja INSPECTOR. No existe PARADOCENTE como rol separado.
4. **Sin vista ESTUDIANTE**: el estudiante no puede ver sus propias justificaciones.
5. **Sin versión móvil**: GestionPases.tsx es desktop, no hay interfaz adaptada para celular.
6. **Emojis en UI**: varias páginas usan emojis (⏳, 📋, ✅, ✕, ➕) en lugar de iconos Lucide.

---

## Flujo lógico deseado (respuestas del usuario)

### 1. Profesor — Versión móvil — Solo crear pase de atraso

```
Profesor (móvil)
  │
  ├── 1. Abre app → menú → "Nuevo Pase"
  │
  ├── 2. Selecciona curso (selector)
  │
  ├── 3. Selecciona estudiante (lista del curso)
  │
  ├── 4. Define tipo: ATRASO o INASISTENCIA
  │
  ├── 5. Define fecha + hora
  │
  └── 6. Crea pase → INSERT en `solicitudes`
              estado = INJUSTIFICADA
              id_profesor = usuario actual
```

- El profesor **no justifica**, solo registra el evento.
- No hay móvil para inspector/paradocente aún (se asume desktop para ellos).
- La interfaz debe ser touch-friendly, simplificada, paso a paso.

### 2. Paradocente (rol nuevo) — Justificación diaria

```
Paradocente (desktop)
  │
  ├── 1. Ve lista de solicitudes INJUSTIFICADAS
  │     (desde RegistrarJustificacion o JustificacionesAtrasos)
  │
  ├── 2. Filtra por curso / fecha / tipo
  │
  ├── 3. Selecciona una solicitud
  │
  ├── 4. Elige motivo del catálogo (motivos_justificacion)
  │     - Opcional: documento/certificado
  │     - Opcional: observaciones
  │
  ├── 5. Justifica → UPDATE `solicitudes`
  │             estado = JUSTIFICADA
  │             id_inspector_justificador = paradocente
  │             hora_justificacion = ahora
  │             motivo_codigo, motivo_descripcion
  │
  └── (Opcional) Rechaza → UPDATE `solicitudes`
                    estado = RECHAZADA
```

- El paradocente es quien ejecuta la justificación en el día a día.
- Tiene los mismos permisos que INSPECTOR sobre solicitudes, pero es un rol distinto.

### 3. Inspector — Supervisión

```
Inspector (desktop)
  │
  ├── MISMAS capacidades que paradocente (justificar/rechazar)
  │
  ├── ADEMÁS: puede ver TODO el historial
  │     (justificadas + injustificadas + rechazadas)
  │
  └── ADEMÁS: acceso a dashboard de inspector
      (DashboardInspector.tsx — ya existe)
```

### 4. Estudiante — Solo lectura

```
Estudiante (web)
  │
  └── Ve sus propias solicitudes (justificadas e injustificadas)
      - Solo lectura
      - Filtro por fecha / tipo
      - NO puede crear ni editar
```

### 5. Modelo de datos — Unificado

**Migración**: crear nueva tabla unificada `solicitudes_v2` o migrar la existente `solicitudes` (que ya está definida en SQL pero no usada).

```
solicitudes
├── id_solicitud          UUID (PK)
├── id_establecimiento    UUID (FK → establecimientos)
├── id_estudiante         UUID (FK → estudiantes)
├── id_profesor           UUID (FK → usuarios) — quien creó el pase
├── tipo                  ENUM('ATRASO','INASISTENCIA')
├── fecha                 DATE
├── hora                  TIME
├── estado                ENUM('INJUSTIFICADA','JUSTIFICADA','RECHAZADA','NO_PRESENTADA')
├── motivo_codigo         VARCHAR(10) nullable
├── motivo_descripcion    TEXT nullable
├── observaciones         TEXT nullable
├── respaldo_recibido     BOOLEAN default false
├── tipo_respaldo         VARCHAR(50) nullable
├── id_token_qr           UUID nullable
├── id_inspector_justificador UUID nullable — paradocente/inspector que justificó
├── hora_justificacion    TIME nullable
├── curso                 VARCHAR(50) nullable
├── id_bloque             UUID nullable
├── bloques_afectados     INT default 1
├── creado_en             TIMESTAMPTZ default now()
└── actualizado_en        TIMESTAMPTZ default now()
```

Ventajas:
- Una sola tabla, una sola fuente de verdad
- `justificarSolicitud()` ya no hace INSERT+DELETE, solo UPDATE estado
- RLS simple: `id_establecimiento = auth.jwt() -> id_establecimiento`
- Las consultas con WHERE estado = 'INJUSTIFICADA' son triviales

### Migración de datos

```sql
-- 1. Crear tabla solicitudes si no existe (con campos completos)
-- 2. Migrar datos de injustificadas → solicitudes con estado INJUSTIFICADA
-- 3. Migrar datos de justificadas → solicitudes con estado JUSTIFICADA/RECHAZADA
-- 4. Agregar RLS policies
-- 5. (Opcional) Renombrar tablas viejas o eliminarlas
```

---

## Páginas y responsabilidades por rol (POST migración)

| Página | ADMIN | INSPECTOR | PARADOCENTE | PROFESOR | ESTUDIANTE |
|--------|-------|-----------|-------------|----------|------------|
| `/registrar` (justificar) | ✅ | ✅ | ✅ | ❌ | ❌ |
| `/ver-justificaciones` (ver todo) | ✅ | ✅ | ✅ | ❌ | ❌ |
| `/justificaciones` (atrasos) | ✅ | ✅ | ✅ | ❌ | ❌ |
| `/gestion-pases` (crear pase) | ✅ | ✅ | ❌ | ✅ (desktop) | ❌ |
| `/gestion-pases/movil` (crear pase móvil) | ❌ | ❌ | ❌ | ✅ (móvil) | ❌ |
| `/mis-justificaciones` (estudiante) | ❌ | ❌ | ❌ | ❌ | ✅ |

**Cambios vs hoy:**
- PROFESOR pierde acceso a `/registrar` (solo crea pases, no justifica)
- PROFESOR mantiene `/gestion-pases` (desktop) + versión móvil simplificada
- PARADOCENTE (nuevo) tiene acceso a las 3 páginas de justificación como INSPECTOR
- ESTUDIANTE gana `/mis-justificaciones` (solo lectura)

---

## Dependencias y cambios necesarios

### 1. TypeScript — Agregar PARADOCENTE

```ts
export enum Rol {
  ADMIN      = 'ADMIN',
  INSPECTOR  = 'INSPECTOR',
  PARADOCENTE = 'PARADOCENTE',
  PROFESOR   = 'PROFESOR',
  ESTUDIANTE = 'ESTUDIANTE',
  APODERADO  = 'APODERADO',
}
```

### 2. SQL — Migración

- Migración 031: agregar tabla `solicitudes` unificada + migrar datos
- Migración 032: RLS policies para `solicitudes` incluyendo PARADOCENTE
- (Opcional) Migración 033: eliminar/archivar tablas `justificadas` e `injustificadas`

### 3. Servicios — Refactor

- `solicitudes.service.ts`: refactor para usar solo `solicitudes` (eliminar `justificarSolicitud` con INSERT+DELETE, reemplazar con UPDATE)
- `realtime.service.ts`: actualizar canales a `solicitudes`
- `database.ts`: barrel exports actualizados

### 4. Componentes — Nuevos / Modificados

- `GestionPases.tsx`: versión desktop (simplificar, sacar lógica de justificación)
- `GestionPasesMobile.tsx`: **nuevo** — versión touch para profesor en celular (solo crear pase)
- Página `MisJustificaciones.tsx`: **nuevo** — vista estudiante (solo lectura)
- `RegistrarJustificacion.tsx`: refactor para usar `solicitudes` (no `justificadas`/`injustificadas`)
- `VerJustificaciones.tsx`: refactor similar
- `JustificacionesAtrasos.tsx`: refactor similar
- `Layout.tsx`: agregar PARADOCENTE a menús, agregar ruta `/mis-justificaciones`, eliminar PROFESOR de `/registrar`

### 5. RLS Policies

```sql
-- PROFESOR: solo INSERT en solicitudes (crear pase), SELECT propias
-- PARADOCENTE: SELECT + UPDATE sobre solicitudes del establecimiento (justificar)
-- INSPECTOR: igual que PARADOCENTE + acceso a dashboard
-- ESTUDIANTE: solo SELECT sobre solicitudes donde id_estudiante = auth.uid()
```

---

## Pendiente de definir (preguntas abiertas)

1. ¿El profesor en móvil necesita ver su historial de pases además de crear?
2. El dashboard del inspector (`DashboardInspector.tsx`) — ¿el paradocente también tiene dashboard propio o solo inspector?
3. ¿El estudiante ve las justificaciones dentro de la app existente (sidebar) o es una página externa/embebida?
4. ¿Paradocente e Inspector comparten sidebar "Justificaciones" o tienen menús separados?
5. Migración de datos: ¿se migran los datos existentes de `justificadas`/`injustificadas` a la nueva tabla o se empieza desde cero?
6. ¿La tabla `motivos_justificacion` se mantiene igual o necesita cambios?
