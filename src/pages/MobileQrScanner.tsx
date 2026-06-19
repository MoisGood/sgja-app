import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { supabase } from '../lib/supabase';
import { useTheme } from '../hooks/useTheme';
import styles from '../styles/mobile-qr.module.css';

interface Props {
  idEstablecimiento: string;
  nombre: string;
  apellidos: string;
}

interface TicketInfo {
  id: string;
  tipo_requerimiento: string;
  descripcion: string;
  estado: string;
  prioridad: string;
  created_at: string;
}

interface LugarInfo {
  id: string;
  nombre: string;
  piso?: string;
  zona?: string;
}

interface QrScanData {
  lugar: LugarInfo;
  equiposCount: number;
  ticketsCount: number;
  tickets: TicketInfo[];
}

export default function MobileQrScanner({ idEstablecimiento, nombre, apellidos }: Props) {
  const navigate = useNavigate();
  const { temaOscuro, setTemaOscuro } = useTheme();
  const [camError, setCamError] = useState('');
  const [scanKey, setScanKey] = useState(0);
  const [scanData, setScanData] = useState<QrScanData | null>(null);
  const [loading, setLoading] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [videoTrack, setVideoTrack] = useState<MediaStreamTrack | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerRef = useRef<HTMLDivElement>(null);
  const cleanupDone = useRef(false);

  const nombreCompleto = nombre || apellidos ? `${nombre} ${apellidos}`.trim() : 'Técnico de Soporte';

  // Inicializar escáner cuando no hay datos escaneados
  useEffect(() => {
    if (scanData) return;

    let activo = true;
    const readerId = `m-qr-reader-${scanKey}`;

    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCamError('Tu navegador no soporta acceso a cámara.');
        return;
      }
      try {
        const testStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        testStream.getTracks().forEach(t => t.stop());
      } catch {
        setCamError('Permiso de cámara denegado');
        return;
      }
      await new Promise(r => setTimeout(r, 200));
      if (!activo) return;

      const el = readerRef.current;
      if (!el) return;
      // html5-qrcode necesita un ID; creamos un div interno con ID único
      let inner = el.querySelector(`#${readerId}`) as HTMLElement;
      if (!inner) {
        inner = document.createElement('div');
        inner.id = readerId;
        inner.style.width = '100%';
        inner.style.height = '100%';
        el.appendChild(inner);
      }

      try {
        const scanner = new Html5Qrcode(readerId);
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (texto) => {
            if (!activo) return;
            const match = texto.match(/[?&]c=([^&]+)/);
            const codigo = match ? decodeURIComponent(match[1]) : texto;
            handleScan(codigo);
          },
          () => {},
        );
        // Solo asignar ref si aún activo y start() completó
        if (!activo) { scanner.stop().catch(() => {}); return; }
        scannerRef.current = scanner;
        cleanupDone.current = false;
        // Guardar track para torch
        const video = inner.querySelector('video') as HTMLVideoElement;
        const stream = video?.srcObject as MediaStream;
        if (stream) {
          const track = stream.getVideoTracks()[0];
          if (track) setVideoTrack(track);
        }
      } catch (err: any) {
        if (!activo) return;
        const msg = err?.message || '';
        if (msg.includes('NotAllowed') || msg.includes('Permission')) setCamError('Permiso denegado');
        else if (msg.includes('NotFound')) setCamError('No se detectó cámara');
        else if (msg.includes('NotReadable')) setCamError('Cámara ocupada por otra app');
        else setCamError('No se pudo acceder a la cámara');
      }
    })();

    return () => {
      activo = false;
      const s = scannerRef.current;
      if (s && !cleanupDone.current) {
        cleanupDone.current = true;
        scannerRef.current = null;
        s.stop()
          .then(() => s.clear())
          .catch(() => {})
          .finally(() => {
            const el = readerRef.current;
            if (el) {
              while (el.firstChild) {
                el.removeChild(el.firstChild);
              }
            }
          });
      }
    };
  }, [scanKey, scanData]);

  const handleScan = async (codigo: string) => {
    if (!idEstablecimiento) {
      setCamError('No se ha configurado el establecimiento');
      return;
    }
    
    setLoading(true);
    try {
      // 1. Buscar en qr_codes
      const { data: qr } = await supabase
        .from('qr_codes')
        .select('tipo, id_referencia')
        .eq('codigo', codigo)
        .eq('activo', true)
        .maybeSingle();

      let idLugar: string | null = null;

      if (qr) {
        if (qr.tipo === 'lugar') {
          idLugar = qr.id_referencia;
        } else if (qr.tipo === 'equipo') {
          // Lookup secundario en equipos para obtener id_lugar
          const { data: eq } = await supabase
            .from('equipos')
            .select('id_lugar')
            .eq('id', qr.id_referencia)
            .eq('activo', true)
            .maybeSingle();
          if (eq) idLugar = eq.id_lugar;
        }
      } else {
        // Fallback: buscar por nombre en lugares
        const { data: lugares } = await supabase
          .from('lugares')
          .select('id')
          .ilike('nombre', codigo)
          .eq('activo', true)
          .limit(1);
        if (lugares && lugares.length > 0) {
          idLugar = lugares[0].id;
        }
      }

      if (!idLugar) {
        setCamError(`Código "${codigo}" no encontrado`);
        setLoading(false);
        return;
      }

      // 2. Obtener datos del lugar
      const { data: lugarData } = await supabase
        .from('lugares')
        .select('id, nombre, piso, zona')
        .eq('id', idLugar)
        .eq('activo', true)
        .single();

      if (!lugarData) {
        setCamError('No se encontró información del lugar');
        setLoading(false);
        return;
      }

      // 3. Contar equipos
      const { count: equiposCount } = await supabase
        .from('equipos')
        .select('*', { count: 'exact', head: true })
        .eq('id_lugar', idLugar)
        .eq('activo', true);

      // 4. Obtener tickets activos
      const { data: tickets } = await supabase
        .from('requerimientos')
        .select('id, tipo_requerimiento, descripcion, estado, prioridad, created_at')
        .eq('id_lugar', idLugar)
        .eq('activo', true)
        .not('estado', 'in', '("Completada","Cancelada")')
        .order('created_at', { ascending: false })
        .limit(10);

      const ticketsCount = tickets?.length || 0;

      setScanData({
        lugar: lugarData,
        equiposCount: equiposCount || 0,
        ticketsCount,
        tickets: tickets || [],
      });
      setLoading(false);
    } catch (err) {
      console.error('Error al procesar QR:', err);
      setCamError('Error al procesar el código QR');
      setLoading(false);
    }
  };

  const toggleTorch = async () => {
    if (!videoTrack) return;
    try {
      const capabilities = videoTrack.getCapabilities() as any;
      if (capabilities?.torch) {
        await videoTrack.applyConstraints({
          advanced: [{ torch: !torchOn }],
        } as any);
        setTorchOn(!torchOn);
      }
    } catch (err) {
      console.error('Error al toggle torch:', err);
    }
  };

  const reescanear = () => {
    setScanData(null);
    setCamError('');
    setScanKey(k => k + 1);
    setTorchOn(false);
  };

  const irATicket = (ticketId: string) => {
    navigate(`/ticket?ticket=${ticketId}`);
  };

  const verEquipos = () => {
    if (scanData?.lugar.id) {
      navigate(`/tecnico/m/equipos?id_lugar=${scanData.lugar.id}`);
    }
  };

  const crearTicket = () => {
    if (scanData?.lugar.id) {
      navigate(`/ticket?lugar=${scanData.lugar.id}`);
    }
  };

  // Estado: Error de cámara
  if (camError) {
    return (
      <div className={styles.container}>
        <header className={styles.topAppBar}>
          <div className={styles.topAppBarLeft}>
            <button className={styles.iconBtn} onClick={() => navigate('/tecnico/m/inicio')}>
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>arrow_back</span>
            </button>
            <h1 className={styles.appTitle}>Soporte TI</h1>
          </div>
          <div className={styles.topAppBarRight}>
            <button className={styles.iconBtn} onClick={reescanear} title="Reiniciar escáner">
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>qr_code_scanner</span>
            </button>
            <button className={styles.iconBtn} onClick={() => setTemaOscuro(!temaOscuro)} title={temaOscuro ? 'Modo claro' : 'Modo oscuro'}>
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>{temaOscuro ? 'light_mode' : 'dark_mode'}</span>
            </button>
          </div>
        </header>
        <div className={styles.errorState}>
          <div className={styles.errorIcon}>
            <span className="material-symbols-outlined" style={{ fontSize: 48 }}>error</span>
          </div>
          <p className={styles.errorText}>{camError}</p>
          <div className={styles.errorActions}>
            <button className={styles.btnRetry} onClick={reescanear}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>refresh</span>
              Reintentar
            </button>
            <button className={styles.btnBack} onClick={() => navigate('/tecnico/m/inicio')}>
              Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Estado: Escaneando (cámara activa)
  if (!scanData && !loading) {
    return (
      <div className={styles.container}>
        <header className={styles.topAppBar}>
          <div className={styles.topAppBarLeft}>
            <button className={styles.iconBtn} onClick={() => navigate('/tecnico/m/inicio')}>
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>arrow_back</span>
            </button>
            <h1 className={styles.appTitle}>Soporte TI</h1>
          </div>
          <div className={styles.topAppBarRight}>
            <button className={styles.iconBtn} onClick={reescanear} title="Reiniciar escáner">
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>qr_code_scanner</span>
            </button>
            <button className={styles.iconBtn} onClick={() => setTemaOscuro(!temaOscuro)} title={temaOscuro ? 'Modo claro' : 'Modo oscuro'}>
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>{temaOscuro ? 'light_mode' : 'dark_mode'}</span>
            </button>
          </div>
        </header>

        <div className={styles.viewfinder}>
          <div ref={readerRef} className={styles.cameraFeed} />

          <div className={styles.overlay}>
            <div className={styles.overlayDark} />
            <div className={styles.qrFrame}>
              <div className={styles.qrFrameBorder} />
              <div className={`${styles.corner} ${styles.cornerTl}`} />
              <div className={`${styles.corner} ${styles.cornerTr}`} />
              <div className={`${styles.corner} ${styles.cornerBl}`} />
              <div className={`${styles.corner} ${styles.cornerBr}`} />
              <div className={styles.scanLine} />
            </div>
          </div>

          <div className={styles.scanHint}>
            <span className="material-symbols-outlined" style={{ fontSize: 14, marginRight: 6, verticalAlign: 'middle' }}>qr_code_scanner</span>
            Alinee el Código QR
          </div>

          <div className={styles.focusControls}>
            <button className={styles.focusBtn} onClick={toggleTorch} title={torchOn ? 'Apagar linterna' : 'Encender linterna'}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                {torchOn ? 'flashlight_off' : 'flashlight_on'}
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Estado: Loading
  if (loading) {
    return (
      <div className={styles.container}>
        <header className={styles.topAppBar}>
          <div className={styles.topAppBarLeft}>
            <button className={styles.iconBtn} onClick={() => navigate('/tecnico/m/inicio')}>
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>arrow_back</span>
            </button>
            <h1 className={styles.appTitle}>Soporte TI</h1>
          </div>
          <div className={styles.topAppBarRight}>
            <button className={styles.iconBtn} onClick={reescanear} title="Reiniciar escáner">
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>qr_code_scanner</span>
            </button>
            <button className={styles.iconBtn} onClick={() => setTemaOscuro(!temaOscuro)} title={temaOscuro ? 'Modo claro' : 'Modo oscuro'}>
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>{temaOscuro ? 'light_mode' : 'dark_mode'}</span>
            </button>
          </div>
        </header>
        <div className={styles.loading}>
          <span className="material-symbols-outlined" style={{ fontSize: 32 }}>qr_code_scanner</span>
          <p>Procesando código QR...</p>
        </div>
      </div>
    );
  }

  // Estado: Datos escaneados (mostrar info card)
  return (
    <div className={styles.container}>
      <header className={styles.topAppBar}>
        <div className={styles.topAppBarLeft}>
          <button className={styles.iconBtn} onClick={() => navigate('/tecnico/m/inicio')}>
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>arrow_back</span>
          </button>
          <h1 className={styles.appTitle}>Soporte TI</h1>
        </div>
        <div className={styles.topAppBarRight}>
            <button className={styles.iconBtn} onClick={reescanear} title="Escanear otro QR">
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>qr_code_scanner</span>
            </button>

        </div>
      </header>

      <div className={styles.viewfinder}>
        <div ref={readerRef} className={styles.cameraFeed} />
        <div className={styles.overlay}>
          <div className={styles.overlayDark} />
          <div className={styles.qrFrame}>
            <div className={styles.qrFrameBorder} />
            <div className={`${styles.corner} ${styles.cornerTl}`} />
            <div className={`${styles.corner} ${styles.cornerTr}`} />
            <div className={`${styles.corner} ${styles.cornerBl}`} />
            <div className={`${styles.corner} ${styles.cornerBr}`} />
          </div>
        </div>
        <div className={styles.scanHint}>
          <span className="material-symbols-outlined" style={{ fontSize: 14, marginRight: 6, verticalAlign: 'middle' }}>check_circle</span>
          Código detectado
        </div>
      </div>

      {/* Info Card */}
      <div className={styles.infoCard}>
        <div className={styles.infoCardHeader}>
          <div>
            <p className={styles.infoCardLabel}>Ubicación Escaneada</p>
            <h3 className={styles.infoCardLocation}>
              {scanData?.lugar.nombre || 'Sala desconocida'}
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: temaOscuro ? '#ffb1c2' : '#5c0427' }}>verified</span>
            </h3>
            {scanData?.lugar.piso && (
              <p className={styles.infoCardSublabel}>
                {scanData.lugar.zona || ''} {scanData.lugar.piso}
              </p>
            )}
          </div>
          {scanData && scanData.ticketsCount > 0 && (
            <span className={styles.infoBadgeError}>
              <span className="material-symbols-outlined" style={{ fontSize: 12 }}>warning</span>
              {scanData.ticketsCount} {scanData.ticketsCount === 1 ? 'Ticket' : 'Tickets'}
            </span>
          )}
          {scanData && scanData.ticketsCount === 0 && (
            <span className={styles.infoBadgeSuccess}>
              <span className="material-symbols-outlined" style={{ fontSize: 12 }}>check_circle</span>
              Sin incidencias
            </span>
          )}
        </div>

        {/* Stats Grid */}
        <div className={styles.infoStats}>
          <div className={styles.infoStat}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: temaOscuro ? '#9ca3af' : '#595f67', marginBottom: 4 }}>desktop_windows</span>
            <p className={styles.infoStatValue}>{scanData?.equiposCount || 0}</p>
            <p className={styles.infoStatLabel}>Equipos Instalados</p>
          </div>
          <div className={`${styles.infoStat} ${styles.infoStatTickets}`}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: temaOscuro ? '#93caff' : '#004182', marginBottom: 4 }}>confirmation_number</span>
            <p className={styles.infoStatValue} style={{ color: temaOscuro ? '#93caff' : '#004182' }}>{scanData?.ticketsCount || 0}</p>
            <p className={styles.infoStatLabel} style={{ color: temaOscuro ? '#93caff' : '#00468b' }}>Tickets Activos</p>
          </div>
        </div>

        {/* Tickets list */}
        {scanData && scanData.tickets.length > 0 && (
          <div className={styles.ticketsList}>
            <p className={styles.ticketsLabel}>Tickets activos</p>
            {scanData.tickets.map(ticket => (
              <div
                key={ticket.id}
                className={styles.ticketItem}
                onClick={() => irATicket(ticket.id)}
              >
                <div className={styles.ticketItemLeft}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: temaOscuro ? '#93caff' : '#004182' }}>confirmation_number</span>
                  <div className={styles.ticketItemInfo}>
                    <p className={styles.ticketItemTitle}>{ticket.tipo_requerimiento}</p>
                    <p className={styles.ticketItemDesc}>{ticket.descripcion}</p>
                  </div>
                </div>
                <span className={`${styles.ticketBadge} ${ticket.estado === 'En Proceso' ? styles.ticketBadgeProceso : styles.ticketBadgePendiente}`}>
                  {ticket.estado}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className={styles.infoActions}>
          <button className={styles.btnPrimary} onClick={verEquipos}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, marginRight: 6, verticalAlign: 'middle' }}>inventory</span>
            Ver Equipos
          </button>
          <button className={styles.btnSecondary} onClick={crearTicket}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, marginRight: 6, verticalAlign: 'middle' }}>add_circle</span>
            Crear Ticket en esta Sala
          </button>
        </div>
      </div>

      {/* Technician Context */}
      <div className={styles.techContext}>
        <div className={styles.techAvatar}>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>badge</span>
        </div>
        <div className={styles.techInfo}>
          <p className={styles.techName}>{nombreCompleto}</p>
          <p className={styles.techStatus}>Activo en campus</p>
        </div>
        <span className={styles.techBadge}>En línea</span>
      </div>
    </div>
  );
}
