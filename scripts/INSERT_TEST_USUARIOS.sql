-- ============================================================
-- SQL para insertar usuario de prueba en tabla usuarios
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- Insertar usuario de prueba PROFESOR
-- Email: profesor1@andaliensur.cl
-- Rol: PROFESOR
-- Estado: Activo

INSERT INTO usuarios (
  id,
  email,
  nombre_completo,
  rol,
  id_establecimiento,
  activo
) VALUES (
  '550e8400-e29b-41d4-a716-446655550103',  -- UUID único para profesor
  'profesor1@andaliensur.cl',
  'Juan Profesor',
  'PROFESOR',
  '18f3ec96-f15f-4787-a3ac-3c10f1cee55f',  -- ID establecimiento
  true
) ON CONFLICT (id) DO NOTHING;

-- Insertar usuario de prueba ADMIN
INSERT INTO usuarios (
  id,
  email,
  nombre_completo,
  rol,
  id_establecimiento,
  activo,
  creado_en
) VALUES (
  '550e8400-e29b-41d4-a716-446655550104',  -- UUID único para admin
  'admin@andaliensur.cl',
  'Admin Test',
  'ADMIN',
  '18f3ec96-f15f-4787-a3ac-3c10f1cee55f',  -- ID establecimiento
  true,
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insertar usuario de prueba ESTUDIANTE
INSERT INTO usuarios (
  id,
  email,
  nombre_completo,
  rol,
  id_establecimiento,
  activo,
  creado_en
) VALUES (
  '550e8400-e29b-41d4-a716-446655550105',  -- UUID único para estudiante
  'estudiante@andaliensur.cl',
  'María Estudiante',
  'ESTUDIANTE',
  '18f3ec96-f15f-4787-a3ac-3c10f1cee55f',  -- ID establecimiento
  true,
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Verificar que se insertaron correctamente
SELECT id, email, nombre_completo, rol, activo FROM usuarios 
WHERE email IN ('profesor1@andaliensur.cl', 'admin@andaliensur.cl', 'estudiante@andaliensur.cl');
