-- ============================================================================
-- 🔧 FIX COMPLETO: RLS + columna nombre_completo
-- ============================================================================

-- 1. Arreglar es_admin() para que compare contra uid (TEXT) no id (UUID)
CREATE OR REPLACE FUNCTION public.es_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE uid = auth.uid()::text AND rol = 'ADMIN' AND activo = true
  );
$$;

-- 2. Agregar columna nombre_completo si viene de esquema con nombre+apellidos
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS nombre_completo TEXT;
UPDATE usuarios SET nombre_completo = COALESCE(nombre_completo, CONCAT(COALESCE(nombre,''), ' ', COALESCE(apellidos,'')));

-- 3. Políticas para usuarios
DROP POLICY IF EXISTS "usuarios_select" ON usuarios;
DROP POLICY IF EXISTS "usuarios_insert_admin" ON usuarios;
DROP POLICY IF EXISTS "usuarios_update_admin" ON usuarios;

CREATE POLICY "usuarios_select" ON usuarios
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "usuarios_insert_admin" ON usuarios
  FOR INSERT WITH CHECK (public.es_admin());

CREATE POLICY "usuarios_update_admin" ON usuarios
  FOR UPDATE USING (public.es_admin());

-- 4. Políticas para configuracion_dispositivos (SELECT + INSERT)
DROP POLICY IF EXISTS "configuracion_dispositivos_select_all" ON configuracion_dispositivos;
DROP POLICY IF EXISTS "configuracion_dispositivos_admin_insert" ON configuracion_dispositivos;

CREATE POLICY "configuracion_dispositivos_select_all" ON configuracion_dispositivos
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "configuracion_dispositivos_admin_insert" ON configuracion_dispositivos
  FOR INSERT WITH CHECK (public.es_admin());

-- 5. Políticas para tablas de técnico (posibles_fallas, diagnosticos, etc.)
DROP POLICY IF EXISTS "posibles_fallas_select_all" ON posibles_fallas;
DROP POLICY IF EXISTS "posibles_diagnosticos_select_all" ON posibles_diagnosticos;
DROP POLICY IF EXISTS "posibles_soluciones_select_all" ON posibles_soluciones;
DROP POLICY IF EXISTS "posibles_observaciones_select_all" ON posibles_observaciones;
DROP POLICY IF EXISTS "ubicaciones_select_all" ON ubicaciones;
DROP POLICY IF EXISTS "qr_codes_select_all" ON qr_codes;

CREATE POLICY "posibles_fallas_select_all" ON posibles_fallas FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "posibles_diagnosticos_select_all" ON posibles_diagnosticos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "posibles_soluciones_select_all" ON posibles_soluciones FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "posibles_observaciones_select_all" ON posibles_observaciones FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "ubicaciones_select_all" ON ubicaciones FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "qr_codes_select_all" ON qr_codes FOR SELECT USING (auth.role() = 'authenticated');

-- 6. Verificar
SELECT '✅ FIX COMPLETO' as resultado;
