import type { Usuario } from '../../types';

export interface IUsuarioRepository {
  obtenerTodos(idEstablecimiento: string): Promise<Usuario[]>;
  obtener(uid: string): Promise<Usuario | null>;
  actualizar(uid: string, datos: Partial<Usuario>): Promise<void>;
  eliminar(uid: string): Promise<void>;
  crearConAutenticacion(email: string, nombre: string, rol: string, idEstablecimiento: string): Promise<string | null>;
  obtenerDatosPersonales(uid: string): Promise<any | null>;
  guardarDatosPersonales(datos: any): Promise<{ error: string | null }>;
  asignarEstablecimiento(uid: string, idEstablecimiento: string | null): Promise<string | null>;
}
