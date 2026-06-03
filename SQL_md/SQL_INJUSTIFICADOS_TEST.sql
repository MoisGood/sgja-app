-- ========================================================================
-- SQL INJUSTIFICADOS - 3 registros de prueba
-- Tabla: injustificados
-- Campos: id_solicitud, id_estudiante, id_profesor, curso, id_bloque, id_establecimiento,
--         estado, fecha, hora, bloques_afectados, tipo, respaldo_recibido, activo, creado_en
-- Fecha: 2026-04-25
-- ========================================================================

BEGIN TRANSACTION;

-- Injustificado 1
INSERT INTO injustificados (id_solicitud, id_estudiante, id_profesor, curso, id_bloque, id_establecimiento, 
                            estado, fecha, hora, bloques_afectados, tipo, respaldo_recibido, activo, creado_en)
VALUES ('inj-001', 'EST-001', '550e8400-e29b-41d4-a716-446655550102', '1A', 'BLOQUE_5', '18f3ec96-f15f-4787-a3ac-3c10f1cee55f',
        'Injustificada', '2026-04-08', '16:20', 3, 'INASISTENCIA', false, true, NOW());

-- Injustificado 2
INSERT INTO injustificados (id_solicitud, id_estudiante, id_profesor, curso, id_bloque, id_establecimiento,
                            estado, fecha, hora, bloques_afectados, tipo, respaldo_recibido, activo, creado_en)
VALUES ('inj-002', 'EST-002', '550e8400-e29b-41d4-a716-446655550102', '2C', 'BLOQUE_6', '18f3ec96-f15f-4787-a3ac-3c10f1cee55f',
        'Injustificada', '2026-04-09', '14:30', 2, 'INASISTENCIA', false, true, NOW());

-- Injustificado 3
INSERT INTO injustificados (id_solicitud, id_estudiante, id_profesor, curso, id_bloque, id_establecimiento,
                            estado, fecha, hora, bloques_afectados, tipo, respaldo_recibido, activo, creado_en)
VALUES ('inj-003', 'EST-003', '550e8400-e29b-41d4-a716-446655550102', '3B', 'BLOQUE_7', '18f3ec96-f15f-4787-a3ac-3c10f1cee55f',
        'Injustificada', '2026-04-10', '15:00', 1, 'INASISTENCIA', false, true, NOW());

COMMIT;

-- ========================================================================
-- VALIDACIÓN
-- ========================================================================
SELECT COUNT(*) as total_injustificados FROM injustificados;
SELECT id, id_solicitud, id_estudiante, curso, estado, fecha FROM injustificados ORDER BY fecha DESC;
