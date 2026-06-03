-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - POLÍTICAS DE SEGURIDAD - CORREGIDAS TIPO CASTING
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
-- PASO 2: CREAR POLÍTICAS PARA TABLA USUARIOS
-- ============================================================================

CREATE POLICY "admin_ver_todos_usuarios" ON usuarios
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.uid = auth.uid()::text
      AND u.rol = 'ADMIN'
    )
  );

CREATE POLICY "usuarios_ver_establecimiento" ON usuarios
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND id_establecimiento = (
      SELECT id_establecimiento FROM usuarios
      WHERE uid = auth.uid()::text
      LIMIT 1
    )
  );

CREATE POLICY "usuarios_actualizar_perfil" ON usuarios
  FOR UPDATE
  USING (uid = auth.uid()::text)
  WITH CHECK (uid = auth.uid()::text);

-- ============================================================================
-- PASO 3: CREAR POLÍTICAS PARA TABLA ESTUDIANTES
-- ============================================================================

CREATE POLICY "profesores_ver_estudiantes" ON estudiantes
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND id_establecimiento = (
      SELECT id_establecimiento FROM usuarios
      WHERE uid = auth.uid()::text
      LIMIT 1
    )
  );

CREATE POLICY "apoderados_ver_hijos" ON estudiantes
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND apoderado_id = (
      SELECT id FROM usuarios
      WHERE uid = auth.uid()::text
      LIMIT 1
    )
  );

CREATE POLICY "admin_ver_todos_estudiantes" ON estudiantes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.uid = auth.uid()::text
      AND u.rol = 'ADMIN'
    )
  );

CREATE POLICY "profesores_actualizar_estudiantes" ON estudiantes
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND id_establecimiento = (
      SELECT id_establecimiento FROM usuarios
      WHERE uid = auth.uid()::text
      LIMIT 1
    )
  );

-- ============================================================================
-- PASO 4: CREAR POLÍTICAS PARA TABLA SOLICITUDES
-- ============================================================================

CREATE POLICY "profesores_ver_solicitudes" ON solicitudes
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND id_establecimiento = (
      SELECT id_establecimiento FROM usuarios
      WHERE uid = auth.uid()::text
      LIMIT 1
    )
  );

CREATE POLICY "apoderados_ver_solicitudes_hijos" ON solicitudes
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND id_estudiante IN (
      SELECT id_estudiante FROM estudiantes
      WHERE apoderado_id = (
        SELECT id FROM usuarios
        WHERE uid = auth.uid()::text
        LIMIT 1
      )
    )
  );

CREATE POLICY "inspectores_ver_solicitudes" ON solicitudes
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND id_establecimiento = (
      SELECT id_establecimiento FROM usuarios
      WHERE uid = auth.uid()::text
      AND rol = 'INSPECTOR'
      LIMIT 1
    )
  );

CREATE POLICY "admin_ver_todas_solicitudes" ON solicitudes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.uid = auth.uid()::text
      AND u.rol = 'ADMIN'
    )
  );

CREATE POLICY "profesores_crear_solicitudes" ON solicitudes
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND id_establecimiento = (
      SELECT id_establecimiento FROM usuarios
      WHERE uid = auth.uid()::text
      LIMIT 1
    )
    AND id_profesor = (
      SELECT id FROM usuarios
      WHERE uid = auth.uid()::text
      LIMIT 1
    )
  );

CREATE POLICY "inspectores_justificar_solicitudes" ON solicitudes
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND id_establecimiento = (
      SELECT id_establecimiento FROM usuarios
      WHERE uid = auth.uid()::text
      AND rol = 'INSPECTOR'
      LIMIT 1
    )
  )
  WITH CHECK (
    id_inspector_justificador = (
      SELECT id FROM usuarios
      WHERE uid = auth.uid()::text
      LIMIT 1
    )
  );

-- ============================================================================
-- PASO 5: CREAR POLÍTICAS PARA TABLA BLOQUES_HORARIOS
-- ============================================================================

CREATE POLICY "usuarios_ver_bloques" ON bloques_horarios
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND id_establecimiento = (
      SELECT id_establecimiento FROM usuarios
      WHERE uid = auth.uid()::text
      LIMIT 1
    )
  );

CREATE POLICY "admin_ver_todos_bloques" ON bloques_horarios
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.uid = auth.uid()::text
      AND u.rol = 'ADMIN'
    )
  );

-- ============================================================================
-- PASO 6: CREAR POLÍTICAS PARA TABLA CURSOS
-- ============================================================================

CREATE POLICY "profesores_ver_cursos" ON cursos
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND id_establecimiento = (
      SELECT id_establecimiento FROM usuarios
      WHERE uid = auth.uid()::text
      LIMIT 1
    )
  );

CREATE POLICY "admin_ver_todos_cursos" ON cursos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.uid = auth.uid()::text
      AND u.rol = 'ADMIN'
    )
  );

CREATE POLICY "profesor_jefe_actualizar_curso" ON cursos
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND profesor_jefe_id = (
      SELECT id FROM usuarios
      WHERE uid = auth.uid()::text
      LIMIT 1
    )
  );

-- ============================================================================
-- PASO 7: CREAR POLÍTICAS PARA TABLA FUNCIONARIOS
-- ============================================================================

CREATE POLICY "todos_ver_funcionarios" ON funcionarios
  FOR SELECT
  USING (true);

CREATE POLICY "admin_modificar_funcionarios" ON funcionarios
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.uid = auth.uid()::text
      AND u.rol = 'ADMIN'
    )
  );

CREATE POLICY "admin_eliminar_funcionarios" ON funcionarios
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.uid = auth.uid()::text
      AND u.rol = 'ADMIN'
    )
  );

-- ============================================================================
-- PASO 8: POLÍTICAS PARA TABLAS PÚBLICAS (SIN RESTRICCIONES)
-- ============================================================================

CREATE POLICY "todos_ver_establecimientos" ON establecimientos
  FOR SELECT
  USING (true);

CREATE POLICY "todos_ver_motivos" ON motivos_justificacion
  FOR SELECT
  USING (true);

CREATE POLICY "todos_ver_permisos" ON permisos
  FOR SELECT
  USING (true);

CREATE POLICY "todos_ver_paginas" ON paginas
  FOR SELECT
  USING (true);

-- ============================================================================
-- PASO 9: CREAR FUNCIONES AUXILIARES
-- ============================================================================

CREATE OR REPLACE FUNCTION public.obtener_rol_usuario()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT rol FROM usuarios
    WHERE uid = auth.uid()::text
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.obtener_id_establecimiento()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT id_establecimiento FROM usuarios
    WHERE uid = auth.uid()::text
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VERIFICACIÓN (EJECUTAR DESPUÉS PARA VALIDAR)
-- ============================================================================

-- Descomenta para verificar que todas las políticas fueron creadas:
-- SELECT tablename, policyname FROM pg_policies 
-- WHERE tablename IN ('usuarios', 'estudiantes', 'solicitudes', 'bloques_horarios', 'cursos', 'funcionarios')
-- ORDER BY tablename, policyname;

-- ============================================================================
-- FIN DEL SCRIPT RLS - CON MANEJO DE TIPOS CORRECTO
-- ============================================================================
