-- ============================================================
-- SGJA – Migration 012: RLS Policies for Core Tables
-- Habilita Row Level Security en tablas principales.
-- Cada bloque verifica que la tabla exista antes de actuar.
-- ============================================================

-- ════════════════════════════════════════════════════════════
-- Helper: es_admin (ya definido en migración 011, idempotente)
-- ════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.es_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = auth.uid() AND rol = 'ADMIN' AND activo = true
  );
$$;

-- ════════════════════════════════════════════════════════════
-- Helper: crear policy solo si la tabla existe
-- ════════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════════
-- Activación masiva de RLS (solo en tablas que existen)
-- ════════════════════════════════════════════════════════════

DO $$
DECLARE
  tablas text[] := ARRAY[
    'usuarios', 'establecimientos', 'equipos', 'lugares', 'ubicaciones',
    'requerimientos', 'funcionarios', 'solicitudes_registro', 'config_sistema',
    'estudiantes', 'solicitudes', 'usuarios_eliminados', 'cursos',
    'bloques_horarios', 'motivos_justificacion', 'configuracion_dispositivos',
    'qr_codes', 'posibles_fallas', 'posibles_diagnosticos', 'posibles_soluciones',
    'posibles_observaciones', 'datospersonalesusuarios', 'tokens_qr',
    'registros_bloque_profesor', 'roles_personalizados', 'parametros'
  ];
  t text;
BEGIN
  FOREACH t IN ARRAY tablas
  LOOP
    IF EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    ) THEN
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
    END IF;
  END LOOP;
END;
$$;

-- ════════════════════════════════════════════════════════════
-- GRUPO 1: Tablas de solo lectura para autenticados,
--          solo ADMIN escribe
-- ════════════════════════════════════════════════════════════

DO $$
DECLARE
  tablas text[] := ARRAY[
    'config_sistema', 'establecimientos', 'parametros',
    'cursos', 'bloques_horarios', 'motivos_justificacion',
    'roles_personalizados'
  ];
  t text;
BEGIN
  FOREACH t IN ARRAY tablas
  LOOP
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
      EXECUTE format(
        'DROP POLICY IF EXISTS %I ON %I; CREATE POLICY %I ON %I FOR SELECT USING (auth.role() = ''authenticated'');',
        t || '_select_all', t, t || '_select_all', t
      );
      EXECUTE format(
        'DROP POLICY IF EXISTS %I ON %I; CREATE POLICY %I ON %I FOR INSERT WITH CHECK (public.es_admin());',
        t || '_admin_insert', t, t || '_admin_insert', t
      );
      EXECUTE format(
        'DROP POLICY IF EXISTS %I ON %I; CREATE POLICY %I ON %I FOR UPDATE USING (public.es_admin());',
        t || '_admin_update', t, t || '_admin_update', t
      );
      EXECUTE format(
        'DROP POLICY IF EXISTS %I ON %I; CREATE POLICY %I ON %I FOR DELETE USING (public.es_admin());',
        t || '_admin_delete', t, t || '_admin_delete', t
      );
    END IF;
  END LOOP;
END;
$$;

-- ════════════════════════════════════════════════════════════
-- GRUPO 2: usuarios — SOLO políticas seguras (sin es_admin()
--          para evitar recursión infinita).
--          Admin INSERT/UPDATE/DELETE van por SECURITY DEFINER RPCs.
-- ════════════════════════════════════════════════════════════

DO $$
DECLARE
  rec RECORD;
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'usuarios') THEN
    -- Eliminar TODAS las políticas existentes en usuarios
    FOR rec IN SELECT policyname FROM pg_policies WHERE tablename = 'usuarios' AND schemaname = 'public'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.usuarios', rec.policyname);
    END LOOP;

    -- Política segura: usuarios autenticados pueden LEER
    EXECUTE 'CREATE POLICY usuarios_select ON public.usuarios FOR SELECT USING (auth.role() = ''authenticated'')';

    -- Política segura: usuario puede actualizar su propio registro
    EXECUTE 'CREATE POLICY usuarios_self_update ON public.usuarios FOR UPDATE USING (auth.uid() = id)';
  END IF;
