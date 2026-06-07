import { supabase } from '../lib/supabase';
import type { MotivoJustificacion } from '../types';

export async function obtenerMotivosDelEstablecimiento(
  idEstablecimiento: string
): Promise<MotivoJustificacion[]> {
  try {
    const { data, error } = await supabase
      .from('motivos_justificacion')
      .select('*')
      .eq('id_establecimiento', idEstablecimiento)
      .eq('activo', true)
      .order('orden', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error al obtener motivos:', error);
    return [];
  }
}

export async function crearMotivo(motivo: MotivoJustificacion): Promise<void> {
  try {
    const { error } = await supabase
      .from('motivos_justificacion')
      .insert([motivo]);

    if (error) throw error;
  } catch (error) {
    console.error('Error al crear motivo:', error);
    throw error;
  }
}

export async function crearMotivoJustificacion(motivo: MotivoJustificacion): Promise<void> {
  try {
    const { error } = await supabase
      .from('motivos_justificacion')
      .insert([{
        ...motivo,
        creado_en: new Date().toISOString(),
      }]);

    if (error) throw error;
  } catch (error) {
    console.error('Error al crear motivo:', error);
    throw error;
  }
}

export async function actualizarMotivoJustificacion(
  id: string,
  datos: Partial<MotivoJustificacion>
): Promise<void> {
  try {
    const { error } = await supabase
      .from('motivos_justificacion')
      .update({
        ...datos,
        actualizado_en: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error al actualizar motivo:', error);
    throw error;
  }
}

export async function eliminarMotivoJustificacion(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('motivos_justificacion')
      .update({
        activo: false,
        actualizado_en: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error al eliminar motivo:', error);
    throw error;
  }
}
