import { useState, useEffect, useCallback } from 'react';
import { obtenerEjemplares, crearEjemplar, actualizarEjemplar, buscarLibros } from '../services/library';

interface Props { idEstablecimiento: string }

const ESTADOS = ['disponible', 'prestado', 'perdido', 'revision', 'devuelto-no-procesado'] as const;
const ESTADOS_COLOR: Record<string, string> = {
  disponible: '#10B981', prestado: '#F59E0B', perdido: '#EF4444',
  revision: '#6B7280', 'devuelto-no-procesado': '#8B5CF6',
};

export default function Inventario({ idEstablecimiento }: Props) {
  const [ejemplares, setEjemplares] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState({ book_id: '', codigo_ejemplar: '', estanteria: '', fila: '' });
  const [busqLibro, setBusqLibro] = useState('');
  const [librosEncontrados, setLibrosEncontrados] = useState<any[]>([]);
  const [pagina, setPagina] = useState(1);
  const [porPag, setPorPag] = useState(10);
  const [editId, setEditId] = useState<string | null>(null);
  const [editEstado, setEditEstado] = useState<string>('');
  const [editEstanteria, setEditEstanteria] = useState('');
  const [editFila, setEditFila] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    const data = await obtenerEjemplares(idEstablecimiento);
    setEjemplares(data);
    setCargando(false);
  }, [idEstablecimiento]);

  useEffect(() => { cargar(); }, [cargar]);

  const buscarLibrosHandler = async () => {
    if (!busqLibro.trim()) return;
    const res = await buscarLibros(idEstablecimiento, busqLibro);
    setLibrosEncontrados(res);
  };

  const handleCrear = async () => {
    if (!form.book_id || !form.codigo_ejemplar.trim() || !form.estanteria.trim() || !form.fila.trim()) {
      setError('Todos los campos son obligatorios'); return;
    }
    setError(null);
    const res = await crearEjemplar({
      book_id: form.book_id, codigo_ejemplar: form.codigo_ejemplar.trim(),
      estanteria: form.estanteria.trim(), fila: form.fila.trim(),
      id_establecimiento: idEstablecimiento,
    } as any);
    if (res.error) { setError(res.error); return; }
    setExito('Ejemplar agregado');
    setTimeout(() => setExito(null), 3000);
    setMostrarForm(false);
    setForm({ book_id: '', codigo_ejemplar: '', estanteria: '', fila: '' });
    setLibrosEncontrados([]);
    cargar();
  };

  const inputStyle: React.CSSProperties = { padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' };

  const filtrados = ejemplares.filter(e => {
    const matchTexto = !busqueda || (e.books?.titulo || '').toLowerCase().includes(busqueda.toLowerCase()) || e.codigo_ejemplar.toLowerCase().includes(busqueda.toLowerCase());
    const matchEstado = !filtroEstado || e.estado === filtroEstado;
    return matchTexto && matchEstado;
  });

  const pagFiltrados = filtrados.slice((pagina - 1) * porPag, pagina * porPag);
  const totalPag = Math.ceil(filtrados.length / porPag);

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#1A3C6B', marginBottom: '24px' }}>Inventario</h1>

      {error && <p style={{ color: '#DC2626', fontSize: '14px', marginBottom: '12px' }}>{error}</p>}
      {exito && <p style={{ color: '#10B981', fontSize: '14px', marginBottom: '12px' }}>{exito}</p>}

        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <input style={{ ...inputStyle, flex: 1, minWidth: '200px' }} placeholder="Buscar por libro o código..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
          <select style={{ ...inputStyle, width: '160px' }} value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
            <option value="">Todos los estados</option>
            {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          <select value={porPag} onChange={e => { setPorPag(parseInt(e.target.value)); setPagina(1); }} style={{ ...inputStyle, width: '130px' }}>
            <option value={10}>10 por pág.</option>
            <option value={20}>20 por pág.</option>
            <option value={30}>30 por pág.</option>
          </select>
          <button type="button" onClick={() => setMostrarForm(!mostrarForm)} style={{ padding: '10px 20px', background: '#3B82F6', color: '#FFFFFF', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>
            + Agregar Ejemplar
          </button>
        </div>

      {mostrarForm && (
        <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1A3C6B', marginBottom: '16px' }}>Nuevo Ejemplar</h2>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <input style={{ ...inputStyle, flex: 1 }} placeholder="Buscar libro..." value={busqLibro} onChange={e => setBusqLibro(e.target.value)} onKeyDown={e => e.key === 'Enter' && buscarLibrosHandler()} />
            <button type="button" onClick={buscarLibrosHandler} style={{ padding: '10px 16px', background: '#3B82F6', color: '#FFFFFF', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Buscar</button>
          </div>

          {librosEncontrados.map(l => (
            <button type="button" key={l.id} onClick={() => { setForm(f => ({ ...f, book_id: l.id })); setLibrosEncontrados([]); setBusqLibro(l.titulo); }} style={{ padding: '10px', borderBottom: '1px solid #F3F4F6', cursor: 'pointer', border: 'none', background: 'none', width: '100%', textAlign: 'left', display: 'block' }}>
              <p style={{ fontWeight: 600, fontSize: '14px', margin: 0 }}>{l.titulo}</p>
              <p style={{ fontSize: '13px', color: '#6B7280', margin: '4px 0 0 0' }}>{l.autor}</p>
            </button>
          ))}

          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
            <input style={{ ...inputStyle, flex: 1 }} placeholder="Código ejemplar" value={form.codigo_ejemplar} onChange={e => setForm(f => ({ ...f, codigo_ejemplar: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
            <input style={{ ...inputStyle, flex: 1 }} placeholder="Estantería (ej: 1)" value={form.estanteria} onChange={e => setForm(f => ({ ...f, estanteria: e.target.value }))} />
            <input style={{ ...inputStyle, flex: 1 }} placeholder="Fila (ej: A)" value={form.fila} onChange={e => setForm(f => ({ ...f, fila: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="button" onClick={handleCrear} style={{ padding: '10px 24px', background: '#10B981', color: '#FFFFFF', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Guardar</button>
            <button type="button" onClick={() => setMostrarForm(false)} style={{ padding: '10px 24px', background: '#6B7280', color: '#FFFFFF', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
          </div>
        </div>
      )}

      {cargando ? <p style={{ color: '#6B7280' }}>Cargando…</p> : filtrados.length === 0 ? (
        <p style={{ color: '#9CA3AF' }}>Sin resultados</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #E5E7EB' }}>
                <th style={{ textAlign: 'left', padding: '10px', color: '#6B7280', fontWeight: 600 }}>Código</th>
                <th style={{ textAlign: 'left', padding: '10px', color: '#6B7280', fontWeight: 600 }}>Libro</th>
                <th style={{ textAlign: 'left', padding: '10px', color: '#6B7280', fontWeight: 600 }}>Ubicación</th>
                <th style={{ textAlign: 'left', padding: '10px', color: '#6B7280', fontWeight: 600 }}>Estado</th>
                <th style={{ padding: '10px' }}></th>
              </tr>
            </thead>
            <tbody>
              {pagFiltrados.map((e: any) => (
                <tr key={e.id} style={{ borderBottom: '1px solid #F3F4F6', backgroundColor: editId === e.id ? '#F0FDF4' : 'transparent' }}>
                  {editId === e.id ? (
                    <>
                      <td style={{ padding: '8px', fontWeight: 600 }}>{e.codigo_ejemplar}</td>
                      <td style={{ padding: '8px' }}>{e.books?.titulo || '—'}</td>
                      <td style={{ padding: '8px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <input style={{ ...inputStyle, width: '70px' }} value={editEstanteria} onChange={e => setEditEstanteria(e.target.value)} placeholder="Est." />
                          <input style={{ ...inputStyle, width: '60px' }} value={editFila} onChange={e => setEditFila(e.target.value)} placeholder="Fila" />
                        </div>
                      </td>
                      <td style={{ padding: '8px' }}>
                        <select value={editEstado} onChange={e => setEditEstado(e.target.value)} style={inputStyle}>
                          {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button type="button" onClick={async () => {
                            const res = await actualizarEjemplar(e.id, { estado: editEstado, estanteria: editEstanteria, fila: editFila } as any);
                            if (res.error) { setError(res.error); return; }
                            setExito('Ejemplar actualizado'); setTimeout(() => setExito(null), 3000); setEditId(null); cargar();
                          }} style={{ padding: '6px 10px', background: '#10B981', color: '#FFFFFF', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>✓</button>
                          <button type="button" onClick={() => setEditId(null)} style={{ padding: '6px 10px', background: '#6B7280', color: '#FFFFFF', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>✕</button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ padding: '10px', fontWeight: 600 }}>{e.codigo_ejemplar}</td>
                      <td style={{ padding: '10px' }}>{e.books?.titulo || '—'}</td>
                      <td style={{ padding: '10px', color: '#6B7280' }}>Est. {e.estanteria} - Fila {e.fila}</td>
                      <td style={{ padding: '10px' }}>
                        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '999px', fontSize: '12px', fontWeight: 600, color: '#FFFFFF', backgroundColor: ESTADOS_COLOR[e.estado] || '#6B7280' }}>
                          {e.estado}
                        </span>
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <button type="button" onClick={() => { setEditId(e.id); setEditEstado(e.estado); setEditEstanteria(e.estanteria); setEditFila(e.fila); }} title="Editar" style={{ padding: '4px 8px', background: 'transparent', border: '1px solid #3B82F6', color: '#3B82F6', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>✎</button>
                      </td>
                    </>
                  )}
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
        </div>
      )}
    </div>
  );
}
