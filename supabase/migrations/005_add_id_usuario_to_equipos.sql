ALTER TABLE public.equipos ADD COLUMN IF NOT EXISTS id_usuario uuid REFERENCES public.usuarios(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_equipos_usuario ON public.equipos (id_usuario);
