import { supabase } from '../lib/supabase';
import { formatoSimple, formatearRUT, limpiarRUT } from '../utils/rutUtils';

export interface SolicitudRegistro {
  id_solicitud: number;
  uid: string;
  nombre: string;
  apellidos: string;
  correo: string;
  fecha_solicitud: string;
  estado: string;
  respuesta_enviada: boolean;
  fecha_respuesta: string | null;
}

export interface DatosPersonales {
  uid: string;
  rut: string | null;
  nombres: string;
  apellidos: string;
  email_personal: string | null;
  telefono: string | null;
  ciudad: string | null;
  direccion: string | null;
  asignatura: string | null;
  horas: number | null;
  emergencia_nombre: string | null;
  emergencia_telefono: string | null;
  emergencia_parentesco: string | null;
}

export async function enviarSolicitudRegistro(
  uid: string,
  correo: string,
  nombre: string,
  apellidos: string
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('solicitudes_registro')
      .insert([{
        uid,
        nombre,
        apellidos,
        correo,
        estado: 'pendiente',
      }]);

    if (error) return { error: error.message };
    return { error: null };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Error desconocido' };
  }
}

export async function obtenerSolicitudPorUid(uid: string): Promise<SolicitudRegistro | null> {
  try {
    const { data, error } = await supabase
      .from('solicitudes_registro')
      .select('*')
      .eq('uid', uid)
      .eq('estado', 'pendiente')
      .order('id_solicitud', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return null;
    return data as SolicitudRegistro | null;
  } catch (error) {
    return null;
  }
}

export async function obtenerSolicitudesPendientes(): Promise<SolicitudRegistro[]> {
  try {
    const { data, error } = await supabase
      .from('solicitudes_registro')
      .select('*')
      .eq('estado', 'pendiente')
      .order('fecha_solicitud', { ascending: false });

    if (error) throw error;
    return (data || []) as SolicitudRegistro[];
  } catch (error) {
    console.error('Error al obtener solicitudes pendientes:', error);
    return [];
  }
}

export async function aprobarSolicitud(
  uid: string,
  rol: string
): Promise<{ error: string | null }> {
  try {
    const { data, error } = await supabase.rpc('aprobar_solicitud_registro', {
      p_uid: uid,
      p_rol: rol,
    });

    if (error) return { error: error.message };

    const result = data as { error?: string | null } | null;
    if (result?.error) return { error: result.error };
    return { error: null };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Error desconocido' };
  }
}

export async function rechazarSolicitud(uid: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('solicitudes_registro')
      .update({
        estado: 'rechazado',
        respuesta_enviada: false,
        fecha_respuesta: new Date().toISOString(),
      })
      .eq('uid', uid);

    if (error) return { error: error.message };
    return { error: null };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Error desconocido' };
  }
}

