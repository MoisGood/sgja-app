-- ============================================================================
-- CREAR TABLA CONFIGURACION (Permisos por rol y establecimiento)
-- ============================================================================
CREATE TABLE IF NOT EXISTS configuracion (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  rol TEXT NOT NULL,
  id_establecimiento UUID NOT NULL,
  permisos JSONB DEFAULT '[]'::jsonb,
  actualizado_en TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (rol, id_establecimiento)
);

CREATE INDEX IF NOT EXISTS idx_configuracion_rol_establecimiento 
  ON configuracion (rol, id_establecimiento);

ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;

-- Política: lectura permitida para usuarios autenticados
CREATE POLICY "configuracion_select_auth" ON configuracion
  FOR SELECT USING (auth.role() = 'authenticated');

-- Política: escritura solo para admins
CREATE POLICY "configuracion_insert_admin" ON configuracion
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM usuarios WHERE uid = auth.uid()::text AND rol = 'ADMIN')
  );

CREATE POLICY "configuracion_update_admin" ON configuracion
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM usuarios WHERE uid = auth.uid()::text AND rol = 'ADMIN')
  );
