# Plan de recuperación — Revertir + Re-aplicar

## Diagnóstico

| Elemento | Estado |
|---|---|
| Admin seed `550e8400-...` en BD | Existe desde siempre |
| Admin auth.uid `c88e105c-...` en BD | Creado por trigger de Google Sign In |
| `es_admin()` usa `id = auth.uid()` | Original en migrations/011 |
| RLS policies que usan `es_admin()` | Agregadas en commits `4fd1ddc` + `40254af` |
| **Problema raíz** | `es_admin()` retorna `false` porque busca `id` seed, pero el admin logueado tiene `auth.uid()` diferente |
| **Antes funcionaba porque** | No había RLS estricto + existía `execute_sql` como by-pass |
| **Dejó de funcionar porque** | Mis commits activaron RLS en tablas sensibles SIN corregir antes el ID del admin |

## Plan

### Fase 1 — Reset a base limpia (solo código)

```bash
git reset --soft origin/master
```

Esto deshace los 7 commits locales pero **mantiene todos los cambios en el working tree** (sin staging).

### Fase 2 — Separar cambios buenos de cambios conflictivos

**Cambios BUENOS (re-aplicar):**

| Archivo | Feature |
|---|---|
| `src/pages/HistorialMovil.tsx` | Paginador con controles visibles (reemplazó IntersectionObserver) |
| `src/pages/Requerimientos.tsx` | Dropdown editable "Usuario del ticket" (`id_solicitante`) |
| `src/AppContent.tsx` | Mueve `usePermisosUsuario` aquí, pasa permisos como props |
| `src/components/Layout.tsx` | Recibe permisos por props; `cargandoPermisos → false` |
| `src/components/MobileLayout.tsx` | Recibe `permisos` como prop |
| `src/pages/GestionUsuarios.tsx` | Filtro por dominio (`@gmail.com`, `@andaliensur.cl`, Otros) |
| `src/pages/Ticket.tsx` | Evidencia fotos + compresión + galería |
| `src/pages/MobileDashboard.tsx` | Ajustes varios |
| `src/pages/MobileMapa.tsx` | Ajustes varios |
| `src/pages/MobileConfigTecnico.tsx` | Ajustes varios |
| `src/components/ModalRequerimiento.tsx` | Sync con evidencia fotos |

**Cambios a REVISAR (separar en commit independiente):**

| Archivo | Riesgo |
|---|---|
| `supabase/migrations/018_fix_seguridad.sql` | Agrega RLS con `es_admin()` → si admin tiene ID mismatch, se bloquea solo |

### Fase 3 — Commitear por capas

1. **commit A**: Features de UI (HistorialMovil, Requerimientos, GestionUsuarios domain filter)
2. **commit B**: Fix menu flash (AppContent, Layout, MobileLayout)
3. **commit C**: Ticket evidence + mobile fixes (Ticket, ModalRequerimiento, MobileDashboard, MobileMapa, MobileConfigTecnico)
4. **commit D**: Seguridad (018_fix_seguridad.sql) → **SOLO después de ejecutar fix en BD**

### Fase 4 — Normalizar admin en BD

Ejecutar `supabase/migrations/024_fix_admin_duplicados.sql` en SQL Editor de Supabase.

Esto:
- Busca admins con `email` en `auth.users` y `usuarios`
- Si hay duplicados (seed + auth), fusiona datos y elimina seed
- Recrea `is_admin()`/`es_admin()` con **doble condición**: `id = auth.uid() OR email = auth.email()`
- Así funciona aunque haya otros usuarios con IDs desincronizados

### Fase 5 — Verificar

- Login como admin → todas las operaciones CRUD deben funcionar
- Eliminación permanente de usuario
- Aprobar solicitudes de registro
- Acceso a email_config, dominios_externos, etc.
