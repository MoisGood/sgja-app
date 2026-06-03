import { useState, useEffect, useCallback } from 'react';
import { obtenerFestivos, crearFestivo, eliminarFestivo } from '../services/library';
import { cacheService } from '../services/cacheService';
import type { LibraryHoliday } from '../types';

interface Props { idEstablecimiento: string }

export default function Festivos({ idEstablecimiento }: Props) {
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
    await cacheService.invalidate(`festivos_${idEstablecimiento}`);
    const data = await obtenerFestivos(idEstablecimiento);
    setFestivos(data);
    setCargando(false);
  }, [idEstablecimiento]);

  useEffect(() => { cargar(); }, [cargar]);

  const handleAgregar = async () => {
    if (!fecha || !descripcion.trim()) {
      setError('Selecciona una fecha y escribe una descripción');
      return;
    }
    const diaMes = fecha.slice(5);
    if (festivos.some(f => f.fecha.slice(5) === diaMes)) {
      setError('Esta fecha ya está registrada');
      return;
    }
    setGuardando(true);
    setError(null);
    const res = await crearFestivo(fecha, descripcion.trim(), anual, null);
    if (res.error) { setError(res.error); setGuardando(false); return; }
    setExito('Festivo agregado');
    setTimeout(() => setExito(null), 3000);
    setFecha('');
    setDescripcion('');
    setAnual(true);
    setGuardando(false);
    cargar();
  };

  const handleEliminar = async (id: string, desc: string) => {
    if (!window.confirm(`¿Eliminar "${desc}"?`)) return;
    const res = await eliminarFestivo(id);
    if (res.error) { setError(res.error); return; }
    cargar();
  };

  const inputStyle = { padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' as const };

  return (
    <div>
      {error && <p style={{ color: '#DC2626', fontSize: '14px', marginBottom: '12px', padding: '8px 12px', background: '#FEF2F2', borderRadius: '6px' }}>{error}</p>}
      {exito && <p style={{ color: '#10B981', fontSize: '14px', marginBottom: '12px', padding: '8px 12px', background: '#F0FDF4', borderRadius: '6px' }}>{exito}</p>}

      <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '20px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1A3C6B', marginBottom: '16px' }}>Agregar día no hábil</h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '0 0 200px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Fecha</label>
            <input type="date" style={{ ...inputStyle, width: '100%' }} value={fecha} onChange={e => setFecha(e.target.value)} />
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Motivo</label>
            <input style={{ ...inputStyle, width: '100%' }} placeholder="Ej: Navidad" value={descripcion} onChange={e => setDescripcion(e.target.value)} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '4px' }}>
            <input type="checkbox" id="chkAnual" checked={anual} onChange={e => setAnual(e.target.checked)} />
            <label htmlFor="chkAnual" style={{ fontSize: '14px', color: '#374151', cursor: 'pointer' }}>Se repite todos los años</label>
          </div>
          <button type="button" onClick={handleAgregar} disabled={guardando} style={{ padding: '10px 20px', background: '#10B981', color: '#FFFFFF', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap', opacity: guardando ? 0.6 : 1 }}>
            {guardando ? '⏳' : '+'} Agregar
          </button>
        </div>
      </div>

      <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflowX: 'auto' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1A3C6B', marginBottom: '16px' }}>Días no hábiles registrados ({festivos.length})</h2>
        {cargando ? <p style={{ color: '#6B7280' }}>Cargando…</p> : festivos.length === 0 ? (
          <p style={{ color: '#9CA3AF' }}>Sin días registrados</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #E5E7EB' }}>
                <th style={{ textAlign: 'left', padding: '10px', color: '#6B7280', fontWeight: 600 }}>Fecha</th>
                <th style={{ textAlign: 'left', padding: '10px', color: '#6B7280', fontWeight: 600 }}>Motivo</th>
                <th style={{ textAlign: 'left', padding: '10px', color: '#6B7280', fontWeight: 600 }}>Tipo</th>
                <th style={{ padding: '10px' }}></th>
              </tr>
            </thead>
            <tbody>
              {festivos.map(f => (
                <tr key={f.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '10px', fontWeight: 600 }}>{new Date(f.fecha + 'T12:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'long' })}</td>
                  <td style={{ padding: '10px' }}>{f.descripcion}</td>
                  <td style={{ padding: '10px' }}>
                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '999px', fontSize: '12px', fontWeight: 600, color: '#FFFFFF', backgroundColor: f.anual ? '#8B5CF6' : '#3B82F6' }}>
                      {f.anual ? 'Anual' : 'Específico'}
                    </span>
                  </td>
                  <td style={{ padding: '10px' }}>
                    <button type="button" onClick={() => handleEliminar(f.id, f.descripcion)} title="Eliminar" style={{ padding: '4px 8px', background: 'transparent', border: '1px solid #EF4444', color: '#EF4444', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', lineHeight: 1 }}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
