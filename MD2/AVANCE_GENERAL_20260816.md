# Avance General — 2026-08-16

## Resumen de cambios

### Matrícula de Continuidad — Flujo completo (`src/pages/Matricula.tsx`)

Reestructuración del modo continuación para que sea un flujo breve de renovación:

**Orden de pasos en Continuidad (7 pasos):**
1. **Consulta de RUT** — paso inicial propio: se ingresa el RUT, se busca en tabla `estudiantes` del establecimiento, se cargan datos + curso actual (ej. "1A"). Si no existe, aviso y permite llenado manual.
2. **Datos Personales** — incluye campo solo lectura "Curso Actual" junto al Nivel. El nivel se auto-sugiere como curso siguiente (1A→2°, 2A→3°, 3A→4°).
3. **Datos Familiares**
4. **Datos Sociales**
5. **Datos de Salud**
6. **Conectividad** (penúltima) — botón **Matricular** (valida todo el formulario, guarda como `tipo: 'continuidad'`, curso actual registrado).
7. **Consentimiento** (última) — con banner de confirmación, casillas Ley 21.719, imprimir PDFs, Guardar Consentimientos / Anular.

**Cambios en tipos y servicio:**
- `MatriculaDatos`: campo opcional `curso_actual?: string` (`src/types/index.ts:673`).
- `crearMatricula`: columna `curso` usa `datos.curso_actual` en continuidad, `nivelLabel` en nueva (`src/services/matricula.service.ts:57`).
- Funciones helper: `nivelDesdeCurso()` y `nivelContinuidadDesdeCurso()` (mapeo curso→nivel y curso→nivel siguiente).
- Consulta RUT: `consultarRutContinuidad()` busca en `estudiantes`, precarga nombres, curso_actual, nivel siguiente.
- `contenidoConsentimiento`: variable JSX extraída para reutilizar en nueva (post-guardado) y continuidad (paso 7).
- Progreso dinámico: `pasosVisibles` según modo, `seccionActiva` y `pasoDeSeccion()` para mapeo bidireccional.

**Verificación:** `npx tsc -b` + `npx vite build` + `npx vitest run` → 12 archivos / 108 tests OK. Solo error de lint pre-existente (focoVinculo effect).

### Análisis arquitectónico — Plataforma Institucional de Tablets

Documento de análisis y decidido el camino a seguir:

**Decisiones confirmadas:**
| Decisión | Valor |
|----------|-------|
| Stack | PWA (sin migrar a híbrida) |
| Wi-Fi | Inestable → offline crítico |
| Cámara | Frecuente (certificados, incidencias) |
| Tablets | 3-5 en el liceo |
| Módulo primero | Asistencia offline |
| Datos offline | Mínimos (RUT, nombre, curso, apoderado) |
| Sesión | 15 min inactividad → auto-cierre |
| Auth | Normal (Supabase actual) |
| Alcance offline | Por curso/paralelo (cada tablet descarga sus cursos) |
| Conflictos sync | Último en sync gana + registro en auditoría |
| Ver otras tablets | Sí, solo lectura (cache de todas las operaciones) |

**Plan de fases (19-26 días estimados):**
1. Base local cifrada (IndexedDB + Web Crypto AES-GCM)
2. Cola de operaciones offline
3. Asistencia offline (registro atrasos/inasistencias)
4. Sync manager (retry, reconciliación, conflictos)
5. Cámara institucional (captura → cifrado → upload)
6. Tokens/QR firmados (ingreso sin Internet)
7. Sesión expirable + identidad dispositivo

**Archivos creados hoy:**
- `MD2/ANALISIS_PLATAFORMA_TABLETS_20260816.md` — análisis completo de la arquitectura propuesta.
- `MD2/ESTADO_ACTUAL_vs_TABLETS_20260816.md` — comparativa estado actual vs propuesto + prioridades para decidir.

---

## Archivos modificados

| Archivo | Cambios |
|---------|---------|
| `src/pages/Matricula.tsx` | Flujo continuación: 7 pasos, consulta RUT, curso_actual, contenidoConsentimiento extraído, progreso dinámico |
| `src/types/index.ts` | `curso_actual?: string` en `MatriculaDatos` |
| `src/services/matricula.service.ts` | `curso` usa `curso_actual` en continuidad |

## Pendiente
- Migración `044_matriculas_tipo_y_retiros.sql` sin aplicar en Supabase.
- Fase 1 del plan de tablets (base local cifrada) — pendiente de inicio.
