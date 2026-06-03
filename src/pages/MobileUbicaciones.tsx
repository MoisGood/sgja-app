import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, ChevronRight, Loader } from 'lucide-react';
import MobileSwipeWrapper from '../components/MobileSwipeWrapper';
import { supabase } from '../lib/supabase';

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' as const } },
};

interface Props { idEstablecimiento: string }

interface LugarConUbis {
  id: string; nombre: string; piso: number; zona: string;
  dispositivos: { id: string; dispositivo_nombre: string; cantidad: number }[];
}

const irA = (ruta: string) => { window.location.hash = ruta };

export default function MobileUbicaciones({ idEstablecimiento }: Props) {
  const [lugares, setLugares] = useState<LugarConUbis[]>([]);
  const [cargando, setCargando] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!idEstablecimiento) return;
    setCargando(true);
    (async () => {
      const [lugRes, ubiRes] = await Promise.all([
        supabase.from('lugares').select('id,nombre,piso,zona')
          .eq('id_establecimiento', idEstablecimiento).eq('activo', true).order('nombre'),
        supabase.from('ubicaciones').select('id,id_lugar,dispositivo_nombre,cantidad')
          .eq('activo', true).order('dispositivo_nombre'),
      ]);
      if (lugRes.data && ubiRes.data) {
        const map = new Map<string, LugarConUbis>();
        for (const l of lugRes.data) map.set(l.id, { ...l, dispositivos: [] });
        for (const u of ubiRes.data) {
          const l = map.get(u.id_lugar);
          if (l) l.dispositivos.push(u);
        }
        setLugares(Array.from(map.values()));
      }
      setCargando(false);
    })();
  }, [idEstablecimiento]);

  if (cargando) return <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}><Loader size={24} /></div>;

  return (
    <MobileSwipeWrapper>
    <div style={{ padding: 16, maxWidth: 500, margin: '0 auto' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1A3C6B', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
        <MapPin size={20} /> Ubicaciones
      </h1>

      <motion.div
        initial="hidden" animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
        style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
      >
        {lugares.map(l => (
          <motion.div
            key={l.id}
            variants={itemVariants}
            layout
            whileTap={{ scale: 0.98 }}
            style={{
              background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12,
              overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <div
              onClick={() => setExpanded(expanded === l.id ? null : l.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
                cursor: 'pointer',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1F2937' }}>{l.nombre}</div>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>
                  Piso {l.piso} · {l.dispositivos.length} dispositivo{l.dispositivos.length !== 1 ? 's' : ''}
                </div>
              </div>
              <motion.span
                animate={{ rotate: expanded === l.id ? 90 : 0 }}
                transition={{ duration: 0.15 }}
                style={{ color: '#D1D5DB', flexShrink: 0, display: 'flex' }}
              ><ChevronRight size={16} /></motion.span>
            </div>

            {expanded === l.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                style={{ padding: '0 14px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}
              >
                {l.dispositivos.length === 0 ? (
                  <p style={{ fontSize: 12, color: '#9CA3AF', padding: '8px 0' }}>Sin dispositivos asignados</p>
                ) : (
                  l.dispositivos.map(d => (
                    <div key={d.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '8px 10px', background: '#F9FAFB', borderRadius: 8,
                      border: '1px solid #F3F4F6',
                    }}>
                      <span style={{ fontSize: 13, color: '#1F2937', fontWeight: 500 }}>{d.dispositivo_nombre}</span>
                      <span style={{ fontSize: 12, color: '#6B7280' }}>×{d.cantidad}</span>
                    </div>
                  ))
                )}
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => irA(`/tecnico/ubicaciones`)} style={{
                  width: '100%', padding: '8px', borderRadius: 8, border: '1px solid #D1D5DB',
                  background: '#fff', color: '#374151', fontSize: 12, cursor: 'pointer', marginTop: 4,
                }}>
                  Gestionar en escritorio →
                </motion.button>
              </motion.div>
            )}
          </motion.div>
        ))}
        {lugares.length === 0 && (
          <p style={{ textAlign: 'center', color: '#9CA3AF', padding: 24 }}>Sin ubicaciones registradas</p>
        )}
      </motion.div>
    </div>
    </MobileSwipeWrapper>
  );
}
