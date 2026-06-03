// ============================================================
// SGJA – Mantenedor de Roles Personalizados
// src/components/MantenedorRoles.tsx
// ============================================================

import { useState, useEffect } from 'react';
import type { RolPersonalizado } from '../services/database';
import {
  obtenerRolesPersonalizados,
  crearRolPersonalizado,
  eliminarRolPersonalizado,
  actualizarRolPersonalizado,
} from '../services/database';

interface Props {
  idEstablecimiento: string;
  onRolesActualizados?: (roles: RolPersonalizado[]) => void;
}

// Roles predefinidos del sistema (no se pueden crear ni eliminar)
const ROLES_PREDEFINIDOS = ['ADMIN', 'INSPECTOR', 'PROFESOR', 'ESTUDIANTE', 'APODERADO'];

export function MantenedorRoles({ idEstablecimiento, onRolesActualizados }: Props) {
  const [rolesPersonalizados, setRolesPersonalizados] = useState<RolPersonalizado[]>([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [nombreRol, setNombreRol] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [editandoRol, setEditandoRol] = useState<RolPersonalizado | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editDescripcion, setEditDescripcion] = useState('');
  const [rolesEnUso] = useState<Record<string, boolean>>({});
  const [rolesTienePaginas] = useState<Record<string, boolean>>({});

  // Cargar roles personalizados
  useEffect(() => {
    const loadRoles = async () => {
      try {
        setCargando(true);
        setError(null);
        const roles = await obtenerRolesPersonalizados(idEstablecimiento);
        setRolesPersonalizados(roles);

        // TODO: Verificar cuáles están en uso y cuáles tienen páginas asignadas
        // const enUso: Record<string, boolean> = {};
        // const conPaginas: Record<string, boolean> = {};
        // for (const rol of roles) {
        //   enUso[rol.id_rol] = await verificarRolEnUso(idEstablecimiento, rol.id_rol);
        //   conPaginas[rol.id_rol] = await verificarRolTienePaginasAsignadas(idEstablecimiento, rol.id_rol);
        // }
        // setRolesEnUso(enUso);
        // setRolesTienePaginas(conPaginas);

        if (onRolesActualizados) {
          onRolesActualizados(roles);
        }
      } catch (err) {
        setError('Error al cargar roles');
        console.error(err);
      } finally {
        setCargando(false);
      }
    };
    loadRoles();
  }, [idEstablecimiento, onRolesActualizados]);

  const cargarRoles = async () => {
    try {
      setCargando(true);
      setError(null);
      const roles = await obtenerRolesPersonalizados(idEstablecimiento);
      setRolesPersonalizados(roles);

      // TODO: Verificar cuáles están en uso y cuáles tienen páginas asignadas
      // const enUso: Record<string, boolean> = {};
      // const conPaginas: Record<string, boolean> = {};
      // for (const rol of roles) {
      //   enUso[rol.id_rol] = await verificarRolEnUso(idEstablecimiento, rol.id_rol);
      //   conPaginas[rol.id_rol] = await verificarRolTienePaginasAsignadas(idEstablecimiento, rol.id_rol);
      // }
      // setRolesEnUso(enUso);
      // setRolesTienePaginas(conPaginas);

      if (onRolesActualizados) {
        onRolesActualizados(roles);
      }
    } catch (err) {
      setError('Error al cargar roles');
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  const handleAgregarRol = async () => {
    if (!nombreRol.trim()) {
      setError('El nombre del rol es requerido');
      return;
    }

    // Verificar que no sea un rol predefinido
    if (ROLES_PREDEFINIDOS.includes(nombreRol.toUpperCase())) {
      setError(`"${nombreRol}" es un rol predefinido y no puede ser recreado`);
      return;
    }

    // Verificar que no sea duplicado
    if (rolesPersonalizados.some(r => r.nombre_rol.toUpperCase() === nombreRol.toUpperCase())) {
      setError(`El rol "${nombreRol}" ya existe`);
      return;
    }

    try {
      setCargando(true);
      setError(null);

      const res = await crearRolPersonalizado(idEstablecimiento, nombreRol, descripcion);
      if (res.error) {
        setError(res.error);
        setCargando(false);
        return;
      }

      setExito(`Rol "${nombreRol}" creado exitosamente ✅`);
      setNombreRol('');
      setDescripcion('');
      setMostrarFormulario(false);

      await cargarRoles();

      setTimeout(() => setExito(null), 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al crear rol';
      setError(errorMsg);
    } finally {
      setCargando(false);
    }
  };

  const handleEliminarRol = async (idRol: string, nombreRol: string) => {
    // Verificar si tiene páginas asignadas
    if (rolesTienePaginas[idRol]) {
      setError(`⚠️ No puedo eliminarlo "${nombreRol}" porque tiene páginas asignadas en la configuración de permisos. ¡Burro! 😏`);
      return;
    }

    if (rolesEnUso[idRol]) {
      setError(`No se puede eliminar "${nombreRol}" porque está en uso por usuarios`);
      return;
    }

    if (!window.confirm(`¿Estás seguro de eliminar el rol "${nombreRol}"?`)) {
      return;
    }

    try {
      setCargando(true);
      setError(null);

      const res = await eliminarRolPersonalizado(idEstablecimiento, idRol);
      if (res.error) {
        setError(res.error);
        setCargando(false);
        return;
      }

      setExito(`Rol "${nombreRol}" eliminado ✅`);
      await cargarRoles();

      setTimeout(() => setExito(null), 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al eliminar rol';
      setError(errorMsg);
    } finally {
      setCargando(false);
    }
  };

  const handleIniciarEdicion = (rol: RolPersonalizado) => {
    if (ROLES_PREDEFINIDOS.includes(rol.nombre_rol.toUpperCase())) return;
    setEditandoRol(rol);
    setEditNombre(rol.nombre_rol);
    setEditDescripcion(rol.descripcion || '');
    setError(null);
  };

  const handleGuardarEdicion = async () => {
    if (!editandoRol || !editNombre.trim()) return;

    try {
      setCargando(true);
      setError(null);

      const res = await actualizarRolPersonalizado(idEstablecimiento, editandoRol.id_rol, {
        nombre_rol: editNombre.trim(),
        descripcion: editDescripcion,
      });
      if (res.error) {
        setError(res.error);
        setCargando(false);
        return;
      }

      setExito(`Rol "${editNombre.trim()}" actualizado ✅`);
      setEditandoRol(null);
      await cargarRoles();
      setTimeout(() => setExito(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar rol');
    } finally {
      setCargando(false);
    }
  };

  const handleCancelarEdicion = () => {
    setEditandoRol(null);
    setEditNombre('');
    setEditDescripcion('');
  };

  return (
    <div
      style={{
        background: 'white',
        borderRadius: '8px',
        padding: '1.5rem',
        marginBottom: '2rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      }}
    >
      <div style={{ marginBottom: '1rem' }}>
        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem', fontWeight: 600 }}>
          👥 Mantenedor de Roles
        </h3>
        <p style={{ margin: 0, color: '#666', fontSize: '0.875rem' }}>
          Crea y gestiona roles personalizados para tu establecimiento
        </p>
      </div>

      {/* Mensajes */}
      {error && (
        <div
          style={{
            background: '#fee2e2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '0.75rem',
            borderRadius: '4px',
            marginBottom: '1rem',
            fontSize: '0.875rem',
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {exito && (
        <div
          style={{
            background: '#dcfce7',
            border: '1px solid #bbf7d0',
            color: '#16a34a',
            padding: '0.75rem',
            borderRadius: '4px',
            marginBottom: '1rem',
            fontSize: '0.875rem',
          }}
        >
          {exito}
        </div>
      )}

      {/* Roles Predefinidos */}
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#666' }}>
          🔒 Roles Predefinidos del Sistema:
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {ROLES_PREDEFINIDOS.map((rol) => (
            <span
              key={rol}
              style={{
                background: '#e0e7ff',
                color: '#4338ca',
                padding: '0.375rem 0.75rem',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: 600,
              }}
            >
              {rol}
            </span>
          ))}
        </div>
      </div>

      {/* Botón Agregar Rol */}
      {!mostrarFormulario && (
        <button type="button" 
          onClick={() => setMostrarFormulario(true)}
          disabled={cargando}
          style={{
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 600,
            marginBottom: '1rem',
          }}
        >
          ➕ Deseas agregar otro rol
        </button>
      )}

      {/* Formulario Agregar Rol */}
      {mostrarFormulario && (
        <div
          style={{
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            padding: '1rem',
            borderRadius: '4px',
            marginBottom: '1rem',
          }}
        >
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>
              Nombre del rol:
            </label>
            <input
              type="text"
              value={nombreRol}
              onChange={(e) => setNombreRol(e.target.value)}
              placeholder="Ej: Coordinador Académico"
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '0.875rem',
                boxSizing: 'border-box',
              }}
              disabled={cargando}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>
              Descripción (opcional):
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Descripción del rol..."
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '0.875rem',
                boxSizing: 'border-box',
                minHeight: '60px',
                fontFamily: 'inherit',
              }}
              disabled={cargando}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" 
              onClick={handleAgregarRol}
              disabled={cargando}
              style={{
                background: '#16a34a',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              {cargando ? 'Guardando...' : '✓ Guardar'}
            </button>
            <button type="button" 
              onClick={() => {
                setMostrarFormulario(false);
                setNombreRol('');
                setDescripcion('');
                setError(null);
              }}
              disabled={cargando}
              style={{
                background: '#ef4444',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              ✕ Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de Roles */}
      {cargando && <p style={{ color: '#666', fontSize: '0.875rem' }}>⏳ Cargando roles...</p>}

      {!cargando && rolesPersonalizados.length === 0 && !mostrarFormulario && (
        <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No hay roles personalizados aún</p>
      )}

      {!cargando && rolesPersonalizados.length > 0 && (
        <div>
          <p style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#666' }}>
            📋 Roles Personalizados ({rolesPersonalizados.length}):
          </p>
          {rolesPersonalizados.map((rol) => {
            const esPredefinido = ROLES_PREDEFINIDOS.includes(rol.nombre_rol.toUpperCase());
            const editando = editandoRol?.id_rol === rol.id_rol;

            if (editando) {
              return (
                <div key={rol.id_rol} style={{
                  background: '#f0fdf4',
                  border: '1px solid #86efac',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  marginBottom: '0.5rem',
                }}>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>Nombre del rol:</label>
                    <input
                      type="text" value={editNombre}
                      onChange={(e) => setEditNombre(e.target.value)}
                      style={{
                        width: '100%', padding: '0.5rem', border: '1px solid #d1d5db',
                        borderRadius: '4px', fontSize: '0.875rem', boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>Descripción:</label>
                    <textarea
                      value={editDescripcion}
                      onChange={(e) => setEditDescripcion(e.target.value)}
                      style={{
                        width: '100%', padding: '0.5rem', border: '1px solid #d1d5db',
                        borderRadius: '4px', fontSize: '0.875rem', boxSizing: 'border-box',
                        minHeight: '60px', fontFamily: 'inherit',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="button" onClick={handleGuardarEdicion} disabled={cargando} style={{
                      background: '#16a34a', color: 'white', border: 'none',
                      padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer',
                      fontSize: '0.875rem', fontWeight: 600,
                    }}>
                      {cargando ? 'Guardando...' : '✓ Guardar'}
                    </button>
                    <button type="button" onClick={handleCancelarEdicion} disabled={cargando} style={{
                      background: '#6b7280', color: 'white', border: 'none',
                      padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer',
                      fontSize: '0.875rem', fontWeight: 600,
                    }}>
                      ✕ Cancelar
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={rol.id_rol}
                onClick={() => handleIniciarEdicion(rol)}
                style={{
                  background: '#f3f4f6',
                  border: '1px solid #e5e7eb',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  marginBottom: '0.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: esPredefinido ? 'default' : 'pointer',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => { if (!esPredefinido) (e.currentTarget as HTMLDivElement).style.backgroundColor = '#e5e7eb'; }}
                onMouseLeave={(e) => { if (!esPredefinido) (e.currentTarget as HTMLDivElement).style.backgroundColor = '#f3f4f6'; }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#111827' }}>
                    {rol.nombre_rol}
                    {esPredefinido && <span style={{ fontSize: '0.7rem', color: '#9ca3af', marginLeft: '0.5rem' }}>(predefinido)</span>}
                  </div>
                  {rol.descripcion && (
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                      {rol.descripcion}
                    </div>
                  )}
                  {rolesEnUso[rol.id_rol] && (
                    <div style={{ fontSize: '0.75rem', color: '#d97706', marginTop: '0.25rem' }}>
                      ⚠️ En uso por usuarios
                    </div>
                  )}
                  {rolesTienePaginas[rol.id_rol] && (
                    <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.25rem' }}>
                      🔒 Tiene páginas asignadas
                    </div>
                  )}
                </div>
                <button type="button" 
                  onClick={(e) => { e.stopPropagation(); handleEliminarRol(rol.id_rol, rol.nombre_rol); }}
                  disabled={cargando || rolesEnUso[rol.id_rol] || rolesTienePaginas[rol.id_rol] || esPredefinido}
                  style={{
                    background: rolesEnUso[rol.id_rol] || rolesTienePaginas[rol.id_rol] || esPredefinido ? '#d1d5db' : '#ef4444',
                    color: 'white',
                    border: 'none',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '4px',
                    cursor: rolesEnUso[rol.id_rol] || rolesTienePaginas[rol.id_rol] || esPredefinido ? 'not-allowed' : 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                  }}
                  title={esPredefinido ? 'No se puede eliminar un rol predefinido' : rolesTienePaginas[rol.id_rol] ? 'No se puede eliminar un rol con páginas asignadas' : rolesEnUso[rol.id_rol] ? 'No se puede eliminar un rol en uso' : 'Eliminar rol'}
                >
                  🗑️ Eliminar
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
