-- Agregar columna logo_url a establecimientos
ALTER TABLE establecimientos ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Recargar schema cache de PostgREST
NOTIFY pgrst, 'reload schema';
