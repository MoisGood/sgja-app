// src/pages/AyudaProfesor.tsx
// Página de ayuda específica para el rol PROFESOR (móvil-first)

import { useState, useEffect, useRef } from 'react';
import { ayudaService } from '../services/ayuda.service';
import { SistemaTickets } from './AyudaPage';

const ROL = 'PROFESOR';

interface FaqItem { titulo: string; contenido: string }

const FALLBACK_FAQ: { categoria: string; items: FaqItem[] }[] = [
  { categoria: 'Crear pase', items: [
    { titulo: '¿Cómo registro ausentes?', contenido: 'Entra a Gestión de Pases. Paso 1: elige el curso y el bloque (se detecta el bloque actual automáticamente). Paso 2: toca las tarjetas para marcar a los ausentes y pulsa "Registrar ausentes".' },
    { titulo: '¿Qué significan los colores de las tarjetas?', contenido: 'Verde = presente. Amarillo = atraso. Rojo = inasistencia. Cada toque cambia el estado en ese orden.' },
    { titulo: '¿Puedo marcar a un estudiante en más de un bloque?', contenido: 'Sí. Mantén presionada la tarjeta del estudiante para marcarlo y extenderlo a los bloques siguientes.' },
  ]},
  { categoria: 'Justificaciones', items: [
    { titulo: '¿Cómo sé si justificaron a un estudiante?', contenido: 'La tarjeta se pone gris y muestra el sello azul "JUSTIFICADO". El inspector o paradocente la marca cuando presenta el motivo o documento.' },
    { titulo: '¿Cada cuánto se actualiza la pantalla?', contenido: 'Solo no esperes: la lista se refresca automáticamente cada 10 segundos, al volver a la app desde segundo plano y con el botón "Actualizar".' },
    { titulo: '¿Qué estados puede tener un pase?', contenido: 'Sin procesar (amarillo/rojo), Justificado (gris con sello azul), Injustificado, Rechazado y Anulado.' },
  ]},
  { categoria: 'Pases registrados', items: [
    { titulo: '¿Cómo anulo un pase?', contenido: 'Ve a la pestaña "Ver Pases", busca el pase y pulsa "Anular". Solo puedes anular pases tuyos que aún no estén justificados.' },
    { titulo: '¿Cómo filtro mis pases?', contenido: 'En "Ver Pases" puedes filtrar por curso, tipo (atraso/inasistencia), fecha y estado.' },
  ]},
  { categoria: 'Mi cuenta', items: [
    { titulo: '¿Qué hago si no tengo conexión?', contenido: 'La app guarda los datos en tu dispositivo. Al recuperar la conexión sincroniza automáticamente lo pendiente.' },
  ]},
];

