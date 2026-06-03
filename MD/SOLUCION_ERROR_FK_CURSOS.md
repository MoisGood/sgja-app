# ❌ ERROR: Foreign Key constraint en injustificados

## El Problema
```
ERROR 42830: there is no unique constraint matching given keys for referenced table "cursos"
```

La tabla `cursos` no tiene un UNIQUE constraint en `codigo`, pero la Foreign Key en `injustificados` lo requiere.

---

## La Solución (2 PASOS)

### ✅ PASO 1: Agregar UNIQUE constraint a cursos

1. Abre Supabase SQL Editor
2. Copia TODO el contenido de: **`FIX_CURSOS_UNIQUE_CONSTRAINT.sql`**
3. Pega en el editor y ejecuta ▶️
4. Deberías ver: ✅ "Query executed successfully"

**Validación:** La consulta de validación debería mostrarte:
```
uk_cursos_codigo | cursos
```

---

### ✅ PASO 2: Crear tabla injustificados

1. Una vez que termines el PASO 1
2. Copia TODO el contenido de: **`CREATE_TABLE_INJUSTIFICADOS.sql`**
3. Pega en el editor y ejecuta ▶️
4. Deberías ver: ✅ "Query executed successfully"

---

## ¿Por qué ocurre esto?

PostgreSQL tiene una regla de seguridad: **cualquier columna referenciada por una Foreign Key debe tener un UNIQUE constraint o ser Primary Key**.

**Antes:**
- `cursos.codigo` = TEXT NOT NULL + CHECK (codigo <> '')
- ❌ Sin UNIQUE constraint

**Después:**
- `cursos.codigo` = TEXT NOT NULL + CHECK + **UNIQUE**
- ✅ Puede ser referenciado por Foreign Keys

Los datos ya insertados en `cursos` NO se pierden, solo se agrega la restricción de que no puede haber dos cursos con el mismo código.

---

## Estado Actual de la Migración

| Tabla | Estado |
|-------|--------|
| establecimientos | ✅ Creada e insertada |
| rol_permisos | ✅ Creada e insertada |
| usuarios | ✅ Creada e insertada |
| cursos | ✅ Creada e insertada (falta UNIQUE en codigo) |
| bloques_horarios | ✅ Creada e insertada |
| estudiantes | ✅ Creada e insertada (3 test records) |
| motivos_justificacion | ✅ Creada e insertada (3 test records) |
| **injustificados** | ❌ **Bloqueada por FK de cursos** |

---

## Próximos pasos (después de resolver esto)

1. ✅ PASO 1: FIX_CURSOS_UNIQUE_CONSTRAINT.sql
2. ✅ PASO 2: CREATE_TABLE_INJUSTIFICADOS.sql
3. ✅ Ejecutar: SQL_INJUSTIFICADOS_TEST.sql (3 injustificados de prueba)
4. Validar inserts en Supabase
5. Proceder con importación masiva desde interfaz
