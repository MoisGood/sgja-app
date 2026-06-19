---
name: Academic IT Operations System
colors:
  surface: '#f8f9fb'
  surface-dim: '#d9dadc'
  surface-bright: '#f8f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f6'
  surface-container: '#edeef0'
  surface-container-high: '#e7e8ea'
  surface-container-highest: '#e1e2e4'
  on-surface: '#191c1e'
  on-surface-variant: '#554245'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f3'
  outline: '#887275'
  outline-variant: '#dac0c4'
  surface-tint: '#9f3c59'
  primary: '#5c0427'
  on-primary: '#ffffff'
  primary-container: '#7a1f3d'
  on-primary-container: '#ff8ba8'
  inverse-primary: '#ffb1c2'
  secondary: '#595f67'
  on-secondary: '#ffffff'
  secondary-container: '#dde3ec'
  on-secondary-container: '#5f656d'
  tertiary: '#002b5a'
  on-tertiary: '#ffffff'
  tertiary-container: '#004182'
  on-tertiary-container: '#7dafff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffd9df'
  primary-fixed-dim: '#ffb1c2'
  on-primary-fixed: '#3f0018'
  on-primary-fixed-variant: '#802442'
  secondary-fixed: '#dde3ec'
  secondary-fixed-dim: '#c1c7d0'
  on-secondary-fixed: '#161c23'
  on-secondary-fixed-variant: '#41474f'
  tertiary-fixed: '#d6e3ff'
  tertiary-fixed-dim: '#a8c8ff'
  on-tertiary-fixed: '#001b3d'
  on-tertiary-fixed-variant: '#00468b'
  background: '#f8f9fb'
  on-background: '#191c1e'
  surface-variant: '#e1e2e4'
typography:
  display-lg:
    fontFamily: Roboto Flex
    fontSize: 34px
    fontWeight: '700'
    lineHeight: 42px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Roboto Flex
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  title-sm:
    fontFamily: Roboto Flex
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-md:
    fontFamily: Roboto Flex
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-caps:
    fontFamily: Roboto Flex
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
  caption:
    fontFamily: Roboto Flex
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  display-lg-mobile:
    fontFamily: Roboto Flex
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  safe-margin: 16px
  gutter: 12px
---

## Brand & Style
The design system is engineered for IT professionals operating within academic environments. The brand personality is **Agile, Reliable, and Systematic**, bridging the gap between high-level institutional authority and the fast-paced, technical nature of field support.

The visual style is **Modern-Corporate**, heavily influenced by high-performance productivity tools like Linear and Microsoft Teams. It avoids the cluttered, legacy aesthetic of traditional ERPs in favor of a clean, information-dense interface that prioritizes task completion and hardware management. The UI utilizes a refined layer-on-layer approach to depth, ensuring that technicians can navigate complex inventory and ticket data with minimal cognitive load under varying lighting conditions.

## Colors
The palette is anchored by **Institutional Burgundy**, providing a sense of officiality and prestige. This is balanced by a sophisticated range of "Tech-Neutrals" inspired by modern developer tools.

- **Primary:** #7A1F3D (Burgundy) used for key actions, brand presence, and critical status.
- **Secondary/Accent:** #2D333A (Dark Gray) provides the professional "tech" grounding, used for sidebars and headers in dark mode.
- **Surface Neutrals:** A range of grays from #F4F5F7 (Soft Wash) for backgrounds to #161B22 (Deep Charcoal) for dark mode containers.
- **Functional Colors:** Use industry-standard semantics: Green for "Resolved/SLA Met", Amber for "In Progress/Warning", and Blue for "New/Information".

In **Dark Mode**, the system shifts to a deep navy-charcoal base (similar to Linear), using subtle border-strokes rather than heavy shadows to define depth.

## Typography
The system utilizes **Roboto Flex** for its exceptional readability on mobile displays and its ability to condense or expand based on data density. 

- **Hierarchy:** Use `display-lg` exclusively for main dashboard greetings or primary KPIs. 
- **Functional Labels:** `label-caps` is used for metadata headers (e.g., "SERIAL NUMBER", "LOCATION") to differentiate from user-generated content.
- **Variable Weights:** Lean on `500` (Medium) weight for interactive elements to ensure they feel "tappable" compared to static body text.
- **Data Density:** In inventory lists, use `caption` for secondary technical specs to maximize the amount of information visible on one screen.

## Layout & Spacing
This design system follows a strict **8px square grid** to ensure alignment across diverse mobile aspect ratios. 

- **Margins:** A standard **16px side margin** is applied to all mobile views to prevent content from hitting the screen edge.
- **Touch Targets:** All interactive elements (buttons, list items) maintain a minimum height of **48px** to ensure field usability, even if the visual container is smaller.
- **Mobile-First Reflow:** For tablet views, the layout transitions from a single-column ticket list to a "Master-Detail" split view, where the list resides on the left and ticket details on the right.
- **PWA Considerations:** Ensure a bottom-safe-area of 24px is reserved for modern mobile gesture bars, keeping the Bottom Navigation clear.

## Elevation & Depth
Depth is used sparingly to maintain the "Agile" feel of a modern SaaS tool.

1.  **Level 0 (Base):** Background color. In dark mode, this is the darkest neutral.
2.  **Level 1 (Cards):** 1px subtle border (#E1E4E8 in light, #30363D in dark) with a soft 4px blur shadow. This is used for Tickets and Inventory items.
3.  **Level 2 (Modals/Sheets):** Higher elevation with a 12px blur shadow. Used for quick-add forms and QR scan confirmation sheets.
4.  **Floating Elements:** The "QR Scan" action is treated as a floating action button (FAB) or a high-contrast center item in the navigation bar to signify its priority.

## Shapes
The shape language is **distinctly rounded (16px)** to provide a friendly, modern contrast to the technical data it contains.

- **Main Containers:** 16px (rounded-lg) for cards and main modules.
- **Inputs & Buttons:** 8px (standard rounded) to maintain a professional, slightly tighter look.
- **Badges:** Fully rounded (pill) for status indicators like "Priority" or "SLA Status" to distinguish them from interactive buttons.
- **Indoor Map Elements:** 4px radius for room blocks on interactive maps to maintain architectural accuracy while staying within the design language.

## Components

### Bottom Navigation
A fixed navigation bar containing: **Inicio, Historial, QR (Central Accent), Inventario, and Configuración**. The QR icon should be housed in a high-contrast circular container that breaks the top plane of the navigation bar slightly.

### Compact Ticket Cards
Designed for "scannability."
- **Top Row:** Ticket ID (monospaced-style Roboto) and Status Badge.
- **Middle Row:** Title (bold) and Subject Building/Room.
- **Bottom Row:** Time-elapsed counter and Assigned Technician avatar.

### Status Badges (SLA/Priority)
- **Urgent:** Primary Burgundy background with white text.
- **Standard:** Soft Gray background with Dark Gray text.
- **Overdue:** Subtle pulse animation on the border.

### Mobile Forms
- **Input Fields:** Labeled with floating text to save vertical space.
- **Selection:** Use bottom-sheet pickers rather than dropdown menus to ensure ease of use with one hand.

### Interactive Maps
Indoor navigation elements should use a "Ghost Layout" (light gray walls) with the technician's current location marked in Primary Burgundy. Rooms are interactive "tappable" zones that reveal equipment counts.