import { supabase } from '../lib/supabase';
import { cacheService } from './cacheService';
import type { BloqueHorario } from '../types';

async function obtenerConCache<T>(
  cacheKey: string,
  ttlMinutos: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  const cached = await cacheService.get<T>(cacheKey);
  if (cached) {
    return cached;
  }

  const data = await fetchFn();
  await cacheService.set(cacheKey, data, ttlMinutos);

  return data;
}

export async function obtenerBloquesHorarios(idEstablecimiento: string): Promise<BloqueHorario[]> {
  return obtenerConCache(
    `bloques_${idEstablecimiento}`,
    60,
    async () => {
      try {
        const { data, error } = await supabase
          .from('bloques_horarios')
          .select('*')
          .eq('id_establecimiento', idEstablecimiento)
          .eq('activo', true)
          .order('orden', { ascending: true });

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('Error al obtener bloques horarios:', error);
        throw error;
      }
    }
  );
}

export async function crearBloqueHorario(
  idEstablecimiento: string,
  nombreBloque: string,
  horaInicio: string,
  horaFin: string,
  tipo: 'clase' | 'recreo' | 'almuerzo' | 'otro',
  orden: number
): Promise<string> {
  try {
    const [horaI, minI] = horaInicio.split(':').map(Number);
    const [horaF, minF] = horaFin.split(':').map(Number);
    const duracionMinutos = (horaF * 60 + minF) - (horaI * 60 + minI);

    const bloque: BloqueHorario = {
      id_bloque: '',
      id_establecimiento: idEstablecimiento,
      numero_bloque: 0,
      nombre_bloque: nombreBloque,
      hora_inicio: horaInicio,
      hora_fin: horaFin,
      duracion_minutos: duracionMinutos,
      tipo,
      orden,
      activo: true,
      creado_en: new Date(),
      actualizado_en: new Date(),
    };

    const { data, error } = await supabase
      .from('bloques_horarios')
      .insert([bloque])
      .select();

    if (error) throw error;
    return data?.[0]?.id_bloque || '';
  } catch (error) {
    console.error('Error al crear bloque horario:', error);
    throw error;
  }
}

export async function actualizarBloqueHorario(
  idBloque: string,
  updates: Partial<BloqueHorario>
): Promise<void> {
  try {
    const { error } = await supabase
      .from('bloques_horarios')
      .update({
        ...updates,
        actualizado_en: new Date(),
      })
      .eq('id', idBloque);

    if (error) throw error;
  } catch (error) {
    console.error('Error al actualizar bloque horario:', error);
    throw error;
  }
}

export async function eliminarBloqueHorario(idBloque: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('bloques_horarios')
      .update({
        activo: false,
        actualizado_en: new Date(),
      })
      .eq('id', idBloque);

    if (error) throw error;
  } catch (error) {
    console.error('Error al eliminar bloque horario:', error);
    throw error;
  }
}
