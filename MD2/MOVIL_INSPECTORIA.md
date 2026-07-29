# Análisis: Ambiente Móvil para Inspectoría

**Fecha:** 2026-07-29
**Propósito:** Documentar el análisis del estado actual y plan para crear versión móvil de Inspectoría (Crear Pase + Gestión de Pases), como parte del nuevo ecosistema móvil para Inicio, Secretaría, Inspectoría y Biblioteca.

---

## 1. Estado Actual

### Rutas desktop existentes

| Ruta | Componente | Líneas | Roles |
|------|-----------|--------|-------|
| `/inspectoria/crear-pase` | `GestionPases.tsx` | 941 | ADMIN, INSPECTOR, PROFESOR |
| `/inspectoria/gestion-pases` | `RegistrarJustificacion.tsx` (pages) | 497 | ADMIN, INSPECTOR, PARADOCENTE |
| | `RegistrarJustificacion.tsx` (components/UI) | 593 | — |
| `JustificacionesTabs.tsx` | Orchestrador (hoy no usado en rutas) | 66 | — |

### Rutas mobile existentes (solo TÉCNICO)

```
/tecnico/m/inicio       → MobileDashboard.tsx
/tecnico/m/historial    → HistorialMovil.tsx
/tecnico/m/tickets      → MobileTickets.tsx
/tecnico/m/mapa         → MobileMapa.tsx
/tecnico/m/equipos      → MobileEquipos.tsx
/tecnico/m/inventario   → MobileInventario.tsx
/tecnico/m/ubicaciones  → MobileUbicaciones.tsx
/tecnico/m/config       → MobileConfigTecnico.tsx
/tecnico/m/qr           → MobileQrScanner.tsx
```

**Conclusión: No existe NADA de inspectoría en mobile.**

---

## 2. Arquitectura Mobile Actual

### Layout
- `Layout.tsx` detecta `window.innerWidth < 768` → renderiza `MobileLayout`
- `MobileLayout.tsx` (69 lns): contenedor con `paddingBottom: 72px` + `MobileBottomNav`
- `MobileBottomNav.tsx` (93 lns): barra inferior fija con 5 ítems **hardcodeados para TÉCNICO**

### Estilo
- Las páginas mobile de TÉCNICO usan **CSS modules** separados (`.module.css`)
- Usan `material-symbols-outlined` para iconos
- No comparten código con las versiones desktop

### Limitaciones
- `MobileBottomNav` no tiene ítems para inspectoría
- No existe navegación mobile para roles no-técnicos
- No hay rutas `/inspectoria/m/*`

---

## 3. Problemas de las Páginas Desktop en Mobile

### GestionPases.tsx (Crear Pase)
- **Sin ningún patrón responsive.** Todo inline styles.
- Tabla con `gridTemplateColumns: '180px 100px 100px 120px 100px 100px'` → desborda.
- ~30 estados, ~15 funciones, ~15 useEffects — alta complejidad.
- Sin media queries, sin Tailwind responsive, sin breakpoints.
- Custom autocomplete no adaptado a táctil.

### RegistrarJustificacion (Gestión de Pases)
- Tabla con `GRID_COLS = '110px 1.3fr 90px 100px 70px 1fr 140px 120px'` y `minWidth: 900` → completamente rota.
- Único elemento responsive: `flexWrap: 'wrap'` en filtros.
- Custom autocomplete con navegación teclado (Arrow, Tab, Enter, Escape) — no usable en táctil.

---

## 4. Referencia: JustificacionesAtrasos.tsx

Es la única página de inspectoría con Tailwind responsive:
```tsx
// Patrón existente: md:hidden / md:grid
<div className="md:hidden">...vista mobile...</div>
<div className="hidden md:grid md:grid-cols-6">...vista desktop...</div>
```

Este patrón permite una sola página con dos renders condicionales.

---

## 5. Plan Propuesto

### Enfoque: Páginas separadas (mismo patrón que TÉCNICO)

| Ruta mobile nueva | Basada en | Roles |
|------------------|-----------|-------|
| `/inspectoria/m/crear-pase` | `GestionPases.tsx` (refactor) | ADMIN, INSPECTOR, PROFESOR |
| `/inspectoria/m/gestion-pases` | `RegistrarJustificacionUI` (refactor) | ADMIN, INSPECTOR, PARADOCENTE |

### Por definir
1. **Navegación**: ¿Extender `MobileBottomNav` con ítems dinámicos por rol, o crear BottomNav separada para inspectoría?
2. **Layout mobile unificado**: ¿Un solo `MobileLayout` que soporte todos los roles (TÉCNICO + Inspectoría + Secretaría + Biblioteca)?
3. **RUT en mobile**: ¿Cómo manejar el lookup de RUT sin teclado físico?
4. **Cards vs tabla**: ¿Lista de estudiantes como cards tocables (como ya existe en GestionPases desktop) o como lista vertical?
5. **PARADOCENTE**: ¿También necesita versión mobile para gestionar pases?

### Dependencias
- `MobileLayout.tsx` y `MobileBottomNav.tsx` necesitan refactor para ser multi-rol
- `AppContent.tsx` necesita nuevas rutas `/inspectoria/m/*`
- `GestionPases.tsx` necesita versión mobile o refactor responsive profundo
- `RegistrarJustificacionUI.tsx` necesita versión mobile o refactor responsive profundo
