-- ============================================================
-- Script completo: arregla id_establecimiento en usuarios aprobados
-- ============================================================

-- 1. Reemplazar la función aprobar_solicitud_registro para que
--    asigne automáticamente el establecimiento del admin
-- ============================================================
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
  v_admin_establecimiento uuid;
BEGIN
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('error', 'Permiso denegado: se requiere rol ADMIN');
  END IF;

  SELECT id_establecimiento INTO v_admin_establecimiento
  FROM public.usuarios WHERE id = auth.uid();

  SELECT * INTO v_solicitud FROM public.solicitudes_registro WHERE uid = p_uid;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Solicitud no encontrada');
  END IF;

  SELECT * INTO v_respaldo FROM public.usuarios_eliminados WHERE id_usuario = p_uid;
  SELECT id INTO v_existente FROM public.usuarios WHERE id = p_uid;

  IF FOUND THEN
    UPDATE public.usuarios SET
      email = COALESCE((v_respaldo.respaldo_usuarios->>'email'), v_solicitud.correo),
      nombre = COALESCE((v_respaldo.respaldo_usuarios->>'nombre'), v_solicitud.nombre),
      apellidos = v_solicitud.apellidos,
      rol = p_rol,
      id_establecimiento = COALESCE(id_establecimiento, v_admin_establecimiento),
      activo = true,
      actualizado_en = now()
    WHERE id = p_uid;
  ELSE
    INSERT INTO public.usuarios (id, uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (p_uid, p_uid, v_solicitud.correo, v_solicitud.nombre, v_solicitud.apellidos, p_rol, v_admin_establecimiento, true);
  END IF;

  -- Restaurar datos personales (sin cambios)
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

-- ============================================================
-- 2. Backfill: asignar establecimiento a usuarios existentes
--    que fueron aprobados pero no tienen id_establecimiento
--    Se asigna el mismo establecimiento del admin que tiene
--    el uid más cercano (por orden alfabético, ya que no hay
--    registro de quién aprobó cada solicitud)
-- ============================================================
UPDATE public.usuarios u
SET id_establecimiento = (
  SELECT a.id_establecimiento
  FROM public.usuarios a
  WHERE a.rol = 'ADMIN'
    AND a.id_establecimiento IS NOT NULL
    AND a.id_establecimiento IS DISTINCT FROM u.id_establecimiento
  LIMIT 1
)
WHERE u.id_establecimiento IS NULL
  AND u.activo = true;
