-- ============================================================================
-- SETUP COMPLETO DE SUPABASE PARA SGJA
-- Ejecutar en Supabase SQL Editor (copiar y pegar todo)
-- ============================================================================

-- ============================================================================
-- PASO 1: CREAR TABLA ESTABLECIMIENTOS (si no existe)
-- ============================================================================
CREATE TABLE IF NOT EXISTS establecimientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  codigo TEXT UNIQUE NOT NULL,
  region TEXT,
  activo BOOLEAN DEFAULT true,
  creado_en TIMESTAMP DEFAULT now()
);

-- ============================================================================
-- PASO 2: INSERTAR ESTABLECIMIENTO DE PRUEBA
-- ============================================================================
INSERT INTO establecimientos (nombre, codigo, region, activo)
VALUES ('Liceo de Niñas de Concepción', 'LNC-001', 'Bío-Bío', true)
ON CONFLICT (codigo) DO NOTHING;

-- ============================================================================
-- PASO 3: CREAR TABLA USUARIOS (si no existe)
-- ============================================================================
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uid TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  nombre_completo TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'PROFESOR',
  id_establecimiento UUID REFERENCES establecimientos(id) ON DELETE SET NULL,
  activo BOOLEAN DEFAULT false,
  creado_en TIMESTAMP DEFAULT now(),
  actualizado_en TIMESTAMP DEFAULT now(),
  CONSTRAINT rol_valido CHECK (rol IN ('ADMIN', 'INSPECTOR', 'PROFESOR', 'ESTUDIANTE', 'APODERADO')),
  CONSTRAINT email_no_vacio CHECK (email <> ''),
  CONSTRAINT nombre_no_vacio CHECK (nombre_completo <> '')
);

-- ============================================================================
-- PASO 4: CREAR FUNCIÓN PARA MANEJAR NUEVOS USUARIOS
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  id_establecimiento_temp UUID;
BEGIN
  -- Obtener el primer establecimiento disponible
  SELECT id INTO id_establecimiento_temp FROM establecimientos WHERE activo = true LIMIT 1;
  
  INSERT INTO public.usuarios (uid, email, nombre_completo, rol, id_establecimiento, activo)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre_completo', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'rol', 'PROFESOR'),
    id_establecimiento_temp,
    false  -- Nuevos usuarios comienzan inactivos
  )
  ON CONFLICT (uid) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- ============================================================================
-- PASO 5: CREAR TRIGGER PARA NUEVOS USUARIOS
-- ============================================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- PASO 6: CONFIGURAR RLS POLICIES (Row Level Security)
-- ============================================================================

-- Habilitar RLS en usuarios
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Policy 1: Los usuarios pueden leer su propio registro
CREATE POLICY "Los usuarios pueden leer su propio registro"
  ON usuarios FOR SELECT
  USING (uid = auth.uid()::text);

-- Policy 2: Los ADMIN pueden leer todos los usuarios
CREATE POLICY "Los ADMIN pueden leer todos"
  ON usuarios FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.uid = auth.uid()::text
      AND u.rol = 'ADMIN'
    )
  );

-- Policy 3: Los INSPECTOR pueden leer usuarios de su establecimiento
CREATE POLICY "Los INSPECTOR ven usuarios del establecimiento"
  ON usuarios FOR SELECT
  USING (
    id_establecimiento = (
      SELECT id_establecimiento FROM usuarios WHERE uid = auth.uid()::text
    )
  );

-- Policy 4: Usuarios autenticados pueden actualizar su propio perfil
CREATE POLICY "Los usuarios pueden actualizar su propio perfil"
  ON usuarios FOR UPDATE
  USING (uid = auth.uid()::text)
  WITH CHECK (uid = auth.uid()::text);

-- ============================================================================
-- PASO 7: VERIFICACIÓN
-- ============================================================================
SELECT '✅ Setup completado' as resultado;
SELECT COUNT(*) as establecimientos_totales FROM establecimientos;
SELECT COUNT(*) as usuarios_totales FROM usuarios;

-- ============================================================================
-- NOTA IMPORTANTE
-- ============================================================================
-- Si recibiste error "Database error saving new user", verifica:
-- 1. Las columnas email y nombre_completo en la tabla usuarios
-- 2. Que establecimientos tenga al menos un registro
-- 3. Que la columna activo permita boolean values
-- 4. Que el trigger esté creado correctamente en auth.users

