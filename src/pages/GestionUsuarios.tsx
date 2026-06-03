import { useState, useEffect, useMemo } from 'react';
import {
  obtenerTodosLosUsuarios,
  crearUsuarioConAutenticacion,
  actualizarUsuario,
  eliminarUsuario,
  obtenerDatosPersonalesPorUid,
  guardarDatosPersonales,
  obtenerTodosLosEstablecimientos,
  obtenerRolesPersonalizados,
  type DatosPersonales,
} from '../services/database';
import { Card, Button, Modal } from '../components/Common';
import { Rol } from '../types';
import type { Usuario } from '../types';
import { clearCache } from '../utils/cacheUtils';

interface Props {
  idEstablecimiento: string;
}

const ROL_COLORES: Record<Rol, string> = {
  [Rol.ADMIN]: '#7C3AED',
  [Rol.INSPECTOR]: '#F59E0B',
  [Rol.PROFESOR]: '#10B981',
  [Rol.ESTUDIANTE]: '#F97316',
  [Rol.APODERADO]: '#EC4899',
};

const ROLES_OPCIONES = [
  { valor: Rol.ADMIN, etiqueta: 'Administrador' },
  { valor: Rol.INSPECTOR, etiqueta: 'Inspector' },
  { valor: Rol.PROFESOR, etiqueta: 'Profesor' },
  { valor: Rol.ESTUDIANTE, etiqueta: 'Estudiante' },
  { valor: Rol.APODERADO, etiqueta: 'Apoderado' },
];

const USUARIOS_POR_PAGINA = 15;

