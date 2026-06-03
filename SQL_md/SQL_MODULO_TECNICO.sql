-- ============================================================
-- Módulo Técnico — Tablas completas
-- ============================================================

-- 1. EQUIPOS
CREATE TABLE IF NOT EXISTS equipos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  id_establecimiento uuid NOT NULL REFERENCES establecimientos(id) ON DELETE CASCADE,
  id_lugar uuid REFERENCES lugares(id) ON DELETE SET NULL,
  nombre text NOT NULL,
  marca text,
  modelo text,
  tipo_equipo text,
  numero_serie text,
  estado text NOT NULL DEFAULT 'Operativo'
    CHECK (estado IN ('Operativo','Con Fallas','En Reparación','Baja')),
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_equipos_lugar ON equipos (id_lugar);
CREATE INDEX idx_equipos_estado ON equipos (estado);
CREATE INDEX idx_equipos_establecimiento ON equipos (id_establecimiento);

ALTER TABLE equipos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "equipos_select" ON equipos FOR SELECT USING (true);
CREATE POLICY "equipos_insert" ON equipos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "equipos_update" ON equipos FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "equipos_delete" ON equipos FOR DELETE USING (auth.role() = 'authenticated');

-- 2. MANTENCIONES
CREATE TABLE IF NOT EXISTS mantenciones (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  id_equipo uuid NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
  id_tecnico uuid REFERENCES usuarios(id) ON DELETE SET NULL,
  tipo_mantencion text NOT NULL
    CHECK (tipo_mantencion IN ('Preventiva','Correctiva','Formateo','Reinstalación','Actualización','Otro')),
  descripcion text,
  fecha_mantencion date NOT NULL DEFAULT CURRENT_DATE,
  proxima_fecha date,
  costo numeric(12,0) DEFAULT 0,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_mantenciones_equipo ON mantenciones (id_equipo);
CREATE INDEX idx_mantenciones_fecha ON mantenciones (fecha_mantencion DESC);

ALTER TABLE mantenciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mantenciones_select" ON mantenciones FOR SELECT USING (true);
CREATE POLICY "mantenciones_insert" ON mantenciones FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "mantenciones_update" ON mantenciones FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "mantenciones_delete" ON mantenciones FOR DELETE USING (auth.role() = 'authenticated');

-- 3. REQUERIMIENTOS
CREATE TABLE IF NOT EXISTS requerimientos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  id_establecimiento uuid NOT NULL REFERENCES establecimientos(id) ON DELETE CASCADE,
  id_equipo uuid REFERENCES equipos(id) ON DELETE SET NULL,
  id_lugar uuid REFERENCES lugares(id) ON DELETE SET NULL,
  id_solicitante uuid NOT NULL REFERENCES usuarios(id),
  id_tecnico_asignado uuid REFERENCES usuarios(id) ON DELETE SET NULL,
  tipo_requerimiento text NOT NULL
    CHECK (tipo_requerimiento IN ('Reparación','Mantención','Instalación','Traslado','Otro')),
  descripcion text NOT NULL,
  prioridad text DEFAULT 'Normal'
    CHECK (prioridad IN ('Baja','Normal','Alta','Urgente')),
  estado text NOT NULL DEFAULT 'Pendiente'
    CHECK (estado IN ('Pendiente','En Proceso','Completada','Cancelada')),
  fecha_solicitud date NOT NULL DEFAULT CURRENT_DATE,
  fecha_atencion date,
  observaciones text,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_requerimientos_estado ON requerimientos (estado);
CREATE INDEX idx_requerimientos_equipo ON requerimientos (id_equipo);
CREATE INDEX idx_requerimientos_lugar ON requerimientos (id_lugar);
CREATE INDEX idx_requerimientos_establecimiento ON requerimientos (id_establecimiento);

ALTER TABLE requerimientos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "requerimientos_select" ON requerimientos FOR SELECT USING (true);
CREATE POLICY "requerimientos_insert" ON requerimientos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "requerimientos_update" ON requerimientos FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "requerimientos_delete" ON requerimientos FOR DELETE USING (auth.role() = 'authenticated');

-- 4. LUGARES — agregar columnas
ALTER TABLE lugares ADD COLUMN IF NOT EXISTS jefe text;
ALTER TABLE lugares ADD COLUMN IF NOT EXISTS qr_url text;

-- Trigger updated_at compartido
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_equipos
  BEFORE UPDATE ON equipos
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_requerimientos
  BEFORE UPDATE ON requerimientos
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
