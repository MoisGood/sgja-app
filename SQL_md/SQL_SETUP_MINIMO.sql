-- COPIA Y PEGA TODO ESTO EN SUPABASE SQL EDITOR → RUN

CREATE TABLE IF NOT EXISTS establecimientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  codigo TEXT UNIQUE NOT NULL,
  region TEXT,
  activo BOOLEAN DEFAULT true
);

INSERT INTO establecimientos (nombre, codigo, region, activo)
VALUES ('Liceo de Niñas de Concepción', 'LNC-001', 'Bío-Bío', true)
ON CONFLICT (codigo) DO NOTHING;

CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uid TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  nombre_completo TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'PROFESOR',
  id_establecimiento UUID REFERENCES establecimientos(id) ON DELETE SET NULL,
  activo BOOLEAN DEFAULT false,
  CONSTRAINT rol_valido CHECK (rol IN ('ADMIN', 'INSPECTOR', 'PROFESOR', 'ESTUDIANTE', 'APODERADO'))
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  id_establecimiento_temp UUID;
BEGIN
  SELECT id INTO id_establecimiento_temp FROM establecimientos LIMIT 1;
  INSERT INTO public.usuarios (uid, email, nombre_completo, rol, id_establecimiento, activo)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre_completo', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'rol', 'PROFESOR'),
    id_establecimiento_temp,
    false
  )
  ON CONFLICT (uid) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_read_own_record"
  ON usuarios FOR SELECT
  USING (uid = auth.uid()::text);

SELECT '✅ SETUP COMPLETADO' as resultado;
