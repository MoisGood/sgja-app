# Avance General — 2026-07-28

## Resumen de cambios

### Editor Visual de Formularios (`MD2/EDITOR_HTML_20260723.html`)
- Nuevos tipos de campo: **Card** (contenedor), **Heading** (h1-h6), **Curso** (select con opciones), **Boton**
- Cards con estado toggle: verde (presente) / rojo (ausente) + punto azul (justificado) / blanco (injustificado)
- Click en card ↔ cambia estado; click en punto ↔ alterna justificado
- Barra "Cards: Presente/Ausente/Todos verde/Todos rojo" dentro del formulario (solo si hay cards)
- Fecha y Hora con valor por defecto (hoy / hora actual)
- Preview (`previaform.html`) y exportación HTML sincronizados

### Gestión de Pases (`src/pages/GestionPases.tsx`)
- Refactorizado: students como cards (verde/rojo + punto azul)
- Seleccionar curso → muestra estudiantes como cards
- Click en card: verde → roja con punto blanco (ausente/injustificado)
- Click en punto: azul (justificado) / blanco
- Botón "Registrar Ausentes" crea pases para todos los marcados
- Justificados → estado `JUSTIFICADA`, otros → `INJUSTIFICADA`

### Crear Pase (`public/Crear Pase.html`)
- Formulario standalone con 30 cards numeradas (1-30)
- Cards verdes sin punto; rojas con punto (azul = justif, blanco = injustif)
- Click en card ↔ rojo/verde; click en punto ↔ azul/blanco
- RUT + Buscar, Curso, Fecha, Botón Registrar

### Mantenedor de Cursos (`src/pages/MantenedorCursos.tsx`)
- Agregado a pestaña de mantenedores (`Mantenedores.tsx`)
- Letras A-Z (no solo A-D) — selector visual de 26 botones
- Descripción editable al agregar/editar curso

### Mantenedor de Estudiantes (`src/pages/MantenedorEstudiantes.tsx`)
- **Import CSV** con headers: `rut,nombre_completo,curso,anno_ingreso,email`
- Encoding inteligente: lee como ArrayBuffer, prueba UTF-8, fallback ISO-8859-1
- Curso se guarda en formato original; validación acepta "1A" y "1ro Grado A"
- `id_estudiante` = `EST-{rut_sin_puntos}`
- Filtro default: curso `'1A'` (evita cargar 400+ registros)
- Upsert con `ignoreDuplicates` (no falla si ya existe)
- Soft-delete si tiene registros en `justificados` (FK 23503)

### Servicio de Estudiantes (`src/services/estudiantes.service.ts`)
- `crearEstudiantesBatch()`: incluye `email`, upsert, genera `id_estudiante`
- `eliminarEstudiante()`: soft-delete si FK conflict

## Archivos Relevantes
| Archivo | Propósito |
|---------|-----------|
| `MD2/EDITOR_HTML_20260723.html` | Editor visual de formularios |
| `MD2/previaform.html` | Vista previa del formulario |
| `public/Crear Pase.html` | Formulario de pases standalone |
| `src/pages/GestionPases.tsx` | Gestión de pases con cards |
| `src/pages/MantenedorCursos.tsx` | Mantenedor de cursos |
| `src/pages/Mantenedores.tsx` | Tabs de mantenedores |
| `src/pages/MantenedorEstudiantes.tsx` | Mantenedor de estudiantes + import CSV |
| `src/services/estudiantes.service.ts` | CRUD estudiantes con upsert |
