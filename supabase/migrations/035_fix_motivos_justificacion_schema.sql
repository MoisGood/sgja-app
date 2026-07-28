-- ============================================================
-- AGIL – Fix esquema de motivos_justificacion
-- ============================================================
-- La tabla fue creada manualmente con un esquema distinto al
-- modelo MotivoJustificacion de TypeScript. Faltaban columnas
-- y existían diferencias de nombres.
-- ============================================================

-- Agregar columnas faltantes
ALTER TABLE motivos_justificacion ADD COLUMN IF NOT EXISTS id_motivo TEXT;
ALTER TABLE motivos_justificacion ADD COLUMN IF NOT EXISTS id_establecimiento TEXT;
ALTER TABLE motivos_justificacion ADD COLUMN IF NOT EXISTS orden INTEGER DEFAULT 0;
ALTER TABLE motivos_justificacion ADD COLUMN IF NOT EXISTS tipo_registro TEXT DEFAULT 'ATRASO';
ALTER TABLE motivos_justificacion ADD COLUMN IF NOT EXISTS requiere_detalle BOOLEAN DEFAULT false;

-- Copiar valores desde columnas existentes
UPDATE motivos_justificacion SET id_motivo = id WHERE id_motivo IS NULL;
UPDATE motivos_justificacion SET requiere_detalle = requiere_respaldo WHERE requiere_respaldo IS NOT NULL;

-- Establecer NOT NULL después de la migración de datos
ALTER TABLE motivos_justificacion ALTER COLUMN id_motivo SET NOT NULL;
ALTER TABLE motivos_justificacion ALTER COLUMN id_motivo SET DEFAULT 'mot_' || replace(gen_random_uuid()::text, '-', '');

-- Agregar columnas de auditoría
ALTER TABLE motivos_justificacion ADD COLUMN IF NOT EXISTS creado_en TIMESTAMPTZ DEFAULT now();
ALTER TABLE motivos_justificacion ADD COLUMN IF NOT EXISTS actualizado_en TIMESTAMPTZ DEFAULT now();

-- Eliminar columna antigua (opcional, comentar si se prefiere mantener)
-- ALTER TABLE motivos_justificacion DROP COLUMN IF EXISTS requiere_respaldo;
