export interface PermisosPagina {
  ruta: string;
  nombre: string;
  descripcion: string;
}

export function obtenerTodasLasPaginas(): PermisosPagina[] {
  return [
    { ruta: '/dashboard', nombre: 'Inicio', descripcion: 'Panel principal del dashboard' },
    { ruta: '/secretaria', nombre: 'Secretaría', descripcion: 'Gestión de secretaría' },
    { ruta: '/secretaria/ausentes', nombre: 'Ausentes', descripcion: 'Registro de ausencias de funcionarios' },
    { ruta: '/secretaria/enviar-correo', nombre: 'Enviar Correo', descripcion: 'Envío de correos a funcionarios' },

    { ruta: '/mantenedor-funcionarios', nombre: 'Funcionarios', descripcion: 'Mantenedor de funcionarios' },
    { ruta: '/justificaciones', nombre: 'Justificaciones', descripcion: 'Panel de justificaciones' },
    { ruta: '/registrar', nombre: 'Registrar', descripcion: 'Registrar justificación' },
    { ruta: '/ver-justificaciones', nombre: 'Ver Justificaciones', descripcion: 'Listado de justificaciones' },
    { ruta: '/gestion-pases', nombre: 'Gestión de Pases', descripcion: 'Administrar pases' },
    { ruta: '/seguridad', nombre: 'Seguridad', descripcion: 'Configuración de seguridad' },
    { ruta: '/configuracion', nombre: 'Configuración', descripcion: 'Panel de configuración' },
    { ruta: '/en-linea', nombre: 'En Línea', descripcion: 'Usuarios en línea' },
    { ruta: '/gestion-usuarios', nombre: 'Gestión Usuarios', descripcion: 'Administrar usuarios' },
    { ruta: '/mantenedor-estudiantes', nombre: 'Mantenedor Estudiantes', descripcion: 'CRUD de estudiantes' },
    { ruta: '/mantenedor-roles', nombre: 'Mantenedor de Roles', descripcion: 'Administrar roles' },
    { ruta: '/mantenedor-motivos', nombre: 'Motivos de Justificación', descripcion: 'Motivos de justificación' },
    { ruta: '/solicitudes-registro', nombre: 'Solicitudes de Registro', descripcion: 'Solicitudes de registro de usuarios' },
    { ruta: '/parametros', nombre: 'Parámetros', descripcion: 'Parámetros del sistema' },
    { ruta: '/asignar-permisos', nombre: 'Asignar Accesos', descripcion: 'Asignar accesos por rol' },
    { ruta: '/bloque-horario', nombre: 'Bloques Horarios', descripcion: 'Bloques de horario' },
    { ruta: '/reportes', nombre: 'Reportes', descripcion: 'Reportes del sistema' },
    { ruta: '/mantenedor-cursos', nombre: 'Mantenedor Cursos', descripcion: 'CRUD de cursos' },
    { ruta: '/biblioteca', nombre: 'Biblioteca', descripcion: 'Acceso al módulo de biblioteca' },
    { ruta: '/libros', nombre: 'Libros', descripcion: 'Mantenedor de libros' },
    { ruta: '/catalogo', nombre: 'Catálogo', descripcion: 'Catálogo bibliográfico' },
    { ruta: '/prestamos', nombre: 'Préstamos', descripcion: 'Circulación y préstamos' },
    { ruta: '/inventario', nombre: 'Inventario', descripcion: 'Inventario físico de ejemplares' },
    { ruta: '/historial-biblioteca', nombre: 'Historial Biblioteca', descripcion: 'Historial de préstamos' },
    { ruta: '/config-biblioteca', nombre: 'Config. Biblioteca', descripcion: 'Configuración del módulo biblioteca' },
    { ruta: '/correos', nombre: 'Correos', descripcion: 'Configuración de envío de correos' },
    { ruta: '/sistema', nombre: 'Sistema', descripcion: 'Configuración de mantenimiento del sistema' },
    { ruta: '/tecnico', nombre: 'Técnico', descripcion: 'Panel principal del módulo técnico' },
    { ruta: '/tecnico/mapa', nombre: 'Mapa', descripcion: 'Mapa interactivo con equipos por piso' },
    { ruta: '/tecnico/equipos', nombre: 'Equipos', descripcion: 'CRUD de equipos del establecimiento' },
    { ruta: '/tecnico/ubicaciones', nombre: 'Ubicaciones', descripcion: 'Gestión de ubicaciones y lugares' },
    { ruta: '/tecnico/requerimientos', nombre: 'Requerimientos', descripcion: 'Solicitudes de soporte técnico' },
    { ruta: '/tecnico/accesos', nombre: 'Accesos Rápidos', descripcion: 'Atajos y generación de códigos QR' },
    { ruta: '/tecnico/menu', nombre: 'Menú Técnico', descripcion: 'Menú principal del módulo técnico' },
    { ruta: '/tecnico/m/mapa', nombre: 'Mapa Móvil', descripcion: 'Mapa y lugares versión móvil' },
    { ruta: '/tecnico/m/equipos', nombre: 'Equipos Móvil', descripcion: 'Administrar equipos versión móvil' },
    { ruta: '/tecnico/m/ubicaciones', nombre: 'Ubicaciones Móvil', descripcion: 'Ubicaciones versión móvil' },
    { ruta: '/tecnico/m/config', nombre: 'Config Móvil', descripcion: 'Configuración técnica versión móvil' },
    { ruta: '/tecnico/configuracion', nombre: 'Config. Técnico', descripcion: 'Configuración de catálogos técnicos' },
    { ruta: '/tecnico/qr', nombre: 'Redirigir QR', descripcion: 'Redirección por código QR' },
    { ruta: '/ticket', nombre: 'Ticket Técnico', descripcion: 'Crear y cerrar tickets de soporte' },
    { ruta: '/monitoreo-correos', nombre: 'Monitoreo Correos', descripcion: 'Monitoreo de envío de correos' },
    { ruta: '/monitoreo-fallos', nombre: 'Monitoreo Fallos', descripcion: 'Registro de fallos del sistema' },
  ];
}
