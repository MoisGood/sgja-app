-- ============================================================
-- AGIL – Migration 037: add tipo to bloques_horarios
-- La tabla no tenia columna tipo (solo id, id_bloque, nombre,
-- hora_inicio, hora_fin, orden, id_establecimiento, activo,
-- creado_en). Se agrega para poder guardar clase/recreo/almuerzo/otro.
-- ============================================================

ALTER TABLE bloques_horarios
  ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'clase'
  CHECK (tipo IN ('clase', 'recreo', 'almuerzo', 'otro'));

-- Normalizar bloques existentes por convencion de id_bloque
UPDATE bloques_horarios SET tipo = 'recreo' WHERE id_bloque = 'RECRE' AND tipo = 'clase';
UPDATE bloques_horarios SET tipo = 'almuerzo' WHERE id_bloque = 'ALMUERZO' AND tipo = 'clase';
