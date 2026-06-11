import { supabase } from '../lib/supabase';

export interface CrearRequerimientoParams {
  idEstablecimiento: string;
  idLugar: string;
  idEquipo?: string | null;
  idSolicitante: string;
  tipoReq: string;
  descripcion: string;
  posibleFalla?: string | null;
  diagnostico?: string | null;
  prioridad: string;
  estado?: string;
  fechaSolicitud?: string;
  observaciones?: string | null;
  lugarSoporte?: boolean;
}

export interface ValidarTicketParams {
  equipo?: { id: string; estado: string; id_usuario?: string | null } | null;
  posibleFalla: string;
  solicitanteId: string;
  lugarSoporte?: boolean;
}

export type ErrorValidacion =
  | { type: 'bloqueante'; mensaje: string }
  | { type: 'advertencia'; mensaje: string }
  | null;

async function generarCodigoTicket(idEstablecimiento: string, lugarId: string): Promise<string> {
  const { data: lugar } = await supabase.from('lugares').select('abreviatura').eq('id', lugarId).single();
  const abrev = (lugar?.abreviatura || 'XX').toUpperCase();

  const { count: countLugar } = await supabase
    .from('requerimientos').select('*', { count: 'exact', head: true })
    .eq('id_lugar', lugarId).eq('activo', true);
  const seqLugar = ((countLugar || 0) + 1).toString().padStart(2, '0');

  const { count: countTotal } = await supabase
    .from('requerimientos').select('*', { count: 'exact', head: true })
    .eq('id_establecimiento', idEstablecimiento).eq('activo', true);
  const seqTotal = ((countTotal || 0) + 1).toString().padStart(3, '0');

  return `${abrev}${seqLugar}-${seqTotal}`;
}

export async function validarTicket(params: ValidarTicketParams): Promise<ErrorValidacion> {
  const { equipo, posibleFalla, solicitanteId, lugarSoporte } = params;

  if (equipo) {
    if (equipo.estado === 'Baja') {
      return { type: 'bloqueante', mensaje: 'El equipo está dado de baja. No se puede crear un ticket.' };
    }
    if (!equipo.id_usuario) {
      return { type: 'advertencia', mensaje: 'El equipo no tiene un usuario responsable asignado. Asigna uno antes de crear el ticket.' };
    }
    const { data: usr } = await supabase.from('usuarios').select('activo').eq('id', equipo.id_usuario).maybeSingle();
    if (usr && !usr.activo) {
      return { type: 'advertencia', mensaje: 'El usuario responsable del equipo está inactivo.' };
    }
    if (posibleFalla?.trim()) {
      const { data: dup } = await supabase
        .from('requerimientos')
        .select('id')
        .eq('id_equipo', equipo.id)
        .in('estado', ['Pendiente', 'En Proceso'])
        .eq('activo', true)
        .ilike('posible_falla', `%${posibleFalla.trim()}%`)
        .limit(1);
      if (dup && dup.length > 0) {
        return { type: 'bloqueante', mensaje: 'Ya hay un ticket abierto para este equipo con una falla similar.' };
      }
    }
  }

  if (lugarSoporte === false) {
    return { type: 'advertencia', mensaje: 'Este lugar no tiene soporte activo.' };
  }

  const { count: userTicketCount } = await supabase
    .from('requerimientos').select('*', { count: 'exact', head: true })
    .eq('id_solicitante', solicitanteId).in('estado', ['Pendiente', 'En Proceso']).eq('activo', true);
  if ((userTicketCount || 0) >= 3) {
    return { type: 'advertencia', mensaje: 'El usuario ya tiene 3 o más tickets abiertos.' };
  }

  return null;
}

export async function crearRequerimiento(params: CrearRequerimientoParams): Promise<{ error?: string; codigo?: string }> {
  try {
    const codigo = await generarCodigoTicket(params.idEstablecimiento, params.idLugar);

    const payload: Record<string, any> = {
      id_establecimiento: params.idEstablecimiento,
      id_lugar: params.idLugar,
      id_equipo: params.idEquipo || null,
      id_solicitante: params.idSolicitante,
      tipo_requerimiento: params.tipoReq,
      descripcion: params.descripcion,
      posible_falla: params.posibleFalla || null,
      diagnostico: params.diagnostico || null,
      prioridad: params.prioridad,
      estado: params.estado || 'En Proceso',
      fecha_solicitud: params.fechaSolicitud || new Date().toISOString().split('T')[0],
      observaciones: params.observaciones || null,
      codigo,
    };

    const { error } = await supabase.rpc('insertar_requerimiento', {
      p_id_establecimiento: payload.id_establecimiento,
      p_id_lugar: payload.id_lugar,
      p_id_equipo: payload.id_equipo,
      p_id_solicitante: payload.id_solicitante,
      p_tipo_requerimiento: payload.tipo_requerimiento,
      p_descripcion: payload.descripcion,
      p_posible_falla: payload.posible_falla,
      p_diagnostico: payload.diagnostico,
      p_prioridad: payload.prioridad,
      p_estado: payload.estado,
      p_fecha_solicitud: payload.fecha_solicitud,
      p_codigo: codigo,
    });

    if (error) {
      const { error: ie } = await supabase.from('requerimientos').insert(payload);
      if (ie) return { error: ie.message };
    }

    return { codigo };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Error desconocido al crear requerimiento' };
  }
}
