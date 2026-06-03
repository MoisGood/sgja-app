-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - POLÍTICAS DE SEGURIDAD
-- Ejecutar en Supabase SQL Editor después de crear las tablas
-- ============================================================================

-- ============================================================================
-- PASO 1: VERIFICAR QUE RLS ESTÉ HABILITADO EN TABLAS CRÍTICAS
-- ============================================================================

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE estudiantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitudes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bloques_horarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE cursos ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PASO 2: CREAR POLÍTICAS PARA TABLA "usuarios"
-- ============================================================================
-- POLICY 2.1: ADMINS ven todos los usuarios
CREATE POLICY "admin_ver_todos_usuarios" ON usuarios
  AS SELECT
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.uid = auth.uid()
      AND u.rol = 'ADMIN'
    )
  );

-- POLICY 2.2: USUARIOS VEN SOLO SU ESTABLECIMIENTO
CREATE POLICY "usuarios_ver_establecimiento" ON usuarios
  AS SELECT
  USING (
    id_establecimiento = (
      SELECT id_establecimiento FROM usuarios
      WHERE uid = auth.uid()
      LIMIT 1
    )
  );

-- POLICY 2.3: USUARIOS MODIFICAN SOLO SU PERFIL
CREATE POLICY "usuarios_actualizar_perfil" ON usuarios
  AS UPDATE
  USING (uid = auth.uid())
  WITH CHECK (uid = auth.uid());

-- ============================================================================
-- PASO 3: CREAR POLÍTICAS PARA TABLA "estudiantes"
-- ============================================================================

-- POLICY 3.1: PROFESORES ven estudiantes de su establecimiento
CREATE POLICY "profesores_ver_estudiantes" ON estudiantes
  AS SELECT
  USING (
    id_establecimiento = (
      SELECT id_establecimiento FROM usuarios
      WHERE uid = auth.uid()
      LIMIT 1
    )
  );

-- POLICY 3.2: APODERADOS ven solo sus hijos
CREATE POLICY "apoderados_ver_hijos" ON estudiantes
  AS SELECT
  USING (
    apoderado_id = (
      SELECT id FROM usuarios
      WHERE uid = auth.uid()
      LIMIT 1
    )
  );

-- POLICY 3.3: ADMINS ven todos los estudiantes
CREATE POLICY "admin_ver_todos_estudiantes" ON estudiantes
  AS SELECT
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.uid = auth.uid()
      AND u.rol = 'ADMIN'
    )
  );

-- POLICY 3.4: PROFESORES PUEDEN ACTUALIZAR ESTUDIANTES DE SU ESTABLECIMIENTO
CREATE POLICY "profesores_actualizar_estudiantes" ON estudiantes
  AS UPDATE
  USING (
    id_establecimiento = (
      SELECT id_establecimiento FROM usuarios
      WHERE uid = auth.uid()
      LIMIT 1
    )
  );

-- ============================================================================
-- PASO 4: CREAR POLÍTICAS PARA TABLA "solicitudes"
-- ============================================================================

-- POLICY 4.1: PROFESORES ven solicitudes de su establecimiento
CREATE POLICY "profesores_ver_solicitudes" ON solicitudes
  AS SELECT
  USING (
    id_establecimiento = (
      SELECT id_establecimiento FROM usuarios
      WHERE uid = auth.uid()
      LIMIT 1
    )
  );

-- POLICY 4.2: APODERADOS ven solo solicitudes de sus hijos
CREATE POLICY "apoderados_ver_solicitudes_hijos" ON solicitudes
  AS SELECT
  USING (
    id_estudiante IN (
      SELECT id_estudiante FROM estudiantes
      WHERE apoderado_id = (
        SELECT id FROM usuarios
        WHERE uid = auth.uid()
        LIMIT 1
      )
    )
  );

-- POLICY 4.3: INSPECTORES ven solicitudes de su establecimiento
CREATE POLICY "inspectores_ver_solicitudes" ON solicitudes
  AS SELECT
  USING (
    id_establecimiento = (
      SELECT id_establecimiento FROM usuarios
      WHERE uid = auth.uid()
      AND rol = 'INSPECTOR'
      LIMIT 1
    )
  );

-- POLICY 4.4: ADMINS ven todas las solicitudes
CREATE POLICY "admin_ver_todas_solicitudes" ON solicitudes
  AS SELECT
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.uid = auth.uid()
      AND u.rol = 'ADMIN'
    )
  );

-- POLICY 4.5: PROFESORES CREAN solicitudes para su establecimiento
CREATE POLICY "profesores_crear_solicitudes" ON solicitudes
  AS INSERT
  WITH CHECK (
    id_establecimiento = (
      SELECT id_establecimiento FROM usuarios
      WHERE uid = auth.uid()
      LIMIT 1
    )
    AND id_profesor = (
      SELECT id FROM usuarios
      WHERE uid = auth.uid()
      LIMIT 1
    )
  );

-- POLICY 4.6: INSPECTORES PUEDEN JUSTIFICAR solicitudes
CREATE POLICY "inspectores_justificar_solicitudes" ON solicitudes
  AS UPDATE
  USING (
    id_establecimiento = (
      SELECT id_establecimiento FROM usuarios
      WHERE uid = auth.uid()
      AND rol = 'INSPECTOR'
      LIMIT 1
    )
  )
  WITH CHECK (
    id_inspector_justificador = (
      SELECT id FROM usuarios
      WHERE uid = auth.uid()
      LIMIT 1
    )
  );

-- ============================================================================
-- PASO 5: CREAR POLÍTICAS PARA TABLA "bloques_horarios"
-- ============================================================================