export async function obtenerSolicitudesPaginadas(
  pagina: number,
  porPagina: number = 15,
  estado?: string
): Promise<{ data: SolicitudRegistro[]; total: number }> {
  try {
    const from = (pagina - 1) * porPagina;
    const to = from + porPagina - 1;

    let query = supabase
      .from('solicitudes_registro')
      .select('*', { count: 'exact' });

    if (estado) {
      query = query.eq('estado', estado);
    }

    const { data, error, count } = await query
      .order('fecha_solicitud', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return { data: (data || []) as SolicitudRegistro[], total: count ?? 0 };
  } catch (error) {
    console.error('Error al obtener solicitudes:', error);
    return { data: [], total: 0 };
  }
}

export async function obtenerDatosPersonales(uid: string): Promise<DatosPersonales | null> {
  try {
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('id, tipo_usuario, nombre, apellidos')
      .eq('uid', uid)
      .maybeSingle();

    if (!usuario) {
      const { data } = await supabase
        .from('datospersonalesusuarios')
        .select('*')
        .eq('uid', uid)
        .maybeSingle();
      return data as DatosPersonales | null;
    }

    if (usuario.tipo_usuario === 'funcionario') {
      const { data: func } = await supabase
        .from('funcionarios')
        .select('*')
        .eq('id_usuario', usuario.id)
        .maybeSingle();

      if (!func) return null;

      return {
        uid,
        rut: func.rut || null,
        nombres: func.nombre_completo || usuario.nombre || '',
        apellidos: usuario.apellidos || '',
        email_personal: func.correo_personal || null,
        telefono: func.celular || null,
        ciudad: func.comuna || null,
        direccion: func.domicilio || null,
        asignatura: func.asignatura || null,
        horas: func.horas_contrato || null,
        emergencia_nombre: func.emergencia_nombre || null,
        emergencia_telefono: func.emergencia_telefono || null,
        emergencia_parentesco: func.emergencia_parentesco || null,
      };
    }

    const { data } = await supabase
      .from('datospersonalesusuarios')
      .select('*')
      .eq('uid', uid)
      .maybeSingle();
    return data as DatosPersonales | null;
  } catch {
    return null;
  }
}

export async function obtenerDatosPersonalesPorUid(uid: string): Promise<DatosPersonales | null> {
  try {
    const { data, error } = await supabase
      .from('datospersonalesusuarios')
      .select('*')
      .eq('uid', uid)
      .maybeSingle();

    if (error) return null;
    return data as DatosPersonales | null;
  } catch (error) {
    return null;
  }
}

export async function guardarDatosPersonales(
  datos: DatosPersonales
): Promise<{ error: string | null }> {
  try {
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('id, tipo_usuario, email')
      .eq('uid', datos.uid)
      .maybeSingle();

    if (usuario?.tipo_usuario === 'funcionario') {
      const nombreCompleto = [datos.nombres, datos.apellidos].filter(Boolean).join(' ');
      const rawRut = datos.rut ? limpiarRUT(datos.rut) : null;
      const funcData = {
        id_usuario: usuario.id,
        rut: rawRut ? formatoSimple(rawRut) : usuario.id,
        rut_formateado: rawRut ? formatearRUT(rawRut) : usuario.id.slice(0, 8),
        nombre_completo: nombreCompleto,
        domicilio: datos.direccion || 'Pendiente',
        comuna: datos.ciudad || 'Pendiente',
        celular: datos.telefono || '',
        correo_personal: datos.email_personal || '',
        correo_institucional: usuario.email || `temp_${usuario.id}`,
        tipo_funcionario: 'docente',
        tipo_contrato: 'plazo_fijo',
        asignatura: datos.asignatura,
        horas_contrato: datos.horas || 0,
        emergencia_nombre: datos.emergencia_nombre,
        emergencia_telefono: datos.emergencia_telefono,
        emergencia_parentesco: datos.emergencia_parentesco,
        vigente: true,
        tiene_licencia: false,
        tiene_permiso_admin: false,
        usuario_registrado_sistema: true,
        actualizado_en: new Date().toISOString(),
      };

      const { data: existente } = await supabase
        .from('funcionarios')
        .select('rut')
        .eq('id_usuario', usuario.id)
        .maybeSingle();

      if (existente) {
        const { error } = await supabase
          .from('funcionarios')
          .update(funcData)
          .eq('id_usuario', usuario.id);
        if (error) return { error: error.message };
      } else {
        const { error } = await supabase
          .from('funcionarios')
          .insert({ ...funcData, creado_en: new Date().toISOString() });
        if (error) return { error: error.message };
      }

      await supabase.from('usuarios').update({
        nombre: datos.nombres,
        apellidos: datos.apellidos,
      }).eq('uid', datos.uid);

      return { error: null };
    }

    const { error } = await supabase
      .from('datospersonalesusuarios')
      .upsert({
        ...datos,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'uid' });

    if (error) return { error: error.message };
    return { error: null };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Error desconocido' };
  }
}
