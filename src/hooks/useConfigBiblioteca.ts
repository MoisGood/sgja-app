import { useState, useEffect, useCallback } from 'react';
import { obtenerReglas, guardarRegla, obtenerFestivos, crearFestivo, eliminarFestivo } from '../services/library';
import type { LibraryRule, LibraryHoliday } from '../types';

export function useConfigRoles(idEstablecimiento: string) {
  const [reglas, setReglas] = useState<Record<string, LibraryRule>>({});
  const [editando, setEditando] = useState(false);
  const [valores, setValores] = useState<Record<string, LibraryRule>>({});
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    const data = await obtenerReglas(idEstablecimiento);
    const map: Record<string, LibraryRule> = {};
    for (const r of data) map[r.rol] = r;
    setReglas(map);
    setCargando(false);
  }, [idEstablecimiento]);

  useEffect(() => { cargar(); }, [cargar]);

  const iniciarEdicion = (ROLES: string[], DEFAULTS: any) => {
    const nuevos: Record<string, LibraryRule> = {};
    for (const rol of ROLES) {
      nuevos[rol] = reglas[rol] || { ...DEFAULTS, rol, id_establecimiento: idEstablecimiento, id: '', activo: true } as any;
    }
    setValores(nuevos);
    setEditando(true);
    setError(null);
  };

  const actualizarValor = (rol: string, campo: string, valor: number) => {
    setValores(prev => ({ ...prev, [rol]: { ...prev[rol], [campo]: valor } }));
  };

  const guardar = async (ROLES: string[]) => {
    setGuardando(true); setError(null);
    const results = await Promise.all(ROLES.map(async (rol) => {
      const v = valores[rol]; if (!v) return null;
      const res = await guardarRegla(idEstablecimiento, rol, {
        dias_prestamo: v.dias_prestamo, max_renovaciones: v.max_renovaciones,
        max_prestamos_simultaneos: v.max_prestamos_simultaneos, multa_diaria: v.multa_diaria,
      });
      return { rol, res };
    }));
    const errorResult = results.find(r => r && r.res.error);
    if (errorResult) { setError(`Error en ${errorResult.rol}: ${errorResult.res.error}`); setGuardando(false); return; }
    setExito('Reglas guardadas'); setTimeout(() => setExito(null), 3000);
    setEditando(false); setGuardando(false); cargar();
  };

  return { reglas, editando, valores, cargando, guardando, error, exito, iniciarEdicion, actualizarValor, guardar, setEditando, setError, cargar };
}

export function useFestivos(idEstablecimiento: string) {
  const [festivos, setFestivos] = useState<LibraryHoliday[]>([]);
  const [cargando, setCargando] = useState(true);
  const [fecha, setFecha] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [anual, setAnual] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    const data = await obtenerFestivos(idEstablecimiento);
    setFestivos(data);
    setCargando(false);
  }, [idEstablecimiento]);

  useEffect(() => { cargar(); }, [cargar]);

  const handleAgregar = async () => {
    if (!fecha || !descripcion.trim()) { setError('Selecciona una fecha y escribe una descripción'); return; }
    const diaMes = fecha.slice(5);
    if (festivos.some(f => f.fecha.slice(5) === diaMes)) { setError('Esta fecha ya está registrada'); return; }
    setGuardando(true); setError(null);
    const res = await crearFestivo(fecha, descripcion.trim(), anual, null);
    if (res.error) { setError(res.error); setGuardando(false); return; }
    setExito('Festivo agregado'); setTimeout(() => setExito(null), 3000);
    setFecha(''); setDescripcion(''); setAnual(true); setGuardando(false); cargar();
  };

  const handleEliminar = async (id: string, desc: string) => {
    if (!window.confirm(`¿Eliminar "${desc}"?`)) return;
    const res = await eliminarFestivo(id);
    if (res.error) { setError(res.error); return; }
    cargar();
  };

  return { festivos, cargando, fecha, setFecha, descripcion, setDescripcion, anual, setAnual, guardando, error, exito, handleAgregar, handleEliminar };
}
