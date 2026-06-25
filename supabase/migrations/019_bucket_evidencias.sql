-- Bucket para evidencias de tickets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('evidencias', 'evidencias', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- RLS: cualquier autenticado puede leer
DROP POLICY IF EXISTS "evidencias_select" ON storage.objects;
CREATE POLICY "evidencias_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'evidencias' AND auth.role() = 'authenticated');

-- RLS: cualquier autenticado puede subir
DROP POLICY IF EXISTS "evidencias_insert" ON storage.objects;
CREATE POLICY "evidencias_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'evidencias' AND auth.role() = 'authenticated');

-- RLS: solo el owner o admin puede eliminar
DROP POLICY IF EXISTS "evidencias_delete" ON storage.objects;
CREATE POLICY "evidencias_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'evidencias' AND (
      auth.uid()::text = (storage.objects."owner"::text)
      OR public.es_admin()
    )
  );
