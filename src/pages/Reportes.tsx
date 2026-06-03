// ============================================================
// SGJA – Página de Reportes
// src/pages/Reportes.tsx
// ============================================================

import { useState, useEffect } from 'react';
import { obtenerSolicitudesDelEstablecimiento } from '../services/database';
import type { Solicitud } from '../types';
import { EstadoSolicitud, TipoRegistro } from '../types';

interface Props {
  idEstablecimiento: string;
}

export default function Reportes({ idEstablecimiento }: Props) {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<string>('');
  const [tipoFiltro, setTipoFiltro] = useState<string>('');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError(null);
      const data = await obtenerSolicitudesDelEstablecimiento(idEstablecimiento);
      setSolicitudes(data || []);
    } catch (err) {
      setError('Error al cargar los reportes');
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  // Filtrar solicitudes
  const solicitudesFiltradas = solicitudes.filter((s) => {
    if (fechaInicio && s.fecha < fechaInicio) return false;
    if (fechaFin && s.fecha > fechaFin) return false;
    if (estadoFiltro && s.estado !== estadoFiltro) return false;
    if (tipoFiltro && s.tipo !== tipoFiltro) return false;
    return true;
  });

  // Cálculos
  const totalRegistros = solicitudesFiltradas.length;
  const justificados = solicitudesFiltradas.filter((s) => s.estado === EstadoSolicitud.JUSTIFICADA).length;
  const injustificados = solicitudesFiltradas.filter((s) => s.estado === EstadoSolicitud.INJUSTIFICADA).length;
  const atrasos = solicitudesFiltradas.filter((s) => s.tipo === TipoRegistro.ATRASO).length;
  const inasistencias = solicitudesFiltradas.filter((s) => s.tipo === TipoRegistro.INASISTENCIA).length;

  const descargarCSV = () => {
    if (solicitudesFiltradas.length === 0) {
      alert('No hay datos para descargar');
      return;
    }

    const headers = ['RUT Estudiante', 'Fecha', 'Hora', 'Tipo', 'Estado'];
    const rows = solicitudesFiltradas.map((s) => [
      s.id_estudiante,
      s.fecha,
      s.hora,
      s.tipo,
      s.estado,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  if (cargando) return <div style={styles.container}><p>⏳ Cargando…</p></div>;
  if (error) return <div style={styles.container}><p style={{ color: '#DC2626' }}>❌ {error}</p></div>;

  return (
    <div style={styles.container}>
      <h1 style={styles.titulo}>📊 Reportes</h1>

      {/* Filtros */}
      <div style={styles.seccion}>
        <h2 style={styles.subtitulo}>Filtros</h2>
        <div style={styles.filtrosGrid}>
          <div>
            <label style={styles.label}>Fecha Inicio</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              style={styles.input}
            />
          </div>
          <div>
            <label style={styles.label}>Fecha Fin</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              style={styles.input}
            />
          </div>
          <div>
            <label style={styles.label}>Estado</label>
            <select value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)} style={styles.input}>
              <option value="">Todos</option>
              <option value={EstadoSolicitud.INJUSTIFICADA}>{EstadoSolicitud.INJUSTIFICADA}</option>
              <option value={EstadoSolicitud.JUSTIFICADA}>{EstadoSolicitud.JUSTIFICADA}</option>
              <option value={EstadoSolicitud.RECHAZADA}>{EstadoSolicitud.RECHAZADA}</option>
            </select>
          </div>
          <div>
            <label style={styles.label}>Tipo</label>
            <select value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)} style={styles.input}>
              <option value="">Todos</option>
              <option value={TipoRegistro.ATRASO}>{TipoRegistro.ATRASO}</option>
              <option value={TipoRegistro.INASISTENCIA}>{TipoRegistro.INASISTENCIA}</option>
            </select>
          </div>
          <button type="button" onClick={() => { setFechaInicio(''); setFechaFin(''); setEstadoFiltro(''); setTipoFiltro(''); }} style={styles.botonLimpiar}>
            Limpiar
          </button>
          <button type="button" onClick={descargarCSV} style={styles.botonDescargar}>
            📥 Descargar CSV
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div style={styles.stats}>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Total Registros</p>
          <p style={styles.statValor}>{totalRegistros}</p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Justificados ✅</p>
          <p style={{ ...styles.statValor, color: '#16A34A' }}>{justificados}</p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Injustificados ⏳</p>
          <p style={{ ...styles.statValor, color: '#DC2626' }}>{injustificados}</p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Atrasos ⏰</p>
          <p style={{ ...styles.statValor, color: '#F97316' }}>{atrasos}</p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Inasistencias ❌</p>
          <p style={{ ...styles.statValor, color: '#EF4444' }}>{inasistencias}</p>
        </div>
      </div>

      {/* Tabla */}
      <div style={styles.seccion}>
        <h2 style={styles.subtitulo}>Detalle ({solicitudesFiltradas.length})</h2>
        {solicitudesFiltradas.length === 0 ? (
          <p style={styles.sinDatos}>Sin registros</p>
        ) : (
          <div style={styles.tablaContenedor}>
            <table style={styles.tabla}>
              <thead>
                <tr style={styles.encabezado}>
                  <th style={styles.th}>RUT</th>
                  <th style={styles.th}>Fecha</th>
                  <th style={styles.th}>Hora</th>
                  <th style={styles.th}>Tipo</th>
                  <th style={styles.th}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {solicitudesFiltradas.map((s) => (
                  <tr key={s.id_solicitud} style={styles.fila}>
                    <td style={styles.td}>{s.id_estudiante}</td>
                    <td style={styles.td}>{s.fecha}</td>
                    <td style={styles.td}>{s.hora}</td>
                    <td style={styles.td}>{s.tipo}</td>
                    <td style={{...styles.td, fontWeight: 600, color: s.estado === EstadoSolicitud.JUSTIFICADA ? '#16A34A' : s.estado === EstadoSolicitud.INJUSTIFICADA ? '#DC2626' : '#6B7280'}}>
                      {s.estado}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '24px',
    maxWidth: '1400px',
    margin: '0 auto',
  } as React.CSSProperties,
  titulo: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1A3C6B',
    marginBottom: '24px',
  } as React.CSSProperties,
  subtitulo: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1A3C6B',
    marginBottom: '16px',
  } as React.CSSProperties,
  seccion: {
    background: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '24px',
  } as React.CSSProperties,
  filtrosGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '12px',
  } as React.CSSProperties,
  label: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '4px',
    display: 'block',
  } as React.CSSProperties,
  input: {
    padding: '8px 10px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    fontSize: '13px',
    width: '100%',
    fontFamily: 'inherit',
  } as React.CSSProperties,
  botonLimpiar: {
    padding: '8px 12px',
    background: '#EF4444',
    color: '#FFF',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
  } as React.CSSProperties,
  botonDescargar: {
    padding: '8px 12px',
    background: '#2563EB',
    color: '#FFF',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
  } as React.CSSProperties,
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '12px',
    marginBottom: '24px',
  } as React.CSSProperties,
  statCard: {
    background: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    padding: '16px',
    textAlign: 'center',
  } as React.CSSProperties,
  statLabel: {
    fontSize: '12px',
    color: '#666',
    margin: '0 0 8px 0',
  } as React.CSSProperties,
  statValor: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1A3C6B',
    margin: '0',
  } as React.CSSProperties,
  tablaContenedor: {
    overflowX: 'auto',
  } as React.CSSProperties,
  tabla: {
    width: '100%',
    borderCollapse: 'collapse',
  } as React.CSSProperties,
  encabezado: {
    background: '#F3F4F6',
    fontWeight: '600',
  } as React.CSSProperties,
  th: {
    padding: '10px',
    textAlign: 'left',
    fontSize: '13px',
    borderBottom: '2px solid #D1D5DB',
    color: '#374151',
  } as React.CSSProperties,
  fila: {
    borderTop: '1px solid #E5E7EB',
  } as React.CSSProperties,
  td: {
    padding: '10px',
    fontSize: '13px',
  } as React.CSSProperties,
  sinDatos: {
    textAlign: 'center',
    padding: '20px',
    color: '#999',
  } as React.CSSProperties,
};
