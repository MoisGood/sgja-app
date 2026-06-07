import { supabase } from '../lib/supabase';

export async function guardarPermisosRol(
  idEstablecimiento: string,
  rol: string,
  rutas: string[]
): Promise<void> {
  try {
    console.log('[ConfigDB] Guardando permisos:', { rol, idEstablecimiento, rutas: rutas.length });

    const { data: existente } = await supabase
      .from('configuracion')
      .select('id')
      .eq('rol', rol)
      .eq('id_establecimiento', idEstablecimiento)
      .maybeSingle();

    if (existente) {
      const { error } = await supabase
        .from('configuracion')
        .update({
          permisos: rutas,
          actualizado_en: new Date().toISOString(),
        })
        .eq('id', existente.id);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('configuracion')
        .insert({
          rol,
          id_establecimiento: idEstablecimiento,
          permisos: rutas,
          actualizado_en: new Date().toISOString(),
        });

      if (error) throw error;
    }

    console.log('[ConfigDB] Permisos guardados OK');
  } catch (error) {
    console.error('Error al guardar permisos:', error);
    throw error;
  }
}

export async function obtenerPermisosRol(
  idEstablecimiento: string,
  rol: string
): Promise<string[]> {
  try {
    console.log('[ConfigDB] Obteniendo permisos:', { rol, idEstablecimiento });
    const { data, error } = await supabase
      .from('configuracion')
      .select('permisos')
      .eq('rol', rol)
      .eq('id_establecimiento', idEstablecimiento)
      .single();

    if (error && error.code === 'PGRST116') {
      console.log('[ConfigDB] No hay permisos configurados (PGRST116)');
      return [];
    }
    if (error) {
      console.error('[ConfigDB] Error:', error);
      throw error;
    }
    console.log('[ConfigDB] Permisos obtenidos:', data?.permisos);
    return Array.isArray(data?.permisos) ? data.permisos : [];
  } catch (error) {
    console.error('Error al obtener permisos:', error);
    return [];
  }
}

export interface RolPersonalizado {
  id_rol: string;
  id_establecimiento: string;
  nombre_rol: string;
  descripcion: string;
  activo: boolean;
  creado_en: Date;
  actualizado_en: Date;
}

export async function obtenerRolesPersonalizados(
  idEstablecimiento: string
): Promise<RolPersonalizado[]> {
  const ROLES_PREDEFINIDOS: RolPersonalizado[] = [
    {
      id_rol: 'ADMIN',
      id_establecimiento: idEstablecimiento,
      nombre_rol: 'ADMIN',
      descripcion: 'Administrador del establecimiento',
      activo: true,
      creado_en: new Date('2000-01-01'),
      actualizado_en: new Date('2000-01-01'),
    },
    {
      id_rol: 'INSPECTOR',
      id_establecimiento: idEstablecimiento,
      nombre_rol: 'INSPECTOR',
      descripcion: 'Inspector de convivencia',
      activo: true,
      creado_en: new Date('2000-01-01'),
      actualizado_en: new Date('2000-01-01'),
    },
    {
      id_rol: 'PROFESOR',
      id_establecimiento: idEstablecimiento,
      nombre_rol: 'PROFESOR',
      descripcion: 'Profesor de la institución',
      activo: true,
      creado_en: new Date('2000-01-01'),
      actualizado_en: new Date('2000-01-01'),
    },
    {
      id_rol: 'ESTUDIANTE',
      id_establecimiento: idEstablecimiento,
      nombre_rol: 'ESTUDIANTE',
      descripcion: 'Estudiante de la institución',
      activo: true,
      creado_en: new Date('2000-01-01'),
      actualizado_en: new Date('2000-01-01'),
    },
    {
      id_rol: 'APODERADO',
      id_establecimiento: idEstablecimiento,
      nombre_rol: 'APODERADO',
      descripcion: 'Apoderado de estudiante',
      activo: true,
      creado_en: new Date('2000-01-01'),
      actualizado_en: new Date('2000-01-01'),
    },
  ];

  try {
    const { data, error } = await supabase
      .from('roles_personalizados')
      .select('*')
      .eq('id_establecimiento', idEstablecimiento)
      .eq('activo', true);

    if (error && error.code !== 'PGRST116') throw error;

    const rolesPersonalizados = (data || []) as RolPersonalizado[];
    const todoRoles = [...ROLES_PREDEFINIDOS];

    for (const rol of rolesPersonalizados) {
      if (!todoRoles.find(r => r.nombre_rol.toUpperCase() === rol.nombre_rol.toUpperCase())) {
        todoRoles.push(rol);
      }
    }

    return todoRoles;
  } catch (error) {
    console.error('Error al obtener roles personalizados:', error);
    return ROLES_PREDEFINIDOS;
  }
}

export async function crearRolPersonalizado(
  idEstablecimiento: string,
  nombreRol: string,
  descripcion: string
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('roles_personalizados')
      .insert({
        id_establecimiento: idEstablecimiento,
        nombre_rol: nombreRol.toUpperCase(),
        descripcion: descripcion || '',
        activo: true,
      });

    if (error) return { error: error.message };
    return { error: null };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Error desconocido' };
  }
}

export async function eliminarRolPersonalizado(
  idEstablecimiento: string,
  idRol: string
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('roles_personalizados')
      .update({ activo: false })
      .eq('id_rol', idRol)
      .eq('id_establecimiento', idEstablecimiento);

    if (error) return { error: error.message };
    return { error: null };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Error desconocido' };
  }
}

export async function actualizarRolPersonalizado(
  idEstablecimiento: string,
  idRol: string,
  datos: { nombre_rol?: string; descripcion?: string }
): Promise<{ error: string | null }> {
  try {
    const updateData: Record<string, unknown> = { actualizado_en: new Date().toISOString() };
    if (datos.nombre_rol !== undefined) updateData.nombre_rol = datos.nombre_rol.toUpperCase();
    if (datos.descripcion !== undefined) updateData.descripcion = datos.descripcion;

    const { error } = await supabase
      .from('roles_personalizados')
      .update(updateData)
      .eq('id_rol', idRol)
      .eq('id_establecimiento', idEstablecimiento);

    if (error) return { error: error.message };
    return { error: null };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Error desconocido' };
  }
}
