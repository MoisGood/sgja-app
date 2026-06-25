// src/pages/AdminTickets.tsx
// Gestión de tickets + CRUD catálogo de errores (solo ADMIN)

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

const AdminTickets = () => {
  const { uid } = useAuth();
  const [pestana, setPestana] = useState<'tickets' | 'catalogo'>('tickets');

  // Datos de tickets
  const [tickets, setTickets] = useState<any[]>([]);
  const [cargandoTickets, setCargandoTickets] = useState(true);

  // Datos del catálogo
  const [errores, setErrores] = useState<any[]>([]);
  const [cargandoE, setCargandoE] = useState(true);
  const [formVisible, setFormVisible] = useState(false);
  const [editando, setEditando] = useState<any | null>(null);
  const [categoria, setCategoria] = useState('General');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');

  const cargarTickets = async () => {
    setCargandoTickets(true);
    try {
      const { data } = await supabase.from('ayuda_tickets').select('*').order('creado_en', { ascending: false });
      setTickets(data || []);
    } catch { setTickets([]); } finally { setCargandoTickets(false); }
  };

  const cargarCatalogo = async () => {
    setCargandoE(true);
    try {
      const { data } = await supabase.from('ayuda_catalogo_errores').select('*').order('categoria').order('titulo');
      setErrores(data || []);
    } catch { setErrores([]); } finally { setCargandoE(false); }
  };

  useEffect(() => { cargarTickets(); cargarCatalogo(); }, []);

  const cambiarEstado = async (id: string, estado: string) => {
    try { await supabase.from('ayuda_tickets').update({ estado }).eq('id', id); cargarTickets(); }
    catch (err) { console.error(err); }
  };

  const abrirForm = (err?: any) => {
    if (err) { setEditando(err); setCategoria(err.categoria); setTitulo(err.titulo); setDescripcion(err.descripcion || ''); }
    else { setEditando(null); setCategoria('General'); setTitulo(''); setDescripcion(''); }
    setFormVisible(true);
  };

  const guardarError = async () => {
    if (!titulo.trim()) return;
    try {
      if (editando) {
        await supabase.from('ayuda_catalogo_errores').update({ categoria, titulo: titulo.trim(), descripcion: descripcion.trim(), actualizado_en: new Date().toISOString() }).eq('id', editando.id);
      } else {
        await supabase.from('ayuda_catalogo_errores').insert({ categoria, titulo: titulo.trim(), descripcion: descripcion.trim() });
      }
      setFormVisible(false);
      cargarCatalogo();
    } catch (err) { console.error(err); }
  };

  const eliminarError = async (id: string) => {
    try { await supabase.from('ayuda_catalogo_errores').update({ activo: false }).eq('id', id); cargarCatalogo(); }
    catch (err) { console.error(err); }
  };

  const categoriasExistentes = [...new Set(errores.map((e: any) => e.categoria))];

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 24px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1A3C6B', margin: '0 0 4px' }}>Tickets de Soporte</h1>
      <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 24 }}>Gestiona los tickets de los usuarios y el catálogo de errores.</p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '2px solid #E5E7EB', marginBottom: 24 }}>
        <button onClick={() => setPestana('tickets')}
          style={{ padding: '10px 20px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14,
            background: pestana === 'tickets' ? '#1A3C6B' : 'transparent', color: pestana === 'tickets' ? '#FFF' : '#6B7280', borderRadius: '8px 8px 0 0' }}>
          Tickets recibidos ({tickets.length})
        </button>
        <button onClick={() => setPestana('catalogo')}
          style={{ padding: '10px 20px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14,
            background: pestana === 'catalogo' ? '#1A3C6B' : 'transparent', color: pestana === 'catalogo' ? '#FFF' : '#6B7280', borderRadius: '8px 8px 0 0' }}>
          Catálogo de errores ({errores.length})
        </button>
      </div>

      {/* Tickets */}
      {pestana === 'tickets' && (
        <div>
          {cargandoTickets ? (
            <p style={{ color: '#9CA3AF', textAlign: 'center', padding: 32 }}>Cargando tickets...</p>
          ) : tickets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, background: '#F9FAFB', borderRadius: 12 }}>
              <p style={{ fontSize: 32, margin: '0 0 8px' }}>🎫</p>
              <p style={{ color: '#9CA3AF', fontSize: 14 }}>No hay tickets aún. Los usuarios enviarán tickets desde la página de ayuda.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tickets.map((t: any) => (
                <div key={t.id} style={{ border: '1px solid #E5E7EB', borderRadius: 10, padding: '14px 16px', background: '#FFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 500, color: '#1F2937', margin: 0 }}>{t.titulo}</p>
                    {t.descripcion && <p style={{ fontSize: 13, color: '#6B7280', margin: '4px 0 0' }}>{t.descripcion}</p>}
                    <p style={{ fontSize: 11, color: '#9CA3AF', margin: '4px 0 0' }}>
                      {t.creado_en ? new Date(t.creado_en).toLocaleDateString() : ''}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                      background: t.estado === 'abierto' ? '#FEF3C7' : t.estado === 'resuelto' ? '#D1FAE5' : '#F3F4F6',
                      color: t.estado === 'abierto' ? '#92400E' : t.estado === 'resuelto' ? '#065F46' : '#374151' }}>
                      {t.estado}
                    </span>
                    {t.estado === 'abierto' && (
                      <button onClick={() => cambiarEstado(t.id, 'resuelto')}
                        style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: '#059669', color: '#FFF', fontSize: 11, cursor: 'pointer' }}>
                        Resolver
                      </button>
                    )}
                    {t.estado === 'resuelto' && (
                      <button onClick={() => cambiarEstado(t.id, 'abierto')}
                        style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: '#F59E0B', color: '#FFF', fontSize: 11, cursor: 'pointer' }}>
                        Reabrir
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Catálogo de errores */}
      {pestana === 'catalogo' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>{errores.length} errores registrados</p>
            <button onClick={() => abrirForm()}
              style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#059669', color: '#FFF', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              + Nuevo error
            </button>
          </div>

          {formVisible && (
            <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20, marginBottom: 20 }}>
              <h4 style={{ margin: '0 0 12px', color: '#374151' }}>{editando ? 'Editar error' : 'Nuevo error'}</h4>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4 }}>Categoría</label>
                <input type="text" value={categoria} onChange={e => setCategoria(e.target.value)} list="cats"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 14 }} />
                <datalist id="cats">{categoriasExistentes.map(c => <option key={c} value={c} />)}</datalist>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4 }}>Título *</label>
                <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 14 }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4 }}>Descripción</label>
                <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={2}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 14, fontFamily: 'inherit', resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={guardarError} disabled={!titulo.trim()}
                  style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: titulo.trim() ? '#2563EB' : '#D1D5DB', color: '#FFF', fontSize: 14, fontWeight: 600, cursor: titulo.trim() ? 'pointer' : 'default' }}>
                  {editando ? 'Actualizar' : 'Crear'}
                </button>
                <button onClick={() => setFormVisible(false)}
                  style={{ padding: '10px 24px', borderRadius: 8, border: '1px solid #D1D5DB', background: '#FFF', color: '#6B7280', cursor: 'pointer' }}>Cancelar</button>
              </div>
            </div>
          )}

          {cargandoE ? (
            <p style={{ color: '#9CA3AF', textAlign: 'center', padding: 32 }}>Cargando...</p>
          ) : errores.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, background: '#F9FAFB', borderRadius: 12 }}>
              <p style={{ fontSize: 32, marginBottom: 8 }}>📋</p>
              <p style={{ color: '#9CA3AF', fontSize: 14 }}>No hay errores registrados. Crea el primero.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {errores.map((e: any) => (
                <div key={e.id} style={{ border: '1px solid #E5E7EB', borderRadius: 10, padding: '12px 16px', background: e.activo === false ? '#F9FAFB' : '#FFF', opacity: e.activo === false ? 0.5 : 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ padding: '2px 8px', borderRadius: 8, background: '#EFF6FF', color: '#1D4ED8', fontSize: 10, fontWeight: 600 }}>{e.categoria}</span>
                      <p style={{ fontSize: 14, fontWeight: 500, color: '#1F2937', margin: '4px 0 0' }}>{e.titulo}</p>
                      {e.descripcion && <p style={{ fontSize: 13, color: '#6B7280', margin: '2px 0 0' }}>{e.descripcion}</p>}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => abrirForm(e)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #D1D5DB', background: '#FFF', cursor: 'pointer' }}>✏️</button>
                      <button onClick={() => eliminarError(e.id)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #FCA5A5', background: '#FFF', cursor: 'pointer' }}>🗑️</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminTickets;