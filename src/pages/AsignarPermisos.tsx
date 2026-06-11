import { useState, useEffect } from 'react';
import { Button } from '../components/Common';
import { Rol } from '../types';
import {
  guardarPermisosRol,
  obtenerPermisosRol,
  obtenerRolesPersonalizados,
  obtenerTodasLasPaginas,
  type RolPersonalizado,
  type PermisosPagina,
} from '../services/database';

interface Props {
  idEstablecimiento: string;
}

interface GrupoPaginas {
  titulo: string;
  rutas: string[];
  padre?: string; // ruta del padre si existe
}

const JERARQUIA: GrupoPaginas[] = [
  { titulo: 'Inicio', rutas: ['/dashboard'] },
  {
    titulo: 'Secretaría',
    padre: '/secretaria',
    rutas: ['/secretaria', '/secretaria/ausentes', '/secretaria/enviar-correo', '/mantenedor-funcionarios'],
  },
  {
    titulo: 'Justificaciones',
    rutas: ['/justificaciones', '/registrar', '/ver-justificaciones', '/gestion-pases'],
  },
  {
    titulo: 'Técnico',
    padre: '/tecnico',
    rutas: ['/tecnico', '/tecnico/mapa', '/tecnico/equipos', '/tecnico/ubicaciones', '/tecnico/requerimientos', '/tecnico/accesos', '/tecnico/menu', '/tecnico/configuracion', '/tecnico/qr', '/ticket', '/tecnico/m/inicio', '/tecnico/m/historial', '/tecnico/m/mapa', '/tecnico/m/grid', '/tecnico/m/equipos', '/tecnico/m/ubicaciones', '/tecnico/m/config', '/tecnico/m/qr', '/tecnico/m/accesos'],
  },
  {
    titulo: 'Biblioteca',
    padre: '/biblioteca',
    rutas: ['/biblioteca', '/libros', '/catalogo', '/prestamos', '/inventario', '/historial-biblioteca', '/config-biblioteca'],
  },
  {
    titulo: 'Monitoreo',
    rutas: ['/monitoreo-correos', '/monitoreo-fallos'],
  },
  {
    titulo: 'Seguridad',
    rutas: ['/seguridad'],
  },
  {
    titulo: 'Configuración',
    rutas: ['/configuracion', '/en-linea', '/gestion-usuarios', '/mantenedor-estudiantes', '/mantenedor-roles', '/mantenedor-motivos', '/solicitudes-registro', '/parametros', '/asignar-permisos', '/bloque-horario', '/reportes', '/mantenedor-cursos', '/correos', '/mantenedor-establecimiento'],
  },
];

function expandirRutasHijas(padre: string, permisos: string[]): string[] {
  const result = new Set(permisos);
  const permisosSet = new Set(permisos);
  for (const grupo of JERARQUIA) {
    if (grupo.padre === padre || grupo.titulo.toLowerCase() === padre.replace('/', '')) {
      if (permisosSet.has(padre)) {
        for (const r of grupo.rutas) result.add(r);
      }
    }
    if (grupo.padre && grupo.rutas.some(r => r !== grupo.padre && permisosSet.has(r))) {
      if (!permisosSet.has(grupo.padre)) {
        result.add(grupo.padre);
      }
    }
  }
  return [...result];
}

