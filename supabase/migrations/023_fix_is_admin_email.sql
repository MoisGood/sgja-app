-- ============================================================
-- SGJA – Fix is_admin / es_admin to use auth.email()
-- El admin tiene usuarios.id (550e8400-...) ≠ auth.uid()
-- (c88e105c-...), por lo que id = auth.uid() nunca funciona
-- para el admin real. Se cambia a email = auth.email().
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. is_admin() – usado por funciones SECURITY DEFINER
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE email = auth.email() AND rol = 'ADMIN' AND activo = true
  );
$$;

-- ────────────────────────────────────────────────────────────
-- 2. es_admin() – usado por políticas RLS
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.es_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE email = auth.email() AND rol = 'ADMIN' AND activo = true
  );
$$;

-- ────────────────────────────────────────────────────────────
-- 3. Fix eliminar_usuario_permanente: funcionarios no tiene
--    columna "id", usa "id_usuario"
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
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('error', 'Permiso denegado: se requiere rol ADMIN');
  END IF;

  SELECT * INTO v_usuario FROM public.usuarios WHERE id = p_id_usuario;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Usuario no encontrado');
  END IF;

  SELECT * INTO v_funcionario FROM public.funcionarios WHERE id_usuario = p_id_usuario;

  SELECT * INTO v_datospersonales FROM public.datospersonalesusuarios WHERE uid = COALESCE(v_usuario.uid, p_id_usuario::text);

  INSERT INTO public.usuarios_eliminados (
    id_usuario, uid, email, nombre, rut, motivo,
    respaldo_usuarios, respaldo_funcionarios, respaldo_datospersonales
  ) VALUES (
    p_id_usuario, v_usuario.uid, v_usuario.email, v_usuario.nombre,
    v_funcionario.rut, p_motivo,
    row_to_json(v_usuario)::jsonb,
    CASE WHEN v_funcionario.id_usuario IS NOT NULL THEN row_to_json(v_funcionario)::jsonb ELSE NULL END,
    CASE WHEN v_datospersonales.uid IS NOT NULL THEN row_to_json(v_datospersonales)::jsonb ELSE NULL END
  );

  IF v_funcionario.id_usuario IS NOT NULL THEN
    DELETE FROM public.funcionarios WHERE id_usuario = p_id_usuario;
  END IF;

  IF v_datospersonales.uid IS NOT NULL THEN
    DELETE FROM public.datospersonalesusuarios WHERE uid = COALESCE(v_usuario.uid, p_id_usuario::text);
  END IF;

  UPDATE public.usuarios
  SET activo = false, actualizado_en = now()
  WHERE id = p_id_usuario;

  RETURN jsonb_build_object('error', null);
END;
$$;
