import type { Equipo } from '../../types';

export interface IEquipoRepository {
  obtenerTodos(idEstablecimiento: string): Promise<Equipo[]>;
  obtenerPorLugar(idLugar: string): Promise<Equipo[]>;
  obtener(id: string): Promise<Equipo | null>;
  crear(equipo: Omit<Equipo, 'id' | 'created_at' | 'updated_at'>): Promise<Equipo>;
  actualizar(id: string, datos: Partial<Equipo>): Promise<void>;
  eliminar(id: string): Promise<void>;
}
