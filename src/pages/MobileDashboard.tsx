import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, AlertTriangle, Search, Monitor, Loader, Ticket, X, LogOut, Home, Package, Settings, ScanQrCode, Map as MapIcon, History, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { tecnicoCache } from '../services/tecnicoCache';
import { handleError, showSuccess } from '../utils/errorHandler';
import { registrarCierre } from '../services/online';
import { UsuariosOnlineIndicador } from '../components/UsuariosOnlineIndicador';
import { useTheme } from '../hooks/useTheme';
import styles from '../styles/mobile-dashboard.module.css';

interface Props { idEstablecimiento: string; nombre: string; apellidos: string }

interface HistoryItem {
  id: string; tipo_requerimiento: string; prioridad: string;
  estado: string; descripcion: string; created_at: string; lugar_nombre?: string;
}

export default function MobileDashboard({ idEstablecimiento, nombre, apellidos }: Props) {
  const navigate = useNavigate();
  const [resumen, setResumen] = useState<{ estado: string; count: number }[]>([]);
  const [hoy, setHoy] = useState<HistoryItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const { temaOscuro, setTemaOscuro } = useTheme();

  const [modalFalla, setModalFalla] = useState(false);
  const [nombreFalla, setNombreFalla] = useState('');
  const [guardandoFalla, setGuardandoFalla] = useState(false);

  const [modalDiagnostico, setModalDiagnostico] = useState(false);
  const [nombreDiagnostico, setNombreDiagnostico] = useState('');
  const [guardandoDiagnostico, setGuardandoDiagnostico] = useState(false);

  const [menuAbierto, setMenuAbierto] = useState(false);

  const [modalPickerLugar, setModalPickerLugar] = useState(false);
  const [pickerStep, setPickerStep] = useState<'choose' | 'lugar' | 'usuario'>('choose');
  const [busqLugar, setBusqLugar] = useState('');
  const [lugares, setLugares] = useState<{ id: string; nombre: string; piso: number }[]>([]);
  const [cargandoLugares, setCargandoLugares] = useState(false);
  const [busqUsuario, setBusqUsuario] = useState('');
  const [usuarios, setUsuarios] = useState<{ id: string; nombre: string; email: string }[]>([]);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(false);
  const busqUsuarioRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!idEstablecimiento) return;

    let activo = true;

    (async () => {
      tecnicoCache.prefetch(idEstablecimiento).catch(() => {});

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
      } catch (e) {
        console.error('Error al cargar dashboard:', e);
      }

      if (activo) setCargando(false);
    })();

    return () => { activo = false; };
  }, [idEstablecimiento]);

  if (cargando) return (
    <div className={styles.container} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <div className={styles.loading}><Loader size={24} className="animate-spin" /></div>
    </div>
  );

  const pendientes = resumen.find(r => r.estado === 'Pendiente')?.count ?? 0;
  const enProceso = resumen.find(r => r.estado === 'En Proceso')?.count ?? 0;
  const completadosHoy = hoy.filter(r => r.estado === 'Completada').length;

  return (
    <div className={styles.container}>
      {/* TopAppBar */}
      <header className={styles.topAppBar}>
        <div className={styles.topAppBarLeft}>
          <span className={`${styles.logo} material-symbols-outlined`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, background: temaOscuro ? '#ffb1c2' : '#5c0427', color: '#fff' }}>build</span>
          <h1 className={styles.appTitle}>Soporte TI</h1>
        </div>
        <div className={styles.topAppBarRight}>
          <UsuariosOnlineIndicador />
          <button className={styles.iconBtn} onClick={() => setTemaOscuro(!temaOscuro)} title={temaOscuro ? 'Modo claro' : 'Modo oscuro'}>
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
              {temaOscuro ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
          <button className={styles.iconBtn} onClick={() => setMenuAbierto(true)} title="Menú">
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>menu</span>
          </button>
        </div>
      </header>

      {/* Scrollable Content */}
      <div className={styles.scrollContent}>
        {/* Greeting */}
        <div className={styles.greeting}>
          <h2 className={styles.greetingTitle}>Hola, {nombre} {apellidos ? apellidos.charAt(0).toUpperCase() + '.' : ''}</h2>
          <p className={styles.greetingSub}>Resumen del día &bull; {new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' }).replace(/^\w/, c => c.toUpperCase())}</p>
        </div>

        {/* Bento Stats Grid */}
        <div className={styles.bentoGrid}>
          {/* Pendientes */}
          <motion.button
            className={`${styles.bentoCard} ${styles.bentoCardPrimary}`}
            whileTap={{ scale: 0.97 }}
            onClick={() => pendientes > 0 && navigate('/tecnico/m/historial?estado=Pendiente')}
          >
            <div className={styles.bentoIcon}>
              <span className="material-symbols-outlined" style={{ fontSize: 28 }}>pending_actions</span>
            </div>
            <p className={styles.bentoCount}>{pendientes}</p>
            <p className={styles.bentoLabel}>PENDIENTES</p>
          </motion.button>

          {/* En Proceso */}
          <motion.button
            className={`${styles.bentoCard} ${styles.bentoCardTertiary}`}
            whileTap={{ scale: 0.97 }}
            onClick={() => enProceso > 0 && navigate('/tecnico/m/historial?estado=En%20Proceso')}
          >
            <div className={styles.bentoIcon}>
              <span className="material-symbols-outlined" style={{ fontSize: 28 }}>sync</span>
            </div>
            <p className={styles.bentoCount}>{enProceso}</p>
            <p className={styles.bentoLabel}>EN PROCESO</p>
          </motion.button>

          {/* Completados */}
          <div className={`${styles.bentoCard} ${styles.bentoCardFull}`}>
            <div className={styles.bentoCardContent}>
              <div>
                <div className={styles.bentoIcon}>
                  <span className="material-symbols-outlined" style={{ fontSize: 28 }}>check_circle</span>
                </div>
                <p className={styles.bentoCount}>{completadosHoy} Tickets Completados</p>
                <p className={styles.bentoLabel} style={{ opacity: 0.6 }}>Hoy</p>
              </div>
              <button className={styles.verTodoBtn} onClick={() => navigate('/tecnico/m/historial')}>
                Ver Todo
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className={styles.quickActions}>
          {[
            { label: 'Crear Ticket', icono: <span className="material-symbols-outlined" style={{ fontSize: 24 }}>add_circle</span>, onClick: () => {
              setPickerStep('choose');
              setModalPickerLugar(true);
              if (lugares.length === 0 && !cargandoLugares) {
                setCargandoLugares(true);
                supabase.from('lugares').select('id,nombre,piso').eq('id_establecimiento', idEstablecimiento).eq('activo', true).order('nombre').then(({ data }) => {
                  if (data) setLugares(data);
                  setCargandoLugares(false);
                });
              }
              if (usuarios.length === 0 && !cargandoUsuarios) {
                setCargandoUsuarios(true);
                supabase.from('usuarios').select('id,nombre,email').eq('id_establecimiento', idEstablecimiento).eq('activo', true).order('nombre').then(({ data }) => {
                  if (data) setUsuarios(data);
                  setCargandoUsuarios(false);
                });
              }
            } },
            { label: 'Falla', icono: <span className="material-symbols-outlined" style={{ fontSize: 24 }}>report_problem</span>, onClick: () => { setNombreFalla(''); setModalFalla(true); } },
            { label: 'Diagnóstico', icono: <span className="material-symbols-outlined" style={{ fontSize: 24 }}>biotech</span>, onClick: () => { setNombreDiagnostico(''); setModalDiagnostico(true); } },
            { label: 'Mapa', icono: <span className="material-symbols-outlined" style={{ fontSize: 24 }}>map</span>, onClick: () => navigate('/tecnico/m/grid') },
          ].map(a => (
            <motion.button key={a.label} className={styles.quickAction} whileTap={{ scale: 0.95 }} onClick={a.onClick}>
              <div className={styles.quickActionIconWrap}>
                {a.icono}
              </div>
              <p className={styles.quickActionLabel}>{a.label}</p>
            </motion.button>
          ))}
        </div>

        {/* Tickets Recientes */}
        <h3 className={styles.sectionTitle}>
          <ClipboardList size={18} />
          Tickets Recientes
        </h3>

        {hoy.length === 0 ? (
          <p className={styles.emptyState}>Sin tickets hoy</p>
        ) : (
          <div className={styles.ticketList}>
            {hoy.slice(0, 5).map(r => {
              const esUrgente = r.prioridad === 'Urgente';
              const timeAgo = getTimeAgo(r.created_at);
              return (
                <motion.div
                  key={r.id}
                  className={esUrgente ? styles.ticketCardUrgent : styles.ticketCard}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (r.estado === 'Completada' || r.estado === 'Cancelada') return;
                    navigate(`/ticket?ticket=${r.id}`);
                  }}
                >
                  <div className={styles.ticketHeader}>
                    <span className={styles.ticketId}>{r.tipo_requerimiento}</span>
                    <span className={`${styles.ticketBadge} ${esUrgente ? styles.ticketBadgeUrgent : styles.ticketBadgeStandard}`}>
                      {esUrgente ? 'URGENTE' : r.prioridad || 'ESTÁNDAR'}
                    </span>
                  </div>
                  {r.descripcion && (
                    <p className={styles.ticketTitle}>{r.descripcion}</p>
                  )}
                  <div className={styles.ticketMeta}>
                    <span>{r.lugar_nombre || ''}</span>
                    <span>{timeAgo}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modal: Agregar Falla ── */}
      {modalFalla && (
        <div className={styles.modalBackdrop} onClick={() => setModalFalla(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalTitle}>
              <AlertTriangle size={18} color="#ea580c" /> Nueva Falla
            </div>
            <input value={nombreFalla} onChange={e => setNombreFalla(e.target.value)} placeholder="Nombre de la posible falla *" className={styles.modalInput} />
            <div className={styles.modalActions}>
              <button onClick={() => setModalFalla(false)} className={styles.btnSecondary}>Cancelar</button>
              <button disabled={guardandoFalla || !nombreFalla.trim()} onClick={async () => {
                if (!nombreFalla.trim() || guardandoFalla) return;
                setGuardandoFalla(true);
                try {
                  const { error } = await supabase.from('posibles_fallas').insert({
                    id_establecimiento: idEstablecimiento, nombre: nombreFalla.trim(),
                  });
                  if (error) throw error;
                  showSuccess('Falla agregada');
                  setModalFalla(false);
                } catch (e) { handleError(e, 'Error al agregar falla'); }
                setGuardandoFalla(false);
              }} className={styles.btnPrimary} style={{ opacity: !nombreFalla.trim() || guardandoFalla ? 0.5 : 1 }}>
                {guardandoFalla ? '⏳' : 'Agregar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Agregar Diagnóstico ── */}
      {modalDiagnostico && (
        <div className={styles.modalBackdrop} onClick={() => setModalDiagnostico(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalTitle}>
              <Search size={18} color="#7c3aed" /> Nuevo Diagnóstico
            </div>
            <input value={nombreDiagnostico} onChange={e => setNombreDiagnostico(e.target.value)} placeholder="Nombre del diagnóstico *" className={styles.modalInput} />
            <div className={styles.modalActions}>
              <button onClick={() => setModalDiagnostico(false)} className={styles.btnSecondary}>Cancelar</button>
              <button disabled={guardandoDiagnostico || !nombreDiagnostico.trim()} onClick={async () => {
                if (!nombreDiagnostico.trim() || guardandoDiagnostico) return;
                setGuardandoDiagnostico(true);
                try {
                  const { error } = await supabase.from('posibles_diagnosticos').insert({
                    id_establecimiento: idEstablecimiento, nombre: nombreDiagnostico.trim(),
                  });
                  if (error) throw error;
                  showSuccess('Diagnóstico agregado');
                  setModalDiagnostico(false);
                } catch (e) { handleError(e, 'Error al agregar diagnóstico'); }
                setGuardandoDiagnostico(false);
              }} className={styles.btnPrimary} style={{ opacity: !nombreDiagnostico.trim() || guardandoDiagnostico ? 0.5 : 1 }}>
                {guardandoDiagnostico ? '⏳' : 'Agregar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Drawer lateral derecho ── */}
      <AnimatePresence>
        {menuAbierto && (
          <>
            {/* Backdrop */}
            <motion.div
              className={styles.drawerBackdrop}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setMenuAbierto(false)}
            />
            {/* Panel */}
            <motion.aside
              className={styles.drawer}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            >
              <div className={styles.drawerHeader}>
                <h2 className={styles.drawerTitle}>Navegación</h2>
                <button className={styles.drawerClose} onClick={() => setMenuAbierto(false)}>
                  <X size={20} />
                </button>
              </div>

              <div className={styles.drawerBody}>
                <p className={styles.drawerSection}>Principal</p>
                {[
                  { label: 'Inicio', icon: <Home size={18} />, ruta: '/tecnico/m/inicio' },
                  { label: 'Tickets', icon: <Ticket size={18} />, ruta: '/tecnico/m/tickets' },
                  { label: 'Historial', icon: <History size={18} />, ruta: '/tecnico/m/historial' },
                  { label: 'Escáner QR', icon: <ScanQrCode size={18} />, ruta: '/tecnico/m/qr' },
                ].map(item => (
                  <button key={item.ruta} className={styles.drawerItem} onClick={() => { setMenuAbierto(false); navigate(item.ruta); }}>
                    <span className={styles.drawerItemIcon}>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}

                <p className={styles.drawerSection}>Gestión</p>
                {[
                  { label: 'Mapa', icon: <MapIcon size={18} />, ruta: '/tecnico/m/grid' },
                  { label: 'Equipos', icon: <Monitor size={18} />, ruta: '/tecnico/m/equipos' },
                  { label: 'Inventario', icon: <Package size={18} />, ruta: '/tecnico/m/inventario' },
                  { label: 'Ubicaciones', icon: <MapPin size={18} />, ruta: '/tecnico/m/ubicaciones' },
                ].map(item => (
                  <button key={item.ruta} className={styles.drawerItem} onClick={() => { setMenuAbierto(false); navigate(item.ruta); }}>
                    <span className={styles.drawerItemIcon}>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}

                <p className={styles.drawerSection}>Sistema</p>
                {[
                  { label: 'Configuración', icon: <Settings size={18} />, ruta: '/tecnico/m/config' },
                ].map(item => (
                  <button key={item.ruta} className={styles.drawerItem} onClick={() => { setMenuAbierto(false); navigate(item.ruta); }}>
                    <span className={styles.drawerItemIcon}>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>

              <div className={styles.drawerFooter}>
                <button className={styles.drawerLogout} onClick={async () => {
                  setMenuAbierto(false);
                  try {
                    const { data: { user } } = await supabase.auth.getUser();
                    const correo = user?.email;
                    if (correo) await registrarCierre(correo);
                    await supabase.auth.signOut();
                  } catch { await supabase.auth.signOut(); }
                }}>
                  <LogOut size={18} />
                  Cerrar sesión
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Modal: Seleccionar Lugar o Usuario para Ticket ── */}
      {modalPickerLugar && (
        <div className={styles.modalBackdrop} onClick={() => { setModalPickerLugar(false); setBusqUsuario(''); setBusqLugar(''); }}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>

            {/* Step 0: Choose lugar or usuario */}
            {pickerStep === 'choose' && (
              <>
                <div className={styles.modalTitle}>
                  <span className="material-symbols-outlined" style={{ fontSize: 22 }}>add_circle</span> Nuevo Ticket
                </div>
                <p style={{ fontSize: 13, color: '#9CA3AF', margin: '0 0 16px', textAlign: 'center' }}>
                  ¿Atención por lugar o por usuario?
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button
                    onClick={() => { setPickerStep('lugar'); setBusqLugar(''); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '16px',
                      border: '1px solid #475569', background: temaOscuro ? '#1f2937' : '#f3f4f6',
                      borderRadius: 12, cursor: 'pointer', fontSize: 15, fontWeight: 600,
                      color: temaOscuro ? '#f3f4f6' : '#191c1e', textAlign: 'left',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 28, color: '#3b82f6' }}>location_on</span>
                    <div>
                      <div>Por Lugar</div>
                      <div style={{ fontSize: 12, fontWeight: 400, color: '#9CA3AF', marginTop: 2 }}>Seleccionar un lugar del establecimiento</div>
                    </div>
                  </button>
                  <button
                    onClick={() => { setPickerStep('usuario'); setBusqUsuario(''); setTimeout(() => busqUsuarioRef.current?.focus(), 100); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '16px',
                      border: '1px solid #475569', background: temaOscuro ? '#1f2937' : '#f3f4f6',
                      borderRadius: 12, cursor: 'pointer', fontSize: 15, fontWeight: 600,
                      color: temaOscuro ? '#f3f4f6' : '#191c1e', textAlign: 'left',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 28, color: '#8b5cf6' }}>person</span>
                    <div>
                      <div>Por Usuario</div>
                      <div style={{ fontSize: 12, fontWeight: 400, color: '#9CA3AF', marginTop: 2 }}>Seleccionar un usuario del establecimiento</div>
                    </div>
                  </button>
                </div>
                <div className={styles.modalActions} style={{ marginTop: 16 }}>
                  <button onClick={() => { setModalPickerLugar(false); setBusqUsuario(''); setBusqLugar(''); }} className={styles.btnSecondary}>Cancelar</button>
                </div>
              </>
            )}

            {/* Step 1a: Lugar picker */}
            {pickerStep === 'lugar' && (
              <>
                <div className={styles.modalTitle}>
                  <button onClick={() => setPickerStep('choose')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex', alignItems: 'center', padding: 0, marginRight: 4 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
                  </button>
                  <span className="material-symbols-outlined" style={{ fontSize: 22 }}>location_on</span> Seleccionar Lugar
                </div>
                <input
                  value={busqLugar}
                  onChange={e => setBusqLugar(e.target.value)}
                  placeholder="Buscar lugar…"
                  className={styles.modalInput}
                  autoFocus
                />
                <div style={{ flex: 1, overflowY: 'auto', marginTop: 4 }}>
                  {cargandoLugares ? (
                    <div style={{ textAlign: 'center', padding: 20, color: '#9CA3AF' }}>Cargando…</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {lugares
                        .filter(l => l.nombre.toLowerCase().includes(busqLugar.toLowerCase()))
                        .map(l => (
                          <button
                            key={l.id}
                            onClick={() => { setModalPickerLugar(false); setBusqUsuario(''); setBusqLugar(''); navigate(`/ticket?lugar=${l.id}`); }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                              border: 'none', background: 'transparent', borderRadius: 8,
                              cursor: 'pointer', fontSize: 14, color: temaOscuro ? '#f3f4f6' : '#191c1e',
                              textAlign: 'left', transition: 'background 0.1s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = temaOscuro ? '#1f2937' : '#edeef0')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 20, color: temaOscuro ? '#9ca3af' : '#554245' }}>location_on</span>
                            <div>
                              <div style={{ fontWeight: 500 }}>{l.nombre}</div>
                              <div style={{ fontSize: 11, color: temaOscuro ? '#9ca3af' : '#554245' }}>Piso {l.piso}</div>
                            </div>
                          </button>
                        ))}
                      {lugares.filter(l => l.nombre.toLowerCase().includes(busqLugar.toLowerCase())).length === 0 && (
                        <div style={{ textAlign: 'center', padding: 20, color: '#9CA3AF', fontSize: 13 }}>Sin resultados</div>
                      )}
                    </div>
                  )}
                </div>
                <div className={styles.modalActions} style={{ marginTop: 8 }}>
                  <button onClick={() => setPickerStep('choose')} className={styles.btnSecondary}>Atrás</button>
                </div>
              </>
            )}

            {/* Step 1b: Usuario picker */}
            {pickerStep === 'usuario' && (
              <>
                <div className={styles.modalTitle}>
                  <button onClick={() => setPickerStep('choose')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex', alignItems: 'center', padding: 0, marginRight: 4 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
                  </button>
                  <span className="material-symbols-outlined" style={{ fontSize: 22 }}>person</span> Seleccionar Usuario
                </div>
                <input
                  ref={busqUsuarioRef}
                  value={busqUsuario}
                  onChange={e => setBusqUsuario(e.target.value)}
                  placeholder="Buscar usuario…"
                  className={styles.modalInput}
                  autoFocus
                />
                <div style={{ flex: 1, overflowY: 'auto', marginTop: 4 }}>
                  {cargandoUsuarios ? (
                    <div style={{ textAlign: 'center', padding: 20, color: '#9CA3AF' }}>Cargando…</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {usuarios
                        .filter(u => u.nombre.toLowerCase().includes(busqUsuario.toLowerCase()) || u.email.toLowerCase().includes(busqUsuario.toLowerCase()))
                        .map(u => (
                          <button
                            key={u.id}
                            onClick={() => { setModalPickerLugar(false); setBusqUsuario(''); setBusqLugar(''); navigate(`/ticket?usuario=${u.id}`); }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                              border: 'none', background: 'transparent', borderRadius: 8,
                              cursor: 'pointer', fontSize: 14, color: temaOscuro ? '#f3f4f6' : '#191c1e',
                              textAlign: 'left', transition: 'background 0.1s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = temaOscuro ? '#1f2937' : '#edeef0')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 20, color: temaOscuro ? '#9ca3af' : '#554245' }}>person</span>
                            <div>
                              <div style={{ fontWeight: 500 }}>{u.nombre}</div>
                              <div style={{ fontSize: 11, color: temaOscuro ? '#9ca3af' : '#554245' }}>{u.email}</div>
                            </div>
                          </button>
                        ))}
                      {usuarios.filter(u => u.nombre.toLowerCase().includes(busqUsuario.toLowerCase()) || u.email.toLowerCase().includes(busqUsuario.toLowerCase())).length === 0 && (
                        <div style={{ textAlign: 'center', padding: 20, color: '#9CA3AF', fontSize: 13 }}>Sin resultados</div>
                      )}
                    </div>
                  )}
                </div>
                <div className={styles.modalActions} style={{ marginTop: 8 }}>
                  <button onClick={() => setPickerStep('choose')} className={styles.btnSecondary}>Atrás</button>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Ahora';
  if (mins < 60) return `${mins}m transcurrido`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h transcurrido${hours > 1 ? 's' : ''}`;
  const days = Math.floor(hours / 24);
  return `${days}d atrás`;
}
