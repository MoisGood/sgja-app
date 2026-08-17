// ============================================================
// Servicio de cola offline — Operaciones pendientes de sync
// src/services/offlineQueue.service.ts
//
// Guarda operaciones en IndexedDB cuando no hay Wi-Fi.
// Las sube al servidor cuando se restablece la conexión.
// ============================================================

import { v4 as uuidv4 } from 'uuid';
import {
  guardarRegistro,
  obtenerTodos,
  obtenerPorIndice,
  eliminarRegistro,
} from './localDb.service';

const TABLA = 'cola_sync';

export type TipoOperacion = 'asistencia' | 'retiro' | 'matricula' | 'consentimiento';
export type EstadoOperacion = 'pendiente' | 'sincronizando' | 'confirmado' | 'error';

export interface OperacionCola {
  id: string;
  tipo: TipoOperacion;
  datos: Record<string, unknown>;
  estado: EstadoOperacion;
  creado_en: string;
  intentos: number;
  ultimo_error: string | null;
  confirmado_en: string | null;
}

export interface ResultadoSync {
  exitosas: number;
  fallidas: number;
  errores: { id: string; error: string }[];
}

/**
 * Registra una operación en la cola offline.
 */
export async function agregarOperacion(
  tipo: TipoOperacion,
  datos: Record<string, unknown>
): Promise<OperacionCola> {
  const operacion: OperacionCola = {
    id: uuidv4(),
    tipo,
    datos,
    estado: 'pendiente',
    creado_en: new Date().toISOString(),
    intentos: 0,
    ultimo_error: null,
    confirmado_en: null,
  };

  await guardarRegistro(TABLA, operacion as never);
  return operacion;
}

/**
 * Obtiene todas las operaciones pendientes.
 */
export async function obtenerPendientes(): Promise<OperacionCola[]> {
  return obtenerPorIndice<OperacionCola>(TABLA, 'estado', 'pendiente');
}

/**
 * Obtiene todas las operaciones de un tipo específico.
 */
export async function obtenerPorTipo(tipo: TipoOperacion): Promise<OperacionCola[]> {
  return obtenerPorIndice<OperacionCola>(TABLA, 'tipo', tipo);
}

/**
 * Obtiene todas las operaciones (para debug/monitoring).
 */
export async function obtenerTodas(): Promise<OperacionCola[]> {
  return obtenerTodos<OperacionCola>(TABLA);
}

/**
 * Marca una operación como "sincronizando" (en progreso).
 */
export async function marcarSincronizando(id: string): Promise<void> {
  const operacion = await obtenerRegistroById(id);
  if (!operacion) return;

  await guardarRegistro(TABLA, {
    ...operacion,
    estado: 'sincronizando',
    intentos: operacion.intentos + 1,
  } as never);
}

/**
 * Marca una operación como "confirmada" (sync exitosa).
 */
export async function marcarConfirmada(id: string): Promise<void> {
  const operacion = await obtenerRegistroById(id);
  if (!operacion) return;

  await guardarRegistro(TABLA, {
    ...operacion,
    estado: 'confirmado',
    confirmado_en: new Date().toISOString(),
  } as never);
}

/**
 * Marca una operación como "error" (sync fallida).
 */
export async function marcarError(id: string, error: string): Promise<void> {
  const operacion = await obtenerRegistroById(id);
  if (!operacion) return;

  await guardarRegistro(TABLA, {
    ...operacion,
    estado: 'error',
    ultimo_error: error,
  } as never);
}

/**
 * Elimina una operación de la cola.
 */
export async function eliminarOperacion(id: string): Promise<void> {
  await eliminarRegistro(TABLA, id);
}

/**
 * Limpia todas las operaciones confirmadas (más de 7 días).
 */
export async function limpiarConfirmadas(diasAntiguedad: number = 7): Promise<number> {
  const todas = await obtenerTodos<OperacionCola>(TABLA);
  const ahora = new Date();
  let eliminadas = 0;

  for (const op of todas) {
    if (op.estado === 'confirmado' && op.confirmado_en) {
      const fechaConfirmacion = new Date(op.confirmado_en);
      const diasTranscurridos = (ahora.getTime() - fechaConfirmacion.getTime()) / (1000 * 60 * 60 * 24);
      if (diasTranscurridos > diasAntiguedad) {
        await eliminarOperacion(op.id);
        eliminadas++;
      }
    }
  }

  return eliminadas;
}

/**
 * Obtiene estadísticas de la cola.
 */
export async function obtenerEstadisticas(): Promise<{
  total: number;
  pendientes: number;
  sincronizando: number;
  confirmadas: number;
  errores: number;
}> {
  const todas = await obtenerTodos<OperacionCola>(TABLA);
  return {
    total: todas.length,
    pendientes: todas.filter((op) => op.estado === 'pendiente').length,
    sincronizando: todas.filter((op) => op.estado === 'sincronizando').length,
    confirmadas: todas.filter((op) => op.estado === 'confirmado').length,
    errores: todas.filter((op) => op.estado === 'error').length,
  };
}

/**
 * Reintenta operaciones en error (máximo 3 intentos).
 */
export async function reintentarErrores(): Promise<OperacionCola[]> {
  const todas = await obtenerTodos<OperacionCola>(TABLA);
  return todas.filter((op) => op.estado === 'error' && op.intentos < 3);
}

// ============================================================
// Función auxiliar privada
// ============================================================

async function obtenerRegistroById(id: string): Promise<OperacionCola | null> {
  const { obtenerRegistro } = await import('./localDb.service');
  return obtenerRegistro<OperacionCola>(TABLA, id);
}
