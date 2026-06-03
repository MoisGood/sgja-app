-- ============================================================================
-- VERIFICACIÓN: COMPROBAR QUE TODAS LAS POLÍTICAS SE CREARON CORRECTAMENTE
-- Copiar y ejecutar estas queries una por una en Supabase SQL Editor
-- ============================================================================

-- QUERY 1: VER TODAS LAS POLÍTICAS CREADAS
SELECT tablename, policyname, qual, with_check
FROM pg_policies 
WHERE tablename IN ('usuarios', 'estudiantes', 'solicitudes', 'bloques_horarios', 'cursos', 'funcionarios')
ORDER BY tablename, policyname;

-- Resultado esperado: ~26 políticas (mira la tabla de abajo)

-- ============================================================================

-- QUERY 2: CONTAR POLÍTICAS POR TABLA
SELECT tablename, COUNT(*) as num_policies
FROM pg_policies
WHERE tablename IN ('usuarios', 'estudiantes', 'solicitudes', 'bloques_horarios', 'cursos', 'funcionarios')
GROUP BY tablename
ORDER BY tablename;

-- Resultado esperado:
-- usuarios | 3
-- estudiantes | 4
-- solicitudes | 6
-- bloques_horarios | 2
-- cursos | 3
-- funcionarios | 3

-- ============================================================================

-- QUERY 3: VER TODAS LAS TABLAS CON RLS HABILITADO
SELECT tablename
FROM pg_tables t
WHERE schemaname = 'public'
AND EXISTS (SELECT 1 FROM pg_class c WHERE c.relname = t.tablename AND c.relrowsecurity = true)
ORDER BY tablename;

-- Resultado esperado: 6 tablas
-- bloques_horarios
-- cursos
-- estudiantes
-- funcionarios
-- solicitudes
-- usuarios

-- ============================================================================

-- QUERY 4: VER LAS FUNCIONES AUXILIARES CREADAS
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE 'obtener%'
ORDER BY routine_name;

-- Resultado esperado: 2 funciones
-- obtener_id_establecimiento | FUNCTION
-- obtener_rol_usuario | FUNCTION

-- ============================================================================

-- QUERY 5: VER TODAS LAS TABLAS EN LA BASE DE DATOS
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Resultado esperado: 11 tablas
-- bloques_horarios
-- cursos
-- establecimientos
-- estudiantes
-- funcionarios
-- motivos_justificacion
-- paginas
-- permisos
-- rol_permisos
-- solicitudes
-- usuarios

-- ============================================================================

-- QUERY 6: VER LA ESTRUCTURA DE TABLA USUARIOS (VERIFICAR COLUMNAS)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'usuarios'
ORDER BY ordinal_position;

-- Resultado esperado: 9 columnas
-- id | uuid | NO
-- uid | text | NO
-- email | text | NO
-- nombre_completo | text | NO
-- rol | text | NO
-- id_establecimiento | uuid | YES
-- activo | boolean | YES
-- creado_en | timestamp | YES
-- actualizado_en | timestamp | YES

-- ============================================================================

-- QUERY 7: CONTAR REGISTROS INICIALES DE EJEMPLO
SELECT 'establecimientos' as tabla, COUNT(*) as cantidad FROM establecimientos
UNION ALL
SELECT 'usuarios', COUNT(*) FROM usuarios
UNION ALL
SELECT 'estudiantes', COUNT(*) FROM estudiantes
UNION ALL
SELECT 'solicitudes', COUNT(*) FROM solicitudes
UNION ALL
SELECT 'bloques_horarios', COUNT(*) FROM bloques_horarios
UNION ALL
SELECT 'motivos_justificacion', COUNT(*) FROM motivos_justificacion
UNION ALL
SELECT 'cursos', COUNT(*) FROM cursos
UNION ALL
SELECT 'funcionarios', COUNT(*) FROM funcionarios
UNION ALL
SELECT 'permisos', COUNT(*) FROM permisos
ORDER BY tabla;

-- Resultado esperado (datos iniciales):
-- bloques_horarios | 8
-- establecimientos | 3
-- funcionarios | 0 (si no importaste)
-- motivos_justificacion | 5
-- permisos | 8
-- etc.

-- ============================================================================

-- QUERY 8: PROBAR QUE RLS ESTÁ ACTIVO (Sin logearse debería retornar 0)
SELECT COUNT(*) FROM usuarios;

-- Si devuelve: 0 o error "permission denied"
-- ✅ RLS está activo (muy bien!)

-- Para ver datos, necesitas estar logeado en auth.users

-- ============================================================================

-- QUERY 9: VER ÍNDICES CREADOS
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Resultado esperado: ~15+ índices para optimización

-- ============================================================================

-- QUERY 10: VER TRIGGERS CREADOS
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Resultado esperado: Triggers para:
-- - on_auth_user_created
-- - on_auth_user_updated  
-- - on_auth_user_deleted
-- - Triggers de actualización de timestamps en usuarios, estudiantes, solicitudes, cursos

-- ============================================================================
-- CHECKLIST FINAL
-- ============================================================================

/*

✅ CHECKLIST - Ejecuta cada QUERY arriba y verifica:

PASO 1: Ejecutar QUERY 1
- [ ] Se muestran ~26 políticas
- [ ] Todas con nombre correcto (admin_ver_, profesores_ver_, etc.)

PASO 2: Ejecutar QUERY 2
- [ ] usuarios: 3 políticas
- [ ] estudiantes: 4 políticas
- [ ] solicitudes: 6 políticas
- [ ] bloques_horarios: 2 políticas
- [ ] cursos: 3 políticas
- [ ] funcionarios: 3 políticas

PASO 3: Ejecutar QUERY 3
- [ ] 6 tablas con RLS habilitado

PASO 4: Ejecutar QUERY 4
- [ ] 2 funciones: obtener_id_establecimiento, obtener_rol_usuario

PASO 5: Ejecutar QUERY 5
- [ ] 11 tablas listadas

PASO 6: Ejecutar QUERY 6
- [ ] Tabla usuarios tiene 9 columnas correctas

PASO 7: Ejecutar QUERY 7
- [ ] Datos iniciales cargados (motivos, establecimientos, permisos, bloques)

PASO 8: Ejecutar QUERY 8
- [ ] RLS está protegiendo datos (retorna 0 o error)

PASO 9: Ejecutar QUERY 9
- [ ] Índices para optimización listados

PASO 10: Ejecutar QUERY 10
- [ ] Triggers de auth y timestamps creados

SI TODO PASÓ ✅ → CONTINUAR AL SIGUIENTE PASO

*/

-- ============================================================================
-- FIN - VERIFICACIÓN COMPLETA
-- ============================================================================
