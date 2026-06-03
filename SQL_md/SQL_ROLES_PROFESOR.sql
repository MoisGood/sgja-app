-- ========================================================================
-- SQL ROLES - Rol PROFESOR
-- Tabla: rol_permisos
-- Campos: id, nombre_rol, id_establecimiento, descripcion_rol
-- Fecha: 2026-04-24
-- ========================================================================

BEGIN TRANSACTION;

-- Rol Profesor
INSERT INTO rol_permisos (id, nombre_rol, id_establecimiento, descripcion_rol)
VALUES ('550e8400-e29b-41d4-a716-446655770002', 'PROFESOR', '18f3ec96-f15f-4787-a3ac-3c10f1cee55f', 'Profesor de la institución');

COMMIT;

-- ========================================================================
-- VALIDACIÓN
-- ========================================================================
SELECT COUNT(*) as total_roles FROM rol_permisos;
SELECT id, nombre_rol, id_establecimiento, descripcion_rol FROM rol_permisos;
