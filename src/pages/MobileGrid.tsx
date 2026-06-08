import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Ticket, MapPin, Search, Plus, QrCode, Loader, CheckCircle, AlertTriangle } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { SwiperClass } from 'swiper/react';
import 'swiper/css';
import { supabase } from '../lib/supabase';

interface SalaData {
  left: number; top: number; width: number; height: number;
  text: string; zone: string; color: string | null;
}

interface LugarDB { id: string; nombre: string; zona: string; piso: number }

type Planos = Record<string, SalaData[]>;

export default function MobileGrid({ idEstablecimiento }: { idEstablecimiento: string }) {
  const navigate = useNavigate();
  const swiperRef = useRef<SwiperClass | null>(null);
  const [planos, setPlanos] = useState<Planos>({});
  const [pisos, setPisos] = useState<string[]>([]);
  const [pisoActivo, setPisoActivo] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [seleccionada, setSeleccionada] = useState<SalaData | null>(null);
  const [modo, setModo] = useState<'mapa' | 'buscar'>('mapa');
  const inputRef = useRef<HTMLInputElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const lugarMap = useRef<Record<string, LugarDB>>({});

  useEffect(() => {
    fetch('/plano_edificio.json')
      .then(r => { if (!r.ok) throw new Error('No hay plano'); return r.json(); })
      .then((data: Planos | SalaData[]) => {
        if (Array.isArray(data)) {
          setPlanos({ 'Piso 1': data });
          setPisos(['Piso 1']);
        } else {
          setPlanos(data);
          setPisos(Object.keys(data));
        }
        setCargando(false);
      })
      .catch(() => setCargando(false));
  }, []);

  useEffect(() => {
    if (!idEstablecimiento) return;
    supabase.from('lugares').select('id, nombre, zona, piso').eq('id_establecimiento', idEstablecimiento).eq('activo', true)
      .then(({ data }) => {
        if (data) data.forEach(l => { lugarMap.current[l.nombre.toLowerCase().trim()] = l as LugarDB; });
      });
  }, [idEstablecimiento]);

  useEffect(() => {
    if (modo === 'buscar' && inputRef.current) inputRef.current.focus();
  }, [modo]);

  const zoneBg: Record<string, string> = {
    'z-lab':'#0891b2','z-bib':'#0ea5e9','z-sala':'#8b5cf6','z-admin':'#3b82f6',
    'z-com':'#d97706','z-patio':'#4ade80','z-pasillo':'#64748b','z-acceso':'#22c55e',
    'z-park':'#78716c','z-internado':'#f43f5e','z-pie':'#a21caf','z-other':'#6366f1','z-empty':'#334155',
  };

  const salasActuales = planos[pisos[pisoActivo]] || [];
  const salasVisibles = modo === 'buscar' && filtro
    ? salasActuales.filter(s => s.text.toLowerCase().includes(filtro.toLowerCase()))
    : salasActuales;

  async function abrirTicket(sala: SalaData) {
    const key = sala.text.toLowerCase().trim();
    const found = lugarMap.current[key];
    if (found) {
      navigate('/ticket?lugar=' + found.id);
      return;
    }
    const { data } = await supabase
      .from('lugares').select('id').eq('id_establecimiento', idEstablecimiento)
      .ilike('nombre', sala.text.trim()).eq('activo', true).limit(1).maybeSingle();
    if (data) {
      navigate('/ticket?lugar=' + data.id);
    } else {
      navigate('/ticket?lugar_nombre=' + encodeURIComponent(sala.text));
    }
  }

  function lugarDB(sala: SalaData): LugarDB | null {
    return lugarMap.current[sala.text.toLowerCase().trim()] || null;
  }

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#0f172a', color: '#f1f5f9', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px', background: '#1e293b', borderBottom: '1px solid #334155',
        flexShrink: 0,
      }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 22, cursor: 'pointer', padding: 4, lineHeight: 1 }}>←</button>
        <span style={{ fontSize: 15, fontWeight: 600 }}>Mapa</span>
        <button onClick={() => setModo(modo === 'buscar' ? 'mapa' : 'buscar')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4, lineHeight: 1 }}>
          {modo === 'buscar' ? <X size={20} /> : <Search size={20} />}
        </button>
      </div>

      {/* Floor slider */}
      {pisos.length > 1 && (
        <div ref={tabsRef} style={{
          display: 'flex', gap: 4, overflowX: 'auto', padding: '6px 12px',
          background: '#1e293b', borderBottom: '1px solid #334155', flexShrink: 0,
          scrollbarWidth: 'none', justifyContent: 'center',
        }}>
          {pisos.map((piso, i) => (
            <button
              key={piso}
              onClick={() => { swiperRef.current?.slideTo(i); setFiltro(''); }}
              style={{
                padding: '5px 10px', borderRadius: 12, border: 'none', whiteSpace: 'nowrap',
                background: i === pisoActivo ? '#3b82f6' : '#0f172a',
                color: i === pisoActivo ? '#fff' : '#94a3b8',
                fontSize: 11, fontWeight: 600, cursor: 'pointer', flex: '1 0 auto', maxWidth: 100,
                transition: 'background .15s', opacity: i === pisoActivo ? 1 : 0.6,
              }}
            >
              {piso}
            </button>
          ))}
        </div>
      )}

      {/* Search bar */}
      <AnimatePresence>
        {modo === 'buscar' && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden', flexShrink: 0 }}>
            <div style={{ padding: '6px 16px', background: '#1e293b' }}>
              <input
                ref={inputRef}
                value={filtro}
                onChange={e => setFiltro(e.target.value)}
                placeholder="Buscar lugar..."
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #475569',
                  background: '#0f172a', color: '#f1f5f9', fontSize: 14, outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      {cargando ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Loader size={24} className="animate-spin" style={{ color: '#64748b' }} />
        </div>
      ) : salasVisibles.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: 14 }}>
          {filtro ? 'Sin resultados' : (pisos.length === 0 ? 'Carga un JSON desde el editor' : 'Este piso no tiene salas')}
        </div>
      ) : modo === 'buscar' && filtro ? (
        /* Search results as list */
        <div style={{ flex: 1, overflow: 'auto', padding: '8px 16px calc(80px + env(safe-area-inset-bottom, 0px))' }}>
          {salasVisibles.map((s, i) => (
            <motion.div
              key={i}
              whileTap={{ scale: 0.98 }}
              onClick={() => { setSeleccionada(s); setFiltro(''); setModo('mapa'); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 8, marginBottom: 6,
                background: s.color || zoneBg[s.zone] || '#334155', cursor: 'pointer',
              }}
            >
              <MapPin size={16} color="#fff" />
              <span style={{ fontSize: 13, fontWeight: 500 }}>{s.text}</span>
              <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,.5)', fontSize: 10 }}>{pisos[pisoActivo]}</span>
            </motion.div>
          ))}
        </div>
      ) : (
        /* Map view with Swiper */
        <Swiper
          onSwiper={(s) => { swiperRef.current = s; }}
          onSlideChange={(s) => { setPisoActivo(s.activeIndex); setFiltro(''); }}
          initialSlide={pisoActivo}
          spaceBetween={0}
          slidesPerView={1}
          style={{ flex: 1, overflow: 'hidden' }}
        >
          {pisos.map(piso => {
            const salas = planos[piso] || [];
            const mX = salas.length > 0 ? Math.max(...salas.map(s => s.left + s.width)) : 100;
            const mY = salas.length > 0 ? Math.max(...salas.map(s => s.top + s.height)) : 100;
            return (
              <SwiperSlide key={piso}>
                <div style={{ height: '100%', overflow: 'auto', padding: '6px 6px calc(80px + env(safe-area-inset-bottom, 0px))' }}>
                  <div style={{ position: 'relative', width: '100%', aspectRatio: `${mX}/${mY}`, minHeight: 180 }}>
                    {salas.map((s, i) => {
                      const bg = s.color || zoneBg[s.zone] || '#6366f1';
                      const fontSize = Math.max(7, Math.min(10, s.width / s.text.length * 1.1));
                      const showText = s.width > 18 && s.height > 14;
                      return (
                        <motion.div
                          key={i}
                          whileTap={{ scale: 0.92 }}
                          onClick={() => setSeleccionada(s)}
                          style={{
                            position: 'absolute',
                            left: `${(s.left / mX) * 100}%`,
                            top: `${(s.top / mY) * 100}%`,
                            width: `${(s.width / mX) * 100}%`,
                            height: `${(s.height / mY) * 100}%`,
                            background: bg,
                            borderRadius: 3,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', overflow: 'hidden',
                            border: '1px solid rgba(255,255,255,.08)',
                            boxSizing: 'border-box',
                          }}
                        >
                          {showText && (
                            <span style={{
                              fontSize, fontWeight: 600, textAlign: 'center',
                              color: '#fff', lineHeight: 1.15, padding: 1,
                              textShadow: '0 1px 3px rgba(0,0,0,.6)',
                              wordBreak: 'break-word',
                            }}>
                              {s.text}
                            </span>
                          )}
                          <span style={{
                            position: 'absolute', top: 1, right: 1,
                            width: 5, height: 5, borderRadius: '50%',
                            background: '#22c55e',
                            boxShadow: '0 0 3px rgba(34,197,94,.6)',
                          }} />
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>
      )}

      {/* FAB */}
      <div style={{ position: 'fixed', bottom: `calc(16px + env(safe-area-inset-bottom, 0px))`, right: 16, display: 'flex', gap: 10, zIndex: 50 }}>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/tecnico/m/equipos')}
          style={{
            width: 48, height: 48, borderRadius: '50%', border: 'none',
            background: '#1e293b', color: '#94a3b8', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,.3)',
          }}
        >
          <QrCode size={20} />
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/tecnico/m/equipos?nuevo=true')}
          style={{
            width: 52, height: 52, borderRadius: '50%', border: 'none',
            background: '#3b82f6', color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(59,130,246,.4)',
          }}
        >
          <Plus size={24} />
        </motion.button>
      </div>

      {/* Bottom sheet */}
      <AnimatePresence>
        {seleccionada && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSeleccionada(null)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 100 }} />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{
                position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 101,
                background: '#1e293b', borderRadius: '16px 16px 0 0', padding: '20px 24px 32px',
              }}
            >
              <div style={{ width: 40, height: 4, background: '#475569', borderRadius: 2, margin: '0 auto 16px' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 10,
                  background: seleccionada.color || zoneBg[seleccionada.zone] || '#6366f1',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <MapPin size={22} color="#fff" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {seleccionada.text}
                    {lugarDB(seleccionada) && <span title="Existe en DB"><CheckCircle size={16} color="#22c55e" /></span>}
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    {seleccionada.zone.replace('z-', '')} · {pisos[pisoActivo]}
                    {(() => {
                      const db = lugarDB(seleccionada);
                      if (db && db.zona !== seleccionada.zone) return <><span style={{ color: '#475569' }}>|</span><span title={`DB: ${db.zona}`}><AlertTriangle size={12} color="#f59e0b" /></span></>;
                      if (!db) return <><span style={{ color: '#475569' }}>|</span><span title="No está en DB"><AlertTriangle size={12} color="#ef4444" /></span></>;
                      return null;
                    })()}
                  </div>
                </div>
              </div>

              <button
                onClick={() => { const s = seleccionada; setSeleccionada(null); abrirTicket(s); }}
                style={{
                  width: '100%', padding: '14px', borderRadius: 10, border: 'none',
                  background: '#3b82f6', color: '#fff', fontSize: 15, fontWeight: 600,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10,
                }}>
                <Ticket size={18} /> Abrir ticket
              </button>
              <button onClick={() => setSeleccionada(null)}
                style={{
                  width: '100%', padding: '14px', borderRadius: 10, border: '1px solid #475569',
                  background: 'transparent', color: '#94a3b8', fontSize: 15, fontWeight: 500,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                <MapPin size={18} /> Datos del lugar
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
