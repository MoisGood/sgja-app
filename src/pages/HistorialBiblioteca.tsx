import { useState, useEffect, useMemo } from 'react';
import { obtenerHistorialPrestamos } from '../services/library';

interface Props { idEstablecimiento: string }

export default function HistorialBiblioteca({ idEstablecimiento }: Props) {
  const [prestamos, setPrestamos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  // Filters
  const [busqEst, setBusqEst] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  // Pagination
  const [pagina, setPagina] = useState(1);
  const porPag = 10;

  useEffect(() => {
    (async () => {
      setCargando(true);
      const data = await obtenerHistorialPrestamos(idEstablecimiento);
      setPrestamos(data);
      setCargando(false);
    })();
  }, [idEstablecimiento]);

  useEffect(() => { setPagina(1); }, [busqEst, fechaDesde, fechaHasta]);

  const filtrados = useMemo(() => {
    let r = prestamos;
    if (busqEst.trim()) {
      const t = busqEst.toLowerCase();
      r = r.filter(p =>
        (p.student_id || '').toLowerCase().includes(t) ||
        (p.book_copies?.books?.titulo || '').toLowerCase().includes(t)
      );
    }
    if (fechaDesde) r = r.filter(p => new Date(p.loan_date) >= new Date(fechaDesde + 'T00:00:00'));
    if (fechaHasta) r = r.filter(p => new Date(p.loan_date) <= new Date(fechaHasta + 'T23:59:59'));
    return r;
  }, [prestamos, busqEst, fechaDesde, fechaHasta]);

  const totalPag = Math.ceil(filtrados.length / porPag);
  const inicio = (pagina - 1) * porPag;
  const paginados = filtrados.slice(inicio, inicio + porPag);

  const inputStyle: React.CSSProperties = {
    padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '13px',
    boxSizing: 'border-box',
  };

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#1A3C6B', marginBottom: '16px' }}>Historial</h1>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: 1, minWidth: '180px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#6B7280', marginBottom: '4px' }}>Buscar estudiante o libro</label>
          <input style={{ ...inputStyle, width: '100%' }} placeholder="Nombre, ID o título..." value={busqEst} onChange={e => setBusqEst(e.target.value)} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#6B7280', marginBottom: '4px' }}>Desde</label>
          <input type="date" style={inputStyle} value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#6B7280', marginBottom: '4px' }}>Hasta</label>
          <input type="date" style={inputStyle} value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} />
        </div>
        {(busqEst || fechaDesde || fechaHasta) && (
          <button type="button" onClick={() => { setBusqEst(''); setFechaDesde(''); setFechaHasta(''); }} style={{ padding: '8px 14px', background: '#6B7280', color: '#FFFFFF', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' }}>✕ Limpiar</button>
        )}
      </div>

      {cargando ? <p style={{ color: '#6B7280' }}>Cargando…</p> : filtrados.length === 0 ? (
        <p style={{ color: '#9CA3AF' }}>Sin resultados {prestamos.length > 0 ? 'para los filtros seleccionados' : ''}</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #E5E7EB' }}>
                <th style={{ textAlign: 'left', padding: '10px', color: '#6B7280', fontWeight: 600 }}>Libro</th>
                <th style={{ textAlign: 'left', padding: '10px', color: '#6B7280', fontWeight: 600 }}>Estudiante</th>
                <th style={{ textAlign: 'left', padding: '10px', color: '#6B7280', fontWeight: 600 }}>Préstamo</th>
                <th style={{ textAlign: 'left', padding: '10px', color: '#6B7280', fontWeight: 600 }}>Vencimiento</th>
                <th style={{ textAlign: 'left', padding: '10px', color: '#6B7280', fontWeight: 600 }}>Devolución</th>
                <th style={{ textAlign: 'left', padding: '10px', color: '#6B7280', fontWeight: 600 }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {paginados.map((p: any) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '10px', fontWeight: 600 }}>{p.book_copies?.books?.titulo || '—'}</td>
                  <td style={{ padding: '10px' }}>{p.student_id}</td>
                  <td style={{ padding: '10px' }}>{new Date(p.loan_date).toLocaleDateString()}</td>
                  <td style={{ padding: '10px' }}>{new Date(p.due_date).toLocaleDateString()}</td>
                  <td style={{ padding: '10px' }}>{p.returned_at ? new Date(p.returned_at).toLocaleDateString() : '—'}</td>
                  <td style={{ padding: '10px' }}>
                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '999px', fontSize: '12px', fontWeight: 600, color: '#FFFFFF', backgroundColor: p.status === 'Devuelto' ? '#10B981' : p.status === 'atrasado' ? '#EF4444' : '#F59E0B' }}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPag > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '16px 0', alignItems: 'center' }}>
              <button type="button" disabled={pagina <= 1} onClick={() => setPagina(p => p - 1)} style={{ padding: '6px 14px', background: pagina <= 1 ? '#E5E7EB' : '#1A3C6B', color: '#FFFFFF', border: 'none', borderRadius: '6px', cursor: pagina <= 1 ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '13px' }}>‹ Anterior</button>
              {Array.from({ length: totalPag }, (_, i) => i + 1).map(p => (
                <button type="button" key={p} onClick={() => setPagina(p)} style={{ padding: '6px 12px', background: p === pagina ? '#1A3C6B' : '#F3F4F6', color: p === pagina ? '#FFFFFF' : '#374151', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>{p}</button>
              ))}
              <button type="button" disabled={pagina >= totalPag} onClick={() => setPagina(p => p + 1)} style={{ padding: '6px 14px', background: pagina >= totalPag ? '#E5E7EB' : '#1A3C6B', color: '#FFFFFF', border: 'none', borderRadius: '6px', cursor: pagina >= totalPag ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '13px' }}>Siguiente ›</button>
            </div>
          )}
          <p style={{ fontSize: '13px', color: '#9CA3AF', textAlign: 'center', margin: 0 }}>Mostrando {inicio + 1}-{Math.min(inicio + porPag, filtrados.length)} de {filtrados.length}</p>
        </div>
      )}
    </div>
  );
}
