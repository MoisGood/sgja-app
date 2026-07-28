-- ============================================================
-- Template: Importar Estudiantes via SQL (Supabase Dashboard)
-- ============================================================
-- Reemplaza los valores ID_ESTABLECIMIENTO_AQUI y ID_APODERADO_AQUI
-- con IDs reales de tu base de datos.
-- ============================================================

INSERT INTO estudiantes (id_establecimiento, rut, nombre_completo, curso, anno_ingreso, email, id_apoderado, activo, creado_en, actualizado_en) VALUES
('ID_ESTABLECIMIENTO_AQUI', '11.111.111-1', 'Sofia Muñoz Rojas',  '1A', 2026, 'sofia.munoz@ejemplo.com', 'ID_APODERADO_AQUI', true, now(), now()),
('ID_ESTABLECIMIENTO_AQUI', '22.222.222-2', 'Benjamin Soto Vega',  '1A', 2026, 'benjamin.soto@ejemplo.com', 'ID_APODERADO_AQUI', true, now(), now()),
('ID_ESTABLECIMIENTO_AQUI', '33.333.333-3', 'Valentina Diaz Correa','1B', 2026, 'valentina.diaz@ejemplo.com', 'ID_APODERADO_AQUI', true, now(), now()),
('ID_ESTABLECIMIENTO_AQUI', '44.444.444-4', 'Matias Torres Pino',  '2A', 2025, 'matias.torres@ejemplo.com', 'ID_APODERADO_AQUI', true, now(), now()),
('ID_ESTABLECIMIENTO_AQUI', '55.555.555-5', 'Isabella Castillo Mena','2A', 2025, 'isabella.castillo@ejemplo.com', 'ID_APODERADO_AQUI', true, now(), now()),
('ID_ESTABLECIMIENTO_AQUI', '66.666.666-6', 'Nicolas Fernandez Lara','3B', 2024, 'nicolas.fernandez@ejemplo.com', 'ID_APODERADO_AQUI', true, now(), now());

-- Para verificar: SELECT * FROM estudiantes ORDER BY creado_en DESC LIMIT 10;
-- Para obtener IDs reales:
--   SELECT id, nombre FROM establecimientos;
--   SELECT uid, nombre FROM usuarios WHERE rol = 'APODERADO' AND activo = true;
