-- Agregar columna tipo_contrato a la tabla funcionarios
ALTER TABLE funcionarios ADD COLUMN IF NOT EXISTS tipo_contrato TEXT NOT NULL DEFAULT 'plazo_fijo';

-- Actualizar registros existentes sin tipo_contrato
UPDATE funcionarios SET tipo_contrato = 'plazo_fijo' WHERE tipo_contrato IS NULL;
