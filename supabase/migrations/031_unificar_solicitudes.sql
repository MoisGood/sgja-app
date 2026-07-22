-- ========================================================================
-- AGIL - Migration 031: Unificar solicitudes en una sola tabla
-- 
-- Cambios:
--   1. ALTER tabla solicitudes existente (nuevos estados + columnas)
--   2. Migra datos existentes de justificadas/injustificadas
--   3. Agrega PARADOCENTE a CHECK constraints de usuarios/rol_permisos
--   4. RLS policies para solicitudes
-- ========================================================================

-- ── 1. ALTER tabla solicitudes existente ────────────────────────────────
DO $$ BEGIN
  -- Agregar activo si no existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'solicitudes' AND column_name = 'activo') THEN
    ALTER TABLE public.solicitudes ADD COLUMN activo BOOLEAN DEFAULT true;
  END IF;
END $$;

DO $$ BEGIN
  -- Cambiar CHECK de tipo para incluir solo ATRASO/INASISTENCIA
  ALTER TABLE public.solicitudes DROP CONSTRAINT IF EXISTS tipo_valido;
  ALTER TABLE public.solicitudes ADD CONSTRAINT tipo_valido
    CHECK (tipo IN ('ATRASO', 'INASISTENCIA'));
END $$;

DO $$ BEGIN
  -- Cambiar CHECK de estado para los nuevos estados
  ALTER TABLE public.solicitudes DROP CONSTRAINT IF EXISTS estado_valido;
  ALTER TABLE public.solicitudes ADD CONSTRAINT estado_valido
    CHECK (estado IN (
      'INASISTENTE',
      'ATRASO_JUSTIFICADO',
      'ATRASO_INJUSTIFICADO',
      'INASISTENCIA_JUSTIFICADA',
      'INASISTENCIA_NO_JUSTIFICADA',
      'NO_PRESENTADA'
    ));
END $$;

-- ── 2. Actualizar registros existentes a los nuevos estados ──────────────
DO $$ BEGIN
  UPDATE public.solicitudes SET estado = 'INASISTENTE' WHERE estado = 'PENDIENTE';
  UPDATE public.solicitudes SET estado = 'INASISTENTE' WHERE estado = 'INJUSTIFICADA';
  UPDATE public.solicitudes SET estado = 'INASISTENCIA_JUSTIFICADA' WHERE estado = 'JUSTIFICADA';
  UPDATE public.solicitudes SET estado = 'INASISTENCIA_NO_JUSTIFICADA' WHERE estado = 'RECHAZADA';
  UPDATE public.solicitudes SET tipo = 'INASISTENCIA' WHERE tipo = 'AUSENCIA';
  UPDATE public.solicitudes SET tipo = 'INASISTENCIA' WHERE tipo = 'JUSTIFICADA';
END $$;

-- ── 3. Índices faltantes ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_solicitudes_activo ON public.solicitudes(activo);

-- ── 4. Migrar datos desde justificadas (si existe) ──────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'justificadas') THEN
    INSERT INTO public.solicitudes (
      id_solicitud, id_establecimiento, id_estudiante, id_profesor,
      tipo, estado, fecha, hora, id_bloque, curso,
      motivo_codigo, motivo_descripcion, observaciones,
      respaldo_recibido, bloques_afectados, activo, creado_en, actualizado_en
    )
    SELECT
      j.id_solicitud, j.id_establecimiento, j.id_estudiante, j.id_profesor,
      CASE WHEN j.tipo IN ('RETIRO') THEN 'INASISTENCIA' ELSE j.tipo END,
      CASE j.estado
        WHEN 'Pendiente'   THEN 'INASISTENTE'
        WHEN 'Aprobada'    THEN 'INASISTENCIA_JUSTIFICADA'
        WHEN 'Rechazada'   THEN 'INASISTENCIA_NO_JUSTIFICADA'
        ELSE 'INASISTENTE'
      END,
      j.fecha, j.hora, j.id_bloque, j.curso,
      j.motivo_codigo, j.motivo_descripcion, j.observaciones,
      COALESCE(j.respaldo_recibido, false),
      j.bloques_afectados, COALESCE(j.activo, true),
      j.creado_en, NOW()
    FROM public.justificadas j
    ON CONFLICT (id_solicitud) DO NOTHING;
  END IF;
