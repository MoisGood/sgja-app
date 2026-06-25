-- ============================================================
-- SGJA – Migration 026: Add asunto (subject) to plantillas
-- ============================================================

ALTER TABLE plantillas_correo_tecnico
  ADD COLUMN IF NOT EXISTS asunto TEXT NOT NULL DEFAULT '';

-- Actualizar plantilla por defecto con asunto
UPDATE plantillas_correo_tecnico
SET asunto = 'Requerimiento N° {codigo} - {solucion}'
WHERE titulo = 'Cierre de requerimiento' AND asunto = '';
