import { useState, useEffect } from 'react';
import { buscarLibros, obtenerCantidadCopias, obtenerPrestamosActivos } from '../services/library';
import { supabase } from '../lib/supabase';
import Modal from '../components/Common/Modal';
import type { Book, BookCopy } from '../types';

interface Props { idEstablecimiento: string }

const ESTADOS_COLOR: Record<string, string> = {
  disponible: '#10B981',
  prestado: '#F59E0B',
  perdido: '#EF4444',
  revision: '#6B7280',
  'devuelto-no-procesado': '#8B5CF6',
};

export default function Catalogo({ idEstablecimiento }: Props) {
  const [termino, setTermino] = useState('');
  const [categoria, setCategoria] = useState('');
  const [libros, setLibros] = useState<(Book & { copies?: BookCopy[]; disponibles?: number })[]>([]);
  const [cargando, setCargando] = useState(false);
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<{ book: Book; copies: BookCopy[] } | null>(null);
  const [todasCopias, setTodasCopias] = useState<Record<string, BookCopy[]>>({});
  const [pagina, setPagina] = useState(1);
  const POR_PAGINA = 15;
  const totalPag = Math.ceil(libros.length / POR_PAGINA);
  const librosPag = libros.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  useEffect(() => {
    setPagina(1);
    (async () => {
      setCargando(true);
      const data = await buscarLibros(idEstablecimiento, termino || undefined, categoria || undefined);
      if (data.length > 0) {
        const ids = data.map(b => b.id);
        const [counts, { data: copiesData }, loans] = await Promise.all([
          obtenerCantidadCopias(ids),
          supabase.from('book_copies').select('*').in('book_id', ids).eq('activo', true),
          obtenerPrestamosActivos(idEstablecimiento),
        ]);
        const mapCopias: Record<string, BookCopy[]> = {};
        for (const c of (copiesData || []) as BookCopy[]) {
          if (!mapCopias[c.book_id]) mapCopias[c.book_id] = [];
          (c as any)._prestadoA = loans.find((l: any) => l.copy_id === c.id && (l.status === 'Activo' || l.status === 'atrasado'))?.student_id || null;
          mapCopias[c.book_id].push(c);
        }
        setTodasCopias(mapCopias);
        setLibros(data.map(b => ({ ...b, disponibles: counts[b.id] || 0 })));
      } else {
        setLibros([]);
      }
      setCargando(false);
    })();
  }, [idEstablecimiento, termino, categoria]);

  const abrirDetalle = (id: string) => {
    setSeleccionado(id);
    const book = libros.find(l => l.id === id);
    if (book) setDetalle({ book: book as Book, copies: todasCopias[id] || [] });
  };

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#1A3C6B', marginBottom: '24px' }}>Catálogo</h1>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <input
          placeholder="Buscar por título o autor..."
          value={termino}
          onChange={e => setTermino(e.target.value)}
          style={{ flex: 1, padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px' }}
        />
        <input
          placeholder="Categoría"
          value={categoria}
          onChange={e => setCategoria(e.target.value)}
          style={{ width: '200px', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px' }}
        />
      </div>

      {cargando && <p style={{ color: '#6B7280' }}>Buscando...</p>}

      <Modal abierto={!!detalle} onCerrar={() => setDetalle(null)} titulo={detalle?.book.titulo || ''} tamaño="grande">
        {detalle && (
          <div>
            <p style={{ fontSize: '14px', color: '#6B7280', margin: '0 0 4px 0' }}>{detalle.book.autor} {detalle.book.isbn && `| ISBN: ${detalle.book.isbn}`}</p>
            <p style={{ fontSize: '13px', color: '#9CA3AF', margin: '0 0 12px 0' }}>{detalle.book.categoria} {detalle.book.editorial && `| ${detalle.book.editorial}`}</p>
            {detalle.book.descripcion && <p style={{ fontSize: '14px', color: '#374151', marginBottom: '16px' }}>{detalle.book.descripcion}</p>}
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>Ejemplares ({detalle.copies.length})</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E5E7EB' }}>
                  <th style={{ textAlign: 'left', padding: '8px', fontSize: '13px', color: '#6B7280' }}>Código</th>
                  <th style={{ textAlign: 'left', padding: '8px', fontSize: '13px', color: '#6B7280' }}>Ubicación</th>
                  <th style={{ textAlign: 'left', padding: '8px', fontSize: '13px', color: '#6B7280' }}>Estado</th>
                  <th style={{ textAlign: 'left', padding: '8px', fontSize: '13px', color: '#6B7280' }}>Prestado a</th>
                </tr>
              </thead>
              <tbody>
                {detalle.copies.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '8px', fontSize: '14px' }}>{c.codigo_ejemplar}</td>
                  <td style={{ padding: '8px', fontSize: '14px' }}>Estantería {c.estanteria} - Fila {c.fila}</td>
                  <td style={{ padding: '8px' }}>
                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '999px', fontSize: '12px', fontWeight: 600, color: '#FFFFFF', backgroundColor: ESTADOS_COLOR[c.estado] || '#6B7280' }}>
                      {c.estado}
                    </span>
                  </td>
                  <td style={{ padding: '8px', fontSize: '13px', color: (c as any)._prestadoA ? '#DC2626' : '#9CA3AF' }}>
                    {(c as any)._prestadoA || '—'}
                  </td>
                </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      <div style={{ display: 'grid', gap: '12px' }}>
        {librosPag.map(libro => {
          const disponibles = (libro as any).copies?.filter((c: BookCopy) => c.estado === 'disponible').length;
          return (
            <div
              key={libro.id}
              onClick={() => abrirDetalle(libro.id)}
              style={{
                background: '#FFFFFF', borderRadius: '8px', padding: '16px', cursor: 'pointer',
                border: seleccionado === libro.id ? '2px solid #3B82F6' : '1px solid #E5E7EB',
                transition: 'border-color 0.15s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '15px', color: '#111827', margin: 0 }}>{libro.titulo}</p>
                  <p style={{ fontSize: '13px', color: '#6B7280', margin: '4px 0 0 0' }}>{libro.autor} · {libro.categoria}</p>
                </div>
                <span style={{ fontSize: '13px', color: '#6B7280', whiteSpace: 'nowrap' }}>
                  {disponibles !== undefined ? `${disponibles} disponibles` : ''}
                </span>
              </div>
            </div>
          );
        })}
        {!cargando && libros.length === 0 && <p style={{ color: '#9CA3AF', textAlign: 'center', padding: '40px' }}>Sin resultados</p>}
      </div>

      {totalPag > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
          <button type="button" disabled={pagina <= 1} onClick={() => setPagina(p => p - 1)} style={{ padding: '6px 14px', background: pagina <= 1 ? '#E5E7EB' : '#1A3C6B', color: '#FFFFFF', border: 'none', borderRadius: '6px', cursor: pagina <= 1 ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '13px' }}>‹ Anterior</button>
          {Array.from({ length: totalPag }, (_, i) => i + 1).map(p => (
            <button type="button" key={p} onClick={() => setPagina(p)} style={{ padding: '6px 12px', background: p === pagina ? '#1A3C6B' : '#F3F4F6', color: p === pagina ? '#FFFFFF' : '#374151', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>{p}</button>
          ))}
          <button type="button" disabled={pagina >= totalPag} onClick={() => setPagina(p => p + 1)} style={{ padding: '6px 14px', background: pagina >= totalPag ? '#E5E7EB' : '#1A3C6B', color: '#FFFFFF', border: 'none', borderRadius: '6px', cursor: pagina >= totalPag ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '13px' }}>Siguiente ›</button>
        </div>
      )}
    </div>
  );
}
