import { useEffect, useState, type JSX } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import QRCode from 'qrcode';
import { AlertTriangle, Search, CheckCircle2, FileText, Smartphone, X, ChevronRight, Monitor, Pencil, Mail, Plus } from 'lucide-react';
import MobileSwipeWrapper from '../components/MobileSwipeWrapper';
import { supabase } from '../lib/supabase';
import { tecnicoCache } from '../services/tecnicoCache';
import type { PosibleFalla, PosibleDiagnostico, PosibleSolucion, PosibleObservacion } from '../types';

interface Props { idEstablecimiento: string }

interface QrItem { id: string; codigo: string; tipo: string; id_referencia: string; created_at: string }

type Tab = 'dispositivos' | 'fallas' | 'diagnosticos' | 'soluciones' | 'observaciones' | 'qr' | 'correo';

const TABS: { key: Tab; label: string; icono: JSX.Element }[] = [
  { key: 'dispositivos', label: 'Dispositivos', icono: <Monitor size={16} /> },
  { key: 'fallas', label: 'Fallas', icono: <AlertTriangle size={16} /> },
  { key: 'diagnosticos', label: 'Diagnosticos', icono: <Search size={16} /> },
  { key: 'soluciones', label: 'Soluciones', icono: <CheckCircle2 size={16} /> },
  { key: 'observaciones', label: 'Observaciones', icono: <FileText size={16} /> },
  { key: 'qr', label: 'QR', icono: <Smartphone size={16} /> },
  { key: 'correo', label: 'Correo', icono: <Mail size={16} /> },
];

