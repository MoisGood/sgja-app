import { useState, useEffect, useCallback } from 'react';
import { buscarLibros, crearLibro, crearLibroYCopias, actualizarLibro, obtenerCantidadCopias, agregarCopias } from '../services/library';
import Modal from '../components/Common/Modal';
import Button from '../components/Common/Button';
import type { Book } from '../types';

interface Props { idEstablecimiento: string }

export default function MantenedorLibros({ idEstablecimiento }: Props) {
  const [libros, setLibros] = useState<Book[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ titulo: '', autor: '', isbn: '', editorial: '', anio_publicacion: '', categoria: '', descripcion: '', cantidad_copias: 1 });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const POR_PAGINA = 15;
  const totalPaginas = Math.ceil(libros.length / POR_PAGINA);
  const inicio = (paginaActual - 1) * POR_PAGINA;
  const librosPaginados = libros.slice(inicio, inicio + POR_PAGINA);

  const [copiasCount, setCopiasCount] = useState<Record<string, number>>({});
  const [mostrarCarga, setMostrarCarga] = useState(false);
  const [csvPreview, setCsvPreview] = useState<{ titulo: string; autor: string; categoria: string; ejemplares: number; estado: string }[]>([]);
  const [csvSubiendo, setCsvSubiendo] = useState(false);
  const [csvProgreso, setCsvProgreso] = useState(0);

  const cargar = useCallback(async () => {
    setCargando(true);
    const data = await buscarLibros(idEstablecimiento, busqueda || undefined);
    setLibros(data);
    if (data.length > 0) {
      const counts = await obtenerCantidadCopias(data.map(b => b.id));
      setCopiasCount(counts);
    }
    setCargando(false);
  }, [idEstablecimiento, busqueda]);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    const delay = setTimeout(() => { cargar(); setPaginaActual(1); }, 300);
    return () => clearTimeout(delay);
  }, [busqueda, cargar]);

  const abrirNuevo = () => {
    setEditId(null);
    setForm({ titulo: '', autor: '', isbn: '', editorial: '', anio_publicacion: '', categoria: '', descripcion: '', cantidad_copias: 1 });
    setMostrarModal(true);
    setError(null);
  };

  const abrirEditar = (l: Book) => {
    setEditId(l.id);
    setForm({ titulo: l.titulo, autor: l.autor, isbn: l.isbn || '', editorial: l.editorial || '', anio_publicacion: l.anio_publicacion?.toString() || '', categoria: l.categoria, descripcion: l.descripcion || '', cantidad_copias: copiasCount[l.id] || 1 });
    setMostrarModal(true);
    setError(null);
  };

  const handleGuardar = async () => {
    if (!form.titulo.trim() || !form.autor.trim() || !form.categoria.trim()) {
      setError('Título, autor y categoría son obligatorios'); return;
    }
    setGuardando(true); setError(null);
    const payload = {
      titulo: form.titulo.trim(), autor: form.autor.trim(), isbn: form.isbn.trim() || null,
      editorial: form.editorial.trim() || null, anio_publicacion: form.anio_publicacion ? parseInt(form.anio_publicacion) : null,
      categoria: form.categoria.trim(), descripcion: form.descripcion.trim() || null, id_establecimiento: idEstablecimiento,
    };

    if (editId) {
      const res = await actualizarLibro(editId, payload);
      if (res.error) { setError(res.error); setGuardando(false); return; }
      const actual = copiasCount[editId] || 0;
      const nueva = form.cantidad_copias || 1;
      if (nueva > actual) {
        const r2 = await agregarCopias(editId, nueva - actual, idEstablecimiento);
        if (r2.error) { setError(`Libro actualizado, pero error al agregar copias: ${r2.error}`); setGuardando(false); return; }
      }
    } else {
      const copias = form.cantidad_copias || 1;
      const res = copias > 1 ? await crearLibroYCopias(payload as any, copias) : await crearLibro(payload as any);
      if (res.error) { setError(res.error); setGuardando(false); return; }
    }
    setExito(editId ? 'Libro actualizado' : 'Libro creado');
    setTimeout(() => setExito(null), 3000);
    setMostrarModal(false); setGuardando(false); cargar();
  };

  const descargarPlantilla = () => {
    const csv = 'Título,Autor,ISBN,Editorial,Año,Categoría,Descripción,Ejemplares\nEl principito,Antoine de Saint-Exupéry,9780156012195,Editorial,1943,Ficción,Novela corta,3\n';
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'plantilla_libros.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const previsualizarCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null); setCsvPreview([]);
    const text = await file.text();
    const clean = text.replace(/^\uFEFF/, '').replace(/\r/g, '');
    const lines = clean.split('\n').filter(l => l.trim());
    if (lines.length < 2) { setError('El CSV debe tener encabezados + al menos 1 fila'); e.target.value = ''; return; }
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
    const m = (name: string) => headers.findIndex(h => h.replace(/[^a-z]/g, '') === name.replace(/[^a-z]/g, ''));
    const iT = m('titulo'), iA = m('autor'), iC = m('categoria'), iE = m('ejemplares');
    if (iT === -1 || iA === -1 || iC === -1) { setError(`Columnas detectadas: ${headers.join(', ')}`); e.target.value = ''; return; }

    const existentes = new Set(libros.map(l => `${l.titulo.toLowerCase()}|${l.autor.toLowerCase()}`));
    const vistos = new Set<string>();
    const preview: typeof csvPreview = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim());
      const titulo = cols[iT] || '';
      const autor = cols[iA] || '';
      const categoria = cols[iC] || '';
      const ejemplares = iE >= 0 ? parseInt(cols[iE]) || 1 : 1;

      if (!titulo || !autor || !categoria) { preview.push({ titulo, autor, categoria, ejemplares, estado: '❌ Campos vacíos' }); continue; }

      const key = `${titulo.toLowerCase()}|${autor.toLowerCase()}`;
      if (vistos.has(key)) { preview.push({ titulo, autor, categoria, ejemplares, estado: '⚠️ Duplicado en CSV' }); continue; }
      vistos.add(key);
      if (existentes.has(key)) { preview.push({ titulo, autor, categoria, ejemplares, estado: '⚠️ Ya existe' }); continue; }

      preview.push({ titulo, autor, categoria, ejemplares, estado: '✅ OK' });
    }

    setCsvPreview(preview);
    e.target.value = '';
  };

  const subirCsv = async () => {
    const okRows = csvPreview.filter(r => r.estado === '✅ OK');
    if (okRows.length === 0) return;
    setCsvSubiendo(true); setCsvProgreso(0);
    for (let i = 0; i < okRows.length; i++) {
      const r = okRows[i];
      await crearLibroYCopias({
        titulo: r.titulo, autor: r.autor, categoria: r.categoria,
        isbn: null, editorial: null, anio_publicacion: null, descripcion: null,
        id_establecimiento: idEstablecimiento,
      } as any, r.ejemplares);
      setCsvProgreso(Math.round(((i + 1) / okRows.length) * 100));
    }
    setCsvPreview([]); setCsvSubiendo(false); setMostrarCarga(false); cargar();
  };

  const inputStyle: React.CSSProperties = { padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', width: '100%' };
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px' };

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#1A3C6B', marginBottom: '24px' }}>Libros</h1>

      {error && <p style={{ color: '#DC2626', fontSize: '14px', marginBottom: '12px', padding: '8px 12px', background: '#FEF2F2', borderRadius: '6px' }}>{error}</p>}
      {exito && <p style={{ color: '#10B981', fontSize: '14px', marginBottom: '12px', padding: '8px 12px', background: '#F0FDF4', borderRadius: '6px' }}>{exito}</p>}


      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <input placeholder="Buscar por título o autor..." value={busqueda} onChange={e => setBusqueda(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: '200px' }} />
        <button type="button" onClick={abrirNuevo} style={{ padding: '10px 20px', background: '#3B82F6', color: '#FFFFFF', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>+ Nuevo Libro</button>
        <button type="button" onClick={() => setMostrarCarga(!mostrarCarga)} style={{ padding: '10px 20px', background: '#8B5CF6', color: '#FFFFFF', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>📦 Carga masiva</button>
        <button type="button" onClick={descargarPlantilla} style={{ padding: '10px 20px', background: '#F59E0B', color: '#FFFFFF', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>📄 Plantilla CSV</button>
      </div>

      {mostrarCarga && (
        <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1A3C6B', marginBottom: '8px' }}>Carga masiva</h2>
          <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '16px' }}>Selecciona un archivo CSV (columnas: Título, Autor, Categoría, Ejemplares)</p>
          <input type="file" accept=".csv" onChange={previsualizarCsv} disabled={csvSubiendo} style={{ fontSize: '14px' }} />

          {csvPreview.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #E5E7EB' }}>
                    <th style={{ textAlign: 'left', padding: '8px', color: '#6B7280' }}>Título</th>
                    <th style={{ textAlign: 'left', padding: '8px', color: '#6B7280' }}>Autor</th>
                    <th style={{ textAlign: 'left', padding: '8px', color: '#6B7280' }}>Categoría</th>
                    <th style={{ textAlign: 'center', padding: '8px', color: '#6B7280' }}>Ej.</th>
                    <th style={{ textAlign: 'left', padding: '8px', color: '#6B7280' }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {csvPreview.map((r, i) => (
                    <tr key={`${r.titulo}-${r.autor}-${i}`} style={{ borderBottom: '1px solid #F3F4F6', color: r.estado === '✅ OK' ? '#374151' : '#DC2626' }}>
                      <td style={{ padding: '8px', fontWeight: 600 }}>{r.titulo}</td>
                      <td style={{ padding: '8px' }}>{r.autor}</td>
                      <td style={{ padding: '8px' }}>{r.categoria}</td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>{r.ejemplares}</td>
                      <td style={{ padding: '8px' }}>{r.estado}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {csvSubiendo && (
                <div style={{ marginTop: '16px' }}>
                  <div style={{ width: '100%', height: '8px', background: '#E5E7EB', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${csvProgreso}%`, height: '100%', background: '#10B981', borderRadius: '4px', transition: 'width 0.3s' }} />
                  </div>
                  <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>{csvProgreso}%</p>
                </div>
              )}

              {!csvSubiendo && (
                <button type="button" onClick={subirCsv} style={{ marginTop: '16px', padding: '10px 24px', background: '#10B981', color: '#FFFFFF', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
                  📦 Subir {csvPreview.filter(r => r.estado === '✅ OK').length} libros
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <Modal abierto={mostrarModal} onCerrar={() => setMostrarModal(false)} titulo={editId ? 'Editar Libro' : 'Nuevo Libro'}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div><label style={labelStyle}>Título *</label><input style={inputStyle} value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} /></div>
          <div><label style={labelStyle}>Autor *</label><input style={inputStyle} value={form.autor} onChange={e => setForm(f => ({ ...f, autor: e.target.value }))} /></div>
          <div><label style={labelStyle}>ISBN</label><input style={inputStyle} value={form.isbn} onChange={e => setForm(f => ({ ...f, isbn: e.target.value }))} /></div>
          <div><label style={labelStyle}>Editorial</label><input style={inputStyle} value={form.editorial} onChange={e => setForm(f => ({ ...f, editorial: e.target.value }))} /></div>
          <div><label style={labelStyle}>Año publicación</label><input style={inputStyle} type="number" value={form.anio_publicacion} onChange={e => setForm(f => ({ ...f, anio_publicacion: e.target.value }))} /></div>
          <div><label style={labelStyle}>Categoría *</label><input style={inputStyle} value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))} /></div>
        </div>
        <div style={{ marginTop: '16px' }}><label style={labelStyle}>Descripción</label><textarea style={{ ...inputStyle, minHeight: '80px', fontFamily: 'inherit' }} value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} /></div>
          <div style={{ marginTop: '16px' }}><label style={labelStyle}>Cantidad de ejemplares</label><input type="number" min="1" style={inputStyle} value={form.cantidad_copias} onChange={e => setForm(f => ({ ...f, cantidad_copias: parseInt(e.target.value) || 1 }))} /></div>
        {error && <p style={{ color: '#DC2626', fontSize: '14px', marginTop: '12px' }}>{error}</p>}
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px', justifyContent: 'flex-end' }}>
          <Button onClick={() => setMostrarModal(false)} tipo="secundario" deshabilitado={guardando}>Cancelar</Button>
          <Button onClick={handleGuardar} tipo="exito" deshabilitado={guardando} cargando={guardando}>{guardando ? '⏳' : '💾'} Guardar</Button>
        </div>
      </Modal>

      {cargando ? <p style={{ color: '#6B7280' }}>Cargando…</p> : libros.length === 0 ? (
        <p style={{ color: '#9CA3AF' }}>Sin resultados</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #E5E7EB' }}>
                <th style={{ textAlign: 'left', padding: '10px', color: '#6B7280', fontWeight: 600 }}>Título</th>
                <th style={{ textAlign: 'left', padding: '10px', color: '#6B7280', fontWeight: 600 }}>Autor</th>
                <th style={{ textAlign: 'left', padding: '10px', color: '#6B7280', fontWeight: 600 }}>Categoría</th>
                <th style={{ textAlign: 'left', padding: '10px', color: '#6B7280', fontWeight: 600 }}>ISBN</th>
                <th style={{ textAlign: 'center', padding: '10px', color: '#6B7280', fontWeight: 600 }}>Ejemplares</th>
                <th style={{ padding: '10px' }}></th>
              </tr>
            </thead>
            <tbody>
              {librosPaginados.map(l => (
                <tr key={l.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '10px', fontWeight: 600 }}>{l.titulo}</td>
                  <td style={{ padding: '10px' }}>{l.autor}</td>
                  <td style={{ padding: '10px' }}>{l.categoria}</td>
                  <td style={{ padding: '10px', color: '#6B7280' }}>{l.isbn || '—'}</td>
                  <td style={{ padding: '10px', textAlign: 'center', fontWeight: 600 }}>{copiasCount[l.id] || 0}</td>
                  <td style={{ padding: '10px' }}>
                    <button type="button" onClick={() => abrirEditar(l)} title="Editar" style={{ padding: '4px 8px', background: 'transparent', border: '1px solid #3B82F6', color: '#3B82F6', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>✎</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPaginas > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '16px 0' }}>
              <button type="button" disabled={paginaActual <= 1} onClick={() => setPaginaActual(p => p - 1)} style={{ padding: '6px 14px', background: paginaActual <= 1 ? '#E5E7EB' : '#1A3C6B', color: '#FFFFFF', border: 'none', borderRadius: '6px', cursor: paginaActual <= 1 ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '13px' }}>‹ Anterior</button>
              {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(p => (
                <button type="button" key={p} onClick={() => setPaginaActual(p)} style={{ padding: '6px 12px', background: p === paginaActual ? '#1A3C6B' : '#F3F4F6', color: p === paginaActual ? '#FFFFFF' : '#374151', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>{p}</button>
              ))}
              <button type="button" disabled={paginaActual >= totalPaginas} onClick={() => setPaginaActual(p => p + 1)} style={{ padding: '6px 14px', background: paginaActual >= totalPaginas ? '#E5E7EB' : '#1A3C6B', color: '#FFFFFF', border: 'none', borderRadius: '6px', cursor: paginaActual >= totalPaginas ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '13px' }}>Siguiente ›</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
