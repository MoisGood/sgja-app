-- ============================================================================
-- 🔧 VERIFICAR Y RECREAR TRIGGER
-- Ejecutar en Supabase SQL Editor
-- ============================================================================

-- PASO 1: VERIFICAR QUE EL TRIGGER EXISTE
SELECT 
  trigger_name, 
  event_object_table, 
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- PASO 2: SI NO EXISTE, RECREAR FUNCIÓN

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  id_establecimiento_temp UUID;
BEGIN
  -- Obtener el primer establecimiento
  SELECT id INTO id_establecimiento_temp 
  FROM establecimientos 
  WHERE activo = true 
  LIMIT 1;
  
  -- Insertar usuario en tabla usuarios
  INSERT INTO public.usuarios (uid, email, nombre_completo, rol, id_establecimiento, activo)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre_completo', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'rol', 'PROFESOR'),
    id_establecimiento_temp,
    false
  )
  ON CONFLICT (uid) DO UPDATE 
  SET email = NEW.email, 
      actualizado_en = now()
  WHERE usuarios.uid = NEW.id;
  
  RETURN NEW;
END;
$$;

-- PASO 3: RECREAR TRIGGER
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- PASO 4: VERIFICACIÓN
SELECT '✅ TRIGGER RECREADO CORRECTAMENTE' as resultado;

-- Ver información del trigger
SELECT 
  trigger_name, 
  event_object_table, 
  action_timing,
  event_manipulation
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
