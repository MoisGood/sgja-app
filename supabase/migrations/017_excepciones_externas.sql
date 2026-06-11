-- Crear tabla de excepciones por email (usan cualquier dominio, tienen rol asignado)
CREATE TABLE IF NOT EXISTS excepciones_externas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  id_establecimiento uuid NOT NULL REFERENCES establecimientos(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  rol text NOT NULL,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE excepciones_externas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "excepciones_externas_select" ON excepciones_externas FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "excepciones_externas_insert" ON excepciones_externas FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "excepciones_externas_update" ON excepciones_externas FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "excepciones_externas_delete" ON excepciones_externas FOR DELETE USING (auth.role() = 'authenticated');

-- Actualizar funcion para que incluya excepciones
CREATE OR REPLACE FUNCTION public.verificar_acceso_externo(p_email text, p_token text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dominio text;
  v_activo boolean;
  v_token_valido boolean;
  v_excepcion record;
BEGIN
  v_dominio := split_part(p_email, '@', 2);

  IF p_token IS NOT NULL AND p_token != '' THEN
    SELECT EXISTS (
      SELECT 1 FROM tokens_acceso_externo
      WHERE token = p_token
        AND (email_destino IS NULL OR email_destino = p_email)
        AND expires_at > now()
        AND usado = false
    ) INTO v_token_valido;
    IF v_token_valido THEN
      UPDATE tokens_acceso_externo SET usado = true
      WHERE token = p_token AND email_destino IS NOT NULL AND email_destino = p_email;
      RETURN jsonb_build_object('permitido', true, 'token_usado', true);
    END IF;
  END IF;

  -- Verificar excepcion por email
  SELECT * INTO v_excepcion FROM excepciones_externas
  WHERE email = p_email AND activo = true;
  IF FOUND THEN
    RETURN jsonb_build_object('permitido', true, 'excepcion', true, 'rol', v_excepcion.rol);
  END IF;

  -- Verificar dominio autorizado
  SELECT EXISTS (
    SELECT 1 FROM dominios_externos WHERE dominio = v_dominio AND activo = true
  ) INTO v_activo;

  IF p_email = 'soportetipresente@gmail.com' THEN
    RETURN jsonb_build_object('permitido', true, 'admin', true);
  END IF;

  IF v_activo THEN
    RETURN jsonb_build_object('permitido', true, 'dominio', v_dominio);
  END IF;

  RETURN jsonb_build_object('permitido', false, 'dominio', v_dominio);
END;
$$;
