-- ========================================================================
-- SQL ROLES - 1 registro
-- Tabla: roles
-- Campos: id, nombre_rol, id_establecimiento, descripcion_rol
-- Fecha: 2026-04-22
-- ========================================================================

BEGIN TRANSACTION;

-- 1 Rol Admin
INSERT INTO roles (id, nombre_rol, id_establecimiento, descripcion_rol)
VALUES ('550e8400-e29b-41d4-a716-446655770001', 'ADMIN', '18f3ec96-f15f-4787-a3ac-3c10f1cee55f', 'Administrador del sistema con acceso total');

COMMIT;

-- ========================================================================
-- VALIDACIÓN
-- ========================================================================
SELECT COUNT(*) as total_roles FROM roles;
SELECT id, nombre_rol, id_establecimiento, descripcion_rol FROM roles;
