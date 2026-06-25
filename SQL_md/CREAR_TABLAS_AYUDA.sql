-- ====================================================
-- CREAR MÓDULO DE AYUDA - TABLAS COMPLETAS
-- Copia y pega esto en el SQL Editor de Supabase
-- ====================================================

-- 1. FAQ y Documentación
CREATE TABLE IF NOT EXISTS public.ayuda_faq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rol TEXT[] NOT NULL,
  modulo TEXT NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'General',
  titulo TEXT NOT NULL,
  contenido TEXT NOT NULL,
  orden INTEGER NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT true,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ayuda_faq_rol_modulo ON public.ayuda_faq(rol, modulo, activo);
CREATE INDEX IF NOT EXISTS idx_ayuda_faq_categoria ON public.ayuda_faq(categoria, activo);

-- 2. Tutoriales
CREATE TABLE IF NOT EXISTS public.ayuda_tutoriales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rol TEXT[] NOT NULL,
  modulo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Pasos de Tutoriales
CREATE TABLE IF NOT EXISTS public.ayuda_tutorial_pasos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutorial_id UUID NOT NULL REFERENCES public.ayuda_tutoriales(id) ON DELETE CASCADE,
  paso_numero INTEGER NOT NULL,
  instruccion TEXT NOT NULL,
  elemento_selector JSONB,
  tipo_resaltado TEXT NOT NULL DEFAULT 'dimmed_overlay',
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tutorial_id, paso_numero)
);

-- 4. Progreso de Tutoriales por Usuario
CREATE TABLE IF NOT EXISTS public.ayuda_progreso_tutorial (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL,
  tutorial_id UUID NOT NULL REFERENCES public.ayuda_tutoriales(id) ON DELETE CASCADE,
  pasos_completados INTEGER[] NOT NULL DEFAULT '{}',
  completado BOOLEAN NOT NULL DEFAULT false,
  ultima_actualizacion TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(usuario_id, tutorial_id)
);

CREATE INDEX IF NOT EXISTS idx_ayuda_progreso_usuario ON public.ayuda_progreso_tutorial(usuario_id, completado);

-- 5. Logs de Errores
CREATE TABLE IF NOT EXISTS public.ayuda_logs_errores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID,
  tipo_error TEXT NOT NULL CHECK (tipo_error IN ('sistema', 'equipo', 'internet', 'usuario')),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  contexto JSONB DEFAULT '{}',
  resuelto BOOLEAN NOT NULL DEFAULT false,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ayuda_logs_tipo ON public.ayuda_logs_errores(tipo_error, creado_en);
CREATE INDEX IF NOT EXISTS idx_ayuda_logs_usuario ON public.ayuda_logs_errores(usuario_id, resuelto, creado_en);

-- ====================================================
-- DATOS DE EJEMPLO
-- ====================================================

INSERT INTO public.ayuda_faq (rol, modulo, categoria, titulo, contenido, orden) VALUES
  ('{PROFESOR,INSPECTOR,ESTUDIANTE}', 'general', 'General', '¿Cómo usar este sistema?',
   'Bienvenido al SGJA. Puedes navegar usando el menú lateral izquierdo y acceder a cada módulo según tu rol.',
   1),
  ('{PROFESOR,INSPECTOR}', 'justificaciones', 'Registro', '¿Cómo registro una justificación?',
   'Ve al menú Justificaciones > Registrar. Selecciona el curso y los estudiantes ausentes, luego elige el motivo y guarda.',
   2),
  ('{ESTUDIANTE}', 'general', 'Mi cuenta', '¿Dónde veo mi información?',
   'Tu información personal está disponible en la sección de ajustes de tu perfil.',
   3);

INSERT INTO public.ayuda_tutoriales (rol, modulo, titulo, descripcion) VALUES
  ('{PROFESOR,INSPECTOR}', 'justificaciones', 'Registrar una ausencia',
   'Aprende a registrar una ausencia paso a paso');

-- ====================================================
-- HABILITAR RLS (opcional - para seguridad)
-- ====================================================

ALTER TABLE public.ayuda_faq ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ayuda_tutoriales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ayuda_tutorial_pasos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ayuda_progreso_tutorial ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ayuda_logs_errores ENABLE ROW LEVEL SECURITY;

-- Políticas: todos pueden leer FAQ, tutoriales y pasos
CREATE POLICY "Todos pueden leer FAQ" ON public.ayuda_faq FOR SELECT USING (true);
CREATE POLICY "Todos pueden leer tutoriales" ON public.ayuda_tutoriales FOR SELECT USING (true);
CREATE POLICY "Todos pueden leer pasos" ON public.ayuda_tutorial_pasos FOR SELECT USING (true);

-- Progreso: cada usuario solo ve y modifica su propio progreso
CREATE POLICY "Usuarios ven su progreso" ON public.ayuda_progreso_tutorial
  FOR SELECT USING (auth.uid()::text = usuario_id::text);
CREATE POLICY "Usuarios insertan su progreso" ON public.ayuda_progreso_tutorial
  FOR INSERT WITH CHECK (auth.uid()::text = usuario_id::text);
CREATE POLICY "Usuarios actualizan su progreso" ON public.ayuda_progreso_tutorial
  FOR UPDATE USING (auth.uid()::text = usuario_id::text);

-- Logs: cualquier usuario autenticado puede insertar logs
CREATE POLICY "Usuarios insertan logs" ON public.ayuda_logs_errores
  FOR INSERT WITH CHECK (auth.uid()::text = usuario_id::text OR usuario_id IS NULL);
