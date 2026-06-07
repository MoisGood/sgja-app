import { supabase } from '../lib/supabase';
import type { Solicitud } from '../types';

export async function obtenerCursosDelEstablecimiento(
  idEstablecimiento: string
): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('estudiantes')
      .select('curso')
      .eq('id_establecimiento', idEstablecimiento)
      .eq('activo', true);

    if (error) throw error;

    const cursosSet = new Set<string>();
    data?.forEach(record => {
      if (record.curso) cursosSet.add(record.curso);
    });

    const cursos = Array.from(cursosSet).sort((a, b) => {
      const matchA = a.match(/(\d+)([A-Z])/);
      const matchB = b.match(/(\d+)([A-Z])/);

      if (!matchA || !matchB) return a.localeCompare(b);

      const numA = parseInt(matchA[1]);
      const numB = parseInt(matchB[1]);

      if (numA !== numB) return numA - numB;

      return matchA[2].localeCompare(matchB[2]);
    });

    return cursos;
  } catch (error) {
    console.error('❌ Error al obtener cursos:', error);
    return [];
  }
}

export async function obtenerUltimasSolicitudes(
  idEstablecimiento: string,
  cantidad: number = 10
): Promise<Solicitud[]> {
  try {
    const [{ data: justificadas, error: error1 }, { data: injustificadas, error: error2 }] = await Promise.all([
      supabase.from('justificadas').select('*').eq('id_establecimiento', idEstablecimiento).limit(cantidad),
      supabase.from('injustificadas').select('*').eq('id_establecimiento', idEstablecimiento).limit(cantidad),
    ]);

    if (error1) throw error1;
    if (error2) throw error2;

    const solicitudes = [...(justificadas || []), ...(injustificadas || [])];
    solicitudes.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    return solicitudes.slice(0, cantidad) as Solicitud[];
  } catch (error) {
    console.error('Error al obtener últimas solicitudes:', error);
    throw error;
  }
}
