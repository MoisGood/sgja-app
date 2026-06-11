-- 0. Eliminar funcion vieja primero
DROP FUNCTION IF EXISTS public.aprobar_solicitud_registro(uuid, text);
DROP FUNCTION IF EXISTS public.rechazar_solicitud_registro(uuid);

-- 1. Eliminar politicas que dependen de uid
DROP POLICY IF EXISTS "sr_select_own" ON solicitudes_registro;
DROP POLICY IF EXISTS "solicitudes_registro_select_all" ON solicitudes_registro;
DROP POLICY IF EXISTS "solicitudes_registro_insert_authenticated" ON solicitudes_registro;
DROP POLICY IF EXISTS "solicitudes_registro_admin_insert" ON solicitudes_registro;
DROP POLICY IF EXISTS "solicitudes_registro_admin_update" ON solicitudes_registro;
DROP POLICY IF EXISTS "solicitudes_registro_admin_delete" ON solicitudes_registro;

-- 2. Cambiar tipo de uid a TEXT
ALTER TABLE solicitudes_registro ALTER COLUMN uid TYPE text;

-- 3. Recrear politicas
CREATE POLICY "solicitudes_registro_select_all" ON solicitudes_registro
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "solicitudes_registro_insert_authenticated" ON solicitudes_registro
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "solicitudes_registro_admin_update" ON solicitudes_registro
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "solicitudes_registro_admin_delete" ON solicitudes_registro
  FOR DELETE USING (auth.role() = 'authenticated');

-- 4. Modificar funcion de aprobacion
CREATE OR REPLACE FUNCTION public.aprobar_solicitud_registro(
  p_uid text,
  p_rol text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_solicitud record;
BEGIN
  SELECT * INTO v_solicitud FROM public.solicitudes_registro WHERE uid = p_uid;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Solicitud no encontrada');
  END IF;

  INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, activo)
  VALUES (p_uid, v_solicitud.correo, v_solicitud.nombre, v_solicitud.apellidos, p_rol, true)
  ON CONFLICT (uid) DO UPDATE SET rol = p_rol, activo = true;

  UPDATE public.solicitudes_registro SET
    estado = 'aprobado',
    respuesta_enviada = false,
    fecha_respuesta = now()
  WHERE uid = p_uid;

  RETURN jsonb_build_object('error', null);
END;
$$;

-- 5. Actualizar funcion de rechazo
DROP FUNCTION IF EXISTS public.rechazar_solicitud_registro(text);
CREATE OR REPLACE FUNCTION public.rechazar_solicitud_registro(p_uid text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.solicitudes_registro SET
    estado = 'rechazado',
    respuesta_enviada = false,
    fecha_respuesta = now()
  WHERE uid = p_uid;
  RETURN jsonb_build_object('error', null);
END;
$$;
