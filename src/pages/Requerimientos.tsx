import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Requerimiento, Equipo, Lugar } from '../types';

interface Props { idEstablecimiento: string }

const TIPOS = ['Reparación','Mantención','Instalación','Traslado','Otro'];
const PRIORIDADES = ['Baja','Normal','Alta','Urgente'];
const ESTADOS = ['Pendiente','En Proceso','Completada','Cancelada'];

export default function Requerimientos({ idEstablecimiento }: Props) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState<(Requerimiento & { equipo_nombre?: string; lugar_nombre?: string })[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [cargando, setCargando] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ tipo_requerimiento: 'Reparación' as Requerimiento['tipo_requerimiento'], descripcion: '', prioridad: 'Normal' as Requerimiento['prioridad'], estado: 'Pendiente' as Requerimiento['estado'], id_equipo: '', id_lugar: '', posible_falla: '', diagnostico: '' });
  const [sugFallas, setSugFallas] = useState<string[]>([]);
  const [sugDiags, setSugDiags] = useState<string[]>([]);
  const [sugSols, setSugSols] = useState<string[]>([]);
  const [filtroEstado] = useState(searchParams.get('estado') || '');
  const [filtroPrioridad] = useState(searchParams.get('prioridad') || '');

  async function load() {
    const [rRes, eqRes, lugRes, fRes, dRes, sRes] = await Promise.all([
      supabase.from('requerimientos').select('*').eq('id_establecimiento', idEstablecimiento).eq('activo', true).order('created_at', { ascending: false }),
      supabase.from('equipos').select('*').eq('id_establecimiento', idEstablecimiento).eq('activo', true),
      supabase.from('lugares').select('*').eq('id_establecimiento', idEstablecimiento).eq('activo', true),
      supabase.from('posibles_fallas').select('nombre').eq('id_establecimiento', idEstablecimiento).eq('activo', true),
      supabase.from('posibles_diagnosticos').select('nombre').eq('id_establecimiento', idEstablecimiento).eq('activo', true),
      supabase.from('posibles_soluciones').select('nombre').eq('id_establecimiento', idEstablecimiento).eq('activo', true),
    ]);
    if (rRes.data) setItems(rRes.data);
    if (eqRes.data) setEquipos(eqRes.data);
    if (lugRes.data) setLugares(lugRes.data);
    if (fRes.data) setSugFallas(fRes.data.map(x => x.nombre));
    if (dRes.data) setSugDiags(dRes.data.map(x => x.nombre));
    if (sRes.data) setSugSols(sRes.data.map(x => x.nombre));
    setCargando(false);
  }

  useEffect(() => { if (idEstablecimiento) load(); }, [idEstablecimiento]);

  const itemsFiltrados = items.filter(r => {
    if (filtroEstado && r.estado !== filtroEstado) return false;
    if (filtroPrioridad && r.prioridad !== filtroPrioridad) return false;
    return true;
  });

  async function guardar() {
    if (!form.descripcion.trim()) return;
    const payload = { ...form, id_establecimiento: idEstablecimiento, id_equipo: form.id_equipo || null, id_lugar: form.id_lugar || null };
    if (editId) {
      await supabase.from('requerimientos').update(payload).eq('id', editId);
    } else {
      await supabase.from('requerimientos').insert({ ...payload, fecha_solicitud: new Date().toISOString().slice(0,10) });
    }
    setShowForm(false); setEditId(null); setForm({ tipo_requerimiento: 'Reparación', descripcion: '', prioridad: 'Normal', estado: 'Pendiente', id_equipo: '', id_lugar: '', posible_falla: '', diagnostico: '' });
    load();
  }

  async function cambiarEstado(id: string, estado: Requerimiento['estado']) {
    const upd: Partial<Requerimiento> = { estado };
    if (estado === 'Completada') {
      upd.fecha_atencion = new Date().toISOString().slice(0,10);
      upd.fecha_cierre = new Date().toISOString();
    }
    if (estado === 'Cancelada') {
      upd.fecha_cierre = new Date().toISOString();
    }
    await supabase.from('requerimientos').update(upd).eq('id', id);
    load();
  }

  if (cargando) return <p>⏳ Cargando requerimientos…</p>;

  const styleBtn: React.CSSProperties = { padding: '6px 14px', borderRadius: 6, border: '1px solid #475569', background: '#0f172a', color: '#f1f5f9', fontSize: 13, cursor: 'pointer' };
  const btnS: React.CSSProperties = { ...styleBtn, padding: '3px 8px', fontSize: 11 };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: '#1A3C6B', margin: 0 }}>
          📋 Requerimientos
          {filtroEstado && <span style={{ fontSize: 13, fontWeight: 400, color: '#64748b', marginLeft: 8 }}>· {filtroEstado}</span>}
          {filtroPrioridad && <span style={{ fontSize: 13, fontWeight: 400, color: '#64748b', marginLeft: 8 }}>· {filtroPrioridad}</span>}
        </h1>
        <button onClick={() => { setEditId(null); setForm({ tipo_requerimiento: 'Reparación', descripcion: '', prioridad: 'Normal', estado: 'Pendiente', id_equipo: '', id_lugar: '', posible_falla: '', diagnostico: '' }); setShowForm(true); }} style={styleBtn}>➕ Nuevo</button>
      </div>

      {showForm && (
        <div style={{ background: '#0f172a', border: '1px solid #475569', borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 2 }}>Descripción</label>
              <textarea value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} rows={3} style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #475569', background: '#1e293b', color: '#f1f5f9', fontSize: 13, resize: 'vertical' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 2 }}>Posible Falla</label>
              <input value={form.posible_falla} onChange={e => setForm({ ...form, posible_falla: e.target.value })} list="req-fallas" placeholder="Ej: Sin internet, Pantalla no enciende" style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #475569', background: '#1e293b', color: '#f1f5f9', fontSize: 13 }} />
              <datalist id="req-fallas">{sugFallas.map((s, i) => <option key={i} value={s} />)}</datalist>
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 2 }}>Diagnóstico</label>
              <input value={form.diagnostico} onChange={e => setForm({ ...form, diagnostico: e.target.value })} list="req-diags" placeholder="Lo que se detectó" style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #475569', background: '#1e293b', color: '#f1f5f9', fontSize: 13 }} />
              <datalist id="req-diags">{sugDiags.map((s, i) => <option key={i} value={s} />)}</datalist>
              <datalist id="req-sols">{sugSols.map((s, i) => <option key={i} value={s} />)}</datalist>
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 2 }}>Tipo</label>
              <select value={form.tipo_requerimiento} onChange={e => setForm({ ...form, tipo_requerimiento: e.target.value as any })} style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #475569', background: '#1e293b', color: '#f1f5f9', fontSize: 13 }}>
                {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 2 }}>Prioridad</label>
              <select value={form.prioridad} onChange={e => setForm({ ...form, prioridad: e.target.value as any })} style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #475569', background: '#1e293b', color: '#f1f5f9', fontSize: 13 }}>
                {PRIORIDADES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 2 }}>Estado</label>
              <select value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value as any })} style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #475569', background: '#1e293b', color: '#f1f5f9', fontSize: 13 }}>
                {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 2 }}>Equipo</label>
              <select value={form.id_equipo} onChange={e => setForm({ ...form, id_equipo: e.target.value })} style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #475569', background: '#1e293b', color: '#f1f5f9', fontSize: 13 }}>
                <option value="">— Sin equipo —</option>
                {equipos.map(eq => <option key={eq.id} value={eq.id}>{eq.nombre}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 2 }}>Lugar</label>
              <select value={form.id_lugar} onChange={e => setForm({ ...form, id_lugar: e.target.value })} style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #475569', background: '#1e293b', color: '#f1f5f9', fontSize: 13 }}>
                <option value="">— Sin lugar —</option>
                {lugares.map(l => <option key={l.id} value={l.id} disabled={l.soporte === false} style={{ opacity: l.soporte === false ? 0.5 : 1 }}>{l.nombre} (Piso {l.piso}){l.soporte === false ? ' 🔒' : ''}</option>)}
              </select>
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
              <th style={thS}>Tipo</th><th style={thS}>Descripción</th><th style={thS}>Prioridad</th><th style={thS}>Estado</th><th style={thS}>Equipo</th><th style={thS}>Lugar</th><th style={thS}>Solicitud</th><th style={thS}>Atención</th><th style={thS}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {itemsFiltrados.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid #1e293b' }}>
                <td style={tdS}>{r.tipo_requerimiento}</td>
                <td style={{ ...tdS, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.descripcion}</td>
                <td style={tdS}><PrioridadBadge p={r.prioridad} /></td>
                <td style={tdS}><EstadoReqBadge e={r.estado} /></td>
                <td style={tdS}>{equipos.find(eq => eq.id === r.id_equipo)?.nombre || '—'}</td>
                <td style={tdS}>{lugares.find(l => l.id === r.id_lugar)?.nombre || '—'}</td>
                <td style={tdS}>{r.fecha_solicitud}</td>
                <td style={tdS}>{r.fecha_atencion || '—'}</td>
                <td style={tdS}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => { setEditId(r.id); setForm({ tipo_requerimiento: r.tipo_requerimiento, descripcion: r.descripcion, prioridad: r.prioridad, estado: r.estado, id_equipo: r.id_equipo || '', id_lugar: r.id_lugar || '', posible_falla: r.posible_falla || '', diagnostico: r.diagnostico || '' }); setShowForm(true); }} style={btnS} title="Editar">✏️</button>
                    {r.estado === 'Pendiente' && <button onClick={() => cambiarEstado(r.id, 'En Proceso')} style={btnS} title="Iniciar">▶</button>}
                    {r.estado === 'En Proceso' && <button onClick={() => cambiarEstado(r.id, 'Completada')} style={{ ...btnS, background: '#166534' }} title="Completar">✓</button>}
                    {r.estado !== 'Cancelada' && r.estado !== 'Completada' && <button onClick={() => cambiarEstado(r.id, 'Cancelada')} style={btnS} title="Anular">✕</button>}
                    <button onClick={() => { navigate(`/ticket?ticket=${r.id}`); }} style={btnS} title="Abrir Ticket">🎫</button>
                  </div>
                </td>
              </tr>
            ))}
            {itemsFiltrados.length === 0 && <tr><td colSpan={9} style={{ textAlign: 'center', padding: 24, color: '#64748b' }}>{items.length === 0 ? 'Sin requerimientos' : 'No hay resultados para el filtro'}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const thS: React.CSSProperties = { padding: '8px 10px', textAlign: 'left', fontWeight: 500, fontSize: 12, borderBottom: '2px solid #334155' };
const tdS: React.CSSProperties = { padding: '8px 10px', borderBottom: '1px solid #1e293b' };

function PrioridadBadge({ p }: { p: string }) {
  const c: Record<string,string> = { Baja: '#64748b', Normal: '#3b82f6', Alta: '#f59e0b', Urgente: '#ef4444' };
  return <span style={{ background: c[p] || '#64748b', color: '#0f172a', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600 }}>{p}</span>;
}

function EstadoReqBadge({ e }: { e: string }) {
  const c: Record<string,string> = { Pendiente: '#f59e0b', 'En Proceso': '#3b82f6', Completada: '#22c55e', Cancelada: '#64748b' };
  return <span style={{ background: c[e] || '#64748b', color: '#0f172a', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600 }}>{e}</span>;
}
