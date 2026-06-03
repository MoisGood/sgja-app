// ============================================================
// SGJA – Servicio de Documentos de Funcionarios
// src/services/funcionarioDocumentos.ts
// ============================================================

import { supabase } from '../lib/supabase';
import type { FuncionarioDocumento } from '../types';

export async function obtenerDocumentos(rut: string): Promise<FuncionarioDocumento[]> {
  const { data, error } = await supabase
    .from('funcionario_documentos')
    .select('*')
    .eq('rut_funcionario', rut)
    .order('subido_en', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function subirDocumento(
  rut: string,
  archivo: File,
  tipo: string
): Promise<string> {
  const fileName = `${rut}/${Date.now()}_${archivo.name}`;
  const { error: uploadError } = await supabase.storage
    .from('funcionario_documentos')
    .upload(fileName, archivo);
  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage
    .from('funcionario_documentos')
    .getPublicUrl(fileName);
  const url = urlData.publicUrl;

  const { error: insertError } = await supabase
    .from('funcionario_documentos')
    .insert({
      rut_funcionario: rut,
      nombre: archivo.name,
      tipo,
      url,
    });
  if (insertError) throw insertError;

  return url;
}

export async function eliminarDocumento(id: string, url: string): Promise<void> {
  const path = url.split('/').pop();
  if (path) {
    await supabase.storage.from('funcionario_documentos').remove([path]);
  }
  const { error } = await supabase
    .from('funcionario_documentos')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
