-- ============================================================
-- SGJA – Migration 013: Permitir SELECT anónimo en tablas
--          de configuración pública (login page)
-- ============================================================

-- config_sistema: nombre, subtítulo, favicon se muestran en login
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'config_sistema'
  ) THEN
    DROP POLICY IF EXISTS config_sistema_select_all ON config_sistema;
    CREATE POLICY config_sistema_select_all ON config_sistema
      FOR SELECT USING (true);
  END IF;
END;
$$;

-- configuracion_sistema: flag de mantenimiento
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'configuracion_sistema'
  ) THEN
    ALTER TABLE IF EXISTS configuracion_sistema ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS configuracion_sistema_select_all ON configuracion_sistema;
    CREATE POLICY configuracion_sistema_select_all ON configuracion_sistema
      FOR SELECT USING (true);
  END IF;
END;
$$;
