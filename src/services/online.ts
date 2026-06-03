// ============================================================
// SGJA – Servicio de Estado En Línea (Migrado a Supabase)
// src/services/online.ts
// ============================================================

import { supabase } from '../lib/supabase';
import { 
  generarIdDispositivo, 
  obtenerInfoDispositivo,
  obtenerSistemaOperativo,
  obtenerInfoNavegador,
  obtenerIpCliente 
} from './deviceId';

export interface UsuarioOnline {
  id: string;
  id_usuario: string;
  nombre_usuario: string;
  email_usuario: string;
  rol_usuario: string;
  tipo_dispositivo?: string;
  id_dispositivo?: string;
  navegador?: string;
  sistema_operativo?: string;
  pantalla?: string;
  ip_cliente?: string;
  estado: 'conectado' | 'desconectado';
  timestamp_inicio: string;
  timestamp_fin?: string;
  timestamp_ultima_actividad?: string;
  timestamp_heartbeat?: string;
}

export interface PaginationResult<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
  totalFiltered: number;
}

/**
 * Limpia sesiones antiguas (más de 24 horas) con estado 'conectado'
 */
export async function limpiarSesionesAntiguas(): Promise<void> {
  try {
    const hace24Horas = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: sesionesAntiguas, error: errorBusqueda } = await supabase
      .from('online')
      .select('id')
      .eq('estado', 'conectado')
      .lt('timestamp_inicio', hace24Horas);

    if (errorBusqueda) throw errorBusqueda;

    if (sesionesAntiguas && sesionesAntiguas.length > 0) {
      console.warn(`⚠️ Encontradas ${sesionesAntiguas.length} sesiones antiguas (>24h). Limpiando...`);
      
      const { error: errorUpdate } = await supabase
        .from('online')
        .update({
          estado: 'desconectado',
          timestamp_fin: new Date().toISOString(),
        })
        .eq('estado', 'conectado')
        .lt('timestamp_inicio', hace24Horas);

      if (errorUpdate) throw errorUpdate;
      console.log(`✅ Sesiones antiguas limpiadas (${sesionesAntiguas.length} documentos actualizados)`);
    }
  } catch (error) {
    console.error('Error al limpiar sesiones antiguas:', error);
  }
}

/**
 * Registra un heartbeat (latido) de la sesión
 */
export async function enviarHeartbeat(emailUsuario: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('online')
      .update({
        timestamp_ultima_actividad: new Date().toISOString(),
        timestamp_heartbeat: new Date().toISOString(),
      })
      .eq('email_usuario', emailUsuario);

    if (error && error.code !== 'PGRST116') {
      throw error;
    }
  } catch (error) {
    console.warn('⚠️ Error al enviar heartbeat:', error);
  }
}

/**
 * Registra que un usuario inició sesión
 */
