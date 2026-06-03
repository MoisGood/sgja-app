import { supabase } from '../../lib/supabase';
import { cacheService } from '../../services/cacheService';
import type { Book, BookCopy, LibraryRule, LibraryHoliday } from '../../types';
import type { ILibroRepository } from '../interfaces/ILibroRepository';

export class SupabaseLibroRepository implements ILibroRepository {
  private async _invalidarCache(prefix: string): Promise<void> {
    try {
      const keys = await cacheService.getAllKeys();
      const matching = keys.filter(k => k.startsWith(prefix));
      await Promise.all(matching.map(key => cacheService.invalidate(key)));
    } catch { /* silent */ }
  }

  async buscar(idEstablecimiento: string, termino?: string, categoria?: string): Promise<Book[]> {
    const cacheKey = `libros_${idEstablecimiento}_${termino || ''}_${categoria || ''}`;
    const cached = await cacheService.get<Book[]>(cacheKey);
    if (cached) return cached;
    let query = supabase.from('books').select('*').eq('id_establecimiento', idEstablecimiento).eq('activo', true);
    if (termino) query = query.or(`titulo.ilike.%${termino}%,autor.ilike.%${termino}%,isbn.ilike.%${termino}%`);
    if (categoria) query = query.eq('categoria', categoria);
    const { data, error } = await query.order('titulo');
    if (error) throw error;
    const result = (data || []) as Book[];
    await cacheService.set(cacheKey, result, 2);
    return result;
  }

  async obtenerConCopias(bookId: string): Promise<{ book: Book | null; copies: BookCopy[] }> {
    const [bookRes, copiesRes] = await Promise.all([
      supabase.from('books').select('*').eq('id', bookId).single(),
      supabase.from('book_copies').select('*').eq('book_id', bookId).eq('activo', true),
    ]);
    return { book: bookRes.data as Book | null, copies: (copiesRes.data || []) as BookCopy[] };
  }

  async crear(libro: Omit<Book, 'id' | 'created_at' | 'updated_at' | 'activo'>): Promise<{ error: string | null }> {
    const { error } = await supabase.from('books').insert({ ...libro, activo: true });
    if (error) return { error: error.message };
    await this._invalidarCache('libros_');
    return { error: null };
  }

