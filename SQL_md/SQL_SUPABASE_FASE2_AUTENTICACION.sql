-- ============================================================================
-- FASE 2: AUTENTICACIÓN - FUNCIONES Y TRIGGERS SQL
-- Ejecutar en Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- PASO 1: FUNCTION - CREAR USUARIO AUTOMÁTICAMENTE AL REGISTRARSE
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
  -- Obtener el establecimiento del primer admin (si existe)
  -- En producción, esto debe asociarse correctamente
  SELECT id INTO id_establecimiento_temp FROM establecimientos LIMIT 1;
  
  INSERT INTO public.usuarios (uid, email, nombre_completo, rol, id_establecimiento)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre_completo', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'rol', 'PROFESOR'),
    id_establecimiento_temp
  )
  ON CONFLICT (uid) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- ============================================================================
-- PASO 2: TRIGGER - EJECUTAR CUANDO SE CREA USUARIO EN AUTH
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- PASO 3: FUNCTION - SINCRONIZAR CAMBIOS DE LOGIN
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Actualizar email en tabla usuarios si cambió en auth
  IF NEW.email <> OLD.email THEN
    UPDATE public.usuarios
    SET email = NEW.email,
        actualizado_en = now()
    WHERE uid = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- ============================================================================
-- PASO 4: TRIGGER - EJECUTAR CUANDO SE ACTUALIZA USUARIO EN AUTH
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_update();

-- ============================================================================
-- PASO 5: FUNCTION - ELIMINAR USUARIO CUANDO SE ELIMINA EN AUTH
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_user_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Marcar usuario como inactivo en lugar de eliminar
  UPDATE public.usuarios
  SET activo = false,
      actualizado_en = now()
  WHERE uid = OLD.id;
  
  RETURN OLD;
END;
$$;

-- ============================================================================
-- PASO 6: TRIGGER - EJECUTAR CUANDO SE ELIMINA USUARIO EN AUTH
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_delete();

-- ============================================================================
-- PASO 7: FUNCTION - CREAR USUARIO MANUALMENTE (PARA ADMINS)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.crear_usuario_manual(
  p_email TEXT,
  p_nombre_completo TEXT,
  p_rol TEXT,
  p_id_establecimiento UUID,
  p_password TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id UUID;
  v_rol_usuario TEXT;
BEGIN
  -- Verificar que el usuario actual es ADMIN
  v_rol_usuario := (SELECT rol FROM usuarios WHERE uid = auth.uid() LIMIT 1);
  
  IF v_rol_usuario != 'ADMIN' THEN
    RAISE EXCEPTION 'Solo ADMINs pueden crear usuarios';
  END IF;
  
  -- Validar rol
  IF p_rol NOT IN ('ADMIN', 'INSPECTOR', 'PROFESOR', 'ESTUDIANTE', 'APODERADO') THEN
    RAISE EXCEPTION 'Rol inválido: %', p_rol;
  END IF;
  
  -- Insertar directo en tabla usuarios (auth se configura desde UI)
  INSERT INTO public.usuarios (uid, email, nombre_completo, rol, id_establecimiento)
  VALUES (gen_random_uuid(), p_email, p_nombre_completo, p_rol, p_id_establecimiento)
  RETURNING uid INTO v_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'email', p_email,
    'mensaje', 'Usuario creado. El usuario debe registrarse en auth.users desde la aplicación.'
  );
END;
$$;

-- ============================================================================
-- PASO 8: FUNCTION - ASIGNAR ROL A USUARIO
-- ============================================================================

CREATE OR REPLACE FUNCTION public.asignar_rol(
  p_user_id UUID,
  p_nuevo_rol TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rol_actual TEXT;
BEGIN
  -- Verificar que el usuario actual es ADMIN
  v_rol_actual := (SELECT rol FROM usuarios WHERE uid = auth.uid() LIMIT 1);
  
  IF v_rol_actual != 'ADMIN' THEN
    RAISE EXCEPTION 'Solo ADMINs pueden asignar roles';
  END IF;
  
  -- Validar rol
  IF p_nuevo_rol NOT IN ('ADMIN', 'INSPECTOR', 'PROFESOR', 'ESTUDIANTE', 'APODERADO') THEN
    RAISE EXCEPTION 'Rol inválido: %', p_nuevo_rol;
  END IF;
  
  -- Actualizar rol
  UPDATE public.usuarios
  SET rol = p_nuevo_rol,
      actualizado_en = now()
  WHERE id = p_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'nuevo_rol', p_nuevo_rol
  );
