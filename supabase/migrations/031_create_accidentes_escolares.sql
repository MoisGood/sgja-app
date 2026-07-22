-- Migration: 031_create_accidentes_escolares
-- Descripción: Tabla para formulario de constancia de accidente escolar

-- 1. Crear tabla
CREATE TABLE IF NOT EXISTS public.accidentes_escolares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_establecimiento UUID NOT NULL,
  id_estudiante UUID NOT NULL,
  id_funcionario UUID NOT NULL,

  -- Datos del accidente
  fecha_accidente DATE NOT NULL,
  hora_accidente TIME NOT NULL,
  lugar_accidente TEXT NOT NULL,
  descripcion_accidente TEXT,

  -- Naturaleza y consecuencia
  naturaleza_accidente TEXT,
  consecuencia_accidente TEXT,
  parte_cuerpo_afectada TEXT,
  tipo_lesion TEXT,

  -- Atención
  primeros_auxilios TEXT,
  testigos TEXT,

  -- Metadata
  activo BOOLEAN NOT NULL DEFAULT true,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Índices
CREATE INDEX IF NOT EXISTS idx_accidentes_estudiante
  ON public.accidentes_escolares(id_estudiante, fecha_accidente);

CREATE INDEX IF NOT EXISTS idx_accidentes_establecimiento
  ON public.accidentes_escolares(id_establecimiento, creado_en);

-- 3. RLS
ALTER TABLE public.accidentes_escolares ENABLE ROW LEVEL SECURITY;

-- Políticas: todos los usuarios autenticados pueden insertar
CREATE POLICY "Todos pueden insertar accidentes"
  ON public.accidentes_escolares
  FOR INSERT
  WITH CHECK (auth.uid()::text IS NOT NULL);

-- Políticas: todos pueden leer accidentes
CREATE POLICY "Todos pueden leer accidentes"
  ON public.accidentes_escolares
  FOR SELECT
  USING (true);

-- Políticas: solo el creador puede actualizar
CREATE POLICY "Creador puede actualizar accidentes"
  ON public.accidentes_escolares
  FOR UPDATE
  USING (auth.uid()::text = id_funcionario::text);
