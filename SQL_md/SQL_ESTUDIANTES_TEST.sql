-- ========================================================================
-- SQL ESTUDIANTES - 3 registros de prueba
-- Tabla: estudiantes
-- Campos: id_estudiante, nombre_completo, email, curso, id_establecimiento, apoderado_id, activo, creado_en, actualizado_en
-- Fecha: 2026-04-25
-- ========================================================================

BEGIN TRANSACTION;

-- Estudiante 1
INSERT INTO estudiantes (id_estudiante, nombre_completo, email, curso, id_establecimiento, apoderado_id, activo, creado_en, actualizado_en)
VALUES ('EST-001', 'Carlos Martínez López', 'carlos.martinez@test.com', '1A', '18f3ec96-f15f-4787-a3ac-3c10f1cee55f', NULL, true, NOW(), NOW());

-- Estudiante 2
INSERT INTO estudiantes (id_estudiante, nombre_completo, email, curso, id_establecimiento, apoderado_id, activo, creado_en, actualizado_en)
VALUES ('EST-002', 'María González Rodríguez', 'maria.gonzalez@test.com', '2C', '18f3ec96-f15f-4787-a3ac-3c10f1cee55f', NULL, true, NOW(), NOW());

-- Estudiante 3
INSERT INTO estudiantes (id_estudiante, nombre_completo, email, curso, id_establecimiento, apoderado_id, activo, creado_en, actualizado_en)
VALUES ('EST-003', 'Pedro Sánchez Flores', 'pedro.sanchez@test.com', '3B', '18f3ec96-f15f-4787-a3ac-3c10f1cee55f', NULL, true, NOW(), NOW());

COMMIT;

-- ========================================================================
-- VALIDACIÓN
-- ========================================================================
SELECT COUNT(*) as total_estudiantes FROM estudiantes;
SELECT id, id_estudiante, nombre_completo, curso, activo FROM estudiantes ORDER BY id_estudiante ASC;
