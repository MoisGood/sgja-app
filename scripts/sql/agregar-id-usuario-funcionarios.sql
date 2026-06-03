-- Agregar columna id_usuario a funcionarios (FK a usuarios)
ALTER TABLE funcionarios ADD COLUMN IF NOT EXISTS id_usuario UUID REFERENCES usuarios(id_usuario) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_funcionarios_id_usuario ON funcionarios(id_usuario);
