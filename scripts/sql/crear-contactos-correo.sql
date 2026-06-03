CREATE TABLE IF NOT EXISTS contactos_correo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_establecimiento UUID NOT NULL REFERENCES establecimientos(id),
  nombre VARCHAR(200) NOT NULL,
  email VARCHAR(300) NOT NULL,
  activo BOOLEAN DEFAULT true,
  creado_en TIMESTAMPTZ DEFAULT now(),
  actualizado_en TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE contactos_correo DISABLE ROW LEVEL SECURITY;
