-- ============================================================
-- SGJA – Migration 011: SECURITY DEFINER Functions + RLS Fixes
-- Reemplaza la dependencia de service_role key con RPCs
-- seguros que verifican rol ADMIN via auth.uid()
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. Helper: verificar que el usuario autenticado es ADMIN
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = auth.uid() AND rol = 'ADMIN' AND activo = true
  );
$$;

-- ────────────────────────────────────────────────────────────
-- 2. Eliminar usuario permanentemente (con respaldo)
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.eliminar_usuario_permanente(
  p_id_usuario uuid,
  p_motivo text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_usuario record;
  v_funcionario record;
  v_datospersonales record;
BEGIN
  -- Solo admins
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('error', 'Permiso denegado: se requiere rol ADMIN');
  END IF;

  -- Obtener datos del usuario
  SELECT * INTO v_usuario FROM public.usuarios WHERE id = p_id_usuario;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Usuario no encontrado');
  END IF;

  -- Obtener funcionario si existe
  SELECT * INTO v_funcionario FROM public.funcionarios WHERE id_usuario = p_id_usuario;

  -- Obtener datos personales si existe
  SELECT * INTO v_datospersonales FROM public.datospersonalesusuarios WHERE uid = COALESCE(v_usuario.uid, p_id_usuario::text);

  -- Insertar respaldo en usuarios_eliminados
  INSERT INTO public.usuarios_eliminados (
    id_usuario, uid, email, nombre, rut, motivo,
    respaldo_usuarios, respaldo_funcionarios, respaldo_datospersonales
  ) VALUES (
    p_id_usuario, v_usuario.uid, v_usuario.email, v_usuario.nombre,
    v_funcionario.rut, p_motivo,
    row_to_json(v_usuario)::jsonb,
    CASE WHEN v_funcionario.id IS NOT NULL THEN row_to_json(v_funcionario)::jsonb ELSE NULL END,
    CASE WHEN v_datospersonales.id IS NOT NULL THEN row_to_json(v_datospersonales)::jsonb ELSE NULL END
  );

  -- Eliminar de funcionarios
  IF v_funcionario.id IS NOT NULL THEN
    DELETE FROM public.funcionarios WHERE id_usuario = p_id_usuario;
  END IF;

  -- Eliminar de datos personales
  IF v_datospersonales.id IS NOT NULL THEN
    DELETE FROM public.datospersonalesusuarios WHERE uid = COALESCE(v_usuario.uid, p_id_usuario::text);
  END IF;

  -- Desactivar usuario (no se elimina por FKs)
  UPDATE public.usuarios
  SET activo = false, actualizado_en = now()
  WHERE id = p_id_usuario;

  RETURN jsonb_build_object('error', null);
END;
$$;

-- ────────────────────────────────────────────────────────────
-- 3. Aprobar solicitud de registro
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.aprobar_solicitud_registro(
  p_uid uuid,
  p_rol text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_solicitud record;
  v_respaldo record;
  v_existente record;
BEGIN
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('error', 'Permiso denegado: se requiere rol ADMIN');
  END IF;

  SELECT * INTO v_solicitud FROM public.solicitudes_registro WHERE uid = p_uid;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Solicitud no encontrada');
  END IF;

  -- Obtener respaldo de eliminación si existe
  SELECT * INTO v_respaldo FROM public.usuarios_eliminados WHERE id_usuario = p_uid;

  -- Verificar si el usuario ya existe (re-registro)
  SELECT id INTO v_existente FROM public.usuarios WHERE id = p_uid;

  IF FOUND THEN
    UPDATE public.usuarios SET
      email = COALESCE((v_respaldo.respaldo_usuarios->>'email'), v_solicitud.correo),
      nombre = COALESCE((v_respaldo.respaldo_usuarios->>'nombre'), v_solicitud.nombre),
      apellidos = v_solicitud.apellidos,
      rol = p_rol,
      activo = true,
      actualizado_en = now()
    WHERE id = p_uid;
  ELSE
    INSERT INTO public.usuarios (id, uid, email, nombre, apellidos, rol, activo)
    VALUES (p_uid, p_uid, v_solicitud.correo, v_solicitud.nombre, v_solicitud.apellidos, p_rol, true);
  END IF;

  -- Restaurar datos personales si había respaldo
  IF v_respaldo.id IS NOT NULL AND v_respaldo.respaldo_funcionarios IS NOT NULL THEN
    INSERT INTO public.funcionarios (
      id_usuario, rut, nombre_completo, celular, comuna, domicilio,
      emergencia_nombre, emergencia_telefono, emergencia_parentesco,
      correo_personal, vigente, actualizado_en
    ) VALUES (
      p_uid,
      v_respaldo.respaldo_funcionarios->>'rut',
      v_respaldo.respaldo_funcionarios->>'nombre_completo',
      v_respaldo.respaldo_funcionarios->>'celular',
      v_respaldo.respaldo_funcionarios->>'comuna',
      v_respaldo.respaldo_funcionarios->>'domicilio',
      v_respaldo.respaldo_funcionarios->>'emergencia_nombre',
      v_respaldo.respaldo_funcionarios->>'emergencia_telefono',
      v_respaldo.respaldo_funcionarios->>'emergencia_parentesco',
      v_respaldo.respaldo_funcionarios->>'correo_personal',
      true,
      now()
    )
    ON CONFLICT (id_usuario) DO UPDATE SET
      rut = EXCLUDED.rut,
      nombre_completo = EXCLUDED.nombre_completo,
      celular = EXCLUDED.celular,
      comuna = EXCLUDED.comuna,
      domicilio = EXCLUDED.domicilio,
      vigente = true,
      actualizado_en = now();
  END IF;

  UPDATE public.solicitudes_registro SET
    estado = 'aprobado',
    respuesta_enviada = false,
    fecha_respuesta = now()
  WHERE uid = p_uid;

  RETURN jsonb_build_object('error', null);
END;
$$;

-- ────────────────────────────────────────────────────────────
-- 4. Rechazar solicitud de registro
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.rechazar_solicitud_registro(p_uid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('error', 'Permiso denegado: se requiere rol ADMIN');
  END IF;

  UPDATE public.solicitudes_registro SET
    estado = 'rechazado',
    respuesta_enviada = false,
    fecha_respuesta = now()
  WHERE uid = p_uid;

  RETURN jsonb_build_object('error', null);
END;
$$;

-- ────────────────────────────────────────────────────────────
-- 5. Actualizar configuración del sistema
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.actualizar_config_sistema(p_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('error', 'Permiso denegado: se requiere rol ADMIN');
  END IF;

  INSERT INTO public.config_sistema (
    id, nombre_sistema, subtitulo, version, favicon_url, licencia, autoria
  ) VALUES (
    1,
    p_data->>'nombre_sistema',
    p_data->>'subtitulo',
    p_data->>'version',
    p_data->>'favicon_url',
    p_data->>'licencia',
    p_data->>'autoria'
  )
  ON CONFLICT (id) DO UPDATE SET
    nombre_sistema = COALESCE(p_data->>'nombre_sistema', config_sistema.nombre_sistema),
    subtitulo = COALESCE(p_data->>'subtitulo', config_sistema.subtitulo),
    version = COALESCE(p_data->>'version', config_sistema.version),
    favicon_url = COALESCE(p_data->>'favicon_url', config_sistema.favicon_url),
    licencia = COALESCE(p_data->>'licencia', config_sistema.licencia),
    autoria = COALESCE(p_data->>'autoria', config_sistema.autoria);

  RETURN jsonb_build_object('error', null);
END;
$$;

-- ────────────────────────────────────────────────────────────
-- 6. Crear usuario desde admin (Equipos)
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.crear_usuario_desde_admin(
  p_email text,
  p_nombre text,
  p_id_establecimiento uuid,
  p_rol text DEFAULT 'TECNICO'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
BEGIN
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('error', 'Permiso denegado: se requiere rol ADMIN');
  END IF;

  -- Nota: La creación del auth user se hace desde el frontend con signUp()
  -- Esta función solo crea el registro en la tabla usuarios
  -- El frontend pasa el uid después de signUp()

  RETURN jsonb_build_object('error', 'Esta función solo crea el perfil. Usar signUp() desde el frontend.');
END;
$$;

-- ════════════════════════════════════════════════════════════
-- Helper para RLS policies: devuelve true si es ADMIN
-- ════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.es_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = auth.uid() AND rol = 'ADMIN' AND activo = true
  );
$$;
