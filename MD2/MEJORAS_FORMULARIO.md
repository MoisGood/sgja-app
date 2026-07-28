# Mejoras Formulario Accidente Escolar

**Archivo:** `public/formulario.html`
**Fecha inicio:** 22 Jul 2026
**Ultima actualizacion:** 23 Jul 2026
**Regla:** No perder posiciones visuales de las casillas

---

## Lista de mejoras

### Completadas (v1 — Grid, 14 puntos)
Todos los 14 puntos originales completados.

### Completadas (v2 — Reescritura completa)
| # | Estado | Mejora | Archivos |
|---|--------|--------|----------|
| 15 | ✅ Completado | Reescritura completa: Flexbox layout sin overlaps | `formulario.html` |
| 16 | ✅ Completado | Eliminar todos los `position:absolute` y CSS Grid overlaps | `formulario.html` |
| 17 | ✅ Completado | Proporciones de campos corregidas (NOMBRE=fx3, CIUDAD=fx1) | `formulario.html` |
| 18 | ✅ Completado | Sexo (MASCULINO/FEMENINO) como columna aparte, sin overlap | `formulario.html` |
| 19 | ✅ Completado | Dias de la semana como `chk-group` flex, sin overlap | `formulario.html` |
| 20 | ✅ Completado | Separador visual entre filas (bordes y spacing) | `formulario.html` |
| 21 | ✅ Completado | Responsive mobile: field-row se apila en columna | `formulario.html` |

| # | Estado | Mejora | Archivos |
|---|--------|--------|----------|
| 1 | ✅ Completado | Reemplazar `position:absolute` por CSS Grid | `formulario.html` |
| 2 | ✅ Completado | Agregar validacion (required, RUT, fechas) | `formulario.html` |
| 3 | ✅ Completado | Reemplazar `soloUno()` JS fragil por radio buttons nativos | `formulario.html` |
| 4 | ✅ Completado | Agregar labels accesibles (`for` + `id`) | `formulario.html` |
| 5 | ✅ Completado | Agregar `id` a todos los inputs | `formulario.html` |

### Importantes

| # | Estado | Mejora | Archivos |
|---|--------|--------|----------|
| 6 | ✅ Completado | Mover inline styles a clases CSS | `formulario.html` |
| 7 | ✅ Completado | Agregar estados de error visuales | `formulario.html` |
| 8 | ✅ Completado | Conectar boton "Finalizar" | `formulario.html` |
| 9 | ✅ Completado | Agregar atributos `autocomplete` | `formulario.html` |
| 10 | ✅ Completado | Persistir estado entre pasos del wizard | `formulario.html` |

### Menores

| # | Estado | Mejora | Archivos |
|---|--------|--------|----------|
| 11 | ✅ Completado | Eliminar CSS duplicado | `formulario.html` |
| 12 | ✅ Completado | Placeholders descriptivos | `formulario.html` |
| 13 | ✅ Completado | Eliminar min-height fijo | `formulario.html` |
| 14 | ✅ Completado | Corregir encoding de tildes | `formulario.html` |

### Completadas (v3 — 23 Jul 2026)

| # | Estado | Mejora | Archivos |
|---|--------|--------|----------|
| 22 | ✅ Completado | Eliminar `required` de todos los campos | `formulario.html` |
| 23 | ✅ Completado | dia_semana con valores numericos (Lun=1 .. Dom=7) | `formulario.html` |
| 24 | ✅ Completado | Testigo 2 con boton toggle (+ Agregar / - Quitar) | `formulario.html` |
| 25 | ✅ Completado | `maxlength="347"` en textarea descripcion | `formulario.html` |
| 26 | ✅ Completado | Contador de caracteres X/347 en descripcion | `formulario.html` |
| 27 | ✅ Completado | Boton Imprimir eliminado del header del formulario | `formulario.html` |
| 28 | ✅ Completado | Finalizar muestra globo con campos vacios (fade-out 4s) | `formulario.html` |
| 29 | ✅ Completado | Secciones con fondo alterno (blanco / gris claro) | `formulario.html` |
| 30 | ✅ Completado | Globo centrado entre Anterior y Finalizar | `formulario.html` |
| 31 | ✅ Completado | `validarPaso()` deshabilitada (siempre retorna true) | `formulario.html` |
| 32 | ✅ Completado | Testigo 2 con formateo RUT automatico | `formulario.html` |
| 33 | ✅ Completado | RegistrarAccidente lee testigo_nombre_2 / testigo_rut_2 | `RegistrarAccidente.tsx` |
| 34 | ✅ Completado | Campo `testigos` envia ambos nombres al backend | `RegistrarAccidente.tsx` |
| 35 | ✅ Completado | VistaPreviaPDF: boton Imprimir restaurado (no fue solicitado borrarlo) | `VistaPreviaPDF.tsx` |

### Completadas (v4 — Editor HTML, 23 Jul 2026)

