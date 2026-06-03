import { useState, useEffect } from 'react';
import { obtenerPrestamosActivos, prestarLibro, devolverLibro, renovarPrestamo, buscarLibros, obtenerLibroConCopias, buscarEstudiantes, obtenerReglas, calcularFechaVencimiento } from '../services/library';
import type { BookCopy } from '../types';

export function usePrestamos(idEstablecimiento: string, usuarioId: string) {
  const [prestamos, setPrestamos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  const cargar = async () => {
    setCargando(true);
    const data = await obtenerPrestamosActivos(idEstablecimiento);
    setPrestamos(data);
    setCargando(false);
  };

  useEffect(() => { cargar(); }, [idEstablecimiento]);

  const [modo, setModo] = useState<'lista' | 'prestar'>('lista');
  const [busqueda, setBusqueda] = useState('');
  const [libros, setLibros] = useState<any[]>([]);
  const [copySel, setCopySel] = useState<BookCopy | null>(null);
  const [studentSel, setStudentSel] = useState<{ id_estudiante: string; nombre_completo: string; rut: string | null; curso: string } | null>(null);
  const [busqEst, setBusqEst] = useState('');
  const [resultEst, setResultEst] = useState<any[]>([]);
  const [modalCondicion, setModalCondicion] = useState<{ loanId: string; copyId: string } | null>(null);

  const buscarLibro = async () => {
    if (!busqueda.trim()) return;
    const res = await buscarLibros(idEstablecimiento, busqueda);
    setLibros(res);
  };

  const seleccionarCopia = async (bookId: string) => {
    const res = await obtenerLibroConCopias(bookId);
    const disp = res.copies.filter(c => c.estado === 'disponible');
    if (disp.length === 0) { setError('No hay ejemplares disponibles'); return; }
    setCopySel(disp[0]);
  };

  const buscarEst = async () => {
    if (!busqEst.trim()) return;
    const res = await buscarEstudiantes(idEstablecimiento, busqEst.trim());
    setResultEst(res);
  };

  const handlePrestar = async () => {
    if (!copySel || !studentSel) { setError('Selecciona un ejemplar y un estudiante'); return; }
    const reglas = await obtenerReglas(idEstablecimiento);
    const regla = reglas.find(r => r.rol === 'ESTUDIANTE');
    const diasPrestamo = regla?.dias_prestamo || 7;
    const due = await calcularFechaVencimiento(new Date(), diasPrestamo, idEstablecimiento);
    setError(null);
    const res = await prestarLibro(copySel.id, studentSel.id_estudiante, due.toISOString(), usuarioId, idEstablecimiento);
    if (res.error) { setError(res.error); return; }
    setExito('Préstamo registrado');
    setTimeout(() => setExito(null), 3000);
    setModo('lista');
    setCopySel(null);
    setStudentSel(null);
    setBusqEst('');
    setResultEst([]);
    setBusqueda('');
    setLibros([]);
    cargar();
  };

  const handleDevolver = async (loanId: string, copyId: string, condicion?: string) => {
    const res = await devolverLibro(loanId, copyId, usuarioId, condicion);
    if (res.error) { setError(res.error); return; }
    const msgs: Record<string, string> = { bueno: 'Devuelto en buen estado', danado: 'Devuelto con daños', perdido: 'Marcado como perdido' };
    setExito(msgs[condicion || 'bueno'] || 'Devolución registrada');
    setTimeout(() => setExito(null), 3000);
    cargar();
  };

  const handleRenovar = async (loanId: string) => {
    const reglas = await obtenerReglas(idEstablecimiento);
    const regla = reglas.find(r => r.rol === 'ESTUDIANTE');
    const dias = regla?.dias_prestamo || 7;
    const due = await calcularFechaVencimiento(new Date(), dias, idEstablecimiento);
    const res = await renovarPrestamo(loanId, due.toISOString());
    if (res.error) { setError(res.error); return; }
    setExito(`Préstamo renovado (+${dias} días)`);
    setTimeout(() => setExito(null), 3000);
    cargar();
  };

  return {
    prestamos, cargando, error, exito, setError, setExito,
    modo, setModo, busqueda, setBusqueda, libros, copySel, studentSel, setStudentSel,
    busqEst, setBusqEst, resultEst, setResultEst, modalCondicion, setModalCondicion,
    buscarLibro, seleccionarCopia, buscarEst, handlePrestar, handleDevolver, handleRenovar, cargar,
  };
}
