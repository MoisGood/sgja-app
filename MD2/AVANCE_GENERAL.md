# Avance General — Editor de Formularios y Proyecto SGJA

**Fecha:** 2026-07-20
**Autor:** M-CFB (Mejoras sobre Código Funcionando Bien)

---

## 1. Editor Visual de Formularios (`EditForm2.html`)

### Estado actual
- **Líneas:** ~800
- **Ubicación:** `public/EditForm2.html`
- **Propósito:** Editor WYSIWYG de formularios con secciones (wizard) y posicionamiento absoluto

### Campos disponibles
| Campo | Botón | Tipo interno |
|-------|-------|-------------|
| Texto | ➕ Texto | `text` |
| Fecha | ➕ Fecha | `date` |
| Texto largo | ➕ Texto largo | `textarea` |
| Checkbox | ☑️ Checkbox | `checkbox` |
| Firma | ✍️ Firma individual | `firma` |
| Título | 🏷️ Título | `label` |
| Hora | 🕐 Hora | `time` |
| Rectángulo | ⬜ Rectángulo | `rectangulo` |
| Línea | ➖ Línea | `linea` |
| Buscador | 🔍 Buscador | `search` |

### Funcionalidades implementadas

#### Editor base (CFB)
- ✅ Panel izquierdo (paleta de campos + secciones)
- ✅ Área de trabajo con posicionamiento absoluto
- ✅ Panel derecho de propiedades (acordeones)
- ✅ Arrastrar campos libremente
- ✅ Redimensionar con asas
- ✅ Selección múltiple con rectángulo
- ✅ Menú contextual (clic derecho)
- ✅ Modal lista de campos
- ✅ Exportar/Importar JSON
- ✅ localStorage

#### Mejoras aplicadas (M-CFB)

| # | Mejora | Detalle |
|---|--------|---------|
| 1 | Navegación wizard | Movida **dentro** de cada sección activa |
| 2 | Forma Línea | Con largo, rotación (0-360°), difuminado de extremos |
| 3 | Textarea sin cabecera | Ya no muestra "textarea" como rótulo |
| 4 | Checkbox mejorado | Renombrado, con texto por defecto "Opción" |
| 5 | Vista previa | Página `previaform.html` con wizard fiel |
| 6 | Exportar HTML | Botón que genera HTML autónomo con posiciones exactas |
| 7 | Selector de sombras | 7 presets visuales + ajuste fino (X, Y, blur, spread, opacidad, color) |

### Correcciones
- ✅ `firmaLabel` duplicado eliminado
- ✅ Checkbox usa `labelCheckbox` en vez de `labels`
- ✅ Clic en área vacía deselecciona campos
- ✅ Hover del menú contextual (CSS real)
- ✅ Acordeón no corta contenido (max-height: 2000px)

---

## 2. Integración con el Sistema (Formulario de Accidente)

### Archivos involucrados
| Archivo | Propósito |
|---------|-----------|
| `public/formulario.html` | Formulario exportado del editor (diseño exacto) |
| `src/pages/RegistrarAccidente.tsx` | Página que integra el formulario vía iframe |
| `src/services/accidentes.service.ts` | Servicios de guardado en BD |
| `supabase/migrations/031_create_accidentes_escolares.sql` | Tabla en BD |

### Flujo actual
1. El usuario navega a `/registrar-accidente` dentro del sistema
2. `RegistrarAccidente.tsx` carga `formulario.html` en un iframe
3. Barra superior: búsqueda de estudiante + botón Guardar
4. El formulario mantiene el diseño **exacto** del editor
5. Al guardar, se leen los datos del iframe y se persisten en Supabase

### Estado del formulario.html
- **29 inputs funcionales** (text, date, time, checkbox)
- **1 textarea** (descripción del accidente)
- **Navegación wizard** con 3 secciones
- **Campos con nombre único** para captura de datos
- **Envoltura `<form>`** para recolección de datos

---

## 3. Scripts de utilidad

| Script | Función |
|--------|---------|
| `scripts/convertir-formulario.cjs` | Convierte JSON del editor → componente React .tsx |
| `scripts/html-to-tsx.cjs` | Convierte HTML exportado → componente React .tsx |

---

## 4. Archivos de respaldo

| Archivo | Descripción |
|---------|-------------|
| `MD2/EDITOR_FINAL_*.html` | Backup del editor |
| `MD2/FORMULARIO_FINAL_*.html` | Backup del formulario exportado |
| `MD2/RegistrarAccidente_*.tsx.bak` | Backup del componente React |
| `MD2/CFB_BASELINE.md` | Documentación de línea base CFB |
| `MD2/AVANCES_EDITOR.md` | Avances intermedios del editor |
| `MD2/AVANCES_FINAL.md` | Documentación final de avances |
| `MD2/EDITOR_BACKUP_*.html` | Backups históricos del editor |
| `MD2/EDITOR_FORM2_DOC.md` | Documentación inicial del editor |

---

## 5. Próximos pasos posibles

- [ ] Mapeo completo de campos del formulario a columnas de BD
- [ ] Guardado de datos del formulario en la tabla accidentes_escolares
- [ ] Captura de datos del iframe mediante postMessage para guardado
- [ ] Edición de formularios guardados (carga de datos existentes)
- [ ] Más tipos de campo (select, radio, file)
- [ ] Mejora en el convertidor JSON → TSX
