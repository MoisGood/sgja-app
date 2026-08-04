# Decisiones — Crear Pase (2026-08-03)

Análisis y decisiones acordadas para el flujo **Crear Pase** (`src/pages/GestionPases.tsx`).
Respuestas del usuario a los hallazgos a-l y plan de cambios.

## a. Quién justifica (capa de negocio)
- **Solo inspectoría o paradocente justifica. El profesor JAMÁS justifica.**
- El profesor puede **anular** su pase (exigencia de que el estudiante pase a inspectoría, o por criterio propio).
- A futuro: mejorar según capa de negocio y marcha blanca.

## b. Card móvil — etiqueta de texto
- Mantener el estado visual por color, pero agregar **micro-etiqueta de texto** sobre el número
  ("atraso" / "inasistencia") cuando el card cambia de color. Accesibilidad: no depender solo del color.

## c. Selección de bloques en el modal
- Máximo **2 bloques consecutivos** (ej: 1 y 2, 2 y 3), **siempre uno por adelantado**; hacia atrás no interesa.
- Al final del modal, una casilla **"todos"**: el estudiante faltó a todos los bloques (no asistió al establecimiento).

## d. Falla parcial sin rollback — solución
- **Opción 2 confirmada**: validar ya-registrados **por cada bloque destino** dentro del submit y
  proteger contra reintento (trackear creados y bloquearlos ante error) para no duplicar.

## e. Solo "Registrar Ausentes" crea pases
- Ni seleccionar ni deseleccionar crean pases; solo el botón **"Registrar Ausentes"**.
- **Bloques ya registrados/justificados**: en el modal quedan **marcados y deshabilitados** (sin opción a
  modificar/desbloquear) para que el estudiante nunca quede sin registro.
- Fix al bug: `getBloquesACrear` con 0 seleccionados NO debe crear pase.

## f. Card bloqueado — color según bloque seleccionado
- El color del card 🔒 debe corresponder al pase del **bloque seleccionado** (no a la primera solicitud de la fecha).

## g. Anular por solicitud
- La hora/bloque visible identifica el pase a anular. Se anula por `id_solicitud`. Suficiente.

## h. Validación de fecha
- A futuro: configuración de fechas/días hábiles/feriados **idéntica a Biblioteca (tab fechas)**. No se valida duramente hoy.

## i. Hora↔bloque
- Sin hora sin bloque: la hora siempre se deriva del bloque (`hora_inicio`). El caso jornada completa lo cubre "todos" (c).

## j. Registro de bloque del profesor — código muerto
- `guardarRegistroBloqueProfesor` es lógica antigua sin consumidores: inserta filas en
  `registros_bloque_profesor` al cambiar de bloque/hora y **nadie las lee**.
- **Fix**: eliminar la llamada en `handleSeleccionarBloque`, el servicio y su re-export.

## k. Estado inicial del pase
- Al inicio del bloque todos se registran como **INASISTENTE** ("Sin procesar").
- Luego inspectoría/paradocente cambia el estado (justificar / no justificar).
- Mapear `INASISTENTE` → **"Sin procesar"** en historial (badge, color y filtro).

## l. Roles
- **Solo PROFESOR y ADMIN** pueden crear/anular. Fix: guard en `handleSubmit` + ocultar botones de crear para otros roles.

## Plan de código
1. Quitar toggle "◉ Justificado" del card (estado/cardsJustificado/leyenda).
2. Todos los pases se crean con `estado = INASISTENTE`; `motivo_descripcion` según tipo (Atraso/Ausente).
3. Mapear `INASISTENTE` → "Sin procesar" en etiqueta, color, opciones de filtro y badges.
4. Eliminar `guardarRegistroBloqueProfesor` (call + servicio + re-export).
5. Modal multi-bloque: solo bloque actual (obligatorio) + uno adelante; bloques ya registrados checked+disabled; casilla "todos".
6. Submit: mapa de ya-registrados por (estudiante × bloque); skip de duplicados; bloqueo de creados ante error.
7. Color card 🔒 por `id_bloque === bloqueSeleccionado`.
8. Micro-etiqueta de texto en cards marcadas.
9. Guard de rol PROFESOR/ADMIN en crear.
