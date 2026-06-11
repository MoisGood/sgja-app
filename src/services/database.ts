// ============================================================
// SGJA – Barrel de Servicios de Base de Datos
// src/services/database.ts
// ============================================================
// Re-exports from domain-specific service files.
// Import from this file for backward compatibility.

export {
  obtenerUsuario,
  obtenerProfesoresDelEstablecimiento,
  obtenerTodosLosUsuarios,
  crearUsuario,
  crearUsuarioConAutenticacion,
  asignarRolAUsuario,
  actualizarUsuario,
  eliminarUsuario,
  eliminarUsuarioPermanente,
  obtenerUsuariosPorEstablecimientoTodos,
} from './usuarios.service';

export {
  obtenerEstudiante,
  obtenerEstudiantesPorCurso,
  obtenerEstudiantesDelEstablecimiento,
  obtenerEstudiantesPorApoderado,
  crearEstudiante,
  actualizarEstudiante,
  eliminarEstudiante,
  verificarRutDuplicado,
  verificarRutsDuplicados,
  crearEstudiantesBatch,
  obtenerTodosLosCursos,
} from './estudiantes.service';

export {
  obtenerSolicitud,
  obtenerSolicitudesPorEstudiante,
  obtenerSolicitudesDelEstablecimiento,
  crearSolicitud,
  eliminarSolicitudesInjustificadas,
  justificarSolicitud,
  actualizarEstadoSolicitud,
  actualizarSolicitud,
  eliminarSolicitudPorId,
} from './solicitudes.service';

export {
  obtenerEstablecimiento,
  actualizarEstablecimiento,
  obtenerTodosLosEstablecimientos,
  buscarEstablecimientos,
} from './establecimientos.service';

export type { Parametros } from './parametros.service';
export {
  obtenerParametrosDelEstablecimiento,
  crearParametros,
  actualizarParametros,
} from './parametros.service';

export {
  obtenerBloquesHorarios,
  crearBloqueHorario,
  actualizarBloqueHorario,
  eliminarBloqueHorario,
} from './bloques-horario.service';

export type { RolPersonalizado } from './roles.service';
export {
  guardarPermisosRol,
  obtenerPermisosRol,
  obtenerRolesPersonalizados,
  crearRolPersonalizado,
  eliminarRolPersonalizado,
  actualizarRolPersonalizado,
} from './roles.service';

export type { SolicitudRegistro, DatosPersonales } from './registro.service';
export {
  enviarSolicitudRegistro,
  obtenerSolicitudPorUid,
  obtenerSolicitudesPendientes,
  aprobarSolicitud,
  rechazarSolicitud,
  obtenerSolicitudesPaginadas,
  obtenerDatosPersonales,
  obtenerDatosPersonalesPorUid,
  guardarDatosPersonales,
} from './registro.service';

export {
  obtenerTokenQR,
  crearTokenQR,
  actualizarTokenQR,
} from './tokens-qr.service';

export {
  obtenerMotivosDelEstablecimiento,
  crearMotivo,
  crearMotivoJustificacion,
  actualizarMotivoJustificacion,
  eliminarMotivoJustificacion,
} from './motivos.service';

export {
  obtenerCursosDelEstablecimiento,
  obtenerUltimasSolicitudes,
} from './estadisticas.service';

export type { PermisosPagina } from './paginas.service';
export {
  obtenerTodasLasPaginas,
} from './paginas.service';

export {
  validarTicket,
  crearRequerimiento,
} from './requerimiento.service';

export {
  escucharSolicitudesInjustificadas,
  escucharSolicitudesJustificadas,
} from './realtime.service';

export {
  guardarRegistroBloqueProfesor,
  obtenerRegistrosBloqueProfesor,
} from './registros-bloque.service';

export {
  obtenerJustificaciones,
  crearJustificacion,
  actualizarJustificacion,
  eliminarJustificacion,
} from './justificaciones.service';
