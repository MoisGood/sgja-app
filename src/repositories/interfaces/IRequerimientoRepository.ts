import type { Requerimiento } from '../../types';

export interface IRequerimientoRepository {
  obtenerTodos(idEstablecimiento: string): Promise<Requerimiento[]>;
  obtener(id: string): Promise<Requerimiento | null>;
  crear(r: Omit<Requerimiento, 'id' | 'created_at' | 'updated_at'>): Promise<Requerimiento>;
  actualizar(id: string, datos: Partial<Requerimiento>): Promise<void>;
  eliminar(id: string): Promise<void>;
}