export default function MobileConfigTecnico({ idEstablecimiento: _idEst }: Props) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('fallas');
  const [fallas, setFallas] = useState<PosibleFalla[]>([]);
  const [diagnosticos, setDiagnosticos] = useState<PosibleDiagnostico[]>([]);
  const [soluciones, setSoluciones] = useState<PosibleSolucion[]>([]);
  const [observaciones, setObservaciones] = useState<PosibleObservacion[]>([]);
  const [dispositivos, setDispositivos] = useState<{ id: string; nombre: string; inventariable?: boolean }[]>([]);
  const [editDispId, setEditDispId] = useState<string | null>(null);
  const [editDispNombre, setEditDispNombre] = useState('');
  const [qrCodes, setQrCodes] = useState<QrItem[]>([]);
  const [qrDataUrls, setQrDataUrls] = useState<Record<string, string>>({});
  const [qrModal, setQrModal] = useState<QrItem | null>(null);
  const [nuevo, setNuevo] = useState('');
  const [emailConfig, setEmailConfig] = useState<{ email: string; display_name: string; reply_to: string; smtp_port: number } | null>(null);
  const [plantillas, setPlantillas] = useState<{ id: string; titulo: string; cuerpo: string }[]>([]);
  const [buscarPlantilla, setBuscarPlantilla] = useState('');
  const [editandoPlantilla, setEditandoPlantilla] = useState<{ id?: string; titulo: string; cuerpo: string } | null>(null);
  const [mostrarFormPlantilla, setMostrarFormPlantilla] = useState(false);

  useEffect(() => { if (_idEst) loadAll(); }, [_idEst]);

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
      supabase.from('configuracion_dispositivos').select('id,nombre,inventariable').eq('id_establecimiento', _idEst).eq('activo', true).order('nombre'),
      supabase.from('posibles_fallas').select('*').order('nombre'),
      supabase.from('posibles_diagnosticos').select('*').order('nombre'),
      supabase.from('posibles_soluciones').select('*').order('nombre'),
      supabase.from('posibles_observaciones').select('*').order('nombre'),
      supabase.from('qr_codes').select('*').eq('activo', true).order('created_at', { ascending: false }),
      supabase.from('email_config').select('email,display_name,reply_to,smtp_port').eq('id_establecimiento', _idEst).eq('activo', true).maybeSingle(),
      supabase.from('plantillas_correo_tecnico').select('*').eq('id_establecimiento', _idEst).eq('activo', true).order('titulo'),
    ]).then(([dis, f, d, s, o, q, ec, pt]) => {
      if (dis.data) setDispositivos(dis.data);
      if (f.data) setFallas(f.data);
      if (d.data) setDiagnosticos(d.data);
      if (s.data) setSoluciones(s.data);
      if (o.data) setObservaciones(o.data);
      if (q.data) {
        setQrCodes(q.data as QrItem[]);
        generateQrImages(q.data as QrItem[]);
      }
      if (ec.data) setEmailConfig(ec.data);
      if (pt.data) setPlantillas(pt.data);
    }).catch(err => console.error('Error cargando datos config:', err));
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

  const dataMap: Record<string, { data: any[]; tbl: string }> = {
    dispositivos: { data: dispositivos, tbl: 'configuracion_dispositivos' },
    fallas: { data: fallas, tbl: 'posibles_fallas' },
    diagnosticos: { data: diagnosticos, tbl: 'posibles_diagnosticos' },
    soluciones: { data: soluciones, tbl: 'posibles_soluciones' },
    observaciones: { data: observaciones, tbl: 'posibles_observaciones' },
    qr: { data: qrCodes, tbl: 'qr_codes' },
  };

  async function toggleInventariable(d: { id: string; inventariable?: boolean }) {
    const nuevo = !d.inventariable;
    setDispositivos(prev => prev.map(x => x.id === d.id ? { ...x, inventariable: nuevo } : x));
    await supabase.from('configuracion_dispositivos').update({ inventariable: nuevo }).eq('id', d.id);
  }

  async function agregarDispositivo() {
    if (!editDispNombre.trim()) return;
    if (editDispId) {
      await supabase.from('configuracion_dispositivos').update({ nombre: editDispNombre.trim() }).eq('id', editDispId);
      setDispositivos(prev => prev.map(d => d.id === editDispId ? { ...d, nombre: editDispNombre.trim() } : d));
    } else {
      const { data } = await supabase.from('configuracion_dispositivos').insert({
        id_establecimiento: _idEst, nombre: editDispNombre.trim(),
      }).select('id,nombre,inventariable');
      if (data) setDispositivos(prev => [...prev, ...data]);
    }
    setEditDispId(null);
    setEditDispNombre('');
  }

  async function eliminarDispositivo(id: string) {
    if (!confirm('¿Anular este dispositivo?')) return;
    await supabase.from('configuracion_dispositivos').update({ activo: false }).eq('id', id);
    setDispositivos(prev => prev.filter(x => x.id !== id));
  }

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
            {t.key === 'dispositivos' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input value={editDispNombre} onChange={e => setEditDispNombre(e.target.value)}
                    placeholder={editDispId ? 'Editar nombre…' : 'Nuevo dispositivo…'}
                    style={{
                      flex: 1, padding: '10px 12px', borderRadius: 8, border: '1px solid #E5E7EB',
                      background: '#fff', color: '#1F2937', fontSize: 14,
                    }}
                    onKeyDown={e => { if (e.key === 'Enter') agregarDispositivo(); }}
                  />
                  <motion.button whileTap={{ scale: 0.95 }} onClick={agregarDispositivo} style={{
                    padding: '10px 16px', borderRadius: 8, border: 'none',
                    background: '#1e40af', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}>{editDispId ? 'Guardar' : 'Agregar'}</motion.button>
                  {editDispId && (
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setEditDispId(null); setEditDispNombre(''); }} style={{
                      padding: '10px 12px', borderRadius: 8, border: '1px solid #D1D5DB',
                      background: '#fff', color: '#374151', fontSize: 13, cursor: 'pointer',
                    }}><X size={16} /></motion.button>
                  )}
                </div>
                {dispositivos.map(d => (
                  <motion.div
                    key={d.id}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 12px', background: '#fff', borderRadius: 8,
                      border: '1px solid #E5E7EB',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button onClick={() => toggleInventariable(d)} title={d.inventariable ? 'Inventariable' : 'No inventariable'}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: 0, lineHeight: 1, opacity: d.inventariable ? 1 : 0.5 }}>
                        {d.inventariable ? '📦' : '🔌'}
                      </button>
                      <span style={{ fontSize: 14, color: '#1F2937' }}>{d.nombre}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => { setEditDispId(d.id); setEditDispNombre(d.nombre); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: '0 4px', display: 'flex' }}>
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => eliminarDispositivo(d.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '0 4px', display: 'flex' }}>
                        <X size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))}
                {dispositivos.length === 0 && (
                  <p style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 13, padding: 16 }}>Sin dispositivos</p>
                )}
              </div>
            ) : t.key === 'qr' ? (
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
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate('/tecnico/accesos')} style={{
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
            ) : t.key === 'correo' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* Configuración SMTP */}
                <div style={{ padding: '10px 12px', background: '#F0FDF4', borderRadius: 8, border: '1px solid #BBF7D0' }}>
                  <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: '#166534' }}>
                    <Mail size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                    Configuración SMTP
                  </p>
                  {emailConfig ? (
                    <>
                      <p style={{ margin: 0, fontSize: 12, color: '#15803D' }}>Correo: {emailConfig.email}</p>
                      <p style={{ margin: 0, fontSize: 12, color: '#15803D' }}>Remitente: {emailConfig.display_name}</p>
                      {emailConfig.reply_to && <p style={{ margin: 0, fontSize: 12, color: '#15803D' }}>Responder a: {emailConfig.reply_to}</p>}
                      <p style={{ margin: 0, fontSize: 12, color: '#15803D' }}>Puerto: {emailConfig.smtp_port}</p>
                    </>
                  ) : (
                    <p style={{ margin: 0, fontSize: 12, color: '#9CA3AF' }}>Sin configuración de correo</p>
                  )}
                </div>

                {/* Buscador de plantillas */}
                <div style={{ display: 'flex', gap: 6 }}>
                  <input value={buscarPlantilla} onChange={e => setBuscarPlantilla(e.target.value)}
                    placeholder="Buscar plantilla…"
                    style={{
                      flex: 1, padding: '10px 12px', borderRadius: 8, border: '1px solid #E5E7EB',
                      background: '#fff', color: '#1F2937', fontSize: 14,
                    }}
                  />
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => {
                    setEditandoPlantilla({ titulo: '', cuerpo: 'Estimados,\n\nEl requerimiento N° {codigo}, con fecha: {fecha}, he observado y resuelto la incidencia.\nSegún lo indicado {falla}, diagnostique {diagnostico}.\nFacilitando la continuidad de los servicios y equipos: se {solucion} el requerimiento.\n\n{observaciones}\n\nAtte\nTécnico\n{nombre_tecnico}' });
                    setMostrarFormPlantilla(true);
                  }} style={{
                    padding: '10px 12px', borderRadius: 8, border: 'none',
                    background: '#1e40af', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}><Plus size={16} /> Nueva</motion.button>
                </div>

                {/* Lista de plantillas o formulario de edición */}
                {mostrarFormPlantilla && editandoPlantilla ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <input value={editandoPlantilla.titulo} onChange={e => setEditandoPlantilla({ ...editandoPlantilla, titulo: e.target.value })}
                      placeholder="Título de la plantilla"
                      style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', color: '#1F2937', fontSize: 14 }}
                    />
                    <textarea value={editandoPlantilla.cuerpo} onChange={e => setEditandoPlantilla({ ...editandoPlantilla, cuerpo: e.target.value })}
                      placeholder="Cuerpo de la plantilla..."
                      rows={10}
                      style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', color: '#1F2937', fontSize: 13, resize: 'vertical', fontFamily: 'monospace', lineHeight: 1.5 }}
                    />
                    <div style={{ fontSize: 11, color: '#9CA3AF', padding: '4px 0' }}>
                      Variables disponibles: {'{codigo}'}, {'{fecha}'}, {'{falla}'}, {'{diagnostico}'}, {'{solucion}'}, {'{observaciones}'}, {'{nombre_tecnico}'}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <motion.button whileTap={{ scale: 0.95 }} onClick={async () => {
                        if (!editandoPlantilla.titulo.trim() || !editandoPlantilla.cuerpo.trim()) return;
                        if (editandoPlantilla.id) {
                          await supabase.from('plantillas_correo_tecnico').update({ titulo: editandoPlantilla.titulo.trim(), cuerpo: editandoPlantilla.cuerpo.trim() }).eq('id', editandoPlantilla.id);
                        } else {
                          await supabase.from('plantillas_correo_tecnico').insert({ id_establecimiento: _idEst, titulo: editandoPlantilla.titulo.trim(), cuerpo: editandoPlantilla.cuerpo.trim() });
                        }
                        setMostrarFormPlantilla(false);
                        setEditandoPlantilla(null);
                        loadAll();
                      }} style={{
                        flex: 1, padding: '10px 16px', borderRadius: 8, border: 'none',
                        background: '#1e40af', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      }}>Guardar</motion.button>
                      <motion.button whileTap={{ scale: 0.95 }} onClick={() => {
                        setMostrarFormPlantilla(false);
                        setEditandoPlantilla(null);
                      }} style={{
                        padding: '10px 16px', borderRadius: 8, border: '1px solid #D1D5DB',
                        background: '#fff', color: '#374151', fontSize: 13, cursor: 'pointer',
                      }}>Cancelar</motion.button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {plantillas
                      .filter(p => p.titulo.toLowerCase().includes(buscarPlantilla.toLowerCase()))
                      .map(p => (
                        <motion.div key={p.id} whileTap={{ scale: 0.97 }}
                          onClick={() => {
                            setEditandoPlantilla({ id: p.id, titulo: p.titulo, cuerpo: p.cuerpo });
                            setMostrarFormPlantilla(true);
                          }}
                          style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '10px 12px', background: '#fff', borderRadius: 8,
                            border: '1px solid #E5E7EB', cursor: 'pointer',
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#1F2937' }}>{p.titulo}</div>
                            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 240 }}>
                              {p.cuerpo.split('\n')[0]}
                            </div>
                          </div>
                          <button onClick={async (e) => {
                            e.stopPropagation();
                            if (!confirm('¿Eliminar plantilla?')) return;
                            await supabase.from('plantillas_correo_tecnico').update({ activo: false }).eq('id', p.id);
                            loadAll();
                          }} style={{
                            background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '0 4px', display: 'flex',
                          }}><X size={16} /></button>
                        </motion.div>
                      ))}
                    {plantillas.length === 0 && (
                      <p style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 13, padding: 16 }}>Sin plantillas de correo</p>
                    )}
                  </div>
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
