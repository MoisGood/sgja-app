-- ============================================================
-- Fix RPC insertar_equipo: agregar p_id_usuario y p_foto_url
-- ============================================================

CREATE OR REPLACE FUNCTION insertar_equipo(
  p_nombre text,
  p_id_establecimiento uuid,
  p_id_lugar uuid DEFAULT NULL,
  p_marca text DEFAULT NULL,
  p_modelo text DEFAULT NULL,
  p_tipo_equipo text DEFAULT NULL,
  p_numero_serie text DEFAULT NULL,
  p_estado text DEFAULT 'Operativo',
  p_cod_inventario text DEFAULT NULL,
  p_id_usuario uuid DEFAULT NULL,
  p_foto_url text DEFAULT NULL
) RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  INSERT INTO equipos (nombre, id_establecimiento, id_lugar, marca, modelo, tipo_equipo, numero_serie, estado, cod_inventario, id_usuario, foto_url)
  VALUES (p_nombre, p_id_establecimiento, p_id_lugar, p_marca, p_modelo, p_tipo_equipo, p_numero_serie, p_estado, p_cod_inventario, p_id_usuario, p_foto_url)
  RETURNING jsonb_build_object(
    'id', id, 'nombre', nombre, 'marca', marca, 'modelo', modelo,
    'tipo_equipo', tipo_equipo, 'numero_serie', numero_serie, 'estado', estado,
    'cod_inventario', cod_inventario, 'id_usuario', id_usuario, 'foto_url', foto_url
  ) INTO v_result;
  RETURN v_result;
END;
$$;
