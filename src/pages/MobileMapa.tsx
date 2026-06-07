import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import { Map, Ticket, ClipboardList, ChevronRight, Loader } from 'lucide-react';
import MobileSwipeWrapper from '../components/MobileSwipeWrapper';
import { supabase } from '../lib/supabase';
import { tecnicoCache } from '../services/tecnicoCache';

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' as const } },
};

interface Props { idEstablecimiento: string }

interface Lugar { id: string; nombre: string; piso: number; zona: string; soporte?: boolean }
interface ReqPendiente { id: string; tipo_requerimiento: string; prioridad: string; created_at: string }

const ZONE_COLORS: Record<string, string> = {
  lab: '#0891b2', patio: '#4ade80', pasillo: '#64748b',
  admin: '#3b82f6', sala: '#8b5cf6', com: '#d97706',
  acceso: '#22c55e', park: '#78716c', internado: '#f43f5e',
  pie: '#a21caf', bib: '#0ea5e9', other: '#6366f1', empty: '#cbd5e1',
};

const ZONE_LABELS: Record<string, string> = {
  lab: 'Laboratorios', bib: 'Biblioteca', sala: 'Salas',
  admin: 'Administración', com: 'Comedor', patio: 'Patio',
  pasillo: 'Pasillo', acceso: 'Acceso', park: 'Estacionamiento',
  internado: 'Internado', pie: 'PIE', other: 'Equipo Mult.', empty: 'Sin uso',
};

const PISOS = [
  { valor: 0, label: 'Subterráneo' },
  { valor: 1, label: 'Piso 1' },
  { valor: 2, label: 'Piso 2' },
  { valor: 3, label: 'Piso 3' },
];

