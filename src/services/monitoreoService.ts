import { supabase } from '../lib/supabase';
import { getEstadoMantenimientoCache } from './mantenimientoService';

export async function logCorreo(
  tipo: string,
  destinatario: string,
  estudianteId: string | null,
  libro: string | null,
  estado: 'exito' | 'falla',
  error: string | null,
  idEstablecimiento: string
): Promise<void> {
  const mtto = getEstadoMantenimientoCache();
  if (mtto?.activo) return;
  try {
    await supabase.from('monitoreo_correos').insert({
      tipo,
      destinatario,
      estudiante_id: estudianteId,
      libro,
      estado,
      error,
      id_establecimiento: idEstablecimiento,
    });
  } catch (e) {
    console.error('Error al loguear correo:', e);
  }
}

export async function logAccion(
  accion: string,
  entidad: string,
  estado: 'exito' | 'falla',
  detalle: string | null,
  usuarioId: string,
  idEstablecimiento: string
): Promise<void> {
  const mtto = getEstadoMantenimientoCache();
  if (mtto?.activo) return;
  try {
    await supabase.from('monitoreo_logs').insert({
      accion,
      entidad,
      estado,
      detalle,
      usuario_id: usuarioId,
      id_establecimiento: idEstablecimiento,
    });
  } catch (e) {
    console.error('Error al loguear accion:', e);
  }
}
