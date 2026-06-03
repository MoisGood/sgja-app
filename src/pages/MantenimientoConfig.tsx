import { useState, useEffect } from 'react';
import { obtenerEstadoMantenimiento, toggleMantenimiento, actualizarHorario, invalidarCacheMantenimiento } from '../services/mantenimientoService';
import Button from '../components/Common/Button';

function toAmPm(hora: string): string {
  const [h, m] = hora.split(':').map(Number);
  const p = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${p}`;
}

export default function MantenimientoConfig({ idEstablecimiento }: { idEstablecimiento: string }) {
  const [cargando, setCargando] = useState(true);
  const [activo, setActivo] = useState(false);
  const [modo, setModo] = useState('manual');
  const [desde, setDesde] = useState('07:00');
  const [hasta, setHasta] = useState('17:00');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setCargando(true);
      const mtto = await obtenerEstadoMantenimiento(idEstablecimiento);
      setActivo(mtto.activo);
      setModo(mtto.modo);
      setDesde(mtto.desde);
      setHasta(mtto.hasta);
      setCargando(false);
    })();
  }, [idEstablecimiento]);

  const guardar = async () => {
    setGuardando(true);
    setError(null);
    setExito(null);
    const r1 = await toggleMantenimiento(idEstablecimiento, activo, modo);
    if (r1.error) { setError(r1.error); setGuardando(false); return; }
    const r2 = await actualizarHorario(idEstablecimiento, desde, hasta);
    if (r2.error) { setError(r2.error); setGuardando(false); return; }
    invalidarCacheMantenimiento();
    setExito('Configuración guardada');
    setTimeout(() => setExito(null), 3000);
    setGuardando(false);
  };

  const inputStyle: React.CSSProperties = { padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', width: '100%' };

  if (cargando) return <p style={{ color: '#6B7280', padding: '40px', textAlign: 'center' }}>Cargando…</p>;

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#1A3C6B', marginBottom: '24px' }}>Configuración del Sistema</h1>
      <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '24px', maxWidth: '600px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#374151', marginBottom: '16px' }}>Mantenimiento</h2>
        <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '16px' }}>
          Los usuarios ADMIN siempre pueden entrar. El resto queda bloqueado según el modo seleccionado.
        </p>

        {/* Modo */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Modo de restricción</label>
          <div style={{ display: 'flex', gap: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
              <input type="radio" name="modo" value="manual" checked={modo === 'manual'} onChange={() => setModo('manual')} />
              Manual — Bloquea al activar el switch
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
              <input type="radio" name="modo" value="horario" checked={modo === 'horario'} onChange={() => setModo('horario')} />
              Horario — Bloquea fuera del horario
            </label>
          </div>
        </div>

        {/* Switch */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', cursor: modo === 'horario' ? 'not-allowed' : 'pointer' }}>
            <input type="checkbox" checked={activo} disabled={modo === 'horario'} onChange={e => setActivo(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
            <span style={{
              position: 'absolute', inset: 0, backgroundColor: activo ? '#EF4444' : '#D1D5DB', borderRadius: '24px', transition: '0.3s', opacity: modo === 'horario' ? 0.5 : 1,
              display: 'flex', alignItems: 'center', padding: '2px',
            }}>
              <span style={{
                height: '20px', width: '20px', backgroundColor: '#FFFFFF', borderRadius: '50%', transition: '0.3s', transform: activo ? 'translateX(20px)' : 'translateX(0)',
              }} />
            </span>
          </label>
          <span style={{ fontSize: '14px', fontWeight: 600, color: activo ? '#EF4444' : '#374151' }}>
            {modo === 'horario' ? 'Por horario' : activo ? 'Activado' : 'Desactivado'}
          </span>
        </div>

        {/* Horario */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Desde</label>
            <input type="time" value={desde} onChange={e => setDesde(e.target.value)} style={inputStyle} />
            <span style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px', display: 'block' }}>{toAmPm(desde)}</span>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Hasta</label>
            <input type="time" value={hasta} onChange={e => setHasta(e.target.value)} style={inputStyle} />
            <span style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px', display: 'block' }}>{toAmPm(hasta)}</span>
          </div>
        </div>

        {error && <p style={{ color: '#DC2626', fontSize: '13px', marginBottom: '12px' }}>{error}</p>}
        {exito && <p style={{ color: '#10B981', fontSize: '13px', marginBottom: '12px' }}>{exito}</p>}

        <Button onClick={guardar} tipo="primario" cargando={guardando}>Guardar</Button>
      </div>
    </div>
  );
}
