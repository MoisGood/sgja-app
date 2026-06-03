ALTER TABLE funcionario_ausencias
DROP CONSTRAINT IF EXISTS funcionario_ausencias_tipo_check,
ADD CONSTRAINT funcionario_ausencias_tipo_check
  CHECK (tipo IN ('licencia', 'permiso_admin', 'dia_compensado', 'otro'));
