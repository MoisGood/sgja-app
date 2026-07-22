import { useState, useEffect } from 'react';
import {
  justificarAtraso,
  marcarAtrasoInjustificado,
  justificarInasistencia,
  rechazarInasistencia,
  obtenerMotivosDelEstablecimiento,
  escucharSolicitudes,
} from '../services/database';
import type { Solicitud, MotivoJustificacion } from '../types';
import { EstadoSolicitud } from '../types';
import { esAtraso, esInasistencia } from '../utils/tipoRegistroHelper';

interface Props {
  idEstablecimiento: string;
  idUsuario?: string;
}

export default function DashboardParadocente({ idEstablecimiento, idUsuario = '' }: Props) {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [motivos, setMotivos] = useState<MotivoJustificacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroCurso, setFiltroCurso] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'TODOS' | 'ATRASO' | 'INASISTENCIA'>('TODOS');

  // Modal
  const [modalAbierto, setModalAbierto] = useState(false);
  const [solicitudSel, setSolicitudSel] = useState<Solicitud | null>(null);
  const [motivoSel, setMotivoSel] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  useEffect(() => {
    let unsub: () => void = () => {};

    const init = async () => {
      setCargando(true);
      const [motivosData] = await Promise.all([
        obtenerMotivosDelEstablecimiento(idEstablecimiento).catch(() => []),
      ]);
      setMotivos(motivosData);

      unsub = escucharSolicitudes(idEstablecimiento, (data) => {
        setSolicitudes(data);
      });
      setCargando(false);
    };

    init();
    return () => unsub();
  }, [idEstablecimiento]);

  const pendientes = solicitudes.filter((s) => s.estado === EstadoSolicitud.INASISTENTE);
  const atrasosHoy = pendientes.filter(
    (s) => esAtraso(s.tipo) && s.fecha === new Date().toISOString().split('T')[0]
  );
  const inasistenciasHoy = pendientes.filter(
    (s) => esInasistencia(s.tipo) && s.fecha === new Date().toISOString().split('T')[0]
  );
  const justificadosHoy = solicitudes.filter(
    (s) =>
      (s.estado === EstadoSolicitud.ATRASO_JUSTIFICADO || s.estado === EstadoSolicitud.INASISTENCIA_JUSTIFICADA) &&
      s.fecha === new Date().toISOString().split('T')[0]
  );

  const filtradas = pendientes.filter((s) => {
    if (filtroCurso && s.curso !== filtroCurso && s.id_estudiante !== filtroCurso) return false;
    if (filtroTipo === 'ATRASO' && !esAtraso(s.tipo)) return false;
    if (filtroTipo === 'INASISTENCIA' && !esInasistencia(s.tipo)) return false;
    return true;
  });

  const cursos = [...new Set(pendientes.map((s) => s.curso || '').filter(Boolean))].sort();

  const abrirModal = (s: Solicitud) => {
    setSolicitudSel(s);
    setMotivoSel('');
    setObservaciones('');
    setError(null);
    setExito(null);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setSolicitudSel(null);
  };

  const handleJustificar = async () => {
    if (!solicitudSel || !motivoSel) {
      setError('Debes seleccionar un motivo');
      return;
    }
    setGuardando(true);
    setError(null);

    try {
      const motivo = motivos.find((m) => m.id_motivo === motivoSel);
      const codigo = motivo?.codigo || motivoSel;
      const descripcion = motivo?.descripcion || '';

      if (esAtraso(solicitudSel.tipo)) {
        await justificarAtraso(solicitudSel.id_solicitud, codigo, descripcion, idUsuario, observaciones || undefined);
      } else {
        await justificarInasistencia(solicitudSel.id_solicitud, codigo, descripcion, idUsuario, false, observaciones || undefined);
      }

      setExito('Solicitud justificada correctamente');
      setSolicitudes((prev) => prev.filter((s) => s.id_solicitud !== solicitudSel.id_solicitud));
      setTimeout(() => { cerrarModal(); setExito(null); }, 800);
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setGuardando(false);
    }
  };

  const handleRechazar = async (s: Solicitud) => {
    if (!confirm(`Â¿Rechazar esta ${esAtraso(s.tipo) ? 'atraso' : 'inasistencia'}?`)) return;
    try {
      if (esAtraso(s.tipo)) {
        await marcarAtrasoInjustificado(s.id_solicitud, idUsuario);
      } else {
        await rechazarInasistencia(s.id_solicitud, idUsuario);
      }
      setSolicitudes((prev) => prev.filter((x) => x.id_solicitud !== s.id_solicitud));
      setExito('Solicitud rechazada');
      setTimeout(() => setExito(null), 2000);
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : ''}`);
    }
  };

  if (cargando) {
    return <div style={styles.center}><p style={styles.cargando}>Cargando...</p></div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Panel Paradocente</h1>
        <p style={styles.subtitle}>Gesti&oacute;n de atrasos e inasistencias del d&iacute;a</p>
      </div>

      {exito && <div style={styles.bannerExito}>{exito}</div>}
      {error && <div style={styles.bannerError}>{error}</div>}

      {/* Resumen */}
      <div style={styles.grid}>
        <div style={{ ...styles.card, borderLeft: '4px solid #F59E0B' }}>
          <p style={styles.cardNum}>{atrasosHoy.length}</p>
          <p style={styles.cardLabel}>Atrasos pendientes hoy</p>
        </div>
        <div style={{ ...styles.card, borderLeft: '4px solid #EF4444' }}>
          <p style={styles.cardNum}>{inasistenciasHoy.length}</p>
          <p style={styles.cardLabel}>Inasistencias pendientes hoy</p>
        </div>
        <div style={{ ...styles.card, borderLeft: '4px solid #10B981' }}>
          <p style={styles.cardNum}>{justificadosHoy.length}</p>
          <p style={styles.cardLabel}>Justificados hoy</p>
        </div>
        <div style={{ ...styles.card, borderLeft: '4px solid #1A3C6B' }}>
          <p style={styles.cardNum}>{pendientes.length}</p>
          <p style={styles.cardLabel}>Total pendientes</p>
        </div>
      </div>

      {/* Filtros */}
      <div style={styles.filtros}>
        <select value={filtroCurso} onChange={(e) => setFiltroCurso(e.target.value)} style={styles.select}>
          <option value="">Todos los cursos</option>
          {cursos.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value as any)} style={styles.select}>
          <option value="TODOS">Todos los tipos</option>
          <option value="ATRASO">Atrasos</option>
          <option value="INASISTENCIA">Inasistencias</option>
        </select>
      </div>

      {/* Lista */}
      <div style={styles.lista}>
        {filtradas.length === 0 ? (
          <p style={styles.vacio}>No hay solicitudes pendientes</p>
        ) : (
          filtradas.map((s) => (
            <div key={s.id_solicitud} style={styles.item}>
              <div style={styles.itemInfo}>
                <p style={styles.itemTipo}>{esAtraso(s.tipo) ? 'Atraso' : 'Inasistencia'}</p>
                <p style={styles.itemEstudiante}>ID: {s.id_estudiante}</p>
                <p style={styles.itemFecha}>{s.fecha} {s.hora}</p>
                {s.curso && <p style={styles.itemCurso}>Curso: {s.curso}</p>}
              </div>
              <div style={styles.itemAcciones}>
                <button type="button" onClick={() => abrirModal(s)} style={styles.btnJustificar}>
                  Justificar
                </button>
                <button type="button" onClick={() => handleRechazar(s)} style={styles.btnRechazar}>
                  Rechazar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal justificar */}
      {modalAbierto && solicitudSel && (
        <div style={styles.overlay} onClick={cerrarModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Justificar {esAtraso(solicitudSel.tipo) ? 'atraso' : 'inasistencia'}</h2>
            <p style={styles.modalInfo}>Estudiante ID: {solicitudSel.id_estudiante}</p>
            <p style={styles.modalInfo}>Fecha: {solicitudSel.fecha} {solicitudSel.hora}</p>

            <label style={styles.label}>Motivo *</label>
            <select value={motivoSel} onChange={(e) => setMotivoSel(e.target.value)} style={styles.select}>
              <option value="">Selecciona un motivo</option>
              {motivos.map((m) => (
                <option key={m.id_motivo} value={m.id_motivo}>{m.descripcion}</option>
              ))}
            </select>

            <label style={styles.label}>Observaciones</label>
            <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)}
              style={styles.textarea} placeholder="Opcional" rows={3} />

            <div style={styles.modalBtns}>
              <button type="button" onClick={cerrarModal} style={styles.btnCancelar} disabled={guardando}>
                Cancelar
              </button>
              <button type="button" onClick={handleJustificar} style={styles.btnGuardar}
                disabled={guardando || !motivoSel}>
                {guardando ? 'Guardando...' : 'Justificar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: 1000, margin: '0 auto', padding: 24 },
  center: { minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  cargando: { fontSize: 18, color: '#6B7280', fontWeight: 600 },
  header: { marginBottom: 24 },
  title: { fontSize: 26, fontWeight: 700, color: '#1A3C6B', margin: '0 0 4px' },
  subtitle: { fontSize: 14, color: '#6B7280', margin: 0 },
  bannerExito: { background: '#D1FAE5', color: '#065F46', padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontWeight: 600 },
  bannerError: { background: '#FEE2E2', color: '#991B1B', padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontWeight: 600 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 },
  card: { background: '#FFF', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  cardNum: { fontSize: 32, fontWeight: 700, color: '#111827', margin: '0 0 4px' },
  cardLabel: { fontSize: 13, color: '#6B7280', margin: 0, fontWeight: 500 },
  filtros: { display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' },
  select: { padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, background: '#FFF', flex: 1, minWidth: 180 },
  lista: { display: 'flex', flexDirection: 'column', gap: 8 },
  vacio: { textAlign: 'center', color: '#9CA3AF', padding: 40, fontSize: 15 },
  item: { background: '#FFF', borderRadius: 10, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.06)', gap: 12 },
  itemInfo: { flex: 1 },
  itemTipo: { fontSize: 13, fontWeight: 600, color: '#1A3C6B', margin: '0 0 2px' },
  itemEstudiante: { fontSize: 15, fontWeight: 600, color: '#111827', margin: 0 },
  itemFecha: { fontSize: 13, color: '#6B7280', margin: '2px 0 0' },
  itemCurso: { fontSize: 13, color: '#6B7280', margin: 0 },
  itemAcciones: { display: 'flex', gap: 8, flexShrink: 0 },
  btnJustificar: { padding: '8px 18px', background: '#10B981', color: '#FFF', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' },
  btnRechazar: { padding: '8px 18px', background: '#FEE2E2', color: '#991B1B', border: '1px solid #FECACA', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 },
  modal: { background: '#FFF', borderRadius: 12, padding: 28, maxWidth: 440, width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' },
  modalTitle: { fontSize: 20, fontWeight: 700, color: '#111827', margin: '0 0 8px' },
  modalInfo: { fontSize: 14, color: '#6B7280', margin: '0 0 4px' },
  label: { display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginTop: 16, marginBottom: 6 },
  textarea: { width: '100%', padding: 10, border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, resize: 'vertical', boxSizing: 'border-box' },
  modalBtns: { display: 'flex', gap: 12, marginTop: 20 },
  btnCancelar: { flex: 1, padding: '10px 0', background: '#F3F4F6', color: '#374151', border: '1px solid #D1D5DB', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer' },
  btnGuardar: { flex: 1, padding: '10px 0', background: '#10B981', color: '#FFF', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer' },
};
