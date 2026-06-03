-- ========================================================================
-- SQL CURSOS - ESTRUCTURA COMPLETA
-- Tabla: cursos (19 registros)
-- Campos: id, codigo, nombre, nivel, id_establecimiento, activo, creado_en, actualizado_en
-- Fecha: 2026-04-21
-- IMPORTANTE: Inserta establecimientos primero (SQL_ESTABLECIMIENTOS.sql)
-- ========================================================================

BEGIN TRANSACTION;

-- Cursos 4to Grado (4 cursos)
INSERT INTO cursos (id, codigo, nombre, nivel, id_establecimiento, activo, creado_en, actualizado_en)
VALUES ('550e8400-e29b-41d4-a716-446655440001', '4A', '4to Grado A', 4, '18f3ec96-f15f-4787-a3ac-3c10f1cee55f', true, NOW(), NOW());

INSERT INTO cursos (id, codigo, nombre, nivel, id_establecimiento, activo, creado_en, actualizado_en)
VALUES ('550e8400-e29b-41d4-a716-446655440002', '4B', '4to Grado B', 4, '18f3ec96-f15f-4787-a3ac-3c10f1cee55f', true, NOW(), NOW());

INSERT INTO cursos (id, codigo, nombre, nivel, id_establecimiento, activo, creado_en, actualizado_en)
VALUES ('550e8400-e29b-41d4-a716-446655440003', '4C', '4to Grado C', 4, '18f3ec96-f15f-4787-a3ac-3c10f1cee55f', true, NOW(), NOW());

INSERT INTO cursos (id, codigo, nombre, nivel, id_establecimiento, activo, creado_en, actualizado_en)
VALUES ('550e8400-e29b-41d4-a716-446655440004', '4D', '4to Grado D', 4, '18f3ec96-f15f-4787-a3ac-3c10f1cee55f', true, NOW(), NOW());

-- Cursos 3ro Grado (4 cursos)
INSERT INTO cursos (id, codigo, nombre, nivel, id_establecimiento, activo, creado_en, actualizado_en)
VALUES ('550e8400-e29b-41d4-a716-446655440005', '3A', '3ro Grado A', 3, '18f3ec96-f15f-4787-a3ac-3c10f1cee55f', true, NOW(), NOW());

INSERT INTO cursos (id, codigo, nombre, nivel, id_establecimiento, activo, creado_en, actualizado_en)
VALUES ('550e8400-e29b-41d4-a716-446655440006', '3B', '3ro Grado B', 3, '18f3ec96-f15f-4787-a3ac-3c10f1cee55f', true, NOW(), NOW());

INSERT INTO cursos (id, codigo, nombre, nivel, id_establecimiento, activo, creado_en, actualizado_en)
VALUES ('550e8400-e29b-41d4-a716-446655440007', '3C', '3ro Grado C', 3, '18f3ec96-f15f-4787-a3ac-3c10f1cee55f', true, NOW(), NOW());

INSERT INTO cursos (id, codigo, nombre, nivel, id_establecimiento, activo, creado_en, actualizado_en)
VALUES ('550e8400-e29b-41d4-a716-446655440008', '3D', '3ro Grado D', 3, '18f3ec96-f15f-4787-a3ac-3c10f1cee55f', true, NOW(), NOW());

-- Cursos 2do Grado (4 cursos)
INSERT INTO cursos (id, codigo, nombre, nivel, id_establecimiento, activo, creado_en, actualizado_en)
VALUES ('550e8400-e29b-41d4-a716-446655440009', '2A', '2do Grado A', 2, '18f3ec96-f15f-4787-a3ac-3c10f1cee55f', true, NOW(), NOW());

INSERT INTO cursos (id, codigo, nombre, nivel, id_establecimiento, activo, creado_en, actualizado_en)
VALUES ('550e8400-e29b-41d4-a716-446655440010', '2B', '2do Grado B', 2, '18f3ec96-f15f-4787-a3ac-3c10f1cee55f', true, NOW(), NOW());

INSERT INTO cursos (id, codigo, nombre, nivel, id_establecimiento, activo, creado_en, actualizado_en)
VALUES ('550e8400-e29b-41d4-a716-446655440011', '2C', '2do Grado C', 2, '18f3ec96-f15f-4787-a3ac-3c10f1cee55f', true, NOW(), NOW());

INSERT INTO cursos (id, codigo, nombre, nivel, id_establecimiento, activo, creado_en, actualizado_en)
VALUES ('550e8400-e29b-41d4-a716-446655440012', '2D', '2do Grado D', 2, '18f3ec96-f15f-4787-a3ac-3c10f1cee55f', true, NOW(), NOW());

-- Cursos 1ro Grado (4 cursos)
INSERT INTO cursos (id, codigo, nombre, nivel, id_establecimiento, activo, creado_en, actualizado_en)
VALUES ('550e8400-e29b-41d4-a716-446655440013', '1A', '1ro Grado A', 1, '18f3ec96-f15f-4787-a3ac-3c10f1cee55f', true, NOW(), NOW());

INSERT INTO cursos (id, codigo, nombre, nivel, id_establecimiento, activo, creado_en, actualizado_en)
VALUES ('550e8400-e29b-41d4-a716-446655440014', '1B', '1ro Grado B', 1, '18f3ec96-f15f-4787-a3ac-3c10f1cee55f', true, NOW(), NOW());

INSERT INTO cursos (id, codigo, nombre, nivel, id_establecimiento, activo, creado_en, actualizado_en)
VALUES ('550e8400-e29b-41d4-a716-446655440015', '1C', '1ro Grado C', 1, '18f3ec96-f15f-4787-a3ac-3c10f1cee55f', true, NOW(), NOW());

INSERT INTO cursos (id, codigo, nombre, nivel, id_establecimiento, activo, creado_en, actualizado_en)
VALUES ('550e8400-e29b-41d4-a716-446655440016', '1D', '1ro Grado D', 1, '18f3ec96-f15f-4787-a3ac-3c10f1cee55f', true, NOW(), NOW());

-- Cursos adicionales (3 cursos)
INSERT INTO cursos (id, codigo, nombre, nivel, id_establecimiento, activo, creado_en, actualizado_en)
VALUES ('550e8400-e29b-41d4-a716-446655440017', 'EXTRA1', 'Curso Adicional 1', 4, '18f3ec96-f15f-4787-a3ac-3c10f1cee55f', true, NOW(), NOW());

INSERT INTO cursos (id, codigo, nombre, nivel, id_establecimiento, activo, creado_en, actualizado_en)
VALUES ('550e8400-e29b-41d4-a716-446655440018', 'EXTRA2', 'Curso Adicional 2', 4, '18f3ec96-f15f-4787-a3ac-3c10f1cee55f', true, NOW(), NOW());

INSERT INTO cursos (id, codigo, nombre, nivel, id_establecimiento, activo, creado_en, actualizado_en)
VALUES ('550e8400-e29b-41d4-a716-446655440019', 'EXTRA3', 'Curso Adicional 3', 4, '18f3ec96-f15f-4787-a3ac-3c10f1cee55f', true, NOW(), NOW());

COMMIT;

-- ========================================================================
-- VALIDACIÓN
-- ========================================================================
SELECT COUNT(*) as total_cursos FROM cursos;
SELECT id, codigo, nombre, nivel, activo FROM cursos ORDER BY nivel DESC, codigo ASC;
