-- Migration: 045_asignacion_cursos_consolidados
-- Descripción: asignación de cursos a paradocente + tabla consolidados + tipos de pase
-- Idempotente: re-ejecutable sin errores.

-- 1. Tabla asignacion_paradocente
CREATE TABLE IF NOT EXISTS public.asignacion_paradocente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_funcionario UUID NOT NULL,
  id_establecimiento UUID NOT NULL,
  nivel TEXT NOT NULL,
  curso TEXT NOT NULL,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_asignacion_funcionario
  ON public.asignacion_paradocente(id_funcionario);

CREATE INDEX IF NOT EXISTS idx_asignacion_establecimiento
  ON public.asignacion_paradocente(id_establecimiento);

ALTER TABLE public.asignacion_paradocente ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Autenticados leen asignaciones" ON public.asignacion_paradocente;
CREATE POLICY "Autenticados leen asignaciones"
  ON public.asignacion_paradocente FOR SELECT
  USING (auth.uid()::text IS NOT NULL);

DROP POLICY IF EXISTS "Admin gestiona asignaciones" ON public.asignacion_paradocente;
CREATE POLICY "Admin gestiona asignaciones"
  ON public.asignacion_paradocente FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.rol = 'ADMIN'
    )
  );

-- 2. Tabla consolidados_enviados
CREATE TABLE IF NOT EXISTS public.consolidados_enviados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_paradocente UUID NOT NULL,
  id_establecimiento UUID NOT NULL,
  fecha DATE NOT NULL,
  cursos_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  enviado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  observaciones TEXT
);

CREATE INDEX IF NOT EXISTS idx_consolidados_paradocente
  ON public.consolidados_enviados(id_paradocente, fecha DESC);

CREATE INDEX IF NOT EXISTS idx_consolidados_establecimiento
  ON public.consolidados_enviados(id_establecimiento, fecha DESC);

ALTER TABLE public.consolidados_enviados ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Paradocente ve sus consolidados" ON public.consolidados_enviados;
CREATE POLICY "Paradocente ve sus consolidados"
  ON public.consolidados_enviados FOR SELECT
  USING (auth.uid()::text = id_paradocente::text);

DROP POLICY IF EXISTS "Inspectora ve todos los consolidados" ON public.consolidados_enviados;
CREATE POLICY "Inspectora ve todos los consolidados"
  ON public.consolidados_enviados FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.rol IN ('ADMIN', 'INSPECTOR')
    )
  );

DROP POLICY IF EXISTS "Paradocente crea consolidados" ON public.consolidados_enviados;
CREATE POLICY "Paradocente crea consolidados"
  ON public.consolidados_enviados FOR INSERT
  WITH CHECK (auth.uid()::text = id_paradocente::text);

-- 3. Agregar columna tipo a pases (solicitudes)
ALTER TABLE public.solicitudes ADD COLUMN IF NOT EXISTS tipo_pase TEXT;

COMMENT ON COLUMN public.solicitudes.tipo_pase IS 'Tipo extendido de pase: atraso, inasistencia, salida_pedagogica, acto, desfile, salida_medica, dental, otro';
