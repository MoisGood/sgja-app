-- ============================================================================
-- 🔧 FIX RLS 403 - Permitir lectura a usuarios autenticados
-- Ejecutar en Supabase SQL Editor
-- ============================================================================

-- Eliminar políticas existentes conflictivas
DROP POLICY IF EXISTS "public_read_access" ON usuarios;
DROP POLICY IF EXISTS "usuarios_select" ON usuarios;
DROP POLICY IF EXISTS "usuarios_select_all" ON usuarios;
DROP POLICY IF EXISTS "admin_ver_todos_usuarios" ON usuarios;
DROP POLICY IF EXISTS "usuarios_ver_establecimiento" ON usuarios;

-- Política simple: cualquier usuario autenticado puede leer usuarios
CREATE POLICY "usuarios_select" ON usuarios
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Lo mismo para configuracion_dispositivos
DROP POLICY IF EXISTS "configuracion_dispositivos_select_all" ON configuracion_dispositivos;
CREATE POLICY "configuracion_dispositivos_select_all" ON configuracion_dispositivos
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Y para el resto de tablas del módulo técnico
DROP POLICY IF EXISTS "posibles_fallas_select_all" ON posibles_fallas;
CREATE POLICY "posibles_fallas_select_all" ON posibles_fallas
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "posibles_diagnosticos_select_all" ON posibles_diagnosticos;
CREATE POLICY "posibles_diagnosticos_select_all" ON posibles_diagnosticos
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "posibles_soluciones_select_all" ON posibles_soluciones;
CREATE POLICY "posibles_soluciones_select_all" ON posibles_soluciones
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "posibles_observaciones_select_all" ON posibles_observaciones;
CREATE POLICY "posibles_observaciones_select_all" ON posibles_observaciones
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "ubicaciones_select_all" ON ubicaciones;
CREATE POLICY "ubicaciones_select_all" ON ubicaciones
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "qr_codes_select_all" ON qr_codes;
CREATE POLICY "qr_codes_select_all" ON qr_codes
  FOR SELECT USING (auth.role() = 'authenticated');

-- Verificar
SELECT tablename, policyname, permissive, cmd
FROM pg_policies
WHERE tablename IN ('usuarios','configuracion_dispositivos','posibles_fallas','posibles_diagnosticos','posibles_soluciones','posibles_observaciones','ubicaciones','qr_codes')
ORDER BY tablename;
