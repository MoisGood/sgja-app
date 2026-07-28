# Avance General — Proyecto SGJA/AGIL

**Fecha:** 2026-07-27
**Alcance:** Editor de formularios, formulario de accidente y módulo de justificaciones

---

## 1. Editor Visual de Formularios (`EDITOR_HTML_20260723.html`)

### Estado actual
- **Ubicación trabajo:** `MD2/EDITOR_HTML_20260723.html` (1.224 líneas, standalone, sin dependencias)
- **Vista previa:** `MD2/previaform.html`
- **Modelo de datos:** campos con `fila` + `seccion` (flexbox real, sin posición absoluta)
- **Persistencia:** localStorage `editor_form_v2` + JSON export/import + HTML export/import (round-trip)

### Campos disponibles
| Tipo | Notas |
|------|-------|
| `text`, `textarea`, `date`, `time` | Con placeholder, maxlength, pattern |
| `checkbox`, `label`, `firma`, `linea`, `spacer` | Línea con color/grosor/estilo/degradado |
| `buscarut` | Input RUT + botón Buscar |
| `tabla` | Cabeceras y filas configurables |

### Versiones completadas (23–27 Jul 2026)
| Ver | Contenido |
|-----|-----------|
| v4 | Exporta HTML con CSS del proyecto (flexbox, `.campo`, `.field-row`) |
| v5 | Reescritura canvas: de absoluto (x,y) a flexbox con modelo `fila` |
| v6 | Undo/Redo (50), confirmaciones, ghost drag, indicador guardado, atajos |
| v7 | Reorden en fila (drop zones), buscador de campos, preview mobile, templates, validación `name` |
| v8 | Badge `Simple` → `Formulario`; vista previa/export: 1 sección = `Formulario`, varias = `Seccion N de M` + `Wizard`; import mapea `Formulario` → `Seccion 1` |

---

## 2. Formulario de Accidente Escolar

### Archivos
| Archivo | Propósito |
|---------|-----------|
| `public/formulario.html` | Formulario (flexbox, sin overlaps) |
| `src/pages/RegistrarAccidente.tsx` | Página que lo integra (lee testigo 1 y 2) |
| `src/services/pdf.service.ts` | Generación PDF |
| `src/pages/VistaPreviaPDF.tsx` | Vista previa + imprimir |

### Completado (v1–v3, ver `MEJORAS_FORMULARIO.md`)
- Reescritura flexbox completa, validaciones, RUT automático, testigo 2 con toggle
- Textarea con contador X/347, secciones con fondo alterno, globo de campos vacíos

### Pendiente
| # | Mejora | Archivos |
|---|--------|----------|
| 36 | Agregar testigo 2 al PDF | `pdf.service.ts` |
| 37 | Guardado real en Supabase (iframe → backend) | `RegistrarAccidente.tsx`, `accidentes.service.ts` |
| 38 | Edición de accidentes existentes | `RegistrarAccidente.tsx`, `formulario.html` |
| 39 | Validación por paso (opcional) | `formulario.html` |
| 40 | Mapeo completo campos → columnas BD | `formulario.html`, SQL |

---

## 3. Módulo Justificaciones — Tab Registrar (27 Jul 2026) ✅ NUEVO

### Estructura
```
/inspectoria/justificaciones  (AppContent.tsx:569)
└── JustificacionesTabs.tsx        ← nuevo, tabs por rol
    ├── "Gestion de Pases"  → GestionPases.tsx      (ADMIN, INSPECTOR, PROFESOR)
    └── "Registrar"         → RegistrarJustificacion (ADMIN, INSPECTOR, PARADOCENTE)
```

### Cambio realizado
Se reemplazó la UI del tab Registrar extrayendo el diseño de `public/Justificar1.html`,
**manteniendo toda la funcionalidad existente** (lista en tiempo real, filtros, paginación, modal).

### Nuevo diseño implementado
| Elemento | Detalle |
|----------|---------|
| Encabezado | "Justificación" 36px + Fecha + Hora (pre-llenados, editables) |
| Lookup RUT | Botón Buscar → NOMBRE (readonly) + **CURSO** (readonly, autocompletado) + badge **ESTADO** |
| Badge estado | Justificado 🟢 / Injustificado 🔴 / Sin registro hoy ⚪ |
| Sin registro | Aviso amarillo + botón "Crear justificación" → confirma → modal → **crea y justifica en 1 paso** |
| Motivos del pase | Atraso / Inasistencia con comportamiento **radio** (uno u otro) |
| Funcionario(a) | Muestra nombre del usuario logueado + línea de firma |
| Tabla | 8 columnas: Rut, Nombre, Curso, Fecha, Hora, **Profesor** (nueva), **Tipo**, **Estado** (badge) |

### Archivos modificados
- `src/components/RegistrarJustificacion.tsx` — UI reescrita con el diseño del HTML
- `src/pages/RegistrarJustificacion.tsx` — lookup RUT, carga profesores, flujo crear+justificar
- `src/pages/JustificacionesTabs.tsx` — contenedor de tabs (archivo nuevo)

### Decisiones tomadas con el usuario
- RUT ya **no** filtra la tabla: es solo lookup individual
- Si no hay registro hoy → opción de crear la justificación (el mismo usuario la justifica)
- Columnas tabla = HTML + Tipo (8 columnas)
- Visualización por perfil: sin cambios (gobernada por `JustificacionesTabs`)

---

## 4. Validación

| Check | Resultado |
|-------|-----------|
| `tsc -b` | ✅ Sin errores |
| `eslint` (archivos tocados) | ✅ Sin errores |
| `vitest run` | ✅ 106 tests pasando (12 archivos) |

---

## 5. Estado git (sin commitear)

- `MD2/EDITOR_HTML_20260723.html`, `MD2/previaform.html`, `MD2/MEJORAS_FORMULARIO.md` (nuevos)
- `src/pages/JustificacionesTabs.tsx` (nuevo)
- `src/pages/RegistrarJustificacion.tsx`, `src/components/RegistrarJustificacion.tsx` (reescritos)
- `public/formulario.html`, `public/previaform.html`, `public/EditForm2.html` (modificados)
- Varios `src/` (AppContent, pdf.service, RegistrarAccidente, etc.) modificados

**Nota:** `public/previaform.html` aún tiene el texto antiguo del badge (`Simple`); sincronizar con `MD2/previaform.html` al desplegar.

---

## 6. Próximos pasos

- [ ] Probar tab Registrar en dev: lookup RUT, crear justificación, tabla con Profesor/Estado
- [ ] Sincronizar `public/previaform.html` con versión MD2
- [ ] Pendientes del formulario de accidente (#36–#40)
