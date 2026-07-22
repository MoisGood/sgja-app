# Editor de Formularios 2 — Documentación Completa

**Archivo:** `public/EditForm2.html` (419 líneas)
**Backup:** `MD2/EDITOR_BACKUP_*.html`
**Propósito:** Editor visual de formularios con soporte de secciones (wizard) y posicionamiento absoluto de campos.

---

## 1. Estructura General

```
┌─────────────────────────────────────────────────────────┐
│  Archivo ▼   Editar ▼                                   │ ← Menú superior
├─────────────────────────────────────────────────────────┤
│  [Nombre JSON]  [📤 Exportar] [📥 Importar]  3 campos 📋│ ← Toolbar
├─────────────────────────────────────────────────────────┤
│  ┌─ Panel Izquierdo ────┬─── Área de trabajo ──────────┐│
│  │  Campos              │  ┌─ Sección 1 de 2 ────────┐ ││
│  │  ➕ Texto            │  │  (min-height: 500px)     │ ││
│  │  ➕ Fecha            │  │  [Campo]  [Campo]        │ ││
│  │  ➕ Texto largo      │  └──────────────────────────┘ ││
│  │  ➕ Casilla          │  ┌─ Sección 2 de 2 ────────┐ ││
│  │  ✍️ Firma            │  │  (min-height: 500px)     │ ││
│  │                      │  │  Arrastra campos aquí    │ ││
│  │  SECCIONES           │  └──────────────────────────┘ ││
│  │  ➕ Agregar sección  │                              ││
│  │  ✖️ Eliminar sección │                              ││
│  └──────────────────────┴──────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

---

## 2. Layout (HTML)

### Panel izquierdo (`panel-izq`)
- **Campos:** Botones para agregar: Texto, Fecha, Texto largo, Casilla, Firma individual
- **Secciones:** Botones para Agregar y Eliminar sección

### Centro (`centro`)
- **Menú superior:** Archivo (Nuevo, Importar, Exportar) + Editar (Deshacer, Limpiar)
- **Toolbar:** Input nombre JSON + botones Exportar/Importar + contador de campos
- **Área de trabajo:** Secciones apiladas verticalmente, cada una con min-height 500px

### Panel derecho (`panel-der`)
- **Ajustes de campos:** Propiedades del campo o sección seleccionada
  - 📋 Propiedades (label, placeholder, opciones según tipo)
  - 📐 Dimensiones (X, Y, Ancho, Alto, Z-Index, Layout)
  - 🎨 Apariencia (colores, opacidad, fuente, esquinas, sombra)
  - 🧱 Bordes (General, Superior, Inferior, Izquierdo, Derecho)

---

## 3. JavaScript — Estado Global

```javascript
let campos = [];           // Array de objetos campo
let seleccionado = null;   // ID del campo seleccionado
let secciones = [{ id: 's1', label: 'Sección 1', num: 1 }];  // Array de secciones
let seccionActiva = 's1';  // ID de la sección activa
const STORAGE_KEY = 'editor_form_v1';
```

### Estructura de un campo:
```javascript
{
  id: string,          // único
  tipo: string,        // 'text' | 'textarea' | 'date' | 'checkbox' | 'firma'
  label: string,       // etiqueta visible
  seccion: string,     // ID de la sección a la que pertenece
  x: number,           // posición X dentro de la sección
  y: number,           // posición Y dentro de la sección
  placeholder: string, // placeholder (text, textarea)
  firmaLabel: string,  // texto bajo la línea (firma)
  labelCheckbox: string, // texto al lado del checkbox
  valor: string,       // valor por defecto
  rows: number,        // filas para textarea
  opciones: [string],  // opciones para select/radio
  width: string,       // ancho custom
  height: string,      // alto custom
  zIndex: number,      // orden de apilamiento
  ancho: string,       // 'full' | 'half'
  bgColor: string,     // color de fondo
  fontColor: string,   // color de texto
  borderColor: string, // color de borde
  campoOpacity: number,// opacidad
  textAlign: string,   // alineación texto
  fontSize: string,    // tamaño fuente
  fontWeight: string,  // peso fuente
  borderRadius: string,// esquinas redondeadas
  boxShadow: string,   // sombra
  borderGeneral: string, // borde general: "1px solid #000"
  borderTop: string, borderBottom: string, borderLeft: string, borderRight: string,
  accept: string,      // tipos de archivo (file)
  maxSize: number,     // tamaño máximo (file)
}
```

### Estructura de una sección:
```javascript
{
  id: string,     // único
  label: string,  // "Sección 1", "Sección 2", etc.
  num: number,    // número de sección
}
```

---

## 4. Funciones Principales

| Función | Descripción |
|---------|-------------|
| `agregar(tipo)` | Agrega un campo a la sección activa. Calcula Y basado en otros campos de la misma sección |
| `agregarSeccion()` | Crea una nueva sección al final del array y la activa |
| `eliminarSeccionActual()` | Elimina la sección activa y todos sus campos (mínimo 1 sección) |
| `render()` | Renderiza todas las secciones apiladas con sus campos dentro |
| `renderCampoHTML(c)` | Genera HTML de un campo con position:absolute |
| `seleccionar(id)` | Selecciona un campo y muestra sus propiedades |
| `mostrarPropiedades()` | Muestra propiedades del campo seleccionado (acordeones) |
| `mostrarPropiedadesSeccion(id)` | Muestra propiedades de la sección (nombre, cantidad campos, botones) |
| `actualizarProp(prop,val)` | Actualiza una propiedad del campo seleccionado |
| `actualizarSeccion(id,prop,val)` | Actualiza una propiedad de la sección |
| `iniciarDrag(e,id)` | Inicia arrastre de campo (posición absoluta) |
| `exportar()` | Exporta a JSON (campos + secciones + seccionActiva) |
| `importar(e)` | Importa desde JSON |
| `toggleListaCampos()` | Abre/cierra modal lista de campos |
| `duplicarCampo(id)` | Duplica un campo 30px abajo/derecha |
| `guardar()` | Guarda en localStorage |
| `nuevo()` | Resetea formulario |
| `limpiar()` | Elimina todos los campos |
| `deshacer()` | (pendiente) |

---

## 5. Tipos de Campos Soportados

| Tipo | Render | Props específicas |
|------|--------|-------------------|
| `text` | `<input type="text">` | placeholder |
| `textarea` | `<textarea>` | placeholder, rows |
| `date` | `<input type="date">` | - |
| `checkbox` | `<input type="checkbox"> + label` | labelCheckbox |
| `firma` | línea horizontal + label debajo | firmaLabel |
| `select` | (pendiente en UI) | opciones |
| `radio` | (pendiente en UI) | opciones |
| `file` | (pendiente en UI) | accept, maxSize |
| `label` | (pendiente en UI) | - |
| `rectangulo` | (pendiente en UI) | - |

---

## 6. Persistencia

### localStorage
- **Key:** `editor_form_v1`
- **Contenido:** `{ campos, secciones, seccionActiva }`
- **Guarda:** Al soltar un campo después de arrastrarlo
- **Carga:** Al iniciar la página

### Exportar JSON
```json
{
  "version": "1.0",
  "campos": [...],
  "secciones": [...],
  "seccionActiva": "s1"
}
```

---

## 7. Interacciones

| Acción | Comportamiento |
|--------|---------------|
| Click en "➕ Texto" | Agrega campo dentro de la sección activa |
| Click en "➕ Agregar sección" | Nueva sección al final, se activa automáticamente |
| Click en header de sección | Activa esa sección, muestra propiedades en panel izquierdo |
| Click en área de trabajo (lienzo) | Activa la sección, muestra propiedades de sección |
| Click en campo | Selecciona campo, muestra propiedades del campo en panel izquierdo |
| Arrastrar campo (desde el borde) | Mueve el campo libremente dentro de la sección |
| Click en "📋 N campos" | Abre modal con lista de todos los campos (duplicar/eliminar) |
| Ctrl+Z | Deshacer (pendiente) |
| Delete | Elimina campo seleccionado |

---

## 8. Panel de Propiedades (Acordeones)

### 📋 Propiedades
- Label (input texto)
- Placeholder (si text/textarea)
- Texto casilla (si checkbox)
- Texto bajo firma (si firma)
- Tipo de campo (solo lectura)

### 📐 Dimensiones
- X, Y (posición)
- Ancho, Alto (custom)
- Z-Index
- Layout (Completo/Mitad)

### 🎨 Apariencia
- Color fondo
- Color texto
- Color borde
- Opacidad (slider 0-1)
- Alineación (izquierda/centro/derecha)
- Fuente tamaño (8-72px)
- Fuente peso (normal/semi-bold/bold)
- Esquinas redondeadas (4px-50%)
- Sombra (CSS box-shadow)

### 🧱 Bordes
- General, Superior, Inferior, Izquierdo, Derecho
- Cada uno: grosor, estilo (solid/dashed/dotted), color, toggle activar/desactivar

---

## 9. Secciones — Modos Simple vs Wizard

| Condición | Modo | Comportamiento |
|-----------|------|----------------|
| **1 sección** | **Simple** | Formulario de una sola página |
| **2+ secciones** | **Wizard** | Formulario con navegación entre pasos |

### Características
- Mínimo 1 sección
- Cada sección = lienzo independiente con min-height 500px
- Las secciones se apilan verticalmente con separación de 32px
- Cada sección tiene header con fondo gris (#F3F4F6) y borde inferior
- Campos dentro de sección usan `position: absolute` relativo al contenedor de la sección
- Al agregar segunda sección → automáticamente modo Wizard
- En modo Wizard aparecen botones **Anterior / Siguiente** debajo de las secciones
- Se muestra badge "Simple" o "Wizard" en el header de cada sección
- Las etiquetas se actualizan automáticamente al agregar/eliminar secciones

### Navegación Wizard
```
┌─ Sección 1 de 3 ── Simple/Wizard ── 2 campos ── ✓ activa ──┐
│                                                              │
│  [campos]                                                    │
│                                                              │
│  ← Anterior                              Siguiente →         │
└──────────────────────────────────────────────────────────────┘
```

---

## 10. Modal Lista de Campos

- Acceso: Click en contador "N campos 📋" en la toolbar
- Muestra todos los campos con: icono, label, tipo
- Campo seleccionado se resalta
- Botones por campo: ⧉ Duplicar, 🗑 Eliminar

---

## 11. Selección Múltiple

- Arrastrar mouse en área vacía del lienzo → rectángulo azul de selección
- Todos los campos dentro del rectángulo quedan seleccionados
- Cortar/Pegar/Eliminar afecta a todos los seleccionados
- Click en un campo → desactiva selección múltiple

## 12. Redimensionar Campos

- Al seleccionar un campo aparecen 4 asas de redimension en las esquinas
- Arrastrar asa → cambia tamaño del campo (width/height)
- Mínimo 50px ancho, 20px alto

## 13. Wizard Navigation

| Posición | Botones |
|----------|---------|
| Primera sección | `Siguiente →` |
| Secciones intermedias | `← Anterior` `Siguiente →` |
| Última sección | `← Anterior` `✓ Finalizar` |

## 14. Menú Contextual (clic derecho)

- `✂️ Cortar campo` - corta el/los campo(s) seleccionado(s)
- `📋 Pegar campo aquí` - pega en la sección activa
- `🗑️ Eliminar campo(s)` - elimina selección

---

## Historial de Cambios

| Fecha | Cambio |
|-------|--------|
| 2026-07-? | Creación inicial |
| 2026-07-? | Agregado posicionamiento absoluto |
| 2026-07-? | Agregadas propiedades (bordes, colores, sombras) |
| 2026-07-? | Agregado sistema de secciones (wizard) |
| 2026-07-? | Cada sección = lienzo independiente 500px |
| 2026-07-? | Panel izquierdo: propiedades según selección (campo/sección) |
| 2026-07-? | Backup documentado en MD2/ |
| 2026-07-? | Selección múltiple con rectángulo |
| 2026-07-? | Redimensionar campos con asas (esquinas) |
| 2026-07-? | Wizard: Siguiente/Anterior/Finalizar |
| 2026-07-? | Cortar/Pegar múltiples campos |
| 2026-07-? | Menú contextual (clic derecho) |
