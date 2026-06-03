import { useState, useEffect, useCallback } from 'react';
import { obtenerEjemplares, crearEjemplar, actualizarEjemplar, buscarLibros } from '../services/library';

export function useInventario(idEstablecimiento: string) {
  const [ejemplares, setEjemplares] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    const data = await obtenerEjemplares(idEstablecimiento);
    setEjemplares(data);
    setCargando(false);
  }, [idEstablecimiento]);

  useEffect(() => { cargar(); }, [cargar]);

  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState({ book_id: '', codigo_ejemplar: '', estanteria: '', fila: '' });
  const [busqLibro, setBusqLibro] = useState('');
  const [librosEncontrados, setLibrosEncontrados] = useState<any[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [editEstado, setEditEstado] = useState('');

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
    const res = await crearEjemplar({ book_id: form.book_id, codigo_ejemplar: form.codigo_ejemplar.trim(), estanteria: form.estanteria.trim(), fila: form.fila.trim(), id_establecimiento: idEstablecimiento } as any);
    if (res.error) { setError(res.error); return; }
    setExito('Ejemplar agregado'); setTimeout(() => setExito(null), 3000);
    setMostrarForm(false); setForm({ book_id: '', codigo_ejemplar: '', estanteria: '', fila: '' }); setLibrosEncontrados([]); cargar();
  };

  const handleCambiarEstado = async (id: string, estado: string) => {
    if (!estado) return;
    const res = await actualizarEjemplar(id, { estado } as any);
    if (res.error) { setError(res.error); return; }
    setExito('Estado actualizado'); setTimeout(() => setExito(null), 3000);
    setEditId(null); cargar();
  };

  const filtrados = ejemplares.filter((e: any) => {
    const matchTexto = !busqueda || (e.books?.titulo || '').toLowerCase().includes(busqueda.toLowerCase()) || e.codigo_ejemplar.toLowerCase().includes(busqueda.toLowerCase());
    const matchEstado = !filtroEstado || e.estado === filtroEstado;
    return matchTexto && matchEstado;
  });

  return {
    ejemplares, filtrados, cargando, error, setError, exito, setExito,
    busqueda, setBusqueda, filtroEstado, setFiltroEstado,
    mostrarForm, setMostrarForm, form, setForm, busqLibro, setBusqLibro,
    librosEncontrados, editId, setEditId, editEstado, setEditEstado,
    buscarLibrosHandler, handleCrear, handleCambiarEstado, cargar,
  };
}
