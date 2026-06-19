# Academic Core – Brand Tokens

> Design System insertado en `src/styles/global.css` y referenciado desde `src/styles/skins/skin.css`.

---

## Colores (MD3)

Todas las variables usan prefijo `--md-*`. Los alias legacy (`--primary`, `--accent`, `--gray-*`) se mantienen mapeados a los nuevos valores para compatibilidad.

### Surface / Background

| Token | Valor |
|-------|-------|
| `--md-surface` | `#f7f9ff` |
| `--md-surface-dim` | `#d7dae0` |
| `--md-surface-bright` | `#f7f9ff` |
| `--md-surface-container-lowest` | `#ffffff` |
| `--md-surface-container-low` | `#f1f4fa` |
| `--md-surface-container` | `#ebeef4` |
| `--md-surface-container-high` | `#e5e8ee` |
| `--md-surface-container-highest` | `#dfe3e8` |
| `--md-surface-variant` | `#dfe3e8` |
| `--md-on-surface` | `#181c20` |
| `--md-on-surface-variant` | `#554245` |
| `--md-inverse-surface` | `#2d3135` |
| `--md-inverse-on-surface` | `#eef1f7` |
| `--md-outline` | `#887275` |
| `--md-outline-variant` | `#dac0c4` |
| `--md-surface-tint` | `#9f3c59` |
| `--md-background` | `#f7f9ff` |
| `--md-on-background` | `#181c20` |

### Primary (Burdéo)

| Token | Valor |
|-------|-------|
| `--md-primary` | `#5c0427` |
| `--md-on-primary` | `#ffffff` |
| `--md-primary-container` | `#7a1f3d` |
| `--md-on-primary-container` | `#ff8ba8` |
| `--md-inverse-primary` | `#ffb1c2` |
| `--md-primary-fixed` | `#ffd9df` |
| `--md-primary-fixed-dim` | `#ffb1c2` |
| `--md-on-primary-fixed` | `#3f0018` |
| `--md-on-primary-fixed-variant` | `#802442` |

### Secondary (Rosa)

| Token | Valor |
|-------|-------|
| `--md-secondary` | `#97425b` |
| `--md-on-secondary` | `#ffffff` |
| `--md-secondary-container` | `#ff97b2` |
| `--md-on-secondary-container` | `#7a2c45` |
| `--md-secondary-fixed` | `#ffd9e0` |
| `--md-secondary-fixed-dim` | `#ffb1c3` |
| `--md-on-secondary-fixed` | `#3f0019` |
| `--md-on-secondary-fixed-variant` | `#792b44` |

### Tertiary (Rosa Oscuro)

| Token | Valor |
|-------|-------|
| `--md-tertiary` | `#5e002b` |
| `--md-on-tertiary` | `#ffffff` |
| `--md-tertiary-container` | `#7e1941` |
| `--md-on-tertiary-container` | `#ff8bad` |
| `--md-tertiary-fixed` | `#ffd9e1` |
| `--md-tertiary-fixed-dim` | `#ffb1c5` |
| `--md-on-tertiary-fixed` | `#3f001b` |
| `--md-on-tertiary-fixed-variant` | `#841e45` |

### Error

| Token | Valor |
|-------|-------|
| `--md-error` | `#ba1a1a` |
| `--md-on-error` | `#ffffff` |
| `--md-error-container` | `#ffdad6` |
| `--md-on-error-container` | `#93000a` |

### Alias legacy (compatibilidad)

| Variable | Mapea a | Valor |
|----------|---------|-------|
| `--primary` | `--md-primary` | `#5c0427` |
| `--primary-dark` | `--md-on-primary-fixed` | `#3f0018` |
| `--primary-light` | `--md-primary-container` | `#7a1f3d` |
| `--accent` | `--md-secondary` | `#97425b` |
| `--accent-light` | `--md-secondary-container` | `#ff97b2` |
| `--danger` | `--md-error` | `#ba1a1a` |

### Gray Scale

Derivada de la paleta MD3, con tonos neutros de fondo.

| Variable | Valor |
|----------|-------|
| `--gray-50` | `#f7f9ff` |
| `--gray-100` | `#f1f4fa` |
| `--gray-200` | `#e5e8ee` |
| `--gray-300` | `#d7dae0` |
| `--gray-400` | `#b8b1b4` |
| `--gray-500` | `#887275` |
| `--gray-600` | `#554245` |
| `--gray-700` | `#3f3a3b` |
| `--gray-800` | `#2d3135` |
| `--gray-900` | `#181c20` |

---

## Paleta por Rol

### TÉCNICO (Academic IT Operations)

La paleta del rol `TECNICO` sobrescribe los tokens MD3 globales cuando `[data-rol="TECNICO"]` está activo en `<html>`. Es la misma paleta primaria (Burdéo `#5c0427`) pero con secundario y terciario ajustados al contexto IT.

| Token | General (`:root`) | Técnico (`[data-rol="TECNICO"]`) |
|-------|-------------------|-----------------------------------|
| `--md-surface` | `#f7f9ff` | `#f8f9fb` (más frío, tech) |
| `--md-secondary` | `#97425b` (rosa) | `#595f67` (gris técnico) |
| `--md-secondary-container` | `#ff97b2` | `#dde3ec` |
| `--md-tertiary` | `#5e002b` (rosa oscuro) | `#002b5a` (azul) |
| `--md-tertiary-container` | `#7e1941` | `#004182` |
| `--md-inverse-surface` | `#2d3135` | `#2e3132` |

