// src/pages/AyudaPage.tsx
// PÃ¡gina de ayuda - versiÃ³n desktop (todos los roles)

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

// =============== FAQ ===============
const FAQ_DATA: Record<string, { categoria: string; items: { titulo: string; contenido: string }[] }[]> = {
  PROFESOR: [
    {
      categoria: 'Ausencias',
      items: [
        { titulo: 'Â¿CÃ³mo registro una ausencia?', contenido: 'Ve a Justificaciones > Registrar. Selecciona el curso, marca los estudiantes ausentes, elige el motivo y guarda.' },
        { titulo: 'Â¿Puedo registrar de dÃ­as anteriores?', contenido: 'SÃ­, puedes seleccionar una fecha anterior en el calendario antes de registrar.' },
      ],
    },
    {
      categoria: 'Pases',
      items: [
        { titulo: 'Â¿CÃ³mo gestionar un pase?', contenido: 'Ve a Justificaciones > GestiÃ³n de Pases. AhÃ­ puedes crear o aprobar pases de estudiantes.' },
      ],
    },
  ],
  INSPECTOR: [
    {
      categoria: 'Justificaciones',
      items: [
        { titulo: 'Â¿CÃ³mo revisar justificaciones?', contenido: 'Ve a Justificaciones > Ver Justificaciones. Filtra por fecha, curso o estado.' },
        { titulo: 'Â¿QuÃ© significa cada estado?', contenido: 'Injustificada = sin documento. Justificada = con documento aprobado.' },
      ],
    },
  ],
  ESTUDIANTE: [
    {
      categoria: 'Mi cuenta',
      items: [
        { titulo: 'Â¿DÃ³nde veo mis justificaciones?', contenido: 'En tu panel principal puedes ver el historial de ausencias y justificaciones.' },
      ],
    },
  ],
  ADMIN: [],
};

