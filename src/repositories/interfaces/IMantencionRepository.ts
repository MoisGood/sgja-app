import type { Mantencion } from '../../types';

export interface IMantencionRepository {
  obtenerPorEquipo(idEquipo: string): Promise<Mantencion[]>;
  obtener(id: string): Promise<Mantencion | null>;
  crear(m: Omit<Mantencion, 'id' | 'created_at'>): Promise<Mantencion>;
  eliminar(id: string): Promise<void>;
}
