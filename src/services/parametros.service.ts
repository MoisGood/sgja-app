import { supabase } from '../lib/supabase';

export interface Parametros {
  id_parametros: string;
  id_establecimiento: string;
  tiempo_inactividad_minutos: number;
}

export async function obtenerParametrosDelEstablecimiento(
  idEstablecimiento: string
): Promise<Parametros | null> {
  try {
    const { data, error } = await supabase
      .from('parametros')
      .select('*')
      .eq('id_establecimiento', idEstablecimiento)
      .single();

    if (error && error.code === 'PGRST116') return null;
    if (error) throw error;
    return data as Parametros;
  } catch (error) {
    console.error('Error al obtener parámetros:', error);
    throw error;
  }
}

export async function crearParametros(
  idEstablecimiento: string,
  tiempoInactividadMinutos: number = 30
): Promise<Parametros> {
  try {
    const nuevoParametro: Parametros = {
      id_parametros: `${idEstablecimiento}_parametros`,
      id_establecimiento: idEstablecimiento,
      tiempo_inactividad_minutos: tiempoInactividadMinutos,
    };

    const { error } = await supabase
      .from('parametros')
      .insert([nuevoParametro]);

    if (error) throw error;
    return nuevoParametro;
  } catch (error) {
    console.error('Error al crear parámetros:', error);
    throw error;
  }
}

export async function actualizarParametros(
  idEstablecimiento: string,
  tiempoInactividadMinutos: number
): Promise<void> {
  try {
    const { error } = await supabase
      .from('parametros')
      .update({ tiempo_inactividad_minutos: tiempoInactividadMinutos })
      .eq('id_establecimiento', idEstablecimiento);

    if (error) throw error;
  } catch (error) {
    console.error('Error al actualizar parámetros:', error);
    throw error;
  }
}
