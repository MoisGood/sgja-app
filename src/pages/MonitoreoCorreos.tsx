import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface CorreoLog {
  id: string;
  tipo: string;
  destinatario: string;
  estudiante_id: string | null;
  libro: string | null;
  estado: string;
  error: string | null;
  creado_en: string;
}

export default function MonitoreoCorreos({ idEstablecimiento }: { idEstablecimiento: string }) {
  const [correos, setCorreos] = useState<CorreoLog[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [pagina, setPagina] = useState(1);
  const [porPag, setPorPag] = useState(15);

  useEffect(() => {
    (async () => {
      setCargando(true);
      let q = supabase.from('monitoreo_correos').select('*').eq('id_establecimiento', idEstablecimiento).order('creado_en', { ascending: false });
      if (filtroEstado) q = q.eq('estado', filtroEstado);
      if (filtroTipo) q = q.eq('tipo', filtroTipo);
      const { data } = await q;
      setCorreos(data || []);
      setCargando(false);
    })();
  }, [idEstablecimiento, filtroEstado, filtroTipo]);

  const totalPag = Math.ceil(correos.length / porPag);
  const paginados = correos.slice((pagina - 1) * porPag, pagina * porPag);

  const filtroRow: React.CSSProperties = { padding: '8px 10px', border: '1px solid #E5E7EB', borderRadius: '6px', fontSize: '13px' };

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#1A3C6B', marginBottom: '20px' }}>Monitoreo de Correos</h1>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <select style={filtroRow} value={filtroEstado} onChange={e => { setFiltroEstado(e.target.value); setPagina(1); }}>
          <option value="">Todos los estados</option>
          <option value="exito">Exito</option>
          <option value="falla">Falla</option>
        </select>
        <select style={filtroRow} value={filtroTipo} onChange={e => { setFiltroTipo(e.target.value); setPagina(1); }}>
          <option value="">Todos los tipos</option>
          <option value="vencido">Vencido</option>
          <option value="devuelto">Devuelto</option>
          <option value="multa">Multa</option>
        </select>
        <span style={{ fontSize: '13px', color: '#6B7280', alignSelf: 'center' }}>{correos.length} registro(s)</span>
        <select style={filtroRow} value={porPag} onChange={e => { setPorPag(Number(e.target.value)); setPagina(1); }}>
          <option value={15}>15</option>
          <option value={30}>30</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>
      {cargando ? <p style={{ color: '#6B7280' }}>Cargando…</p> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #E5E7EB' }}>
                <th style={{ textAlign: 'left', padding: '10px', color: '#6B7280', fontWeight: 600 }}>Fecha</th>
                <th style={{ textAlign: 'left', padding: '10px', color: '#6B7280', fontWeight: 600 }}>Tipo</th>
                <th style={{ textAlign: 'left', padding: '10px', color: '#6B7280', fontWeight: 600 }}>Destinatario</th>
                <th style={{ textAlign: 'left', padding: '10px', color: '#6B7280', fontWeight: 600 }}>Estudiante</th>
                <th style={{ textAlign: 'left', padding: '10px', color: '#6B7280', fontWeight: 600 }}>Libro</th>
                <th style={{ textAlign: 'left', padding: '10px', color: '#6B7280', fontWeight: 600 }}>Estado</th>
                <th style={{ textAlign: 'left', padding: '10px', color: '#6B7280', fontWeight: 600 }}>Error</th>
              </tr>
            </thead>
            <tbody>
              {paginados.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '10px', whiteSpace: 'nowrap' }}>{new Date(c.creado_en).toLocaleString()}</td>
                  <td style={{ padding: '10px' }}>{c.tipo}</td>
                  <td style={{ padding: '10px' }}>{c.destinatario}</td>
                  <td style={{ padding: '10px' }}>{c.estudiante_id || '—'}</td>
                  <td style={{ padding: '10px' }}>{c.libro || '—'}</td>
                  <td style={{ padding: '10px' }}>{c.estado === 'exito' ? <span style={{ color: '#10B981', fontWeight: 700 }}>✓</span> : <span style={{ color: '#EF4444', fontWeight: 700 }}>✕</span>}</td>
                  <td style={{ padding: '10px', color: '#EF4444', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.error || '—'}</td>
                </tr>
              ))}
              {paginados.length === 0 && <tr><td colSpan={7} style={{ padding: '20px', textAlign: 'center', color: '#9CA3AF' }}>Sin registros</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      {totalPag > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '16px 0', alignItems: 'center' }}>
          <button type="button" disabled={pagina <= 1} onClick={() => setPagina(p => p - 1)} style={{ padding: '6px 14px', background: pagina <= 1 ? '#E5E7EB' : '#1A3C6B', color: '#FFF', border: 'none', borderRadius: '6px', cursor: pagina <= 1 ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '13px' }}>‹ Anterior</button>
          <span style={{ fontSize: '13px', color: '#374151' }}>{pagina} / {totalPag}</span>
          <button type="button" disabled={pagina >= totalPag} onClick={() => setPagina(p => p + 1)} style={{ padding: '6px 14px', background: pagina >= totalPag ? '#E5E7EB' : '#1A3C6B', color: '#FFF', border: 'none', borderRadius: '6px', cursor: pagina >= totalPag ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '13px' }}>Siguiente ›</button>
        </div>
      )}
    </div>
  );
}
