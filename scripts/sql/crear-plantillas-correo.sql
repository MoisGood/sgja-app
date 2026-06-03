CREATE TABLE IF NOT EXISTS plantillas_correo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(200) NOT NULL,
  asunto VARCHAR(500) NOT NULL,
  cuerpo TEXT NOT NULL,
  activo BOOLEAN DEFAULT true,
  creado_en TIMESTAMPTZ DEFAULT now(),
  actualizado_en TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE plantillas_correo ADD COLUMN IF NOT EXISTS id_establecimiento UUID;
ALTER TABLE plantillas_correo ADD COLUMN IF NOT EXISTS categoria VARCHAR(50);
ALTER TABLE plantillas_correo ADD COLUMN IF NOT EXISTS ultimo_uso TIMESTAMPTZ;
ALTER TABLE plantillas_correo ADD COLUMN IF NOT EXISTS creado_por UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'plantillas_correo_id_establecimiento_fkey'
  ) THEN
    ALTER TABLE plantillas_correo ADD CONSTRAINT plantillas_correo_id_establecimiento_fkey
      FOREIGN KEY (id_establecimiento) REFERENCES establecimientos(id);
  END IF;
END $$;

-- Fix RLS: desactivar RLS para esta tabla (el filtro se hace en el frontend por id_establecimiento)
ALTER TABLE plantillas_correo DISABLE ROW LEVEL SECURITY;
