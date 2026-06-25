# Guía de Mejoras — SGJA

> Estado actual post-#6: build 0 errores, 38 tests, servicios separados.

---

## 🥇 Prioridad Alta

### 1. Refactor `useAuth.ts`

**Problema:** ~500 líneas mezclando auth (login/logout/sesión) con lógica de negocio (roles, permisos, datos de usuario, MFA, inactividad).

**Propuesta:**
| Archivo | Contenido |
|---------|-----------|
| `src/hooks/useAuth.ts` | Solo `AuthProvider` + `useAuth`: sesión, login, logout, `onAuthStateChange` |
| `src/hooks/useUsuario.ts` | Hook separado: `usuario`, `rol`, `establecimiento`, `tema` (lee de DB/localStorage) |
| `src/hooks/usePermisos.ts` | Permisos de ruta por rol (lo que hoy está en `usePermisosUsuario.ts`) |
| `src/hooks/useInactividad.ts` | Temporizador de cierre por inactividad |

**Criterio:** cada hook importa `supabase` o servicios directamente, sin depender del `AuthProvider`.

---

### 2. Organizar `src/components/`

**Problema:** 60+ archivos planos, sin subdirectorios. Layout, páginas, modales, utilidades todo mezclado.

**Propuesta:**
```
src/components/
├── layout/          # Layout, Sidebar, Header, MobileLayout, MobileNavBar
├── ui/              # Botones, inputs, cards, badges, modales genéricos
├── estudiantes/     # Componentes de estudiante (si los hay)
├── solicitudes/     # Componentes de solicitudes
├── tecnico/         # Mapa, equipo, requerimiento
├── biblioteca/      # Libros, préstamos, catálogo
└── auth/            # Login, registro, perfil
```

**Regla:** no mover ahora, solo organizar cuando se toque un componente.

---

### 3. Estados Vacíos + Error Boundaries

**Problema:** pantallas sin datos muestran nada o spinners. Sin ErrorBoundary, un error en un componente interno tumba toda la app.

**Propuesta:**
```tsx
// src/components/ui/EmptyState.tsx
interface EmptyStateProps {
  icon: ReactNode;
  titulo: string;
  descripcion?: string;
  accion?: { label: string; onClick: () => void };
}

// src/components/ui/ErrorBoundary.tsx
// Atrapa errores de render, muestra fallback y botón "Reintentar"
```

**Buscar** todos los `.length === 0` o `.length > 0` en renders y reemplazar con `<EmptyState />`.

---

### 4. Validación con Esquema

**Problema:** cada formulario valida manualmente con `if`/`else` (RUT, email, campos requeridos).

**Propuesta:** instalar `zod` y crear schemas compartidos:

```ts
// src/lib/schemas.ts
import { z } from 'zod';

export const rutSchema = z.string().regex(/^\d{1,2}\.\d{3}\.\d{3}[-][0-9kK]$/);
export const emailSchema = z.string().email();
export const estudianteSchema = z.object({ ... });
```

Reemplazar validación inline en formularios con `zod.parse` o `zod.safeParse`.

---

## 🥈 Prioridad Media

### 5. Tipos desde Supabase

**Problema:** `src/types/index.ts` tiene tipos escritos a mano que pueden desincronizarse con la DB real.

```bash
supabase gen types typescript --linked > src/types/supabase.ts
```

Luego mapear o reemplazar tipos manuales con los generados. Opcional: mantener solo los tipos compuestos (ej. `Solicitud extends SupabaseSolicitud`) para conservar campos virtuales como `id_usuario`.

### 6. Mix de Estilos

**Problema:** mismo componente mezcla Tailwind + clases CSS legacy + estilos inline.

**Acción:** al tocar un componente, migrar a Tailwind puro. No hacer barrido general, solo oportunista.

### 7. Barrel Público

**Problema:** importar servicios requiere saber la ruta exacta.

**Propuesta:** crear `src/services/index.ts` que re-exporte TODO (como hace `database.ts` pero más completo). Luego los imports quedan:
```ts
import { obtenerUsuario, crearSolicitud } from '../services';
```

Actualmente `database.ts` ya es ese barrel para los servicios extraídos. Verificar que cubra todo y renombrar a `index.ts`.

---

## 🥉 Prioridad Baja

### 8. Componentes Gordos

`Layout.tsx` (504 líneas), `DashboardAdmin.tsx` mezcla UI con queries. Al tocarlos, extraer la lógica a hooks.

### 9. Sonner + ErrorHandler

Ya está implementado (#1). Verificar que no queden `console.error` sueltos:
```bash
rg 'console\.(error|warn|log)' src/ --no-filename | grep -v '//' | wc -l
```

### 10. Tests Faltantes

Faltan tests de:
- Componentes (con React Testing Library)
- Hooks (`useAuth`, `usePermisosUsuario`)
- Páginas principales

Agregar gradualmente, priorizando lo que se rompe más seguido.

---

## Checklist Rápida

| Tarea | Archivos | Esfuerzo |
|-------|----------|----------|
| Refactor `useAuth.ts` | ~4 hooks nuevos | 3-4h |
| Organizar `components/` | Mover ~60 archivos | 1h |
| `EmptyState` + `ErrorBoundary` | 2 componentes + ~30 pantallas | 2-3h |
| Validación con zod | 1 schema + ~10 formularios | 2h |
| Tipos Supabase | 1 comando + mapeo | 1h |
| Mix estilos | Oportunista | ∞ |
| Barrel `index.ts` | 1 archivo | 15min |
| Tests componentes | Prioritarios | 2-3h |
