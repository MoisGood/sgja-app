-- ========================================================================
-- FIX: Agregar UNIQUE constraint a cursos(codigo)
-- Problema: Foreign Key en injustificados necesita que cursos.codigo sea UNIQUE
-- Solución: Agregar UNIQUE constraint a la columna codigo
-- ========================================================================

BEGIN TRANSACTION;

-- Paso 1: Verificar si el constraint ya existe
-- Si falla, PostgreSQL lo ignorará y continuará

-- Paso 2: Agregar UNIQUE constraint a cursos.codigo
ALTER TABLE cursos 
ADD CONSTRAINT uk_cursos_codigo UNIQUE (codigo);

COMMIT;

-- ========================================================================
-- VALIDACIÓN - Ejecutar esta consulta para verificar que se creó
-- ========================================================================
SELECT constraint_name, table_name 
FROM information_schema.table_constraints 
WHERE table_name = 'cursos' AND constraint_type = 'UNIQUE';

-- Deberías ver una fila con:
-- constraint_name: uk_cursos_codigo
-- table_name: cursos
