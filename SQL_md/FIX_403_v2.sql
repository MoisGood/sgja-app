-- ============================================================================
-- 🔧 FIX: Columna nombre_completo + políticas INSERT
-- ============================================================================

-- 1. Agregar nombre_completo si no existe (viene de tabla con nombre+apellidos)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS nombre_completo TEXT;
UPDATE usuarios SET nombre_completo = CONCAT(COALESCE(nombre,''), ' ', COALESCE(apellidos,'')) WHERE nombre_completo IS NULL;
ALTER TABLE usuarios ALTER COLUMN nombre_completo SET NOT NULL;

-- 2. Política INSERT para admin (usa es_admin de migration 011)
DROP POLICY IF EXISTS "usuarios_insert_admin" ON usuarios;
CREATE POLICY "usuarios_insert_admin" ON usuarios
  FOR INSERT
  WITH CHECK (public.es_admin());

-- 3. Política UPDATE para admin
DROP POLICY IF EXISTS "usuarios_update_admin" ON usuarios;
CREATE POLICY "usuarios_update_admin" ON usuarios
  FOR UPDATE
  USING (public.es_admin());

-- 4. Política SELECT si no existe (por si no se ejecutó el fix anterior)
DROP POLICY IF EXISTS "usuarios_select" ON usuarios;
CREATE POLICY "usuarios_select" ON usuarios
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Verificar
SELECT column_name FROM information_schema.columns
WHERE table_name = 'usuarios' AND column_name IN ('nombre','nombre_completo','apellidos');
