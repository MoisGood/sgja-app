import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Ticket, MapPin, Search, Plus, QrCode } from 'lucide-react';

interface SalaData {
  left: number; top: number; width: number; height: number;
  text: string; zone: string; color: string | null;
}

export default function MobileGrid({ idEstablecimiento: _idEstablecimiento }: { idEstablecimiento: string }) {
  const navigate = useNavigate();
  const [salas, setSalas] = useState<SalaData[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [seleccionada, setSeleccionada] = useState<SalaData | null>(null);
  const [modo, setModo] = useState<'grid' | 'buscar'>('grid');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/plano_edificio.json')
      .then(r => { if (!r.ok) throw new Error('No hay plano'); return r.json(); })
      .then((data: SalaData[]) => { setSalas(data); setCargando(false); })
      .catch(() => { setCargando(false); });
  }, []);

  useEffect(() => {
    if (modo === 'buscar' && inputRef.current) inputRef.current.focus();
  }, [modo]);

  const zoneBg: Record<string, string> = {
    'z-lab':'#0891b2','z-bib':'#0ea5e9','z-sala':'#8b5cf6','z-admin':'#3b82f6',
    'z-com':'#d97706','z-patio':'#4ade80','z-pasillo':'#64748b','z-acceso':'#22c55e',
    'z-park':'#78716c','z-internado':'#f43f5e','z-pie':'#a21caf','z-other':'#6366f1','z-empty':'#334155',
  };

  const filtradas = filtro
    ? salas.filter(s => s.text.toLowerCase().includes(filtro.toLowerCase()))
    : salas;

  const maxW = Math.max(...salas.map(s => s.left + s.width), 100);
  const cols = Math.ceil(maxW / 100);

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#0f172a', color: '#f1f5f9', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', background: '#1e293b', borderBottom: '1px solid #334155',
        flexShrink: 0,
      }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 22, cursor: 'pointer', padding: 4 }}>←</button>
        <span style={{ fontSize: 15, fontWeight: 600 }}>Mapa</span>
        <button onClick={() => setModo(modo === 'buscar' ? 'grid' : 'buscar')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}>
          {modo === 'buscar' ? <X size={20} /> : <Search size={20} />}
        </button>
      </div>

      {/* Search bar */}
      <AnimatePresence>
        {modo === 'buscar' && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden', flexShrink: 0 }}>
            <div style={{ padding: '8px 16px', background: '#1e293b' }}>
              <input
                ref={inputRef}
                value={filtro}
                onChange={e => setFiltro(e.target.value)}
                placeholder="Buscar lugar..."
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #475569',
                  background: '#0f172a', color: '#f1f5f9', fontSize: 14, outline: 'none',
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid */}
      <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
        {cargando ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Cargando...</div>
        ) : filtradas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
            {filtro ? 'Sin resultados' : 'Carga un JSON desde el editor'}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.min(cols, 4)}, 1fr)`,
            gap: 8,
          }}>
            {filtradas.map((s, i) => {
              const bg = s.color || zoneBg[s.zone] || '#6366f1';
              const spanCol = Math.max(1, Math.round(s.width / 100));
              const spanRow = Math.max(1, Math.round(s.height / 100));
              return (
                <motion.div
                  key={i}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSeleccionada(s)}
                  style={{
                    background: bg, borderRadius: 10, padding: '16px 10px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', cursor: 'pointer', minHeight: 80,
                    gridColumn: `span ${Math.min(spanCol, 4)}`,
                    gridRow: `span ${Math.min(spanRow, 2)}`,
                    position: 'relative', overflow: 'hidden',
                  }}
                >
                  <span style={{
                    fontSize: 12, fontWeight: 600, textAlign: 'center',
                    textShadow: '0 1px 3px rgba(0,0,0,.5)', wordBreak: 'break-word',
                  }}>{s.text}</span>
                  <span style={{
                    position: 'absolute', top: 6, right: 6,
                    width: 10, height: 10, borderRadius: '50%',
                    background: '#22c55e', boxShadow: '0 0 6px rgba(34,197,94,.5)',
                  }} />
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

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
                  <div style={{ fontSize: 13, color: '#94a3b8' }}>{seleccionada.zone}</div>
                </div>
              </div>

              <button onClick={() => { setSeleccionada(null); navigate('/tecnico/m/equipos?lugar=' + encodeURIComponent(seleccionada.text)); }}
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
