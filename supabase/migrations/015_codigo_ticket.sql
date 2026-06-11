ALTER TABLE public.lugares ADD COLUMN IF NOT EXISTS abreviatura text;
ALTER TABLE public.requerimientos ADD COLUMN IF NOT EXISTS codigo text;

UPDATE public.lugares SET abreviatura = UPPER(LEFT(nombre, 3)) WHERE abreviatura IS NULL;
