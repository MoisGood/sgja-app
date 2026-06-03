# Plan Módulo Secretaría — Funcionarios

## 1. Resumen de lo que existe

| Archivo | Estado |
|---------|--------|
| `types/index.ts` → `Funcionario` | ✅ Interface definida (16 campos) |
| `pages/MantenedorFuncionarios.tsx` | ⚠️ 827 líneas con TODO (sin backend real) |
| `AppContent.tsx` | ✅ Ruta `/mantenedor-funcionarios` para ADMIN |
| `Layout.tsx` | ✅ Menú "Secretaría > Funcionarios" solo ADMIN |

**Problema:** Solo ADMIN ve la página. No hay backend. No hay tabla en Supabase.

---

## 2. Lo que hay que crear (ordenado)

### Fase 1 — Tabla y tipos (base de datos)

1. **Tabla `funcionarios` en Supabase**
2. **Ampliar tipo `Funcionario`** con campos nuevos (ver punto 4)
3. **Tabla `funcionario_documentos`** para adjuntos PDF
4. **Tabla `plantillas_correo`** para plantillas
5. **Tabla `funcionario_ausencias`** para licencias/permisos

### Fase 2 — Backend (services)

6. `services/funcionarios.ts` → CRUD: crear, editar, listar, cambiar estado
7. `services/funcionariosDocumentos.ts` → subir/descargar/eliminar PDF
8. `services/funcionariosAusencias.ts` → registrar licencias, permisos
9. `services/plantillasCorreo.ts` → CRUD plantillas

### Fase 3 — Pages

10. **Refactor `MantenedorFuncionarios.tsx`** → conectar backend real
11. **`pages/PlantillasCorreo.tsx`** → mantenedor de plantillas
12. **Campanita de ausencias** → componente global en Layout

### Fase 4 — Rutas y menú

13. **Ampliar acceso** a INSPECTOR, PROFESOR, BIBLIOTECARIO, TECNICO
14. **Agregar submenús** en "Secretaría"

---

## 3. Roles y acceso

| Rol | ¿Ve página? | Puede hacer |
|-----|-------------|-------------|
| ADMIN | ✅ | CRUD completo |
| INSPECTOR | ✅ | Ver listado, ver documentos |
| PROFESOR | ✅ | Su propio perfil, subir documentos |
| BIBLIOTECARIO | ✅ | Ver listado |
| TECNICO | ✅ | Ver listado |
| APODERADO | ❌ | — |
| ESTUDIANTE | ❌ | — |

---

## 4. Tipo Funcionario ampliado

```
CAMPO                    TIPO           EJEMPLO
────────────────────────────────────────────────────
rut                      string         198141127
rut_formateado           string         19.814.112-7
nombre_completo          string         Juan Pérez
fecha_nacimiento         string         1990-05-15
domicilio                string         Av. Siempre Viva 123
comuna                   string         Santiago
celular                  string         +56 9 1234 5678
correo_personal          string         juan@email.com
correo_institucional     string         juan.perez@colegio.cl

◉ Categoría (nuevo)
tipo_funcionario         enum           docente | paradocente | auxiliar | reemplazo | en_practica | otro

◉ Para docentes
asignatura               string|null    Matemáticas
horas_contrato           number         44
titulo_profesional       string         Prof. Matemáticas
universidad              string         U. de Chile
ano_titulacion           number         2015

◉ Para reemplazo / plazo fijo
fecha_inicio             string         2026-03-01
fecha_termino            string|null    2026-12-31

◉ Contacto emergencia (nuevo)
emergencia_nombre        string         María González
emergencia_telefono      string         +56 9 8765 4321
emergencia_parentesco    string         Cónyuge

◉ Estado
vigente                  boolean        true
usuario_registrado_sistema boolean      false
tiene_licencia           boolean        false
tiene_permiso_admin      boolean        false

◉ Auditoría
creado_en                timestamp
actualizado_en           timestamp
```

---

## 5. Pantalla principal (Funcionarios.tsx)