END;
$$;

-- ============================================================================
-- PASO 9: FUNCTION - OBTENER DATOS DEL USUARIO ACTUAL
-- ============================================================================

CREATE OR REPLACE FUNCTION public.obtener_usuario_actual()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_usuario RECORD;
BEGIN
  SELECT id, uid, email, nombre_completo, rol, id_establecimiento, activo
  INTO v_usuario
  FROM usuarios
  WHERE uid = auth.uid()
  LIMIT 1;
  
  IF v_usuario IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Usuario no encontrado'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'id', v_usuario.id,
    'uid', v_usuario.uid,
    'email', v_usuario.email,
    'nombre_completo', v_usuario.nombre_completo,
    'rol', v_usuario.rol,
    'id_establecimiento', v_usuario.id_establecimiento,
    'activo', v_usuario.activo
  );
END;
$$;

-- ============================================================================
-- PASO 10: FUNCTION - VERIFICAR PERMISO
-- ============================================================================

CREATE OR REPLACE FUNCTION public.tiene_permiso(
  p_permiso TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rol TEXT;
BEGIN
  -- Obtener rol del usuario actual
  SELECT rol INTO v_rol FROM usuarios WHERE uid = auth.uid() LIMIT 1;
  
  IF v_rol IS NULL THEN
    RETURN false;
  END IF;
  
  -- ADMINs tienen todos los permisos
  IF v_rol = 'ADMIN' THEN
    RETURN true;
  END IF;
  
  -- Verificar si el rol tiene el permiso
  RETURN EXISTS (
    SELECT 1 FROM rol_permisos rp
    JOIN permisos p ON rp.id_permiso = p.id
    WHERE rp.rol = v_rol
    AND p.nombre = p_permiso
    AND p.activo = true
  );
END;
$$;

-- ============================================================================
-- PASO 11: FUNCTION - DESACTIVAR USUARIO
-- ============================================================================

CREATE OR REPLACE FUNCTION public.desactivar_usuario(
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rol_actual TEXT;
BEGIN
  -- Verificar que el usuario actual es ADMIN
  v_rol_actual := (SELECT rol FROM usuarios WHERE uid = auth.uid() LIMIT 1);
  
  IF v_rol_actual != 'ADMIN' THEN
    RAISE EXCEPTION 'Solo ADMINs pueden desactivar usuarios';
  END IF;
  
  -- Desactivar usuario
  UPDATE public.usuarios
  SET activo = false,
      actualizado_en = now()
  WHERE id = p_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'mensaje', 'Usuario desactivado'
  );
END;
$$;

-- ============================================================================
-- PASO 12: FUNCTION - REACTIVAR USUARIO
-- ============================================================================

CREATE OR REPLACE FUNCTION public.reactivar_usuario(
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rol_actual TEXT;
BEGIN
  -- Verificar que el usuario actual es ADMIN
  v_rol_actual := (SELECT rol FROM usuarios WHERE uid = auth.uid() LIMIT 1);
  
  IF v_rol_actual != 'ADMIN' THEN
    RAISE EXCEPTION 'Solo ADMINs pueden reactivar usuarios';
  END IF;
  
  -- Reactivar usuario
  UPDATE public.usuarios
  SET activo = true,
      actualizado_en = now()
  WHERE id = p_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'mensaje', 'Usuario reactivado'
  );
END;
$$;

-- ============================================================================
-- PASO 13: CREAR ÍNDICE PARA OPTIMIZAR BÚSQUEDAS DE AUTH
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_usuarios_auth_uid ON usuarios(uid);
CREATE INDEX IF NOT EXISTS idx_usuarios_activo ON usuarios(activo);
CREATE INDEX IF NOT EXISTS idx_auth_users_email ON auth.users(email);

-- ============================================================================
-- PASO 14: INSERTAR ADMIN INICIAL (IMPORTANTE)
-- ============================================================================

-- Este paso debe ejecutarse MANUALMENTE después de crear el primer usuario en Supabase Auth
-- 1. Registro manual en Supabase Auth (UI)
-- 2. Copiar el UID del usuario registrado
-- 3. Reemplazar 'AQUI_VA_EL_UID' abajo
-- 4. Ejecutar este INSERT

-- DESCOMENTAR Y COMPLETAR CON UID REAL:
/*
INSERT INTO usuarios (uid, email, nombre_completo, rol, id_establecimiento, activo)
SELECT
  'AQUI_VA_EL_UID',
  email,
  email as nombre_completo,
  'ADMIN',
  (SELECT id FROM establecimientos LIMIT 1),
  true
FROM auth.users
WHERE id = 'AQUI_VA_EL_UID'
ON CONFLICT (uid) DO NOTHING;
*/

-- ============================================================================
-- PASO 15: CREAR VISTA PARA USUARIOS ACTIVOS
-- ============================================================================

CREATE OR REPLACE VIEW usuarios_activos AS
SELECT 
  id,
  uid,
  email,
  nombre_completo,
  rol,
  id_establecimiento,
  creado_en,
  actualizado_en
FROM usuarios
WHERE activo = true
ORDER BY nombre_completo;

-- ============================================================================
-- PASO 16: VERIFICACIÓN Y TESTING
-- ============================================================================

-- Ejecutar estas queries para verificar que todo está bien:
/*

-- Ver todas las funciones creadas:
SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';

-- Ver todos los triggers:
SELECT * FROM information_schema.triggers WHERE trigger_schema = 'public';

-- Ver usuarios activos:
SELECT * FROM usuarios_activos;

-- Verificar política de ejemplo (probar con un usuario logeado):
SELECT * FROM usuarios WHERE id_establecimiento = obtener_id_establecimiento();

-- Verificar rol del usuario actual:
SELECT obtener_rol_usuario();

-- Probar función de permiso:
SELECT tiene_permiso('ver_estudiantes');

*/

-- ============================================================================
-- RESUMEN DE FUNCIONES CREADAS
-- ============================================================================

/*

1. handle_new_user()
   - Trigger: Se ejecuta cuando se crea usuario en auth.users
   - Crea automáticamente registro en tabla usuarios

2. handle_user_update()
   - Trigger: Se ejecuta cuando se actualiza usuario en auth.users
   - Sincroniza cambios de email

3. handle_user_delete()
   - Trigger: Se ejecuta cuando se elimina usuario en auth.users
   - Marca usuario como inactivo en lugar de eliminar

4. crear_usuario_manual(p_email, p_nombre_completo, p_rol, p_id_establecimiento)
   - Solo ADMINs pueden usar
   - Crea usuario en tabla usuarios (no en auth)

5. asignar_rol(p_user_id, p_nuevo_rol)
   - Solo ADMINs pueden usar
   - Cambia rol de un usuario

6. obtener_usuario_actual()
   - Retorna datos del usuario logeado actual
   - Retorna JSON con todos los datos

7. tiene_permiso(p_permiso)
   - Verifica si usuario actual tiene permiso
   - ADMINs tienen todos los permisos

8. desactivar_usuario(p_user_id)
   - Solo ADMINs pueden usar
   - Marca usuario como inactivo

9. reactivar_usuario(p_user_id)
   - Solo ADMINs pueden usar
   - Marca usuario como activo nuevamente

VISTAS:
- usuarios_activos: Vista que muestra solo usuarios activos

*/

-- ============================================================================
-- CONFIGURACIÓN FINAL EN SUPABASE UI
-- ============================================================================

/*

1. Ir a Supabase Dashboard → Authentication → Settings
2. Verificar:
   - Site URL: https://tu-dominio.com (producción) o https://localhost:5173 (desarrollo)
   - Redirect URLs: Agregar tus URLs de callback
   
3. Ir a Supabase Dashboard → Authentication → Providers
4. Email/Password:
   - Habilitar
   - Auto confirm users (para testing)
   
5. Ir a Supabase Dashboard → Authentication → Email Templates
6. Personalizar templates de bienvenida si es necesario

7. Ir a Supabase Dashboard → Database → Webhooks (Opcional)
8. Crear webhooks para eventos de auth si es necesario

*/

-- ============================================================================
-- FIN - FASE 2: AUTENTICACIÓN
-- ============================================================================
