// ============================================================
// Servicio de asignación de cursos a paradocente
// src/services/asignacionCursos.service.ts
// ============================================================

import { supabase } from '../lib/supabase';
import type { AsignacionParadocente } from '../types';

function handleError(error: unknown, contexto: string) {
  const msg = error instanceof Error ? error.message : String(error);
  console.error(`[${contexto}]`, msg);
}

/**
 * Obtiene todas las asignaciones de un establecimiento.
 */
export async function obtenerAsignaciones(
  idEstablecimiento: string
): Promise<AsignacionParadocente[]> {
  try {
    const { data, error } = await supabase
      .from('asignacion_paradocente')
      .select('*')
      .eq('id_establecimiento', idEstablecimiento)
      .order('creado_en', { ascending: false });

    if (error) throw error;
    return (data || []) as AsignacionParadocente[];
  } catch (error) {
    handleError(error, 'obtenerAsignaciones');
    return [];
  }
}

/**
 * Obtiene los cursos asignados a una paradocente específica.
 */
export async function obtenerCursosParadocente(
  idFuncionario: string
): Promise<{ nivel: string; curso: string }[]> {
  try {
    const { data, error } = await supabase
      .from('asignacion_paradocente')
      .select('nivel, curso')
      .eq('id_funcionario', idFuncionario);

    if (error) throw error;
    return (data || []) as { nivel: string; curso: string }[];
  } catch (error) {
    handleError(error, 'obtenerCursosParadocente');
    return [];
  }
}

/**
 * Asigna un curso a una paradocente.
 */
export async function asignarCurso(
  idFuncionario: string,
  idEstablecimiento: string,
  nivel: string,
  curso: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('asignacion_paradocente')
      .insert({
        id_funcionario: idFuncionario,
        id_establecimiento: idEstablecimiento,
        nivel,
        curso,
      });

    if (error) throw error;
    return true;
  } catch (error) {
    handleError(error, 'asignarCurso');
    return false;
  }
}

/**
 * Elimina una asignación de curso.
 */
export async function desasignarCurso(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('asignacion_paradocente')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    handleError(error, 'desasignarCurso');
    return false;
  }
}

/**
 * Verifica si un funcionario tiene un curso asignado.
 */
export async function estaAsignado(
  idFuncionario: string,
  nivel: string,
  curso: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('asignacion_paradocente')
      .select('id')
      .eq('id_funcionario', idFuncionario)
      .eq('nivel', nivel)
      .eq('curso', curso)
      .limit(1);

    if (error) throw error;
    return (data || []).length > 0;
  } catch (error) {
    handleError(error, 'estaAsignado');
    return false;
  }
}

/**
 * Elimina todas las asignaciones de un funcionario.
 */
export async function eliminarTodasAsFuncionario(idFuncionario: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('asignacion_paradocente')
      .delete()
      .eq('id_funcionario', idFuncionario);

    if (error) throw error;
    return true;
  } catch (error) {
    handleError(error, 'eliminarTodasAsFuncionario');
    return false;
  }
}