export default function AsignarPermisos({ idEstablecimiento }: Props) {
  const [rolSeleccionado, setRolSeleccionado] = useState<string>(Rol.ADMIN);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  const [todasLasPaginas, setTodasLasPaginas] = useState<PermisosPagina[]>([]);
  const [todosLosRoles, setTodosLosRoles] = useState<RolPersonalizado[]>([]);
  const [permisosRol, setPermisosRol] = useState<Record<string, string[]>>({});
  const [gruposExpandidos, setGruposExpandidos] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const paginas = obtenerTodasLasPaginas();
    setTodasLasPaginas(paginas);
  }, []);

  useEffect(() => {
    const cargarRoles = async () => {
      try {
        const roles = await obtenerRolesPersonalizados(idEstablecimiento);
        setTodosLosRoles(roles);
        const nuevoPermisosRol: Record<string, string[]> = {};
        const todasLasRutas = todasLasPaginas.map(p => p.ruta);
        for (const rol of roles) {
          nuevoPermisosRol[rol.nombre_rol] = todasLasRutas;
        }
        setPermisosRol(nuevoPermisosRol);
        if (roles.length > 0 && !rolSeleccionado) {
          setRolSeleccionado(roles[0].nombre_rol);
        }
      } catch (err) {
        console.error('Error al cargar roles:', err);
      }
    };
    cargarRoles();
  }, [idEstablecimiento, todasLasPaginas]);

  const cargarPermisos = async () => {
    try {
      setCargando(true);
      setError(null);
      const permisos = await obtenerPermisosRol(idEstablecimiento, rolSeleccionado);
      setPermisosRol(prev => ({
        ...prev,
        [rolSeleccionado]: permisos && permisos.length > 0 ? permisos : [],
      }));
    } catch (err) {
      setError('Error al cargar permisos');
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarPermisos();
  }, [rolSeleccionado]);

  const obtenerPermisosActuales = (): string[] => {
    return permisosRol[rolSeleccionado] || [];
  };

  function paginaPorRuta(ruta: string): PermisosPagina | undefined {
    return todasLasPaginas.find(p => p.ruta === ruta);
  }

  function toggleRuta(ruta: string) {
    const permisosActuales = obtenerPermisosActuales();
    const activo = permisosActuales.includes(ruta);
    let nuevos = activo
      ? permisosActuales.filter(p => p !== ruta)
      : [...permisosActuales, ruta];

    // Si es un padre con hijos, propagar a hijos
    const grupo = JERARQUIA.find(g => g.padre === ruta);
    if (grupo) {
      if (activo) {
        // Quitar padre + todos los hijos
        nuevos = nuevos.filter(p => !grupo.rutas.includes(p) || p === ruta);
        nuevos = nuevos.filter(p => p !== ruta);
      } else {
        // Agregar padre + todos los hijos
        for (const r of grupo.rutas) {
          if (!nuevos.includes(r)) nuevos.push(r);
        }
      }
    }

    // Si algún hijo se activa, asegurar que el padre también
    const grupoConHijos = JERARQUIA.find(g => g.rutas.includes(ruta) && g.padre);
    if (grupoConHijos && grupoConHijos.padre) {
      if (!activo) {
        if (!nuevos.includes(grupoConHijos.padre)) {
          nuevos.push(grupoConHijos.padre);
        }
      } else {
        // Verificar si quedan otros hijos activos
        const otrosHijosActivos = nuevos.some(p =>
          p !== ruta && grupoConHijos.rutas.includes(p)
        );
        if (!otrosHijosActivos) {
          nuevos = nuevos.filter(p => p !== grupoConHijos.padre);
        }
      }
    }

    setPermisosRol(prev => ({
      ...prev,
      [rolSeleccionado]: nuevos,
    }));
  }

  const agregarTodosLosPermisos = () => {
    const todasLasRutas = todasLasPaginas.map(p => p.ruta);
    setPermisosRol(prev => ({
      ...prev,
      [rolSeleccionado]: todasLasRutas,
    }));
  };

  const removerTodosLosPermisos = () => {
    setPermisosRol(prev => ({
      ...prev,
      [rolSeleccionado]: [],
    }));
  };

  const guardarPermisos = async () => {
    try {
      setGuardando(true);
      setError(null);
      setExito(null);
      let permisosActuales = obtenerPermisosActuales();
      for (const g of JERARQUIA) {
        if (g.padre) permisosActuales = expandirRutasHijas(g.padre, permisosActuales);
      }
      await guardarPermisosRol(idEstablecimiento, rolSeleccionado, permisosActuales);
      setExito(`✅ Permisos guardados para ${rolSeleccionado}`);
      setTimeout(() => setExito(null), 3000);
    } catch (err) {
      setError('Error al guardar permisos');
      console.error(err);
    } finally {
      setGuardando(false);
    }
  };

  const permisosActuales = obtenerPermisosActuales();

  function toggleGrupo(titulo: string) {
    setGruposExpandidos(prev => ({ ...prev, [titulo]: !prev[titulo] }));
  }

  function tienePermiso(ruta: string) {
    return permisosActuales.includes(ruta);
  }

  function hijosActivos(rutas: string[]): number {
    return rutas.filter(r => permisosActuales.includes(r)).length;
  }

  const gruposConInfo = JERARQUIA.map(grupo => {
    const items = grupo.rutas
      .map(r => paginaPorRuta(r))
      .filter((p): p is PermisosPagina => !!p);
    return { ...grupo, items };
  });

  return (
    <div style={styles.contenedor}>
      <div style={styles.encabezado}>
        <h1 style={styles.titulo}>🔐 Asignar Accesos por Rol</h1>
        <p style={styles.subtitulo}>Configura qué páginas puede acceder cada perfil de usuario</p>
      </div>

      <div style={styles.seccion}>
        <label style={styles.etiqueta}>
          Selecciona un rol:
          <select
            value={rolSeleccionado}
            onChange={(e) => setRolSeleccionado(e.target.value)}
            style={styles.select}
          >
            {todosLosRoles.map(rol => (
              <option key={rol.id_rol} value={rol.nombre_rol}>
                {rol.nombre_rol}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={styles.seccion}>
        <div style={styles.encabezadoSeccion}>
          <h2 style={styles.titulSeccion}>
            📋 Páginas Disponibles para {rolSeleccionado}
          </h2>
          <div style={styles.botonesBatch}>
            <button type="button" onClick={agregarTodosLosPermisos} style={styles.botonSmall}>
              ✓ Todos
            </button>
            <button type="button" onClick={removerTodosLosPermisos} style={styles.botonSmall}>
              ✗ Ninguno
            </button>
          </div>
        </div>

        {cargando ? (
          <p style={styles.cargando}>⏳ Cargando permisos...</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {gruposConInfo.map(grupo => {
              const expandido = gruposExpandidos[grupo.titulo] ?? false;
              const padreRuta = grupo.padre;
              const padreActivo = padreRuta ? tienePermiso(padreRuta) : false;
              const totalHijos = hijosActivos(grupo.rutas);

              return (
                <div key={grupo.titulo} style={{
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  overflow: 'hidden',
                }}>
                  {/* Cabecera del grupo */}
                  <button type="button" style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 16px', cursor: 'pointer',
                    backgroundColor: padreActivo ? '#DBEAFE' : '#F9FAFB',
                    borderBottom: expandido ? '1px solid #E5E7EB' : 'none',
                    border: 'none', width: '100%', textAlign: 'left', fontSize: 'inherit',
                  }}
                    onClick={() => toggleGrupo(grupo.titulo)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '12px', color: '#999', transition: 'transform 0.2s', transform: expandido ? 'rotate(90deg)' : 'none' }}>
                        ▶
                      </span>
                      <span style={{ fontWeight: 600, color: '#1A3C6B', fontSize: '14px' }}>
                        {grupo.titulo}
                      </span>
                      <span style={{
                        fontSize: '12px', padding: '2px 8px', borderRadius: '999px',
                        backgroundColor: totalHijos > 0 ? '#3B82F6' : '#E5E7EB',
                        color: totalHijos > 0 ? 'white' : '#999',
                      }}>
                        {totalHijos}/{grupo.rutas.length}
                      </span>
                    </div>

                    {padreRuta && (
                      <button type="button"                         onClick={(e) => { e.stopPropagation(); toggleRuta(padreRuta); }}
                        style={{
                          padding: '6px 16px', borderRadius: '6px', border: 'none',
                          cursor: 'pointer', fontWeight: 600, fontSize: '12px',
                          backgroundColor: padreActivo ? '#3B82F6' : '#E5E7EB',
                          color: padreActivo ? 'white' : '#666',
                        }}
                      >
                        {padreActivo ? '✓ Acceso completo' : '○ Sin acceso'}
                      </button>
                    )}
                  </button>

                  {/* Hijos */}
                  {expandido && (
                    <div style={{ padding: '8px 12px 8px 32px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {grupo.items.reduce((acc: React.ReactNode[], item) => {
                        if (grupo.padre && item.ruta === grupo.padre) return acc;
                        const activo = tienePermiso(item.ruta);
                        acc.push(
                          <div key={item.ruta} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '10px 12px', borderRadius: '6px',
                            backgroundColor: activo ? '#EFF6FF' : '#FAFAFA',
                            border: '1px solid', borderColor: activo ? '#BFDBFE' : '#F0F0F0',
                            transition: 'all 0.15s',
                          }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 500, color: '#1A3C6B', fontSize: '13px' }}>
                                {item.nombre}
                              </div>
                              <div style={{ color: '#999', fontSize: '12px', fontFamily: 'monospace' }}>
                                {item.ruta}
                              </div>
                            </div>
                            <button type="button"                                 onClick={() => toggleRuta(item.ruta)}
                              style={{
                                width: '34px', height: '34px', borderRadius: '50%',
                                border: `2px solid ${activo ? '#3B82F6' : '#D1D5DB'}`,
                                background: activo ? '#3B82F6' : '#FFFFFF',
                                cursor: 'pointer', fontSize: '14px', fontWeight: 600,
                                color: activo ? 'white' : '#999',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.15s',
                              }}
                            >
                              {activo ? '✓' : '○'}
                            </button>
                          </div>
                        );
                        return acc;
                      }, [] as React.ReactNode[])}

                      {grupo.items.reduce((count, i) => {
                        if (grupo.padre && i.ruta === grupo.padre) return count;
                        return count + 1;
                      }, 0) === 0 && (
                        <div style={{ padding: '12px', color: '#999', fontStyle: 'italic', fontSize: '13px', textAlign: 'center' }}>
                          Sin páginas hijas disponibles
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Resumen */}
        <div style={styles.resumen}>
          <p style={styles.resumenTexto}>
            <strong>Total de páginas accesibles:</strong> {permisosActuales.length} / {todasLasPaginas.length}
          </p>
          <p style={styles.resumenTexto}>
            <strong>Páginas permitidas:</strong>
          </p>
          <div style={styles.listaPaginas}>
            {permisosActuales.length === 0 ? (
              <span style={styles.sinAcceso}>Sin acceso a páginas</span>
            ) : (
              permisosActuales.map((ruta) => (
                <span key={ruta} style={styles.etiquetaRuta}>
                  {ruta}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      <div style={styles.botonesAccion}>
        <Button onClick={guardarPermisos} tipo="exito" deshabilitado={guardando}>
          {guardando ? '⏳ Guardando...' : '💾 Guardar Permisos'}
        </Button>
      </div>

      {error && (
        <div style={styles.errorBanner}>
          {error}
          <button type="button" onClick={() => setError(null)} style={styles.cerrarMensaje}>✕</button>
        </div>
      )}

      {exito && (
        <div style={styles.exitoBanner}>
          {exito}
          <button type="button" onClick={() => setExito(null)} style={styles.cerrarMensaje}>✕</button>
        </div>
      )}

      <div style={styles.infoBox}>
        <h3 style={styles.tituloInfo}>💡 Cómo funciona</h3>
        <ul style={styles.listaInfo}>
          <li>Cada grupo agrupa páginas relacionadas</li>
          <li>Activar el grupo completo (botón azul) otorga acceso a todas las páginas del grupo</li>
          <li>También puedes activar páginas individualmente dentro de cada grupo</li>
          <li>Los permisos se aplican inmediatamente en la próxima sesión</li>
        </ul>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  contenedor: {
    padding: '16px',
    maxWidth: '1000px',
    margin: '0 auto',
  },
  encabezado: {
    marginBottom: '24px',
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
  seccion: {
    background: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    padding: '24px',
    marginBottom: '24px',
  },
  etiqueta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
  },
  select: {
    padding: '10px 12px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: '#FFFFFF',
    cursor: 'pointer',
  },
  titulSeccion: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1A3C6B',
    margin: '0 0 16px 0',
  },
  cargando: {
    textAlign: 'center',
    padding: '24px',
    color: '#666',
  },
  sinDatos: {
    textAlign: 'center',
    padding: '24px',
    color: '#999',
  },
  resumen: {
    marginTop: '24px',
    padding: '16px',
    background: '#F9FAFB',
    borderRadius: '8px',
    border: '1px solid #E5E7EB',
  },
  resumenTexto: {
    margin: '0 0 8px 0',
    fontSize: '13px',
    color: '#333',
  },
  listaPaginas: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '8px',
  },
  etiquetaRuta: {
    display: 'inline-block',
    background: '#DBEAFE',
    color: '#1E40AF',
    padding: '6px 12px',
    borderRadius: '4px',
    fontSize: '12px',
    fontFamily: 'monospace',
  },
  sinAcceso: {
    color: '#999',
    fontSize: '12px',
    fontStyle: 'italic',
  },
  botonesAccion: {
    display: 'flex',
    gap: '12px',
    marginTop: '24px',
  },
  errorBanner: {
    position: 'fixed',
    bottom: '16px',
    left: '16px',
    right: '16px',
    background: '#FEE2E2',
    color: '#991B1B',
    padding: '16px',
    borderRadius: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1000,
  },
  exitoBanner: {
    position: 'fixed',
    bottom: '16px',
    left: '16px',
    right: '16px',
    background: '#DCFCE7',
    color: '#166534',
    padding: '16px',
    borderRadius: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1000,
  },
  cerrarMensaje: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '18px',
    color: 'inherit',
  },
  infoBox: {
    background: '#DBEAFE',
    border: '1px solid #93C5FD',
    borderRadius: '8px',
    padding: '16px',
    marginTop: '24px',
  },
  tituloInfo: {
    margin: '0 0 12px 0',
    fontSize: '14px',
    fontWeight: '600',
    color: '#1E40AF',
  },
  listaInfo: {
    margin: '0',
    paddingLeft: '20px',
    color: '#1E40AF',
    fontSize: '13px',
  },
  botonesBatch: {
    display: 'flex',
    gap: '8px',
  },
  botonSmall: {
    padding: '6px 14px', borderRadius: '6px', border: '1px solid #D1D5DB',
    background: '#FFFFFF', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
    color: '#333',
  },
  encabezadoSeccion: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    flexWrap: 'wrap',
    gap: '8px',
  },
};
