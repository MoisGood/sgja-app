-- Migration: 044_matriculas_tipo_y_retiros
-- Descripción: columna `tipo` en matriculas (nueva | continuidad) + tabla retiros_estudiantes
-- Idempotente: re-ejecutable sin errores.

-- 1. Columna tipo en matriculas
ALTER TABLE public.matriculas ADD COLUMN IF NOT EXISTS tipo TEXT NOT NULL DEFAULT 'nueva';

CREATE INDEX IF NOT EXISTS idx_matriculas_tipo
  ON public.matriculas(tipo);

CREATE INDEX IF NOT EXISTS idx_matriculas_creado_en
  ON public.matriculas(creado_en DESC);

-- 2. Tabla retiros_estudiantes
CREATE TABLE IF NOT EXISTS public.retiros_estudiantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_establecimiento UUID NOT NULL,
  id_funcionario UUID,

  rut TEXT,
  nombre_completo TEXT,
  nivel TEXT,
  curso TEXT,
  fecha_retiro DATE,
  motivo TEXT,

  datos JSONB NOT NULL DEFAULT '{}'::jsonb,

  activo BOOLEAN NOT NULL DEFAULT true,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_retiros_establecimiento
  ON public.retiros_estudiantes(id_establecimiento, creado_en DESC);

CREATE INDEX IF NOT EXISTS idx_retiros_rut
  ON public.retiros_estudiantes(rut);

CREATE INDEX IF NOT EXISTS idx_retiros_fecha
  ON public.retiros_estudiantes(fecha_retiro);

-- 3. RLS retiros_estudiantes
ALTER TABLE public.retiros_estudiantes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Autenticados insertan retiros" ON public.retiros_estudiantes;
CREATE POLICY "Autenticados insertan retiros"
  ON public.retiros_estudiantes
  FOR INSERT
  WITH CHECK (auth.uid()::text IS NOT NULL);

DROP POLICY IF EXISTS "Autenticados leen retiros" ON public.retiros_estudiantes;
CREATE POLICY "Autenticados leen retiros"
  ON public.retiros_estudiantes
  FOR SELECT
  USING (auth.uid()::text IS NOT NULL);

DROP POLICY IF EXISTS "Creador actualiza retiros" ON public.retiros_estudiantes;
CREATE POLICY "Creador actualiza retiros"
  ON public.retiros_estudiantes
  FOR UPDATE
  USING (auth.uid()::text = id_funcionario::text);