-- POLICY 5.1: TODOS LOS USUARIOS VEN BLOQUES DE SU ESTABLECIMIENTO
CREATE POLICY "usuarios_ver_bloques" ON bloques_horarios
  AS SELECT
  USING (
    id_establecimiento = (
      SELECT id_establecimiento FROM usuarios
      WHERE uid = auth.uid()
      LIMIT 1
    )
  );

-- POLICY 5.2: ADMINS VEN TODOS LOS BLOQUES
CREATE POLICY "admin_ver_todos_bloques" ON bloques_horarios
  AS SELECT
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.uid = auth.uid()
      AND u.rol = 'ADMIN'
    )
  );

-- ============================================================================
-- PASO 6: CREAR POLÍTICAS PARA TABLA "cursos"
-- ============================================================================

-- POLICY 6.1: PROFESORES VEN CURSOS DE SU ESTABLECIMIENTO
CREATE POLICY "profesores_ver_cursos" ON cursos
  AS SELECT
  USING (
    id_establecimiento = (
      SELECT id_establecimiento FROM usuarios
      WHERE uid = auth.uid()
      LIMIT 1
    )
  );

-- POLICY 6.2: ADMINS VEN TODOS LOS CURSOS
CREATE POLICY "admin_ver_todos_cursos" ON cursos
  AS SELECT
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.uid = auth.uid()
      AND u.rol = 'ADMIN'
    )
  );

-- POLICY 6.3: PROFESORES JEFE PUEDEN ACTUALIZAR SUS CURSOS
CREATE POLICY "profesor_jefe_actualizar_curso" ON cursos
  AS UPDATE
  USING (
    profesor_jefe_id = (
      SELECT id FROM usuarios
      WHERE uid = auth.uid()
      LIMIT 1
    )
  );

-- ============================================================================
-- PASO 7: CREAR POLÍTICAS PARA TABLA "funcionarios"
-- ============================================================================

-- POLICY 7.1: TODOS PUEDEN VER FUNCIONARIOS (público)
CREATE POLICY "todos_ver_funcionarios" ON funcionarios
  AS SELECT
  USING (true);

-- POLICY 7.2: ADMINS PUEDEN MODIFICAR FUNCIONARIOS
CREATE POLICY "admin_modificar_funcionarios" ON funcionarios
  AS UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.uid = auth.uid()
      AND u.rol = 'ADMIN'
    )
  );

-- POLICY 7.3: ADMINS PUEDEN ELIMINAR FUNCIONARIOS
CREATE POLICY "admin_eliminar_funcionarios" ON funcionarios
  AS DELETE
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.uid = auth.uid()
      AND u.rol = 'ADMIN'
    )
  );

-- ============================================================================
-- PASO 8: POLÍTICAS PARA TABLAS PÚBLICAS (sin restricciones)
-- ============================================================================

-- POLICY 8.1: TODOS VEN ESTABLECIMIENTOS
CREATE POLICY "todos_ver_establecimientos" ON establecimientos
  AS SELECT
  USING (true);

-- POLICY 8.2: TODOS VEN MOTIVOS DE JUSTIFICACIÓN
CREATE POLICY "todos_ver_motivos" ON motivos_justificacion
  AS SELECT
  USING (true);

-- POLICY 8.3: TODOS VEN PERMISOS
CREATE POLICY "todos_ver_permisos" ON permisos
  AS SELECT
  USING (true);

-- POLICY 8.4: TODOS VEN PÁGINAS
CREATE POLICY "todos_ver_paginas" ON paginas
  AS SELECT
  USING (true);

-- ============================================================================
-- PASO 9: CREAR FUNCIÓN PARA OBTENER ROL DEL USUARIO
-- ============================================================================

CREATE OR REPLACE FUNCTION public.obtener_rol_usuario()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT rol FROM usuarios
    WHERE uid = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PASO 10: CREAR FUNCIÓN PARA OBTENER ESTABLECIMIENTO DEL USUARIO
-- ============================================================================

CREATE OR REPLACE FUNCTION public.obtener_id_establecimiento()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT id_establecimiento FROM usuarios
    WHERE uid = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PASO 11: VALIDAR POLÍTICAS CREADAS
-- ============================================================================

-- Ejecutar esta query para ver todas las policies creadas:
-- SELECT * FROM pg_policies WHERE tablename IN (
--   'usuarios', 'estudiantes', 'solicitudes', 'bloques_horarios',
--   'funcionarios', 'cursos', 'establecimientos', 'motivos_justificacion',
--   'permisos', 'paginas'
-- );

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================

/*
1. Las políticas RLS se aplican automáticamente a todas las queries
2. Los ADMINs pueden ver/modificar todo su establecimiento
3. Los PROFESORES ven estudiantes y solicitudes de su establecimiento
4. Los APODERADOS ven solo a sus hijos
5. Los INSPECRORES justifican solicitudes
6. Las políticas se evalúan en el contexto del auth.uid() del usuario

TESTING:
- Conectarse como PROFESOR: debe ver solo su establecimiento
- Conectarse como APODERADO: debe ver solo sus hijos
- Conectarse como INSPECTOR: debe ver solicitudes para justificar
- Conectarse como ADMIN: debe ver todo

DEBUGGING RLS:
- Si una query no retorna datos esperados, verificar que:
  1. auth.uid() está disponible
  2. La política condición es correcta
  3. Los datos cumplen la condición
  4. RLS está habilitado en la tabla
*/

-- ============================================================================
-- FIN DEL SCRIPT RLS
-- ============================================================================
