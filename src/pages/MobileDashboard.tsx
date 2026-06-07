import { useEffect, useState, type JSX } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import { RefreshCw, Clock, AlertCircle, ClipboardList, Ticket, List, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { tecnicoCache } from '../services/tecnicoCache';

interface Props { idEstablecimiento: string }

const ESTILOS_CARRUSEL: Record<string, { bg: string; icono: JSX.Element; label: string }> = {
  'En Proceso': { bg: '#dbeafe', icono: <RefreshCw size={28} />, label: 'En Proceso' },
  Pendiente: { bg: '#fef3c7', icono: <Clock size={28} />, label: 'Pendientes' },
  Urgente: { bg: '#fee2e2', icono: <AlertCircle size={28} />, label: 'Urgentes' },
};

interface HistoryItem {
  id: string; tipo_requerimiento: string; prioridad: string;
  estado: string; descripcion: string; created_at: string; lugar_nombre?: string;
}

export default function MobileDashboard({ idEstablecimiento }: Props) {
  const navigate = useNavigate();
  const [resumen, setResumen] = useState<{ estado: string; count: number }[]>([]);
  const [hoy, setHoy] = useState<HistoryItem[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!idEstablecimiento) return;

    let activo = true;

    (async () => {
      // 1. Prefetch datos estáticos en background (actualiza cache offline)
      tecnicoCache.prefetch(idEstablecimiento).catch(() => {});

      // 3. Fetch datos dinámicos siempre desde Supabase
      try {
        const [enProceso, pendientes, urgentes, hoyRes] = await Promise.all([
          supabase.from('requerimientos')
            .select('estado', { count: 'exact', head: true })
            .eq('id_establecimiento', idEstablecimiento).eq('activo', true)
            .eq('estado', 'En Proceso'),
          supabase.from('requerimientos')
            .select('estado', { count: 'exact', head: true })
            .eq('id_establecimiento', idEstablecimiento).eq('activo', true)
            .eq('estado', 'Pendiente'),
          supabase.from('requerimientos')
            .select('estado', { count: 'exact', head: true })
            .eq('id_establecimiento', idEstablecimiento).eq('activo', true)
            .eq('prioridad', 'Urgente')
            .not('estado', 'in', '("Completada","Cancelada")'),
          supabase.from('requerimientos')
            .select('id,tipo_requerimiento,descripcion,estado,prioridad,created_at,lugares(nombre)')
            .eq('id_establecimiento', idEstablecimiento).eq('activo', true)
            .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
            .order('created_at', { ascending: false }).limit(10),
        ]);

        if (!activo) return;

        setResumen([
          { estado: 'En Proceso', count: enProceso.count ?? 0 },
          { estado: 'Pendiente', count: pendientes.count ?? 0 },
          { estado: 'Urgente', count: urgentes.count ?? 0 },
        ]);

        if (hoyRes.data) {
          const raw = hoyRes.data as (HistoryItem & { lugares?: { nombre: string }[] | null })[];
          const PRIORITY_ORDER: Record<string, number> = {
            Urgente: 0, Alta: 1, Normal: 2, Baja: 3,
          };
          const mapeados = raw.map(r => ({
            id: r.id, tipo_requerimiento: r.tipo_requerimiento,
            prioridad: r.prioridad, estado: r.estado,
            descripcion: r.descripcion, created_at: r.created_at,
            lugar_nombre: r.lugares?.[0]?.nombre,
          })).sort((a, b) => (PRIORITY_ORDER[a.prioridad] ?? 99) - (PRIORITY_ORDER[b.prioridad] ?? 99));
          setHoy(mapeados);
        }
      } catch {}

      if (activo) setCargando(false);
    })();

    return () => { activo = false; };
  }, [idEstablecimiento]);

  if (cargando) return <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}><Loader size={24} className="animate-spin" /></div>;

  return (
    <div style={{ padding: '16px 16px 72px', maxWidth: 500, margin: '0 auto' }}>
      <h2 style={{ fontSize: 14, fontWeight: 600, color: '#374151', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
        <RefreshCw size={16} />
        Actividades
      </h2>
      <Swiper
        spaceBetween={10}
        slidesPerView={1}
        style={{ padding: '0 0 16px' }}
      >
        {resumen.map(r => {
          const estilo = ESTILOS_CARRUSEL[r.estado] || { bg: '#f3f4f6', icono: <ClipboardList size={28} />, label: r.estado };
          return (
            <SwiperSlide key={r.estado}>
              <motion.div
                whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    if (r.estado === 'Urgente') navigate('/tecnico/requerimientos?prioridad=Urgente');
                    else navigate(`/tecnico/requerimientos?estado=${r.estado}`);
                  }}
                style={{
                  background: estilo.bg, borderRadius: 12, padding: '12px 20px',
                  cursor: 'pointer', textAlign: 'center',
                }}
              >
                <div style={{ color: '#1F2937' }}>{estilo.icono}</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: '#1F2937', margin: '2px 0' }}>{r.count}</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>{estilo.label}</div>
              </motion.div>
            </SwiperSlide>
          );
        })}
      </Swiper>

      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('/tecnico/m/mapa')}
        style={{
          width: '100%', padding: '12px', borderRadius: 10, border: 'none',
          background: '#1e40af', color: '#fff', fontSize: 14, fontWeight: 600,
          cursor: 'pointer', marginBottom: 16, display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 8,
        }}
      >
        <Ticket size={18} />
        Crear Ticket
      </motion.button>

      <div>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#374151', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <List size={16} />
          Historial de hoy
        </h2>
        {hoy.length === 0 ? (
          <p style={{ color: '#9CA3AF', fontSize: 13, padding: '8px 0' }}>Sin tickets hoy</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {hoy.map(r => {
              const colorEstado: Record<string, string> = {
                Pendiente: '#f59e0b', 'En Proceso': '#3b82f6',
                Completada: '#22c55e', Cancelada: '#64748b',
              };
              const colorPrioridad: Record<string, string> = {
                Baja: '#6b7280', Normal: '#3b82f6', Alta: '#f59e0b', Urgente: '#dc2626',
              };
              return (
                <motion.div
                  key={r.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (r.estado === 'Completada' || r.estado === 'Cancelada') return;
                    navigate(`/tecnico/requerimientos`);
                  }}
                  style={{
                    padding: '10px 12px', background: '#fff', borderRadius: 8,
                    border: '1px solid #E5E7EB', cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#1F2937' }}>
                      {r.tipo_requerimiento}
                    </span>
                    <span style={{ fontSize: 10, color: '#9CA3AF' }}>
                      <span style={{
                        fontWeight: 600, padding: '1px 5px', borderRadius: 3,
                        background: `${colorPrioridad[r.prioridad] || '#6b7280'}18`,
                        color: colorPrioridad[r.prioridad] || '#6b7280',
                      }}>{r.prioridad}</span>
                      {' · '}
                      <span style={{
                        fontWeight: 600, padding: '1px 5px', borderRadius: 3,
                        background: `${colorEstado[r.estado] || '#6b7280'}18`,
                        color: colorEstado[r.estado] || '#6b7280',
                      }}>{r.estado}</span>
                    </span>
                  </div>
                  {r.descripcion && (
                    <div style={{ fontSize: 11, color: '#374151', lineHeight: 1.4, marginBottom: 3 }}>
                      {r.descripcion}
                    </div>
                  )}
                  <div style={{ fontSize: 10, color: '#9CA3AF', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{r.lugar_nombre || ''}</span>
                    <span>{new Date(r.created_at).toLocaleDateString('es-CL', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
