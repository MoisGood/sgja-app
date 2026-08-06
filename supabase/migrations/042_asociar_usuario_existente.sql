-- Crea o reactiva el perfil en public.usuarios para un email que ya está
-- registrado en auth.users (p. ej. cuentas creadas por signUp cuyo INSERT de
-- perfil falló, o usuarios eliminados permanentemente cuyo auth sigue vivo).
-- Devuelve el uid resuelto para que el frontend no necesite signUp.

CREATE OR REPLACE FUNCTION public.asociar_usuario_existente(
  p_email text,
  p_nombre text,
  p_rol text,
  p_id_establecimiento uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid           uuid;
  v_existente     record;
  v_email_lower   text;
BEGIN
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('error', 'Permiso denegado: se requiere rol ADMIN');
  END IF;

  v_email_lower := lower(btrim(p_email));

  SELECT id INTO v_uid
  FROM auth.users
  WHERE lower(email) = v_email_lower;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', null, 'encontrado', false, 'uid', null);
  END IF;

  SELECT id INTO v_existente
  FROM public.usuarios
  WHERE id = v_uid OR lower(email) = v_email_lower
  LIMIT 1;

  IF FOUND THEN
    UPDATE public.usuarios SET
      uid = v_uid::text,
      email = v_email_lower,
      nombre = p_nombre,
      rol = p_rol,
      id_establecimiento = p_id_establecimiento,
      activo = true,
      actualizado_en = now()
    WHERE id = v_existente.id;
  ELSE
    INSERT INTO public.usuarios (id, uid, email, nombre, rol, id_establecimiento, activo)
    VALUES (v_uid, v_uid::text, v_email_lower, p_nombre, p_rol, p_id_establecimiento, true);
  END IF;

  RETURN jsonb_build_object('error', null, 'encontrado', true, 'uid', v_uid::text);
END;
$$;
