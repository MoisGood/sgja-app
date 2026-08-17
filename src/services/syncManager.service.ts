// ============================================================
// Servicio de Sync Manager
// src/services/syncManager.service.ts
//
// Detecta conexión a Internet.
// Sube operaciones pendientes a Supabase.
// Resuelve conflictos (último gana).
// Registra en auditoría.
// ============================================================

import { supabase } from '../lib/supabase';
import {
  obtenerPendientes,
  marcarSincronizando,
  marcarConfirmada,
  marcarError,
  reintentarErrores,
  obtenerEstadisticas,
} from './offlineQueue.service';
import type { OperacionCola, ResultadoSync } from './offlineQueue.service';

const AUDIT_TABLE = 'sync_audit_log';

export interface AuditLog {
  id: string;
  operacion_id: string;
  tipo: string;
  accion: 'sync_exitoso' | 'sync_fallido' | 'conflicto' | 'resuelto';
  datos?: Record<string, unknown>;
  error?: string;
  tablet_id: string;
  creado_en: string;
}

/**
 * Detecta si hay conexión a Internet.
 */
export async function hayConexion(): Promise<boolean> {
  try {
    // Intentar una consulta ligera a Supabase
    const { error } = await supabase.from('establecimientos').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Sincroniza una operación individual con Supabase.
 */
async function sincronizarOperacion(operacion: OperacionCola): Promise<boolean> {
  try {
    switch (operacion.tipo) {
      case 'asistencia':
        return await sincronizarAsistencia(operacion);
      case 'retiro':
        return await sincronizarRetiro(operacion);
      case 'matricula':
        return await sincronizarMatricula(operacion);
      case 'consentimiento':
        return await sincronizarConsentimiento(operacion);
      default:
        return false;
    }
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error desconocido';
    await marcarError(operacion.id, mensaje);
    await registrarAudit(operacion, 'sync_fallido', mensaje);
    return false;
  }
}

/**
 * Sincroniza un registro de asistencia.
 */
async function sincronizarAsistencia(op: OperacionCola): Promise<boolean> {
  const { estudiante_id, fecha, estado, minutos_atraso, motivo, registrado_por } = op.datos;

  // Verificar si ya existe (conflicto)
  const { data: existente } = await supabase
    .from('asistencia')
    .select('id, creado_en')
    .eq('estudiante_id', estudiante_id)
    .eq('fecha', fecha)
    .single();

  if (existente) {
    // Conflicto: último gana (por timestamp)
    await registrarAudit(op, 'conflicto', `Registro existente: ${existente.id}`);
    // Actualizar existente
    const { error } = await supabase
      .from('asistencia')
      .update({ estado, minutos_atraso, motivo, actualizado_en: new Date().toISOString() })
      .eq('id', existente.id);

    if (error) throw error;
    await registrarAudit(op, 'resuelto', `Actualizado: ${existente.id}`);
    return true;
  }

  // Insertar nuevo
  const { error } = await supabase.from('asistencia').insert({
    estudiante_id,
    fecha,
    estado,
    minutos_atraso,
    motivo,
    registrado_por,
  });

  if (error) throw error;
  return true;
}

/**
 * Sincroniza un retiro de estudiante.
 */
async function sincronizarRetiro(op: OperacionCola): Promise<boolean> {
  const { error } = await supabase.from('retiros_estudiantes').insert(op.datos);
  if (error) throw error;
  return true;
}

/**
 * Sincroniza una matrícula.
 */
async function sincronizarMatricula(op: OperacionCola): Promise<boolean> {
  const { error } = await supabase.from('matriculas').insert(op.datos);
  if (error) throw error;
  return true;
}

/**
 * Sincroniza consentimientos.
 */
async function sincronizarConsentimiento(op: OperacionCola): Promise<boolean> {
  const { matricula_id, consentimientos } = op.datos as {
    matricula_id: string;
    consentimientos: Record<string, unknown>;
  };
  const { error } = await supabase
    .from('matriculas')
    .update({ consentimiento_aceptados: consentimientos })
    .eq('id', matricula_id);
  if (error) throw error;
  return true;
}

/**
 * Registra una entrada en la tabla de auditoría.
 */
async function registrarAudit(
  operacion: OperacionCola,
  accion: AuditLog['accion'],
  detalle?: string
): Promise<void> {
  try {
    await supabase.from(AUDIT_TABLE).insert({
      operacion_id: operacion.id,
      tipo: operacion.tipo,
      accion,
      datos: operacion.datos,
      error: detalle || null,
      tablet_id: obtenerTabletId(),
    });
  } catch {
    // No fallar si el audit log falla
  }
}

/**
 * Obtiene el ID de la tablet actual (guardado en localStorage).
 */
function obtenerTabletId(): string {
  let tabletId = localStorage.getItem('agil_tablet_id');
  if (!tabletId) {
    tabletId = `tablet-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem('agil_tablet_id', tabletId);
  }
  return tabletId;
}

/**
 * Sincroniza todas las operaciones pendientes.
 * Retorna el resultado de la sincronización.
 */
export async function sincronizarTodo(): Promise<ResultadoSync> {
  const resultado: ResultadoSync = { exitosas: 0, fallidas: 0, errores: [] };

  // Verificar conexión
  if (!(await hayConexion())) {
    return resultado;
  }

  // Obtener pendientes + reintentos
  const pendientes = await obtenerPendientes();
  const reintentos = await reintentarErrores();
  const operaciones = [...pendientes, ...reintentos];

  for (const op of operaciones) {
    await marcarSincronizando(op.id);

    const exito = await sincronizarOperacion(op);

    if (exito) {
      await marcarConfirmada(op.id);
      await registrarAudit(op, 'sync_exitoso');
      resultado.exitosas++;
    } else {
      resultado.fallidas++;
      resultado.errores.push({ id: op.id, error: op.ultimo_error || 'Error desconocido' });
    }
  }

  return resultado;
}

/**
 * Obtiene estadísticas de sync.
 */
export async function estadisticasSync() {
  const stats = await obtenerEstadisticas();
  const conectado = await hayConexion();
  return { ...stats, conectado };
}

/**
 * Limpia operaciones confirmadas antiguas (> 7 días).
 */
export async function limpiarAntiguas(): Promise<number> {
  const { limpiarConfirmadas } = await import('./offlineQueue.service');
  return limpiarConfirmadas(7);
}
