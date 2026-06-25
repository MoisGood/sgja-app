// src/components/AdminAyudaMantenedor.tsx
// Acordeón de administración de ayuda (FAQ, Tutoriales, Errores)
// Se renderiza dentro de Configuración > Mantenedores

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Datos FAQ de ejemplo
const FAQ_EJEMPLO = [
  { categoria: 'Ausencias', titulo: '¿Cómo registro una ausencia?', contenido: 'Ve a Justificaciones > Registrar.' },
  { categoria: 'Pases', titulo: '¿Cómo gestionar un pase?', contenido: 'Ve a Justificaciones > Gestión de Pases.' },
  { categoria: 'Cuenta', titulo: '¿Dónde veo mi información?', contenido: 'En el menú de configuración.' },
];

const AdminAyudaMantenedor = () => {
  const [seccion, setSeccion] = useState<string | null>(null);

  return (
    <div style={{ maxWidth: '960px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: 20, fontWeight: 700 }}>+</div>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1F2937', margin: 0 }}>Módulo de Ayuda</h3>
          <p style={{ fontSize: 13, color: '#6B7280', margin: '2px 0 0' }}>Administra FAQ, Tutoriales y Errores del sistema</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <AcordeonItem
          titulo="FAQ - Preguntas Frecuentes"
          icono="📝"
          abierto={seccion === 'faq'}
          onClick={() => setSeccion(seccion === 'faq' ? null : 'faq')}
        >
          <SeccionFAQ />
        </AcordeonItem>

        <AcordeonItem
          titulo="Tutoriales"
          icono="🎯"
          abierto={seccion === 'tutoriales'}
          onClick={() => setSeccion(seccion === 'tutoriales' ? null : 'tutoriales')}
        >
          <SeccionTutoriales />
        </AcordeonItem>

        <AcordeonItem
          titulo="Errores - Catálogo del sistema"
          icono="⚠️"
          abierto={seccion === 'errores'}
          onClick={() => setSeccion(seccion === 'errores' ? null : 'errores')}
        >
          <SeccionErrores />
        </AcordeonItem>
      </div>
    </div>
  );
};

// ===== Acordeón =====
const AcordeonItem = ({ titulo, icono, abierto, onClick, children }: { titulo: string; icono: string; abierto: boolean; onClick: () => void; children: React.ReactNode }) => (
  <div style={{ border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
    <button onClick={onClick} style={{
      width: '100%', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10,
      border: 'none', background: abierto ? '#F8FAFC' : '#FFF', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#374151', textAlign: 'left',
    }}>
      <span style={{ fontSize: 18 }}>{icono}</span>
      <span style={{ flex: 1 }}>{titulo}</span>
      <svg style={{ transform: abierto ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} width="16" height="16" fill="none" stroke="#9CA3AF" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
    {abierto && <div style={{ borderTop: '1px solid #E5E7EB', padding: 16 }}>{children}</div>}
  </div>
);

// ===== Sección FAQ =====
const SeccionFAQ = () => {
  const [faqs, setFaqs] = useState<any[]>(FAQ_EJEMPLO);
  const [formVisible, setFormVisible] = useState(false);
  const [editando, setEditando] = useState<any | null>(null);
  const [categoria, setCategoria] = useState('General');
  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');

  useEffect(() => {
    supabase.from('ayuda_faq').select('*').order('categoria').then(({ data }) => {
      if (data && data.length > 0) setFaqs(data);
    }).catch(() => {});
  }, []);

  const guardar = async () => {
    if (!titulo.trim()) return;
    const obj = { categoria, titulo: titulo.trim(), contenido: contenido.trim(), activo: true };
    try {
      if (editando) await supabase.from('ayuda_faq').update(obj).eq('id', editando.id);
      else await supabase.from('ayuda_faq').insert(obj);
      setFormVisible(false);
      const { data } = await supabase.from('ayuda_faq').select('*').order('categoria');
      if (data) setFaqs(data);
    } catch (err) { console.error(err); }
  };

  const eliminar = async (id: string) => {
    try { await supabase.from('ayuda_faq').update({ activo: false }).eq('id', id); setFaqs(prev => prev.filter(f => f.id !== id)); }
    catch (err) { console.error(err); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>{faqs.length} preguntas</p>
        <button onClick={() => { setEditando(null); setCategoria('General'); setTitulo(''); setContenido(''); setFormVisible(true); }}
          style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: '#059669', color: '#FFF', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          + Nueva
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
                style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #D1D5DB', background: '#FFF', cursor: 'pointer', fontSize: 12 }}>✏️</button>
              <button onClick={() => eliminar(f.id)}
                style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #FCA5A5', background: '#FFF', cursor: 'pointer', fontSize: 12 }}>🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ===== Sección Tutoriales (placeholder) =====
const SeccionTutoriales = () => (
  <div style={{ textAlign: 'center', padding: 32, background: '#F9FAFB', borderRadius: 8 }}>
    <p style={{ fontSize: 32, margin: '0 0 8px' }}>🎯</p>
    <p style={{ color: '#9CA3AF', fontSize: 14 }}>Próximamente: creación de tutoriales paso a paso.</p>
  </div>
);

// ===== Sección Errores (Catálogo) =====
const SeccionErrores = () => {
  const [errores, setErrores] = useState<any[]>([]);
  const [formVisible, setFormVisible] = useState(false);
  const [editando, setEditando] = useState<any | null>(null);
  const [categoria, setCategoria] = useState('General');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');

  const cargar = async () => {
    const { data } = await supabase.from('ayuda_catalogo_errores').select('*').order('categoria').order('titulo');
    if (data) setErrores(data);
  };
  useEffect(() => { cargar(); }, []);

  const guardar = async () => {
    if (!titulo.trim()) return;
    try {
      if (editando) await supabase.from('ayuda_catalogo_errores').update({ categoria, titulo: titulo.trim(), descripcion: descripcion.trim(), actualizado_en: new Date().toISOString() }).eq('id', editando.id);
      else await supabase.from('ayuda_catalogo_errores').insert({ categoria, titulo: titulo.trim(), descripcion: descripcion.trim() });
      setFormVisible(false);
      cargar();
    } catch (err) { console.error(err); }
  };

  const eliminar = async (id: string) => {
    try { await supabase.from('ayuda_catalogo_errores').update({ activo: false }).eq('id', id); cargar(); }
    catch (err) { console.error(err); }
  };

  const cats = [...new Set(errores.map(e => e.categoria))];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>{errores.length} errores</p>
        <button onClick={() => { setEditando(null); setCategoria('General'); setTitulo(''); setDescripcion(''); setFormVisible(true); }}
          style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: '#059669', color: '#FFF', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          + Nuevo
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
                style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #D1D5DB', background: '#FFF', cursor: 'pointer', fontSize: 12 }}>✏️</button>
              <button onClick={() => eliminar(e.id)}
                style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #FCA5A5', background: '#FFF', cursor: 'pointer', fontSize: 12 }}>🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminAyudaMantenedor;