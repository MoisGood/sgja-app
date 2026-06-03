-- ========================================================================
-- SQL ESTABLECIMIENTOS - INSERTAR PRIMERO
-- Tabla: establecimientos (2 registros)
-- Fecha: 2026-04-21
-- ========================================================================

BEGIN TRANSACTION;

INSERT INTO establecimientos (id, codigo, nombre, activo, creado_en, actualizado_en)
VALUES ('18f3ec96-f15f-4787-a3ac-3c10f1cee55f', 'EST-001', 'Establecimiento Principal', true, NOW(), NOW());

COMMIT;

-- Validar y copiar el UUID del establecimiento que usaremos:
SELECT id, codigo, nombre FROM establecimientos;
