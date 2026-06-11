-- Insertar colaboradores desde CSV que no existan en funcionarios
CREATE OR REPLACE FUNCTION public.importar_colaborador(
  p_rut text,
  p_rut_formateado text,
  p_nombre_completo text,
  p_correo_institucional text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existente record;
BEGIN
  SELECT rut, correo_institucional INTO v_existente
  FROM funcionarios
  WHERE rut = p_rut OR correo_institucional = p_correo_institucional
  LIMIT 1;

  IF v_existente IS NOT NULL THEN
    UPDATE funcionarios
    SET nombre_completo = p_nombre_completo,
        correo_institucional = p_correo_institucional,
        actualizado_en = NOW()
    WHERE rut = v_existente.rut;
    RETURN jsonb_build_object('accion', 'actualizado', 'rut', v_existente.rut);
  ELSE
    INSERT INTO funcionarios (
      rut, rut_formateado, nombre_completo,
      domicilio, comuna, celular,
      correo_personal, correo_institucional,
      tipo_funcionario, tipo_contrato,
      vigente, creado_en, actualizado_en
    ) VALUES (
      p_rut, p_rut_formateado, p_nombre_completo,
      'S/D', 'S/D', 'S/D',
      p_correo_institucional, p_correo_institucional,
      'otro', 'plazo_fijo',
      true, NOW(), NOW()
    );
    RETURN jsonb_build_object('accion', 'insertado', 'rut', p_rut);
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.importar_colaborador TO authenticated;
