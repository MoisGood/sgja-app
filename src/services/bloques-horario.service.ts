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
  _tipo: 'clase' | 'recreo' | 'almuerzo' | 'otro',
  orden: number
): Promise<string> {
  try {
    const idBloque = `BLOQUE_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    const { data, error } = await supabase
      .from('bloques_horarios')
      .insert([{
        id_bloque: idBloque,
        id_establecimiento: idEstablecimiento,
        nombre_bloque: nombreBloque,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        orden,
        activo: true,
        creado_en: new Date(),
      }])
      .select();

    if (error) throw error;
    return data?.[0]?.id_bloque || idBloque;
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
        nombre_bloque: updates.nombre_bloque,
        hora_inicio: updates.hora_inicio,
        hora_fin: updates.hora_fin,
        orden: updates.orden,
        activo: updates.activo,
      })
      .eq('id_bloque', idBloque);

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
      })
      .eq('id_bloque', idBloque);

    if (error) throw error;
  } catch (error) {
    console.error('Error al eliminar bloque horario:', error);
    throw error;
  }
}
