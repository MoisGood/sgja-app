-- ============================================================
-- SGJA – Migration 022: Plantillas de correo para técnicos
-- Almacena plantillas de correo para notificación de cierre
-- de tickets, con placeholders:
--   {codigo}, {fecha}, {falla}, {diagnostico}, {solucion},
--   {observaciones}, {nombre_tecnico}
-- ============================================================

CREATE TABLE IF NOT EXISTS plantillas_correo_tecnico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_establecimiento UUID NOT NULL REFERENCES establecimientos(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  cuerpo TEXT NOT NULL,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índice para búsqueda por título
CREATE INDEX IF NOT EXISTS idx_plantillas_titulo
  ON plantillas_correo_tecnico (id_establecimiento, titulo);

-- RLS
ALTER TABLE plantillas_correo_tecnico ENABLE ROW LEVEL SECURITY;

-- Todos los usuarios autenticados pueden leer
CREATE POLICY "plantillas_select_authenticated" ON plantillas_correo_tecnico
  FOR SELECT USING (auth.role() = 'authenticated');

-- Solo admin puede insertar/actualizar/eliminar
CREATE POLICY "plantillas_insert_admin" ON plantillas_correo_tecnico
  FOR INSERT WITH CHECK (public.es_admin());

CREATE POLICY "plantillas_update_admin" ON plantillas_correo_tecnico
  FOR UPDATE USING (public.es_admin());

CREATE POLICY "plantillas_delete_admin" ON plantillas_correo_tecnico
  FOR DELETE USING (public.es_admin());

-- Insertar plantilla por defecto
INSERT INTO plantillas_correo_tecnico (id_establecimiento, titulo, cuerpo)
SELECT
  e.id,
  'Cierre de requerimiento',
  'Estimados,

El requerimiento N° {codigo}, con fecha: {fecha}, he observado y resuelto la incidencia.
Según lo indicado {falla}, diagnostique {diagnostico}.
Facilitando la continuidad de los servicios y equipos: se {solucion} el requerimiento.

{observaciones}

Atte
Técnico
{nombre_tecnico}'
FROM establecimientos e
WHERE NOT EXISTS (
  SELECT 1 FROM plantillas_correo_tecnico p
  WHERE p.id_establecimiento = e.id AND p.titulo = 'Cierre de requerimiento'
);
