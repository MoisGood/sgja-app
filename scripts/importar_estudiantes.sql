-- ============================================================
-- Importar estudiantes desde CSV (pegar datos abajo)
-- Uso: Copia este SQL al SQL Editor de Supabase Dashboard,
--       pega tus datos en la línea VALUES y ejecuta.
-- ============================================================

WITH config AS (
  SELECT id AS id_establecimiento FROM establecimientos LIMIT 1
)
INSERT INTO estudiantes (id_establecimiento, rut, nombre_completo, curso, anno_ingreso, email, activo, creado_en, actualizado_en)
SELECT config.id_establecimiento, data.*, true, now(), now()
FROM config,
(VALUES
  -- ⬇️ Reemplaza estos datos con los tuyos (rut, nombre, curso, año, email)
  ('11.111.111-1', 'Sofia Muñoz Rojas',   '1A', 2026, 'sofia.munoz@ejemplo.com'),
  ('22.222.222-2', 'Benjamin Soto Vega',   '1A', 2026, 'benjamin.soto@ejemplo.com'),
  ('33.333.333-3', 'Valentina Diaz Correa','1B', 2026, 'valentina.diaz@ejemplo.com')
) AS data(rut, nombre_completo, curso, anno_ingreso, email)
ON CONFLICT (rut) DO NOTHING;
-- El ON CONFLICT evita duplicados si el RUT ya existe

-- Para verificar:
-- SELECT * FROM estudiantes ORDER BY creado_en DESC;
