-- ============================================================
-- Normalizar admin: actualizar usuarios.id para que coincida
-- con auth.uid() real. Esto evita depender de auth.email()
-- en is_admin()/es_admin() para el admin principal.
-- ============================================================

DO $$
DECLARE
  v_email_admin     text;
  v_auth_uid        uuid;
  v_usuarios_id     uuid;
  v_duplicado_id    uuid;
BEGIN
  -- 1. Obtener el email del admin desde auth.users (el que usó Google)
  SELECT email INTO v_email_admin
  FROM auth.users
  WHERE email IN ('admin@test.com', 'testadmin_4486@test.com')
  ORDER BY email
  LIMIT 1;

  IF v_email_admin IS NULL THEN
    RAISE EXCEPTION 'No se encontró admin en auth.users';
  END IF;

  RAISE NOTICE 'Admin email: %', v_email_admin;

  -- 2. Obtener el auth.uid() real desde auth.users
  SELECT id INTO v_auth_uid
  FROM auth.users
  WHERE email = v_email_admin;

  RAISE NOTICE 'Auth UID real: %', v_auth_uid;

  -- 3. Buscar el registro en usuarios por email
  SELECT id INTO v_usuarios_id
  FROM public.usuarios
  WHERE email = v_email_admin;

  IF v_usuarios_id IS NULL THEN
    RAISE EXCEPTION 'No hay registro en usuarios para %', v_email_admin;
  END IF;

  RAISE NOTICE 'usuarios.id actual: %', v_usuarios_id;

  -- 4. Si ya coinciden, no hacer nada
  IF v_usuarios_id = v_auth_uid THEN
    RAISE NOTICE 'Ya coinciden, no hay acción necesaria';
    RETURN;
  END IF;

  -- 5. Verificar si ya existe un registro con el auth UID como id
  SELECT id INTO v_duplicado_id
  FROM public.usuarios
  WHERE id = v_auth_uid;

  IF v_duplicado_id IS NOT NULL THEN
    RAISE NOTICE 'Ya existe un registro con id = auth.uid (%), se eliminará el duplicado', v_auth_uid;
  END IF;

  -- 6. Actualizar o fusionar
  IF v_duplicado_id IS NOT NULL THEN
    -- Hay un duplicado con el auth UID: migrar datos al duplicado y eliminar el original
    -- (o viceversa según corresponda)
    UPDATE public.usuarios
    SET
      email         = (SELECT email FROM public.usuarios WHERE id = v_auth_uid),
      nombre        = COALESCE((SELECT nombre FROM public.usuarios WHERE id = v_usuarios_id), (SELECT nombre FROM public.usuarios WHERE id = v_auth_uid)),
      apellidos     = COALESCE((SELECT apellidos FROM public.usuarios WHERE id = v_usuarios_id), (SELECT apellidos FROM public.usuarios WHERE id = v_auth_uid)),
      rol           = 'ADMIN',
      id_establecimiento = COALESCE(
        (SELECT id_establecimiento FROM public.usuarios WHERE id = v_usuarios_id),
        (SELECT id_establecimiento FROM public.usuarios WHERE id = v_auth_uid)
      ),
      activo        = true,
      foto_url      = COALESCE((SELECT foto_url FROM public.usuarios WHERE id = v_usuarios_id), (SELECT foto_url FROM public.usuarios WHERE id = v_auth_uid)),
      uid           = v_auth_uid::text
    WHERE id = v_auth_uid;

    -- Eliminar el registro duplicado (el que tiene el id seed)
    -- Las FKs que apuntaban al seed id deben actualizarse primero
    UPDATE public.funcionarios SET id_usuario = v_auth_uid WHERE id_usuario = v_usuarios_id;
    UPDATE public.equipos SET id_usuario = v_auth_uid WHERE id_usuario = v_usuarios_id;
    -- requerimientos usa id_solicitante e id_tecnico_asignado
    UPDATE public.requerimientos SET id_solicitante = v_auth_uid WHERE id_solicitante = v_usuarios_id;
    UPDATE public.requerimientos SET id_tecnico_asignado = v_auth_uid WHERE id_tecnico_asignado = v_usuarios_id;
    -- solicitudes_registro uid es text
    UPDATE public.solicitudes_registro SET uid = v_auth_uid::text WHERE uid = v_usuarios_id::text;
    -- datospersonalesusuarios uid es text
    UPDATE public.datospersonalesusuarios SET uid = v_auth_uid::text WHERE uid = v_usuarios_id::text;
    -- online colección
    UPDATE public.online SET id_usuario = v_auth_uid WHERE id_usuario = v_usuarios_id;

    DELETE FROM public.usuarios WHERE id = v_usuarios_id;
    RAISE NOTICE 'Registro duplicado eliminado. admin ahora usa id=%', v_auth_uid;
  ELSE
    -- No hay duplicado: actualizar el id directamente
    -- Esto requiere que no haya FKs apuntando al id viejo, o usar ON UPDATE CASCADE
    -- Como Supabase no tiene CASCADE por defecto, hay que actualizar manualmente
    UPDATE public.funcionarios SET id_usuario = v_auth_uid WHERE id_usuario = v_usuarios_id;
    UPDATE public.equipos SET id_usuario = v_auth_uid WHERE id_usuario = v_usuarios_id;
    UPDATE public.requerimientos SET id_solicitante = v_auth_uid WHERE id_solicitante = v_usuarios_id;
    UPDATE public.requerimientos SET id_tecnico_asignado = v_auth_uid WHERE id_tecnico_asignado = v_usuarios_id;
    UPDATE public.solicitudes_registro SET uid = v_auth_uid::text WHERE uid = v_usuarios_id::text;
    UPDATE public.datospersonalesusuarios SET uid = v_auth_uid::text WHERE uid = v_usuarios_id::text;
    UPDATE public.online SET id_usuario = v_auth_uid WHERE id_usuario = v_usuarios_id;

    UPDATE public.usuarios SET id = v_auth_uid, uid = v_auth_uid::text WHERE id = v_usuarios_id;

    RAISE NOTICE 'usuarios.id actualizado de % a %', v_usuarios_id, v_auth_uid;
  END IF;

  RAISE NOTICE '✅ Admin normalizado correctamente';
END $$;
