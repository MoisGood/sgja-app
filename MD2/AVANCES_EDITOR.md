# Avances del Editor de Formularios (EditForm2.html)

**Última actualización:** 2026-07-19
**Archivo:** `public/EditForm2.html`
**Backup:** `MD2/EDITOR_BACKUP_20260719_*.html`

---

## Correcciones aplicadas

### 1. Bug `firmaLabel` duplicado
- **Problema:** En el panel de propiedades, el input para "Texto bajo firma" aparecía dos veces
- **Solución:** Se eliminó la línea duplicada

### 2. Checkbox usando `labels` en vez de `labelCheckbox`
- **Problema:** El render del checkbox usaba `c.labels?.[0]` en vez de `c.labelCheckbox`
- **Solución:** Corregido a `c.labelCheckbox`

### 3. Clic en área vacía no deseleccionaba campos
- **Problema:** Al hacer clic en el lienzo fuera de los campos, estos quedaban seleccionados
- **Solución:** Se agregó `seleccionado = null; seleccionMulti = []` en `soltarSelRect()`

### 4. Hover del menú contextual no funcionaba
- **Problema:** Usaba `hover:background:` como estilo inline (CSS inválido)
- **Solución:** Se agregaron clases CSS `.ctx-item:hover` y `.ctx-item-danger:hover`

### 5. Acordeón de apariencia cortaba contenido
- **Problema:** `max-height: 500px` ocultaba los controles de sombra
- **Solución:** Cambiado a `max-height: 2000px` con `overflow-y: auto`

---

## Nuevas funcionalidades

### 6. Selector de sombras visual
- **Antes:** Input de texto libre para escribir CSS box-shadow
- **Ahora:** 
  - 7 presets visuales en cuadros de 38×38px (Sin, Sutil, Suave, Media, Notable, Grande, Elevada)
  - Ajuste fino: X, Y, Desenfoque, Expansión, Opacidad, Color
  - Actualización en tiempo real sin recargar el editor
  - Soporte para sombras personalizadas no listadas en presets

**Funciones agregadas:**
- `hexToRgba(h, a)` — convierte hex + alpha a rgba()
- `parseBoxShadow(val)` — parsea CSS box-shadow en componentes {x, y, blur, spread, color, opacity}
- `actualizarSombraDetalle(id)` — actualiza la sombra desde los sliders/inputs sin recargar el panel

### 7. Tipos de campo removidos
- **Checkbox:** Temporalmente removido y restaurado con nombre "☑️ Checkbox" y texto por defecto "Opción"
- **Label / Título:** Removido del panel y render

---

## Estado actual del editor

### Campos disponibles
| Tipo | Botón | Estado |
|------|-------|--------|
| Texto | ➕ Texto | ✅ |
| Fecha | ➕ Fecha | ✅ |
| Texto largo | ➕ Texto largo | ✅ |
| Checkbox | ☑️ Checkbox | ✅ (restaurado) |
| Firma | ✍️ Firma individual | ✅ |
| Hora | 🕐 Hora | ✅ |
| Rectángulo | ⬜ Rectángulo | ✅ |
| Buscador | 🔍 Buscador | ✅ |

### Pendiente / Por mejorar
- **Select / Radio / File:** Código de propiedades existe pero sin botón para agregarlos
- **Layout "Mitad":** No tiene efecto visual al renderizar
- **Deshacer:** Pendiente implementar historial de cambios (Ctrl+Z)
- **Visibilidad de campos al agregar:** Los campos nuevos no se ven, puede requerir scroll manual (issue en revisión)
