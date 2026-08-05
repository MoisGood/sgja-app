-- Índice para acelerar consultas frecuentes de solicitudes por establecimiento
-- usadas por el polling (profesor móvil e inspector) y por el realtime.
CREATE INDEX IF NOT EXISTS idx_solicitudes_estab_activo
  ON public.solicitudes (id_establecimiento, activo);
