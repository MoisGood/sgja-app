# SGJA — Sistema de Gestión de Justificaciones de Atrasos e Inasistencias

> Plataforma educativa para establecimientos chilenos: gestión de pases, justificaciones, atrasos, inasistencias, accidentes escolares, biblioteca y módulos administrativos (tickets, equipos, mapa). Offline-first, PWA.

---

## Índice

1. [Descripción General](#1-descripción-general)
2. [Estado Actual](#2-estado-actual)
3. [Stack Tecnológico](#3-stack-tecnológico)
4. [Arquitectura](#4-arquitectura)
5. [Módulos y Páginas](#5-módulos-y-páginas)
6. [Base de Datos (Supabase)](#6-base-de-datos-supabase)
7. [Autenticación y Roles](#7-autenticación-y-roles)
8. [PWA / Offline-first](#8-pwa--offline-first)
9. [Versión Móvil](#9-versión-móvil)
10. [Despliegue](#10-despliegue)
11. [Desarrollo Local](#11-desarrollo-local)
12. [Estructura del Proyecto](#12-estructura-del-proyecto)
13. [Documentación](#13-documentación)
14. [Trabajo Reciente (Resumen)](#14-trabajo-reciente-resumen)
15. [Convenciones y Notas](#15-convenciones-y-notas)

---

## 1. Descripción General

SGJA es una SPA React desplegada en Vercel con backend Supabase (PostgreSQL + Auth + Storage). Cubre:

- **Inspectoría / Académico:** registro de atrasos e inasistencias por bloque horario (crear pase + historial), justificaciones, secretaría de ausentes, solicitudes de registro.
- **Biblioteca:** catálogo, circulación, historial, configuración.
- **Accidentes escolares:** formulario de accidente (con generación de PDF y versiones generadas por editor visual).
- **Administrativo:** tickets/soporte, equipos y dispositivos con escáner de código de barras/DataMatrix, mapa de pisos, usuarios y roles, establecimientos, correos y plantillas, monitoreo, parámetros, festivos, reportes.

**Paradigma:** aprendizaje autodirigido con orquestación digital (el docente pasa a monitor). **Diferenciador:** offline-first — funciona sin internet mediante PWA + IndexedDB.

---

## 2. Estado Actual

| Área | Estado |
|------|--------|
| Módulos administrativos (tickets, equipos, mapa, usuarios, establecimientos) | ✅ Producción |
| Gestión de pases (crear/ver) con bloques horarios | ✅ Producción (mejoras móviles en curso) |
| Justificaciones y secretaría de ausentes | ✅ Producción |
| Biblioteca | ✅ Producción |
| Accidentes escolares | ✅ Producción |
| Módulo académico (salas de aprendizaje, evaluación QR, diagnóstico adaptativo) | 📋 Planificado (ver `MD2/INDEX.md` y `analisis/`) |
| Chat IA admin (diseño) | 📄 Documentado en `docs/CHAT_ADMIN_IA_DISENO.md` |

---

## 3. Stack Tecnológico

| Tecnología | Versión | Uso |
|------------|---------|-----|
| React | ^19.2.4 | UI |
| Vite | ^8.0.0 | Bundler / dev server |
| TypeScript | ~5.9.3 | Lenguaje |
| Tailwind CSS | ^4.2.2 | Estilos |
| Supabase | ^2.105.4 | Auth, DB, Storage, Edge Functions |
| React Router | ^7.13.1 | Enrutamiento |
| Framer Motion | ^12.40.0 | Animaciones |
| Vite PWA Plugin | ^1.3.0 | Service Worker / PWA |
| idb | ^8.0.3 | IndexedDB (offline/caché) |
| zxing-wasm | ^3.1.0 | QR / DataMatrix (wasm) |
| html5-qrcode | ^2.3.8 | QR vía cámara (fallback) |
| qrcode | ^1.5.4 | Generación de QR |
| sonner | ^2.0.7 | Toasts |
| swiper | ^12.2.0 | Sliders táctiles (mobile) |
| lucide-react | ^0.577.0 | Iconos |
| nodemailer | ^8.0.7 | Envío de correos (server) |
| Vitest | ^3.2.6 | Tests |

### Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | `tsc -b` + build Vite |
| `npm run lint` | ESLint |
| `npm run test` | Vitest |
| `npm run doctor` | React Doctor (calidad de componentes) |

---

## 4. Arquitectura

```
┌───────────────────────────────────────────────┐
│               Cliente (SPA + PWA)              │
│  Vite + React 19 + TS + TailwindCSS v4        │
│  Service Worker (Workbox) + IndexedDB (idb)   │
├───────────────────────────────────────────────┤
│                  Servicios                     │
│  @supabase/supabase-js (Auth + DB REST)       │
│  Caché: cacheService (TTL IndexedDB)          │
│  Offline: offlineStore + syncEngine           │
├───────────────────────────────────────────────┤
│                    Backend                     │
│  Supabase: PostgreSQL + Auth + Storage        │
│  (RLS policies = capa de autorización)        │
├───────────────────────────────────────────────┤
│                 Despliegue                     │
│  Vercel: https://sgja-app-blue.vercel.app     │
│  Supabase: https://iyxubvtfhcmlivivdfpt.supabase.co │
└───────────────────────────────────────────────┘
```

- SPA con enrutamiento por hash (`#/ruta`).
- Frontend consume Supabase REST directo; las **RLS policies** son la única autorización server-side.
- PWA con precache (Workbox `generateSW`), auto-update (`skipWaiting`/`clientsClaim`).

---

## 5. Módulos y Páginas

### Inspectoría / Pases
- `GestionPases.tsx` — Crear Pase (cards por estudiante, bloques horarios) y Ver Pases (historial con filtros y paginación).
- `Justificaciones.tsx`, `JustificacionesAtrasos.tsx`, `JustificacionesTabs.tsx` — justificaciones.
- `SecretariaAusentes.tsx` — módulo de ausentes para secretaría.
- `RegistrarJustificacion.tsx`, `SolicitudesRegistro.tsx`, `VerJustificaciones.tsx`.

### Administrativo
- `Ticket.tsx`, `Requerimientos.tsx`, `MobileTickets.tsx` — tickets/soporte.
- `Equipos.tsx`, `Inventario.tsx`, `MobileEquipos.tsx`, `MobileInventario.tsx` — dispositivos e inventario.
- `Lugares.tsx`, `Ubicaciones.tsx`, `MobileMapa.tsx`, `MobileGrid.tsx`, `MobileUbicaciones.tsx`, `Tecnico.tsx`, `ConfiguracionTecnico.tsx`, `MobileConfigTecnico.tsx`, `MenuTecnico.tsx` — mapa y técnico.
- `GestionUsuarios.tsx`, `GestionUsuariosPage.tsx`, `ConfigRoles.tsx`, `AsignarPermisos.tsx`, `MantenedorRolesPage.tsx` — usuarios y roles.
- `MantenedorEstablecimiento.tsx` — establecimientos (logo, configuración).
- `Correos.tsx`, `EnviarCorreo.tsx`, `PlantillasCorreo.tsx`, `MonitoreoCorreos.tsx`, `MonitoreoFallos.tsx` — correos y monitoreo.
- `Parametros.tsx`, `Festivos.tsx`, `Reportes.tsx`, `EnLinea.tsx`.

### Mantenedores
- `Mantenedores.tsx` (tabs), `MantenedorCursos.tsx`, `MantenedorEstudiantes.tsx` (import CSV), `MantenedorFuncionarios.tsx`, `MantenedorLibros.tsx`, `MantenedorMotivos.tsx`, `MantenedorSistema.tsx`, `BloqueHorario.tsx`.

### Biblioteca
- `Catalogo.tsx`, `Circulacion.tsx`, `HistorialBiblioteca.tsx`, `ConfigBiblioteca.tsx`.

### Accidentes
- `RegistrarAccidente.tsx`, `FormularioAccidenteGenerado.tsx`, `FormularioDatosPersonales.tsx`, `FormularioRegistroInicial.tsx`.

### Móvil
- `MobileDashboard.tsx`, `InspectoriaMobileInicio.tsx`, `InspectoriaMobilePerfil.tsx`, `HistorialMovil.tsx`, `MobileQrScanner.tsx`, `AccesosRapidos.tsx`.

### Varios
- `Login.tsx`, `QrRedirect.tsx`, `NotFound.tsx`, `AyudaPage.tsx`, `AdminAyuda.tsx`, `Seguridad.tsx`, `Configurar2FA.tsx`, `DashboardAdmin.tsx`, `DashboardEstudiante.tsx`, `DashboardApoderado.tsx`, `DashboardInspector.tsx`, `DashboardSecretaria.tsx`, `DashboardParadocente.tsx`, `MantenimientoConfig.tsx`.

---

## 6. Base de Datos (Supabase)

Proyecto: `iyxubvtfhcmlivivdfpt` · URL: `https://iyxubvtfhcmlivivdfpt.supabase.co`

Migraciones en `supabase/migrations/` (38 archivos, `002`–`037`). Tablas principales:

| Tabla | Propósito |
|-------|-----------|
| `lugares` | Mapa de pisos (desktop) |
| `dispositivos` / `equipos` | Equipos e inventario |
| `establecimientos` | Establecimientos + `logo_url` (bucket `logos`) |
| `usuarios_eliminados` | Soft-delete de usuarios |
| `config_sistema`, `parametros` | Configuración global |
| `dominios_externos`, `excepciones_externas` | Acceso de dominios externos |
| `plantillas_correo` | Plantillas de correo técnico |
| `estudiantes`, `cursos` | Estudiantes (con `numero`) y cursos |
| `bloques_horarios` | Bloques horarios por establecimiento (con `tipo` = clase/recreo/almuerzo) |
| `solicitudes` | Pases/solicitudes unificadas (atraso e inasistencia, con `id_bloque`) |
| `justificados` | Justificaciones de ausencias |
| `accidentes_escolares` | Formularios de accidente |
| `tablas_academicas`, `tablas_ayuda` | Módulo académico planificado y ayuda |
| `motivos_justificacion` | Motivos (schema corregido en 035) |

**RLS / RPCs:** policies en `012`, `013`, `018`, `030`; funciones `security definer` en `011`; fixes de aprobación en `021`, `032`, `034`. Storage buckets: `logos`, `evidencias`.

---

## 7. Autenticación y Roles

- Auth con Supabase (login Google/correo), sesiones y MFA opcional (`033_add_mfa_obligatorio.sql`).
- Roles personalizados vía metadatos de usuario + `roles.service.ts` / `usuarios.service.ts`.
- Roles detectados en la app: ADMIN, Inspectoría, Secretaría, Docente, Biblioteca, Paradocente, Estudiante, Apoderado, etc.
- Cada rol tiene su `MobileLayout`/dashboard: `InspectoriaMobileLayout`, `SecretariaMobileLayout`, `BibliotecaMobileLayout`, `SharedMobileLayout`.

---

## 8. PWA / Offline-first

- Service Worker con Workbox `generateSW`: precache de assets, `dist/sw.js`.
- Auto-update con `skipWaiting` + `clientsClaim`.
- `offlineStore.ts` + `syncEngine.ts`: sincronización diferida.
- `cacheService.ts`: caché en IndexedDB (idb) con TTL (60 min por defecto). Ej.: bloques horarios se cachean bajo claves `bloques_*` y se invalidan tras crear/actualizar/eliminar (`invalidarCacheBloques()`).
- Edge: si el service worker sirve assets stale post-redeploy → unregister + clear site data.

---

## 9. Versión Móvil

- Detectada por `window.innerWidth < 768` (`useState` + listener resize).
- Layouts móviles por rol (`*MobileLayout`), header con logo y nombre del establecimiento, drawer lateral.
- **Crear Pase móvil:** pasos tipo acordeón (Paso 1 curso/bloque colapsable; Paso 2 cards con botón "Registrar ausentes" arriba), toggle **Atraso (amarillo) / Inasistencia (rojo)** para el primer clic, gesto **mantener presionado** para marcar + "+ Bloques", cards con ciclo 🟢→🟡→🔴 y micro-etiqueta de texto (atraso/inasistencia) sobre el número.
- **Historial móvil:** tarjetas apiladas con filtros (curso/tipo/fecha/estado) en lugar de tabla de ancho fijo.
- El select de Bloque siempre muestra todos los horarios libres; el bloqueo por registro previo aplica solo a los cards de estudiantes (🔒).
- **Solo "Registrar Ausentes" crea pases** (seleccionar/deseleccionar no persiste). Los pases se crean con estado **"Sin procesar"** (`INASISTENTE`); inspectoría/paradocente justifica o no justifica después. El profesor solo anula.
- **Multi-bloque (modal):** máximo 2 bloques consecutivos hacia adelante (actual + uno) + casilla **"Todos"** (faltó a toda la jornada). Bloques ya registrados quedan marcados y deshabilitados.
- **Roles:** solo `PROFESOR` y `ADMIN` crean/anulan pases.

---

## 10. Despliegue

| Entorno | URL | Comando |
|---------|-----|---------|
| Producción (Vercel) | https://sgja-app-blue.vercel.app | `npm run build` + `vercel --prod --yes` |
| Backend | https://iyxubvtfhcmlivivdfpt.supabase.co | — |

Variables requeridas (`.env.local`, nunca en git):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_APP_URL` (local: `http://localhost:5173`)
- (server) `GMAIL_USER`, `GMAIL_APP_PASSWORD`

---

## 11. Desarrollo Local

```powershell
git clone https://github.com/MoisGood/sgja-app.git
cd sgja-app
npm install
# crear .env.local con las variables de la sección 10
npm run dev
```

- Node >= 18.
- Git no está en PATH en este equipo: usar `C:\Program Files\Git\bin\git.exe`.
- Migraciones SQL: aplicar manualmente en el SQL Editor de Supabase (no hay CLI token configurado).

---

## 12. Estructura del Proyecto

```
src/
├── components/          — Componentes compartidos (Layouts, MapaPiso, MobileGrid, SyncMapa...)
├── pages/               — Páginas por módulo (ver sección 5)
├── services/            — Capa de datos: supabase, caché, offline, sync, correo...
├── hooks/               — Hooks (useUsuarioLogueado, useCustomClaims...)
├── types/               — Tipos TypeScript (Solicitud, BloqueHorario, Estudiante...)
├── styles/              — Estilos globales
├── utils/               — Utilidades
public/
├── plano_edificio.json  — Mapa mobile (fuente de verdad estática)
supabase/
├── migrations/          — 38 migraciones SQL (002–037)
└── data/                — Seed data local
MD2/                     — Documentos de trabajo, editor visual, avances de sesión
docs/                    — Documentación técnica (SGJA_DOCUMENTACION, VISION, RLS...)
analisis/                — Análisis del módulo académico + plan de trabajo
MD_LEGACY/               — Documentación histórica/obsoleta
SQL_md/                  — Diagnósticos y scripts SQL
```

---

## 13. Documentación

| Documento | Contenido |
|-----------|-----------|
| `README.md` (este) | Documentación general y completa del proyecto |
| `MD2/INDEX.md` | Documento consolidado (visión, stack, roadmap académico, push dates) |
| `MD2/AVANCE_GENERAL.md`, `AVANCE_GENERAL_20260727.md`, `AVANCE_GENERAL_20260728.md`, `AVANCE_GENERAL_20260803.md` | Avances por sesión |
| `docs/SGJA_DOCUMENTACION.md` | Documentación técnica detallada (619 líneas) |
| `docs/CHAT_ADMIN_IA_DISENO.md` | Diseño del chat IA para admin (catálogo de plantillas SQL, sin SQL libre) |
| `docs/SOLUCION_RLS_DEFINITIVA.md` | RLS policies definitivas |
| `docs/AVANCES_SESION.md` | Bitácora de sesiones |
| `MD2/MOVIL_INSPECTORIA.md` | Versión móvil inspectoría |
| `analisis/README.md`, `analisis/plan-trabajo.md` | Módulo académico |

---

## 14. Trabajo Reciente (Resumen)

Últimas iteraciones (commits recientes):

- **Header/drawer móvil:** logo + nombre del establecimiento, título "Intranet {establecimiento}", salto de línea en el nombre, rol del usuario a la derecha.
- **Bloques horarios:** fix de crear/actualizar/eliminar con columnas reales y filtro `id_bloque`; invalidación de caché `bloques_*`; columna `tipo` (`037_add_tipo_bloques_horarios.sql`).
- **Crear Pase móvil:** acordeón de pasos, toggle Atraso/Inasistencia, long-press para "+ Bloques", historial en tarjetas con filtros, bloques con registro deshabilitados.
- Detalle completo por sesión en `MD2/AVANCE_GENERAL_20260803.md` y anteriores.

---

## 15. Convenciones y Notas

- **No commitar** `.env`/`.env.local` ni claves (service role key se comparte por canal seguro).
- Los avances de sesión se registran en `MD2/`; la documentación general vive en la raíz y `docs/`.
- Validar siempre `npm run build` antes de desplegar.
- El PWA puede servir assets viejos tras un redeploy: limpiar datos del sitio en el navegador de prueba.

---

*Última actualización: 03 Ago 2026.*
