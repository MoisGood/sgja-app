-- Agregar tipo_usuario y cuenta_activa a usuarios
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS tipo_usuario TEXT NOT NULL DEFAULT 'estudiante';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS cuenta_activa BOOLEAN DEFAULT false;

-- Actualizar registros existentes según el rol
UPDATE usuarios SET tipo_usuario = 'funcionario' WHERE rol IN ('ADMIN', 'INSPECTOR', 'PROFESOR', 'BIBLIOTECARIO', 'TECNICO');
UPDATE usuarios SET tipo_usuario = 'estudiante' WHERE rol = 'ESTUDIANTE';
UPDATE usuarios SET tipo_usuario = 'apoderado' WHERE rol = 'APODERADO';
