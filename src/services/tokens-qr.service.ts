import { supabase } from '../lib/supabase';
import type { TokenQR } from '../types';

export async function obtenerTokenQR(idToken: string): Promise<TokenQR | null> {
  try {
    const { data, error } = await supabase
      .from('tokens_qr')
      .select('*')
      .eq('id', idToken)
      .single();

    if (error && error.code === 'PGRST116') return null;
    if (error) throw error;
    return data as TokenQR;
  } catch (error) {
    console.error('Error al obtener token QR:', error);
    throw error;
  }
}

export async function crearTokenQR(token: TokenQR): Promise<void> {
  try {
    const { error } = await supabase
      .from('tokens_qr')
      .insert([token]);

    if (error) throw error;
  } catch (error) {
    console.error('Error al crear token QR:', error);
    throw error;
  }
}

export async function actualizarTokenQR(
  idToken: string,
  datos: Partial<TokenQR>
): Promise<void> {
  try {
    const { error } = await supabase
      .from('tokens_qr')
      .update(datos)
      .eq('id', idToken);

    if (error) throw error;
  } catch (error) {
    console.error('Error al actualizar token QR:', error);
    throw error;
  }
}