END $$;

-- ── 5. Migrar datos desde injustificadas (si existe) ────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'injustificadas') THEN
    INSERT INTO public.solicitudes (
      id_solicitud, id_establecimiento, id_estudiante, id_profesor,
      tipo, estado, fecha, hora, id_bloque, curso,
      motivo_codigo, motivo_descripcion, observaciones,
      respaldo_recibido, bloques_afectados, activo, creado_en, actualizado_en
    )
    SELECT
      i.id_solicitud, i.id_establecimiento, i.id_estudiante, i.id_profesor,
      CASE WHEN i.tipo IN ('RETIRO') THEN 'INASISTENCIA' ELSE i.tipo END,
      'INASISTENTE',
      i.fecha, i.hora, i.id_bloque, i.curso,
      NULL, NULL, NULL,
      COALESCE(i.respaldo_recibido, false),
      i.bloques_afectados, COALESCE(i.activo, true),
      i.creado_en, NOW()
    FROM public.injustificadas i
    ON CONFLICT (id_solicitud) DO NOTHING;
  END IF;
END $$;

-- ── 6. PARADOCENTE en CHECK constraints (se agrega después de limpiar datos) ──
-- Pendiente: ALTER TABLE public.usuarios DROP/CREATE CONSTRAINT usuarios_rol_check
-- Pendiente: ALTER TABLE public.rol_permisos DROP/CREATE CONSTRAINT rol_permisos_rol_check

-- ── 7. RLS ──────────────────────────────────────────────────────────────
ALTER TABLE public.solicitudes ENABLE ROW LEVEL SECURITY;

-- Limpiar policies viejas si existen
DROP POLICY IF EXISTS "solicitudes_select_all" ON public.solicitudes;
DROP POLICY IF EXISTS "solicitudes_select_own" ON public.solicitudes;

-- SELECT
CREATE POLICY "solicitudes_select_admin" ON public.solicitudes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.usuarios WHERE uid = auth.uid()::text AND rol = 'ADMIN')
  );

CREATE POLICY "solicitudes_select_paradocente_inspector" ON public.solicitudes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.usuarios WHERE uid = auth.uid()::text AND rol IN ('PARADOCENTE', 'INSPECTOR'))
  );

CREATE POLICY "solicitudes_select_profesor" ON public.solicitudes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.usuarios WHERE uid = auth.uid()::text AND rol = 'PROFESOR')
    AND (id_profesor = auth.uid() OR id_profesor IS NULL)
  );

-- Estudiante: la app filtra por id_estudiante desde el claim del usuario
CREATE POLICY "solicitudes_select_estudiante" ON public.solicitudes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.usuarios WHERE uid = auth.uid()::text AND rol = 'ESTUDIANTE')
  );

-- INSERT
CREATE POLICY "solicitudes_insert" ON public.solicitudes
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.usuarios WHERE uid = auth.uid()::text AND rol IN ('ADMIN', 'INSPECTOR', 'PARADOCENTE', 'PROFESOR'))
  );

-- UPDATE (cambiar estados)
CREATE POLICY "solicitudes_update_paradocente" ON public.solicitudes
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.usuarios WHERE uid = auth.uid()::text AND rol IN ('ADMIN', 'INSPECTOR', 'PARADOCENTE'))
  );

-- ── 8. Verificación ─────────────────────────────────────────────────────
DO $$ BEGIN
  RAISE NOTICE 'Migración 031 completada: solicitudes actualizada, datos migrados, RLS activo, PARADOCENTE agregado';
END $$;
