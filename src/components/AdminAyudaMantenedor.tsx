import { useState, useEffect } from 'react';
import { HelpCircle, BugPlay, GraduationCap, Plus, Pencil, Trash2, ChevronDown } from 'lucide-react';
import { ayudaService } from '../services/ayuda.service';
import type { AyudaFAQ, AyudaCatalogoError } from '../types';

const AdminAyudaMantenedor = () => {
  const [seccion, setSeccion] = useState<string | null>(null);

  return (
    <div style={{ maxWidth: '960px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
          <HelpCircle size={20} />
        </div>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1F2937', margin: 0 }}>Módulo de Ayuda</h3>
          <p style={{ fontSize: 13, color: '#6B7280', margin: '2px 0 0' }}>Administra FAQ, Tutoriales y Errores del sistema</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <AcordeonItem
          titulo="FAQ - Preguntas Frecuentes"
          icono={<HelpCircle size={18} />}
          abierto={seccion === 'faq'}
          onClick={() => setSeccion(seccion === 'faq' ? null : 'faq')}
        >
          <SeccionFAQ />
        </AcordeonItem>

        <AcordeonItem
          titulo="Tutoriales"
          icono={<GraduationCap size={18} />}
          abierto={seccion === 'tutoriales'}
          onClick={() => setSeccion(seccion === 'tutoriales' ? null : 'tutoriales')}
        >
          <SeccionTutoriales />
        </AcordeonItem>

        <AcordeonItem
          titulo="Errores - Catálogo del sistema"
          icono={<BugPlay size={18} />}
          abierto={seccion === 'errores'}
          onClick={() => setSeccion(seccion === 'errores' ? null : 'errores')}
        >
          <SeccionErrores />
        </AcordeonItem>
      </div>
    </div>
  );
};

const AcordeonItem = ({ titulo, icono, abierto, onClick, children }: { titulo: string; icono: React.ReactNode; abierto: boolean; onClick: () => void; children: React.ReactNode }) => (
  <div style={{ border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
    <button onClick={onClick} style={{
      width: '100%', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10,
      border: 'none', background: abierto ? '#F8FAFC' : '#FFF', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#374151', textAlign: 'left',
    }}>
      {icono}
      <span style={{ flex: 1 }}>{titulo}</span>
      <ChevronDown size={16} color="#9CA3AF" style={{ transform: abierto ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
    </button>
    {abierto && <div style={{ borderTop: '1px solid #E5E7EB', padding: 16 }}>{children}</div>}
  </div>
);

const SeccionFAQ = () => {
  const [faqs, setFaqs] = useState<AyudaFAQ[]>([]);
  const [formVisible, setFormVisible] = useState(false);
  const [editando, setEditando] = useState<AyudaFAQ | null>(null);
  const [categoria, setCategoria] = useState('General');
  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');

  useEffect(() => { ayudaService.getFAQs().then(setFaqs); }, []);

  const guardar = async () => {
    if (!titulo.trim()) return;
    const obj = { rol: ['PROFESOR', 'INSPECTOR', 'ESTUDIANTE'], modulo: 'general', categoria: categoria.trim(), titulo: titulo.trim(), contenido: contenido.trim(), orden: 0, activo: true };
    if (editando) {
      await ayudaService.updateFAQ(editando.id, { categoria: categoria.trim(), titulo: titulo.trim(), contenido: contenido.trim() });
    } else {
      await ayudaService.saveFAQ(obj);
    }
    setFormVisible(false);
    setEditando(null);
    setCategoria('General'); setTitulo(''); setContenido('');
    const updated = await ayudaService.getFAQs();
    setFaqs(updated);
  };

  const eliminar = async (id: string) => {
    await ayudaService.deleteFAQ(id);
    setFaqs(prev => prev.filter(f => f.id !== id));
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>{faqs.length} preguntas</p>
        <button onClick={() => { setEditando(null); setCategoria('General'); setTitulo(''); setContenido(''); setFormVisible(true); }}
          style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: '#059669', color: '#FFF', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Plus size={14} /> Nueva
        </button>
      </div>

      {formVisible && (
        <div style={{ background: '#F9FAFB', borderRadius: 8, padding: 16, marginBottom: 12, border: '1px solid #E5E7EB' }}>
          <input placeholder="Categoría" value={categoria} onChange={e => setCategoria(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13, marginBottom: 8 }} />
          <input placeholder="Título" value={titulo} onChange={e => setTitulo(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13, marginBottom: 8 }} />
          <textarea placeholder="Contenido" value={contenido} onChange={e => setContenido(e.target.value)} rows={2}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13, fontFamily: 'inherit', marginBottom: 8 }} />
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={guardar} disabled={!titulo.trim()}
              style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: titulo.trim() ? '#2563EB' : '#D1D5DB', color: '#FFF', fontSize: 13, cursor: titulo.trim() ? 'pointer' : 'default' }}>
              {editando ? 'Actualizar' : 'Crear'}
            </button>
            <button onClick={() => setFormVisible(false)}
              style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #D1D5DB', background: '#FFF', color: '#6B7280', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {faqs.map((f, i) => (
          <div key={f.id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#F9FAFB', borderRadius: 8 }}>
            <div>
              <span style={{ padding: '2px 6px', borderRadius: 4, background: '#EFF6FF', color: '#1D4ED8', fontSize: 10, fontWeight: 600 }}>{f.categoria}</span>
              <p style={{ fontSize: 13, color: '#374151', margin: '4px 0 0' }}>{f.titulo}</p>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => { setEditando(f); setCategoria(f.categoria); setTitulo(f.titulo); setContenido(f.contenido); setFormVisible(true); }}
                style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #D1D5DB', background: '#FFF', cursor: 'pointer' }}>
                <Pencil size={14} color="#6B7280" />
              </button>
              <button onClick={() => eliminar(f.id)}
                style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #FCA5A5', background: '#FFF', cursor: 'pointer' }}>
                <Trash2 size={14} color="#EF4444" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SeccionTutoriales = () => (
  <div style={{ textAlign: 'center', padding: 32, background: '#F9FAFB', borderRadius: 8 }}>
    <GraduationCap size={32} style={{ margin: '0 auto 8px', color: '#D1D5DB' }} />
    <p style={{ color: '#9CA3AF', fontSize: 14 }}>Próximamente: creación de tutoriales paso a paso.</p>
  </div>
);

const SeccionErrores = () => {
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

  const eliminar = async (id: string) => {
    await ayudaService.deleteError(id);
    cargar();
  };

  const cats = [...new Set(errores.map(e => e.categoria))];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>{errores.length} errores</p>
        <button onClick={() => { setEditando(null); setCategoria('General'); setTitulo(''); setDescripcion(''); setFormVisible(true); }}
          style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: '#059669', color: '#FFF', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Plus size={14} /> Nuevo
        </button>
      </div>

      {formVisible && (
        <div style={{ background: '#F9FAFB', borderRadius: 8, padding: 16, marginBottom: 12, border: '1px solid #E5E7EB' }}>
          <input placeholder="Categoría" value={categoria} onChange={e => setCategoria(e.target.value)} list="cats-e"
            style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13, marginBottom: 8 }} />
          <datalist id="cats-e">{cats.map(c => <option key={c} value={c} />)}</datalist>
          <input placeholder="Título del error" value={titulo} onChange={e => setTitulo(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13, marginBottom: 8 }} />
          <textarea placeholder="Descripción" value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={1}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13, fontFamily: 'inherit', marginBottom: 8 }} />
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={guardar} disabled={!titulo.trim()}
              style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: titulo.trim() ? '#2563EB' : '#D1D5DB', color: '#FFF', fontSize: 13, cursor: titulo.trim() ? 'pointer' : 'default' }}>
              {editando ? 'Actualizar' : 'Crear'}
            </button>
            <button onClick={() => setFormVisible(false)}
              style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #D1D5DB', background: '#FFF', color: '#6B7280', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {errores.map((e, i) => (
          <div key={e.id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#F9FAFB', borderRadius: 8 }}>
            <div>
              <span style={{ padding: '2px 6px', borderRadius: 4, background: '#EFF6FF', color: '#1D4ED8', fontSize: 10, fontWeight: 600 }}>{e.categoria}</span>
              <p style={{ fontSize: 13, color: '#374151', margin: '4px 0 0' }}>{e.titulo}</p>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => { setEditando(e); setCategoria(e.categoria); setTitulo(e.titulo); setDescripcion(e.descripcion || ''); setFormVisible(true); }}
                style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #D1D5DB', background: '#FFF', cursor: 'pointer' }}>
                <Pencil size={14} color="#6B7280" />
              </button>
              <button onClick={() => eliminar(e.id)}
                style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #FCA5A5', background: '#FFF', cursor: 'pointer' }}>
                <Trash2 size={14} color="#EF4444" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminAyudaMantenedor;