export async function registrarInicio(
  idUsuario: string,
  nombreUsuario: string,
  emailUsuario: string,
  rolUsuario: string
): Promise<void> {
  try {
    const emailLimpio = emailUsuario?.trim()?.toLowerCase() || '';
    
    if (!emailLimpio) {
      throw new Error('Email vacío recibido en registrarInicio');
    }

    const idDispositivo = await generarIdDispositivo();
    const infoDispositivo = obtenerInfoDispositivo();
    const infoSO = obtenerSistemaOperativo();
    const infoNavegador = obtenerInfoNavegador();
    
    let ipCliente: string | null = null;
    try {
      const ipPromise = obtenerIpCliente();
      ipCliente = await Promise.race([
        ipPromise,
        new Promise<null>(resolve => setTimeout(() => resolve(null), 2000))
      ]);
    } catch {
      ipCliente = null;
    }

    const { data: actividadExistente, error: errorBusqueda } = await supabase
      .from('online')
      .select('id')
      .eq('email_usuario', emailLimpio)
      .single();

    const ahora = new Date().toISOString();

    if (errorBusqueda && errorBusqueda.code !== 'PGRST116') {
      throw errorBusqueda;
    }

    if (actividadExistente) {
      console.log(`♻️ Usuario encontrado: ${nombreUsuario}`);
      console.log(`   Email: ${emailLimpio}`);
      console.log(`   Actualizando estado a CONECTADO...`);
      
      const { error: errorUpdate } = await supabase
        .from('online')
        .update({
          estado: 'conectado',
          timestamp_inicio: ahora,
          timestamp_ultima_actividad: ahora,
          timestamp_heartbeat: ahora,
          timestamp_fin: null,
          id_dispositivo: idDispositivo,
          navegador: infoNavegador.nombre,
          sistema_operativo: infoSO.nombre,
          pantalla: infoDispositivo.pantalla,
          ip_cliente: ipCliente,
        })
        .eq('email_usuario', emailLimpio);

      if (errorUpdate) throw errorUpdate;
      console.log(`✅ Estado actualizado a CONECTADO`);
    } else {
      console.log(`📝 Usuario nuevo: ${nombreUsuario}`);
      console.log(`   Email: ${emailLimpio}`);
      console.log(`   Creando registro...`);
      
      const { error: errorInsert } = await supabase
        .from('online')
        .insert([{
          id_usuario: idUsuario,
          nombre_usuario: nombreUsuario,
          email_usuario: emailLimpio,
          rol_usuario: rolUsuario,
          tipo_dispositivo: infoDispositivo.dispositivo,
          id_dispositivo: idDispositivo,
          navegador: infoNavegador.nombre,
          sistema_operativo: infoSO.nombre,
          pantalla: infoDispositivo.pantalla,
          ip_cliente: ipCliente,
          estado: 'conectado',
          timestamp_inicio: ahora,
          timestamp_ultima_actividad: ahora,
          timestamp_heartbeat: ahora,
        }]);

      if (errorInsert) throw errorInsert;
      console.log(`✅ Registro creado con estado CONECTADO`);
    }

    console.log(`   Usuario: ${nombreUsuario}`);
    console.log(`   Email: ${emailLimpio}`);
    console.log(`   Dispositivo: ${idDispositivo?.substring(0, 20)}...`);
    console.log(`   Navegador: ${infoNavegador.nombre} / ${infoSO.nombre}`);
    console.log(`   IP: ${ipCliente || 'No disponible'}`);
  } catch (error) {
    console.error('Error al registrar inicio de sesión:', error);
    throw error;
  }
}

/**
 * Registra que un usuario cerró sesión
 */
export async function registrarCierre(emailUsuario: string): Promise<void> {
  try {
    if (!emailUsuario || typeof emailUsuario !== 'string') {
      console.error(`❌ CIERRE: Email inválido`);
      return;
    }

    const emailLimpio = emailUsuario.trim().toLowerCase();
    console.log(`🔴 CIERRE: Registrando cierre de sesión para ${emailLimpio}`);
    
    if (!emailLimpio.includes('@')) {
      console.error(`❌ Email sin @: "${emailLimpio}"`);
      return;
    }

    console.log(`✅ Cierre registrado. El heartbeat dejará de enviarse.`);
    console.log(`   El usuario aparecerá como OFFLINE en 5+ minutos sin heartbeat.`);
  } catch (error) {
    console.error(`❌ CIERRE: Error:`, error);
  }
}

/**
 * Actualiza el timestamp de última actividad de la sesión actual
 */
export async function actualizarActividadSesion(emailUsuario: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('online')
      .update({
        timestamp_ultima_actividad: new Date().toISOString(),
      })
      .eq('email_usuario', emailUsuario);

    if (error && error.code !== 'PGRST116') {
      throw error;
    }
  } catch (error) {
    console.error('Error al actualizar actividad de sesión:', error);
  }
}

/**
 * Cierra las sesiones inactivas de un usuario
 */