**Tipografía específica:** escala más compacta para densidad de datos:

| Variable | General | Técnico |
|----------|---------|---------|
| `--text-display-lg` | 700 40px/48px | 700 34px/42px |
| `--text-display-lg-mobile` | 700 34px/42px | 700 28px/34px |
| `--text-headline-md` | 600 22px/28px | 600 24px/32px |
| `--text-title-sm` | 600 18px/24px | 600 18px/24px (igual) |
| `--text-body-md` | 400 14px/20px | 400 16px/24px (más grande) |
| `--text-label-caps` | 700 12px/16px 0.05em | 700 12px/16px 0.05em (igual) |
| `--text-caption` | 400 11px/14px | 400 12px/16px |

`--text-label-caps` es nuevo: para etiquetas de metadatos tipo `SERIAL NUMBER`, `LOCATION`.

---

## Tipografía

**Familia:** `Roboto Flex` (variable font)

### Escala

| Variable | Peso | Tamaño | Line H | Letter Sp |
|----------|------|--------|--------|-----------|
| `--text-display-lg` | 700 | 40px | 48px | -0.5px |
| `--text-headline-lg` | 600 | 28px | 36px | — |
| `--text-headline-lg-mobile` | 600 | 24px | 32px | — |
| `--text-title-lg` | 600 | 20px | 28px | — |
| `--text-title-md` | 600 | 16px | 24px | — |
| `--text-body-lg` | 400 | 16px | 24px | — |
| `--text-body-md` | 400 | 14px | 20px | — |
| `--text-label-md` | 500 | 12px | 16px | 0.5px |
| `--text-caption` | 400 | 11px | 14px | — |

### Font stacks

| Variable | Valor |
|----------|-------|
| `--font-display` | `'Roboto Flex', system-ui, -apple-system, sans-serif` |
| `--font-body` | `'Roboto Flex', system-ui, -apple-system, sans-serif` |

---

## Espaciado

Baseline: **4px**.

| Variable | Rem | Píxeles |
|----------|-----|---------|
| `--spacing-xs` | 0.25rem | 4px |
| `--spacing-sm` | 0.5rem | 8px |
| `--spacing-md` | 1rem | 16px |
| `--spacing-lg` | 1.5rem | 24px |
| `--spacing-xl` | 2rem | 32px |
| `--spacing-2xl` | 3rem | 48px |
| `--spacing-gutter` | 0.75rem | 12px |
| `--spacing-container-margin` | 1rem | 16px |

---

## Bordes redondeados

| Variable | Valor | Uso típico |
|----------|-------|-----------|
| `--radius-sm` | 0.25rem | Elementos pequeños |
| `--radius` | 0.5rem | Default (DEFAULT del YAML) |
| `--radius-md` | 0.75rem | Cards medianos |
| `--radius-lg` | 1rem | Cards grandes |
| `--radius-xl` | 1.5rem | Modales, sheets |
| `--radius-full` | 9999px | Pills, avatares |

---

## Sombras

| Variable | Valor |
|----------|-------|
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.04)` |
| `--shadow-md` | `0 2px 8px rgba(0,0,0,0.06)` |
| `--shadow-lg` | `0 4px 16px rgba(0,0,0,0.08)` |

---

## Modo Claro / Oscuro

Definido en `html[data-theme="dark"]` y `html[data-theme="light"]`.

| Variable | Light | Dark |
|----------|-------|------|
| `--text-primary` | `--md-on-surface` | `--md-inverse-on-surface` |
| `--text-secondary` | `--md-on-surface-variant` | `--md-outline` |
| `--bg-primary` | `--md-surface` | `--md-inverse-surface` |
| `--bg-secondary` | `--md-surface-container-low` | `#1f2937` |
| `--bg-card` | `--md-surface-container-lowest` | `#374151` |
| `--border` | `--md-outline-variant` | `#4b5563` |

---

## Skin Base (`skin.css`)

Las variables `--skin-*` del skin base ahora referencian los tokens MD3:

| Variable | Referencia |
|----------|-----------|
| `--skin-nav-bg` | `var(--md-surface-container-lowest)` |
| `--skin-nav-text` | `var(--md-on-surface-variant)` |
| `--skin-nav-text-active` | `var(--md-primary)` |
| `--skin-header-bg` | `var(--md-primary)` |
| `--skin-header-text` | `var(--md-on-primary)` |
| `--skin-header-gradient` | `var(--md-primary)` → `var(--md-primary-container)` |
| `--skin-card-bg` | `var(--md-surface-container-low)` |
| `--skin-card-radius` | `var(--radius-lg)` |
| `--skin-card-shadow` | `var(--shadow-sm)` |
| `--skin-page-bg` | `var(--md-surface)` |
| `--skin-font-family` | `var(--font-body)` |

Los skins reales (Profesional, Juvenil, Senior) sobrescriben solo `--skin-*` — **no** los tokens `--md-*` ni los alias legacy.
