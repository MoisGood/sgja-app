ALTER TABLE palabras_bloqueadas ADD COLUMN IF NOT EXISTS categoria TEXT;

CREATE INDEX IF NOT EXISTS idx_palabras_categoria ON palabras_bloqueadas(categoria);
