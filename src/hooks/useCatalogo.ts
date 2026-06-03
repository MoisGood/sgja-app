import { useState, useEffect } from 'react';
import { buscarLibros, obtenerCantidadCopias } from '../services/library';
import { supabase } from '../lib/supabase';
import type { Book, BookCopy } from '../types';

export function useCatalogo(idEstablecimiento: string, termino: string, categoria: string) {
  const [libros, setLibros] = useState<(Book & { disponibles?: number })[]>([]);
  const [cargando, setCargando] = useState(false);
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
        const [counts, { data: copiesData }] = await Promise.all([
          obtenerCantidadCopias(ids),
          supabase.from('book_copies').select('*').in('book_id', ids).eq('activo', true),
        ]);
        const mapCopias: Record<string, BookCopy[]> = {};
        for (const c of (copiesData || []) as BookCopy[]) {
          if (!mapCopias[c.book_id]) mapCopias[c.book_id] = [];
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

  const abrirDetalle = (id: string): { book: Book; copies: BookCopy[] } | null => {
    const book = libros.find(l => l.id === id);
    if (book) return { book: book as Book, copies: todasCopias[id] || [] };
    return null;
  };

  return { libros, librosPag, cargando, pagina, setPagina, totalPag, abrirDetalle };
}
