import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Lugar } from '../types';

interface Props { idEstablecimiento: string }

const PISOS = ['Subterráneo', 'Piso 1', 'Piso 2', 'Piso 3'];
const ZONAS = ['lab','sala','admin','pasillo','com','acceso','patio','park','internado','pie','bib','other','empty'];

export default function Lugares({ idEstablecimiento }: Props) {
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [cargando, setCargando] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ nombre: '', zona: 'z-other', jefe: '', piso: 0 });

  async function load() {
    const { data } = await supabase.from('lugares').select('*').eq('id_establecimiento', idEstablecimiento).eq('activo', true).order('piso').order('nombre');
    if (data) setLugares(data);
    setCargando(false);
  }

  useEffect(() => { if (idEstablecimiento) load(); }, [idEstablecimiento]);

  async function guardar() {
    if (!form.nombre.trim()) return;
    if (editId) {
      await supabase.from('lugares').update({ nombre: form.nombre, zona: form.zona, jefe: form.jefe || null, piso: form.piso }).eq('id', editId);
    } else {
      await supabase.from('lugares').insert({ id_establecimiento: idEstablecimiento, nombre: form.nombre, zona: form.zona, jefe: form.jefe || null, piso: form.piso, left_pos: 0, top_pos: 0, width: 140, height: 105 });
    }
    setShowForm(false); setEditId(null); setForm({ nombre: '', zona: 'z-other', jefe: '', piso: 0 });
    load();
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar este lugar?')) return;
    await supabase.from('lugares').update({ activo: false }).eq('id', id);
    load();
  }

  function editar(l: Lugar) {
    setForm({ nombre: l.nombre, zona: l.zona, jefe: l.jefe || '', piso: l.piso });
    setEditId(l.id);
    setShowForm(true);
  }

  if (cargando) return <p>⏳ Cargando lugares…</p>;

  const styleBtn: React.CSSProperties = { padding: '6px 14px', borderRadius: 6, border: '1px solid #475569', background: '#0f172a', color: '#f1f5f9', fontSize: 13, cursor: 'pointer' };
  const styleInp: React.CSSProperties = { width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #475569', background: '#1e293b', color: '#f1f5f9', fontSize: 13 };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: '#1A3C6B', margin: 0 }}>🏢 Lugares</h1>
        <button onClick={() => { setEditId(null); setForm({ nombre: '', zona: 'z-other', jefe: '', piso: 0 }); setShowForm(true); }} style={styleBtn}>➕ Nuevo</button>
      </div>

      {showForm && (
        <div style={{ background: '#0f172a', border: '1px solid #475569', borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 2 }}>Nombre</label>
              <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} style={styleInp} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 2 }}>Zona</label>
              <select value={form.zona} onChange={e => setForm({ ...form, zona: e.target.value })} style={styleInp}>
                {ZONAS.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 2 }}>Piso</label>
              <select value={form.piso} onChange={e => setForm({ ...form, piso: Number(e.target.value) })} style={styleInp}>
                {PISOS.map((p, i) => <option key={i} value={i}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 2 }}>Jefe / Coordinador</label>
              <input value={form.jefe} onChange={e => setForm({ ...form, jefe: e.target.value })} style={styleInp} />
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
              <th style={thS}>Nombre</th><th style={thS}>Piso</th><th style={thS}>Zona</th><th style={thS}>Posición</th><th style={thS}>Tamaño</th><th style={thS}>Jefe</th><th style={thS}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {lugares.map(l => (
              <tr key={l.id} style={{ borderBottom: '1px solid #1e293b' }}>
                <td style={tdS}>{l.nombre}</td>
                <td style={tdS}>{PISOS[l.piso] || l.piso}</td>
                <td style={tdS}><span style={{ background: '#1e293b', padding: '2px 6px', borderRadius: 4, fontSize: 11 }}>{l.zona}</span></td>
                <td style={tdS}>{l.left_pos},{l.top_pos}</td>
                <td style={tdS}>{l.width}×{l.height}</td>
                <td style={tdS}>{l.jefe || '—'}</td>
                <td style={tdS}>
                  <button onClick={() => editar(l)} style={{ ...styleBtn, padding: '3px 8px', fontSize: 11, marginRight: 4 }}>✏️</button>
                  <button onClick={() => eliminar(l.id)} style={{ ...styleBtn, padding: '3px 8px', fontSize: 11 }}>🗑️</button>
                </td>
              </tr>
            ))}
            {lugares.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24, color: '#64748b' }}>Sin lugares registrados</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const thS: React.CSSProperties = { padding: '8px 10px', textAlign: 'left', fontWeight: 500, fontSize: 12, borderBottom: '2px solid #334155' };
const tdS: React.CSSProperties = { padding: '8px 10px', borderBottom: '1px solid #1e293b' };
