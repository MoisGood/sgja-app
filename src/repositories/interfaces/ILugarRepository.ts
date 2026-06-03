import type { Lugar } from '../../types';

export interface ILugarRepository {
  obtenerPorPiso(piso: number, idEstablecimiento: string): Promise<Lugar[]>;
  obtenerTodos(idEstablecimiento: string): Promise<Lugar[]>;
  obtener(id: string): Promise<Lugar | null>;
  crear(lugar: Omit<Lugar, 'id' | 'created_at' | 'updated_at'>): Promise<Lugar>;
  actualizar(id: string, datos: Partial<Lugar>): Promise<void>;
  eliminar(id: string): Promise<void>;
  upsertDesdeJSON(items: Omit<Lugar, 'id' | 'created_at' | 'updated_at'>[]): Promise<{ insertados: number; actualizados: number }>;
}
