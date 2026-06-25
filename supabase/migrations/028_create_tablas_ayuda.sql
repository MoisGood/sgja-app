CREATE TABLE IF NOT EXISTS public.ayuda_faq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rol TEXT[] NOT NULL,
  modulo TEXT NOT NULL DEFAULT 'general',
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

CREATE TABLE IF NOT EXISTS public.ayuda_logs_errores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID,
  tipo_error TEXT NOT NULL CHECK (tipo_error IN ('sistema','equipo','internet','usuario')),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  contexto JSONB DEFAULT '{}',
  resuelto BOOLEAN NOT NULL DEFAULT false,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ayuda_logs_tipo ON public.ayuda_logs_errores(tipo_error, creado_en);
CREATE INDEX IF NOT EXISTS idx_ayuda_logs_usuario ON public.ayuda_logs_errores(usuario_id, resuelto, creado_en);

CREATE TABLE IF NOT EXISTS public.ayuda_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  estado TEXT NOT NULL DEFAULT 'abierto' CHECK (estado IN ('abierto','en_progreso','resuelto','cerrado')),
  prioridad TEXT NOT NULL DEFAULT 'media' CHECK (prioridad IN ('baja','media','alta','critica')),
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ayuda_tickets_usuario ON public.ayuda_tickets(usuario_id, estado);
CREATE INDEX IF NOT EXISTS idx_ayuda_tickets_estado ON public.ayuda_tickets(estado, creado_en);

CREATE TABLE IF NOT EXISTS public.ayuda_catalogo_errores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria TEXT NOT NULL DEFAULT 'General',
  titulo TEXT NOT NULL,
  descripcion TEXT,
  solucion TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ayuda_catalogo_categoria ON public.ayuda_catalogo_errores(categoria, activo);

ALTER TABLE public.ayuda_faq ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ayuda_tutoriales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ayuda_tutorial_pasos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ayuda_progreso_tutorial ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ayuda_logs_errores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ayuda_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ayuda_catalogo_errores ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ayuda_faq' AND policyname = 'Todos pueden leer FAQ') THEN
    CREATE POLICY "Todos pueden leer FAQ" ON public.ayuda_faq FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ayuda_tutoriales' AND policyname = 'Todos pueden leer tutoriales') THEN
    CREATE POLICY "Todos pueden leer tutoriales" ON public.ayuda_tutoriales FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ayuda_tutorial_pasos' AND policyname = 'Todos pueden leer pasos') THEN
    CREATE POLICY "Todos pueden leer pasos" ON public.ayuda_tutorial_pasos FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ayuda_progreso_tutorial' AND policyname = 'Usuarios ven su progreso') THEN
    CREATE POLICY "Usuarios ven su progreso" ON public.ayuda_progreso_tutorial FOR SELECT USING (auth.uid()::text = usuario_id::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ayuda_progreso_tutorial' AND policyname = 'Usuarios insertan su progreso') THEN
    CREATE POLICY "Usuarios insertan su progreso" ON public.ayuda_progreso_tutorial FOR INSERT WITH CHECK (auth.uid()::text = usuario_id::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ayuda_progreso_tutorial' AND policyname = 'Usuarios actualizan su progreso') THEN
    CREATE POLICY "Usuarios actualizan su progreso" ON public.ayuda_progreso_tutorial FOR UPDATE USING (auth.uid()::text = usuario_id::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ayuda_logs_errores' AND policyname = 'Usuarios insertan logs') THEN
    CREATE POLICY "Usuarios insertan logs" ON public.ayuda_logs_errores FOR INSERT WITH CHECK (auth.uid()::text = usuario_id::text OR usuario_id IS NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ayuda_tickets' AND policyname = 'Usuarios crean sus tickets') THEN
    CREATE POLICY "Usuarios crean sus tickets" ON public.ayuda_tickets FOR INSERT WITH CHECK (auth.uid()::text = usuario_id::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ayuda_tickets' AND policyname = 'Usuarios ven sus tickets') THEN
    CREATE POLICY "Usuarios ven sus tickets" ON public.ayuda_tickets FOR SELECT USING (auth.uid()::text = usuario_id::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ayuda_catalogo_errores' AND policyname = 'Todos pueden leer catalogo errores') THEN
    CREATE POLICY "Todos pueden leer catalogo errores" ON public.ayuda_catalogo_errores FOR SELECT USING (true);
  END IF;
END $$;