```
┌─────────────────────────────────────────────────────┐
│  🏢 Secretaría — Funcionarios                        │
│  [📥 Nuevo Funcionario]  [📧 Enviar Correo]          │
│                                                      │
│  Filtros: [Todos ▾]  [Activos ▾]  [Con licencia ▾]  │
│  Buscar: [______________]                            │
│                                                      │
│  ┌────────────┬────────┬──────────┬────────┬──────┐  │
│  │ Nombre     │ RUT    │ Tipo     │ Estado │ Docs │  │
│  ├────────────┼────────┼──────────┼────────┼──────┤  │
│  │ Juan Pérez │ 19.8… │ Docente  │ ✅ Act │ 📎 3 │  │
│  │ María…     │ 20.5… │ Reempla. │ 🟡 Aus │ 📎 1 │  │
│  └────────────┴────────┴──────────┴────────┴──────┘  │
└─────────────────────────────────────────────────────┘
```

### Filtros
- Tipo: Todos / Docente / Paradocente / Auxiliar / Reemplazo / En práctica
- Estado: Todos / Activos / Inactivos
- Situación: Todos / Con licencia / Con permiso admin / Reemplazo activo
- Búsqueda por nombre o RUT

### Botonera
- 📥 Nuevo Funcionario → abre modal/formulario
- 📧 Enviar Correo → selector de plantilla + destinatarios
- 📎 Ver Adjuntos → lista de documentos recibidos
- 📋 Reporte → descargar CSV

---

## 6. Formulario de Funcionario

Sería un modal de varias secciones (pueden ser tabs o accordion):

### Sección 1: Datos personales
- RUT, Nombre, Fecha nacimiento
- Domicilio, Comuna, Celular
- Correo personal, Correo institucional

### Sección 2: Datos laborales
- Tipo funcionario (select)
- Fecha ingreso
- Para docentes: asignatura, horas_contrato, título, universidad, año titulación
- Para reemplazo/plazo fijo: fecha_inicio, fecha_termino

### Sección 3: Contacto emergencia
- Nombre, teléfono, parentesco

### Sección 4: Documentos (después de guardar)
- Subir PDF (título, certificado, contrato, etc.)
- Lista de documentos subidos con fecha

---

## 7. Campanita de ausencias (componente global)

En `Layout.tsx`, junto al nombre del usuario:

```
[🔔 3]   Juan Pérez  [Cerrar sesión]
```

Al hacer clic: popup con lista de funcionarios ausentes hoy:

```
┌─────────────────────────────────┐
│ 🔔 Ausencias del día            │
├─────────────────────────────────┤
│ • Juan Pérez — Licencia médica  │
│ • María Soto — Permiso admin    │
│ • Carlos Lee — Reemplazo        │
└─────────────────────────────────┘
```

**Datos:** se consulta `funcionario_ausencias` donde `fecha = hoy`.

---

## 8. Orden de implementación (paso a paso)

| Paso | Qué | Archivos |
|------|-----|----------|
| 1 | Crear tabla `funcionarios` en Supabase | SQL |
| 2 | Ampliar tipo `Funcionario` en types | `types/index.ts` |
| 3 | Crear `services/funcionarios.ts` | CRUD funciones |
| 4 | Conectar `MantenedorFuncionarios.tsx` al backend | page |
| 5 | Agregar filtros (tipo, estado, licencia) | page |
| 6 | Agregar campo "tipo_funcionario" y emergencia | page + types |
| 7 | Mostrar icono de licencia/permiso en lista | page |
| 8 | Tabla `funcionario_documentos` + subida PDF | SQL + service |
| 9 | Sección documentos en el modal | page |
| 10 | Tabla `plantillas_correo` + mantenedor | SQL + service + page |
| 11 | Campanita de ausencias | Layout + service |
| 12 | Ampliar acceso a INSPECTOR (y otros) | AppContent + Layout |

---

## 9. Preguntas para ti

1. **¿Tabla nueva `funcionarios` o reusar tabla `usuarios`?** — Propongo tabla separada porque los funcionarios pueden no tener usuario en el sistema.
2. **Los documentos PDF: ¿subirlos a Supabase Storage o guardar solo link?** — Supabase Storage tiene 1GB gratis.
3. **¿Las plantillas de correo para qué casos específicos?** Ej: "Recordatorio subir documentos", "Aviso de licencia", etc.
4. **¿La campanita de ausencias la ve cualquier rol o solo secretaría?**