END;
$$;

-- ════════════════════════════════════════════════════════════
-- GRUPO 3: funcionarios — lectura todos, escritura admin
-- ════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'funcionarios') THEN
    DROP POLICY IF EXISTS funcionarios_select_all ON funcionarios;
    CREATE POLICY funcionarios_select_all ON funcionarios
      FOR SELECT USING (auth.role() = 'authenticated');

    DROP POLICY IF EXISTS funcionarios_admin_insert ON funcionarios;
    CREATE POLICY funcionarios_admin_insert ON funcionarios
      FOR INSERT WITH CHECK (public.es_admin());

    DROP POLICY IF EXISTS funcionarios_admin_update ON funcionarios;
    CREATE POLICY funcionarios_admin_update ON funcionarios
      FOR UPDATE USING (public.es_admin());

    DROP POLICY IF EXISTS funcionarios_admin_delete ON funcionarios;
    CREATE POLICY funcionarios_admin_delete ON funcionarios
      FOR DELETE USING (public.es_admin());
  END IF;
END;
$$;

-- ════════════════════════════════════════════════════════════
-- GRUPO 4: solicitudes_registro — lectura todos, escritura admin
-- ════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'solicitudes_registro') THEN
    DROP POLICY IF EXISTS solicitudes_registro_select_all ON solicitudes_registro;
    CREATE POLICY solicitudes_registro_select_all ON solicitudes_registro
      FOR SELECT USING (auth.role() = 'authenticated');

    DROP POLICY IF EXISTS solicitudes_registro_admin_insert ON solicitudes_registro;
    CREATE POLICY solicitudes_registro_admin_insert ON solicitudes_registro
      FOR INSERT WITH CHECK (public.es_admin());

    DROP POLICY IF EXISTS solicitudes_registro_admin_update ON solicitudes_registro;
    CREATE POLICY solicitudes_registro_admin_update ON solicitudes_registro
      FOR UPDATE USING (public.es_admin());
  END IF;
END;
$$;

-- ════════════════════════════════════════════════════════════
-- GRUPO 5: usuarios_eliminados — solo admin
-- ════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'usuarios_eliminados') THEN
    DROP POLICY IF EXISTS usuarios_eliminados_select_admin ON usuarios_eliminados;
    CREATE POLICY usuarios_eliminados_select_admin ON usuarios_eliminados
      FOR SELECT USING (public.es_admin());

    DROP POLICY IF EXISTS usuarios_eliminados_insert_admin ON usuarios_eliminados;
    CREATE POLICY usuarios_eliminados_insert_admin ON usuarios_eliminados
      FOR INSERT WITH CHECK (public.es_admin());
  END IF;
END;
$$;

-- ════════════════════════════════════════════════════════════
-- GRUPO 6: Tablas por establecimiento (equipos, lugares,
--          ubicaciones, requerimientos)
-- ════════════════════════════════════════════════════════════

-- Equipos
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'equipos') THEN
    DROP POLICY IF EXISTS equipos_select_all ON equipos;
    CREATE POLICY equipos_select_all ON equipos
      FOR SELECT USING (auth.role() = 'authenticated');

    DROP POLICY IF EXISTS equipos_establecimiento_insert ON equipos;
    CREATE POLICY equipos_establecimiento_insert ON equipos
      FOR INSERT WITH CHECK (
        public.es_admin() OR EXISTS (
          SELECT 1 FROM public.usuarios
          WHERE id = auth.uid()
          AND id_establecimiento = equipos.id_establecimiento
          AND activo = true
        )
      );

    DROP POLICY IF EXISTS equipos_establecimiento_update ON equipos;
    CREATE POLICY equipos_establecimiento_update ON equipos
      FOR UPDATE USING (
        public.es_admin() OR EXISTS (
          SELECT 1 FROM public.usuarios
          WHERE id = auth.uid()
          AND id_establecimiento = equipos.id_establecimiento
          AND activo = true
        )
      );

    DROP POLICY IF EXISTS equipos_admin_delete ON equipos;
    CREATE POLICY equipos_admin_delete ON equipos
      FOR DELETE USING (public.es_admin());
  END IF;
