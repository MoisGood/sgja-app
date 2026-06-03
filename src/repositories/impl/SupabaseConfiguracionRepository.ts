import { supabase } from '../../lib/supabase';
import type { IConfiguracionRepository } from '../interfaces/index';

export class SupabaseConfiguracionRepository implements IConfiguracionRepository {
  async obtenerPermisosRol(idEstablecimiento: string, rol: string): Promise<string[]> {
    const { data, error } = await supabase.from('configuracion').select('permisos').eq('rol', rol).eq('id_establecimiento', idEstablecimiento).single();
    if (error && error.code === 'PGRST116') return [];
    if (error) throw error;
    return Array.isArray(data?.permisos) ? data.permisos : [];
  }

  async guardarPermisosRol(idEstablecimiento: string, rol: string, rutas: string[]): Promise<void> {
    const { data: existente } = await supabase.from('configuracion').select('id').eq('rol', rol).eq('id_establecimiento', idEstablecimiento).maybeSingle();
    if (existente) {
      const { error } = await supabase.from('configuracion').update({ permisos: rutas, actualizado_en: new Date().toISOString() }).eq('id', existente.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('configuracion').insert({ rol, id_establecimiento: idEstablecimiento, permisos: rutas, actualizado_en: new Date().toISOString() });
      if (error) throw error;
    }
  }

  async obtenerTodasLasPaginas(): Promise<{ ruta: string; nombre: string; descripcion: string }[]> {
    return [
      { ruta: '/dashboard', nombre: 'Inicio', descripcion: 'Panel principal del dashboard' },
      { ruta: '/secretaria', nombre: 'Secretaría', descripcion: 'Gestión de secretaría' },
      { ruta: '/secretaria/ausentes', nombre: 'Ausentes', descripcion: 'Registro de ausencias de funcionarios' },
      { ruta: '/secretaria/enviar-correo', nombre: 'Enviar Correo', descripcion: 'Envío de correos a funcionarios' },
      { ruta: '/secretaria/plantillas-correo', nombre: 'Plantillas de Correo', descripcion: 'Gestión de plantillas para correos' },
      { ruta: '/secretaria/grupos-correo', nombre: 'Grupos de Correo', descripcion: 'Agrupación de destinatarios para correos' },
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
      { ruta: '/libros', nombre: 'Libros', descripcion: 'Mantenedor de libros' },
      { ruta: '/biblioteca', nombre: 'Biblioteca', descripcion: 'Acceso al módulo de biblioteca' },
      { ruta: '/catalogo', nombre: 'Catálogo', descripcion: 'Catálogo bibliográfico' },
      { ruta: '/prestamos', nombre: 'Préstamos', descripcion: 'Circulación y préstamos' },
      { ruta: '/inventario', nombre: 'Inventario', descripcion: 'Inventario físico de ejemplares' },
      { ruta: '/historial-biblioteca', nombre: 'Historial Biblioteca', descripcion: 'Historial de préstamos' },
      { ruta: '/config-biblioteca', nombre: 'Config. Biblioteca', descripcion: 'Configuración del módulo biblioteca' },
      { ruta: '/correos', nombre: 'Correos', descripcion: 'Configuración de envío de correos' },
      { ruta: '/sistema', nombre: 'Sistema', descripcion: 'Configuración de mantenimiento del sistema' },
      { ruta: '/tecnico', nombre: 'Técnico', descripcion: 'Soporte técnico y verificación del sistema' },
      { ruta: '/monitoreo-correos', nombre: 'Monitoreo Correos', descripcion: 'Monitoreo de envío de correos' },
      { ruta: '/monitoreo-fallos', nombre: 'Monitoreo Fallos', descripcion: 'Registro de fallos del sistema' },
    ];
  }

  async obtenerRolesPersonalizados(idEstablecimiento: string): Promise<any[]> {
    const predefinidos = ['ADMIN', 'INSPECTOR', 'PROFESOR', 'ESTUDIANTE', 'APODERADO'].map(n => ({
      id_rol: n, id_establecimiento: idEstablecimiento, nombre_rol: n,
      descripcion: n === 'ADMIN' ? 'Administrador' : n === 'INSPECTOR' ? 'Inspector' : n === 'PROFESOR' ? 'Profesor' : n === 'ESTUDIANTE' ? 'Estudiante' : 'Apoderado',
      activo: true, creado_en: new Date('2000-01-01'), actualizado_en: new Date('2000-01-01'),
    }));
    const { data, error } = await supabase.from('roles_personalizados').select('*').eq('id_establecimiento', idEstablecimiento).eq('activo', true);
    if (error && error.code !== 'PGRST116') throw error;
    const personalizados = (data || []) as any[];
    for (const r of personalizados) { if (!predefinidos.find(p => p.nombre_rol.toUpperCase() === r.nombre_rol.toUpperCase())) predefinidos.push(r); }
    return predefinidos;
  }

  async crearRolPersonalizado(idEstablecimiento: string, nombreRol: string, descripcion: string): Promise<{ error: string | null }> {
    const { error } = await supabase.from('roles_personalizados').insert({ id_establecimiento: idEstablecimiento, nombre_rol: nombreRol.toUpperCase(), descripcion, activo: true });
    if (error) return { error: error.message };
    return { error: null };
  }

  async eliminarRolPersonalizado(idEstablecimiento: string, idRol: string): Promise<{ error: string | null }> {
    const { error } = await supabase.from('roles_personalizados').update({ activo: false }).eq('id_rol', idRol).eq('id_establecimiento', idEstablecimiento);
    if (error) return { error: error.message };
    return { error: null };
  }

  async actualizarRolPersonalizado(idEstablecimiento: string, idRol: string, datos: any): Promise<{ error: string | null }> {
    const updateData: Record<string, unknown> = { actualizado_en: new Date().toISOString() };
    if (datos.nombre_rol !== undefined) updateData.nombre_rol = datos.nombre_rol.toUpperCase();
    if (datos.descripcion !== undefined) updateData.descripcion = datos.descripcion;
    const { error } = await supabase.from('roles_personalizados').update(updateData).eq('id_rol', idRol).eq('id_establecimiento', idEstablecimiento);
    if (error) return { error: error.message };
    return { error: null };
  }

  async obtenerJustificaciones(idEstablecimiento: string): Promise<any[]> {
    const { data, error } = await supabase.from('justification_types').select('*').eq('id_establecimiento', idEstablecimiento).eq('activo', true).order('nombre');
    if (error) throw error;
    return (data || []) as any[];
  }

  async crearJustificacion(nombre: string, descripcion: string, idEstablecimiento: string): Promise<{ error: string | null }> {
    const { error } = await supabase.from('justification_types').insert({ nombre, descripcion, id_establecimiento: idEstablecimiento });
    if (error) return { error: error.message };
    return { error: null };
  }

  async actualizarJustificacion(id: string, nombre: string, descripcion: string): Promise<{ error: string | null }> {
    const { error } = await supabase.from('justification_types').update({ nombre, descripcion, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) return { error: error.message };
    return { error: null };
  }

  async eliminarJustificacion(id: string): Promise<{ error: string | null }> {
    const { error } = await supabase.from('justification_types').update({ activo: false }).eq('id', id);
    if (error) return { error: error.message };
    return { error: null };
  }
}
