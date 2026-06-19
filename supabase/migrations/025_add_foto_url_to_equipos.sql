-- Add foto_url column to equipos table for equipment photos (failure evidence)
ALTER TABLE equipos ADD COLUMN IF NOT EXISTS foto_url text;
