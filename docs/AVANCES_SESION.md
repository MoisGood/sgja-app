# Avances — SGJA (Sesión actual)

> Documento de respaldo de todas las features implementadas en esta sesión.
> Se re-aplicarán después del reset a `origin/master`.

---

## 1. HistorialMovil — Paginador visible

**Archivo:** `src/pages/HistorialMovil.tsx`

- Reemplazó IntersectionObserver (infinite scroll) por paginador explícito
- Controles: `<<` `<` `página / total` `>` `>>`
- 15 registros por página
- Filtros toggle: estado, fecha, lugar, usuario
- Fix: query de usuarios usaba `nombre_completo` → corregido a `nombre`

## 2. Requerimientos — Usuario del ticket editable

**Archivo:** `src/pages/Requerimientos.tsx`

- En formulario de edición: dropdown `<select>` para `id_solicitante`
- Muestra usuarios filtrados por establecimiento del ticket
- Columna en tabla desktop ahora muestra `id_solicitante` del ticket (con fallback al usuario del equipo)

## 3. GestionUsuarios — Filtro por dominio

**Archivo:** `src/pages/GestionUsuarios.tsx`

- Dropdown de filtro: "Todos los dominios", `@gmail.com`, `@andaliensur.cl`, "Otros"
- Se integra con los filtros existentes (texto, rol, estado)

## 4. Menu flash — Corregido

**Archivos:** `src/AppContent.tsx`, `src/components/Layout.tsx`, `src/components/MobileLayout.tsx`

- `usePermisosUsuario` movido de Layout a AppContent
- Layout/MobileLayout reciben `permisos` y `cargandoPermisos` como props
- `if (cargandoPermisos) return true` → `return false` para no mostrar menú vacío
- Admins short-circuit via `rol === Rol.ADMIN` antes de `tienePermiso`
- Non-admins ven menú vacío hasta que permisos resuelven

## 5. Ticket evidence — Fotos + compresión + galería

**Archivos:** `src/pages/Ticket.tsx`, `src/components/ModalRequerimiento.tsx`

- Cámara directa desde el navegador
- Subir archivo como alternativa
- Compresión cliente-side (< 1 MB)
- Galería de fotos en ticket
- Sync entre ModalRequerimiento y vista de ticket

## 6. Base de datos — Migraciones

### Pendientes de aplicar (en SQL Editor de Supabase):

| Migración | Contenido |
|---|---|
| `020_importar_colaborador.sql` | Función importar colaborador |
| `021_fix_aprobar_solicitud_id_establecimiento.sql` | Fix id_establecimiento en aprobar solicitud |
| `022_plantillas_correo_tecnico.sql` | Plantillas de correo para técnico |
| `023_fix_is_admin_email.sql` | ~~Fix is_admin() por email~~ → Reemplazado por 024 |
| **`024_fix_admin_duplicados.sql`** | **Fusión de duplicados + is_admin() con OR dual** |

### Scripts auxiliares (python/):

| Script | Propósito |
|---|---|
| `crear_usuarios_desde_csv.sql` | Crear usuarios PROFESOR desde CSV |
| `fix_aprobar_duplicado_email.sql` | Fix aprobar_solicitud_registro para emails duplicados |
| `normalizar_admin.sql` | Precursor de 024 |

---

## Nota técnica

El error "Permiso denegado: se requiere rol ADMIN" ocurre porque:

1. Seed SQL creó admin con `id = 550e8400-...` (UUID fijo)
2. Google Sign In creó otro registro con `id = auth.uid() = c88e105c-...`
3. `es_admin()` busca `id = auth.uid()` → encuentra el registro del trigger → `rol = 'USER'` → `false`
4. Todos los RPCs y RLS policies que dependen de `es_admin()` fallan

**Solución definitiva (024):** fusionar duplicados en BD + `is_admin()` con `(id = auth.uid() OR email = auth.email())`.