| # | Estado | Mejora | Archivos |
|---|--------|--------|----------|
| 41 | ✅ Completado | Editor exporta HTML con CSS del proyecto (flexbox, .campo, .field-row) | `EDITOR_HTML_20260723.html` |
| 42 | ✅ Completado | Toolbar prioriza Exportar HTML (boton azul primario) | `EDITOR_HTML_20260723.html` |
| 43 | ✅ Completado | Propiedades incluyen: name, id, clase flex (fx1/fx2/fx3) | `EDITOR_HTML_20260723.html` |
| 44 | ✅ Completado | Propiedades incluyen: maxlength, pattern para text/textarea | `EDITOR_HTML_20260723.html` |
| 45 | ✅ Completado | Campos agrupados en filas por posicion Y (tolerancia 30px) | `EDITOR_HTML_20260723.html` |
| 46 | ✅ Completado | HTML exportado responsive (mobile: field-row se apila) | `EDITOR_HTML_20260723.html` |

### Completadas (v5 — Editor Flexbox, 23 Jul 2026)

| # | Estado | Mejora | Archivos |
|---|--------|--------|----------|
| 47 | ✅ Completado | Editor reescrito: canvas usa flexbox (field-row/campo) en vez de absoluto | `EDITOR_HTML_20260723.html` |
| 48 | ✅ Completado | Modelo de datos: campos usan `fila` en vez de `x, y` | `EDITOR_HTML_20260723.html` |
| 49 | ✅ Completado | Drag & drop: mover campos entre filas y reordenar filas | `EDITOR_HTML_20260723.html` |
| 50 | ✅ Completado | Vista previa actualizada para modelo `fila` | `previaform.html` |
| 51 | ✅ Completado | Canvas = HTML exportado (WYSIWYG real) | `EDITOR_HTML_20260723.html` |
| 52 | ✅ Completado | Boton + en cada fila para agregar campo | `EDITOR_HTML_20260723.html` |
| 53 | ✅ Completado | Nueva fila + Nueva seccion desde panel izquierdo | `EDITOR_HTML_20260723.html` |

### Completadas (v6 — Fixes Criticos, 23 Jul 2026)

| # | Estado | Mejora | Archivos |
|---|--------|--------|----------|
| 54 | ✅ Completado | Undo/Redo con Ctrl+Z / Ctrl+Shift+Z (50 niveles) | `EDITOR_HTML_20260723.html` |
| 55 | ✅ Completado | Confirmacion antes de borrar campo | `EDITOR_HTML_20260723.html` |
| 56 | ✅ Completado | Feedback visual al arrastrar (ghost element) | `EDITOR_HTML_20260723.html` |
| 57 | ✅ Completado | Indicador de guardado (punto verde/gris) | `EDITOR_HTML_20260723.html` |
| 58 | ✅ Completado | Eliminado concepto de filas vacias (no se exportaban) | `EDITOR_HTML_20260723.html` |
| 59 | ✅ Completado | Save state antes de cada accion (add/delete/move) | `EDITOR_HTML_20260723.html` |
| 60 | ✅ Completado | Atajos: Delete=borrar, Escape=deseleccionar | `EDITOR_HTML_20260723.html` |

### Completadas (v7 — Mejoras UX, 23 Jul 2026)

| # | Estado | Mejora | Archivos |
|---|--------|--------|----------|
| 61 | ✅ Completado | Reordenar campos dentro de una fila (drop zones) | `EDITOR_HTML_20260723.html` |
| 62 | ✅ Completado | Busqueda de campos en panel izquierdo | `EDITOR_HTML_20260723.html` |
| 63 | ✅ Completado | Preview responsive (toggle desktop/movil 375px) | `EDITOR_HTML_20260723.html` |
| 64 | ✅ Completado | Templates: Nombre+RUT, Fecha+Hora, Telefono+Email, Direccion, Testigo | `EDITOR_HTML_20260723.html` |
| 65 | ✅ Completado | Validacion campo name (solo minusculas, numeros, _) | `EDITOR_HTML_20260723.html` |

### Completadas (v8 — Badge Formulario, 27 Jul 2026)

| # | Estado | Mejora | Archivos |
|---|--------|--------|----------|
| 66 | ✅ Completado | Editor canvas: etiqueta `Simple` -> `Formulario` (badge mantiene `Seccion 1`; con 2+ secciones sigue `Wizard`) | `EDITOR_HTML_20260723.html` |
| 67 | ✅ Completado | Vista previa: 1 seccion muestra solo `Formulario`; varias secciones mantiene `Seccion N de M` + `Wizard` | `previaform.html` |
| 68 | ✅ Completado | HTML exportado: mismo criterio que vista previa | `EDITOR_HTML_20260723.html` |
| 69 | ✅ Completado | Importar HTML: badge `Formulario` se mapea de vuelta a `Seccion 1` (round-trip consistente) | `EDITOR_HTML_20260723.html` |

### Pendientes

| # | Estado | Mejora | Archivos |
|---|--------|--------|----------|
| 36 | ⬜ Pendiente | Agregar testigo 2 al PDF (coordenadas ya existen en pdf.service.ts) | `pdf.service.ts` |
| 37 | ⬜ Pendiente | Guardado real en Supabase (flujo completo iframe -> backend) | `RegistrarAccidente.tsx`, `accidentes.service.ts` |
| 38 | ⬜ Pendiente | Edicion de accidentes existentes (carga de datos en formulario) | `RegistrarAccidente.tsx`, `formulario.html` |
| 39 | ⬜ Pendiente | Validacion por paso (re-habilitar si el usuario lo pide) | `formulario.html` |
| 40 | ⬜ Pendiente | Mapeo completo de campos formulario -> columnas BD | `formulario.html`, SQL |
