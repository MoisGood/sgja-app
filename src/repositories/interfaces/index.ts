import type { Solicitud, Estudiante } from '../../types';

export interface ISolicitudRepository {
  obtenerPorEstudiante(idEstudiante: string): Promise<Solicitud[]>;
  obtenerPorEstablecimiento(idEstablecimiento: string): Promise<Solicitud[]>;
  obtenerPaginadas(pagina: number, porPagina?: number): Promise<{ data: any[]; total: number }>;
}

export interface IEstudianteRepository {
  obtener(idEstudiante: string): Promise<Estudiante | null>;
  obtenerPorCurso(idEstablecimiento: string, curso: string): Promise<Estudiante[]>;
  obtenerDelEstablecimiento(idEstablecimiento: string): Promise<Estudiante[]>;
  crear(datos: any): Promise<{ error: string | null }>;
  actualizar(id: string, datos: Partial<Estudiante>): Promise<{ error: string | null }>;
  eliminar(id: string): Promise<{ error: string | null }>;
  verificarRutDuplicado(rut: string): Promise<boolean>;
  crearBatch(estudiantes: any[]): Promise<{ error: string | null }>;
  obtenerTodosLosCursos(idEstablecimiento: string): Promise<string[]>;
}

export interface IConfiguracionRepository {
  obtenerPermisosRol(idEstablecimiento: string, rol: string): Promise<string[]>;
  guardarPermisosRol(idEstablecimiento: string, rol: string, rutas: string[]): Promise<void>;
  obtenerTodasLasPaginas(): Promise<{ ruta: string; nombre: string; descripcion: string }[]>;
  obtenerRolesPersonalizados(idEstablecimiento: string): Promise<any[]>;
  crearRolPersonalizado(idEstablecimiento: string, nombreRol: string, descripcion: string): Promise<{ error: string | null }>;
  eliminarRolPersonalizado(idEstablecimiento: string, idRol: string): Promise<{ error: string | null }>;
  actualizarRolPersonalizado(idEstablecimiento: string, idRol: string, datos: any): Promise<{ error: string | null }>;
  obtenerJustificaciones(idEstablecimiento: string): Promise<any[]>;
  crearJustificacion(nombre: string, descripcion: string, idEstablecimiento: string): Promise<{ error: string | null }>;
  actualizarJustificacion(id: string, nombre: string, descripcion: string): Promise<{ error: string | null }>;
  eliminarJustificacion(id: string): Promise<{ error: string | null }>;
}
