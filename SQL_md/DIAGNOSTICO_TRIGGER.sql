-- ============================================================================
-- 🔍 DIAGNOSTICAR ERRORES EN EL TRIGGER
-- Ejecutar en Supabase SQL Editor
-- ============================================================================

-- PASO 1: VERIFICAR QUE LA TABLA usuarios TENGA LAS COLUMNAS NECESARIAS
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'usuarios'
ORDER BY ordinal_position;

-- PASO 2: VERIFICAR QUE ESTABLECIMIENTOS TIENE REGISTROS ACTIVOS
SELECT id, nombre, codigo, activo 
FROM establecimientos 
WHERE activo = true
LIMIT 1;

-- PASO 3: VERIFICAR QUE NO HAY CONFLICTOS DE EMAIL DUPLICADO
SELECT email, COUNT(*) as cantidad
FROM usuarios
GROUP BY email
HAVING COUNT(*) > 1;

-- PASO 4: VER TODOS LOS USUARIOS ACTUALES
SELECT id, uid, email, nombre_completo, rol, activo
FROM usuarios
LIMIT 5;

-- PASO 5: VERIFICAR QUE EL TRIGGER EXISTE Y ESTÁ HABILITADO
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public' AND trigger_name = 'on_auth_user_created';

-- PASO 6: INTENTAR INSERT MANUAL PARA VER EL ERROR ESPECÍFICO
-- (Esto NO debería crear un usuario real, solo mostrar el error)
-- INSERT INTO usuarios (uid, email, nombre_completo, rol, id_establecimiento, activo)
-- VALUES ('test-uid-123', 'test@manual.com', 'Test Manual', 'PROFESOR', 
--         (SELECT id FROM establecimientos WHERE activo = true LIMIT 1), false);

SELECT '✅ DIAGNÓSTICO COMPLETADO' as resultado;
