# CFB-EDITOR — Editor de Formularios Visual

**Fecha:** 2026-07-19
**Archivo:** `public/EditForm2.html`
**Estado:** ✅ CFB (Código Funcionando Bien)
**Metodología:** Ver `MD2/CFB_METODOLOGIA.md`

---

## Definición

Este documento es la **certificación CFB-R-MD** del editor de formularios. Sigue la metodología definida en `CFB_METODOLOGIA.md`.

**CFB** = Código funcionando bien. Es el estado actual del editor, que se sabe funcional y visualmente correcto.

A partir de aquí, cualquier cambio será una **M-CFB** (mejora sobre el CFB):
- No se altera el CFB existente
- Solo se agregan utilidades o mejoras por encima
- Si una mejora rompe algo, se revierte al CFB

---

## Archivos de respaldo

| Archivo | Descripción |
|---------|-------------|
| `MD2/CFB_20260719_*.html` | Backup del CFB (este estado) |
| `MD2/EDITOR_BACKUP_20260719_*.html` | Backups anteriores |

---

## Lo que incluye el CFB actual

### Campos funcionales
- ✅ Texto (`text`)
- ✅ Fecha (`date`)
- ✅ Texto largo (`textarea`)
- ✅ Hora (`time`)
- ✅ Checkbox (`checkbox`) — con texto "Opción" por defecto, editable desde "Label" o "Texto casilla"
- ✅ Firma (`firma`)
- ✅ Rectángulo (`rectangulo`)
- ✅ Buscador (`search`)
- ✅ Título (`label`)

### Secciones
- ✅ Múltiples secciones con modo Wizard
- ✅ Navegación Anterior / Siguiente / Finalizar
- ✅ Propiedades de sección (nombre, ancho, alto, color fondo)

### Interacciones
- ✅ Arrastrar campos libremente
- ✅ Redimensionar con asas en esquinas
- ✅ Selección múltiple con rectángulo azul
- ✅ Menú contextual (clic derecho): cortar/pegar/eliminar
- ✅ Clic en área vacía deselecciona campos
- ✅ Modal de lista de campos con duplicar/eliminar

### Panel de propiedades
- ✅ 📋 Propiedades (label, placeholder, etc. según tipo)
- ✅ 📐 Dimensiones (X, Y, Ancho, Alto, Z-Index, Layout)
- ✅ 🎨 Apariencia (colores, opacidad, fuente, esquinas, sombra)
- ✅ 🧱 Bordes (General y por lado)

### Sombra
- ✅ 7 presets visuales (Sin, Sutil, Suave, Media, Notable, Grande, Elevada)
- ✅ Ajuste fino: X, Y, Desenfoque, Expansión, Opacidad, Color
- ✅ Actualización en tiempo real

### Persistencia
- ✅ localStorage (auto-guardado)
- ✅ Exportar/Importar JSON

---

## Reglas para M-CFB

1. No modificar funciones existentes del CFB
2. Solo agregar nuevas funciones, utilidades o mejoras
3. Si se necesita alterar el CFB, se documenta y se crea un nuevo CFB

---

## M-CFB aplicados

### M-CFB #1 — Navegación dentro de cada sección

**Cambio:** La navegación wizard se movió **dentro de cada sección activa** (antes estaba después de todas las secciones).

**Lógica:**
| Secciones | Posición | Botón izquierdo | Botón derecho |
|-----------|----------|----------------|---------------|
| 1 | única | *(sin navegación)* |
| 2+ | 1ª | — | **Siguiente →** |
| 2+ | última | **← Anterior** | **✓ Finalizar** |
| 3+ | del medio | **← Anterior** | **Siguiente →** |

**Código:** Se reemplazó el bloque de navegación global por uno condicional dentro del `forEach` de secciones, usando `esActiva && secciones.length >= 2`.

**Archivos respaldo:**
- `MD2/EDITOR_BACKUP_20260719_*.html`

---

### M-CFB #2 — Forma "Línea" con rotación, difuminado y largo

**Nuevo campo:** `linea` — línea horizontal decorativa.

**Propiedades exclusivas:**

| Propiedad | Control | Descripción |
|-----------|---------|-------------|
| Largo | Input texto | `100%`, `400px`, `50%`, etc. |
| Rotación | Input numérico | 0° horizontal, 90° vertical |
| Difuminar extremos | Checkbox | Fade suave en bordes con `mask-image` |
| Estilo línea | 🧱 Bordes | Grosor, estilo (solid/dashed/dotted), color |
| Sombra | 🎨 Apariencia | Box-shadow sobre la línea |

---

### M-CFB #3 — Cabecera de tipo oculta en Textarea

El tipo `textarea` ya no muestra "textarea" como cabecera del campo.

---

### M-CFB #4 — Checkbox restaurado con mejoras

