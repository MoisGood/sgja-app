-- Agregar campo inventariable a configuracion_dispositivos
ALTER TABLE public.configuracion_dispositivos ADD COLUMN IF NOT EXISTS inventariable boolean DEFAULT true;

-- Actualizar dispositivos comunes no inventariables
UPDATE public.configuracion_dispositivos SET inventariable = false WHERE nombre IN ('Cable HDMI', 'Cable VGA', 'Internet Cable', 'Wifi', 'Con Audio', 'Sin Audio');
