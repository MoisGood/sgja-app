# ✅ CREAR TABLAS: INJUSTIFICADOS y JUSTIFICADOS

## 📋 Paso a Paso

### Paso 1: Agregar UNIQUE constraint a cursos.codigo
**Archivo:** `FIX_CURSOS_UNIQUE_CONSTRAINT.sql`

En Supabase SQL Editor:
1. Nueva Query
2. Copia el contenido completo
3. Ejecuta ▶️

---

### Paso 2: Crear tabla INJUSTIFICADOS
**Archivo:** `CREATE_TABLE_INJUSTIFICADOS.sql`

En Supabase SQL Editor:
1. Nueva Query
2. Copia el contenido completo
3. Ejecuta ▶️

**Qué incluye:**
- Tabla para inasistencias SIN justificación
- Fields: id_solicitud, estudiante, profesor, curso, bloque, establecimiento, estado, fecha, hora, bloques_afectados, tipo, respaldo_recibido
- Estado: 'Injustificada', 'Pendiente'
- Tipo: 'INASISTENCIA', 'ATRASO', 'RETIRO'
- 5 índices para performance

---

### Paso 3: Crear tabla JUSTIFICADOS
**Archivo:** `CREATE_TABLE_JUSTIFICADOS.sql`

En Supabase SQL Editor:
1. Nueva Query
2. Copia el contenido completo
3. Ejecuta ▶️

**Qué incluye:**
- Tabla para inasistencias CON justificación
- Fields: id_solicitud, estudiante, profesor, curso, bloque, establecimiento, estado, fecha, hora, bloques_afectados, tipo, motivo_codigo, motivo_descripcion, requiere_respaldo, respaldo_recibido, observaciones
- Estado: 'Pendiente', 'Aprobada', 'Rechazada'
- Tipo: 'INASISTENCIA', 'ATRASO', 'RETIRO'
- FK a motivos_justificacion
- 7 índices para performance

---

### Paso 4: Insertar datos de PRUEBA

**Para INJUSTIFICADOS:**
Archivo: `SQL_INJUSTIFICADOS_TEST.sql`

**Para JUSTIFICADOS:**
Archivo: `SQL_JUSTIFICADOS_TEST.sql`

En Supabase SQL Editor, ejecuta ambos en orden:
1. SQL_INJUSTIFICADOS_TEST.sql
2. SQL_JUSTIFICADOS_TEST.sql

---

## 📊 Resumen de Tablas

| Tabla | Propósito | Estados | Con Motivo |
|-------|-----------|---------|-----------|
| **injustificados** | Ausencias sin justificación | Injustificada, Pendiente | ❌ NO |
| **justificados** | Ausencias con justificación | Pendiente, Aprobada, Rechazada | ✅ SÍ |

---

## 🎯 Orden de ejecución correcto:

1. ✅ FIX_CURSOS_UNIQUE_CONSTRAINT.sql
2. ✅ CREATE_TABLE_INJUSTIFICADOS.sql
3. ✅ CREATE_TABLE_JUSTIFICADOS.sql
4. ✅ SQL_ESTUDIANTES_TEST.sql (si no ejecutado)
5. ✅ SQL_MOTIVOS_JUSTIFICACION_TEST.sql (si no ejecutado)
6. ✅ SQL_INJUSTIFICADOS_TEST.sql
7. ✅ SQL_JUSTIFICADOS_TEST.sql

Después de ejecutar todos, tendrás:
- 3 estudiantes de prueba
- 3 motivos de justificación
- 3 inasistencias injustificadas
- 3 inasistencias justificadas (1 aprobada, 1 pendiente, 1 rechazada)

✨ Sistema de justificaciones completamente validado.