export default function MobileMapa({ idEstablecimiento }: Props) {
  const navigate = useNavigate();
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [cargando, setCargando] = useState(true);
  const [reqsPorLugar, setReqsPorLugar] = useState<Record<string, ReqPendiente[]>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [pisoActivo, setPisoActivo] = useState(0);

  useEffect(() => {
    if (!idEstablecimiento) return;
    setCargando(true);

    (async () => {
      // Cache primero
      const cached = await tecnicoCache.getAll(idEstablecimiento);
      if (cached?.lugares?.length) {
        setLugares(cached.lugares as Lugar[]);
        setCargando(false);
      }

      // Sync desde Supabase
      const { data } = await supabase.from('lugares').select('id,nombre,piso,zona,soporte')
        .eq('id_establecimiento', idEstablecimiento).eq('activo', true).order('nombre');
      if (!data) { setCargando(false); return; }
      setLugares(data as Lugar[]);
      const ids = data.map(l => l.id);
      if (ids.length === 0) { setCargando(false); return; }
      const { data: reqs } = await supabase.from('requerimientos')
        .select('id,tipo_requerimiento,prioridad,created_at,id_lugar')
        .in('id_lugar', ids).eq('activo', true)
        .neq('estado', 'Completada').neq('estado', 'Cancelada')
        .order('created_at', { ascending: false });
      if (reqs) {
        const agrupado: Record<string, ReqPendiente[]> = {};
        for (const r of reqs) {
          if (!agrupado[r.id_lugar]) agrupado[r.id_lugar] = [];
          agrupado[r.id_lugar].push(r);
        }
        setReqsPorLugar(agrupado);
      }
      setCargando(false);
    })();
  }, [idEstablecimiento]);

  const pendientes = (id: string) => reqsPorLugar[id] || [];
  const lugaresPorPiso = (piso: number) => lugares.filter(l => l.piso === piso);

  if (cargando) return <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}><Loader size={24} /></div>;

  return (
    <MobileSwipeWrapper>
    <div style={{ padding: '16px 0', maxWidth: 500, margin: '0 auto' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1A3C6B', margin: '0 0 4px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
        <Map size={20} /> Lugares
      </h1>

      <Swiper
        modules={[Pagination]}
        spaceBetween={0}
        slidesPerView={1}
        autoHeight={true}
        pagination={{ clickable: true }}
        onSlideChange={(s) => setPisoActivo(s.activeIndex)}
        style={{ padding: '0 4px 32px' }}
      >
        {PISOS.map((piso, idx) => {
          const lugaresFiltrados = lugaresPorPiso(piso.valor);
          return (
            <SwiperSlide key={piso.valor}>
              <div style={{ padding: '4px 12px' }}>
                <h2 style={{
                  fontSize: 15, fontWeight: 600, color: '#374151',
                  margin: '0 0 10px 4px', display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span style={{
                    display: 'inline-block', width: 8, height: 8, borderRadius: 4,
                    background: pisoActivo === idx ? '#1A3C6B' : '#D1D5DB',
                  }} />
                  {piso.label}
                  <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 400 }}>
                    ({lugaresFiltrados.length})
                  </span>
                </h2>

                <motion.div
                  initial="hidden" animate="visible"
                  variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
                >
                  {lugaresFiltrados.map(l => {
                    const pends = pendientes(l.id);
                    const sinSoporte = l.soporte === false;
                    return (
                      <motion.div
                        key={l.id}
                        variants={itemVariants}
                        layout
                        whileTap={sinSoporte ? {} : { scale: 0.98 }}
                        style={{
                          background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12,
                          overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                          opacity: sinSoporte ? 0.5 : 1,
                        }}
                      >
                        <div
                          onClick={() => { if (sinSoporte) return; setExpanded(expanded === l.id ? null : l.id); }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
                            cursor: sinSoporte ? 'default' : 'pointer',
                          }}
                        >
                          <span style={{
                            width: 10, height: 10, borderRadius: 3, flexShrink: 0,
                            background: ZONE_COLORS[l.zona] || '#6366f1',
                          }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: sinSoporte ? '#9CA3AF' : '#1F2937' }}>{l.nombre}</div>
                            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>
                              {ZONE_LABELS[l.zona] || l.zona}
                              {sinSoporte ? ' · 🔒 Sin soporte' : pends.length > 0 && ` · ${pends.length} pendiente${pends.length > 1 ? 's' : ''}`}
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
                            {sinSoporte ? (
                              <div style={{ padding: '10px', fontSize: 12, color: '#ef4444', textAlign: 'center', fontWeight: 500 }}>🔒 Lugar sin soporte activo</div>
                            ) : (<>
                            <motion.button
                              whileTap={{ scale: 0.95 }}
                              onClick={() => navigate(`/ticket?lugar=${l.id}`)}
                              style={{
                                width: '100%', padding: '10px', borderRadius: 8, border: 'none',
                                background: '#1e40af', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                              }}
                            >
                              <Ticket size={16} /> Hacer ticket
                            </motion.button>
                            {pends.length > 0 && (
                              <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate(`/tecnico/requerimientos?lugar=${l.id}`)}
                                style={{
                                  width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #D1D5DB',
                                  background: '#fff', color: '#374151', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                }}
                              >
                                <ClipboardList size={16} /> Ver {pends.length} ticket{pends.length > 1 ? 's' : ''} pendiente{pends.length > 1 ? 's' : ''}
                              </motion.button>
                            )}
                            {pends.length > 0 && (
                              <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {pends.slice(0, 3).map(r => (
                                  <div key={r.id} style={{
                                    padding: '6px 10px', background: '#F9FAFB', borderRadius: 6,
                                    border: '1px solid #F3F4F6', fontSize: 12,
                                  }}>
                                    <div style={{ fontWeight: 500, color: '#1F2937' }}>{r.tipo_requerimiento}</div>
                                    <div style={{ display: 'flex', gap: 6, color: '#9CA3AF', fontSize: 10, marginTop: 1 }}>
                                      <span>{r.prioridad}</span>
                                      <span>{new Date(r.created_at).toLocaleDateString('es-CL')}</span>
                                    </div>
                                  </div>
                                ))}
                                {pends.length > 3 && (
                                  <span style={{ fontSize: 11, color: '#3B82F6', textAlign: 'center' }}>
                                    +{pends.length - 3} más
                                  </span>
                                )}
                              </div>
                              )}
                            </>)}
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  })}
                  {lugaresFiltrados.length === 0 && (
                    <p style={{ textAlign: 'center', color: '#9CA3AF', padding: 24, fontSize: 13 }}>
                      Sin lugares en este piso
                    </p>
                  )}
                </motion.div>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
    </MobileSwipeWrapper>
  );
}
