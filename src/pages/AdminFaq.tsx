// src/pages/AdminFaq.tsx
// CRUD de preguntas FAQ (solo ADMIN)

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const FAQ_DATA_EJEMPLO = [
  { categoria: 'Ausencias', titulo: '¿Cómo registro una ausencia?', contenido: 'Ve a Justificaciones > Registrar. Selecciona el curso, marca los estudiantes ausentes, elige el motivo y guarda.' },
  { categoria: 'Ausencias', titulo: '¿Puedo registrar de días anteriores?', contenido: 'Sí, puedes seleccionar una fecha anterior en el calendario antes de registrar.' },
  { categoria: 'Pases', titulo: '¿Cómo gestionar un pase?', contenido: 'Ve a Justificaciones > Gestión de Pases. Ahí puedes crear o aprobar pases de estudiantes.' },
  { categoria: 'Justificaciones', titulo: '¿Cómo revisar justificaciones?', contenido: 'Ve a Justificaciones > Ver Justificaciones. Filtra por fecha, curso o estado.' },
  { categoria: 'Justificaciones', titulo: '¿Qué significa cada estado?', contenido: 'Injustificada = sin documento. Justificada = con documento aprobado.' },
  { categoria: 'Cuenta', titulo: '¿Dónde veo mi información?', contenido: 'Tu perfil está disponible en el menú de configuración.' },
];

const AdminFaq = () => {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [usandoDB, setUsandoDB] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [editando, setEditando] = useState<any | null>(null);
  const [categoria, setCategoria] = useState('General');
  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');

  useEffect(() => {
    supabase.from('ayuda_faq').select('*').order('categoria').then(({ data }) => {
      if (data && data.length > 0) { setFaqs(data); setUsandoDB(true); }
      else { setFaqs(FAQ_DATA_EJEMPLO); setUsandoDB(false); }
    }).catch(() => { setFaqs(FAQ_DATA_EJEMPLO); setUsandoDB(false); });
  }, []);

  const abrirForm = (item?: any) => {
    if (item) { setEditando(item); setCategoria(item.categoria); setTitulo(item.titulo); setContenido(item.contenido); }
    else { setEditando(null); setCategoria('General'); setTitulo(''); setContenido(''); }
    setFormVisible(true);
  };

  const guardar = async () => {
    if (!titulo.trim()) return;
    const nuevaFAQ = { categoria, titulo: titulo.trim(), contenido: contenido.trim(), activo: true };
    try {
      if (editando) {
        await supabase.from('ayuda_faq').update(nuevaFAQ).eq('id', editando.id);
      } else {
        await supabase.from('ayuda_faq').insert(nuevaFAQ);
      }
      setFormVisible(false);
      const { data } = await supabase.from('ayuda_faq').select('*').order('categoria');
      if (data) setFaqs(data);
    } catch (err) { console.error(err); }
  };

  const eliminar = async (id: string) => {
    try {
      await supabase.from('ayuda_faq').update({ activo: false }).eq('id', id);
      setFaqs(prev => prev.filter(f => f.id !== id));
    } catch (err) { console.error(err); }
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1A3C6B', margin: 0 }}>FAQ</h1>
          <p style={{ fontSize: 14, color: '#6B7280', margin: '4px 0 0' }}>
            {usandoDB ? `${faqs.length} preguntas en la base de datos` : 'Usando datos de ejemplo (no hay tabla ayuda_faq con datos)'}
          </p>
        </div>
        <button onClick={() => abrirForm()}
          style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#059669', color: '#FFF', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          + Nueva pregunta
        </button>
      </div>

      {formVisible && (
        <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, color: '#1F2937' }}>{editando ? 'Editar pregunta' : 'Nueva pregunta'}</h3>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 4 }}>Categoría</label>
            <input type="text" value={categoria} onChange={e => setCategoria(e.target.value)}
              placeholder="Ej: Ausencias, Pases, Cuenta..."
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 14 }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 4 }}>Título *</label>
            <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)}
              placeholder="Ej: ¿Cómo registro una ausencia?"
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 14 }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 4 }}>Contenido</label>
            <textarea value={contenido} onChange={e => setContenido(e.target.value)}
              placeholder="Escribe la respuesta..."
              rows={3} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 14, resize: 'vertical', fontFamily: 'inherit' }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={guardar} disabled={!titulo.trim()}
              style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: titulo.trim() ? '#2563EB' : '#D1D5DB', color: '#FFF', fontSize: 14, fontWeight: 600, cursor: titulo.trim() ? 'pointer' : 'default' }}>
              {editando ? 'Actualizar' : 'Crear'}
            </button>
            <button onClick={() => setFormVisible(false)}
              style={{ padding: '10px 24px', borderRadius: 8, border: '1px solid #D1D5DB', background: '#FFF', color: '#6B7280', fontSize: 14, cursor: 'pointer' }}>Cancelar</button>
          </div>
        </div>
      )}

      {faqs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: '#F9FAFB', borderRadius: 12 }}>
          <p style={{ fontSize: 32, margin: '0 0 8px' }}>📝</p>
          <p style={{ color: '#9CA3AF', fontSize: 14 }}>No hay preguntas. Crea la primera.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {faqs.map((faq: any) => (
            <div key={faq.id || Math.random()} style={{ border: '1px solid #E5E7EB', borderRadius: 10, padding: '14px 16px', background: '#FFF' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ padding: '2px 8px', borderRadius: 8, background: '#EFF6FF', color: '#1D4ED8', fontSize: 10, fontWeight: 600 }}>{faq.categoria}</span>
                  <p style={{ fontSize: 14, fontWeight: 500, color: '#1F2937', margin: '6px 0 0' }}>{faq.titulo}</p>
                  <p style={{ fontSize: 13, color: '#6B7280', margin: '4px 0 0', maxWidth: 600 }}>{faq.contenido}</p>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => abrirForm(faq)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #D1D5DB', background: '#FFF', cursor: 'pointer' }}>✏️</button>
                  <button onClick={() => eliminar(faq.id)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #FCA5A5', background: '#FFF', cursor: 'pointer' }}>🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminFaq;