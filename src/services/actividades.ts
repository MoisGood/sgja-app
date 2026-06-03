// ============================================================
// SGJA – Servicio de Actividades de Usuarios
// src/services/actividades.ts
// ============================================================

import { supabase } from '../lib/supabase';

export interface Actividad {
  id: string;
  id_usuario: string;
  nombre_usuario: string;
  email_usuario: string;
  rol_usuario: string;
  pagina: string;
  accion: string;
  timestamp: string;
  ultimo_update: string;
}

/**
 * Registra o actualiza la actividad de un usuario
 */
export async function registrarActividad(
  idUsuario: string,
  nombreUsuario: string,
  emailUsuario: string,
  rolUsuario: string,
  pagina: string,
  accion: string
): Promise<void> {
  try {
    // Buscar si ya existe un registro activo para este usuario
    const { data: actividadExistente, error: errorBusqueda } = await supabase
      .from('actividades')
      .select('id')
      .eq('id_usuario', idUsuario)
      .single();

    if (errorBusqueda && errorBusqueda.code !== 'PGRST116') {
      throw errorBusqueda;
    }

    if (actividadExistente) {
      // Actualizar registro existente
      const { error: errorUpdate } = await supabase
        .from('actividades')
        .update({
          pagina: pagina,
          accion: accion,
          ultimo_update: new Date().toISOString(),
        })
        .eq('id_usuario', idUsuario);
      
      if (errorUpdate) throw errorUpdate;
    } else {
      // Crear nuevo registro de actividad
      const { error: errorInsert } = await supabase
        .from('actividades')
        .insert([{
          id_usuario: idUsuario,
          nombre_usuario: nombreUsuario,
          email_usuario: emailUsuario,
          rol_usuario: rolUsuario,
          pagina: pagina,
          accion: accion,
          timestamp: new Date().toISOString(),
          ultimo_update: new Date().toISOString(),
        }]);
      
      if (errorInsert) throw errorInsert;
    }
  } catch (error) {
    console.error('Error al registrar actividad:', error);
  }
}

/**
 * Obtiene todas las actividades de usuarios en línea
 * Considera usuarios activos si su última actividad fue en los últimos 10 minutos
 */
export async function obtenerUsuariosEnLinea(): Promise<Actividad[]> {
  try {
    const { data, error } = await supabase
      .from('actividades')
      .select('*');

    if (error) throw error;

    const ahora = new Date();
    const diez_minutos_atras = new Date(ahora.getTime() - 10 * 60 * 1000);

    return (data || [])
      .filter((actividad) => {
        // Filtrar usuarios con actividad en los últimos 10 minutos
        const ultimoUpdate = new Date(actividad.ultimo_update);
        return ultimoUpdate > diez_minutos_atras;
      });
  } catch (error) {
    console.error('Error al obtener usuarios en línea:', error);
    return [];
  }
}

/**
 * Registra cuando un usuario cierra sesión
 */
export async function limpiarActividadUsuario(idUsuario: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('actividades')
      .delete()
      .eq('id_usuario', idUsuario);

    if (error) throw error;
  } catch (error) {
    console.error('Error al limpiar actividad del usuario:', error);
  }
}

/**
 * Obtiene la duración de inactividad en segundos
 */
export function obtenerDuracionInactividad(timestamp: string): number {
  const ahora = new Date();
  const fecha = new Date(timestamp);
  return Math.floor((ahora.getTime() - fecha.getTime()) / 1000);
}

/**
 * Formatea la duración de inactividad en texto legible
 */
export function formatearDuracionInactividad(segundos: number): string {
  if (segundos < 60) return 'Hace unos segundos';
  
  const minutos = Math.floor(segundos / 60);
  if (minutos < 60) return `Hace ${minutos} min`;
  
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `Hace ${horas}h`;
  
  const dias = Math.floor(horas / 24);
  return `Hace ${dias}d`;
}
