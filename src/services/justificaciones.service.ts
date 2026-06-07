import { SupabaseConfiguracionRepository } from '../repositories/impl/SupabaseConfiguracionRepository';

const _configRepo = new SupabaseConfiguracionRepository();

export async function obtenerJustificaciones(idEstablecimiento: string): Promise<any[]> {
  return _configRepo.obtenerJustificaciones(idEstablecimiento);
}
export async function crearJustificacion(nombre: string, descripcion: string, idEstablecimiento: string): Promise<{ error: string | null }> {
  return _configRepo.crearJustificacion(nombre, descripcion, idEstablecimiento);
}
export async function actualizarJustificacion(id: string, nombre: string, descripcion: string): Promise<{ error: string | null }> {
  return _configRepo.actualizarJustificacion(id, nombre, descripcion);
}
export async function eliminarJustificacion(id: string): Promise<{ error: string | null }> {
  return _configRepo.eliminarJustificacion(id);
}