// =============== PÃGINA PRINCIPAL ===============
const AyudaPage = () => {
  const { rol } = useAuth();
  const [busqueda, setBusqueda] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState<string | null>(null);
  const [pestana, setPestana] = useState<'ayuda' | 'tickets'>('ayuda');
  const inputRef = useRef<HTMLInputElement>(null);

  const faqs = FAQ_DATA[rol as keyof typeof FAQ_DATA] || [];

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 100); }, []);

  const categoriasFiltradas = faqs
    .map(cat => ({
      ...cat,
      items: cat.items.filter(i =>
        i.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
        i.contenido.toLowerCase().includes(busqueda.toLowerCase())
      ),
    }))
    .filter(cat => cat.items.length > 0);

  const categoriasVisibles = categoriaActiva
    ? categoriasFiltradas.filter(c => c.categoria === categoriaActiva)
    : categoriasFiltradas;

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 24px' }}>
      {/* Encabezado */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="24" height="24" fill="none" stroke="#FFF" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 16.121a3 3 0 104.242-4.242 3 3 0 00-4.242 4.242z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a10 10 0 100 20 10 10 0 000-20z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
          </svg>
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1A3C6B', margin: 0 }}>Centro de Ayuda</h1>
          <p style={{ fontSize: 14, color: '#6B7280', margin: '4px 0 0' }}>Encuentra respuestas a tus preguntas</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #E5E7EB', marginBottom: 28 }}>
        <TabButton activo={pestana === 'ayuda'} onClick={() => setPestana('ayuda')}>Preguntas Frecuentes</TabButton>
        <TabButton activo={pestana === 'tickets'} onClick={() => setPestana('tickets')}>Tickets de Soporte</TabButton>
      </div>

      {pestana === 'ayuda' && (
        <>
          <div style={{ position: 'relative', marginBottom: 24 }}>
            <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} width="16" height="16" fill="none" stroke="#9CA3AF" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input ref={inputRef} type="text" placeholder="Buscar en la ayuda..." value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); setCategoriaActiva(null); }}
              style={{ width: '100%', padding: '12px 16px 12px 42px', border: '1px solid #D1D5DB', borderRadius: 10, fontSize: 15, outline: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
              onFocus={(e) => e.target.style.borderColor = '#2563EB'}
              onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
            />
          </div>

          {!busqueda && !categoriaActiva && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
              {faqs.map(cat => (
                <button key={cat.categoria} onClick={() => setCategoriaActiva(cat.categoria)}
                  style={{ padding: '6px 16px', borderRadius: 20, border: '1px solid #DBEAFE', background: '#EFF6FF', color: '#1D4ED8', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
                  {cat.categoria}
                </button>
              ))}
              {faqs.length > 1 && (
                <button onClick={() => setCategoriaActiva(null)}
                  style={{ padding: '6px 16px', borderRadius: 20, border: '1px solid #E5E7EB', background: '#F9FAFB', color: '#6B7280', fontSize: 13, cursor: 'pointer' }}>
                  Ver todo
                </button>
              )}
            </div>
          )}

          {categoriaActiva && !busqueda && (
            <div style={{ marginBottom: 16, fontSize: 13, color: '#6B7280' }}>
              <span style={{ color: '#2563EB', cursor: 'pointer' }} onClick={() => setCategoriaActiva(null)}>Todas las categorÃ­as</span>
              <span style={{ margin: '0 8px' }}>/</span>
              <span style={{ fontWeight: 600, color: '#374151' }}>{categoriaActiva}</span>
            </div>
          )}

          {categoriasVisibles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>ðŸ”</div>
              <p style={{ color: '#6B7280', fontSize: 15 }}>No encontramos resultados para <strong>&quot;{busqueda}&quot;</strong></p>
              <p style={{ color: '#9CA3AF', fontSize: 13, marginTop: 4 }}>Prueba con otras palabras clave</p>
            </div>
          ) : (
            categoriasVisibles.map((cat, idx) => (
              <div key={cat.categoria} style={idx > 0 ? { marginTop: 32 } : {}}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span style={{ display: 'inline-block', width: 3, height: 18, background: '#2563EB', borderRadius: 2 }} />
                  <h3 style={{ fontSize: 13, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{cat.categoria}</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {cat.items.map((item, i) => (
                    <FaqCard key={i} titulo={item.titulo} contenido={item.contenido} />
                  ))}
                </div>
              </div>
            ))
          )}

          {!busqueda && (
            <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid #E5E7EB' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <span style={{ display: 'inline-block', width: 3, height: 18, background: '#F59E0B', borderRadius: 2 }} />
                <h3 style={{ fontSize: 13, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Tutoriales disponibles</h3>
              </div>
              <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: '24px', textAlign: 'center' }}>
                <p style={{ color: '#92400E', fontSize: 14, fontWeight: 500, margin: '0 0 4px' }}>PrÃ³ximamente</p>
                <p style={{ color: '#B45309', fontSize: 13, margin: 0 }}>Tutoriales guiados paso a paso con resaltado visual.</p>
              </div>
            </div>
          )}
        </>
      )}

      {pestana === 'tickets' && <SistemaTickets />}
    </div>
  );
};

