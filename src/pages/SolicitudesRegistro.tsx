import { useState, useCallback } from 'react';
import { Rol } from '../types';
import {
  obtenerSolicitudesPaginadas,
  aprobarSolicitud,
  rechazarSolicitud,
  type SolicitudRegistro,
} from '../services/database';

interface Props {
  idEstablecimiento: string;
}

const OPCIONES_ROL = [
  { valor: Rol.INSPECTOR, etiqueta: 'Inspector' },
  { valor: Rol.PROFESOR, etiqueta: 'Profesor' },
  { valor: Rol.ESTUDIANTE, etiqueta: 'Estudiante' },
  { valor: Rol.APODERADO, etiqueta: 'Apoderado' },
];

const ESTADO_COLOR: Record<string, string> = {
  pendiente: '#F59E0B',
  aprobado: '#10B981',
  rechazado: '#EF4444',
};

const ESTADO_LABEL: Record<string, string> = {
  pendiente: 'Pendiente',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
};

const POR_PAGINA = 7;

export default function SolicitudesRegistro({ idEstablecimiento: _idEstablecimiento }: Props) {
  const [visible, setVisible] = useState(false);
  const [solicitudes, setSolicitudes] = useState<SolicitudRegistro[]>([]);
  const [cargando, setCargando] = useState(false);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [rolSeleccionado, setRolSeleccionado] = useState<Record<string, string>>({});
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  const cargarPagina = useCallback(async (p: number) => {
    setCargando(true);
    const { data, total: t } = await obtenerSolicitudesPaginadas(p, POR_PAGINA);
    setSolicitudes(data);
    setTotal(t);
    const roles: Record<string, string> = {};
    data.forEach(s => { roles[s.uid] = Rol.PROFESOR; });
    setRolSeleccionado(roles);
    setPagina(p);
    setCargando(false);
  }, []);

  const abrirListado = async () => {
    setVisible(true);
    await cargarPagina(1);
  };

  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));

  const handleAprobar = async (uid: string) => {
    const rol = rolSeleccionado[uid];
    if (!rol) return;
    const res = await aprobarSolicitud(uid, rol);
    if (res.error) {
      setMensaje({ tipo: 'error', texto: `Error al aprobar: ${res.error}` });
    } else {
      setMensaje({ tipo: 'exito', texto: 'Usuario aprobado correctamente' });
      await cargarPagina(pagina);
    }
    setTimeout(() => setMensaje(null), 3000);
  };

  const handleRechazar = async (uid: string) => {
    const res = await rechazarSolicitud(uid);
    if (res.error) {
      setMensaje({ tipo: 'error', texto: `Error al rechazar: ${res.error}` });
    } else {
      setMensaje({ tipo: 'exito', texto: 'Solicitud rechazada' });
      await cargarPagina(pagina);
    }
    setTimeout(() => setMensaje(null), 3000);
  };

  return (
    <div style={styles.contenedor}>
      <div style={styles.encabezado}>
        <h1 style={styles.titulo}>Solicitudes de Registro</h1>
        <p style={styles.subtitulo}>Usuarios que han solicitado acceso al sistema</p>
      </div>

      {!visible ? (
        <button type="button" onClick={abrirListado} style={styles.botonVerLista}>
          Ver listado de solicitudes
        </button>
      ) : (
        <>
          {mensaje && (
            <div style={mensaje.tipo === 'exito' ? styles.bannerExito : styles.bannerError}>
              {mensaje.texto}
            </div>
          )}

          {cargando ? (
            <p style={styles.cargando}>Cargando solicitudes...</p>
          ) : solicitudes.length === 0 ? (
            <div style={styles.vacio}>
              <p style={styles.iconoVacio}>No hay solicitudes de registro</p>
            </div>
          ) : (
            <>
              <div style={styles.tabla}>
                <div style={styles.header}>
                  <span style={styles.colNombre}>Nombres</span>
                  <span style={styles.colApellidos}>Apellidos</span>
                  <span style={styles.colEmail}>Email</span>
                  <span style={styles.colEstado}>Estado</span>
                  <span style={styles.colRol}>Rol</span>
                  <span style={styles.colAccion}>Acción</span>
                </div>
                {solicitudes.map((s) => (
                  <div key={s.uid} style={styles.fila}>
                    <span style={styles.colNombre}>{s.nombre}</span>
                    <span style={styles.colApellidos}>{s.apellidos}</span>
                    <span style={styles.colEmail}>{s.correo}</span>
                    <span style={styles.colEstado}>
                      <span
                        style={{
                          ...styles.badgeEstado,
                          backgroundColor: `${ESTADO_COLOR[s.estado] || '#6B7280'}20`,
                          color: ESTADO_COLOR[s.estado] || '#6B7280',
                        }}
                      >
                        {ESTADO_LABEL[s.estado] || s.estado}
                      </span>
                    </span>
                    <span style={styles.colRol}>
                      {s.estado === 'pendiente' ? (
                        <select
                          value={rolSeleccionado[s.uid] || Rol.PROFESOR}
                          onChange={(e) => setRolSeleccionado(prev => ({ ...prev, [s.uid]: e.target.value }))}
                          style={styles.selectRol}
                        >
                          {OPCIONES_ROL.map(op => (
                            <option key={op.valor} value={op.valor}>{op.etiqueta}</option>
                          ))}
                        </select>
                      ) : (
                        <span style={{ color: '#9CA3AF', fontSize: '13px' }}>--</span>
                      )}
                    </span>
                    <span style={styles.colAccion}>
                      {s.estado === 'pendiente' ? (
                        <>
                          <button type="button" onClick={() => handleAprobar(s.uid)} style={styles.botonAprobar} title="Aprobar">✓</button>
                          <button type="button" onClick={() => handleRechazar(s.uid)} style={styles.botonRechazar} title="Rechazar">✕</button>
                        </>
                      ) : (
                        <span style={{ color: '#9CA3AF', fontSize: '13px' }}>--</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>

              {totalPaginas > 1 && (
                <div style={styles.paginador}>
                  <button type="button"                     onClick={() => cargarPagina(pagina - 1)}
                    disabled={pagina <= 1}
                    style={{ ...styles.botonPagina, opacity: pagina <= 1 ? 0.5 : 1 }}
                  >
                    Anterior
                  </button>
                  <span style={styles.infoPagina}>
                    Página {pagina} de {totalPaginas} ({total} total)
                  </span>
                  <button type="button"                     onClick={() => cargarPagina(pagina + 1)}
                    disabled={pagina >= totalPaginas}
                    style={{ ...styles.botonPagina, opacity: pagina >= totalPaginas ? 0.5 : 1 }}
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  contenedor: {
    padding: '24px',
    maxWidth: '1100px',
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
  botonVerLista: {
    padding: '12px 24px',
    backgroundColor: '#1A3C6B',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  bannerExito: {
    background: '#DCFCE7',
    color: '#166534',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px',
  },
  bannerError: {
    background: '#FEE2E2',
    color: '#991B1B',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px',
  },
  cargando: {
    textAlign: 'center',
    padding: '48px',
    color: '#666',
  },
  vacio: {
    textAlign: 'center',
    padding: '48px',
  },
  iconoVacio: {
    color: '#666',
    fontSize: '16px',
  },
  tabla: {
    background: '#FFFFFF',
    borderRadius: '8px',
    border: '1px solid #E5E7EB',
    overflow: 'hidden',
  },
  header: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1.5fr 100px 120px 100px',
    padding: '12px 16px',
    background: '#F9FAFB',
    borderBottom: '1px solid #E5E7EB',
    fontWeight: '600',
    fontSize: '13px',
    color: '#666',
  },
  fila: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1.5fr 100px 120px 100px',
    padding: '12px 16px',
    borderBottom: '1px solid #F3F4F6',
    alignItems: 'center',
    fontSize: '14px',
  },
  colNombre: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  colApellidos: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#666' },
  colEmail: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#666' },
  colEstado: {},
  colRol: {},
  colAccion: { display: 'flex', gap: '8px' },
  badgeEstado: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
  },
  selectRol: {
    padding: '6px 8px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    fontSize: '13px',
    width: '100%',
  },
  botonAprobar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: 'none',
    background: '#10B981',
    color: '#FFFFFF',
    fontSize: '16px',
    cursor: 'pointer',
  },
  botonRechazar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: 'none',
    background: '#EF4444',
    color: '#FFFFFF',
    fontSize: '16px',
    cursor: 'pointer',
  },
  paginador: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '16px',
    borderTop: '1px solid #E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  botonPagina: {
    padding: '8px 16px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    backgroundColor: '#FFFFFF',
    color: '#374151',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
  },
  infoPagina: {
    fontSize: '13px',
    color: '#6B7280',
    fontWeight: '500',
  },
};