export async function cerrarSesionesInactivas(
  idUsuario: string, 
  minutosInactividad: number = 30
): Promise<number> {
  try {
    const tiempoLimite = new Date(Date.now() - (minutosInactividad * 60 * 1000)).toISOString();
    
    const { data: sesiones, error: errorBusqueda } = await supabase
      .from('online')
      .select('id')
      .eq('id_usuario', idUsuario)
      .eq('estado', 'conectado')
      .lt('timestamp_ultima_actividad', tiempoLimite);

    if (errorBusqueda) throw errorBusqueda;

    if (!sesiones || sesiones.length === 0) {
      return 0;
    }

    const { error: errorUpdate } = await supabase
      .from('online')
      .update({
        estado: 'desconectado',
        timestamp_fin: new Date().toISOString(),
        razon_cierre: 'Inactividad',
      })
      .eq('id_usuario', idUsuario)
      .eq('estado', 'conectado')
      .lt('timestamp_ultima_actividad', tiempoLimite);

    if (errorUpdate) throw errorUpdate;
    console.log(`⏱️ ${sesiones.length} sesión(es) inactiva(s) cerrada(s) para ${idUsuario}`);
    return sesiones.length;
  } catch (error) {
    console.error('Error al cerrar sesiones inactivas:', error);
    return 0;
  }
}

/**
 * Obtiene las sesiones inactivas de un usuario
 */
export async function obtenerSesionesInactivas(
  idUsuario: string,
  minutosInactividad: number = 30
): Promise<UsuarioOnline[]> {
  try {
    const tiempoLimite = new Date(Date.now() - (minutosInactividad * 60 * 1000)).toISOString();
    
    const { data, error } = await supabase
      .from('online')
      .select('*')
      .eq('id_usuario', idUsuario)
      .eq('estado', 'conectado')
      .lt('timestamp_ultima_actividad', tiempoLimite);

    if (error) throw error;
    return (data || []) as UsuarioOnline[];
  } catch (error) {
    console.error('Error al obtener sesiones inactivas:', error);
    return [];
  }
}

/**
 * Obtiene las sesiones CONECTADAS de un usuario específico
 */
export async function obtenerSesionesUsuario(idUsuario: string): Promise<UsuarioOnline[]> {
  try {
    const { data, error } = await supabase
      .from('online')
      .select('*')
      .eq('id_usuario', idUsuario)
      .eq('estado', 'conectado');

    if (error) throw error;
    return (data || []) as UsuarioOnline[];
  } catch (error) {
    console.error(`Error al obtener sesiones del usuario ${idUsuario}:`, error);
    return [];
  }
}

/**
 * Obtiene todos los usuarios en línea
 */
export async function obtenerUsuariosOnline(): Promise<UsuarioOnline[]> {
  try {
    const { data, error } = await supabase
      .from('online')
      .select('*');

    if (error) throw error;
    return (data || []) as UsuarioOnline[];
  } catch (error) {
    console.error('Error al obtener usuarios en línea:', error);
    return [];
  }
}

/**
 * Obtiene solo usuarios que están conectados
 */
export async function obtenerUsuariosConectados(): Promise<UsuarioOnline[]> {
  try {
    const { data, error } = await supabase
      .from('online')
      .select('*')
      .eq('estado', 'conectado');

    if (error) throw error;
    return (data || []) as UsuarioOnline[];
  } catch (error) {
    console.error('Error al obtener usuarios conectados:', error);
    return [];
  }
}

/**
 * Obtiene usuarios paginados
 */
export async function obtenerUsuariosPaginado(
  pageSize: number = 10,
  currentPage: number = 1,
  estado: 'todos' | 'conectados' | 'desconectados' = 'todos'
): Promise<PaginationResult<UsuarioOnline>> {
  try {
    let query = supabase
      .from('online')
      .select('*', { count: 'exact' });

    if (estado === 'conectados') {
      query = query.eq('estado', 'conectado');
    } else if (estado === 'desconectados') {
      query = query.eq('estado', 'desconectado');
    }

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize - 1;

    const { data, error, count } = await query
      .order('timestamp_inicio', { ascending: false })
      .range(startIndex, endIndex);

    if (error) throw error;

    const totalFiltered = count || 0;
    const hasMore = (startIndex + pageSize) < totalFiltered;

    return {
      data: (data || []) as UsuarioOnline[],
      nextCursor: hasMore ? (currentPage + 1).toString() : null,
      hasMore,
      totalFiltered,
    };
  } catch (error) {
    console.error('Error al obtener usuarios paginados:', error);
    return {
      data: [],
      nextCursor: null,
      hasMore: false,
      totalFiltered: 0,
    };
  }
}