  async actualizar(id: string, datos: Partial<Book>): Promise<{ error: string | null }> {
    const { error } = await supabase.from('books').update({ ...datos, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) return { error: error.message };
    await this._invalidarCache('libros_');
    return { error: null };
  }

  async crearConCopias(book: Omit<Book, 'id' | 'created_at' | 'updated_at' | 'activo'>, cantidadCopias: number): Promise<{ error: string | null }> {
    const { data: newBook, error: errBook } = await supabase.from('books').insert({ ...book, activo: true }).select('id').single();
    if (errBook) return { error: errBook.message };
    const bookId = (newBook as any).id;
    const ts = Date.now().toString(36);
    const copies = [];
    for (let i = 0; i < cantidadCopias; i++) copies.push({
      book_id: bookId, codigo_ejemplar: `${(book.categoria || 'LIB').substring(0, 3).toUpperCase()}-${ts}-${i + 1}`,
      estanteria: 'S/N', fila: 'S/N', estado: 'disponible', id_establecimiento: book.id_establecimiento,
    });
    const { error: errCopies } = await supabase.from('book_copies').insert(copies);
    if (errCopies) return { error: errCopies.message };
    await this._invalidarCache('libros_');
    await this._invalidarCache('ejemplares_');
    return { error: null };
  }

  async agregarCopias(bookId: string, cantidad: number, idEstablecimiento: string): Promise<{ error: string | null }> {
    const ts = Date.now().toString(36);
    const copies = [];
    for (let i = 0; i < cantidad; i++) copies.push({
      book_id: bookId, codigo_ejemplar: `COP-${ts}-${i + 1}`,
      estanteria: 'S/N', fila: 'S/N', estado: 'disponible', id_establecimiento: idEstablecimiento,
    });
    const { error } = await supabase.from('book_copies').insert(copies);
    if (error) return { error: error.message };
    await this._invalidarCache('ejemplares_');
    return { error: null };
  }

  async obtenerCantidadCopias(idsLibros: string[]): Promise<Record<string, number>> {
    const { data, error } = await supabase.from('book_copies').select('book_id').in('book_id', idsLibros).eq('activo', true);
    if (error) return {};
    const counts: Record<string, number> = {};
    for (const row of (data || [])) { const id = (row as any).book_id; counts[id] = (counts[id] || 0) + 1; }
    return counts;
  }

  async obtenerEjemplares(idEstablecimiento: string): Promise<BookCopy[]> {
    const cacheKey = `ejemplares_${idEstablecimiento}`;
    const cached = await cacheService.get<BookCopy[]>(cacheKey);
    if (cached) return cached;
    const { data, error } = await supabase.from('book_copies').select('*, books(titulo, autor)').eq('id_establecimiento', idEstablecimiento).eq('activo', true).order('estanteria').order('fila');
    if (error) throw error;
    const result = (data || []) as unknown as BookCopy[];
    await cacheService.set(cacheKey, result, 2);
    return result;
  }

  async crearEjemplar(copy: Omit<BookCopy, 'id' | 'created_at' | 'updated_at' | 'activo'>): Promise<{ error: string | null }> {
    const { error } = await supabase.from('book_copies').insert({ ...copy, activo: true, estado: 'disponible' });
    if (error) return { error: error.message };
    await this._invalidarCache('ejemplares_');
    return { error: null };
  }

  async actualizarEjemplar(id: string, datos: Partial<BookCopy>): Promise<{ error: string | null }> {
    const { error } = await supabase.from('book_copies').update({ ...datos, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) return { error: error.message };
    await this._invalidarCache('ejemplares_');
    return { error: null };
  }

  async prestar(copyId: string, studentId: string, dueDate: string, userId: string, idEstablecimiento: string): Promise<{ error: string | null }> {
    const { data: copyData } = await supabase.from('book_copies').select('book_id').eq('id', copyId).single();
    if (!copyData) return { error: 'Ejemplar no encontrado' };
    const bookId = (copyData as any).book_id;
    const { data: todas } = await supabase.from('book_copies').select('id').eq('book_id', bookId).eq('activo', true);
    const ids = (todas || []).map((c: any) => c.id);
    const { data: existente } = await supabase.from('library_loans').select('id').in('copy_id', ids).eq('student_id', studentId).in('status', ['Activo', 'atrasado']).maybeSingle();
    if (existente) return { error: 'El estudiante ya tiene un ejemplar de este libro en préstamo' };
    const { error } = await supabase.from('library_loans').insert({ copy_id: copyId, student_id: studentId, due_date: dueDate, delivered_by_user_id: userId, id_establecimiento: idEstablecimiento });
    if (error) return { error: error.message };
    await supabase.from('book_copies').update({ estado: 'prestado', updated_at: new Date().toISOString() }).eq('id', copyId);
    await this._invalidarCache('ejemplares_');
    return { error: null };
  }

  async devolver(loanId: string, copyId: string, userId: string, condicion?: string, fineAmount?: number, suspensionDays?: number, justificationId?: string): Promise<{ error: string | null }> {
    const updateData: any = { status: 'Devuelto', returned_at: new Date().toISOString(), received_by_user_id: userId, updated_at: new Date().toISOString() };
    if (condicion) updateData.return_condition = condicion;
    if (fineAmount !== undefined) updateData.fine_amount = fineAmount;
    if (suspensionDays !== undefined) updateData.suspension_days = suspensionDays;
    if (justificationId) updateData.justification_id = justificationId;
    const { error: loanErr } = await supabase.from('library_loans').update(updateData).eq('id', loanId);
    if (loanErr) return { error: loanErr.message };
    let nuevoEstado = 'disponible';
    if (condicion === 'perdido') nuevoEstado = 'perdido';
    else if (condicion === 'danado') nuevoEstado = 'revision';
    await supabase.from('book_copies').update({ estado: nuevoEstado, updated_at: new Date().toISOString() }).eq('id', copyId);
    await this._invalidarCache('ejemplares_');
    return { error: null };
  }

  async renovar(loanId: string, newDueDate: string): Promise<{ error: string | null }> {
    const { data: loan } = await supabase.from('library_loans').select('renewed_count').eq('id', loanId).single();
    const renewed = ((loan as any)?.renewed_count || 0) + 1;
    const { error } = await supabase.from('library_loans').update({ due_date: newDueDate, renewed_count: renewed, updated_at: new Date().toISOString() }).eq('id', loanId);
    if (error) return { error: error.message };
    return { error: null };
  }

  private async adjuntarDatosPrestamos(loans: any[]): Promise<any[]> {
    const copyIds = [...new Set(loans.map((l: any) => l.copy_id))];
    if (copyIds.length === 0) return loans;
    const { data: copies } = await supabase.from('book_copies').select('id, codigo_ejemplar, estanteria, fila, book_id').in('id', copyIds);
    const bookIds = [...new Set((copies || []).map((c: any) => c.book_id))];
    const { data: books } = await supabase.from('books').select('id, titulo, autor').in('id', bookIds);
    const mapB: Record<string, any> = {}; for (const b of (books || [])) mapB[b.id] = b;
    const mapC: Record<string, any> = {}; for (const c of (copies || [])) mapC[c.id] = { ...c, books: mapB[c.book_id] || null };
    return loans.map((l: any) => ({ ...l, book_copies: mapC[l.copy_id] || null }));
  }

  async obtenerPrestamosActivos(idEstablecimiento: string): Promise<any[]> {
    const { data, error } = await supabase.from('library_loans').select('*').eq('id_establecimiento', idEstablecimiento).in('status', ['Activo', 'atrasado']).order('loan_date', { ascending: false });
    if (error) throw error;
    return this.adjuntarDatosPrestamos(data || []);
  }

  async obtenerHistorialPrestamos(idEstablecimiento: string): Promise<any[]> {
    const { data, error } = await supabase.from('library_loans').select('*').eq('id_establecimiento', idEstablecimiento).order('created_at', { ascending: false }).limit(50);
    if (error) throw error;
    return this.adjuntarDatosPrestamos(data || []);
  }

  async obtenerReglas(idEstablecimiento: string): Promise<LibraryRule[]> {
    const cacheKey = `reglas_${idEstablecimiento}`;
    const cached = await cacheService.get<LibraryRule[]>(cacheKey);
    if (cached) return cached;
    const { data, error } = await supabase.from('library_rules').select('*').eq('id_establecimiento', idEstablecimiento).eq('activo', true);
    if (error) throw error;
    const result = (data || []) as LibraryRule[];
    await cacheService.set(cacheKey, result, 5);
    return result;
  }

  async guardarRegla(idEstablecimiento: string, rol: string, datos: Partial<LibraryRule>): Promise<{ error: string | null }> {
    const { data: existente } = await supabase.from('library_rules').select('id').eq('rol', rol).eq('id_establecimiento', idEstablecimiento).maybeSingle();
    if (existente) {
      const { error } = await supabase.from('library_rules').update({ ...datos, updated_at: new Date().toISOString() }).eq('id', existente.id);
      if (error) return { error: error.message };
    } else {
      const { error } = await supabase.from('library_rules').insert({ ...datos, rol, id_establecimiento: idEstablecimiento });
      if (error) return { error: error.message };
    }
    await this._invalidarCache('reglas_');
    return { error: null };
  }

  async obtenerFestivos(idEstablecimiento: string): Promise<LibraryHoliday[]> {
    const cacheKey = `festivos_${idEstablecimiento}`;
    const cached = await cacheService.get<LibraryHoliday[]>(cacheKey);
    if (cached) return cached;
    const { data, error } = await supabase.from('library_holidays').select('*').or(`id_establecimiento.is.null,id_establecimiento.eq.${idEstablecimiento}`).eq('activo', true).order('fecha');
    if (error) throw error;
    const result = (data || []) as LibraryHoliday[];
    await cacheService.set(cacheKey, result, 5);
    return result;
  }

  async crearFestivo(fecha: string, descripcion: string, anual: boolean, idEstablecimiento: string | null): Promise<{ error: string | null }> {
    const { error } = await supabase.from('library_holidays').insert({ fecha, descripcion, anual, id_establecimiento: idEstablecimiento });
    if (error) return { error: error.message };
    await this._invalidarCache('festivos_');
    return { error: null };
  }

  async eliminarFestivo(id: string): Promise<{ error: string | null }> {
    const { error } = await supabase.from('library_holidays').delete().eq('id', id);
    if (error) return { error: error.message };
    await this._invalidarCache('festivos_');
    return { error: null };
  }

  async calcularFechaVencimiento(desde: Date, dias: number, idEstablecimiento: string): Promise<Date> {
    const festivos = await this.obtenerFestivos(idEstablecimiento);
    const fecha = new Date(desde);
    let count = 0;
    while (count < dias) {
      fecha.setDate(fecha.getDate() + 1);
      const esFinDe = fecha.getDay() === 0 || fecha.getDay() === 6;
      const esFestivo = festivos.some(f => {
        const fd = new Date(f.fecha);
        if (f.anual) return fd.getMonth() === fecha.getMonth() && fd.getDate() === fecha.getDate();
        return fd.toDateString() === fecha.toDateString();
      });
      if (!esFinDe && !esFestivo) count++;
    }
    return fecha;
  }

  async buscarEstudiantes(idEstablecimiento: string, termino: string): Promise<{ id_estudiante: string; nombre_completo: string; rut: string | null; curso: string }[]> {
    const { data, error } = await supabase.from('estudiantes').select('id_estudiante, nombre_completo, rut, curso').eq('id_establecimiento', idEstablecimiento).eq('activo', true).or(`nombre_completo.ilike.%${termino}%,rut.ilike.%${termino}%,id_estudiante.ilike.%${termino}%`).limit(10);
    if (error) throw error;
    return (data || []) as any;
  }
}