END;
$$;

-- Lugares
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lugares') THEN
    DROP POLICY IF EXISTS lugares_select_all ON lugares;
    CREATE POLICY lugares_select_all ON lugares
      FOR SELECT USING (auth.role() = 'authenticated');

    DROP POLICY IF EXISTS lugares_establecimiento_insert ON lugares;
    CREATE POLICY lugares_establecimiento_insert ON lugares
      FOR INSERT WITH CHECK (
        public.es_admin() OR EXISTS (
          SELECT 1 FROM public.usuarios
          WHERE id = auth.uid()
          AND id_establecimiento = lugares.id_establecimiento
          AND activo = true
        )
      );

    DROP POLICY IF EXISTS lugares_establecimiento_update ON lugares;
    CREATE POLICY lugares_establecimiento_update ON lugares
      FOR UPDATE USING (
        public.es_admin() OR EXISTS (
          SELECT 1 FROM public.usuarios
          WHERE id = auth.uid()
          AND id_establecimiento = lugares.id_establecimiento
          AND activo = true
        )
      );
  END IF;
END;
$$;

-- Requerimientos
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'requerimientos') THEN
    DROP POLICY IF EXISTS requerimientos_select_all ON requerimientos;
    CREATE POLICY requerimientos_select_all ON requerimientos
      FOR SELECT USING (auth.role() = 'authenticated');

    DROP POLICY IF EXISTS requerimientos_establecimiento_insert ON requerimientos;
    CREATE POLICY requerimientos_establecimiento_insert ON requerimientos
      FOR INSERT WITH CHECK (
        public.es_admin() OR EXISTS (
          SELECT 1 FROM public.usuarios u
          JOIN public.equipos eq ON eq.id_establecimiento = u.id_establecimiento
          WHERE u.id = auth.uid() AND eq.id = requerimientos.id_equipo
          AND u.activo = true
        )
      );

    DROP POLICY IF EXISTS requerimientos_establecimiento_update ON requerimientos;
    CREATE POLICY requerimientos_establecimiento_update ON requerimientos
      FOR UPDATE USING (
        public.es_admin() OR EXISTS (
          SELECT 1 FROM public.usuarios u
          JOIN public.equipos eq ON eq.id_establecimiento = u.id_establecimiento
          WHERE u.id = auth.uid() AND eq.id = requerimientos.id_equipo
          AND u.activo = true
        )
      );
  END IF;
END;
$$;

-- ════════════════════════════════════════════════════════════
-- GRUPO 7: Tablas del módulo técnico (configuración)
--          Lectura para autenticados, escritura admin/técnicos
-- ════════════════════════════════════════════════════════════

DO $$
DECLARE
  tablas text[] := ARRAY[
    'configuracion_dispositivos', 'qr_codes',
    'posibles_fallas', 'posibles_diagnosticos',
    'posibles_soluciones', 'posibles_observaciones'
  ];
  t text;
BEGIN
  FOREACH t IN ARRAY tablas
  LOOP
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
      EXECUTE format(
        'DROP POLICY IF EXISTS %I ON %I; CREATE POLICY %I ON %I FOR SELECT USING (auth.role() = ''authenticated'');',
        t || '_select_all', t, t || '_select_all', t
      );
      EXECUTE format(
        'DROP POLICY IF EXISTS %I ON %I; CREATE POLICY %I ON %I FOR INSERT WITH CHECK (public.es_admin());',
        t || '_admin_insert', t, t || '_admin_insert', t
      );
      EXECUTE format(
        'DROP POLICY IF EXISTS %I ON %I; CREATE POLICY %I ON %I FOR UPDATE USING (public.es_admin());',
        t || '_admin_update', t, t || '_admin_update', t
      );
      EXECUTE format(
        'DROP POLICY IF EXISTS %I ON %I; CREATE POLICY %I ON %I FOR DELETE USING (public.es_admin());',
        t || '_admin_delete', t, t || '_admin_delete', t
      );
    END IF;
  END LOOP;
END;
$$;

