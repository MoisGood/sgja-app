import { useState, useEffect, useRef } from 'react';
import { obtenerAusenciasActivas } from '../services/funcionarioAusencias';

interface AusenciaRow {
  id: string;
  rut_funcionario: string;
  tipo: string;
  funcionarios: { nombre_completo: string } | null;
}

export default function NotificacionCampana() {
  const [ausencias, setAusencias] = useState<AusenciaRow[]>([]);
  const [prevCount, setPrevCount] = useState(0);
  const [sacudir, setSacudir] = useState(false);
  const [mostrarTooltip, setMostrarTooltip] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const tooltipTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    audioRef.current = new Audio('/notification.mp3');
    cargar();
    const interval = setInterval(cargar, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        setMostrarTooltip(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function cargar() {
    try {
      const data = await obtenerAusenciasActivas() as AusenciaRow[];
      setAusencias(data);
      if (data.length > prevCount && prevCount > 0) {
        setSacudir(true);
        audioRef.current?.play().catch(() => {});
        setTimeout(() => setSacudir(false), 600);
      }
      setPrevCount(data.length);
    } catch {}
  }

  const nombres = ausencias
    .map(a => a.funcionarios?.nombre_completo)
    .filter((n): n is string => !!n);

  const ultimos10 = [...ausencias]
    .reverse()
    .slice(0, 10)
    .map(a => a.funcionarios?.nombre_completo)
    .filter((n): n is string => !!n);

  return (
    <>
      <div
        ref={tooltipRef}
        onMouseEnter={() => {
          clearTimeout(tooltipTimer.current);
          setMostrarTooltip(true);
        }}
        onMouseLeave={() => {
          tooltipTimer.current = setTimeout(() => setMostrarTooltip(false), 200);
        }}
        onClick={() => { setMostrarModal(true); setMostrarTooltip(false); }}
        style={{
          position: 'relative', cursor: 'pointer', padding: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: '6px', fontSize: '22px', userSelect: 'none',
          animation: sacudir ? 'sacudir 0.6s ease' : 'none',
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {/* Contador de ausencias */}
        {ausencias.length > 0 && (
          <span style={{
            position: 'absolute', top: '2px', right: '2px', width: '16px', height: '16px',
            borderRadius: '50%', backgroundColor: '#ef4444', color: 'white',
            fontSize: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center',
            justifyContent: 'center',
          }}>
            {ausencias.length > 9 ? '9+' : ausencias.length}
          </span>
        )}

        {/* Tooltip */}
        {mostrarTooltip && (
          <div style={{
            position: 'absolute', top: '100%', right: '0', zIndex: 1000,
            backgroundColor: '#1f2937', color: 'white', padding: '8px 12px',
            borderRadius: '8px', fontSize: '12px', minWidth: '210px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)', pointerEvents: 'none',
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px', borderBottom: '1px solid #374151', paddingBottom: '4px' }}>
              Ausentes ({nombres.length})
            </div>
            {nombres.length === 0 ? (
              <div style={{ color: '#9ca3af', fontStyle: 'italic', padding: '4px 0' }}>Sin ausencias</div>
            ) : (
              nombres.slice(0, 15).map((n, i) => (
                <div key={`${n}-${i}`} style={{ padding: '2px 0', fontSize: '12px' }}>{n}</div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {mostrarModal && (
        <button type="button" onClick={() => setMostrarModal(false)} style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', border: 'none',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            backgroundColor: 'white', borderRadius: '12px', padding: '24px',
            minWidth: '360px', maxWidth: '480px', width: '90%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', color: '#1a3c6b' }}>
                Últimas ausencias registradas
              </h2>
              <button type="button" onClick={() => setMostrarModal(false)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '20px', color: '#999', padding: '4px 8px', borderRadius: '4px',
              }}>✕</button>
            </div>
            {ultimos10.length === 0 ? (
              <p style={{ color: '#999', fontStyle: 'italic' }}>Sin ausencias registradas</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {ultimos10.map((n, i) => (
                  <div key={`${n}-${i}`} style={{
                    padding: '8px 12px', backgroundColor: '#f9f9f9',
                    borderRadius: '6px', fontSize: '14px', fontWeight: 500,
                  }}>
                    {n}
                  </div>
                ))}
              </div>
            )}

            <button type="button" onClick={() => setMostrarModal(false)} style={{
              marginTop: '12px', width: '100%', padding: '10px',
              backgroundColor: '#1a3c6b', color: 'white', border: 'none',
              borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold',
            }}>
              Cerrar
            </button>
          </div>
        </button>
      )}

      <style>{`
        @keyframes sacudir {
          0%, 100% { transform: rotate(0deg); }
          10%, 30% { transform: rotate(-15deg); }
          20%, 40% { transform: rotate(15deg); }
          50% { transform: rotate(-10deg); }
          60% { transform: rotate(10deg); }
        }
      `}</style>
    </>
  );
}