export default function GestionUsuarios({ idEstablecimiento }: Props) {
  const [listadoVisible, setListadoVisible] = useState(false);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const [esMobil, setEsMobil] = useState(window.innerWidth < 768);

  // Modal de Crear
  const [modalTipoCriar, setModalTipoCrear] = useState(false);
  const [formCrear, setFormCrear] = useState({
    email: '',
    nombre_completo: '',
    rol: Rol.PROFESOR as string,
  });

  // Modal de Editar
  const [modalEditar, setModalEditar] = useState(false);
  const [usuarioEditar, setUsuarioEditar] = useState<Usuario | null>(null);
  const [formEditar, setFormEditar] = useState({
    rol: Rol.PROFESOR as string,
    activo: true,
  });

  // Modal de Eliminar
  const [modalEliminar, setModalEliminar] = useState(false);
  const [usuarioEliminar, setUsuarioEliminar] = useState<Usuario | null>(null);

  // Modal de Datos Personales
  const [modalDatosPersonales, setModalDatosPersonales] = useState(false);
  const [usuarioDatos, setUsuarioDatos] = useState<{ nombre: string; email: string; uid: string; id_usuario: string; rol: string; datos: DatosPersonales | null } | null>(null);
  const [cargandoDatos, setCargandoDatos] = useState(false);
  const [formDatos, setFormDatos] = useState<DatosPersonales | null>(null);
  const [guardandoDatos, setGuardandoDatos] = useState(false);
  const [establecimientos, setEstablecimientos] = useState<{ id: string; nombre: string }[]>([]);
  const [idEstablecimientoSel, setIdEstablecimientoSel] = useState<string>('');

  const [guardando, setGuardando] = useState(false);

  const [opcionesRol, setOpcionesRol] = useState<{ valor: string; etiqueta: string }[]>(ROLES_OPCIONES);

  useEffect(() => {
    (async () => {
      const roles = await obtenerRolesPersonalizados(idEstablecimiento);
      const extra = roles.reduce((acc: { valor: string; etiqueta: string }[], r) => {
        if (!ROLES_OPCIONES.find(o => o.valor === r.nombre_rol)) {
          acc.push({ valor: r.nombre_rol, etiqueta: r.nombre_rol });
        }
        return acc;
      }, []);
      if (extra.length > 0) {
        setOpcionesRol([...ROLES_OPCIONES, ...extra]);
      }
    })();
  }, [idEstablecimiento]);

  // Detectar cambios de tamaño de ventana
  useEffect(() => {
    const handleResize = () => {
      setEsMobil(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const cargarUsuarios = async () => {
    try {
      setCargando(true);
      setError(null);
      clearCache('todos_usuarios');
      const data = await obtenerTodosLosUsuarios();
      setUsuarios(data || []);
      setPaginaActual(1);
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
      setError(`Error al cargar usuarios: ${err instanceof Error ? err.message : 'Error desconocido'}`);
      setUsuarios([]);
    } finally {
      setCargando(false);
    }
  };

  const abrirListado = async () => {
    setListadoVisible(true);
    await cargarUsuarios();
  };

  // Filtros
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroRol, setFiltroRol] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  // Usuarios filtrados y ordenados
  const usuariosFiltrados = useMemo(() => {
    let filtrados = [...usuarios];

    if (filtroTexto.trim()) {
      const term = filtroTexto.toLowerCase().trim();
      filtrados = filtrados.filter(u =>
        (u.nombre_completo || '').toLowerCase().includes(term) ||
        (u.email || '').toLowerCase().includes(term)
      );
    }

    if (filtroRol) {
      filtrados = filtrados.filter(u => u.rol === filtroRol);
    }

    if (filtroEstado === 'activo') {
      filtrados = filtrados.filter(u => u.activo !== false);
    } else if (filtroEstado === 'inactivo') {
      filtrados = filtrados.filter(u => u.activo === false);
    }

    return filtrados.sort((a, b) => {
      if ((a.rol === Rol.ADMIN) === (b.rol === Rol.ADMIN)) {
        return (a.nombre_completo || '').localeCompare(b.nombre_completo || '', 'es');
      }
      return a.rol === Rol.ADMIN ? -1 : 1;
    });
  }, [usuarios, filtroTexto, filtroRol, filtroEstado]);

  const totalPaginas = Math.ceil(usuariosFiltrados.length / USUARIOS_POR_PAGINA);
  const inicio = (paginaActual - 1) * USUARIOS_POR_PAGINA;
  const fin = inicio + USUARIOS_POR_PAGINA;
  const usuariosPaginados = usuariosFiltrados.slice(inicio, fin);

  // ────────────────────────────────────────────────────────
  // CREAR USUARIO
  // ────────────────────────────────────────────────────────

  const abrirModalCrear = () => {
    setFormCrear({
      email: '',
      nombre_completo: '',
      rol: Rol.PROFESOR,
    });
    setModalTipoCrear(true);
  };

  const cerrarModalCrear = () => {
    setModalTipoCrear(false);
  };

  const guardarUsuarioNuevo = async () => {
    if (!formCrear.nombre_completo.trim() || !formCrear.email.trim()) {
      setError('Nombre completo y email son requeridos');
      return;
    }

    const emailExiste = usuarios.some(u => u.email.toLowerCase() === formCrear.email.toLowerCase());
    if (emailExiste) {
      setError(`El email ${formCrear.email} ya está registrado`);
      return;
    }

    try {
      setGuardando(true);
      setError(null);

      const tempPassword = await crearUsuarioConAutenticacion(
        formCrear.email,
        formCrear.nombre_completo,
        formCrear.rol,
        idEstablecimiento
      );

      if (tempPassword) {
        alert(`Usuario creado exitosamente!\n\nEmail: ${formCrear.email}\nContraseña temporal: ${tempPassword}\n\nComparte esta información con el usuario para que inicie sesión.`);
      } else {
        alert(`Usuario actualizado exitosamente!\n\nEmail: ${formCrear.email}\n\nEl usuario puede iniciar sesión con su contraseña actual.`);
      }

      await cargarUsuarios();
      cerrarModalCrear();
    } catch (err) {
      let mensajeError = 'Error desconocido';
      
      if (err instanceof Error) {
        if (err.message.includes('email-already-in-use')) {
          mensajeError = `El email ${formCrear.email} ya está registrado en Firebase Auth`;
        } else if (err.message.includes('weak-password')) {
          mensajeError = 'La contraseña es muy débil';
        } else {
          mensajeError = err.message;
        }
      }
      
      setError(`Error al crear usuario: ${mensajeError}`);
    } finally {
      setGuardando(false);
    }
  };

  // ────────────────────────────────────────────────────────
  // EDITAR USUARIO
  // ────────────────────────────────────────────────────────

  const abrirModalEditar = (usuario: Usuario) => {
    setUsuarioEditar(usuario);
    setFormEditar({
      rol: usuario.rol,
      activo: usuario.activo ?? true,
    });
    setModalEditar(true);
  };

  const cerrarModalEditar = () => {
    setModalEditar(false);
    setUsuarioEditar(null);
  };

  const guardarCambiosUsuario = async () => {
    if (!usuarioEditar) return;

    try {
      setGuardando(true);
      setError(null);

      await actualizarUsuario(usuarioEditar.id_usuario, {
        rol: formEditar.rol as Rol,
        activo: formEditar.activo,
      } as Partial<Usuario>);

      await cargarUsuarios();
      cerrarModalEditar();
    } catch (err) {
      setError('Error al actualizar usuario');
    } finally {
      setGuardando(false);
    }
  };

  // ────────────────────────────────────────────────────────
  // ELIMINAR USUARIO
  // ────────────────────────────────────────────────────────

  const abrirModalEliminar = (usuario: Usuario) => {
    setUsuarioEliminar(usuario);
    setModalEliminar(true);
  };

  const cerrarModalEliminar = () => {
    setModalEliminar(false);
    setUsuarioEliminar(null);
  };

  const confirmarEliminar = async () => {
    if (!usuarioEliminar) return;

    try {
      setGuardando(true);
      setError(null);

      await eliminarUsuario(usuarioEliminar.id_usuario);
      await cargarUsuarios();
      cerrarModalEliminar();
    } catch (err) {
      setError('Error al eliminar usuario');
    } finally {
      setGuardando(false);
    }
  };

  // ────────────────────────────────────────────────────────
  // DATOS PERSONALES
  // ────────────────────────────────────────────────────────

  const abrirDatosPersonales = async (usuario: Usuario) => {
    setCargandoDatos(true);
    setModalDatosPersonales(true);
    const authUid = usuario.uid || usuario.id_usuario;
    const [datos, establecimientosData] = await Promise.all([
      obtenerDatosPersonalesPorUid(authUid),
      obtenerTodosLosEstablecimientos(),
    ]);
    setEstablecimientos(establecimientosData);
    setIdEstablecimientoSel(usuario.id_establecimiento || '');
    setUsuarioDatos({ nombre: usuario.nombre_completo, email: usuario.email, uid: authUid, id_usuario: usuario.id_usuario, rol: usuario.rol, datos });
    setFormDatos(datos || {
      uid: authUid,
      rut: null,
      nombres: usuario.nombre_completo || '',
      apellidos: usuario.apellidos || '',
      email_personal: null,
      telefono: null,
      ciudad: null,
      direccion: null,
      asignatura: null,
      horas: null,
      emergencia_nombre: null,
      emergencia_telefono: null,
      emergencia_parentesco: null,
    });
    setCargandoDatos(false);
  };

  const cerrarDatosPersonales = () => {
    setModalDatosPersonales(false);
    setUsuarioDatos(null);
    setFormDatos(null);
    setIdEstablecimientoSel('');
    setEstablecimientos([]);
  };

  const guardarDatosPersonalesHandler = async () => {
    if (!formDatos || !usuarioDatos) return;
    const faltantes: string[] = [];
    if (!formDatos.apellidos?.trim()) faltantes.push('Apellidos');
    if (!formDatos.telefono?.trim()) faltantes.push('Teléfono');
    if (!formDatos.ciudad?.trim()) faltantes.push('Ciudad');
    if (!formDatos.direccion?.trim()) faltantes.push('Dirección');
    if (!formDatos.emergencia_nombre?.trim()) faltantes.push('Nombre contacto emergencia');
    if (!formDatos.emergencia_telefono?.trim()) faltantes.push('Teléfono contacto emergencia');
    if (!formDatos.emergencia_parentesco?.trim()) faltantes.push('Parentesco emergencia');
    if (faltantes.length > 0) {
      setError(`Campos obligatorios: ${faltantes.join(', ')}`);
      return;
    }
    setGuardandoDatos(true);
    const res = await guardarDatosPersonales(formDatos);
    if (res.error) {
      setError(res.error);
      setGuardandoDatos(false);
      return;
    }
    try {
      await actualizarUsuario(usuarioDatos.id_usuario, {
        id_establecimiento: idEstablecimientoSel || null,
      } as Partial<Usuario>);
      setUsuarioDatos(prev => prev ? { ...prev, datos: formDatos } : null);
      alert('Datos personales guardados exitosamente.');
    } catch (e) {
      setError(`Datos personales guardados, pero error al asignar establecimiento: ${e instanceof Error ? e.message : 'Error desconocido'}`);
    }
    setGuardandoDatos(false);
  };

  // ────────────────────────────────────────────────────────
  // RENDERIZADO
  // ────────────────────────────────────────────────────────

  if (!listadoVisible) {
    return (
      <div style={styles.contenedor}>
        <div style={styles.encabezado}>
          <h1 style={styles.titulo}>Gestión de Usuarios</h1>
          <p style={styles.subtitulo}>Administra los usuarios registrados en el sistema</p>
        </div>
        <button type="button" onClick={abrirListado} style={styles.botonVerLista}>
          Ver listado de usuarios
        </button>
      </div>
    );
  }

  if (error && usuarios.length === 0) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorCard}>
          <p style={styles.errorIcono}>⚠️</p>
          <h2 style={styles.errorTitulo}>Error al cargar usuarios</h2>
          <p style={styles.errorTexto}>{error}</p>
          <Button onClick={() => cargarUsuarios()} tipo="primario">
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.contenedor}>
      {/* TÍTULO DE PÁGINA */}
      <div style={styles.encabezado}>
        <h1 style={styles.titulo}>Gestión de Usuarios</h1>
      </div>

      {/* FILTROS */}
      <div style={styles.fila}>
        <Card padding="16px">
          <div style={styles.filtrosContenedor}>
            <input
              placeholder="Buscar por nombre o correo..."
              value={filtroTexto}
              onChange={(e) => { setFiltroTexto(e.target.value); setPaginaActual(1); }}
              style={styles.filtroInput}
            />
            <select
              value={filtroRol}
              onChange={(e) => { setFiltroRol(e.target.value); setPaginaActual(1); }}
              style={styles.filtroSelect}
            >
              <option value="">Todos los roles</option>
              {opcionesRol.map(opt => (
                <option key={opt.valor} value={opt.valor}>{opt.etiqueta}</option>
              ))}
            </select>
            <select
              value={filtroEstado}
              onChange={(e) => { setFiltroEstado(e.target.value); setPaginaActual(1); }}
              style={styles.filtroSelect}
            >
              <option value="">Todos los estados</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
        </Card>
      </div>

      {/* TABLA CON PAGINADOR */}
      <div style={styles.fila}>
        <Card padding="0">
          {cargando ? (
            <div style={styles.cargandoContenedor}>
              <p style={styles.cargandoTexto}>⏳ Cargando usuarios...</p>
            </div>
          ) : usuariosFiltrados.length === 0 ? (
            <div style={styles.vacioContenedor}>
              <p style={styles.vacioTexto}>
                {usuarios.length === 0
                  ? '📭 No hay usuarios registrados'
                  : '🔍 Ningún usuario coincide con los filtros aplicados'}
              </p>
            </div>
          ) : (
            <>
              {/* Tabla Desktop */}
              {!esMobil && (
                <div style={styles.tablaContenedor}>
                  <table style={styles.tabla}>
                    <thead>
                      <tr style={styles.encabezadoTabla}>
                        <th style={styles.celdaEncabezado}>Nombre Completo</th>
                        <th style={styles.celdaEncabezado}>Email</th>
                        <th style={styles.celdaEncabezado}>Rol</th>
                        <th style={styles.celdaEncabezado}>Estado</th>
                        <th style={styles.celdaEncabezado}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usuariosPaginados.map((usuario, idx) => (
                        <tr
                          key={usuario.id_usuario || idx}
                          style={{
                            ...styles.filaTabla,
                            backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB',
                          }}
                        >
                          <td style={styles.celda}>
                            <span
                              onClick={() => abrirDatosPersonales(usuario)}
                              style={styles.enlaceUsuario}
                              title="Ver datos personales"
                            >
                              {usuario.nombre_completo || 'N/A'}
                            </span>
                          </td>
                          <td style={styles.celda}>{usuario.email || 'N/A'}</td>
                          <td style={styles.celda}>
                            <RolBadge rol={usuario.rol} />
                          </td>
                          <td style={styles.celda}>
                            <EstadoBadge activo={usuario.activo ?? true} />
                          </td>
                          <td style={styles.celdaAcciones}>
                            <button type="button"                               onClick={() => abrirModalEditar(usuario)}
                              style={styles.botonIcono}
                              title="Editar"
                            >
                              ✎
                            </button>
                            <button type="button"                               onClick={() => abrirModalEliminar(usuario)}
                              style={{ ...styles.botonIcono, color: '#EF4444' }}
                              title="Eliminar"
                            >
                              🗑
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Tabla Mobile */}
              {esMobil && (
                <div style={styles.tablaMovilContenedor}>
                  {usuariosPaginados.map((usuario) => (
                    <div
                      key={usuario.id_usuario}
                      style={styles.filaMobil}
                      title={usuario.activo ? 'Activo' : 'Desactivado'}
                    >
                      <div style={styles.columnaEstado}>
                        <div
                          style={{
                            ...styles.circuloEstado,
                            backgroundColor: usuario.activo ? '#10B981' : '#9CA3AF',
                          }}
                          title={usuario.activo ? 'Activo' : 'Desactivado'}
                        />
                      </div>
                      <div style={styles.columnaEmail}>
                        <p
                          style={styles.emailMobilEnlace}
                          onClick={() => abrirDatosPersonales(usuario)}
                          title="Ver datos personales"
                        >
                          {usuario.nombre_completo || 'N/A'}
                        </p>
                        <p style={styles.rolMobil}>{opcionesRol.find(r => r.valor === usuario.rol)?.etiqueta || usuario.rol || 'Sin rol'}</p>
                      </div>
                      <div style={styles.columnaAcciones}>
                        <button type="button"                           onClick={() => abrirModalEditar(usuario)}
                          style={styles.botonAccionMobil}
                          title="Editar"
                        >
                          ✎
                        </button>
                        <button type="button"                           onClick={() => abrirModalEliminar(usuario)}
                          style={{ ...styles.botonAccionMobil, color: '#EF4444' }}
                          title="Eliminar"
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Paginador */}
              {totalPaginas > 1 && (
                <div style={styles.paginador}>
                  <button type="button"                     onClick={() => setPaginaActual(prev => Math.max(1, prev - 1))}
                    disabled={paginaActual === 1}
                    style={styles.botonPaginador}
                  >
                    ← Anterior
                  </button>
                  <span style={styles.infoPagina}>
                    Página {paginaActual} de {totalPaginas}
                  </span>
                  <button type="button"                     onClick={() => setPaginaActual(prev => Math.min(totalPaginas, prev + 1))}
                    disabled={paginaActual === totalPaginas}
                    style={styles.botonPaginador}
                  >
                    Siguiente →
                  </button>
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      {/* FILA 3: BOTÓN CREAR USUARIO */}
      <div style={styles.fila}>
        <Card padding="24px">
          <div style={styles.filaBotones}>
            <Button onClick={abrirModalCrear} tipo="exito" anchoCompleto>
              ➕ Crear Nuevo Usuario
            </Button>
          </div>
        </Card>
      </div>

      {/* MODAL: Crear Usuario */}
      <Modal
        abierto={modalTipoCriar}
        titulo="Crear Nuevo Usuario"
        onCerrar={cerrarModalCrear}
      >
        <div style={styles.formulario}>
          <label style={styles.etiqueta}>
            Nombre Completo
            <input
              placeholder="ej: Juan Pérez"
              value={formCrear.nombre_completo}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormCrear({ ...formCrear, nombre_completo: e.target.value })
              }
              style={styles.input}
            />
          </label>

          <label style={styles.etiqueta}>
            Email
            <input
              placeholder="ej: juan@sgja.cl"
              type="email"
              value={formCrear.email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormCrear({ ...formCrear, email: e.target.value })
              }
              style={styles.input}
            />
          </label>

          <label style={styles.etiqueta}>
            Rol
            <select
              value={formCrear.rol}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setFormCrear({ ...formCrear, rol: e.target.value })
              }
              style={styles.select}
            >
              {opcionesRol.map(opt => (
                <option key={opt.valor} value={opt.valor}>
                  {opt.etiqueta}
                </option>
              ))}
            </select>
          </label>

          {error && <p style={styles.errorTextoModal}>{error}</p>}

          <div style={styles.botonesModal}>
            <Button
              onClick={cerrarModalCrear}
              tipo="secundario"
            >
              Cancelar
            </Button>
            <Button
              onClick={guardarUsuarioNuevo}
              tipo="exito"
            >
              {guardando ? '⏳ Guardando...' : 'Guardar'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL: Editar Usuario */}
      <Modal
        abierto={modalEditar}
        titulo={`Editar: ${usuarioEditar?.nombre_completo || ''}`}
        onCerrar={cerrarModalEditar}
      >
        <div style={styles.formulario}>
          <label style={styles.etiqueta}>
            Rol
            <select
              value={formEditar.rol}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setFormEditar({ ...formEditar, rol: e.target.value })
              }
              style={styles.select}
            >
              {opcionesRol.map(opt => (
                <option key={opt.valor} value={opt.valor}>
                  {opt.etiqueta}
                </option>
              ))}
            </select>
          </label>

          <label style={styles.etiqueta}>
            <input
              type="checkbox"
              checked={formEditar.activo}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormEditar({ ...formEditar, activo: e.target.checked })
              }
              style={styles.checkbox}
            />
            Usuario Activo
          </label>

          {error && <p style={styles.errorTextoModal}>{error}</p>}

          <div style={styles.botonesModal}>
            <Button
              onClick={cerrarModalEditar}
              tipo="secundario"
              deshabilitado={guardando}
            >
              Cancelar
            </Button>
            <Button
              onClick={guardarCambiosUsuario}
              tipo="primario"
              deshabilitado={guardando}
              cargando={guardando}
            >
              {guardando ? '⏳ Guardando...' : '✓ Guardar cambios'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL: Eliminar Usuario */}
      <Modal
        abierto={modalEliminar}
        titulo="⚠️ Eliminar Usuario"
        onCerrar={cerrarModalEliminar}
      >
        <div style={styles.formulario}>
          <p style={styles.advertenciaTexto}>
            ¿Estás seguro de que deseas eliminar a{' '}
            <strong>{usuarioEliminar?.nombre_completo}</strong>?
          </p>
          <p style={styles.advertenciaSubtexto}>
            Esta acción desactivará la cuenta del usuario.
          </p>

          {error && <p style={styles.errorTextoModal}>{error}</p>}

          <div style={styles.botonesModal}>
            <Button
              onClick={cerrarModalEliminar}
              tipo="secundario"
              deshabilitado={guardando}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmarEliminar}
              tipo="peligro"
              deshabilitado={guardando}
              cargando={guardando}
            >
              {guardando ? '⏳ Eliminando...' : '🗑️ Eliminar'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL: Datos Personales (editable) */}
      <Modal
        abierto={modalDatosPersonales}
        titulo={`${usuarioDatos?.rol || ''} - ${usuarioDatos?.nombre || ''}`}
        onCerrar={cerrarDatosPersonales}
      >
        {cargandoDatos ? (
          <div style={styles.formulario}>
            <p style={styles.cargandoTexto}>Cargando datos personales...</p>
          </div>
        ) : formDatos ? (
          <div style={styles.formulario}>
            <label style={styles.etiqueta}>
              Nombres
              <input style={styles.input} value={formDatos.nombres} onChange={(e) => setFormDatos({ ...formDatos, nombres: e.target.value })} />
            </label>
            <label style={styles.etiqueta}>
              Apellidos
              <input style={styles.input} value={formDatos.apellidos} onChange={(e) => setFormDatos({ ...formDatos, apellidos: e.target.value })} />
            </label>
            <label style={styles.etiqueta}>
              Email Personal
              <input style={styles.input} value={formDatos.email_personal || ''} onChange={(e) => setFormDatos({ ...formDatos, email_personal: e.target.value || null })} />
            </label>
            <label style={styles.etiqueta}>
              Teléfono
              <input style={styles.input} value={formDatos.telefono || ''} onChange={(e) => setFormDatos({ ...formDatos, telefono: e.target.value || null })} />
            </label>
            <label style={styles.etiqueta}>
              Ciudad
              <input style={styles.input} value={formDatos.ciudad || ''} onChange={(e) => setFormDatos({ ...formDatos, ciudad: e.target.value || null })} />
            </label>
            <label style={styles.etiqueta}>
              Dirección
              <input style={styles.input} value={formDatos.direccion || ''} onChange={(e) => setFormDatos({ ...formDatos, direccion: e.target.value || null })} />
            </label>
            <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '16px', marginTop: '8px' }}>
              <span style={{ fontSize: '15px', fontWeight: '700', color: '#374151' }}>Asignación</span>
            </div>
            <label style={styles.etiqueta}>
              Establecimiento
              <select style={styles.select} value={idEstablecimientoSel} onChange={(e) => setIdEstablecimientoSel(e.target.value)}>
                <option value="">Sin establecimiento</option>
                {establecimientos.map((e) => (
                  <option key={e.id} value={e.id}>{e.nombre}</option>
                ))}
              </select>
            </label>
            <label style={styles.etiqueta}>
              Asignatura
              <input style={styles.input} value={formDatos.asignatura || ''} onChange={(e) => setFormDatos({ ...formDatos, asignatura: e.target.value || null })} />
            </label>
            <label style={styles.etiqueta}>
              Horas
              <input type="number" style={styles.input} value={formDatos.horas ?? ''} onChange={(e) => setFormDatos({ ...formDatos, horas: e.target.value ? Number(e.target.value) : null })} />
            </label>

            <div style={{ ...styles.campoDatos, borderTop: '1px solid #E5E7EB', paddingTop: '16px', marginTop: '8px' }}>
              <span style={{ fontSize: '15px', fontWeight: '700', color: '#374151' }}>Contacto de Emergencia</span>
            </div>
            <label style={styles.etiqueta}>
              Nombre
              <input style={styles.input} value={formDatos.emergencia_nombre || ''} onChange={(e) => setFormDatos({ ...formDatos, emergencia_nombre: e.target.value || null })} />
            </label>
            <label style={styles.etiqueta}>
              Teléfono
              <input style={styles.input} value={formDatos.emergencia_telefono || ''} onChange={(e) => setFormDatos({ ...formDatos, emergencia_telefono: e.target.value || null })} />
            </label>
            <label style={styles.etiqueta}>
              Parentesco
              <select style={styles.select} value={formDatos.emergencia_parentesco || ''} onChange={(e) => setFormDatos({ ...formDatos, emergencia_parentesco: e.target.value || null })}>
                <option value="">Seleccionar...</option>
                <option value="Padre">Padre</option>
                <option value="Madre">Madre</option>
                <option value="Tutor">Tutor</option>
                <option value="Hermano">Hermano</option>
                <option value="Cónyuge">Cónyuge</option>
                <option value="Otro">Otro</option>
              </select>
            </label>

            <p style={styles.leyendaDatos}>Uso exclusivo del establecimiento educacional</p>

            {error && <p style={styles.errorTextoModal}>{error}</p>}

            <div style={styles.botonesModal}>
              <Button onClick={cerrarDatosPersonales} tipo="secundario" deshabilitado={guardandoDatos}>
                Cancelar
              </Button>
              <Button onClick={guardarDatosPersonalesHandler} tipo="exito" deshabilitado={guardandoDatos} cargando={guardandoDatos}>
                {guardandoDatos ? '⏳ Guardando...' : '💾 Guardar'}
              </Button>
            </div>
          </div>
        ) : (
          <div style={styles.formulario}>
            <p style={styles.vacioTexto}>Error al cargar datos personales.</p>
            <div style={styles.botonesModal}>
              <Button onClick={cerrarDatosPersonales} tipo="primario">Cerrar</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// COMPONENTES AUXILIARES
// ════════════════════════════════════════════════════════════

interface RolBadgeProps {
  rol: Rol;
}

function RolBadge({ rol }: RolBadgeProps) {
  const color = ROL_COLORES[rol];
  return (
    <span
      style={{
        ...styles.badge,
        backgroundColor: `${color}20`,
        color: color,
      }}
    >
      {rol}
    </span>
  );
}

interface EstadoBadgeProps {
  activo: boolean;
}

function EstadoBadge({ activo }: EstadoBadgeProps) {
  return (
    <span
      style={{
        ...styles.badge,
        backgroundColor: activo ? '#D1FAE520' : '#FEE2E220',
        color: activo ? '#059669' : '#DC2626',
      }}
    >
      {activo ? '✅ Activo' : '❌ Inactivo'}
    </span>
  );
}

const styles: Record<string, React.CSSProperties> = {
  contenedor: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  encabezado: {
    marginBottom: '8px',
  },
  titulo: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1A3C6B',
    margin: '0 0 8px 0',
  },
  subtitulo: {
    fontSize: '14px',
    color: '#666',
    margin: '0',
  },
  botonVerLista: {
    padding: '12px 24px',
    backgroundColor: '#1A3C6B',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    alignSelf: 'flex-start',
  },

  // Filas
  fila: {
    width: '100%',
  },

  // Filtros
  filtrosContenedor: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap' as const,
    alignItems: 'center',
  },
  filtroInput: {
    flex: '1 1 200px',
    padding: '10px 12px',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#374151',
    backgroundColor: '#FFFFFF',
    minWidth: '0',
  },
  filtroSelect: {
    padding: '10px 12px',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#374151',
    backgroundColor: '#FFFFFF',
    cursor: 'pointer',
    minWidth: '160px',
  },

  // Tabla
  tablaContenedor: {
    overflowX: 'auto',
  },
  tabla: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  encabezadoTabla: {
    backgroundColor: '#F3F4F6',
    borderBottom: '2px solid #E5E7EB',
  },
  celdaEncabezado: {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  filaTabla: {
    borderBottom: '1px solid #E5E7EB',
  },
  celda: {
    padding: '12px 16px',
    fontSize: '14px',
    color: '#374151',
  },
  celdaAcciones: {
    padding: '12px 16px',
    display: 'flex',
    gap: '8px',
  },
  botonIcono: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '18px',
    padding: '4px 8px',
    borderRadius: '4px',
    transition: 'background-color 0.2s',
    color: '#3B82F6',
  },
  enlaceUsuario: {
    color: '#1A3C6B',
    cursor: 'pointer',
    fontWeight: '600',
    textDecoration: 'underline',
    textDecorationColor: '#93C5FD',
    textUnderlineOffset: '2px',
  },

  // Tabla Mobile
  tablaMovilContenedor: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    padding: '12px',
  },
  filaMobil: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#F9FAFB',
    borderRadius: '8px',
    borderLeft: '4px solid #3B82F6',
  },
  columnaEstado: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  circuloEstado: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    transition: 'background-color 0.2s',
  },
  columnaEmail: {
    flex: 1,
    minWidth: 0,
  },
  emailMobilEnlace: {
    margin: 0,
    fontSize: '14px',
    fontWeight: '600',
    color: '#1A3C6B',
    cursor: 'pointer',
    textDecoration: 'underline',
    textDecorationColor: '#93C5FD',
    textUnderlineOffset: '2px',
    wordBreak: 'break-all' as const,
  },
  rolMobil: {
    margin: '4px 0 0 0',
    fontSize: '12px',
    fontWeight: '400',
    color: '#6B7280',
  },
  columnaAcciones: {
    display: 'flex',
    gap: '8px',
    flexShrink: 0,
  },
  botonAccionMobil: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '6px 10px',
    borderRadius: '4px',
    transition: 'background-color 0.2s',
    color: '#3B82F6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Paginador
  paginador: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '16px',
    borderTop: '1px solid #E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  botonPaginador: {
    padding: '8px 16px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    backgroundColor: '#FFFFFF',
    color: '#374151',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    transition: 'all 0.2s',
  },
  infoPagina: {
    fontSize: '13px',
    color: '#6B7280',
    fontWeight: '500',
  },

  // Botones fila 3
  filaBotones: {
    display: 'flex',
    gap: '12px',
  },

  // Estados
  cargandoContenedor: {
    padding: '48px 24px',
    textAlign: 'center',
  },
  cargandoTexto: {
    fontSize: '14px',
    color: '#9CA3AF',
  },

  vacioContenedor: {
    padding: '48px 24px',
    textAlign: 'center',
  },
  vacioTexto: {
    fontSize: '14px',
    color: '#9CA3AF',
  },

  // Formularios
  formulario: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  etiqueta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
  },
  input: {
    padding: '10px 12px',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#374151',
    backgroundColor: '#FFFFFF',
  },
  select: {
    padding: '10px 12px',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
    backgroundColor: '#FFFFFF',
    color: '#374151',
  },
  checkbox: {
    marginRight: '8px',
    width: '16px',
    height: '16px',
    cursor: 'pointer',
  },

  botonesModal: {
    display: 'flex',
    gap: '12px',
    marginTop: '24px',
    justifyContent: 'flex-end',
  },

  errorContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    padding: '24px',
  },
  errorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '48px 40px',
    textAlign: 'center',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    maxWidth: '400px',
  },
  errorIcono: {
    fontSize: '48px',
    margin: '0 0 16px 0',
  },
  errorTitulo: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1A3C6B',
    margin: '0 0 12px 0',
  },
  errorTexto: {
    fontSize: '14px',
    color: '#6B7280',
    margin: '0 0 24px 0',
  },
  errorTextoModal: {
    fontSize: '14px',
    color: '#DC2626',
    backgroundColor: '#FEE2E2',
    padding: '12px',
    borderRadius: '8px',
  },

  badge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
  },

  advertenciaTexto: {
    fontSize: '15px',
    color: '#374151',
    margin: '0 0 8px 0',
  },
  advertenciaSubtexto: {
    fontSize: '13px',
    color: '#9CA3AF',
    margin: '0 0 16px 0',
  },

  // Datos personales modal
  campoDatos: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  labelDatos: {
    fontSize: '12px',
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.3px',
  },
  valorDatos: {
    fontSize: '15px',
    color: '#374151',
  },
  leyendaDatos: {
    fontSize: '12px',
    color: '#9CA3AF',
    fontStyle: 'italic',
    textAlign: 'center' as const,
    margin: '8px 0 0 0',
    padding: '8px',
    backgroundColor: '#F9FAFB',
    borderRadius: '6px',
  },
};