const AyudaProfesor = () => {
  const [busqueda, setBusqueda] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState<string | null>(null);
  const [pestana, setPestana] = useState<'ayuda' | 'tickets'>('ayuda');
  const [faqs, setFaqs] = useState<{ categoria: string; items: FaqItem[] }[]>(FALLBACK_FAQ);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ayudaService.getFAQs().then(data => {
      const delRol = (data as Array<{ rol?: string[]; categoria: string; titulo: string; contenido: string; activo?: boolean }>)
        .filter(f => f.activo !== false && (!f.rol || f.rol.length === 0 || f.rol.includes(ROL)));
      if (delRol.length > 0) {
        const grouped = delRol.reduce<Record<string, FaqItem[]>>((acc, f) => {
          if (!acc[f.categoria]) acc[f.categoria] = [];
          acc[f.categoria].push({ titulo: f.titulo, contenido: f.contenido });
          return acc;
        }, {});
        setFaqs(Object.entries(grouped).map(([categoria, items]) => ({ categoria, items })));
      }
    });
  }, []);

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
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 16px 48px', fontFamily: 'Arial, sans-serif' }}>
      {/* Encabezado */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="24" height="24" fill="none" stroke="#FFF" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1A3C6B', margin: 0 }}>Ayuda para Profesores</h1>
          <p style={{ fontSize: 13, color: '#6B7280', margin: '4px 0 0' }}>Registrar pases, justificados y más</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #E5E7EB', marginBottom: 20 }}>
        <TabButton activo={pestana === 'ayuda'} onClick={() => setPestana('ayuda')}>Guía y Preguntas</TabButton>
        <TabButton activo={pestana === 'tickets'} onClick={() => setPestana('tickets')}>Tickets de Soporte</TabButton>
      </div>

      {pestana === 'ayuda' && (
        <>
          {/* Guía paso a paso */}
          {!busqueda && !categoriaActiva && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              <SeccionTitulo color="#2563EB">📝 Registrar ausentes paso a paso</SeccionTitulo>
              <GuiaPaso num={1} titulo="Selecciona curso y bloque">
                En <strong>Gestión de Pases</strong>, Paso 1: elige el curso y el bloque. El sistema detecta el bloque actual según la hora.
              </GuiaPaso>
              <GuiaPaso num={2} titulo="Marca a los ausentes">
                Toca cada tarjeta para cambiar su estado: <Punto color="#34D399">presente</Punto> → <Punto color="#FCD34D">atraso</Punto> → <Punto color="#FCA5A5">inasistencia</Punto>. Mantén presionada una tarjeta para marcarla también en los bloques siguientes.
              </GuiaPaso>
              <GuiaPaso num={3} titulo="Registrar ausentes">
                Pulsa el botón <strong>Registrar ausentes</strong>. Los pases quedan guardados y el inspector los ve al instante para justificar.
              </GuiaPaso>

              <SeccionTitulo color="#059669">✅ Justificaciones en tiempo real</SeccionTitulo>
              <div style={estiloTarjeta}>
                <p style={estiloParrafo}>
                  Cuando el inspector o paradocente justifica a un estudiante, su tarjeta cambia automáticamente a gris con el sello <EstiloJustificado>JUSTIFICADO</EstiloJustificado>.
                </p>
                <p style={estiloParrafo}>
                  La pantalla se actualiza sola cada ~10 segundos, al volver a la app desde segundo plano, o con el botón <b>🔄 Actualizar</b>.
                </p>
              </div>

              <SeccionTitulo color="#DC2626">🗑️ Anular un pase</SeccionTitulo>
              <div style={estiloTarjeta}>
                <p style={estiloParrafo}>
                  Ve a <strong>Ver Pases</strong>, busca el pase y pulsa <strong>Anular</strong>. Solo puedes anular pases propios que aún no estén justificados.
                </p>
              </div>
            </div>
          )}

          {/* Buscador */}
          <div style={{ position: 'relative', marginBottom: 20 }}>
            <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} width="16" height="16" fill="none" stroke="#9CA3AF" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input ref={inputRef} type="text" placeholder="Buscar en la ayuda..." value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); setCategoriaActiva(null); }}
              style={{ width: '100%', padding: '12px 16px 12px 42px', border: '1px solid #D1D5DB', borderRadius: 10, fontSize: 15, outline: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
            />
          </div>

          {!busqueda && !categoriaActiva && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
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
            <div style={{ marginBottom: 14, fontSize: 13, color: '#6B7280' }}>
              <span style={{ color: '#2563EB', cursor: 'pointer' }} onClick={() => setCategoriaActiva(null)}>Todas las categorías</span>
              <span style={{ margin: '0 8px' }}>/</span>
              <span style={{ fontWeight: 600, color: '#374151' }}>{categoriaActiva}</span>
            </div>
          )}

          {categoriasVisibles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>🔍</div>
              <p style={{ color: '#6B7280', fontSize: 15 }}>No encontramos resultados para <strong>&quot;{busqueda}&quot;</strong></p>
              <p style={{ color: '#9CA3AF', fontSize: 13, marginTop: 4 }}>Prueba con otras palabras clave</p>
            </div>
          ) : (
            categoriasVisibles.map((cat, idx) => (
              <div key={cat.categoria} style={idx > 0 ? { marginTop: 24 } : {}}>
                <SeccionTitulo color="#2563EB">{cat.categoria}</SeccionTitulo>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {cat.items.map((item, i) => (
                    <FaqCard key={i} titulo={item.titulo} contenido={item.contenido} />
                  ))}
                </div>
              </div>
            ))
          )}
        </>
      )}

      {pestana === 'tickets' && <SistemaTickets />}
    </div>
  );
};

// =============== COMPONENTES PEQUEÑOS ===============
const TabButton = ({ activo, onClick, children }: { activo: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button onClick={onClick}
    style={{ padding: '10px 20px', border: 'none', background: 'none', color: activo ? '#2563EB' : '#6B7280', fontWeight: activo ? 600 : 400, fontSize: 14, cursor: 'pointer', borderBottom: activo ? '2px solid #2563EB' : '2px solid transparent', marginBottom: -2, transition: 'all 0.15s' }}>
    {children}
  </button>
);

const SeccionTitulo = ({ color, children }: { color: string; children: React.ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
    <span style={{ display: 'inline-block', width: 3, height: 18, background: color, borderRadius: 2 }} />
    <h3 style={{ fontSize: 13, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{children}</h3>
  </div>
);

const GuiaPaso = ({ num, titulo, children }: { num: number; titulo: string; children: React.ReactNode }) => (
  <div style={estiloTarjeta}>
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#2563EB', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>{num}</div>
      <div>
        <p style={{ margin: '2px 0 6px', fontSize: 14, fontWeight: 600, color: '#1F2937' }}>{titulo}</p>
        <p style={{ margin: 0, fontSize: 13, color: '#4B5563', lineHeight: 1.55 }}>{children}</p>
      </div>
    </div>
  </div>
);

const Punto = ({ color, children }: { color: string; children: React.ReactNode }) => (
  <span style={{ display: 'inline-block', padding: '1px 8px', borderRadius: 10, background: color, color: color === '#FCD34D' ? '#92400E' : '#1F2937', fontSize: 11, fontWeight: 600, verticalAlign: 'middle' }}>{children}</span>
);

const EstiloJustificado = ({ children }: { children: React.ReactNode }) => (
  <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 4, background: '#2563EB', color: '#FFF', fontSize: 11, fontWeight: 700, letterSpacing: '0.03em', transform: 'rotate(-3deg)', verticalAlign: 'middle' }}>{children}</span>
);

const estiloTarjeta: React.CSSProperties = {
  background: '#FFF',
  border: '1px solid #E5E7EB',
  borderRadius: 12,
  padding: '16px',
  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
};

const estiloParrafo: React.CSSProperties = {
  margin: '0 0 8px',
  fontSize: 13,
  color: '#4B5563',
  lineHeight: 1.55,
};

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

export default AyudaProfesor;
