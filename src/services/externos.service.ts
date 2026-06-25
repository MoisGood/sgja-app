import { supabase } from '../lib/supabase';

export interface DominioExterno {
  id: string;
  id_establecimiento: string;
  dominio: string;
  activo: boolean;
  created_at: string;
}

export interface ExcepcionExterna {
  id: string;
  id_establecimiento: string;
  email: string;
  rol: string;
  activo: boolean;
  created_at: string;
}

export interface TokenAcceso {
  id: string;
  id_establecimiento: string;
  token: string;
  email_destino?: string;
  creado_por?: string;
  expires_at: string;
  usado: boolean;
  created_at: string;
}

export async function obtenerDominios(idEstablecimiento: string): Promise<DominioExterno[]> {
  const { data } = await supabase
    .from('dominios_externos')
    .select('*')
    .eq('id_establecimiento', idEstablecimiento)
    .order('dominio');
  return data || [];
}

export async function guardarDominio(idEstablecimiento: string, dominio: string, id?: string): Promise<string | null> {
  if (id) {
    const { error } = await supabase.from('dominios_externos').update({ dominio }).eq('id', id);
    return error ? error.message : null;
  }
  const { error } = await supabase.from('dominios_externos').insert({
    id_establecimiento: idEstablecimiento,
    dominio: dominio.toLowerCase().replace(/^@/, ''),
  });
  return error ? error.message : null;
}

export async function toggleDominio(id: string, activo: boolean): Promise<string | null> {
  const { error } = await supabase.from('dominios_externos').update({ activo }).eq('id', id);
  return error ? error.message : null;
}

export async function eliminarDominio(id: string): Promise<string | null> {
  const { error } = await supabase.from('dominios_externos').delete().eq('id', id);
  return error ? error.message : null;
}

export async function obtenerExcepciones(idEstablecimiento: string): Promise<ExcepcionExterna[]> {
  const { data } = await supabase
    .from('excepciones_externas')
    .select('*')
    .eq('id_establecimiento', idEstablecimiento)
    .order('email');
  return data || [];
}

export async function guardarExcepcion(
  idEstablecimiento: string, email: string, rol: string, id?: string
): Promise<string | null> {
  const payload = {
    id_establecimiento: idEstablecimiento,
    email: email.toLowerCase().trim(),
    rol,
  };
  if (id) {
    const { error } = await supabase.from('excepciones_externas').update(payload).eq('id', id);
    return error ? error.message : null;
  }
  const { error } = await supabase.from('excepciones_externas').insert(payload);
  return error ? error.message : null;
}

export async function eliminarExcepcion(id: string): Promise<string | null> {
  const { error } = await supabase.from('excepciones_externas').delete().eq('id', id);
  return error ? error.message : null;
}

export async function generarToken(
  idEstablecimiento: string,
  creadoPor: string,
  emailDestino?: string,
  horas: number = 24
): Promise<{ token?: string; error?: string }> {
  const token = crypto.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now().toString(36);
  const expiresAt = new Date(Date.now() + horas * 60 * 60 * 1000).toISOString();

  const { error } = await supabase.from('tokens_acceso_externo').insert({
    id_establecimiento: idEstablecimiento,
    token,
    email_destino: emailDestino || null,
    creado_por: creadoPor,
    expires_at: expiresAt,
  });

  if (error) return { error: error.message };
  return { token };
}

export async function obtenerTokens(idEstablecimiento: string): Promise<TokenAcceso[]> {
  const { data } = await supabase
    .from('tokens_acceso_externo')
    .select('*')
    .eq('id_establecimiento', idEstablecimiento)
    .order('created_at', { ascending: false });
  return data || [];
}

export function generarLinkAutenticacion(token: string): string {
  const base = import.meta.env.VITE_APP_URL || window.location.origin;
  return `${base}/?token_externo=${token}`;
}
