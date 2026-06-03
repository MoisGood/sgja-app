import type { Book, BookCopy, LibraryHoliday, LibraryRule } from '../../types';

export interface ILibroRepository {
  buscar(idEstablecimiento: string, termino?: string, categoria?: string): Promise<Book[]>;
  obtenerConCopias(bookId: string): Promise<{ book: Book | null; copies: BookCopy[] }>;
  crear(libro: Omit<Book, 'id' | 'created_at' | 'updated_at' | 'activo'>): Promise<{ error: string | null }>;
  actualizar(id: string, datos: Partial<Book>): Promise<{ error: string | null }>;
  crearConCopias(book: Omit<Book, 'id' | 'created_at' | 'updated_at' | 'activo'>, cantidadCopias: number): Promise<{ error: string | null }>;
  agregarCopias(bookId: string, cantidad: number, idEstablecimiento: string): Promise<{ error: string | null }>;
  obtenerCantidadCopias(idsLibros: string[]): Promise<Record<string, number>>;
  obtenerEjemplares(idEstablecimiento: string): Promise<BookCopy[]>;
  crearEjemplar(copy: Omit<BookCopy, 'id' | 'created_at' | 'updated_at' | 'activo'>): Promise<{ error: string | null }>;
  actualizarEjemplar(id: string, datos: Partial<BookCopy>): Promise<{ error: string | null }>;
  prestar(copyId: string, studentId: string, dueDate: string, userId: string, idEstablecimiento: string): Promise<{ error: string | null }>;
  devolver(loanId: string, copyId: string, userId: string, condicion?: string, fineAmount?: number, suspensionDays?: number, justificationId?: string): Promise<{ error: string | null }>;
  renovar(loanId: string, newDueDate: string): Promise<{ error: string | null }>;
  obtenerPrestamosActivos(idEstablecimiento: string): Promise<any[]>;
  obtenerHistorialPrestamos(idEstablecimiento: string): Promise<any[]>;
  obtenerReglas(idEstablecimiento: string): Promise<LibraryRule[]>;
  guardarRegla(idEstablecimiento: string, rol: string, datos: Partial<LibraryRule>): Promise<{ error: string | null }>;
  obtenerFestivos(idEstablecimiento: string): Promise<LibraryHoliday[]>;
  crearFestivo(fecha: string, descripcion: string, anual: boolean, idEstablecimiento: string | null): Promise<{ error: string | null }>;
  eliminarFestivo(id: string): Promise<{ error: string | null }>;
  calcularFechaVencimiento(desde: Date, dias: number, idEstablecimiento: string): Promise<Date>;
  buscarEstudiantes(idEstablecimiento: string, termino: string): Promise<{ id_estudiante: string; nombre_completo: string; rut: string | null; curso: string }[]>;
}