- Botón renombrado a **☑️ Checkbox**
- Texto por defecto "Opción"
- Render usa `c.labelCheckbox || c.label || 'Opción'`

---

### M-CFB #5 — Vista previa del formulario

**Archivo nuevo:** `public/previaform.html` (página independiente)

**Botón en el editor:** `👁 Vista previa` en la toolbar (guarda y abre nueva pestaña)

**Características:**
- Renderiza el formulario con posiciones absolutas (idéntico al editor)
- Muestra una sección a la vez con navegación wizard
- Empieza siempre en la sección 1
- Sin UI de edición (sin botones de eliminar, redimensionar, etc.)
- Compatible con todos los tipos de campo

**Archivos:**
- `public/previaform.html` — página de vista previa
- `MD2/PREVIAFORM_*.html` — backup

---

### M-CFB #6 — Cabecera de tipo oculta en Textarea

El tipo `textarea` ya no muestra "textarea" como cabecera del campo.

---

### M-CFB #7 — Autocompletar formulario al seleccionar estudiante

**Cambio:** Al seleccionar un estudiante en el buscador, se autocompletan automáticamente los campos del formulario de accidente.

**Archivos afectados:**
- `src/pages/RegistrarAccidente.tsx`
- `src/services/establecimientos.service.ts` (ya existía, solo se importó)

**Lógica de autocompletado:**

| Campo | Fuente | Sección |
|-------|--------|---------|
| `nombre_establecimiento` | `establecimiento.nombre` (desde BD) | 1 |
| `curso` | `estudiante.curso` | 1 |
| `apellido_paterno` | 1ª palabra de `nombre_completo` | 2 |
| `apellido_materno` | 2ª palabra de `nombre_completo` | 2 |
| `nombres` | Resto de palabras de `nombre_completo` | 2 |

**Comportamiento:**
- Si el iframe ya cargó, autocompleta al instante al seleccionar estudiante
- Si el iframe no ha cargado, se autocompleta cuando termine de cargar (`onLoad`)
- `ciudad` y `comuna` quedan pendientes hasta definir su fuente de datos
- `horario` queda para que lo rellene el usuario manualmente

**Respaldos:**
- `MD2/RegistrarAccidente_CFB_20260720_*.tsx.bak`
- `MD2/FORMULARIO_ACCIDENTE_CFB_20260720_*.html`

---

### M-CFB #8 — Generar PDF relleno con datos del formulario

**Cambio:** Al hacer clic en "PDF" se genera el PDF oficial de Declaración Individual de Accidente Escolar con los datos del formulario dibujados en las secciones A, B y C.

**Archivos nuevos:**
- `src/services/pdf.service.ts` — Servicio que usa `pdf-lib` para dibujar texto sobre el PDF original

**Archivos modificados:**
- `src/pages/RegistrarAccidente.tsx` — Botón "PDF" que recolecta datos y abre el PDF relleno

**Mapeo de datos al PDF:**

| Sección | Campo PDF | Origen |
|---------|-----------|--------|
| A | Nombre Establecimiento | `establecimiento.nombre` |
| A | Curso | `estudiante.curso` |
| A | Fecha Registro | Fecha actual del sistema |
| B | Apellido Paterno / Materno / Nombres | Dividido de `nombre_completo` |
| B | Sexo | Checkbox Femenino/Masculino del form |
| B | Edad / Año Nacimiento | Campos del formulario |
| C | Hora / Fecha Accidente | Campos del formulario |
| C | Día Semana (1-7) | Calculado desde la fecha |
| C | Tipo Accidente | Checkbox Trayecto/Escuela |
| C | Circunstancia | Textarea descripción |

**Comportamiento:**
- Botón "PDF" deshabilitado hasta seleccionar un estudiante
- Genera el PDF, elimina la página de instrucciones
- Abre el PDF en una nueva pestaña para revisión e impresión
- Usa coordenadas estimadas sobre A4 (595×842 pt) — ajustables si hay desviación

**Edge cases:**
- ✅ Texto largo se trunca con "…" si excede el ancho del campo
- ✅ Campos vacíos se omiten (no se dibujan)
- ✅ Si no hay checkbox de sexo/tipo, se envía vacío

**Dependencia nueva:** `pdf-lib`

---

## Estado final del editor (780 líneas)

**Campos disponibles:**
```
➕ Texto      ➕ Fecha       ➕ Texto largo
☑️ Checkbox   ✍️ Firma       🏷️ Título
🕐 Hora       ⬜ Rectángulo  ➖ Línea
🔍 Buscador
```

**Archivos:**
| Archivo | Descripción |
|---------|-------------|
| `public/EditForm2.html` | Editor final (780 líneas) |
| `MD2/EDITOR_FINAL_*.html` | Backup final |
| `MD2/CFB_BASELINE.md` | Este documento |
