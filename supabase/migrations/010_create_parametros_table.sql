CREATE TABLE IF NOT EXISTS parametros (
  id_parametros SERIAL PRIMARY KEY,
  id_establecimiento UUID NOT NULL REFERENCES establecimientos(id),
  tiempo_inactividad_minutos INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(id_establecimiento)
);

ALTER TABLE parametros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "parametros_select" ON parametros FOR SELECT TO authenticated USING (true);
CREATE POLICY "parametros_insert" ON parametros FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "parametros_update" ON parametros FOR UPDATE TO authenticated USING (true);

NOTIFY pgrst, 'reload schema';