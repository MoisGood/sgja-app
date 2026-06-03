-- ============================================================
-- Tabla: lugares (salas, pasillos, patios, accesos del edificio)
-- ============================================================
CREATE TABLE IF NOT EXISTS lugares (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  id_establecimiento uuid NOT NULL,
  piso integer NOT NULL CHECK (piso >= 0),
  nombre text NOT NULL,
  zona text NOT NULL DEFAULT 'z-other',
  left_pos integer NOT NULL,
  top_pos integer NOT NULL,
  width integer NOT NULL,
  height integer NOT NULL,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- FK
ALTER TABLE lugares
  ADD CONSTRAINT fk_lugares_establecimiento
  FOREIGN KEY (id_establecimiento)
  REFERENCES establecimientos(id)
  ON DELETE CASCADE;

-- Índices
CREATE INDEX idx_lugares_piso ON lugares (piso, id_establecimiento);
CREATE INDEX idx_lugares_zona ON lugares (zona, id_establecimiento);

-- RLS
ALTER TABLE lugares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lugares_select" ON lugares
  FOR SELECT USING (true);

CREATE POLICY "lugares_insert" ON lugares
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol IN ('ADMIN'))
  );

CREATE POLICY "lugares_update" ON lugares
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol IN ('ADMIN'))
  );

CREATE POLICY "lugares_delete" ON lugares
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol IN ('ADMIN'))
  );

-- Trigger updated_at
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_lugares
  BEFORE UPDATE ON lugares
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();
