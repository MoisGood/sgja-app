CREATE TABLE IF NOT EXISTS funcionarios (
  rut TEXT PRIMARY KEY,
  rut_formateado TEXT NOT NULL,
  nombre_completo TEXT NOT NULL,
  fecha_nacimiento DATE,
  domicilio TEXT,
  comuna TEXT,
  celular TEXT,
  correo_personal TEXT,
  correo_institucional TEXT,
  tipo_funcionario TEXT NOT NULL DEFAULT 'otro',
  titulo_profesional TEXT,
  universidad TEXT,
  ano_titulacion INTEGER,
  asignatura TEXT,
  horas_contrato INTEGER DEFAULT 0,
  fecha_ingreso DATE,
  fecha_termino DATE,
  emergencia_nombre TEXT,
  emergencia_telefono TEXT,
  emergencia_parentesco TEXT,
  vigente BOOLEAN DEFAULT true,
  tiene_licencia BOOLEAN DEFAULT false,
  tiene_permiso_admin BOOLEAN DEFAULT false,
  usuario_registrado_sistema BOOLEAN DEFAULT false,
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS funcionario_documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rut_funcionario TEXT REFERENCES funcionarios(rut) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL,
  url TEXT NOT NULL,
  subido_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS funcionario_ausencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rut_funcionario TEXT REFERENCES funcionarios(rut) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('licencia', 'permiso_admin', 'otro')),
  fecha_inicio DATE NOT NULL,
  fecha_termino DATE,
  motivo TEXT,
  registrado_por TEXT,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plantillas_correo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  asunto TEXT NOT NULL,
  cuerpo TEXT NOT NULL,
  activo BOOLEAN DEFAULT true,
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO plantillas_correo (nombre, asunto, cuerpo) VALUES
  ('Nuevo funcionario - Crear correo', 'Nuevo funcionario: {{nombre}} - Crear correo institucional', 'Se solicita crear correo institucional para:\n\nNombre: {{nombre}}\nRUT: {{rut}}\nTipo: {{tipo}}\n\nSaludos.'),
  ('Nuevo funcionario - Ingresar plataforma', 'Nuevo funcionario: {{nombre}} - Ingreso a plataforma', 'Se solicita ingresar a {{nombre}} en la plataforma correspondiente.\n\nRUT: {{rut}}\nTipo: {{tipo}}')
ON CONFLICT DO NOTHING;
