-- ============================================================================
-- 🔧 TRIGGER SIMPLIFICADO - SIN CONFLICTOS
-- Ejecutar en Supabase SQL Editor
-- ============================================================================

-- PASO 1: RECREAR LA FUNCIÓN CON MANEJO DE ERRORES MÁS SIMPLE
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Intentar insertar el nuevo usuario
  INSERT INTO public.usuarios (
    uid, 
    email, 
    nombre_completo, 
    rol, 
    id_establecimiento, 
    activo
  )
  VALUES (
    NEW.id::text,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre_completo', 'Usuario ' || NEW.email),
    'PROFESOR',
    (SELECT id FROM establecimientos WHERE activo = true LIMIT 1),
    false
  );
  
  RETURN NEW;
EXCEPTION WHEN unique_violation THEN
  -- Si ya existe, ignorar el error
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log del error
  RAISE WARNING 'Error al crear usuario: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- PASO 2: RECREAR TRIGGER
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- PASO 3: VERIFICACIÓN
SELECT '✅ TRIGGER SIMPLIFICADO RECREADO' as resultado;

-- Ver el trigger
SELECT 
  trigger_name, 
  event_object_table, 
  action_timing, 
  event_manipulation
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
