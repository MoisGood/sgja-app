import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Lugar } from '../types';

interface Props {
  idEstablecimiento: string;
}

interface UbicacionRow {
  id: string;
  id_lugar: string;
  dispositivo_nombre: string;
  cantidad: number;
  activo: boolean;
}

const PISOS = ['Subterráneo', 'Piso 1', 'Piso 2', 'Piso 3'];
const DISPOSITIVOS = [
  'Proyector','Impresora','Computador','Notebook','Wifi','Escaner',
  'Cable HDMI','Con Audio','Sin Audio','Internet Cable',
  'Impresora Multifuncional','Impresora Color','Telefono','SmartTV',
];

export default function Ubicaciones({ idEstablecimiento }: Props) {
  const [ubicaciones, setUbicaciones] = useState<(UbicacionRow & { lugar_nombre?: string; lugar_piso?: number })[]>([]);
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroPiso, setFiltroPiso] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ id_lugar: '', dispositivo_nombre: '', cantidad: 1 });

  async function load() {
    const [ubiRes, lugRes] = await Promise.all([
      supabase.from('ubicaciones').select('*').eq('id_establecimiento', idEstablecimiento).eq('activo', true).order('dispositivo_nombre'),
      supabase.from('lugares').select('*').eq('id_establecimiento', idEstablecimiento).eq('activo', true).order('nombre'),
    ]);
    if (ubiRes.data) setUbicaciones(ubiRes.data);
    if (lugRes.data) setLugares(lugRes.data);
    setCargando(false);
  }

  useEffect(() => { if (idEstablecimiento) load(); }, [idEstablecimiento]);

  async function guardar() {
    if (!form.dispositivo_nombre.trim() || !form.id_lugar) return;
    if (editId) {
      await supabase.from('ubicaciones').update({ cantidad: form.cantidad }).eq('id', editId);
    } else {
      await supabase.from('ubicaciones').insert({
        id_lugar: form.id_lugar,
        id_establecimiento: idEstablecimiento,
        dispositivo_nombre: form.dispositivo_nombre,
        cantidad: form.cantidad,
      });
    }
    setShowForm(false); setEditId(null);
    setForm({ id_lugar: '', dispositivo_nombre: '', cantidad: 1 });
    load();
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar esta asignación?')) return;
    await supabase.from('ubicaciones').update({ activo: false }).eq('id', id);
    load();
  }

  function editar(u: UbicacionRow & { lugar_nombre?: string; lugar_piso?: number }) {
    setForm({ id_lugar: u.id_lugar, dispositivo_nombre: u.dispositivo_nombre, cantidad: u.cantidad });
    setEditId(u.id);
    setShowForm(true);
  }

  const filtrados = filtroPiso !== null
    ? ubicaciones.filter(u => {
        const l = lugares.find(l => l.id === u.id_lugar);
        return l && l.piso === filtroPiso;
      })
    : ubicaciones;

  const styleBtn: React.CSSProperties = { padding: '6px 14px', borderRadius: 6, border: '1px solid #475569', background: '#0f172a', color: '#f1f5f9', fontSize: 13, cursor: 'pointer' };
  const styleInp: React.CSSProperties = { width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #475569', background: '#1e293b', color: '#f1f5f9', fontSize: 13 };

  if (cargando) return <p>⏳ Cargando ubicaciones…</p>;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: '#1A3C6B', margin: 0 }}>📍 Ubicaciones</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select
            value={filtroPiso ?? ''}
            onChange={e => setFiltroPiso(e.target.value === '' ? null : Number(e.target.value))}
            style={styleInp}
          >
            <option value="">Todos los pisos</option>
            {PISOS.map((p, i) => <option key={i} value={i}>{p}</option>)}
          </select>
          <button onClick={() => { setEditId(null); setForm({ id_lugar: '', dispositivo_nombre: '', cantidad: 1 }); setShowForm(true); }} style={styleBtn}>➕ Nueva</button>
        </div>
      </div>

      {showForm && (
        <div style={{ background: '#0f172a', border: '1px solid #475569', borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 2 }}>Lugar</label>
              <select value={form.id_lugar} onChange={e => setForm({ ...form, id_lugar: e.target.value })} style={styleInp}>
                <option value="">— Seleccionar —</option>
                {lugares.map(l => <option key={l.id} value={l.id} disabled={l.soporte === false} style={{ opacity: l.soporte === false ? 0.5 : 1 }}>{l.nombre} (Piso {l.piso}){l.soporte === false ? ' 🔒' : ''}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 2 }}>Dispositivo</label>
              <input
                list="dispositivos-list"
                value={form.dispositivo_nombre}
                onChange={e => setForm({ ...form, dispositivo_nombre: e.target.value })}
                style={styleInp}
              />
              <datalist id="dispositivos-list">
                {DISPOSITIVOS.map(d => <option key={d} value={d} />)}
              </datalist>
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 2 }}>Cantidad</label>
              <input
                type="number" min={1}
                value={form.cantidad}
                onChange={e => setForm({ ...form, cantidad: Math.max(1, parseInt(e.target.value) || 1) })}
                style={styleInp}
              />
            </div>
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button onClick={guardar} style={{ ...styleBtn, background: '#1e40af' }}>{editId ? 'Actualizar' : 'Guardar'}</button>
            <button onClick={() => { setShowForm(false); setEditId(null); }} style={styleBtn}>Cancelar</button>
          </div>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#0f172a', color: '#94a3b8' }}>
              <th style={thS}>Lugar</th>
              <th style={thS}>Piso</th>
              <th style={thS}>Dispositivo</th>
              <th style={thS}>Cantidad</th>
              <th style={thS}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map(u => {
              const lugar = lugares.find(l => l.id === u.id_lugar);
              return (
                <tr key={u.id} style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={tdS}>{lugar?.nombre || '—'}</td>
                  <td style={tdS}>{lugar ? PISOS[lugar.piso] || lugar.piso : '—'}</td>
                  <td style={tdS}>{u.dispositivo_nombre}</td>
                  <td style={tdS}>
                    <span style={{
                      background: '#1e293b', padding: '2px 10px', borderRadius: 10,
                      fontSize: 12, fontWeight: 600, color: '#f1f5f9',
                    }}>
                      {u.cantidad}
                    </span>
                  </td>
                  <td style={tdS}>
                    <button onClick={() => editar(u)} style={{ ...styleBtn, padding: '3px 8px', fontSize: 11, marginRight: 4 }}>✏️</button>
                    <button onClick={() => eliminar(u.id)} style={{ ...styleBtn, padding: '3px 8px', fontSize: 11 }}>🗑️</button>
                  </td>
                </tr>
              );
            })}
            {filtrados.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: '#64748b' }}>Sin ubicaciones registradas</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 12, fontSize: 12, color: '#64748b', textAlign: 'right' }}>
        Total: {filtrados.reduce((s, u) => s + u.cantidad, 0)} dispositivos en {filtrados.length} asignaciones
      </div>
    </div>
  );
}

const thS: React.CSSProperties = { padding: '8px 10px', textAlign: 'left', fontWeight: 500, fontSize: 12, borderBottom: '2px solid #334155' };
const tdS: React.CSSProperties = { padding: '8px 10px', borderBottom: '1px solid #1e293b' };
