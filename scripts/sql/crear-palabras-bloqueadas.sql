CREATE TABLE IF NOT EXISTS palabras_bloqueadas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  palabra TEXT NOT NULL,
  id_establecimiento TEXT NOT NULL,
  activo BOOLEAN DEFAULT true,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_palabras_establecimiento ON palabras_bloqueadas(id_establecimiento);

ALTER TABLE palabras_bloqueadas ENABLE ROW LEVEL SECURITY;

CREATE POLICY pb_select ON palabras_bloqueadas FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY pb_insert ON palabras_bloqueadas FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY pb_delete ON palabras_bloqueadas FOR DELETE USING (auth.role() = 'authenticated');
