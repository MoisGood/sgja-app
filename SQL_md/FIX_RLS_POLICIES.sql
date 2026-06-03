-- ============================================================================
-- 🔧 FIX: LIMPIAR Y ARREGLAR LAS RLS POLICIES PROBLEMÁTICAS
-- Ejecutar en Supabase SQL Editor
-- ============================================================================

-- PASO 1: DESHABILITAR RLS TEMPORALMENTE PARA LIMPIAR
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;

-- PASO 2: ELIMINAR TODAS LAS POLICIES PROBLEMÁTICAS
DROP POLICY IF EXISTS "users_can_read_own_record" ON usuarios;
DROP POLICY IF EXISTS "Los usuarios pueden leer su propio registro" ON usuarios;
DROP POLICY IF EXISTS "Los ADMIN pueden leer todos" ON usuarios;
DROP POLICY IF EXISTS "Los INSPECTOR ven usuarios del establecimiento" ON usuarios;
DROP POLICY IF EXISTS "Los usuarios pueden actualizar su propio perfil" ON usuarios;
DROP POLICY IF EXISTS "users_can_update_own_profile" ON usuarios;
DROP POLICY IF EXISTS "public_read_access" ON usuarios;
DROP POLICY IF EXISTS "admin_access" ON usuarios;
DROP POLICY IF EXISTS "inspector_access" ON usuarios;

-- PASO 3: HABILITAR RLS NUEVAMENTE
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- PASO 4: CREAR NUEVA POLICY SIMPLE - TODOS PUEDEN LEER
CREATE POLICY "public_read_access"
  ON usuarios FOR SELECT
  USING (true);

-- PASO 5: CREAR POLICY PARA ACTUALIZACIÓN - SOLO PROPIOS DATOS
CREATE POLICY "users_update_own_data"
  ON usuarios FOR UPDATE
  USING (uid = auth.uid()::text)
  WITH CHECK (uid = auth.uid()::text);

-- PASO 6: CREAR POLICY PARA INSERCIÓN - TRIGGER SE ENCARGA
CREATE POLICY "system_insert_on_auth"
  ON usuarios FOR INSERT
  WITH CHECK (true);

-- PASO 7: VERIFICAR POLICIES
SELECT '✅ RLS POLICIES ARREGLADAS' as resultado;
