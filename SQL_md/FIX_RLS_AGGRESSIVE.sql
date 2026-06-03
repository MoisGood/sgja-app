-- ============================================================================
-- 🔧 ARREGLO AGRESIVO: DESHABILITAR RLS COMPLETAMENTE
-- Usar este SQL si el anterior no funcionó
-- ============================================================================

-- PASO 1: DESHABILITAR RLS COMPLETAMENTE
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;

-- PASO 2: LISTAR Y ELIMINAR TODAS LAS POLICIES UNA POR UNA
DROP POLICY IF EXISTS "public_read_access" ON usuarios;
DROP POLICY IF EXISTS "users_update_own_data" ON usuarios;
DROP POLICY IF EXISTS "system_insert_on_auth" ON usuarios;
DROP POLICY IF EXISTS "Los usuarios pueden leer su propio registro" ON usuarios;
DROP POLICY IF EXISTS "Los ADMIN pueden leer todos" ON usuarios;
DROP POLICY IF EXISTS "Los INSPECTOR ven usuarios del establecimiento" ON usuarios;
DROP POLICY IF EXISTS "Los usuarios pueden actualizar su propio perfil" ON usuarios;
DROP POLICY IF EXISTS "users_can_read_own_record" ON usuarios;
DROP POLICY IF EXISTS "users_can_insert" ON usuarios;
DROP POLICY IF EXISTS "users_insert_on_auth" ON usuarios;
DROP POLICY IF EXISTS "admin_read_all" ON usuarios;
DROP POLICY IF EXISTS "inspector_read_establishment" ON usuarios;
DROP POLICY IF EXISTS "users_update_profile" ON usuarios;

SELECT '✅ RLS COMPLETAMENTE DESHABILITADO - USUARIOS ACCESIBLE SIN RESTRICCIONES' as resultado;
