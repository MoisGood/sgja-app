-- Migration: 043_create_matriculas
-- Descripción: Tabla para el registro de matrículas de nuevos estudiantes
-- Modelo: columnas clave consultables + JSONB con el formulario completo

CREATE TABLE IF NOT EXISTS public.matriculas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_establecimiento UUID NOT NULL,
  id_funcionario UUID,

  -- Columnas clave (consultables / indexables)
  rut TEXT,
  nombre_completo TEXT,
  nivel TEXT,
  curso TEXT,
  fecha_nacimiento DATE,
  estado TEXT NOT NULL DEFAULT 'completada',

  -- Formulario completo (flexible)
  datos JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Metadata
  activo BOOLEAN NOT NULL DEFAULT true,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Índices
CREATE INDEX IF NOT EXISTS idx_matriculas_establecimiento
  ON public.matriculas(id_establecimiento, creado_en DESC);

CREATE INDEX IF NOT EXISTS idx_matriculas_rut
  ON public.matriculas(rut);

-- 3. RLS
ALTER TABLE public.matriculas ENABLE ROW LEVEL SECURITY;

-- Usuarios autenticados pueden insertar
DROP POLICY IF EXISTS "Autenticados insertan matriculas" ON public.matriculas;
CREATE POLICY "Autenticados insertan matriculas"
  ON public.matriculas
  FOR INSERT
  WITH CHECK (auth.uid()::text IS NOT NULL);

-- Usuarios autenticados pueden leer
DROP POLICY IF EXISTS "Autenticados leen matriculas" ON public.matriculas;
CREATE POLICY "Autenticados leen matriculas"
  ON public.matriculas
  FOR SELECT
  USING (auth.uid()::text IS NOT NULL);

-- Solo el creador puede actualizar
DROP POLICY IF EXISTS "Creador actualiza matriculas" ON public.matriculas;
CREATE POLICY "Creador actualiza matriculas"
  ON public.matriculas
  FOR UPDATE
  USING (auth.uid()::text = id_funcionario::text);
