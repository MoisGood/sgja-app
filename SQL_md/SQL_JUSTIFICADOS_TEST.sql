-- ========================================================================
-- SQL JUSTIFICADOS - 3 registros de prueba
-- Tabla: justificados
-- Campos: id_solicitud, id_estudiante, id_profesor, curso, id_bloque, 
--         id_establecimiento, estado, fecha, hora, bloques_afectados, tipo,
--         motivo_codigo, motivo_descripcion, requiere_respaldo, respaldo_recibido,
--         observaciones, activo
-- Fecha: 2026-04-25
-- ========================================================================

BEGIN TRANSACTION;

-- Justificado 1: Aprobado
INSERT INTO justificados (id_solicitud, id_estudiante, id_profesor, curso, id_bloque, id_establecimiento,
                          estado, fecha, hora, bloques_afectados, tipo,
                          motivo_codigo, requiere_respaldo, observaciones, activo)
VALUES ('just-001', 'EST-001', '550e8400-e29b-41d4-a716-446655550102', '1A', 'BLOQUE_2', '18f3ec96-f15f-4787-a3ac-3c10f1cee55f',
        'Aprobada', '2026-04-15', '10:30', 2, 'ATRASO',
        'ATRASOINTERMEDIOENCR', false, 'Autorizado por profesor', true);

-- Justificado 2: Pendiente de revisión
INSERT INTO justificados (id_solicitud, id_estudiante, id_profesor, curso, id_bloque, id_establecimiento,
                          estado, fecha, hora, bloques_afectados, tipo,
                          motivo_codigo, requiere_respaldo, observaciones, activo)
VALUES ('just-002', 'EST-002', '550e8400-e29b-41d4-a716-446655550102', '2C', 'BLOQUE_4', '18f3ec96-f15f-4787-a3ac-3c10f1cee55f',
        'Pendiente', '2026-04-16', '14:30', 1, 'INASISTENCIA',
        'CITA_MEDICA', true, 'Certificado médico adjunto', true);

-- Justificado 3: Rechazado
INSERT INTO justificados (id_solicitud, id_estudiante, id_profesor, curso, id_bloque, id_establecimiento,
                          estado, fecha, hora, bloques_afectados, tipo,
                          motivo_codigo, requiere_respaldo, observaciones, activo)
VALUES ('just-003', 'EST-003', '550e8400-e29b-41d4-a716-446655550102', '3B', 'BLOQUE_6', '18f3ec96-f15f-4787-a3ac-3c10f1cee55f',
        'Rechazada', '2026-04-17', '15:00', 3, 'INASISTENCIA',
        'EVENTO_ESCOLAR', false, 'Documentación insuficiente', true);

COMMIT;

-- ========================================================================
-- VALIDACIÓN
-- ========================================================================
SELECT COUNT(*) as total_justificados FROM justificados;
SELECT id, id_solicitud, id_estudiante, curso, estado, fecha FROM justificados ORDER BY fecha DESC;
