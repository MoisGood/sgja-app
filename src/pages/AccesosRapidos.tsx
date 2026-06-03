import { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { supabase } from '../lib/supabase';

interface Props { idEstablecimiento: string }

interface Lugar { id: string; nombre: string; piso: number }
interface Equipo { id: string; nombre: string; id_lugar?: string }
interface ReqItem {
  id: string; tipo_requerimiento: string; descripcion: string;
  estado: string; prioridad: string; fecha_solicitud: string; created_at: string;
}

const PAGE_SIZE = 10;

export default function AccesosRapidos({ idEstablecimiento }: Props) {
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [lugarSel, setLugarSel] = useState('');
  const [equipoSel, setEquipoSel] = useState('');
  const [codigoTest, setCodigoTest] = useState('');
  // Scanner
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [escaneando, setEscaneando] = useState(false);
  const [ultimoScan, setUltimoScan] = useState('');
  const [camError, setCamError] = useState('');
  // Historial
  const [historial, setHistorial] = useState<ReqItem[]>([]);
  const [historialPage, setHistorialPage] = useState(0);
  const [historialTotal, setHistorialTotal] = useState(0);
  const [cargandoHist, setCargandoHist] = useState(false);

  useEffect(() => {
    if (idEstablecimiento) load();
    return () => { if (scannerRef.current) { scannerRef.current.stop().catch(() => {}); } };
  }, [idEstablecimiento]);

  function load() {
    Promise.all([
      supabase.from('lugares').select('id,nombre,piso').eq('id_establecimiento', idEstablecimiento).eq('activo', true).eq('soporte', true).order('nombre'),
      supabase.from('equipos').select('id,nombre,id_lugar').eq('id_establecimiento', idEstablecimiento).eq('activo', true).order('nombre'),
    ]).then(([lugRes, eqRes]) => {
      if (lugRes.data) setLugares(lugRes.data);
      if (eqRes.data) setEquipos(eqRes.data);
    });
    cargarHistorial(0);
  }

  async function cargarHistorial(page: number) {
    setCargandoHist(true);
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const [countRes, dataRes] = await Promise.all([
      supabase.from('requerimientos').select('id', { count: 'exact', head: true }).eq('id_establecimiento', idEstablecimiento).eq('activo', true),
      supabase.from('requerimientos').select('id,tipo_requerimiento,descripcion,estado,prioridad,fecha_solicitud,created_at')
        .eq('id_establecimiento', idEstablecimiento).eq('activo', true)
        .order('created_at', { ascending: false }).range(from, to),
    ]);
    if (countRes.count !== null) setHistorialTotal(countRes.count);
    if (dataRes.data) setHistorial(dataRes.data as ReqItem[]);
    setHistorialPage(page);
    setCargandoHist(false);
  }

  const totalPages = Math.ceil(historialTotal / PAGE_SIZE);

  const equiposFiltrados = equipos.filter(e => !lugarSel || e.id_lugar === lugarSel);

  const irA = (ruta: string) => {
    window.location.hash = ruta;
  };

  const irTicket = () => {
    const params = new URLSearchParams();
    if (equipoSel) params.set('equipo', equipoSel);
    else if (lugarSel) params.set('lugar', lugarSel);
    irA(params.toString() ? `/ticket?${params.toString()}` : '/ticket');
  };

  async function iniciarScanner() {
    setCamError('');
    if (escaneando) { detenerScanner(); return; }
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamError('Tu navegador no soporta acceso a cámara. Usa la entrada manual.');
      return;
    }
    setEscaneando(true);
    await new Promise(r => setTimeout(r, 50));
    try {
      const testStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      testStream.getTracks().forEach(t => t.stop());
    } catch (testErr: any) {
      detenerScanner();
      const msg = testErr?.message || '';
      if (msg.includes('NotAllowed') || msg.includes('Permission')) {
        setCamError('Permiso de cámara denegado');
      } else if (msg.includes('NotFound')) {
        setCamError('No se detectó cámara');
      } else {
        setCamError('Cámara no disponible: ' + (testErr?.message || 'error'));
      }
      return;
    }
    try {
      const el = document.getElementById('qr-reader');
      if (!el) { setCamError('Error interno'); detenerScanner(); return; }
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (texto) => {
          setUltimoScan(texto);
          detenerScanner();
          const match = texto.match(/[?&]c=([^&]+)/);
          const codigo = match ? decodeURIComponent(match[1]) : texto;
          irA(`/tecnico/qr?c=${encodeURIComponent(codigo)}`);
        },
        () => {},
      );
    } catch (err: any) {
      detenerScanner();
      const msg = err?.message || '';
      if (msg.includes('NotAllowed') || msg.includes('Permission')) {
        setCamError('Permiso denegado');
      } else if (msg.includes('NotFound')) {
        setCamError('No se detectó cámara');
      } else if (msg.includes('NotReadable')) {
        setCamError('Cámara ocupada por otra app');
      } else {
        setCamError('No se pudo acceder a la cámara');
      }
    }
  }

  function detenerScanner() {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
    setEscaneando(false);
  }

  const sCard: React.CSSProperties = {
    background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12,
    padding: 16, marginBottom: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  };
  const sTitle: React.CSSProperties = {
    fontSize: 15, fontWeight: 600, color: '#1A3C6B', margin: '0 0 10px',
  };
  const sInp: React.CSSProperties = {
    width: '100%', padding: '8px 10px', borderRadius: 6,
    border: '1px solid #E5E7EB', background: '#fff', color: '#1F2937',
    fontSize: 14, boxSizing: 'border-box',
  };
  const sBtn: React.CSSProperties = {
    padding: '6px 14px', borderRadius: 6, border: 'none',
    background: '#1e40af', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
  };

  const tagColor = (estado: string) => {
    const m: Record<string, string> = {
      Completada: '#166534', 'En Proceso': '#0c4a6e',
      Pendiente: '#92400e', Cancelada: '#991b1b',
    };
    return m[estado] || '#6b7280';
  };
  const tagBg = (estado: string) => {
    const m: Record<string, string> = {
      Completada: '#dcfce7', 'En Proceso': '#dbeafe',
      Pendiente: '#fef3c7', Cancelada: '#fee2e2',
    };
    return m[estado] || '#f3f4f6';
  };

  return (
    <div style={{ padding: 16, maxWidth: 500, margin: '0 auto' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1A3C6B', margin: '0 0 2px' }}>🔧 Módulo Técnico</h1>
      <p style={{ color: '#6B7280', fontSize: 12, marginBottom: 16 }}>SGJA — Soporte y mantención</p>

      {/* QR Scanner */}
      <div style={sCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h2 style={sTitle}>📷 Escanear QR</h2>
          <button onClick={iniciarScanner} style={{
            ...sBtn, background: escaneando ? '#dc2626' : '#1e40af',
          }}>
            {escaneando ? '⏹ Detener' : '📸 Cámara'}
          </button>
        </div>
        <div id="qr-reader" style={{
          width: '100%', maxWidth: 320, margin: '0 auto', borderRadius: 8, overflow: 'hidden',
          minHeight: escaneando ? 250 : 0,
        }} />
        {escaneando && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8 }}>
            <button onClick={detenerScanner} style={{
              padding: '8px 24px', borderRadius: 6, border: 'none',
              background: '#dc2626', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
              ✕ Cancelar escaneo
            </button>
          </div>
        )}
        {ultimoScan && (
          <p style={{ fontSize: 11, color: '#16a34a', marginTop: 6 }}>Último: {ultimoScan}</p>
        )}
        {camError && (
          <p style={{ fontSize: 11, color: '#dc2626', marginTop: 6, lineHeight: 1.4 }}>⚠️ {camError}</p>
        )}
        {/* Entrada manual */}
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <input
            value={codigoTest}
            onChange={e => setCodigoTest(e.target.value)}
            placeholder="O escribe código manualmente"
            style={{ ...sInp, flex: 1, fontSize: 12 }}
            onKeyDown={e => { if (e.key === 'Enter' && codigoTest.trim()) irA(`/tecnico/qr?c=${encodeURIComponent(codigoTest.trim())}`); }}
          />
          <button onClick={() => { if (codigoTest.trim()) irA(`/tecnico/qr?c=${encodeURIComponent(codigoTest.trim())}`); }} style={sBtn}>Ir</button>
        </div>
      </div>

      {/* Ticket rápido */}
      <div style={sCard}>
        <h2 style={sTitle}>🆘 Ticket Rápido</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <select value={lugarSel} onChange={e => { setLugarSel(e.target.value); setEquipoSel(''); }} style={sInp}>
            <option value="">📍 Selecciona un lugar</option>
            {lugares.map(l => <option key={l.id} value={l.id}>{l.nombre} (Piso {l.piso})</option>)}
          </select>
          <select value={equipoSel} onChange={e => setEquipoSel(e.target.value)} style={sInp} disabled={!lugarSel}>
            <option value="">🔧 Todos los equipos</option>
            {equiposFiltrados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
          <button onClick={irTicket} style={{
            width: '100%', padding: '10px', borderRadius: 8, border: 'none',
            background: '#059669', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>
            🚀 Ir al Ticket
          </button>
        </div>
      </div>

      {/* Historial reciente */}
      <div style={sCard}>
        <h2 style={sTitle}>📋 Historial Reciente</h2>
        {cargandoHist ? (
          <p style={{ color: '#9CA3AF', fontSize: 12, textAlign: 'center', padding: 12 }}>⏳ Cargando…</p>
        ) : historial.length === 0 ? (
          <p style={{ color: '#9CA3AF', fontSize: 12, textAlign: 'center', padding: 12 }}>Sin requerimientos</p>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {historial.map(h => (
                <div key={h.id} style={{
                  padding: '8px 10px', background: '#F9FAFB', borderRadius: 8,
                  border: '1px solid #F3F4F6', fontSize: 12,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: '#1F2937' }}>{h.tipo_requerimiento}</span>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <span style={{ fontSize: 10, color: '#6B7280', background: '#E5E7EB', padding: '1px 6px', borderRadius: 4 }}>{h.prioridad}</span>
                      <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, fontWeight: 500, background: tagBg(h.estado), color: tagColor(h.estado) }}>{h.estado}</span>
                    </div>
                  </div>
                  <p style={{ margin: '2px 0 0', color: '#6B7280', fontSize: 11, lineHeight: 1.3 }}>{h.descripcion}</p>
                  <span style={{ color: '#9CA3AF', fontSize: 10, marginTop: 2, display: 'block' }}>
                    {new Date(h.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
            {/* Paginación */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 10 }}>
                <button
                  disabled={historialPage === 0}
                  onClick={() => cargarHistorial(historialPage - 1)}
                  style={{ ...sBtn, background: historialPage === 0 ? '#9CA3AF' : '#1e40af', fontSize: 11 }}
                >
                  ← Anterior
                </button>
                <span style={{ fontSize: 11, color: '#6B7280' }}>
                  Pág. {historialPage + 1} de {totalPages}
                </span>
                <button
                  disabled={historialPage >= totalPages - 1}
                  onClick={() => cargarHistorial(historialPage + 1)}
                  style={{ ...sBtn, background: historialPage >= totalPages - 1 ? '#9CA3AF' : '#1e40af', fontSize: 11 }}
                >
                  Siguiente →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Ver menú principal */}
      <button onClick={() => irA('/tecnico/menu')} style={{
        width: '100%', padding: '12px', borderRadius: 10, border: '1px solid #1A3C6B',
        background: '#fff', color: '#1A3C6B', fontSize: 14, fontWeight: 600, cursor: 'pointer',
        marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      }}>
        📋 Ver menú principal
      </button>

  

      <p style={{ color: '#9CA3AF', fontSize: 10, textAlign: 'center', marginTop: 16 }}>
        SGJA · Módulo Técnico v1
      </p>
    </div>
  );
}
