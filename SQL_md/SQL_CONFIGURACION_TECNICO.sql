-- ============================================================
-- Módulo Técnico — Configuración + RLS faltantes
-- ============================================================

-- 1. RLS para ubicaciones (recrea policies de forma idempotente)
ALTER TABLE ubicaciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ubicaciones_select" ON ubicaciones;
CREATE POLICY "ubicaciones_select" ON ubicaciones
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "ubicaciones_insert" ON ubicaciones;
CREATE POLICY "ubicaciones_insert" ON ubicaciones
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol IN ('ADMIN'))
  );

DROP POLICY IF EXISTS "ubicaciones_update" ON ubicaciones;
CREATE POLICY "ubicaciones_update" ON ubicaciones
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol IN ('ADMIN'))
  );

DROP POLICY IF EXISTS "ubicaciones_delete" ON ubicaciones;
CREATE POLICY "ubicaciones_delete" ON ubicaciones
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol IN ('ADMIN'))
  );

-- 2. Tabla: configuración de dispositivos (lista maestra)
CREATE TABLE IF NOT EXISTS configuracion_dispositivos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  id_establecimiento uuid NOT NULL REFERENCES establecimientos(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(id_establecimiento, nombre)
);

CREATE INDEX IF NOT EXISTS idx_config_disp_establecimiento ON configuracion_dispositivos (id_establecimiento);

ALTER TABLE configuracion_dispositivos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "config_disp_select" ON configuracion_dispositivos;
CREATE POLICY "config_disp_select" ON configuracion_dispositivos
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "config_disp_insert" ON configuracion_dispositivos;
CREATE POLICY "config_disp_insert" ON configuracion_dispositivos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "config_disp_update" ON configuracion_dispositivos;
CREATE POLICY "config_disp_update" ON configuracion_dispositivos
  FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "config_disp_delete" ON configuracion_dispositivos;
CREATE POLICY "config_disp_delete" ON configuracion_dispositivos
  FOR DELETE USING (auth.role() = 'authenticated');

DROP TRIGGER IF EXISTS set_updated_at_config_disp ON configuracion_dispositivos;
CREATE TRIGGER set_updated_at_config_disp
  BEFORE UPDATE ON configuracion_dispositivos
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- 3. Campos nuevos para ticket rápido en requerimientos
ALTER TABLE requerimientos ADD COLUMN IF NOT EXISTS posible_falla text;
ALTER TABLE requerimientos ADD COLUMN IF NOT EXISTS diagnostico text;
ALTER TABLE requerimientos ADD COLUMN IF NOT EXISTS solucion text;
ALTER TABLE requerimientos ADD COLUMN IF NOT EXISTS fecha_cierre timestamptz;
ALTER TABLE requerimientos ADD COLUMN IF NOT EXISTS id_tecnico_cierre uuid REFERENCES usuarios(id) ON DELETE SET NULL;

-- 4. Códigos QR para lugares y equipos
CREATE TABLE IF NOT EXISTS qr_codes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo text NOT NULL UNIQUE,
  tipo text NOT NULL CHECK (tipo IN ('lugar','equipo')),
  id_referencia uuid NOT NULL,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_qr_codes_codigo ON qr_codes (codigo);
CREATE INDEX IF NOT EXISTS idx_qr_codes_referencia ON qr_codes (tipo, id_referencia);

ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "qr_codes_select" ON qr_codes;
CREATE POLICY "qr_codes_select" ON qr_codes FOR SELECT USING (true);

