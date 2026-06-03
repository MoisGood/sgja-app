import { useEffect, useState, type JSX } from 'react';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import QRCode from 'qrcode';
import { AlertTriangle, Search, CheckCircle2, FileText, Smartphone, X, ChevronRight } from 'lucide-react';
import MobileSwipeWrapper from '../components/MobileSwipeWrapper';
import { supabase } from '../lib/supabase';
import { tecnicoCache } from '../services/tecnicoCache';
import type { PosibleFalla, PosibleDiagnostico, PosibleSolucion, PosibleObservacion } from '../types';

interface Props { idEstablecimiento: string }

interface QrItem { id: string; codigo: string; tipo: string; id_referencia: string; created_at: string }

type Tab = 'fallas' | 'diagnosticos' | 'soluciones' | 'observaciones' | 'qr';

const TABS: { key: Tab; label: string; icono: JSX.Element }[] = [
  { key: 'fallas', label: 'Fallas', icono: <AlertTriangle size={16} /> },
  { key: 'diagnosticos', label: 'Diagnosticos', icono: <Search size={16} /> },
  { key: 'soluciones', label: 'Soluciones', icono: <CheckCircle2 size={16} /> },
  { key: 'observaciones', label: 'Observaciones', icono: <FileText size={16} /> },
  { key: 'qr', label: 'QR', icono: <Smartphone size={16} /> },
];

const irA = (ruta: string) => { window.location.hash = ruta };

