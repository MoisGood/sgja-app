import { supabase } from '../lib/supabase';
import type { Solicitud } from '../types';

async function fetchSolicitudes(
  idEstablecimiento: string,
  callback: (solicitudes: Solicitud[]) => void
) {
  const { data } = await supabase
    .from('solicitudes')
    .select('*')
    .eq('id_establecimiento', idEstablecimiento)
    .eq('activo', true);

  callback((data || []) as Solicitud[]);
}

/** Suscribe a cambios en la tabla `solicitudes` (todos los eventos) */
function escucharSolicitudes(
  idEstablecimiento: string,
  callback: (solicitudes: Solicitud[]) => void
): () => void {
  try {
    fetchSolicitudes(idEstablecimiento, callback);

    const subscription = supabase
      .channel(`solicitudes:${idEstablecimiento}:${Date.now()}:${Math.random()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'solicitudes',
          filter: `id_establecimiento=eq.${idEstablecimiento}`,
        },
        async () => {
          fetchSolicitudes(idEstablecimiento, callback);
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
