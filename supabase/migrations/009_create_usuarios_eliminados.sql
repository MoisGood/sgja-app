CREATE TABLE IF NOT EXISTS usuarios_eliminados (
  id SERIAL PRIMARY KEY,
  id_usuario TEXT,
  uid TEXT,
  email TEXT,
  nombre TEXT,
  rut TEXT,
  motivo TEXT NOT NULL,
  fecha_eliminacion TIMESTAMPTZ DEFAULT NOW(),
  respaldo_usuarios JSONB,
  respaldo_funcionarios JSONB,
  respaldo_datospersonales JSONB
);

ALTER TABLE usuarios_eliminados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuarios_eliminados_select" ON usuarios_eliminados FOR SELECT TO authenticated USING (true);
CREATE POLICY "usuarios_eliminados_insert" ON usuarios_eliminados FOR INSERT TO authenticated WITH CHECK (true);
