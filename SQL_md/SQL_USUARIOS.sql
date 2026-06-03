-- ========================================================================
-- SQL USUARIOS - 2 registros
-- Tabla: usuarios (Admin + 1 Profesor)
-- Campos: id, uid, email, nombre, rol, id_establecimiento, activo, creado_en, actualizado_en, apellidos
-- Nota: Ejecutar SQL_ROLES.sql y SQL_ROLES_PROFESOR.sql PRIMERO
-- Fecha: 2026-04-24
-- ========================================================================

BEGIN TRANSACTION;

-- 1 Admin
INSERT INTO usuarios (id, uid, email, nombre, rol, id_establecimiento, activo, creado_en, actualizado_en, apellidos)
VALUES ('550e8400-e29b-41d4-a716-446655550101', '550e8400-e29b-41d4-a716-446655660101', 'admin@test.com', 'Roberto', 'ADMIN', '18f3ec96-f15f-4787-a3ac-3c10f1cee55f', true, NOW(), NOW(), 'Morales');

-- 1 Profesor (no admin)
INSERT INTO usuarios (id, uid, email, nombre, rol, id_establecimiento, activo, creado_en, actualizado_en, apellidos)
VALUES ('550e8400-e29b-41d4-a716-446655550102', '550e8400-e29b-41d4-a716-446655660102', 'profesor1@test.com', 'Juan', 'PROFESOR', '18f3ec96-f15f-4787-a3ac-3c10f1cee55f', true, NOW(), NOW(), 'García');

COMMIT;

-- ========================================================================
-- VALIDACIÓN
-- ========================================================================
SELECT COUNT(*) as total_usuarios FROM usuarios;
SELECT id, uid, email, nombre, apellidos, rol, activo FROM usuarios ORDER BY rol, nombre ASC;
