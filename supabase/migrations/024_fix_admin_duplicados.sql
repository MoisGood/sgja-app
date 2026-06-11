-- ============================================================
-- SOLUCIÓN DEFINITIVA para "Permiso denegado: se requiere rol ADMIN"
-- 1. Fusiona admins duplicados (seed id ≠ auth.uid)
-- 2. Normaliza is_admin() para que funcione con id real
-- ============================================================

DO $$
DECLARE
  v_rec           record;
  v_auth_uid      uuid;
  v_seed_id       uuid;
  v_count         int;
  v_admin_email   text;
BEGIN
  -- Buscar TODOS los emails que tienen rol ADMIN y existen en auth.users
  FOR v_rec IN
    SELECT DISTINCT u.email
    FROM public.usuarios u
    INNER JOIN auth.users au ON au.email = u.email
    WHERE u.rol = 'ADMIN' AND u.activo = true
  LOOP
    v_admin_email := v_rec.email;
    RAISE NOTICE 'Procesando admin: %', v_admin_email;

    SELECT id INTO v_auth_uid FROM auth.users WHERE email = v_admin_email;
    SELECT count(*) INTO v_count FROM public.usuarios WHERE email = v_admin_email;

    RAISE NOTICE '  auth.uid() = %  registros = %', v_auth_uid, v_count;

    -- Si solo hay 1 registro y ya coincide, está bien
    IF v_count = 1 THEN
      SELECT id INTO v_seed_id FROM public.usuarios WHERE email = v_admin_email;
      IF v_seed_id = v_auth_uid THEN
        RAISE NOTICE '  ✅ Ya está correcto';
      ELSE
        RAISE NOTICE '  ⚠️  Un solo registro pero id=% ≠ auth.uid. Creando auth row...', v_seed_id;
        -- Copiar datos al auth uid y eliminar el seed
        UPDATE public.funcionarios SET id_usuario = v_auth_uid WHERE id_usuario = v_seed_id;
        UPDATE public.equipos SET id_usuario = v_auth_uid WHERE id_usuario = v_seed_id;
        UPDATE public.requerimientos SET id_solicitante = v_auth_uid WHERE id_solicitante = v_seed_id;
        UPDATE public.requerimientos SET id_tecnico_asignado = v_auth_uid WHERE id_tecnico_asignado = v_seed_id;
        UPDATE public.requerimientos SET id_tecnico_cierre = v_auth_uid WHERE id_tecnico_cierre = v_seed_id;
        UPDATE public.solicitudes_registro SET uid = v_auth_uid::text WHERE uid = v_seed_id::text;
        UPDATE public.datospersonalesusuarios SET uid = v_auth_uid::text WHERE uid = v_seed_id::text;
        UPDATE public.online SET id_usuario = v_auth_uid WHERE id_usuario = v_seed_id;
        UPDATE public.usuarios_eliminados SET id_usuario = v_auth_uid::text WHERE id_usuario = v_seed_id::text;

        INSERT INTO public.usuarios (id, uid, email, nombre, apellidos, rol, id_establecimiento, activo, foto_url, creado_en, actualizado_en)
        SELECT v_auth_uid, v_auth_uid::text, email, nombre, apellidos, rol, id_establecimiento, activo, foto_url, creado_en, now()
        FROM public.usuarios WHERE id = v_seed_id;

        DELETE FROM public.usuarios WHERE id = v_seed_id;
        RAISE NOTICE '  ✅ Creado auth row con id=% y eliminado seed', v_auth_uid;
      END IF;
      CONTINUE;
    END IF;

    -- Múltiples registros: identificar seed (el que NO coincide con auth.uid)
    SELECT id INTO v_seed_id
    FROM public.usuarios
    WHERE email = v_admin_email AND id != v_auth_uid
    LIMIT 1;

    IF EXISTS (SELECT 1 FROM public.usuarios WHERE email = v_admin_email AND id = v_auth_uid) THEN
      RAISE NOTICE '  🔀 Duplicado: seed=% auth=%', v_seed_id, v_auth_uid;

      -- Promover auth row a ADMIN con datos del seed
      UPDATE public.usuarios
      SET rol = 'ADMIN',
          nombre = COALESCE((SELECT nombre FROM public.usuarios WHERE id = v_seed_id), nombre),
          apellidos = COALESCE((SELECT apellidos FROM public.usuarios WHERE id = v_seed_id), apellidos),
          id_establecimiento = COALESCE((SELECT id_establecimiento FROM public.usuarios WHERE id = v_seed_id), id_establecimiento),
          activo = true,
          uid = v_auth_uid::text,
          actualizado_en = now()
      WHERE id = v_auth_uid;

      -- Migrar FKs del seed al auth
      UPDATE public.funcionarios SET id_usuario = v_auth_uid WHERE id_usuario = v_seed_id;
      UPDATE public.equipos SET id_usuario = v_auth_uid WHERE id_usuario = v_seed_id;
      UPDATE public.requerimientos SET id_solicitante = v_auth_uid WHERE id_solicitante = v_seed_id;
      UPDATE public.requerimientos SET id_tecnico_asignado = v_auth_uid WHERE id_tecnico_asignado = v_seed_id;
      UPDATE public.requerimientos SET id_tecnico_cierre = v_auth_uid WHERE id_tecnico_cierre = v_seed_id;
      UPDATE public.solicitudes_registro SET uid = v_auth_uid::text WHERE uid = v_seed_id::text;
      UPDATE public.datospersonalesusuarios SET uid = v_auth_uid::text WHERE uid = v_seed_id::text;
      UPDATE public.online SET id_usuario = v_auth_uid WHERE id_usuario = v_seed_id;
      UPDATE public.usuarios_eliminados SET id_usuario = v_auth_uid::text WHERE id_usuario = v_seed_id::text;

      DELETE FROM public.usuarios WHERE id = v_seed_id;
      RAISE NOTICE '  ✅ Seed % eliminado, auth % promovido', v_seed_id, v_auth_uid;
    ELSE
      RAISE NOTICE '  ⚠️  No hay registro con id = auth.uid. Sin acción para %', v_admin_email;
    END IF;
  END LOOP;
END $$;

-- ============================================================
-- Recrear is_admin() y es_admin() con soporte DUAL:
--    id = auth.uid()   → funciona después de la fusión
--    OR
--    email = auth.email() → funciona SIEMPRE (fallback)
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE (id = auth.uid() OR email = auth.email())
      AND rol = 'ADMIN' AND activo = true
  );
$$;

CREATE OR REPLACE FUNCTION public.es_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE (id = auth.uid() OR email = auth.email())
      AND rol = 'ADMIN' AND activo = true
  );
$$;
