// ============================================================
// Servicio de consolidados de inasistencias
// src/services/consolidados.service.ts
// ============================================================

import { supabase } from '../lib/supabase';
import type { ConsolidadoEnviado, CursoConsolidado } from '../types';

function handleError(error: unknown, contexto: string) {
  const msg = error instanceof Error ? error.message : String(error);
  console.error(`[${contexto}]`, msg);
}

/**
 * Envía un consolidado de inasistencias del día.
 */
export async function enviarConsolidado(
  idParadocente: string,
  idEstablecimiento: string,
  fecha: string,
  cursos: CursoConsolidado[],
  observaciones?: string
): Promise<ConsolidadoEnviado | null> {
  try {
    const { data, error } = await supabase
      .from('consolidados_enviados')
      .insert({
        id_paradocente: idParadocente,
        id_establecimiento: idEstablecimiento,
        fecha,
        cursos_json: cursos,
        observaciones: observaciones || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data as ConsolidadoEnviado;
  } catch (error) {
    handleError(error, 'enviarConsolidado');
    return null;
  }
}

/**
 * Obtiene consolidados de una paradocente específica.
 */
export async function obtenerConsolidadosParadocente(
  idParadocente: string,
  fecha?: string
): Promise<ConsolidadoEnviado[]> {
  try {
    let query = supabase
      .from('consolidados_enviados')
      .select('*')
      .eq('id_paradocente', idParadocente)
      .order('fecha', { ascending: false });

    if (fecha) {
      query = query.eq('fecha', fecha);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as ConsolidadoEnviado[];
  } catch (error) {
    handleError(error, 'obtenerConsolidadosParadocente');
    return [];
  }
}

/**
 * Obtiene todos los consolidados de un establecimiento (para inspectora).
 */
export async function obtenerConsolidadosEstablecimiento(
  idEstablecimiento: string,
  fecha?: string
): Promise<ConsolidadoEnviado[]> {
  try {
    let query = supabase
      .from('consolidados_enviados')
      .select('*')
      .eq('id_establecimiento', idEstablecimiento)
      .order('fecha', { ascending: false });

    if (fecha) {
      query = query.eq('fecha', fecha);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as ConsolidadoEnviado[];
  } catch (error) {
    handleError(error, 'obtenerConsolidadosEstablecimiento');
    return [];
  }
}

/**
 * Verifica si una paradocente ya envió consolidado hoy.
 */
export async function yaEnvioHoy(
  idParadocente: string,
  fecha: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('consolidados_enviados')
      .select('id')
      .eq('id_paradocente', idParadocente)
      .eq('fecha', fecha)
      .limit(1);

    if (error) throw error;
    return (data || []).length > 0;
  } catch (error) {
    handleError(error, 'yaEnvioHoy');
    return false;
  }
}
