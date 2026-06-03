// ============================================================
// SGJA – Helper para TipoRegistro
// src/utils/tipoRegistroHelper.ts
// ============================================================

import type { TipoRegistro } from '../types';

/**
 * Determina si un tipo de registro es un ATRASO
 */
export const esAtraso = (tipo: TipoRegistro | undefined): boolean => {
  return tipo === 'ATRASO';
};

/**
 * Determina si un tipo de registro es una INASISTENCIA
 */
export const esInasistencia = (tipo: TipoRegistro | undefined): boolean => {
  return tipo === 'INASISTENCIA';
};

/**
 * Obtiene etiqueta humanizada del tipo de registro
 */
export const getEtiquetaTipo = (tipo: TipoRegistro | undefined): string => {
  const labels: Record<TipoRegistro, string> = {
    'ATRASO': '🕐 Atraso',
    'INASISTENCIA': '❌ Inasistencia',
  };
  return tipo ? labels[tipo] || 'Tipo desconocido' : 'Tipo desconocido';
};

/**
 * Obtiene categoría padre (ATRASO o INASISTENCIA)
 */
export const getCategoriaPadre = (tipo: TipoRegistro | undefined): 'ATRASO' | 'INASISTENCIA' => {
  if (tipo && esAtraso(tipo)) return 'ATRASO';
  return 'INASISTENCIA';
};

/**
 * Obtiene emoji del tipo
 */
export const getEmojiTipo = (tipo: TipoRegistro | undefined): string => {
  return tipo && esAtraso(tipo) ? '🕐' : '❌';
};

/**
 * Obtiene label simple (ATRASO o INASISTENCIA)
 */
export const getLabelSimple = (tipo: TipoRegistro | undefined): string => {
  return tipo && esAtraso(tipo) ? 'Atraso' : 'Inasistencia';
};