// =============== COMPONENTES PEQUEÃ‘OS ===============
const TabButton = ({ activo, onClick, children }: { activo: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button onClick={onClick}
    style={{ padding: '10px 24px', border: 'none', background: 'none', color: activo ? '#2563EB' : '#6B7280', fontWeight: activo ? 600 : 400, fontSize: 14, cursor: 'pointer', borderBottom: activo ? '2px solid #2563EB' : '2px solid transparent', marginBottom: -2, transition: 'all 0.15s' }}>
    {children}
  </button>
);

const FaqCard = ({ titulo, contenido }: { titulo: string; contenido: string }) => {
  const [expandido, setExpandido] = useState(false);
  return (
    <div style={{ border: `1px solid ${expandido ? '#93C5FD' : '#E5E7EB'}`, borderRadius: 10, overflow: 'hidden', transition: 'all 0.15s', boxShadow: expandido ? '0 1px 4px rgba(37,99,235,0.1)' : 'none' }}>
      <button onClick={() => setExpandido(!expandido)}
        style={{ width: '100%', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, border: 'none', background: expandido ? '#F8FAFF' : '#FFF', cursor: 'pointer', fontSize: 14, fontWeight: 500, color: '#1F2937', textAlign: 'left' }}>
        <span>{titulo}</span>
        <svg style={{ transform: expandido ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} width="16" height="16" fill="none" stroke="#9CA3AF" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {expandido && (
        <div style={{ padding: '0 16px 14px' }}>
          <p style={{ fontSize: 14, color: '#4B5563', lineHeight: 1.6, margin: 0 }}>{contenido}</p>
        </div>
      )}
    </div>
  );
};

// =============== SISTEMA DE TICKETS (con catÃ¡logo de errores) ===============
const SistemaTickets = () => {
  const { uid, rol } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [catalogo, setCatalogo] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [formVisible, setFormVisible] = useState(false);
  const [errorSeleccionado, setErrorSeleccionado] = useState<string | null>(null);
  const [categoriaFiltro, setCategoriaFiltro] = useState<string | null>(null);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [ticketsRes, catalogoRes] = await Promise.all([
        supabase.from('ayuda_tickets').select('*').order('creado_en', { ascending: false }),
        supabase.from('ayuda_catalogo_errores').select('*').eq('activo', true).order('categoria').order('titulo'),
      ]);
      setTickets(ticketsRes.data || []);
      setCatalogo(catalogoRes.data || []);
    } catch {
      setTickets([]);
      setCatalogo([]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarDatos(); }, []);

  const crearTicket = async () => {
    if (!errorSeleccionado || !uid) return;
    const error = catalogo.find(e => e.id === errorSeleccionado);
    try {
      await supabase.from('ayuda_tickets').insert({
        usuario_id: uid,
        titulo: error?.titulo || 'Error sin especificar',
        descripcion: error?.descripcion || '',
        estado: 'abierto',
        prioridad: 'media',
      });
      setErrorSeleccionado(null);
      setFormVisible(false);
      cargarDatos();
    } catch (err) {
      console.error('Error al crear ticket:', err);
    }
  };

  const cambiarEstado = async (id: string, nuevoEstado: string) => {
    if (rol !== 'ADMIN') return;
    try {
      await supabase.from('ayuda_tickets').update({ estado: nuevoEstado }).eq('id', id);
      cargarDatos();
    } catch (err) {
      console.error('Error al actualizar ticket:', err);
    }
  };

  // Agrupar catÃ¡logo por categorÃ­a
  const categorias = catalogo.reduce<Record<string, any[]>>((acc, e) => {
    if (!acc[e.categoria]) acc[e.categoria] = [];
    acc[e.categoria].push(e);
    return acc;
  }, {});

  const esAdmin = rol === 'ADMIN';
  const ticketsVisibles = esAdmin ? tickets : tickets.filter((t: any) => t.usuario_id === uid);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#374151', margin: 0 }}>Tickets de Soporte</h3>
          <p style={{ fontSize: 13, color: '#6B7280', margin: '4px 0 0' }}>
            {esAdmin ? 'Gestiona los tickets de los usuarios' : 'Selecciona el error que describes y envÃ­alo'}
          </p>
        </div>
        {(
          <button onClick={() => setFormVisible(!formVisible)}
            style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: formVisible ? '#EF4444' : '#2563EB', color: '#FFF', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            {formVisible ? 'Cancelar' : '+ Nuevo ticket'}
          </button>
        )}
      </div>

      {/* Formulario con selecciÃ³n de error del catÃ¡logo */}
      {formVisible && (
        <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 12 }}>Selecciona el tipo de error:</p>

          {/* Filtro de categorÃ­as */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
            <button onClick={() => setCategoriaFiltro(null)}
              style={{ padding: '4px 12px', borderRadius: 12, border: '1px solid #D1D5DB', background: categoriaFiltro === null ? '#2563EB' : '#FFF', color: categoriaFiltro === null ? '#FFF' : '#6B7280', fontSize: 11, cursor: 'pointer' }}>
              Todas
            </button>
            {Object.keys(categorias).map(cat => (
              <button key={cat} onClick={() => setCategoriaFiltro(cat)}
                style={{ padding: '4px 12px', borderRadius: 12, border: '1px solid #D1D5DB', background: categoriaFiltro === cat ? '#2563EB' : '#FFF', color: categoriaFiltro === cat ? '#FFF' : '#6B7280', fontSize: 11, cursor: 'pointer' }}>
                {cat}
              </button>
            ))}
          </div>

          {/* Lista de errores */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
            {Object.entries(categorias)
              .filter(([cat]) => !categoriaFiltro || cat === categoriaFiltro)
              .map(([cat, items]) => (
                <div key={cat}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', margin: '0 0 6px', letterSpacing: '0.05em' }}>{cat}</p>
                  {items.map((err: any) => (
                    <button key={err.id} onClick={() => setErrorSeleccionado(err.id)}
                      style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', borderRadius: 8, border: `1px solid ${errorSeleccionado === err.id ? '#93C5FD' : '#E5E7EB'}`, background: errorSeleccionado === err.id ? '#EFF6FF' : '#FFF', cursor: 'pointer', fontSize: 13, color: '#374151', marginBottom: 4 }}>
                      <strong>{err.titulo}</strong>
                      {err.descripcion && <p style={{ fontSize: 12, color: '#6B7280', margin: '2px 0 0' }}>{err.descripcion}</p>}
                    </button>
                  ))}
                </div>
              ))}
          </div>

          {/* BotÃ³n enviar (aparece al seleccionar un error) */}
          {errorSeleccionado && (
            <button onClick={crearTicket}
              style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: '#059669', color: '#FFF', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 12 }}>
              Enviar ticket
            </button>
          )}
        </div>
      )}

      {/* Lista de tickets */}
      {cargando ? (
        <p style={{ color: '#9CA3AF', fontSize: 14, textAlign: 'center', padding: 32 }}>Cargando tickets...</p>
      ) : ticketsVisibles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, background: '#F9FAFB', borderRadius: 12 }}>
          <p style={{ fontSize: 32, margin: '0 0 8px' }}>ðŸŽ«</p>
          <p style={{ color: '#6B7280', fontSize: 14, margin: 0 }}>No hay tickets aÃºn</p>
          <p style={{ color: '#9CA3AF', fontSize: 13, marginTop: 4 }}>{esAdmin ? 'Los usuarios enviarÃ¡n tickets desde aquÃ­' : 'Selecciona un error de la lista y crea un ticket'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ticketsVisibles.map((ticket: any) => (
            <div key={ticket.id} style={{ border: '1px solid #E5E7EB', borderRadius: 10, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFF' }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 500, color: '#1F2937', margin: 0 }}>{ticket.titulo}</p>
                {ticket.descripcion && <p style={{ fontSize: 13, color: '#6B7280', margin: '4px 0 0' }}>{ticket.descripcion}</p>}
                <p style={{ fontSize: 11, color: '#9CA3AF', margin: '4px 0 0' }}>
                  {ticket.creado_en ? new Date(ticket.creado_en).toLocaleDateString() : ''}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                  background: ticket.estado === 'abierto' ? '#FEF3C7' : ticket.estado === 'resuelto' ? '#D1FAE5' : '#F3F4F6',
                  color: ticket.estado === 'abierto' ? '#92400E' : ticket.estado === 'resuelto' ? '#065F46' : '#374151' }}>
                  {ticket.estado}
                </span>
                {esAdmin && ticket.estado === 'abierto' && (
                  <button onClick={() => cambiarEstado(ticket.id, 'resuelto')}
                    style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: '#059669', color: '#FFF', fontSize: 11, cursor: 'pointer' }}>
                    Resolver
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AyudaPage;
