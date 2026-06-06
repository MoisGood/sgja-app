# SGJA — Sistema de Gestión de Justificaciones de Atrasos e Inasistencias

## Índice

1. [Arquitectura](#1-arquitectura)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Estructura del Proyecto](#3-estructura-del-proyecto)
4. [Autenticación y Roles](#4-autenticación-y-roles)
5. [Enrutamiento](#5-enrutamiento)
6. [Supabase — Base de Datos](#6-supabase--base-de-datos)
7. [Supabase — RLS Policies](#7-supabase--rls-policies)
8. [Supabase — RPCs y Triggers](#8-supabase--rpcs-y-triggers)
9. [Páginas](#9-páginas)
10. [Componentes Compartidos](#10-componentes-compartidos)
11. [Servicios](#11-servicios)
12. [Hooks](#12-hooks)
13. [Repositorios](#13-repositorios)
14. [Estilos](#14-estilos)
15. [PWA](#15-pwa)
16. [Despliegue](#16-despliegue)
17. [Pendientes y Bugs Conocidos](#17-pendientes-y-bugs-conocidos)

---

## 1. Arquitectura

```
┌─────────────────────────────────────────────────┐
│                   Cliente (SPA)                  │
│  Vite + React 19 + TypeScript + TailwindCSS v4  │
│  PWA (Service Worker con Workbox)               │
├─────────────────────────────────────────────────┤
│                    Servicios                     │
│  Supabase Client (Auth + DB REST)               │
│  Nodemailer (correos)                           │
├─────────────────────────────────────────────────┤
│                   Backend                        │
│  Supabase (PostgreSQL + Auth + Storage)          │
│  Servidor Express (email, localhost:3001)       │
├─────────────────────────────────────────────────┤
│                 Despliegue                       │
│  Vercel (frontend principal)                    │
│  Cloudflare Pages (alternativo)                 │
│  Supabase (base de datos + auth)                │
└─────────────────────────────────────────────────┘
```

- **SPA** con routing del lado del cliente usando hash (`#/ruta`).
- Consumo directo de Supabase REST API desde el frontend.
- Las RLS policies de Supabase son la única capa de autorización del lado del servidor.
- Modo offline limitado vía service worker (PWA).

---

## 2. Stack Tecnológico

### Dependencias de Producción

| Librería | Versión | Propósito |
|---|---|---|
| `react` | ^19.2.4 | UI |
| `react-dom` | ^19.2.4 | Renderizado DOM |
| `react-router-dom` | ^7.13.1 | Routing (no usado directamente, routing manual con hash) |
| `@supabase/supabase-js` | ^2.105.4 | Cliente Supabase (Auth + DB) |
| `lucide-react` | ^0.577.0 | Iconos SVG |
| `framer-motion` | ^12.40.0 | Animaciones |
| `html5-qrcode` | ^2.3.8 | Escáner QR |
| `qrcode` | ^1.5.4 | Generación de QR |
| `idb` | ^8.0.3 | IndexedDB para caché local |
| `swiper` | ^12.2.0 | Carruseles táctiles (mobile) |
| `nodemailer` | ^8.0.7 | Envío de correos (server) |
| `vite-plugin-pwa` | ^1.3.0 | Service Worker + Manifest |

### Dependencias de Desarrollo

| Librería | Versión | Propósito |
|---|---|---|
| `vite` | ^8.0.0 | Build tool |
| `@vitejs/plugin-react` | ^6.0.0 | Plugin React para Vite |
| `typescript` | ~5.9.3 | Tipado |
| `tailwindcss` | ^4.2.2 | CSS utility-first |
| `@tailwindcss/postcss` | ^4.2.2 | PostCSS plugin para Tailwind v4 |
| `postcss` | ^8.5.8 | Procesador CSS |
| `autoprefixer` | ^10.4.27 | Prefixes CSS |
| `eslint` | ^9.39.4 | Linter |
| `react-doctor` | ^0.2.6 | Análisis de calidad React |

---

## 3. Estructura del Proyecto

```
src/
├── components/         # Componentes reutilizables
│   ├── Common/         # Button, Card, Input, Modal, EstadoBadge
│   ├── Layout.tsx      # Layout principal con Sidebar
│   ├── MobileLayout.tsx
│   ├── Sidebar.tsx
│   ├── Header.tsx
│   ├── MapaPiso.tsx    # Mapa interactivo de lugares
│   └── ...
├── constants/          # tema.ts
├── contexts/           # ThemeContext
├── data/               # lugares.ts (datos estáticos)
├── hooks/              # useAuth, useTheme, useOnlineStatus, etc.
├── lib/                # supabase.ts (cliente)
├── pages/              # 50+ páginas del sistema
├── repositories/       # Patrón repositorio (interfaces + impl)
│   ├── interfaces/
│   └── impl/
├── services/           # Lógica de negocio y acceso a datos
├── styles/             # Archivos CSS adicionales
├── types/              # Interfaces y tipos globales
└── utils/              # Utilidades (RUT, caché, etc.)

SQL_md/                 # Scripts SQL de configuración
supabase/               # Config local de Supabase CLI
  ├── config.toml
  ├── schema.sql
  ├── data/             # JSON exports
  └── migrations/       # Migraciones SQL
```

---

## 4. Autenticación y Roles

### Proveedor
- **Supabase Auth** (email/password + Google OAuth).
- Sesión manejada via `supabase.auth.onAuthStateChange`.

### Hook `useAuth`
- Escucha cambios de autenticación (con debounce de 800ms).
- Obtiene datos del usuario desde la tabla `usuarios` vía `obtenerUsuarioPorUid(user.id)`.
- Safety timeout de 30s si no llega evento de auth.

### Roles (enum `Rol`)

| Rol | Descripción |
|---|---|
| `ADMIN` | Acceso completo a todo el sistema |
| `INSPECTOR` | Gestión de justificaciones, estudiantes |
| `PROFESOR` | Registro de justificaciones, gestión de pases |
| `ESTUDIANTE` | Auto-servicio (ver justificaciones) |
| `APODERADO` | Ver justificaciones de sus estudiantes |
| `TECNICO` | Módulo técnico (equipos, ubicaciones, requerimientos) |

### Flujo de autorización

```
onAuthStateChange → resolverUsuario(session?.user)
  ├── Sin sesión → limpiarSesion()
  ├── Sin datos en usuarios → usuarioInactivo
  ├── Usuario inactivo (activo=false) → bloqueado
  ├── Mantenimiento activo → bloqueado (excepto ADMIN)
  └── OK → autorizado = true
```

### Rutas protegidas
- `puedeVer(ruta, ...roles)` — chequea rol del usuario o permisos personalizados.
- Roles predefinidos: verifica contra `rol`.
- Roles personalizados: verifica contra `permisosRol[]`.

---

## 5. Enrutamiento

### Esquema de rutas

El sistema usa **hash routing** (`window.location.hash`). Las rutas se definen en `AppContent.tsx` en un switch dentro de `renderizarDashboard()`.

#### Rutas generales

| Ruta | Página | Roles |
|---|---|---|
| `/dashboard` | Dashboard según rol | Todos |
| `/secretaria` | DashboardSecretaria | ADMIN, SECRETARIA |
| `/registrar` | RegistrarJustificacion | ADMIN, INSPECTOR, PROFESOR |
| `/ver-justificaciones` | VerJustificaciones | ADMIN, INSPECTOR |
| `/justificaciones` | JustificacionesAtrasos | ADMIN, INSPECTOR |
| `/gestion-pases` | GestionPases | ADMIN, PROFESOR, INSPECTOR |
| `/mantenedor-motivos` | MantenedorMotivos | ADMIN |
| `/mantenedor-estudiantes` | MantenedorEstudiantes (lazy) | ADMIN |
| `/mantenedor-cursos` | MantenedorCursos | ADMIN |
| `/mantenedor-funcionarios` | MantenedorFuncionarios | ADMIN |
| `/gestion-usuarios` | GestionUsuarios | ADMIN |
| `/parametros` | Parametros | ADMIN |
| `/en-linea` | EnLinea | ADMIN |
| `/seguridad` | Seguridad | ADMIN |
| `/bloque-horario` | BloqueHorario | ADMIN |
| `/asignar-permisos` | AsignarPermisos | ADMIN |
| `/reportes` | Reportes | ADMIN |
| `/solicitudes-registro` | SolicitudesRegistro | ADMIN |
| `/correos` | Correos | ADMIN |
| `/sistema` | MantenimientoConfig | ADMIN |
| `/monitoreo-correos` | MonitoreoCorreos | ADMIN |
| `/monitoreo-fallos` | MonitoreoFallos | ADMIN |
| `/prestamos` | Circulacion | ADMIN |
| `/historial-biblioteca` | HistorialBiblioteca | ADMIN |
| `/config-biblioteca` | ConfigBiblioteca | ADMIN |
| `/libros` | MantenedorLibros | ADMIN |
| `/catalogo` | Catalogo | ADMIN |
| `/inventario` | Inventario | ADMIN |
| `/configurar-2fa` | Configurar2FA | Todos |

#### Rutas del módulo técnico

| Ruta | Página | Roles |
|---|---|---|
| `/tecnico` | Tecnico | ADMIN |
| `/tecnico/mapa` | Tecnico | ADMIN |
| `/tecnico/equipos` | Equipos | ADMIN |
| `/tecnico/ubicaciones` | Ubicaciones | ADMIN |
| `/tecnico/requerimientos` | Requerimientos | ADMIN |
| `/tecnico/menu` | MenuTecnico | ADMIN, TECNICO |
| `/tecnico/accesos` | AccesosRapidos | ADMIN, TECNICO |
| `/tecnico/configuracion` | ConfiguracionTecnico | ADMIN |

#### Rutas mobile (módulo técnico)

| Ruta | Página | Roles |
|---|---|---|
| `/tecnico/m/inicio` | MobileDashboard | ADMIN, TECNICO |
| `/tecnico/m/mapa` | MobileMapa | ADMIN, TECNICO |
| `/tecnico/m/equipos` | MobileEquipos | ADMIN, TECNICO |
| `/tecnico/m/ubicaciones` | MobileUbicaciones | ADMIN, TECNICO |
| `/tecnico/m/config` | MobileConfigTecnico | ADMIN, TECNICO |
| `/tecnico/m/qr` | MobileQrScanner | ADMIN, TECNICO |
| `/tecnico/m/accesos` | AccesosRapidos | ADMIN, TECNICO |

#### Rutas especiales (fuera del Layout)

| Ruta/Condición | Componente |
|---|---|
| Sin sesión | Login |
| Sin datos personales | FormularioDatosPersonales |
| Registro inicial | FormularioRegistroInicial |
| 404 | NotFound |

---

## 6. Supabase — Base de Datos

### Tablas principales

| Tabla | Propósito |
|---|---|
| `establecimientos` | Entidades educativas (colegios, liceos) |
| `usuarios` | Usuarios del sistema con roles |
| `estudiantes` | Estudiantes vinculados a establecimientos |
| `cursos` | Cursos por establecimiento |
| `solicitudes` | Solicitudes de justificación |
| `bloques_horarios` | Bloques/periodos de clase |
| `motivos_justificacion` | Catálogo de motivos de justificación |
| `funcionarios` | Registro detallado de funcionarios |
| `permisos` | Definiciones de permisos del sistema |
| `rol_permisos` | Asignación de permisos a roles personalizados |
| `paginas` | Páginas dinámicas |

### Tablas del módulo técnico

| Tabla | Propósito |
|---|---|
| `ubicaciones` | Dispositivos por lugar (id_lugar, dispositivo_nombre, cantidad, activo) |
| `equipos` | Equipos del establecimiento |
| `mantenciones` | Mantenciones de equipos |
| `requerimientos` | Requerimientos/incidencias técnicas |
| `configuracion_dispositivos` | Lista maestra de dispositivos por establecimiento |
| `qr_codes` | Códigos QR generados para lugares y equipos |
| `posibles_fallas` | Catálogo de fallas posibles |
| `posibles_diagnosticos` | Catálogo de diagnósticos |
| `posibles_soluciones` | Catálogo de soluciones |
| `posibles_observaciones` | Catálogo de observaciones |

### Tablas adicionales

| Tabla | Propósito |
|---|---|
| `contactos_correo` | Contactos para envío de correos |
| `plantillas_correo` | Plantillas de correo electrónico |
| `configuracion_sistema` | Configuración general del sistema |
| `datospersonalesusuarios` | Datos personales extendidos de usuarios |
| `justificados` | Registro de solicitudes justificadas |
| `injustificados` | Registro de solicitudes injustificadas |
| `funcionario_ausencias` | Ausencias de funcionarios |
| `funcionario_documentos` | Documentos subidos por funcionarios |
| `monitoreo_correos` | Log de correos enviados |
| `monitoreo_logs` | Log de acciones de usuarios |
| `libros` | Catálogo de libros (biblioteca) |
| `book_copies` | Copias de libros |
| `library_loans` | Préstamos de biblioteca |
| `library_rules` | Reglas de préstamo |
| `library_holidays` | Festivos para cálculo de fechas |
| `books` | Libros (biblioteca) |
| `bloques_horarios` | Bloques horarios |
| `roles_personalizados` | Roles personalizados |
| `palabras_bloqueadas` | Palabras bloqueadas en el sistema |
| `email_config` | Configuración de correo |

---

## 7. Supabase — RLS Policies

### Patrón general

```sql
ALTER TABLE tabla ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "policy_name" ON tabla;
CREATE POLICY "policy_name" ON tabla
  FOR OPERACION USING (
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol IN ('ADMIN', 'ROL_PERMITIDO'))
  );
```

### Tabla `ubicaciones`

| Policy | Operación | Acceso |
|---|---|---|
| `ubicaciones_select` | SELECT | Todos los autenticados |
| `ubicaciones_insert` | INSERT | Solo ADMIN |
| `ubicaciones_update` | UPDATE | ADMIN, TECNICO |
| `ubicaciones_delete` | DELETE | ADMIN, TECNICO |

### Tablas del módulo técnico
Las tablas `configuracion_dispositivos`, `qr_codes`, `posibles_fallas`, `posibles_diagnosticos`, `posibles_soluciones`, `posibles_observaciones` usan:
- **SELECT:** `true` (todos pueden leer)
- **INSERT/UPDATE/DELETE:** `auth.role() = 'authenticated'`

### Ubicación de los scripts RLS
- `SQL_md/SQL_CONFIGURACION_TECNICO.sql` — Políticas para ubicaciones y tablas técnicas.
- `SQL_md/SQL_SUPABASE_RLS_POLICIES_FIXED.sql` — Políticas principales corregidas.
- `SQL_md/SQL_SUPABASE_RLS_CORRECTO.sql` — Versión correcta de políticas.

---

## 8. Supabase — RPCs y Triggers

### RPCs (SECURITY DEFINER — bypass RLS)

| Función | Propósito |
|---|---|
| `insertar_qr(p_codigo, p_tipo, p_id_referencia)` | Insertar o actualizar código QR |
| `insertar_requerimiento(...)` | Crear requerimiento técnico |
| `insertar_equipo(...)` | Insertar equipo nuevo |
| `upsertar_ubicacion(p_id_lugar, p_id_establecimiento, p_dispositivo_nombre, p_cantidad, p_activo)` | Insertar o actualizar ubicación (usado por MapaPiso) |

### Triggers

| Trigger | Tabla | Evento | Acción |
|---|---|---|---|
| `on_auth_user_created` | `auth.users` | AFTER INSERT | Crear registro en `public.usuarios` con datos de `raw_user_meta_data` |
| `on_auth_user_updated` | `auth.users` | AFTER UPDATE | Sincronizar cambios en `public.usuarios` |
| `on_auth_user_deleted` | `auth.users` | AFTER DELETE | Marcar usuario como inactivo |
| `set_updated_at_*` | Varias tablas | BEFORE UPDATE | Actualizar columna `updated_at` |

---

## 9. Páginas

### Generales

| Página | Archivo | Propósito |
|---|---|---|
| Login | `Login.tsx` | Inicio de sesión (email + Google OAuth) |
| DashboardAdmin | `DashboardAdmin.tsx` | Panel principal del ADMIN |
| DashboardInspector | `DashboardInspector.tsx` | Panel del INSPECTOR |
| DashboardProfesor | `DashboardProfesor.tsx` | Panel del PROFESOR |
| DashboardEstudiante | `DashboardEstudiante.tsx` | Panel del ESTUDIANTE |
| DashboardApoderado | `DashboardApoderado.tsx` | Panel del APODERADO |
| DashboardSecretaria | `DashboardSecretaria.tsx` | Panel de SECRETARIA |
| RegistrarJustificacion | `RegistrarJustificacion.tsx` | Formulario de justificación |
| VerJustificaciones | `VerJustificaciones.tsx` | Listado y detalle de justificaciones |
| JustificacionesAtrasos | `JustificacionesAtrasos.tsx` | Gestión de atrasos |
| GestionPases | `GestionPases.tsx` | Gestión de pases |
| GestionUsuarios | `GestionUsuarios.tsx` | CRUD de usuarios |
| MantenedorEstudiantes | `MantenedorEstudiantes.tsx` | CRUD de estudiantes (lazy) |
| MantenedorCursos | `MantenedorCursos.tsx` | CRUD de cursos |
| MantenedorFuncionarios | `MantenedorFuncionarios.tsx` | CRUD de funcionarios |
| MantenedorMotivos | `MantenedorMotivos.tsx` | CRUD de motivos de justificación |
| Seguridad | `Seguridad.tsx` | Logs de seguridad |
| Configurar2FA | `Configurar2FA.tsx` | Configuración de 2FA |
| BloqueHorario | `BloqueHorario.tsx` | Gestión de bloques horarios |
| Parametros | `Parametros.tsx` | Parámetros del sistema |
| EnLinea | `EnLinea.tsx` | Usuarios en línea |
| AsignarPermisos | `AsignarPermisos.tsx` | Permisos por rol |
| MantenedorRolesPage | `MantenedorRolesPage.tsx` | Roles personalizados |
| Reportes | `Reportes.tsx` | Reportes y estadísticas |
| SolicitudesRegistro | `SolicitudesRegistro.tsx` | Solicitudes de registro pendientes |
| Correos | `Correos.tsx` | Gestión de correos |
| PlantillasCorreo | `PlantillasCorreo.tsx` | Plantillas de correo |
| EnviarCorreo | `EnviarCorreo.tsx` | Envío manual de correos |
| SecretariaAusentes | `SecretariaAusentes.tsx` | Ausentes para secretaría |
| MantenimientoConfig | `MantenimientoConfig.tsx` | Modo mantenimiento del sistema |
| MonitoreoCorreos | `MonitoreoCorreos.tsx` | Log de correos enviados |
| MonitoreoFallos | `MonitoreoFallos.tsx` | Log de errores del sistema |
| Circulacion | `Circulacion.tsx` | Préstamos de biblioteca |
| HistorialBiblioteca | `HistorialBiblioteca.tsx` | Historial de préstamos |
| ConfigBiblioteca | `ConfigBiblioteca.tsx` | Configuración de biblioteca |
| MantenedorLibros | `MantenedorLibros.tsx` | CRUD de libros |
| Catalogo | `Catalogo.tsx` | Catálogo de biblioteca |
| Inventario | `Inventario.tsx` | Inventario |
| Festivos | `Festivos.tsx` | Festivos para biblioteca |
| FormularioRegistroInicial | `FormularioRegistroInicial.tsx` | Registro inicial de usuario |
| FormularioDatosPersonales | `FormularioDatosPersonales.tsx` | Datos personales del usuario |

### Módulo Técnico

| Página | Archivo | Propósito |
|---|---|---|
| Tecnico | `Tecnico.tsx` | Dashboard del módulo técnico (escritorio) |
| MobileDashboard | `MobileDashboard.tsx` | Dashboard mobile del técnico |
| Equipos | `Equipos.tsx` | CRUD de equipos |
| MobileEquipos | `MobileEquipos.tsx` | Equipos versión mobile |
| Ubicaciones | `Ubicaciones.tsx` | Asignación de dispositivos a lugares |
| MobileUbicaciones | `MobileUbicaciones.tsx` | Ubicaciones versión mobile (solo lectura) |
| Lugares | `Lugares.tsx` | Gestión de lugares |
| MenuTecnico | `MenuTecnico.tsx` | Menú principal del técnico |
| AccesosRapidos | `AccesosRapidos.tsx` | Accesos rápidos del técnico |
| ConfiguracionTecnico | `ConfiguracionTecnico.tsx` | Configuración del módulo técnico |
| MobileConfigTecnico | `MobileConfigTecnico.tsx` | Configuración versión mobile |
| Requerimientos | `Requerimientos.tsx` | Gestión de requerimientos/incidencias |
| Ticket | `Ticket.tsx` | Detalle de ticket de requerimiento |
| QrRedirect | `QrRedirect.tsx` | Redirección por código QR |
| MobileMapa | `MobileMapa.tsx` | Mapa interactivo versión mobile |
| MobileQrScanner | `MobileQrScanner.tsx` | Escáner QR versión mobile |

---

## 10. Componentes Compartidos

| Componente | Archivo | Propósito |
|---|---|---|
| Layout | `Layout.tsx` | Layout principal con Sidebar + Header |
| MobileLayout | `MobileLayout.tsx` | Layout versión mobile |
| Sidebar | `Sidebar.tsx` | Menú lateral de navegación |
| Header | `Header.tsx` | Barra superior con usuario y notificaciones |
| MobileNavBar | `MobileNavBar.tsx` | Barra de navegación inferior mobile |
| MapaPiso | `MapaPiso.tsx` | Mapa interactivo drag-and-drop de lugares |
| EditorMapa | `EditorMapa.tsx` | Editor visual del mapa |
| ConfigurarMapa | `ConfigurarMapa.tsx` | Configuración del mapa |
| ModalRequerimiento | `ModalRequerimiento.tsx` | Modal para crear/editar requerimientos |
| RegistrarJustificacion | `RegistrarJustificacion.tsx` | Formulario de justificación (componente) |
| TicketManagement | `TicketManagement.tsx` | Gestión de tickets |
| EquipmentManagement | `EquipmentManagement.tsx` | Gestión de equipos (componente) |
| MonitorLecturas | `MonitorLecturas.tsx` | Monitor de lecturas QR |
| TestMonitor | `TestMonitor.tsx` | Monitor de prueba |
| SwitchAusente | `SwitchAusente.tsx` | Switch ausente/presente |
| ChunkErrorBoundary | `ChunkErrorBoundary.tsx` | Error boundary para lazy loading |
| IndicadorConexion | `IndicadorConexion.tsx` | Indicador de estado de conexión |
| NotificacionCampana | `NotificacionCampana.tsx` | Campana de notificaciones |
| UsuariosOnlineIndicador | `UsuariosOnlineIndicador.tsx` | Indicador de usuarios en línea |
| DatosPersonalesModal | `DatosPersonalesModal.tsx` | Modal de datos personales |
| MantenedorRoles | `MantenedorRoles.tsx` | Mantenedor de roles |
| MobileSwipeWrapper | `MobileSwipeWrapper.tsx` | Wrapper para swipe en mobile |

### Common UI

| Componente | Propósito |
|---|---|
| `Button.tsx` | Botón reutilizable |
| `Card.tsx` | Tarjeta contenedora |
| `Input.tsx` | Input reutilizable |
| `Modal.tsx` | Modal genérico |
| `EstadoBadge.tsx` | Badge de estado (colores) |

---

## 11. Servicios

### Archivos en `src/services/`

| Archivo | Líneas | Propósito |
|---|---|---|
| `database.ts` | 1959 | CRUD principal del sistema (84 funciones exportadas) |
| `supabaseDB.ts` | 772 | CRUD alternativo con interfaces DB tipadas |
| `supabaseAuth.ts` | 262 | Autenticación Supabase (Google OAuth, sesión) |
| `supabaseService.ts` | 222 | Consultas comunes de alto nivel |
| `cacheService.ts` | 156 | Caché local con IndexedDB + TTL |
| `tecnicoCache.ts` | 59 | Caché especializada para datos técnicos |
| `actividades.ts` | 143 | Seguimiento de actividad de usuarios |
| `online.ts` | 535 | Presencia en línea (heartbeats, sesiones) |
| `deviceId.ts` | 494 | Fingerprinting de dispositivos |
| `emailService.ts` | 69 | Envío de correos |
| `plantillasCorreo.ts` | 97 | Plantillas de correo con renderizado |
| `contactosCorreo.ts` | 59 | Contactos de correo |
| `funcionarios.ts` | 98 | CRUD de funcionarios |
| `funcionarioAusencias.ts` | 41 | Ausencias de funcionarios |
| `funcionarioDocumentos.ts` | 58 | Documentos de funcionarios |
| `library.ts` | 109 | Gestión de biblioteca (préstamos, libros) |
| `mantenimientoService.ts` | 56 | Modo mantenimiento del sistema |
| `monitoreoService.ts` | 52 | Logging de correos y acciones |
| `customClaimsService.ts` | 76 | Sincronización de custom claims (stub) |

---

## 12. Hooks

| Hook | Propósito |
|---|---|
| `useAuth` | Estado de autenticación, rol, datos del usuario |
| `useTheme` | Tema claro/oscuro |
| `useOnlineStatus` | Estado de conexión a internet |
| `useInactivityWarning` | Alerta de inactividad |
| `useSessionActivity` | Seguimiento de actividad de sesión |
| `useRegistrarActividad` | Registro de actividad del usuario |
| `usePermisosUsuario` | Permisos del usuario actual |
| `useCatalogo` | Catálogo de biblioteca |
| `useConfigBiblioteca` | Configuración de biblioteca |
| `useInventario` | Inventario |
| `usePrestamos` | Préstamos de biblioteca |
| `useCustomClaims` | Custom claims de Supabase |

---

## 13. Repositorios

Patrón repositorio con interfaces e implementaciones para Supabase:

### Interfaces
| Interfaz | Métodos principales |
|---|---|
| `IEquipoRepository` | CRUD equipos |
| `ILibroRepository` | CRUD libros |
| `ILugarRepository` | CRUD lugares |
| `IMantencionRepository` | CRUD mantenciones |
| `IRequerimientoRepository` | CRUD requerimientos |
| `IUsuarioRepository` | CRUD usuarios |

### Implementaciones
`Supabase*Repository.ts` para cada interfaz.

---

## 14. Estilos

- **TailwindCSS v4** via PostCSS (`@tailwindcss/postcss`).
- **Estilos en línea** en varios componentes (React.CSSProperties).
- **Archivos CSS clásicos** en `src/styles/`:
  - `dashboard.css`, `en-linea.css`, `forms.css`, `global.css`, `layout.css`, `login.css`, `registrar.css`, `seguridad.css`, `universal.css`
- **Tema personalizado Tailwind:**
  - `primary`: `#1A3C6B` (azul oscuro)
  - `secondary`: `#255AA3` (azul medio)
  - `success`: `#10B981` (verde)
  - `error`: `#DC2626` (rojo)
  - `warning`: `#F59E0B` (ámbar)
- **Tema claro/oscuro** via `ThemeContext`.

---

## 15. PWA

- Plugin: `vite-plugin-pwa` con estrategia `generateSW` (Workbox).
- Service Worker auto-actualizante.
- Precache: 19 entradas (~1920 KiB).
- Manifest: nombre "SGJA", tema `#1A3C6B`, modo `standalone`.
- Iconos: 192px, 512px.

---

## 16. Despliegue

### Plataformas

| Plataforma | URL | Propósito |
|---|---|---|
| **Vercel** | `sgja.vercel.app` | Frontend principal |
| **Vercel (blue)** | `sgja-app-blue.vercel.app` | Frontend secundario (pruebas) |
| **Cloudflare Pages** | (vía wrangler) | Frontend alternativo |
| **Supabase** | `iyxubvtfhcmlivivdfpt.supabase.co` | Base de datos + Auth |

### Comandos

| Comando | Propósito |
|---|---|
| `npm run dev` | Iniciar servidor de desarrollo (localhost:5173) |
| `npm run build` | Compilar TypeScript + build Vite |
| `npm run preview` | Vista previa del build |
| `npm run dev:email` | Dev server + servidor de correos |
| `npm run email-server` | Servidor de correos standalone |
| `npm run lint` | Lint del proyecto |
| `vercel --prod --yes` | Deploy a Vercel |
| `wrangler pages deploy dist` | Deploy a Cloudflare Pages |

### Variables de entorno requeridas

```
VITE_SUPABASE_URL=https://iyxubvtfhcmlivivdfpt.supabase.co
VITE_SUPABASE_ANON_KEY=<anon_key>
```

### Supabase Auth — URLs permitidas

```
https://sgja-app.vercel.app/**
https://sgja-app-blue.vercel.app/**
http://localhost:5173/**
http://localhost:5174/**
```

---

## 17. Pendientes y Bugs Conocidos

### Bugs
- ~~**Ubicaciones — soft delete no funciona localmente**: RLS policy usaba `auth.jwt()->>'rol'` que no existe en el JWT. Corregido usando lookup a `usuarios`.~~ ✅
- **MapaPiso — arrastrar dispositivo**: puede no persistir si la sesión expiró.

### Pendientes
- `customClaimsService.ts` — stub sin implementar (`sincronizarTodosLosCustomClaims`).
- `MantenedorEstudiantes` — único componente lazy-loaded; evaluar si otros deben ser lazy.
- Cobertura de pruebas: no hay tests automatizados.
- Documentación de API de servicios.
- Migrar estilos inline a clases Tailwind consistentemente.
- Implementar pruebas unitarias (Playwright / Vitest).

---

> Generado: Junio 2026
