import { useState, useEffect, useCallback } from 'react';
import { obtenerJustificaciones, crearJustificacion, actualizarJustificacion, eliminarJustificacion } from '../services/database';

interface Props { idEstablecimiento: string }

export default function Justificaciones({ idEstablecimiento }: Props) {
  const [items, setItems] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  // New item form
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevaDesc, setNuevaDesc] = useState('');

  // Edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    const data = await obtenerJustificaciones(idEstablecimiento);
    setItems(data);
    setCargando(false);
  }, [idEstablecimiento]);

  useEffect(() => { cargar(); }, [cargar]);

  const handleCrear = async () => {
    if (!nuevoNombre.trim()) { setError('El nombre es obligatorio'); return; }
    setError(null);
    const res = await crearJustificacion(nuevoNombre.trim(), nuevaDesc.trim(), idEstablecimiento);
    if (res.error) { setError(res.error); return; }
    setExito('Creada'); setTimeout(() => setExito(null), 3000);
    setNuevoNombre(''); setNuevaDesc(''); cargar();
  };

  const handleGuardarEdicion = async () => {
    if (!editId || !editNombre.trim()) return;
    setError(null);
    const res = await actualizarJustificacion(editId, editNombre.trim(), editDesc.trim());
    if (res.error) { setError(res.error); return; }
    setExito('Actualizada'); setTimeout(() => setExito(null), 3000);
    setEditId(null); cargar();
  };

  const handleEliminar = async (id: string, nom: string) => {
    if (!window.confirm(`¿Eliminar "${nom}"?`)) return;
    const res = await eliminarJustificacion(id);
    if (res.error) { setError(res.error); return; }
    cargar();
  };

  const inputStyle: React.CSSProperties = { padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box', width: '100%' };

  return (
    <div>
      {error && <p style={{ color: '#DC2626', fontSize: '14px', marginBottom: '12px', padding: '8px 12px', background: '#FEF2F2', borderRadius: '6px' }}>{error}</p>}
      {exito && <p style={{ color: '#10B981', fontSize: '14px', marginBottom: '12px', padding: '8px 12px', background: '#F0FDF4', borderRadius: '6px' }}>{exito}</p>}

      {cargando ? <p style={{ color: '#6B7280' }}>Cargando…</p> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #E5E7EB' }}>
                <th style={{ textAlign: 'left', padding: '10px', color: '#6B7280', fontWeight: 600, width: '30%' }}>Nombre</th>
                <th style={{ textAlign: 'left', padding: '10px', color: '#6B7280', fontWeight: 600, width: '50%' }}>Descripción</th>
                <th style={{ padding: '10px', width: '20%' }}></th>
              </tr>
            </thead>
            <tbody>
              {/* Fila para crear nueva */}
              <tr style={{ borderBottom: '2px solid #3B82F6', backgroundColor: '#EFF6FF' }}>
                <td style={{ padding: '8px' }}>
                  <input style={inputStyle} placeholder="Nombre..." value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} />
                </td>
                <td style={{ padding: '8px' }}>
                  <input style={inputStyle} placeholder="Descripción..." value={nuevaDesc} onChange={e => setNuevaDesc(e.target.value)} />
                </td>
                <td style={{ padding: '8px', textAlign: 'center' }}>
                  <button type="button" onClick={handleCrear} style={{ padding: '8px 16px', background: '#10B981', color: '#FFFFFF', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>+ Agregar</button>
                </td>
              </tr>

              {/* Filas existentes */}
              {items.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', padding: '24px', color: '#9CA3AF' }}>Sin justificaciones registradas</td>
                </tr>
              )}
              {items.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid #F3F4F6', backgroundColor: editId === item.id ? '#F0FDF4' : 'transparent' }}>
                  {editId === item.id ? (
                    <>
                      <td style={{ padding: '8px' }}>
                        <input style={inputStyle} value={editNombre} onChange={e => setEditNombre(e.target.value)} />
                      </td>
                      <td style={{ padding: '8px' }}>
                        <input style={inputStyle} value={editDesc} onChange={e => setEditDesc(e.target.value)} />
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button type="button" onClick={handleGuardarEdicion} style={{ padding: '6px 12px', background: '#10B981', color: '#FFFFFF', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>✓</button>
                          <button type="button" onClick={() => setEditId(null)} style={{ padding: '6px 12px', background: '#6B7280', color: '#FFFFFF', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>✕</button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ padding: '10px', fontWeight: 600 }}>{item.nombre}</td>
                      <td style={{ padding: '10px', color: '#6B7280' }}>{item.descripcion || '—'}</td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button type="button" onClick={() => { setEditId(item.id); setEditNombre(item.nombre); setEditDesc(item.descripcion || ''); }} title="Editar" style={{ padding: '4px 8px', background: 'transparent', border: '1px solid #3B82F6', color: '#3B82F6', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>✎</button>
                          <button type="button" onClick={() => handleEliminar(item.id, item.nombre)} title="Eliminar" style={{ padding: '4px 8px', background: 'transparent', border: '1px solid #EF4444', color: '#EF4444', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>🗑</button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
