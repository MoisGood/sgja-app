-- ============================================================
-- INSERT TEST DATA - 3 rows per table
-- Para probar el comportamiento de INSERT antes de hacer UI
-- ============================================================

-- ============================================================
-- 1. ESTUDIANTES - 3 registros de prueba
-- ============================================================
INSERT INTO public.estudiantes 
  (id_estudiante, nombre_completo, email, curso, id_establecimiento, apoderado_id, activo) 
VALUES 
  ('EST001', 'Juan Carlos Pérez López', 'juan.perez@school.com', '1A', NULL, NULL, true),
  ('EST002', 'María González Rodríguez', 'maria.gonzalez@school.com', '1B', NULL, NULL, true),
  ('EST003', 'Carlos Alberto Martínez Silva', 'carlos.martinez@school.com', '2C', NULL, NULL, true);

-- ============================================================
-- 2. MOTIVOS_JUSTIFICACION - 3 registros de prueba
-- ============================================================
INSERT INTO public.motivos_justificacion 
  (codigo, descripcion, requiere_respaldo, activo) 
VALUES 
  ('ATRASOINTERMEDIOENCR', 'Atraso intermedio en CRA', true, true),
  ('JUSTIFICACIONMEDICA', 'Justificación médica', true, true),
  ('ACTIVIDADADMINISTRATIVA', 'Actividad administrativa autorizada', false, true);

-- ============================================================
-- 3. INJUSTIFICADOS - 3 registros de prueba
-- (Inasistencias sin justificación)
-- ============================================================
INSERT INTO public.injustificados 
  (bloques_afectados, curso, estado, fecha, hora, id_bloque, id_establecimiento, id_estudiante, id_profesor, id_solicitud, tipo, respaldo_recibido) 
VALUES 
  (3, '1A', 'Injustificada', '2026-04-08', '16:20', 'BLQ001', 'est001', 'EST001', 'PROF001', 'inasistencia_EST001_BLQ001_001', 'INASISTENCIA', false),
  (2, '1B', 'Injustificada', '2026-04-09', '10:30', 'BLQ002', 'est001', 'EST002', 'PROF002', 'inasistencia_EST002_BLQ002_001', 'INASISTENCIA', false),
  (1, '2C', 'Injustificada', '2026-04-10', '14:00', 'BLQ003', 'est001', 'EST003', 'PROF003', 'inasistencia_EST003_BLQ003_001', 'INASISTENCIA', false);

-- ============================================================
-- 4. JUSTIFICADOS - 3 registros de prueba
-- (Inasistencias con justificación)
-- ============================================================
INSERT INTO public.justificados 
  (bloques_afectados, curso, estado, fecha, hora, hora_justificacion, id_bloque, id_establecimiento, id_estudiante, id_profesor, id_solicitud, motivo_codigo, motivo_descripcion, respaldo_recibido, tipo, id_inspector_justificador) 
VALUES 
  (2, '1A', 'Justificada', '2026-04-08', '16:20', '21:19:58', 'BLQ001', 'est001', 'EST001', 'PROF001', 'inasistencia_EST001_BLQ001_002', 'ATRASOINTERMEDIOENCR', 'Atraso intermedio en CRA', false, 'INASISTENCIA', 'INSP001'),
  (1, '1B', 'Justificada', '2026-04-09', '10:30', '11:00:00', 'BLQ002', 'est001', 'EST002', 'PROF002', 'inasistencia_EST002_BLQ002_002', 'JUSTIFICACIONMEDICA', 'Justificación médica', true, 'INASISTENCIA', 'INSP002'),
  (3, '2C', 'Justificada', '2026-04-10', '14:00', '15:30:00', 'BLQ003', 'est001', 'EST003', 'PROF003', 'inasistencia_EST003_BLQ003_002', 'ACTIVIDADADMINISTRATIVA', 'Actividad administrativa autorizada', false, 'INASISTENCIA', 'INSP003');

-- ============================================================
-- VERIFICACIÓN - Ver los datos insertados
-- ============================================================
-- Descomenta para verificar:
-- SELECT COUNT(*) as total_estudiantes FROM public.estudiantes;
-- SELECT COUNT(*) as total_motivos FROM public.motivos_justificacion;
-- SELECT COUNT(*) as total_injustificados FROM public.injustificados;
-- SELECT COUNT(*) as total_justificados FROM public.justificados;
