import { useState, useEffect } from 'react';
import { HelpCircle, TicketCheck, BugPlay, GraduationCap, Plus, Pencil, Trash2, CheckCircle, RotateCcw } from 'lucide-react';
import { ayudaService } from '../services/ayuda.service';
import type { AyudaFAQ, AyudaTicket, AyudaCatalogoError } from '../types';

type Pestana = 'faq' | 'tickets' | 'catalogo' | 'tutoriales';

const pestanas: { key: Pestana; label: string; icono: React.ReactNode }[] = [
  { key: 'faq', label: 'FAQ', icono: <HelpCircle size={18} /> },
  { key: 'tickets', label: 'Tickets', icono: <TicketCheck size={18} /> },
  { key: 'catalogo', label: 'Catálogo Errores', icono: <BugPlay size={18} /> },
  { key: 'tutoriales', label: 'Tutoriales', icono: <GraduationCap size={18} /> },
];

export default function AdminAyuda() {
  const [pestana, setPestana] = useState<Pestana>('faq');
  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 24px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1A3C6B', margin: '0 0 4px' }}>Gestión de Ayuda</h1>
      <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 24 }}>Administra FAQ, tickets, catálogo de errores y tutoriales.</p>
      <div style={{ display: 'flex', gap: 4, borderBottom: '2px solid #E5E7EB', marginBottom: 24 }}>
        {pestanas.map(p => (
          <button key={p.key} onClick={() => setPestana(p.key)}
            style={{
              padding: '10px 20px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14,
              display: 'flex', alignItems: 'center', gap: 6,
              background: pestana === p.key ? '#1A3C6B' : 'transparent',
              color: pestana === p.key ? '#FFF' : '#6B7280',
              borderRadius: '8px 8px 0 0',
            }}>
            {p.icono} {p.label}
          </button>
        ))}
      </div>
      {pestana === 'faq' && <SeccionFAQ />}
      {pestana === 'tickets' && <SeccionTickets />}
      {pestana === 'catalogo' && <SeccionCatalogo />}
      {pestana === 'tutoriales' && <SeccionTutoriales />}
    </div>
  );
}