/**
 * Determina si un usuario está online basándose en timestamp_heartbeat
 */
export function estaOnline(timestampHeartbeat?: string): boolean {
  if (!timestampHeartbeat) return false;
  
  const ahora = new Date().getTime();
  const ultimoHeartbeat = new Date(timestampHeartbeat).getTime();
  const diferencia = ahora - ultimoHeartbeat;
  
  const DOS_MINUTOS = 2 * 60 * 1000;
  return diferencia < DOS_MINUTOS;
}

export function formatearDuracionConexion(timestamp: string): string {
  const ahora = new Date();
  const fecha = new Date(timestamp);
  const diferencia = ahora.getTime() - fecha.getTime();
  
  const segundos = Math.floor(diferencia / 1000);
  const minutos = Math.floor(segundos / 60);
  const horas = Math.floor(minutos / 60);
  const dias = Math.floor(horas / 24);

  if (dias > 0) {
    return `${dias}d ago`;
  }
  if (horas > 0) {
    return `${horas}h ago`;
  }
  if (minutos > 0) {
    return `${minutos}m ago`;
  }
  return 'Ahora';
}

/**
 * Guarda la configuración de inactividad del usuario
 */
export async function guardarConfiguracionInactividad(
  idUsuario: string,
  minutosInactividad: number,
  cerrarAutomatico: boolean
): Promise<void> {
  try {
    // Guardar en localStorage como fallback si Supabase no tiene tabla de configuración
    const config = {
      idUsuario,
      minutosInactividad,
      cerrarAutomatico,
      ultimaActualizacion: new Date().toISOString(),
    };
    localStorage.setItem(`config_inactividad_${idUsuario}`, JSON.stringify(config));
    console.log('✅ Configuración de inactividad guardada:', config);
  } catch (error) {
    console.error('Error al guardar configuración de inactividad:', error);
    throw error;
  }
}

/**
 * Obtiene la configuración de inactividad del usuario
 */
export async function obtenerConfiguracionInactividad(idUsuario: string): Promise<{
  minutosInactividad: number;
  cerrarAutomatico: boolean;
} | null> {
  try {
    const configJson = localStorage.getItem(`config_inactividad_${idUsuario}`);
    if (!configJson) {
      return null;
    }
    const config = JSON.parse(configJson);
    return {
      minutosInactividad: config.minutosInactividad || 30,
      cerrarAutomatico: config.cerrarAutomatico !== false,
    };
  } catch (error) {
    console.error('Error al obtener configuración de inactividad:', error);
    return null;
  }
}

/**
 * Escucha cambios en tiempo real de usuarios online con polling
 * Retorna una función para desuscribirse
 */
export function escucharUsuariosEnTiempoReal(
  pageSize: number = 10,
  currentPage: number = 1,
  estado: 'todos' | 'conectados' | 'desconectados' = 'todos',
  callback: (resultado: PaginationResult<UsuarioOnline>) => void
): () => void {
  let isActive = true;

  const fetchUsuarios = async () => {
    try {
      const resultado = await obtenerUsuariosPaginado(pageSize, currentPage, estado);
      if (isActive) {
        callback(resultado);
      }
    } catch (error) {
      console.error('Error en escucharUsuariosEnTiempoReal:', error);
    }
  };

  // Obtener datos iniciales
  fetchUsuarios();

  // Polling cada 5 segundos
  const intervalId = setInterval(fetchUsuarios, 5000);

  // Retornar función para limpiar
  return () => {
    isActive = false;
    clearInterval(intervalId);
  };
}
