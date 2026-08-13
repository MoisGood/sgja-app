# opencode session — C:\Proyectos\BackUp

## Objective
- DONE: Ordenar pases/solicitudes por llegada (`creado_en`) en Gestión Pases y vista móvil.
- DONE: Nuevo **Dashboard PARADOCENTE**: saludo, descripción breve del perfil y contadores de inasistencias por jornada/día con filtro de calendario.

## Important Details
- URL producción Vercel canónica: `https://sgja-app-blue.vercel.app` (regenerada en cada deploy).
- `npm test`: 12 archivos, 108/108 OK. Typecheck `npx tsc --noEmit` limpio. Verificado tras cada cambio.
- Tabla `solicitudes`: timestamp de registro es **`creado_en`** (NO `created_at`) — `SQL_md\SQL_SUPABASE_CREAR_TABLAS.sql:107`. `Solicitud` en `types/index.ts` ya tiene `creado_en?: string`.
- `renderRoleDashboard` en `AppContent.tsx` tenía `PARADOCENTE` cayendo al `default` (mostraba DashboardSecretaria). Ahora hay `case 'PARADOCENTE'` con el dashboard nuevo.
- `escucharSolicitudes` / `obtenerSolicitudesDelEstablecimiento` vienen de `services/database.ts` (re-export del `solicitudes.service`, ordena `creado_en DESC`).
- Fecha local para el filtro: helper `hoyLocal()` (YYYY-MM-DD local, coherente con `input type=date` y `solicitudes.fecha`).
- Estilos: reutiliza `styles/dashboard.css` (.dashboard-container, .dashboard-stats, .stat-card, .stat-number, .stat-label) + animación fadeInUp inline (patrón de DashboardAdmin).
- Mass replacement de spinners ⏳ ABORTADO dos veces: ~45 archivos aún muestran emoji ⏳.

## Work State
### Completed
- **DASHBOARD MÓVIL PARADOCENTE** (nuevo):
  - `src/pages/DashboardParadocenteMovil.tsx` (nuevo): saludo + descripción breve, filtro calendario compacto (input date + botón "Hoy"), grid 2 columnas de contadores (Inasistencias/Atrasos/Justificadas/No justificadas/Pendientes), accesos rápidos 3 columnas (Formulario de Accidente, Gestión de Pases, Ver Pases), lista de inasistencias del día con chips de estado (máx 6 + "Ver todas"). Usa `useTheme`, fetch `obtenerSolicitudesDelEstablecimiento` + realtime `escucharSolicitudes`.
  - `AppContent.tsx`: ruta `/inspectoria/m/inicio` → `DashboardParadocenteMovil` si `rol === 'PARADOCENTE'`, si no `InspectoriaMobileInicio` genérico. En `renderRoleDashboard` el `case 'PARADOCENTE'` ahora redirige a `/inspectoria/m/inicio` cuando `window.innerWidth < 768` (antes mostraba el dashboard desktop dentro del layout móvil).
  - Bottom nav "Inicio" de PARADOCENTE ya apuntaba a `/inspectoria/m/inicio` → ahora muestra el dashboard móvil.
- **ACCESO MÓVIL PARADOCENTE** (turno anterior): drawer `SharedMobileLayout.tsx` con "Formulario de Accidente" + "Ver Pases"; `InspectoriaMobileInicio.tsx` con accesos rápidos por rol.
- **Formulario Accidente**: eliminado acceso 🎯 a coordenadas del PDF en `RegistrarAccidente.tsx` (JSX + `handleDebugCoords` + import `generarPDFDebug`).
- **DASHBOARD PARADOCENTE desktop** (`DashboardParadocente.tsx` reescrito): hero saludo + descripción, filtro calendario, 5 contadores, lista del día, "⚡ Accesos Rápidos". Stats grid `minmax(140px,1fr)` (compacto).
- **WIRING** `AppContent.tsx`: `case 'PARADOCENTE'` (antes caía al default → DashboardSecretaria).
- **BUG ORDEN DE PASES RESUELTO**: `solicitudes.service.ts` (+ realtime) y `supabaseDB.ts` ordenan `creado_en DESC`; `GestionPases.tsx` 6x `created_at`→`creado_en`; `RegistrarJustificacion.tsx` sorts por `creado_en DESC`.
- **Ayuda PROFESOR**, **Catálogo biblioteca para PROFESOR**, **Sistema de spinners**, **Bug Asignar Accesos** (`expandirRutasHijas` eliminada): trabajo previo completado.
- Deploys Vercel exitosos tras cada cambio.

### Active
- (none)

### Blocked
- (none)

## Next Move
1. (Opcional) Verificar en producción el dashboard móvil PARADOCENTE (saludo, contadores, calendario, accesos rápidos) y que al abrir `/` en móvil redirija a `/inspectoria/m/inicio`.
2. (Pendiente conocido) Mass replacement de emoji ⏳ por el componente `Spinner` en ~45 archivos (abortado 2 veces).

## Relevant Files
- `C:\Proyectos\BackUp\src\pages\DashboardParadocenteMovil.tsx`: NUEVO dashboard móvil.
- `C:\Proyectos\BackUp\src\AppContent.tsx`: ruta `/inspectoria/m/inicio` condicional por rol + redirect móvil PARADOCENTE en renderRoleDashboard.
- `C:\Proyectos\BackUp\src\pages\DashboardParadocente.tsx`: dashboard desktop (saludo/descripción/calendario/contadores/accesos).
- `C:\Proyectos\BackUp\src\pages\RegistrarAccidente.tsx`: acceso 🎯 a coordenadas del PDF eliminado.
- `C:\Proyectos\BackUp\src\components\SharedMobileLayout.tsx`: DRAWER_ITEMS con Formulario de Accidente + Ver Pases.
- `C:\Proyectos\BackUp\src\pages\InspectoriaMobileInicio.tsx`: Inicio móvil genérico (roles no-PARADOCENTE).
- `C:\Proyectos\BackUp\src\components\Layout.tsx:270-304`: dispatch de layouts móviles.
- `C:\Proyectos\BackUp\src\styles\dashboard.css`: clases reutilizadas.
- `C:\Proyectos\BackUp\src\pages\GestionPases.tsx` / `solicitudes.service.ts` / `supabaseDB.ts` / `RegistrarJustificacion.tsx` / `types\index.ts`: fix de orden `creado_en`.
- `C:\Proyectos\BackUp\src\services\__tests__\solicitudes.service.test.ts`: tests 108/108 OK.


