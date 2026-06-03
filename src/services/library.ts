import { supabase } from '../lib/supabase';
import { SupabaseLibroRepository } from '../repositories/impl/SupabaseLibroRepository';
import type { Book, BookCopy, LibraryHoliday, LibraryRule } from '../types';
import { logAccion } from './monitoreoService';

const repo = new SupabaseLibroRepository();

async function getUserIdFallback(): Promise<string> {
  try { return (await supabase.auth.getUser()).data?.user?.id || 'unknown'; } catch { return 'unknown'; }
}
function getEstab(datos: any): string {
  return datos?.id_establecimiento || datos?.idEstablecimiento || '';
}
function fireLog(accion: string, entidad: string, estado: 'exito' | 'falla', detalle: string | null, idEst: string) {
  getUserIdFallback().then(uid => logAccion(accion, entidad, estado, detalle, uid, idEst));
}

export async function buscarEstudiantes(idEstablecimiento: string, termino: string): Promise<{ id_estudiante: string; nombre_completo: string; rut: string | null; curso: string }[]> {
  return repo.buscarEstudiantes(idEstablecimiento, termino);
}
export async function buscarLibros(idEstablecimiento: string, termino?: string, categoria?: string): Promise<Book[]> {
  return repo.buscar(idEstablecimiento, termino, categoria);
}
export async function obtenerLibroConCopias(bookId: string): Promise<{ book: Book | null; copies: BookCopy[] }> {
  return repo.obtenerConCopias(bookId);
}
export async function crearLibro(book: Omit<Book, 'id' | 'created_at' | 'updated_at' | 'activo'>): Promise<{ error: string | null }> {
  const res = await repo.crear(book);
  fireLog('crear', 'libro', res.error ? 'falla' : 'exito', res.error || `Libro: ${book.titulo}`, book.id_establecimiento);
  return res;
}
export async function actualizarLibro(id: string, datos: Partial<Book>): Promise<{ error: string | null }> {
  const res = await repo.actualizar(id, datos);
  fireLog('actualizar', 'libro', res.error ? 'falla' : 'exito', res.error || `ID: ${id}`, getEstab(datos));
  return res;
}
export async function crearLibroYCopias(book: Omit<Book, 'id' | 'created_at' | 'updated_at' | 'activo'>, cantidadCopias: number): Promise<{ error: string | null }> {
  const res = await repo.crearConCopias(book, cantidadCopias);
  fireLog('crear', 'libro_copias', res.error ? 'falla' : 'exito', res.error || `Libro: ${book.titulo}, ${cantidadCopias} copias`, book.id_establecimiento);
  return res;
}
export async function agregarCopias(bookId: string, cantidad: number, idEstablecimiento: string): Promise<{ error: string | null }> {
  const res = await repo.agregarCopias(bookId, cantidad, idEstablecimiento);
  fireLog('crear', 'ejemplar', res.error ? 'falla' : 'exito', res.error || `Libro ID: ${bookId}, +${cantidad} copias`, idEstablecimiento);
  return res;
}
export async function obtenerCantidadCopias(idsLibros: string[]): Promise<Record<string, number>> {
  return repo.obtenerCantidadCopias(idsLibros);
}
export async function obtenerEjemplares(idEstablecimiento: string): Promise<BookCopy[]> {
  return repo.obtenerEjemplares(idEstablecimiento);
}
export async function crearEjemplar(copy: Omit<BookCopy, 'id' | 'created_at' | 'updated_at' | 'activo'>): Promise<{ error: string | null }> {
  const res = await repo.crearEjemplar(copy);
  fireLog('crear', 'ejemplar', res.error ? 'falla' : 'exito', res.error || `Código: ${copy.codigo_ejemplar}`, copy.id_establecimiento);
  return res;
}
export async function actualizarEjemplar(id: string, datos: Partial<BookCopy>): Promise<{ error: string | null }> {
  const res = await repo.actualizarEjemplar(id, datos);
  fireLog('actualizar', 'ejemplar', res.error ? 'falla' : 'exito', res.error || `ID: ${id}`, getEstab(datos));
  return res;
}
export async function prestarLibro(copyId: string, studentId: string, dueDate: string, userId: string, idEstablecimiento: string): Promise<{ error: string | null }> {
  const res = await repo.prestar(copyId, studentId, dueDate, userId, idEstablecimiento);
  fireLog('prestar', 'prestamo', res.error ? 'falla' : 'exito', res.error || `Estudiante: ${studentId}, Copia: ${copyId}`, idEstablecimiento);
  return res;
}
export async function devolverLibro(loanId: string, copyId: string, userId: string, condicion?: string, fineAmount?: number, suspensionDays?: number, justificationId?: string): Promise<{ error: string | null }> {
  const res = await repo.devolver(loanId, copyId, userId, condicion, fineAmount, suspensionDays, justificationId);
  getUserIdFallback().then(uid => logAccion('devolver', 'prestamo', res.error ? 'falla' : 'exito', res.error || `Loan: ${loanId}, Condición: ${condicion || 'N/A'}`, uid, ''));
  return res;
}
export async function renovarPrestamo(loanId: string, newDueDate: string): Promise<{ error: string | null }> {
  const res = await repo.renovar(loanId, newDueDate);
  getUserIdFallback().then(uid => logAccion('renovar', 'prestamo', res.error ? 'falla' : 'exito', res.error || `Loan: ${loanId}, Nueva fecha: ${newDueDate}`, uid, ''));
  return res;
}
export async function obtenerPrestamosActivos(idEstablecimiento: string): Promise<any[]> {
  return repo.obtenerPrestamosActivos(idEstablecimiento);
}
export async function obtenerHistorialPrestamos(idEstablecimiento: string): Promise<any[]> {
  return repo.obtenerHistorialPrestamos(idEstablecimiento);
}
export async function obtenerReglas(idEstablecimiento: string): Promise<LibraryRule[]> {
  return repo.obtenerReglas(idEstablecimiento);
}
export async function guardarRegla(idEstablecimiento: string, rol: string, datos: Partial<LibraryRule>): Promise<{ error: string | null }> {
  const res = await repo.guardarRegla(idEstablecimiento, rol, datos);
  fireLog('actualizar', 'regla', res.error ? 'falla' : 'exito', res.error || `Rol: ${rol}`, idEstablecimiento);
  return res;
}
export async function obtenerFestivos(idEstablecimiento: string): Promise<LibraryHoliday[]> {
  return repo.obtenerFestivos(idEstablecimiento);
}
export async function crearFestivo(fecha: string, descripcion: string, anual: boolean, idEstablecimiento: string | null): Promise<{ error: string | null }> {
  const res = await repo.crearFestivo(fecha, descripcion, anual, idEstablecimiento);
  fireLog('crear', 'festivo', res.error ? 'falla' : 'exito', res.error || `${descripcion} - ${fecha}`, idEstablecimiento || '');
  return res;
}
export async function eliminarFestivo(id: string): Promise<{ error: string | null }> {
  const res = await repo.eliminarFestivo(id);
  getUserIdFallback().then(uid => logAccion('eliminar', 'festivo', res.error ? 'falla' : 'exito', res.error || `ID: ${id}`, uid, ''));
  return res;
}
export async function calcularFechaVencimiento(desde: Date, dias: number, idEstablecimiento: string): Promise<Date> {
  return repo.calcularFechaVencimiento(desde, dias, idEstablecimiento);
}

export type { Book, BookCopy, LibraryHoliday, LibraryRule };
