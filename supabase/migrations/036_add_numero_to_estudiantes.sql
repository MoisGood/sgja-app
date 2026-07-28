-- Agregar columna numero a estudiantes (número de orden/lista)
ALTER TABLE estudiantes ADD COLUMN IF NOT EXISTS numero INTEGER;
CREATE INDEX IF NOT EXISTS idx_estudiantes_numero ON estudiantes(numero);
-- El número debe ser único por establecimiento (se valida en la app)
