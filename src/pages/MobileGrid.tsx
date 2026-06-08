import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Ticket, MapPin, Search, Plus, QrCode, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SalaData {
  left: number; top: number; width: number; height: number;
  text: string; zone: string; color: string | null;
}

type Planos = Record<string, SalaData[]>;

export default function MobileGrid({ idEstablecimiento }: { idEstablecimiento: string }) {
  const navigate = useNavigate();
  const [planos, setPlanos] = useState<Planos>({});
  const [pisos, setPisos] = useState<string[]>([]);
  const [pisoActivo, setPisoActivo] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [seleccionada, setSeleccionada] = useState<SalaData | null>(null);
  const [modo, setModo] = useState<'mapa' | 'buscar'>('mapa');
  const inputRef = useRef<HTMLInputElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const lugarMap = useRef<Record<string, string>>({});

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
    supabase.from('lugares').select('id, nombre').eq('id_establecimiento', idEstablecimiento).eq('activo', true)
      .then(({ data }) => {
        if (data) data.forEach(l => { lugarMap.current[l.nombre.toLowerCase().trim()] = l.id; });
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

  const maxX = salasVisibles.length > 0 ? Math.max(...salasVisibles.map(s => s.left + s.width)) : 100;
  const maxY = salasVisibles.length > 0 ? Math.max(...salasVisibles.map(s => s.top + s.height)) : 100;

  async function abrirTicket(sala: SalaData) {
    const key = sala.text.toLowerCase().trim();
    const foundId = lugarMap.current[key];
    if (foundId) {
      navigate('/ticket?lugar=' + foundId);
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

      {/* Floor tabs */}
      {pisos.length > 1 && (
        <div ref={tabsRef} style={{
          display: 'flex', gap: 6, overflowX: 'auto', padding: '8px 16px',
          background: '#1e293b', borderBottom: '1px solid #334155', flexShrink: 0,
          scrollbarWidth: 'none',
        }}>
          {pisos.map((piso, i) => (
            <button
              key={piso}
              onClick={() => { setPisoActivo(i); setFiltro(''); }}
              style={{
                padding: '5px 14px', borderRadius: 16, border: 'none', whiteSpace: 'nowrap',
                background: i === pisoActivo ? '#3b82f6' : '#0f172a',
                color: i === pisoActivo ? '#fff' : '#94a3b8',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0,
                transition: 'background .15s',
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
        <div style={{ flex: 1, overflow: 'auto', padding: '8px 16px 80px' }}>
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
        /* Map view */
        <div style={{ flex: 1, overflow: 'auto', padding: '8px 8px 80px' }}>
          <div style={{ position: 'relative', width: '100%', aspectRatio: `${maxX}/${maxY}`, minHeight: 200 }}>
            {salasVisibles.map((s, i) => {
              const bg = s.color || zoneBg[s.zone] || '#6366f1';
              const fontSize = Math.max(8, Math.min(11, s.width / s.text.length * 1.2));
              const showText = s.width > 20 && s.height > 16;
              return (
                <motion.div
                  key={i}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setSeleccionada(s)}
                  style={{
                    position: 'absolute',
                    left: `${(s.left / maxX) * 100}%`,
                    top: `${(s.top / maxY) * 100}%`,
                    width: `${(s.width / maxX) * 100}%`,
                    height: `${(s.height / maxY) * 100}%`,
                    background: bg,
                    borderRadius: 4,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,.08)',
                    boxSizing: 'border-box',
                  }}
                >
                  {showText && (
                    <span style={{
                      fontSize, fontWeight: 600, textAlign: 'center',
                      color: '#fff', lineHeight: 1.2, padding: 2,
                      textShadow: '0 1px 3px rgba(0,0,0,.6)',
                      wordBreak: 'break-word',
                    }}>
                      {s.text}
                    </span>
                  )}
                  {/* Status dot */}
                  <span style={{
                    position: 'absolute', top: 2, right: 2,
                    width: 6, height: 6, borderRadius: '50%',
                    background: '#22c55e',
                    boxShadow: '0 0 4px rgba(34,197,94,.6)',
                  }} />
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* FAB */}
      <div style={{ position: 'fixed', bottom: 24, right: 20, display: 'flex', gap: 12, zIndex: 50 }}>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/tecnico/m/equipos')}
          style={{
            width: 52, height: 52, borderRadius: '50%', border: 'none',
            background: '#1e293b', color: '#94a3b8', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,.3)',
          }}
        >
          <QrCode size={22} />
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/tecnico/m/equipos?nuevo=true')}
          style={{
            width: 56, height: 56, borderRadius: '50%', border: 'none',
            background: '#3b82f6', color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(59,130,246,.4)',
          }}
        >
          <Plus size={26} />
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
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{seleccionada.text}</div>
                  <div style={{ fontSize: 13, color: '#94a3b8' }}>
                    {seleccionada.zone.replace('z-', '')} · {pisos[pisoActivo]}
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
