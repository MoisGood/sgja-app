import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { crearRequerimiento } from '../services/requerimiento.service';
import type { Requerimiento, Equipo, Lugar } from '../types';

interface Props { idEstablecimiento: string }

const TIPOS = ['Reparación','Mantención','Instalación','Traslado','Otro'];
const PRIORIDADES = ['Baja','Normal','Alta','Urgente'];
const ESTADOS = ['Pendiente','En Proceso','Completada','Cancelada'];

export default function Requerimientos({ idEstablecimiento }: Props) {
  const navigate = useNavigate();
  const [items, setItems] = useState<(Requerimiento & { equipo_nombre?: string; lugar_nombre?: string; usuario_nombre?: string })[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [usuarios, setUsuarios] = useState<{ id: string; nombre: string }[]>([]);
  const [cargando, setCargando] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ tipo_requerimiento: 'Reparación' as Requerimiento['tipo_requerimiento'], descripcion: '', prioridad: 'Normal' as Requerimiento['prioridad'], estado: 'Pendiente' as Requerimiento['estado'], id_equipo: '', id_lugar: '', id_solicitante: '', posible_falla: '', diagnostico: '', observaciones: '' });
  const [sugFallas, setSugFallas] = useState<string[]>([]);
  const [sugDiags, setSugDiags] = useState<string[]>([]);
  const [sugSols, setSugSols] = useState<string[]>([]);
  const [pagina, setPagina] = useState(0);
  const [filtroAbierto, setFiltroAbierto] = useState<string | null>(null);
  const POR_PAGINA = 20;

  const [filtros, setFiltros] = useState({
    fecha: '', prioridad: '', estado: '',
    equipo: '', lugar: '', usuario: '',
  });

  function obtenerOpciones(columna: string): string[] {
    const valores = items.map(r => {
      if (columna === 'fecha') return new Date(r.created_at).toLocaleDateString('es-CL');
      if (columna === 'prioridad') return r.prioridad;
      if (columna === 'estado') return r.estado;
      if (columna === 'equipo') return equipos.find(eq => eq.id === r.id_equipo)?.nombre || '—';
      if (columna === 'lugar') return lugares.find(l => l.id === r.id_lugar)?.nombre || '—';
      if (columna === 'usuario') {
        return r.id_solicitante ? usuarios.find(u => u.id === r.id_solicitante)?.nombre || '—' : '—';
      }
      return '';
    });
    return [...new Set(valores)].filter(Boolean).sort();
  }

  async function load() {
    const [rRes, eqRes, lugRes, usrRes, fRes, dRes, sRes] = await Promise.all([
      supabase.from('requerimientos').select('*').eq('id_establecimiento', idEstablecimiento).eq('activo', true).order('created_at', { ascending: false }),
      supabase.from('equipos').select('*').eq('id_establecimiento', idEstablecimiento).eq('activo', true),
      supabase.from('lugares').select('*').eq('id_establecimiento', idEstablecimiento).eq('activo', true),
      supabase.from('usuarios').select('id, nombre').eq('id_establecimiento', idEstablecimiento).eq('activo', true),
      supabase.from('posibles_fallas').select('nombre').eq('id_establecimiento', idEstablecimiento).eq('activo', true),
      supabase.from('posibles_diagnosticos').select('nombre').eq('id_establecimiento', idEstablecimiento).eq('activo', true),
      supabase.from('posibles_soluciones').select('nombre').eq('id_establecimiento', idEstablecimiento).eq('activo', true),
    ]);
    if (rRes.data) setItems(rRes.data);
    if (eqRes.data) setEquipos(eqRes.data);
    if (lugRes.data) setLugares(lugRes.data);
    if (usrRes.data) setUsuarios(usrRes.data);
    if (fRes.data) setSugFallas(fRes.data.map(x => x.nombre));
    if (dRes.data) setSugDiags(dRes.data.map(x => x.nombre));
    if (sRes.data) setSugSols(sRes.data.map(x => x.nombre));
    setCargando(false);
  }

  useEffect(() => { if (idEstablecimiento) load(); }, [idEstablecimiento]);

  const itemsFiltrados = items.filter(r => {
    const nomEq = equipos.find(eq => eq.id === r.id_equipo)?.nombre || '';
    const nomLug = lugares.find(l => l.id === r.id_lugar)?.nombre || '';
    const eqObj = equipos.find(e => e.id === r.id_equipo);
    const nomUsrAten = r.id_solicitante ? usuarios.find(u => u.id === r.id_solicitante)?.nombre || '' : eqObj?.id_usuario ? usuarios.find(u => u.id === eqObj.id_usuario)?.nombre || '' : '';
    if (filtros.fecha && new Date(r.created_at).toLocaleDateString('es-CL') !== filtros.fecha) return false;
    if (filtros.prioridad && r.prioridad !== filtros.prioridad) return false;
    if (filtros.estado && r.estado !== filtros.estado) return false;
    if (filtros.equipo && nomEq !== filtros.equipo) return false;
    if (filtros.lugar && nomLug !== filtros.lugar) return false;
    if (filtros.usuario && nomUsrAten !== filtros.usuario) return false;
    return true;
  });

  const totalPaginas = Math.max(1, Math.ceil(itemsFiltrados.length / POR_PAGINA));
  const itemsPagina = itemsFiltrados.slice(pagina * POR_PAGINA, (pagina + 1) * POR_PAGINA);

  async function guardar() {
    if (!form.descripcion.trim()) return;
    const payload = { ...form, id_establecimiento: idEstablecimiento, id_equipo: form.id_equipo || null, id_lugar: form.id_lugar || null, id_solicitante: form.id_solicitante || null };
    if (editId) {
      await supabase.from('requerimientos').update(payload).eq('id', editId);
    } else {
      const { data: user } = await supabase.auth.getUser();
      const uid = user?.user?.id;
      if (!uid) { alert('Debes iniciar sesión'); return; }
      const { data: u } = await supabase.from('usuarios').select('id').eq('uid', uid).maybeSingle();
      if (!u) { alert('Usuario no encontrado en la base de datos'); return; }
      await crearRequerimiento({
        idEstablecimiento,
        idLugar: form.id_lugar || '',
        idEquipo: form.id_equipo || null,
        idSolicitante: u.id,
        tipoReq: form.tipo_requerimiento,
        descripcion: form.descripcion,
        posibleFalla: form.posible_falla || null,
        diagnostico: form.diagnostico || null,
        prioridad: form.prioridad,
        estado: form.estado,
        observaciones: form.observaciones || null,
      });
    }
    setShowForm(false); setEditId(null); setForm({ tipo_requerimiento: 'Reparación', descripcion: '', prioridad: 'Normal', estado: 'Pendiente', id_equipo: '', id_lugar: '', id_solicitante: '', posible_falla: '', diagnostico: '', observaciones: '' });
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

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar este requerimiento?')) return;
    await supabase.from('requerimientos').update({ activo: false }).eq('id', id);
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
          <span style={{ fontSize: 13, fontWeight: 400, color: '#64748b', marginLeft: 8 }}>({itemsFiltrados.length} de {items.length})</span>
        </h1>
          <button onClick={() => { setEditId(null); setForm({ tipo_requerimiento: 'Reparación', descripcion: '', prioridad: 'Normal', estado: 'Pendiente', id_equipo: '', id_lugar: '', id_solicitante: '', posible_falla: '', diagnostico: '', observaciones: '' }); setShowForm(true); }} style={styleBtn}>➕ Nuevo</button>
      </div>

      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }} onClick={() => { setShowForm(false); setEditId(null); }}>
          <div style={{
            background: '#0f172a', border: '1px solid #475569', borderRadius: 12,
            padding: 24, maxWidth: 560, width: '100%', maxHeight: '90vh', overflowY: 'auto',
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, color: '#f1f5f9' }}>
              {editId ? '✏️ Editar Requerimiento' : '📋 Nuevo Requerimiento'}
            </h3>
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
            <div>
              <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 2 }}>Usuario del ticket</label>
              <select value={form.id_solicitante} onChange={e => setForm({ ...form, id_solicitante: e.target.value })} style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #475569', background: '#1e293b', color: '#f1f5f9', fontSize: 13 }}>
                <option value="">— Seleccionar usuario —</option>
                {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginTop: 10 }}>
            <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 2 }}>Observaciones</label>
            <textarea value={form.observaciones || ''} onChange={e => setForm({ ...form, observaciones: e.target.value })}
              rows={2} style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #475569', background: '#1e293b', color: '#f1f5f9', fontSize: 13, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button onClick={guardar} style={{ ...styleBtn, background: '#1e40af' }}>{editId ? 'Actualizar' : 'Guardar'}</button>
            <button onClick={() => { setShowForm(false); setEditId(null); }} style={styleBtn}>Cancelar</button>
          </div>
          </div>
        </div>
      )}

      {/* Filtros inline en el header de la tabla */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#0f172a', color: '#94a3b8' }}>
              {(['fecha', 'hora', 'usuario', 'equipo', 'lugar', 'prioridad', 'estado', 'tecnico'] as const).map(col => (
                <th key={col} style={{ ...thS, position: 'relative' as const }}>
                  {col === 'hora' ? (
                    <span style={{ fontSize: 11 }}>Hora</span>
                  ) : col === 'tecnico' ? (
                    <span style={{ fontSize: 11 }}>Tecnico</span>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }} onClick={() => setFiltroAbierto(filtroAbierto === col ? null : col)}>
                      <span style={{ fontSize: 11 }}>{col === 'fecha' ? 'Fecha' : col.charAt(0).toUpperCase() + col.slice(1)}</span>
                      <span style={{ fontSize: 9, opacity: filtros[col] ? 1 : 0.6 }}>{filtros[col] ? '●' : '▼'}</span>
                    </div>
                  )}
                  {col !== 'hora' && col !== 'tecnico' && filtroAbierto === col && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, zIndex: 50,
                      background: '#1e293b', border: '1px solid #475569', borderRadius: 6,
                      minWidth: col === 'fecha' ? 180 : 140,
                      maxHeight: col === 'fecha' ? 'none' : 200,
                      overflowY: col === 'fecha' ? 'visible' : 'auto',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                    }}>
                      <div onClick={() => { setFiltros(f => ({ ...f, [col]: '' })); setFiltroAbierto(null); }}
                        style={{ padding: '6px 10px', fontSize: 12, color: '#94a3b8', cursor: 'pointer', borderBottom: '1px solid #334155' }}>
                        {col === 'fecha' ? 'Todas las fechas' : 'Todos'}
                      </div>
                      {(col === 'fecha' ? (
                        <div style={{ padding: 4, maxHeight: 180, overflowY: 'auto' }}>
                          {obtenerOpciones('fecha').map(d => (
                            <div key={d} onClick={() => { setFiltros(f => ({ ...f, fecha: d })); setFiltroAbierto(null); setPagina(0); }}
                              style={{ padding: '6px 10px', fontSize: 12, color: '#f1f5f9', cursor: 'pointer', borderBottom: '1px solid #1e293b', borderRadius: 4, marginBottom: 2 }}>
                              {d}
                            </div>
                          ))}
                        </div>
                      ) : (
                        obtenerOpciones(col).map(op => (
                          <div key={op} onClick={() => { setFiltros(f => ({ ...f, [col]: op })); setFiltroAbierto(null); setPagina(0); }}
                            style={{ padding: '6px 10px', fontSize: 12, color: '#f1f5f9', cursor: 'pointer', borderBottom: '1px solid #1e293b' }}>
                            {op}
                          </div>
                        ))
                      ))}
                    </div>
                  )}
                </th>
              ))}
              <th style={{ ...thS, width: 100 }}><span style={{ fontSize: 11 }}>Acciones</span></th>
            </tr>
          </thead>
          <tbody>
            {itemsPagina.map(r => {
              const eq = equipos.find(e => e.id === r.id_equipo);
              const usrAtendido = r.id_solicitante ? usuarios.find(u => u.id === r.id_solicitante)?.nombre || '—' : eq?.id_usuario ? usuarios.find(u => u.id === eq.id_usuario)?.nombre || '—' : '—';
              const tecnico = r.id_tecnico_asignado ? usuarios.find(u => u.id === r.id_tecnico_asignado)?.nombre || '—' : '—';
              const fecha = new Date(r.created_at);
              return (
              <tr key={r.id} onClick={() => navigate(`/ticket?ticket=${r.id}`)} style={{ borderBottom: '1px solid #1e293b', cursor: 'pointer' }}>
                <td style={{ ...tdS, fontSize: 12, whiteSpace: 'nowrap' }}>{fecha.toLocaleDateString('es-CL')}</td>
                <td style={{ ...tdS, fontSize: 12, whiteSpace: 'nowrap' }}>{fecha.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</td>
                <td style={tdS}>{usrAtendido}</td>
                <td style={tdS}>{eq?.nombre || '—'}</td>
                <td style={tdS}>{lugares.find(l => l.id === r.id_lugar)?.nombre || '—'}</td>
                <td style={tdS}><PrioridadBadge p={r.prioridad} /></td>
                <td style={tdS}><EstadoReqBadge e={r.estado} /></td>
                <td style={{ ...tdS, color: '#94a3b8', fontSize: 12 }}>{tecnico}</td>
                <td style={tdS}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={e => { e.stopPropagation(); setEditId(r.id); setForm({ tipo_requerimiento: r.tipo_requerimiento, descripcion: r.descripcion, prioridad: r.prioridad, estado: r.estado, id_equipo: r.id_equipo || '', id_lugar: r.id_lugar || '', id_solicitante: r.id_solicitante || '', posible_falla: r.posible_falla || '', diagnostico: r.diagnostico || '', observaciones: r.observaciones || '' }); setShowForm(true); }} style={btnS} title="Editar">✏️</button>
                    {r.estado === 'Pendiente' && <button onClick={e => { e.stopPropagation(); cambiarEstado(r.id, 'En Proceso'); }} style={btnS} title="Iniciar">▶</button>}
                    {r.estado === 'En Proceso' && <button onClick={e => { e.stopPropagation(); cambiarEstado(r.id, 'Completada'); }} style={{ ...btnS, background: '#166534' }} title="Completar">✓</button>}
                    {r.estado !== 'Cancelada' && r.estado !== 'Completada' && <button onClick={e => { e.stopPropagation(); cambiarEstado(r.id, 'Cancelada'); }} style={btnS} title="Anular">✕</button>}
                    <button onClick={e => { e.stopPropagation(); eliminar(r.id); }} style={{ ...btnS, background: '#7f1d1d' }} title="Eliminar">🗑</button>
                  </div>
                </td>
              </tr>
              );
            })}
            {itemsPagina.length === 0 && <tr><td colSpan={9} style={{ textAlign: 'center', padding: 24, color: '#64748b' }}>{items.length === 0 ? 'Sin requerimientos' : 'No hay resultados para el filtro'}</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Paginador 20 */}
      {totalPaginas > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 16 }}>
          <button onClick={() => setPagina(0)} disabled={pagina === 0} style={{ ...styleBtn, opacity: pagina === 0 ? 0.4 : 1, fontSize: 11 }}>Primera</button>
          <button onClick={() => setPagina(p => Math.max(0, p - 1))} disabled={pagina === 0} style={{ ...styleBtn, opacity: pagina === 0 ? 0.4 : 1 }}>←</button>
          <span style={{ fontSize: 13, color: '#94a3b8' }}>{pagina + 1} / {totalPaginas}</span>
          <button onClick={() => setPagina(p => Math.min(totalPaginas - 1, p + 1))} disabled={pagina >= totalPaginas - 1} style={{ ...styleBtn, opacity: pagina >= totalPaginas - 1 ? 0.4 : 1 }}>→</button>
          <button onClick={() => setPagina(totalPaginas - 1)} disabled={pagina >= totalPaginas - 1} style={{ ...styleBtn, opacity: pagina >= totalPaginas - 1 ? 0.4 : 1, fontSize: 11 }}>Última</button>
        </div>
      )}
    </div>
  );
}

const thS: React.CSSProperties = { padding: '6px 6px', textAlign: 'left', fontWeight: 500, fontSize: 12, borderBottom: '2px solid #334155', verticalAlign: 'top' as const };
const tdS: React.CSSProperties = { padding: '8px 10px', borderBottom: '1px solid #1e293b' };

function PrioridadBadge({ p }: { p: string }) {
  const c: Record<string,string> = { Baja: '#64748b', Normal: '#3b82f6', Alta: '#f59e0b', Urgente: '#ef4444' };
  return <span style={{ background: c[p] || '#64748b', color: '#0f172a', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600 }}>{p}</span>;
}

function EstadoReqBadge({ e }: { e: string }) {
  const c: Record<string,string> = { Pendiente: '#f59e0b', 'En Proceso': '#3b82f6', Completada: '#22c55e', Cancelada: '#64748b' };
  return <span style={{ background: c[e] || '#64748b', color: '#0f172a', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600 }}>{e}</span>;
}
