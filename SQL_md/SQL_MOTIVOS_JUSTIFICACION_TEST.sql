-- ========================================================================
-- SQL MOTIVOS_JUSTIFICACION - 3 registros de prueba
-- Tabla: motivos_justificacion
-- Campos: codigo, descripcion, requiere_respaldo, activo
-- Fecha: 2026-04-25
-- ========================================================================

BEGIN TRANSACTION;

-- Motivo 1
INSERT INTO motivos_justificacion (codigo, descripcion, requiere_respaldo, activo)
VALUES ('ATRASOINTERMEDIOENCR', 'Atraso intermedio en CRA', false, true);

-- Motivo 2
INSERT INTO motivos_justificacion (codigo, descripcion, requiere_respaldo, activo)
VALUES ('CITA_MEDICA', 'Cita médica comprobada', true, true);

-- Motivo 3
INSERT INTO motivos_justificacion (codigo, descripcion, requiere_respaldo, activo)
VALUES ('EVENTO_ESCOLAR', 'Participación en evento escolar autorizado', false, true);

COMMIT;

-- ========================================================================
-- VALIDACIÓN
-- ========================================================================
SELECT COUNT(*) as total_motivos FROM motivos_justificacion;
SELECT id, codigo, descripcion, requiere_respaldo, activo FROM motivos_justificacion ORDER BY codigo ASC;
