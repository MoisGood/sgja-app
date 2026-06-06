-- Crear bucket logos para almacenar imágenes de establecimientos
INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Permitir subida pública al bucket logos (autenticado)
CREATE POLICY "Subir logos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'logos'
);

CREATE POLICY "Leer logos" ON storage.objects FOR SELECT TO anon USING (
  bucket_id = 'logos'
);

CREATE POLICY "Actualizar logos" ON storage.objects FOR UPDATE TO authenticated USING (
  bucket_id = 'logos'
);

CREATE POLICY "Eliminar logos" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'logos'
);
