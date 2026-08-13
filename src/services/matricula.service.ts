// ============================================================
// AGIL – Servicio de Matrículas
// src/services/matricula.service.ts
// ============================================================

import { supabase } from '../lib/supabase';
import { handleError } from '../utils/errorHandler';
import { limpiarRUT, formatoSimple } from '../utils/rutUtils';
import type { Matricula, MatriculaDatos } from '../types';

export interface CrearMatriculaInput {
  idEstablecimiento: string;
  idFuncionario: string;
  datos: MatriculaDatos;
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
        curso: nivelLabel,
        fecha_nacimiento: datos.fecha_nacimiento || null,
        estado: 'completada',
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
 * Listar matrículas de un establecimiento
 */
export async function obtenerMatriculas(
  idEstablecimiento: string
): Promise<Matricula[]> {
  try {
    const { data, error } = await supabase
      .from('matriculas')
      .select('*')
      .eq('id_establecimiento', idEstablecimiento)
      .eq('activo', true)
      .order('creado_en', { ascending: false });

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