export default function MobileConfigTecnico({ idEstablecimiento: _idEst }: Props) {
  const [tab, setTab] = useState<Tab>('fallas');
  const [fallas, setFallas] = useState<PosibleFalla[]>([]);
  const [diagnosticos, setDiagnosticos] = useState<PosibleDiagnostico[]>([]);
  const [soluciones, setSoluciones] = useState<PosibleSolucion[]>([]);
  const [observaciones, setObservaciones] = useState<PosibleObservacion[]>([]);
  const [qrCodes, setQrCodes] = useState<QrItem[]>([]);
  const [qrDataUrls, setQrDataUrls] = useState<Record<string, string>>({});
  const [qrModal, setQrModal] = useState<QrItem | null>(null);
  const [nuevo, setNuevo] = useState('');

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    // Cache primero
    const cached = await tecnicoCache.getAll(_idEst);
    if (cached) {
      setFallas(cached.posibles_fallas);
      setDiagnosticos(cached.posibles_diagnosticos);
      setSoluciones(cached.posibles_soluciones);
      setObservaciones(cached.posibles_observaciones);
    }

    Promise.all([
      supabase.from('posibles_fallas').select('*').order('nombre'),
      supabase.from('posibles_diagnosticos').select('*').order('nombre'),
      supabase.from('posibles_soluciones').select('*').order('nombre'),
      supabase.from('posibles_observaciones').select('*').order('nombre'),
      supabase.from('qr_codes').select('*').eq('activo', true).order('created_at', { ascending: false }),
    ]).then(([f, d, s, o, q]) => {
      if (f.data) setFallas(f.data);
      if (d.data) setDiagnosticos(d.data);
      if (s.data) setSoluciones(s.data);
      if (o.data) setObservaciones(o.data);
      if (q.data) {
        setQrCodes(q.data as QrItem[]);
        generateQrImages(q.data as QrItem[]);
      }
    });
  }

  async function generateQrImages(list: QrItem[]) {
    const base = (window.location.origin + '/#/tecnico/qr?c=');
    const entries = await Promise.all(list.map(async q => {
      try {
        const svg = await QRCode.toString(base + encodeURIComponent(q.codigo), { type: 'svg', margin: 1 });
        return [q.id, `data:image/svg+xml,${encodeURIComponent(svg)}`] as const;
      } catch { return [q.id, ''] as const; }
    }));
    setQrDataUrls(Object.fromEntries(entries));
  }

  async function agregar(tbl: string) {
    if (!nuevo.trim()) return;
    await supabase.from(tbl).insert({ nombre: nuevo.trim() });
    setNuevo('');
    loadAll();
  }

  async function eliminar(tbl: string, id: string) {
    if (!confirm('Eliminar?')) return;
    await supabase.from(tbl).delete().eq('id', id);
    loadAll();
  }

  const dataMap: Record<Tab, { data: any[]; tbl: string }> = {
    fallas: { data: fallas, tbl: 'posibles_fallas' },
    diagnosticos: { data: diagnosticos, tbl: 'posibles_diagnosticos' },
    soluciones: { data: soluciones, tbl: 'posibles_soluciones' },
    observaciones: { data: observaciones, tbl: 'posibles_observaciones' },
    qr: { data: qrCodes, tbl: 'qr_codes' },
  };

  return (
    <MobileSwipeWrapper>
    <div style={{ padding: 16, maxWidth: 500, margin: '0 auto' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1A3C6B', margin: '0 0 16px' }}>Configuracion</h1>

      {/* Tab titles — visual indicator, no pagination dots */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto', paddingBottom: 4 }}>
        {TABS.map(t => (
          <span key={t.key} style={{
            padding: '8px 14px', borderRadius: 8, whiteSpace: 'nowrap',
            background: tab === t.key ? '#1A3C6B' : '#F3F4F6',
            color: tab === t.key ? '#fff' : '#374151',
            fontSize: 13, fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {t.icono} {t.label}
          </span>
        ))}
      </div>

      <Swiper
        modules={[Pagination]}
        spaceBetween={0}
        slidesPerView={1}
        pagination={{ clickable: true }}
        autoHeight={true}
        onSlideChangeTransitionEnd={(s) => setTab(TABS[s.activeIndex].key)}
        style={{ minHeight: 260, paddingBottom: 32 }}
      >
        {TABS.map(t => (
          <SwiperSlide key={t.key}>
            {t.key === 'qr' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {qrCodes.map(q => (
                  <motion.div
                    key={q.id}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setQrModal(q)}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 12px', background: '#fff', borderRadius: 8,
                      border: '1px solid #E5E7EB', cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontSize: 14, color: '#1F2937' }}>
                      <strong style={{ color: '#1A3C6B' }}>{q.tipo}</strong> — {q.codigo}
                      <br /><span style={{ fontSize: 11, color: '#9CA3AF' }}>{new Date(q.created_at).toLocaleDateString()}</span>
                    </span>
                    <span style={{ color: '#9CA3AF', display: 'flex' }}><ChevronRight size={18} /></span>
                  </motion.div>
                ))}
                {qrCodes.length === 0 && (
                  <p style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 13, padding: 16 }}>Sin QR generados</p>
                )}
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => irA('/tecnico/accesos')} style={{
                  marginTop: 8, padding: '10px 24px', borderRadius: 8, border: 'none',
                  background: '#1e40af', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}>Ir a Accesos Rapidos</motion.button>

                {qrModal && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setQrModal(null)}
                    style={{
                      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                    }}
                  >
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      onClick={e => e.stopPropagation()}
                      style={{
                        background: '#fff', borderRadius: 16, padding: 24, textAlign: 'center',
                        maxWidth: 320, width: '90%',
                      }}
                    >
                      <h3 style={{ margin: '0 0 4px', color: '#1A3C6B', fontSize: 16 }}>{qrModal.tipo}</h3>
                      <p style={{ margin: '0 0 12px', color: '#6B7280', fontSize: 12 }}>{qrModal.codigo}</p>
                      {qrDataUrls[qrModal.id] ? (
                        <img src={qrDataUrls[qrModal.id]} alt="QR" style={{ width: 200, height: 200, display: 'block', margin: '0 auto' }} />
                      ) : (
                        <p style={{ color: '#9CA3AF', fontSize: 13 }}>Generando...</p>
                      )}
                      <motion.button whileTap={{ scale: 0.95 }} onClick={() => setQrModal(null)} style={{
                        marginTop: 12, padding: '8px 20px', borderRadius: 8, border: 'none',
                        background: '#1e40af', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      }}>Cerrar</motion.button>
                    </motion.div>
                  </motion.div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input value={nuevo} onChange={e => setNuevo(e.target.value)}
                    placeholder={"Nuevo " + t.key.slice(0, -1)}
                    style={{
                      flex: 1, padding: '10px 12px', borderRadius: 8, border: '1px solid #E5E7EB',
                      background: '#fff', color: '#1F2937', fontSize: 14,
                    }}
                    onKeyDown={e => { if (e.key === 'Enter') agregar(dataMap[t.key].tbl); }}
                  />
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => agregar(dataMap[t.key].tbl)} style={{
                    padding: '10px 16px', borderRadius: 8, border: 'none',
                    background: '#1e40af', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}>Agregar</motion.button>
                </div>
                {dataMap[t.key].data.map((item: any) => (
                  <motion.div
                    key={item.id}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 12px', background: '#fff', borderRadius: 8,
                      border: '1px solid #E5E7EB',
                    }}
                  >
                    <span style={{ fontSize: 14, color: '#1F2937' }}>{item.nombre}</span>
                    <button onClick={() => eliminar(dataMap[t.key].tbl, item.id)} style={{
                      background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '0 4px', display: 'flex',
                    }}><X size={16} /></button>
                  </motion.div>
                ))}
                {dataMap[t.key].data.length === 0 && (
                  <p style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 13, padding: 16 }}>Sin elementos</p>
                )}
              </div>
            )}
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
    </MobileSwipeWrapper>
  );
}