DROP POLICY IF EXISTS "qr_codes_insert" ON qr_codes;
CREATE POLICY "qr_codes_insert" ON qr_codes FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "qr_codes_update" ON qr_codes;
CREATE POLICY "qr_codes_update" ON qr_codes FOR UPDATE USING (
  auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "qr_codes_delete" ON qr_codes;
CREATE POLICY "qr_codes_delete" ON qr_codes FOR DELETE USING (
  auth.role() = 'authenticated'
);

DROP TRIGGER IF EXISTS set_updated_at_qr_codes ON qr_codes;
CREATE TRIGGER set_updated_at_qr_codes
  BEFORE UPDATE ON qr_codes
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- RPC: insertar_qr (bypass RLS con SECURITY DEFINER)
CREATE OR REPLACE FUNCTION insertar_qr(
  p_codigo text,
  p_tipo text,
  p_id_referencia uuid
) RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  INSERT INTO qr_codes (codigo, tipo, id_referencia)
  VALUES (p_codigo, p_tipo, p_id_referencia)
  ON CONFLICT (codigo) DO UPDATE SET id_referencia = EXCLUDED.id_referencia, updated_at = now()
  RETURNING jsonb_build_object('id', id, 'codigo', codigo, 'tipo', tipo, 'id_referencia', id_referencia)
  INTO v_result;
  RETURN v_result;
END;
$$;

-- RPC: insertar_requerimiento (bypass RLS con SECURITY DEFINER)
CREATE OR REPLACE FUNCTION insertar_requerimiento(
  p_id_establecimiento uuid,
  p_id_lugar uuid,
  p_id_equipo uuid,
  p_id_solicitante uuid,
  p_tipo_requerimiento text DEFAULT 'Reparación',
  p_descripcion text DEFAULT '',
  p_posible_falla text DEFAULT NULL,
  p_diagnostico text DEFAULT NULL,
  p_prioridad text DEFAULT 'Normal',
  p_estado text DEFAULT 'En Proceso',
  p_fecha_solicitud date DEFAULT CURRENT_DATE
) RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  INSERT INTO requerimientos (
    id_establecimiento, id_lugar, id_equipo, id_solicitante,
    tipo_requerimiento, descripcion, posible_falla, diagnostico,
    prioridad, estado, fecha_solicitud
  ) VALUES (
    p_id_establecimiento, p_id_lugar, p_id_equipo, p_id_solicitante,
    p_tipo_requerimiento, p_descripcion, p_posible_falla, p_diagnostico,
    p_prioridad, p_estado, p_fecha_solicitud
  )
  RETURNING jsonb_build_object('id', id)
  INTO v_result;
  RETURN v_result;
END;
$$;

-- 5. Tabla: posibles fallas (catálogo)
CREATE TABLE IF NOT EXISTS posibles_fallas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  id_establecimiento uuid NOT NULL REFERENCES establecimientos(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(id_establecimiento, nombre)
);

CREATE INDEX IF NOT EXISTS idx_fallas_establecimiento ON posibles_fallas (id_establecimiento);

ALTER TABLE posibles_fallas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fallas_select" ON posibles_fallas;
CREATE POLICY "fallas_select" ON posibles_fallas FOR SELECT USING (true);

DROP POLICY IF EXISTS "fallas_insert" ON posibles_fallas;
CREATE POLICY "fallas_insert" ON posibles_fallas FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "fallas_update" ON posibles_fallas;
CREATE POLICY "fallas_update" ON posibles_fallas FOR UPDATE USING (
  auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "fallas_delete" ON posibles_fallas;
CREATE POLICY "fallas_delete" ON posibles_fallas FOR DELETE USING (
  auth.role() = 'authenticated'
);

DROP TRIGGER IF EXISTS set_updated_at_fallas ON posibles_fallas;
CREATE TRIGGER set_updated_at_fallas
  BEFORE UPDATE ON posibles_fallas
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- 5b. Tabla: posibles diagnósticos (catálogo)
CREATE TABLE IF NOT EXISTS posibles_diagnosticos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  id_establecimiento uuid NOT NULL REFERENCES establecimientos(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(id_establecimiento, nombre)
);

CREATE INDEX IF NOT EXISTS idx_diags_establecimiento ON posibles_diagnosticos (id_establecimiento);

ALTER TABLE posibles_diagnosticos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "diags_select" ON posibles_diagnosticos;
CREATE POLICY "diags_select" ON posibles_diagnosticos FOR SELECT USING (true);

DROP POLICY IF EXISTS "diags_insert" ON posibles_diagnosticos;
CREATE POLICY "diags_insert" ON posibles_diagnosticos FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "diags_update" ON posibles_diagnosticos;
CREATE POLICY "diags_update" ON posibles_diagnosticos FOR UPDATE USING (
  auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "diags_delete" ON posibles_diagnosticos;
CREATE POLICY "diags_delete" ON posibles_diagnosticos FOR DELETE USING (
  auth.role() = 'authenticated'
);

DROP TRIGGER IF EXISTS set_updated_at_diags ON posibles_diagnosticos;
CREATE TRIGGER set_updated_at_diags
  BEFORE UPDATE ON posibles_diagnosticos
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- 5e. Columna cod_inventario para equipos
ALTER TABLE equipos ADD COLUMN IF NOT EXISTS cod_inventario text;

-- 6. RPC: insertar_equipo (bypass RLS con SECURITY DEFINER)
CREATE OR REPLACE FUNCTION insertar_equipo(
  p_nombre text,
  p_id_establecimiento uuid,
  p_id_lugar uuid DEFAULT NULL,
  p_marca text DEFAULT NULL,
  p_modelo text DEFAULT NULL,
  p_tipo_equipo text DEFAULT NULL,
  p_numero_serie text DEFAULT NULL,
  p_estado text DEFAULT 'Operativo',
  p_cod_inventario text DEFAULT NULL
) RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  INSERT INTO equipos (nombre, id_establecimiento, id_lugar, marca, modelo, tipo_equipo, numero_serie, estado, cod_inventario)
  VALUES (p_nombre, p_id_establecimiento, p_id_lugar, p_marca, p_modelo, p_tipo_equipo, p_numero_serie, p_estado, p_cod_inventario)
  RETURNING jsonb_build_object(
    'id', id, 'nombre', nombre, 'marca', marca, 'modelo', modelo,
    'tipo_equipo', tipo_equipo, 'numero_serie', numero_serie, 'estado', estado,
    'cod_inventario', cod_inventario
  ) INTO v_result;
  RETURN v_result;
END;
$$;

-- 6b. RPC: upsertar_ubicacion (bypass RLS con SECURITY DEFINER)
DROP FUNCTION IF EXISTS upsertar_ubicacion(uuid,uuid,text,integer,boolean);
CREATE FUNCTION upsertar_ubicacion(
  p_id_lugar uuid,
  p_id_establecimiento uuid,
  p_dispositivo_nombre text,
  p_cantidad integer DEFAULT 1,
  p_activo boolean DEFAULT true
) RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  INSERT INTO ubicaciones (id_lugar, id_establecimiento, dispositivo_nombre, cantidad, activo)
  VALUES (p_id_lugar, p_id_establecimiento, p_dispositivo_nombre, p_cantidad, p_activo)
  ON CONFLICT (id_lugar, dispositivo_nombre)
  DO UPDATE SET cantidad = EXCLUDED.cantidad, activo = EXCLUDED.activo
  RETURNING jsonb_build_object('id', id) INTO v_result;
  RETURN v_result;
END;
$$;

-- 5c. Tabla: posibles soluciones (catálogo)
CREATE TABLE IF NOT EXISTS posibles_soluciones (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  id_establecimiento uuid NOT NULL REFERENCES establecimientos(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(id_establecimiento, nombre)
);

CREATE INDEX IF NOT EXISTS idx_sols_establecimiento ON posibles_soluciones (id_establecimiento);

ALTER TABLE posibles_soluciones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sols_select" ON posibles_soluciones;
CREATE POLICY "sols_select" ON posibles_soluciones FOR SELECT USING (true);
DROP POLICY IF EXISTS "sols_insert" ON posibles_soluciones;
CREATE POLICY "sols_insert" ON posibles_soluciones FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "sols_update" ON posibles_soluciones;
CREATE POLICY "sols_update" ON posibles_soluciones FOR UPDATE USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "sols_delete" ON posibles_soluciones;
CREATE POLICY "sols_delete" ON posibles_soluciones FOR DELETE USING (auth.role() = 'authenticated');

-- 5d. Tabla: posibles observaciones (catálogo)
CREATE TABLE IF NOT EXISTS posibles_observaciones (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  id_establecimiento uuid NOT NULL REFERENCES establecimientos(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(id_establecimiento, nombre)
);

CREATE INDEX IF NOT EXISTS idx_obs_establecimiento ON posibles_observaciones (id_establecimiento);

ALTER TABLE posibles_observaciones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "obs_select" ON posibles_observaciones;
CREATE POLICY "obs_select" ON posibles_observaciones FOR SELECT USING (true);
DROP POLICY IF EXISTS "obs_insert" ON posibles_observaciones;
CREATE POLICY "obs_insert" ON posibles_observaciones FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "obs_update" ON posibles_observaciones;
CREATE POLICY "obs_update" ON posibles_observaciones FOR UPDATE USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "obs_delete" ON posibles_observaciones;
CREATE POLICY "obs_delete" ON posibles_observaciones FOR DELETE USING (auth.role() = 'authenticated');
