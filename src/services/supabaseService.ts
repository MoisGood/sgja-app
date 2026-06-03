// ============================================================
// SGJA – Servicio de Acceso a Supabase
// src/services/supabaseService.ts
// ============================================================

import { supabase } from '../lib/supabase';
import { Rol } from '../types';

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  apellidos: string | null;
  rol: Rol;
  id_establecimiento: string;
  activo: boolean;
  foto_url: string | null;
}

export async function getUsuarioByEmail(email: string): Promise<Usuario | null> {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        return null;
      }
      throw error;
    }

    return data as Usuario;
  } catch (error) {
    console.error('Error getting usuario by email:', error);
    throw error;
  }
}

export async function getUsuarioById(id: string): Promise<Usuario | null> {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data as Usuario;
  } catch (error) {
    console.error('Error getting usuario by id:', error);
    throw error;
  }
}

export async function getEstudiantes(idEstablecimiento: string) {
  try {
    const { data, error } = await supabase
      .from('estudiantes')
      .select('*')
      .eq('id_establecimiento', idEstablecimiento);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting estudiantes:', error);
    return [];
  }
}

export async function getJustificados(idEstablecimiento: string, filtro?: { curso_id?: string; estado?: string }) {
  try {
    let query = supabase
      .from('justificados')
      .select('*')
      .eq('id_establecimiento', idEstablecimiento);

    if (filtro?.curso_id) {
      query = query.eq('id_curso', filtro.curso_id);
    }
    if (filtro?.estado) {
      query = query.eq('estado', filtro.estado);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting justificados:', error);
    return [];
  }
}

export async function getInjustificados(idEstablecimiento: string) {
  try {
    const { data, error } = await supabase
      .from('injustificados')
      .select('*')
      .eq('id_establecimiento', idEstablecimiento);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting injustificados:', error);
    return [];
  }
}

export async function createJustificado(justificado: any) {
  try {
    const { data, error } = await supabase
      .from('justificados')
      .insert([justificado])
      .select();

    if (error) throw error;
    return data?.[0] || null;
  } catch (error) {
    console.error('Error creating justificado:', error);
    throw error;
  }
}

export async function updateJustificado(id: string, updates: any) {
  try {
    const { data, error } = await supabase
      .from('justificados')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;
    return data?.[0] || null;
  } catch (error) {
    console.error('Error updating justificado:', error);
    throw error;
  }
}

export async function getUsuarios(idEstablecimiento: string) {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id_establecimiento', idEstablecimiento);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting usuarios:', error);
    return [];
  }
}

export async function getCursos(idEstablecimiento: string) {
  try {
    const { data, error } = await supabase
      .from('cursos')
      .select('*')
      .eq('id_establecimiento', idEstablecimiento);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting cursos:', error);
    return [];
  }
}

export async function getMotivosJustificacion() {
  try {
    const { data, error } = await supabase
      .from('motivos_justificacion')
      .select('*');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting motivos:', error);
    return [];
  }
}

export async function getBloques(idEstablecimiento: string) {
  try {
    const { data, error } = await supabase
      .from('bloques_horarios')
      .select('*')
      .eq('id_establecimiento', idEstablecimiento);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting bloques:', error);
    return [];
  }
}

export async function getEstablecimiento(id: string) {
  try {
    const { data, error } = await supabase
      .from('establecimientos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data || null;
  } catch (error) {
    console.error('Error getting establecimiento:', error);
    return null;
  }
}