// ===================== SECCIÓN FAQ =====================
function SeccionFAQ() {
  const [faqs, setFaqs] = useState<AyudaFAQ[]>([]);
  const [formVisible, setFormVisible] = useState(false);
  const [editando, setEditando] = useState<AyudaFAQ | null>(null);
  const [categoria, setCategoria] = useState('General');
  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');

  useEffect(() => { ayudaService.getFAQs().then(setFaqs); }, []);

  const guardar = async () => {
    if (!titulo.trim()) return;
    if (editando) {
      await ayudaService.updateFAQ(editando.id, { categoria: categoria.trim(), titulo: titulo.trim(), contenido: contenido.trim() });
    } else {
      await ayudaService.saveFAQ({ rol: ['PROFESOR', 'INSPECTOR', 'ESTUDIANTE'], modulo: 'general', categoria: categoria.trim(), titulo: titulo.trim(), contenido: contenido.trim(), orden: 0, activo: true });
    }
    setFormVisible(false);
    setEditando(null);
    setCategoria('General'); setTitulo(''); setContenido('');
    const updated = await ayudaService.getFAQs();
    setFaqs(updated);
  };

  const abrirForm = (faq?: AyudaFAQ) => {
    if (faq) { setEditando(faq); setCategoria(faq.categoria); setTitulo(faq.titulo); setContenido(faq.contenido); }
    else { setEditando(null); setCategoria('General'); setTitulo(''); setContenido(''); }
    setFormVisible(true);
  };

  const eliminar = async (id: string) => {
    await ayudaService.deleteFAQ(id);
    setFaqs(prev => prev.filter(f => f.id !== id));
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>{faqs.length} preguntas</p>
        <button onClick={() => abrirForm()}
          style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#059669', color: '#FFF', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={16} /> Nueva FAQ
        </button>
      </div>
      {formVisible && (
        <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <h4 style={{ margin: '0 0 12px', color: '#374151' }}>{editando ? 'Editar FAQ' : 'Nueva FAQ'}</h4>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4 }}>Categoría</label>
            <input value={categoria} onChange={e => setCategoria(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 14 }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4 }}>Título</label>
            <input value={titulo} onChange={e => setTitulo(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 14 }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4 }}>Contenido</label>
            <textarea value={contenido} onChange={e => setContenido(e.target.value)} rows={3} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 14, fontFamily: 'inherit', resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={guardar} disabled={!titulo.trim()} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: titulo.trim() ? '#2563EB' : '#D1D5DB', color: '#FFF', fontSize: 14, fontWeight: 600, cursor: titulo.trim() ? 'pointer' : 'default' }}>
              {editando ? 'Actualizar' : 'Crear'}
            </button>
            <button onClick={() => setFormVisible(false)} style={{ padding: '10px 24px', borderRadius: 8, border: '1px solid #D1D5DB', background: '#FFF', color: '#6B7280', fontSize: 14, cursor: 'pointer' }}>Cancelar</button>
          </div>
        </div>
      )}
      {faqs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: '#F9FAFB', borderRadius: 12 }}>
          <HelpCircle size={40} style={{ margin: '0 auto 8px', color: '#D1D5DB' }} />
          <p style={{ color: '#9CA3AF', fontSize: 14 }}>No hay preguntas. Crea la primera.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {faqs.map(faq => (
            <div key={faq.id} style={{ border: '1px solid #E5E7EB', borderRadius: 10, padding: '14px 16px', background: faq.activo === false ? '#F9FAFB' : '#FFF', opacity: faq.activo === false ? 0.5 : 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ padding: '2px 8px', borderRadius: 8, background: '#EFF6FF', color: '#1D4ED8', fontSize: 10, fontWeight: 600 }}>{faq.categoria}</span>
                  <p style={{ fontSize: 14, fontWeight: 500, color: '#1F2937', margin: '6px 0 0' }}>{faq.titulo}</p>
                  <p style={{ fontSize: 13, color: '#6B7280', margin: '4px 0 0', maxWidth: 600 }}>{faq.contenido}</p>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => abrirForm(faq)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #D1D5DB', background: '#FFF', cursor: 'pointer' }}>
                    <Pencil size={14} color="#6B7280" />
                  </button>
                  <button onClick={() => eliminar(faq.id)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #FCA5A5', background: '#FFF', cursor: 'pointer' }}>
                    <Trash2 size={14} color="#EF4444" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===================== SECCIÓN TICKETS =====================
function SeccionTickets() {
  const [tickets, setTickets] = useState<AyudaTicket[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargar = async () => {
    setCargando(true);
    const data = await ayudaService.getTickets();
    setTickets(data);
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  const cambiarEstado = async (id: string, estado: string) => {
    await ayudaService.updateTicketEstado(id, estado);
    cargar();
  };

  if (cargando) return <p style={{ color: '#9CA3AF', textAlign: 'center', padding: 32 }}>Cargando tickets...</p>;

  return (
    <div>
      {tickets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: '#F9FAFB', borderRadius: 12 }}>
          <TicketCheck size={40} style={{ margin: '0 auto 8px', color: '#D1D5DB' }} />
          <p style={{ color: '#9CA3AF', fontSize: 14 }}>No hay tickets aún.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tickets.map(t => (
            <div key={t.id} style={{ border: '1px solid #E5E7EB', borderRadius: 10, padding: '14px 16px', background: '#FFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 500, color: '#1F2937', margin: 0 }}>{t.titulo}</p>
                {t.descripcion && <p style={{ fontSize: 13, color: '#6B7280', margin: '4px 0 0' }}>{t.descripcion}</p>}
                <p style={{ fontSize: 11, color: '#9CA3AF', margin: '4px 0 0' }}>
                  {t.creado_en ? new Date(t.creado_en).toLocaleDateString() : ''}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                  background: t.estado === 'abierto' ? '#FEF3C7' : t.estado === 'resuelto' ? '#D1FAE5' : '#F3F4F6',
                  color: t.estado === 'abierto' ? '#92400E' : t.estado === 'resuelto' ? '#065F46' : '#374151',
                }}>
                  {t.estado}
                </span>
                {t.estado === 'abierto' && (
                  <button onClick={() => cambiarEstado(t.id, 'resuelto')} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: '#059669', color: '#FFF', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle size={12} /> Resolver
                  </button>
                )}
                {t.estado === 'resuelto' && (
                  <button onClick={() => cambiarEstado(t.id, 'abierto')} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: '#F59E0B', color: '#FFF', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <RotateCcw size={12} /> Reabrir
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===================== SECCIÓN CATÁLOGO ERRORES =====================
function SeccionCatalogo() {
  const [errores, setErrores] = useState<AyudaCatalogoError[]>([]);
  const [formVisible, setFormVisible] = useState(false);
  const [editando, setEditando] = useState<AyudaCatalogoError | null>(null);
  const [categoria, setCategoria] = useState('General');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');

  const cargar = async () => {
    const data = await ayudaService.getCatalogoErrores();
    setErrores(data);
  };

  useEffect(() => { cargar(); }, []);

  const guardar = async () => {
    if (!titulo.trim()) return;
    if (editando) {
      await ayudaService.updateError(editando.id, { categoria: categoria.trim(), titulo: titulo.trim(), descripcion: descripcion.trim() });
    } else {
      await ayudaService.saveError({ categoria: categoria.trim(), titulo: titulo.trim(), descripcion: descripcion.trim() });
    }
    setFormVisible(false);
    setEditando(null);
    setCategoria('General'); setTitulo(''); setDescripcion('');
    cargar();
  };

  const abrirForm = (err?: AyudaCatalogoError) => {
    if (err) { setEditando(err); setCategoria(err.categoria); setTitulo(err.titulo); setDescripcion(err.descripcion || ''); }
    else { setEditando(null); setCategoria('General'); setTitulo(''); setDescripcion(''); }
    setFormVisible(true);
  };

  const eliminar = async (id: string) => {
    await ayudaService.deleteError(id);
    cargar();
  };

  const cats = [...new Set(errores.map(e => e.categoria))];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>{errores.length} errores registrados</p>
        <button onClick={() => abrirForm()} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#059669', color: '#FFF', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={16} /> Nuevo error
        </button>
      </div>
      {formVisible && (
        <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <h4 style={{ margin: '0 0 12px', color: '#374151' }}>{editando ? 'Editar error' : 'Nuevo error'}</h4>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4 }}>Categoría</label>
            <input value={categoria} onChange={e => setCategoria(e.target.value)} list="cats-err" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 14 }} />
            <datalist id="cats-err">{cats.map(c => <option key={c} value={c} />)}</datalist>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4 }}>Título</label>
            <input value={titulo} onChange={e => setTitulo(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 14 }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4 }}>Descripción</label>
            <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={2} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 14, fontFamily: 'inherit', resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={guardar} disabled={!titulo.trim()} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: titulo.trim() ? '#2563EB' : '#D1D5DB', color: '#FFF', fontSize: 14, fontWeight: 600, cursor: titulo.trim() ? 'pointer' : 'default' }}>
              {editando ? 'Actualizar' : 'Crear'}
            </button>
            <button onClick={() => setFormVisible(false)} style={{ padding: '10px 24px', borderRadius: 8, border: '1px solid #D1D5DB', background: '#FFF', color: '#6B7280', cursor: 'pointer' }}>Cancelar</button>
          </div>
        </div>
      )}
      {errores.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: '#F9FAFB', borderRadius: 12 }}>
          <BugPlay size={40} style={{ margin: '0 auto 8px', color: '#D1D5DB' }} />
          <p style={{ color: '#9CA3AF', fontSize: 14 }}>No hay errores registrados.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {errores.map(e => (
            <div key={e.id} style={{ border: '1px solid #E5E7EB', borderRadius: 10, padding: '12px 16px', background: '#FFF' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ padding: '2px 8px', borderRadius: 8, background: '#EFF6FF', color: '#1D4ED8', fontSize: 10, fontWeight: 600 }}>{e.categoria}</span>
                  <p style={{ fontSize: 14, fontWeight: 500, color: '#1F2937', margin: '4px 0 0' }}>{e.titulo}</p>
                  {e.descripcion && <p style={{ fontSize: 13, color: '#6B7280', margin: '2px 0 0' }}>{e.descripcion}</p>}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => abrirForm(e)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #D1D5DB', background: '#FFF', cursor: 'pointer' }}>
                    <Pencil size={14} color="#6B7280" />
                  </button>
                  <button onClick={() => eliminar(e.id)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #FCA5A5', background: '#FFF', cursor: 'pointer' }}>
                    <Trash2 size={14} color="#EF4444" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===================== SECCIÓN TUTORIALES =====================
function SeccionTutoriales() {
  return (
    <div style={{ textAlign: 'center', padding: 60, background: '#F9FAFB', borderRadius: 12 }}>
      <GraduationCap size={48} style={{ margin: '0 auto 12px', color: '#D1D5DB' }} />
      <p style={{ color: '#9CA3AF', fontSize: 15 }}>Próximamente</p>
      <p style={{ color: '#D1D5DB', fontSize: 13, marginTop: 4 }}>Creación de tutoriales con selectores de elementos UI y efecto de oscurecimiento.</p>
    </div>
  );
}
