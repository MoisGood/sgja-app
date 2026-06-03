-- ========================================================================
-- SQL BLOQUES_HORARIOS - 9 registros
-- Tabla: bloques_horarios
-- Campos: id_bloque, nombre_bloque, hora_inicio, hora_fin, orden, id_establecimiento, activo, creado_en
-- Fecha: 2026-04-24
-- ========================================================================

BEGIN TRANSACTION;

-- Bloques horarios típicos de jornada escolar
INSERT INTO bloques_horarios (id_bloque, nombre_bloque, hora_inicio, hora_fin, orden, id_establecimiento, activo, creado_en)
VALUES ('BLOQUE_1', 'Bloque 1', '08:00', '09:00', 1, '18f3ec96-f15f-4787-a3ac-3c10f1cee55f', true, NOW());

INSERT INTO bloques_horarios (id_bloque, nombre_bloque, hora_inicio, hora_fin, orden, id_establecimiento, activo, creado_en)
VALUES ('BLOQUE_2', 'Bloque 2', '09:00', '10:00', 2, '18f3ec96-f15f-4787-a3ac-3c10f1cee55f', true, NOW());

INSERT INTO bloques_horarios (id_bloque, nombre_bloque, hora_inicio, hora_fin, orden, id_establecimiento, activo, creado_en)
VALUES ('BLOQUE_3', 'Bloque 3', '10:00', '11:00', 3, '18f3ec96-f15f-4787-a3ac-3c10f1cee55f', true, NOW());

INSERT INTO bloques_horarios (id_bloque, nombre_bloque, hora_inicio, hora_fin, orden, id_establecimiento, activo, creado_en)
VALUES ('RECRE', 'Recre', '11:00', '11:30', 4, '18f3ec96-f15f-4787-a3ac-3c10f1cee55f', true, NOW());

INSERT INTO bloques_horarios (id_bloque, nombre_bloque, hora_inicio, hora_fin, orden, id_establecimiento, activo, creado_en)
VALUES ('BLOQUE_4', 'Bloque 4', '11:30', '12:30', 5, '18f3ec96-f15f-4787-a3ac-3c10f1cee55f', true, NOW());

INSERT INTO bloques_horarios (id_bloque, nombre_bloque, hora_inicio, hora_fin, orden, id_establecimiento, activo, creado_en)
VALUES ('BLOQUE_5', 'Bloque 5', '12:30', '13:30', 6, '18f3ec96-f15f-4787-a3ac-3c10f1cee55f', true, NOW());

INSERT INTO bloques_horarios (id_bloque, nombre_bloque, hora_inicio, hora_fin, orden, id_establecimiento, activo, creado_en)
VALUES ('ALMUERZO', 'Almuerzo', '13:30', '14:00', 7, '18f3ec96-f15f-4787-a3ac-3c10f1cee55f', true, NOW());

INSERT INTO bloques_horarios (id_bloque, nombre_bloque, hora_inicio, hora_fin, orden, id_establecimiento, activo, creado_en)
VALUES ('BLOQUE_6', 'Bloque 6', '14:00', '15:00', 8, '18f3ec96-f15f-4787-a3ac-3c10f1cee55f', true, NOW());

INSERT INTO bloques_horarios (id_bloque, nombre_bloque, hora_inicio, hora_fin, orden, id_establecimiento, activo, creado_en)
VALUES ('BLOQUE_7', 'Bloque 7', '15:00', '16:00', 9, '18f3ec96-f15f-4787-a3ac-3c10f1cee55f', true, NOW());

COMMIT;

-- ========================================================================
-- VALIDACIÓN
-- ========================================================================
SELECT COUNT(*) as total_bloques FROM bloques_horarios;
SELECT id, id_bloque, nombre_bloque, hora_inicio, hora_fin, orden FROM bloques_horarios ORDER BY orden ASC;
