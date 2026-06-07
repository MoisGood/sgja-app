import { supabase } from '../lib/supabase';

export async function guardarRegistroBloqueProfesor(
  idProfesor: string,
  idEstablecimiento: string,
  idBloque: string,
  numeroBloque: number,
  nombreBloque: string,
  horaRegistrada: string,
  horaInicio: string,
  horaFin: string,
  curso: string
): Promise<string> {
  try {
    const fecha = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('registros_bloque_profesor')
      .insert([{
        id_profesor: idProfesor,
        id_establecimiento: idEstablecimiento,
        id_bloque: idBloque,
        numero_bloque: numeroBloque,
        nombre_bloque: nombreBloque,
        hora_registrada: horaRegistrada,
        hora_inicio_bloque: horaInicio,
        hora_fin_bloque: horaFin,
        curso,
        fecha,
        creado_en: new Date().toISOString(),
      }])
      .select();

    if (error) throw error;
    return data?.[0]?.id || '';
  } catch (error) {
    console.error('Error al guardar registro de bloque:', error);
    throw error;
  }
}

export async function obtenerRegistrosBloqueProfesor(
  idProfesor: string,
  idEstablecimiento: string,
  fecha?: string
): Promise<(Record<string, unknown> & { id_registro: string })[]> {
  try {
    const fechaQuery = fecha || new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('registros_bloque_profesor')
      .select('*')
      .eq('id_profesor', idProfesor)
      .eq('id_establecimiento', idEstablecimiento)
      .eq('fecha', fechaQuery);

    if (error) throw error;

    return (data || []).map(doc => ({
      ...doc,
      id_registro: doc.id,
    }));
  } catch (error) {
    console.error('Error al obtener registros de bloque:', error);
    throw error;
  }
}
