import { supabase } from '../lib/supabase';
import type { Solicitud } from '../types';

export function escucharSolicitudesInjustificadas(
  idEstablecimiento: string,
  callback: (solicitudes: Solicitud[]) => void
): () => void {
  try {
    const subscription = supabase
      .channel(`injustificadas:${idEstablecimiento}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'injustificadas',
          filter: `id_establecimiento=eq.${idEstablecimiento}`,
        },
        async () => {
          const { data } = await supabase
            .from('injustificadas')
            .select('*')
            .eq('id_establecimiento', idEstablecimiento);

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

export function escucharSolicitudesJustificadas(
  idEstablecimiento: string,
  callback: (solicitudes: Solicitud[]) => void
): () => void {
  try {
    const subscription = supabase
      .channel(`justificadas:${idEstablecimiento}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'justificadas',
          filter: `id_establecimiento=eq.${idEstablecimiento}`,
        },
        async () => {
          const { data } = await supabase
            .from('justificadas')
            .select('*')
            .eq('id_establecimiento', idEstablecimiento);

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