-- ════════════════════════════════════════════════════════════
-- GRUPO 8: estudiantes, solicitudes — lectura todos,
--          escritura según establecimiento
-- ════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'estudiantes') THEN
    DROP POLICY IF EXISTS estudiantes_select_all ON estudiantes;
    CREATE POLICY estudiantes_select_all ON estudiantes
      FOR SELECT USING (auth.role() = 'authenticated');

    DROP POLICY IF EXISTS estudiantes_admin_write ON estudiantes;
    CREATE POLICY estudiantes_admin_write ON estudiantes
      FOR INSERT WITH CHECK (public.es_admin());
    CREATE POLICY estudiantes_admin_update ON estudiantes
      FOR UPDATE USING (public.es_admin());
    CREATE POLICY estudiantes_admin_delete ON estudiantes
      FOR DELETE USING (public.es_admin());
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'solicitudes') THEN
    DROP POLICY IF EXISTS solicitudes_select_all ON solicitudes;
    CREATE POLICY solicitudes_select_all ON solicitudes
      FOR SELECT USING (auth.role() = 'authenticated');

    DROP POLICY IF EXISTS solicitudes_admin_write ON solicitudes;
    CREATE POLICY solicitudes_admin_write ON solicitudes
      FOR INSERT WITH CHECK (public.es_admin());
    CREATE POLICY solicitudes_admin_update ON solicitudes
      FOR UPDATE USING (public.es_admin());
    CREATE POLICY solicitudes_admin_delete ON solicitudes
      FOR DELETE USING (public.es_admin());
  END IF;
END;
$$;

-- ════════════════════════════════════════════════════════════
-- GRUPO 9: datos personales — lectura usuarios autenticados,
--          escritura admin
-- ════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'datospersonalesusuarios') THEN
    DROP POLICY IF EXISTS datospersonales_select_all ON datospersonalesusuarios;
    CREATE POLICY datospersonales_select_all ON datospersonalesusuarios
      FOR SELECT USING (auth.role() = 'authenticated');

    DROP POLICY IF EXISTS datospersonales_admin_write ON datospersonalesusuarios;
    CREATE POLICY datospersonales_admin_write ON datospersonalesusuarios
      FOR INSERT WITH CHECK (public.es_admin());
    CREATE POLICY datospersonales_admin_update ON datospersonalesusuarios
      FOR UPDATE USING (public.es_admin());
    CREATE POLICY datospersonales_admin_delete ON datospersonalesusuarios
      FOR DELETE USING (public.es_admin());
  END IF;
END;
$$;

-- ════════════════════════════════════════════════════════════
-- NOTA: Tablas como tokens_qr, registros_bloque_profesor,
-- ubicaciones, etc. se manejan con políticas por defecto
-- (solo lectura autenticada, escritura admin) si existen.
-- ════════════════════════════════════════════════════════════

DO $$
DECLARE
  tablas text[] := ARRAY['tokens_qr', 'registros_bloque_profesor', 'ubicaciones'];
  t text;
BEGIN
  FOREACH t IN ARRAY tablas
  LOOP
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
      EXECUTE format(
        'DROP POLICY IF EXISTS %I ON %I; CREATE POLICY %I ON %I FOR SELECT USING (auth.role() = ''authenticated'');',
        t || '_select_all', t, t || '_select_all', t
      );
      EXECUTE format(
        'DROP POLICY IF EXISTS %I ON %I; CREATE POLICY %I ON %I FOR INSERT WITH CHECK (public.es_admin());',
        t || '_admin_insert', t, t || '_admin_insert', t
      );
      EXECUTE format(
        'DROP POLICY IF EXISTS %I ON %I; CREATE POLICY %I ON %I FOR UPDATE USING (public.es_admin());',
        t || '_admin_update', t, t || '_admin_update', t
      );
      EXECUTE format(
        'DROP POLICY IF EXISTS %I ON %I; CREATE POLICY %I ON %I FOR DELETE USING (public.es_admin());',
        t || '_admin_delete', t, t || '_admin_delete', t
      );
    END IF;
  END LOOP;
END;
$$;
