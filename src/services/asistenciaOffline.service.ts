// ============================================================
// Servicio de asistencia offline
// src/services/asistenciaOffline.service.ts
//
// Descarga estudiantes del curso a IndexedDB.
// Registra asistencia localmente (sin Wi-Fi).
// Encola para sync cuando se restablezca la conexión.
// ============================================================

import {
  guardarRegistro,
  obtenerTodos,
  obtenerPorIndice,
} from './localDb.service';
import { agregarOperacion } from './offlineQueue.service';

const TABLA_ESTUDIANTES = 'estudiantes';
const TABLA_ASISTENCIA = 'asistencia';

export type EstadoAsistencia = 'presente' | 'atrasado' | 'ausente';

export interface EstudianteLocal {
  id: string;
  rut: string;
  nombre: string;
  curso: string;
  nivel: string;
  apoderado_nombre?: string;
  apoderado_telefono?: string;
  datos_cifrados?: string;
}

export interface RegistroAsistencia {
  id: string;
  estudiante_id: string;
  fecha: string;
  estado: EstadoAsistencia;
  minutos_atraso?: number;
  motivo?: string;
  registrado_por: string;
  creado_en: string;
  sincronizado: boolean;
}

export interface ResumenAsistencia {
  fecha: string;
  curso: string;
  total: number;
  presentes: number;
  atrasados: number;
  ausentes: number;
}

// ============================================================
// Gestión de estudiantes locales
// ============================================================

/**
 * Descarga estudiantes de un curso desde Supabase a IndexedDB.
 * En producción, esto llamaría a Supabase. Aquí simulamos.
 */
export async function descargarEstudiantesCurso(
  curso: string,
  estudiantes: EstudianteLocal[]
): Promise<number> {
  let guardados = 0;
  for (const est of estudiantes) {
    const registro = { ...est, curso };
    await guardarRegistro(TABLA_ESTUDIANTES, registro as never);
    guardados++;
  }
  return guardados;
}

/**
 * Obtiene todos los estudiantes locales de un curso.
 */
export async function obtenerEstudiantesCurso(curso: string): Promise<EstudianteLocal[]> {
  return obtenerPorIndice<EstudianteLocal>(TABLA_ESTUDIANTES, 'curso', curso);
}

/**
 * Cuenta estudiantes de un curso.
 */
export async function contarEstudiantesCurso(curso: string): Promise<number> {
  const estudiantes = await obtenerEstudiantesCurso(curso);
  return estudiantes.length;
}

// ============================================================
// Registro de asistencia offline
// ============================================================

/**
 * Registra la asistencia de un estudiante (offline).
 * Se guarda en IndexedDB y encola para sync.
 */
export async function registrarAsistenciaOffline(
  estudianteId: string,
  fecha: string,
  estado: EstadoAsistencia,
  registradoPor: string,
  minutosAtraso?: number,
  motivo?: string
): Promise<RegistroAsistencia> {
  const registro: RegistroAsistencia = {
    id: `asis-${estudianteId}-${fecha}-${Date.now()}`,
    estudiante_id: estudianteId,
    fecha,
    estado,
    minutos_atraso: minutosAtraso,
    motivo,
    registrado_por: registradoPor,
    creado_en: new Date().toISOString(),
    sincronizado: false,
  };

  // Guardar en IndexedDB
  await guardarRegistro(TABLA_ASISTENCIA, registro as never);

  // Encolar para sync
  await agregarOperacion('asistencia', {
    estudiante_id: estudianteId,
    fecha,
    estado,
    minutos_atraso: minutosAtraso,
    motivo,
    registrado_por: registradoPor,
  });

  return registro;
}

/**
 * Registra asistencia para todo un curso (offline).
 */
export async function registrarAsistenciaCursoOffline(
  _curso: string,
  fecha: string,
  registros: { estudianteId: string; estado: EstadoAsistencia; minutosAtraso?: number; motivo?: string }[],
  registradoPor: string
): Promise<RegistroAsistencia[]> {
  const resultados: RegistroAsistencia[] = [];

  for (const reg of registros) {
    const registro = await registrarAsistenciaOffline(
      reg.estudianteId,
      fecha,
      reg.estado,
      registradoPor,
      reg.minutosAtraso,
      reg.motivo
    );
    resultados.push(registro);
  }

  return resultados;
}

/**
 * Obtiene la asistencia de un curso en una fecha específica.
 */
export async function obtenerAsistenciaCursoFecha(
  curso: string,
  fecha: string
): Promise<RegistroAsistencia[]> {
  const estudiantes = await obtenerEstudiantesCurso(curso);
  const idsEstudiantes = new Set(estudiantes.map((e) => e.id));

  const todas = await obtenerTodos<RegistroAsistencia>(TABLA_ASISTENCIA);
  return todas.filter(
    (r) => idsEstudiantes.has(r.estudiante_id) && r.fecha === fecha
  );
}

/**
 * Obtiene la asistencia de un estudiante en un rango de fechas.
 */
export async function obtenerAsistenciaEstudiante(
  estudianteId: string,
  desde?: string,
  hasta?: string
): Promise<RegistroAsistencia[]> {
  let registros = await obtenerPorIndice<RegistroAsistencia>(
    TABLA_ASISTENCIA,
    'estudiante_id',
    estudianteId
  );

  if (desde) {
    registros = registros.filter((r) => r.fecha >= desde);
  }
  if (hasta) {
    registros = registros.filter((r) => r.fecha <= hasta);
  }

  return registros.sort((a, b) => a.fecha.localeCompare(b.fecha));
}

/**
 * Genera un resumen de asistencia para un curso y fecha.
 */
export async function generarResumen(
  curso: string,
  fecha: string
): Promise<ResumenAsistencia> {
  const registros = await obtenerAsistenciaCursoFecha(curso, fecha);

  return {
    fecha,
    curso,
    total: registros.length,
    presentes: registros.filter((r) => r.estado === 'presente').length,
    atrasados: registros.filter((r) => r.estado === 'atrasado').length,
    ausentes: registros.filter((r) => r.estado === 'ausente').length,
  };
}

/**
 * Verifica si ya se registró asistencia para un curso en una fecha.
 */
export async function yaRegistrado(curso: string, fecha: string): Promise<boolean> {
  const registros = await obtenerAsistenciaCursoFecha(curso, fecha);
  return registros.length > 0;
}

/**
 * Cuenta registros pendientes de sync.
 */
export async function contarPendientesSync(): Promise<number> {
  const todos = await obtenerTodos<RegistroAsistencia>(TABLA_ASISTENCIA);
  return todos.filter((r) => !r.sincronizado).length;
}
