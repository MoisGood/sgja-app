# Avance General — 2026-08-03

## Resumen de cambios

### Header y menú móvil (establecimiento)
- `SharedMobileLayout` / `Layout`: cabecera del drawer con **logo + nombre del establecimiento**.
- Título header "Intranet Liceo de Niñas" y **salto de línea** en el nombre del menú (`Liceo de Niñas<br/>de Concepción`).
- Logo registrado en BD (`establecimientos.logo_url`) vía storage bucket `logos`.
- Commits: `7f43f20`, `561b36f` (pusheados + deploy).

### Bloques horarios — fixes y columna `tipo`
- **Fix crear/actualizar/eliminar bloque horario** (`91ad433`): el update/delete usaba columnas inexistentes (`actualizado_en`) y filtro incorrecto; ahora filtra por `id_bloque` y el payload usa solo columnas reales.
- **Fix "no actualiza, tampoco error"** (`22797fc`): causa = caché IndexedDB (TTL 60 min); se agregó `invalidarCacheBloques()` que borra las claves `bloques_*` tras cada mutación.
- **Columna `tipo`** en `bloques_horarios` (`037_add_tipo_bloques_horarios.sql`): `BLOQUE_*` = clase, `RECRE` = recreo, `ALMUERZO` = almuerzo. Conectada en `bloques-horario.service.ts` (create/update). SQL aplicado manualmente en el SQL Editor (verificado UPDATE OK).

### Crear Pase móvil — UX (`src/pages/GestionPases.tsx`)
- **Pasos tipo acordeón (móvil):**
  - Paso 1 colapsado mostrando resumen "📚 Paso 1: *Curso* · *Bloque* (hora)"; tocar el encabezado lo expande/colapsa.
  - Paso 2 con botón **"✓ Registrar ausentes" arriba de los cards** (en móvil); el botón inferior queda solo escritorio.
  - **📝 Detalles del Pase** colapsado por defecto; clic en el título lo expande.
- **Toggle Atraso/Inasistencia (móvil):** botón al lado de "Registrar ausentes"; amarillo = Atraso (default), rojo = Inasistencia. Ancho fijo (no cambia de tamaño). El **primer clic** en un card aplica el estado del toggle; los clics siguientes siguen el ciclo 🟢→🟡→🔴→🟢.
- **Gesto mantener presionado (~450ms):** marca el card (según toggle) y muestra el botón **"+ Bloques"** (antes "agregar más bloques"). El clic posterior al long-press no cicla el color. Doble clic queda solo en escritorio. El botón "+ Bloques" desaparece si el card vuelve a verde.
- `touch-action: manipulation` y `user-select: none` en cards móviles (evita zoom/selección).
- Textos de ayuda actualizados según plataforma.

### Historial móvil ("Ver Pases")
- La tabla fija (~760px) se reemplazó en móvil por **tarjetas apiladas**: nombre + rut/curso, badge de estado con color (Anulado/Justificado/Injustificado/Rechazado), badge de tipo (atraso/inasistencia), fecha · hora y botón "✕ Anular".
- **Barra de filtros compacta** arriba (Curso, Tipo, Fecha, Estado) reutilizando `filtros`/`obtenerOpciones`.
- Escritorio conserva la tabla con filtros desplegables.

### Select de bloque — bloques con registro
- `bloquesConRegistros`: calcula qué bloques tienen al menos un pase **activo** (no anulado) de atraso/inasistencia de cualquier estudiante del curso en la fecha seleccionada.
- En el select de Bloque, esos bloques aparecen **"🔒 Ya registrado" y deshabilitados** (no se pueden volver a seleccionar). Recalcula al cambiar curso/fecha/solicitudes.

### Documentación
- Creado `README.md` en la raíz: documentación general completa del proyecto.
- `docs/CHAT_ADMIN_IA_DISENO.md`: diseño del chat IA para admin (patrón catálogo de plantillas SQL, sin SQL libre, solo ADMIN, confirmación 2 pasos, auditoría) — sin commit (pendiente).

## Archivos relevantes
| Archivo | Propósito |
|---------|-----------|
| `README.md` | Documentación general del proyecto |
| `src/pages/GestionPases.tsx` | Crear pase + historial (acordeón, toggle, long-press, tarjetas móviles) |
| `src/services/bloques-horario.service.ts` | Bloques horarios con `tipo` e invalidación de caché |
| `supabase/migrations/037_add_tipo_bloques_horarios.sql` | Columna `tipo` en `bloques_horarios` |
| `src/components/SharedMobileLayout.tsx`, `Layout.tsx` | Header/drawer móvil con logo y nombre |
| `src/components/InspectoriaMobileLayout.tsx`, `SecretariaMobileLayout.tsx`, `BibliotecaMobileLayout.tsx` | Layouts por rol con `establecimientoLogo` |
| `docs/CHAT_ADMIN_IA_DISENO.md` | Diseño chat IA admin (sin commit) |

## Estado git
- Commits locales sin push: `91ad433`, `22797fc`.
- Sin commit: cambios de `GestionPases.tsx`, `bloques-horario.service.ts`, migración `037`, `README.md`, `docs/CHAT_ADMIN_IA_DISENO.md`.
- Último deploy: `561b36f` → https://sgja-app-blue.vercel.app

## Pendientes
- Commit + push + deploy de los cambios de esta sesión (aprobación del usuario).
- Aplicar migración 037 en otros establecimientos si corresponde (ya aplicada en el principal).
