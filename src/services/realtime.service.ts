import { supabase } from '../lib/supabase';
import type { Solicitud } from '../types';

/** Suscribe a cambios en la tabla `solicitudes` (todos los eventos) */
function escucharSolicitudes(
  idEstablecimiento: string,
  callback: (solicitudes: Solicitud[]) => void
): () => void {
  try {
    const subscription = supabase
      .channel(`solicitudes:${idEstablecimiento}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'solicitudes',
          filter: `id_establecimiento=eq.${idEstablecimiento}`,
        },
        async () => {
          const { data } = await supabase
            .from('solicitudes')
            .select('*')
            .eq('id_establecimiento', idEstablecimiento)
            .eq('activo', true);

          callback((data || []) as Solicitud[]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  } catch (error) {
    console.error('Error al configurar listener:', error);
    return () => {};
  }
}

export { escucharSolicitudes as escucharSolicitudesInjustificadas };
export { escucharSolicitudes as escucharSolicitudesJustificadas };
