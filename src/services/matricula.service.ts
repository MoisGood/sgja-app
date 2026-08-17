// ============================================================
// AGIL – Servicio de Matrículas
// src/services/matricula.service.ts
// ============================================================

import { supabase } from '../lib/supabase';
import { handleError } from '../utils/errorHandler';
import { limpiarRUT, formatoSimple } from '../utils/rutUtils';
import type { Matricula, MatriculaDatos, RetiroDatos, RetiroEstudiante } from '../types';

export interface CrearMatriculaInput {
  idEstablecimiento: string;
  idFuncionario: string;
  datos: MatriculaDatos;
  tipo?: 'nueva' | 'continuidad';
}

export interface FiltrosMatriculas {
  anio?: number;
  tipo?: string;
}

const NIVEL_LABEL: Record<string, string> = {
  '1': '1° Medio',
  '2': '2° Medio',
  '3': '3° Medio',
  '4': '4° Medio',
};

/**
 * Crear una matrícula. Extrae las columnas clave (rut, nombre, nivel, curso,
 * fecha de nacimiento) y guarda el formulario completo en la columna JSONB `datos`.
 */
export async function crearMatricula({
  idEstablecimiento,
  idFuncionario,
  datos,
  tipo = 'nueva',
}: CrearMatriculaInput): Promise<Matricula | null> {
  try {
    const nombreCompleto = [
      datos.apellido_paterno,
      datos.apellido_materno,
      datos.nombres,
    ].filter(Boolean).join(' ').trim();

    const nivelLabel = NIVEL_LABEL[datos.nivel] || datos.nivel || null;

    const { data, error } = await supabase
      .from('matriculas')
      .insert({
        id_establecimiento: idEstablecimiento,
        id_funcionario: idFuncionario,
        rut: datos.rut ? formatoSimple(datos.rut) : null,
        nombre_completo: nombreCompleto || null,
        nivel: nivelLabel,
        curso: (tipo === 'continuidad' && datos.curso_actual) || nivelLabel,
        fecha_nacimiento: datos.fecha_nacimiento || null,
        estado: 'completada',
        tipo,
        datos,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Matricula;
  } catch (error) {
    handleError(error, 'Error al guardar matrícula');
    return null;
  }
}

/**
 * Listar matrículas de un establecimiento con filtros opcionales
 * (año de creación y tipo). El filtro por nivel se aplica client-side.
 */
export async function obtenerMatriculas(
  idEstablecimiento: string,
  filtros: FiltrosMatriculas = {}
): Promise<Matricula[]> {
  try {
    let query = supabase
      .from('matriculas')
      .select('*')
      .eq('id_establecimiento', idEstablecimiento)
      .eq('activo', true);

    if (filtros.tipo) query = query.eq('tipo', filtros.tipo);
    if (filtros.anio) {
      const desde = `${filtros.anio}-01-01T00:00:00`;
      const hasta = `${filtros.anio + 1}-01-01T00:00:00`;
      query = query.gte('creado_en', desde).lt('creado_en', hasta);
    }

    const { data, error } = await query.order('creado_en', { ascending: false });

    if (error) throw error;
    return (data || []) as Matricula[];
  } catch (error) {
    handleError(error, 'Error al obtener matrículas');
    return [];
  }
}

/**
 * Buscar estudiante existente por RUT (para autocompletar el formulario).
 * Solo busca en el mismo establecimiento.
 */
export async function buscarEstudiantePorRut(
  rut: string,
  idEstablecimiento: string
): Promise<{ nombre_completo: string; curso: string; rut: string } | null> {
  try {
    const rutLimpio = limpiarRUT(rut);
    const { data, error } = await supabase
      .from('estudiantes')
      .select('nombre_completo, curso, rut')
      .eq('id_establecimiento', idEstablecimiento)
      .eq('activo', true);

    if (error) throw error;

    const encontrado = (data || []).find(
      (e) => e.rut && limpiarRUT(e.rut) === rutLimpio
    );
    if (!encontrado) return null;
    return encontrado;
  } catch (error) {
    handleError(error, 'Error al buscar estudiante por RUT');
    return null;
  }
}

/**
 * Guarda los consentimientos de la matrícula (post-save).
 * Actualiza el JSONB `datos` con consentimiento_completo/fecha/aceptados.
 */
export async function guardarConsentimientos(
  id: string,
  datos: MatriculaDatos
): Promise<Matricula | null> {
  try {
    const { data, error } = await supabase
      .from('matriculas')
      .update({ datos })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Matricula;
  } catch (error) {
    handleError(error, 'Error al guardar consentimientos');
    return null;
  }
}

/**
 * Anula una matrícula (el apoderado no aceptó los consentimientos).
 * Cambia estado a 'anulada', desactiva el registro y guarda el motivo en datos.
 */
export async function anularMatricula(
  id: string,
  datos: MatriculaDatos
): Promise<Matricula | null> {
  try {
    const { data, error } = await supabase
      .from('matriculas')
      .update({ estado: 'anulada', activo: false, datos })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Matricula;
  } catch (error) {
    handleError(error, 'Error al anular matrícula');
    return null;
  }
}

export interface CrearRetiroInput {
  idEstablecimiento: string;
  idFuncionario: string;
  datos: RetiroDatos;
}

/**
 * Registrar el retiro de un estudiante.
 */
export async function crearRetiroEstudiante({
  idEstablecimiento,
  idFuncionario,
  datos,
}: CrearRetiroInput): Promise<RetiroEstudiante | null> {
  try {
    const nombreCompleto = [
      datos.apellido_paterno,
      datos.apellido_materno,
      datos.nombres,
    ].filter(Boolean).join(' ').trim();

    const { data, error } = await supabase
      .from('retiros_estudiantes')
      .insert({
        id_establecimiento: idEstablecimiento,
        id_funcionario: idFuncionario,
        rut: datos.rut ? formatoSimple(datos.rut) : null,
        nombre_completo: nombreCompleto || null,
        nivel: NIVEL_LABEL[datos.nivel] || datos.nivel || null,
        curso: NIVEL_LABEL[datos.nivel] || datos.nivel || null,
        fecha_retiro: datos.fecha_retiro || null,
        motivo: datos.motivo || null,
        datos,
      })
      .select()
      .single();

    if (error) throw error;
    return data as RetiroEstudiante;
  } catch (error) {
    handleError(error, 'Error al registrar retiro');
    return null;
  }
}

export interface FiltrosRetiros {
  anio?: number;
}

/**
 * Listar retiros de un establecimiento con filtro opcional por año.
 */
export async function obtenerRetiros(
  idEstablecimiento: string,
  filtros: FiltrosRetiros = {}
): Promise<RetiroEstudiante[]> {
  try {
    let query = supabase
      .from('retiros_estudiantes')
      .select('*')
      .eq('id_establecimiento', idEstablecimiento)
      .eq('activo', true);

    if (filtros.anio) {
      const desde = `${filtros.anio}-01-01T00:00:00`;
      const hasta = `${filtros.anio + 1}-01-01T00:00:00`;
      query = query.gte('creado_en', desde).lt('creado_en', hasta);
    }

    const { data, error } = await query.order('creado_en', { ascending: false });

    if (error) throw error;
    return (data || []) as RetiroEstudiante[];
  } catch (error) {
    handleError(error, 'Error al obtener retiros');
    return [];
  }
}

/**
 * Anular (eliminar lógicamente) un retiro mal registrado.
 */
export async function anularRetiro(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('retiros_estudiantes')
      .update({ activo: false })
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    handleError(error, 'Error al anular retiro');
    return false;
  }
}
