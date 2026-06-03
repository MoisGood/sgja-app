import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import {
  guardarConfiguracionInactividad,
  obtenerConfiguracionInactividad
} from '../services/online';
import '../styles/seguridad.css';

export default function Seguridad() {
  const { uid: usuarioActualId, idEstablecimiento } = useAuth();
  const [minutosInactividad, setMinutosInactividad] = useState(30);
  const [inactivityEnabled, setInactivityEnabled] = useState(false);
  const [cargandoConfig, setCargandoConfig] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'éxito' | 'error'; texto: string } | null>(null);

  const [roles2fa, setRoles2fa] = useState<Array<{ rol: string; activo: boolean }>>([]);
  const [cargandoRoles, setCargandoRoles] = useState(true);

  const [reverifyMinutes, setReverifyMinutes] = useState(60);

  const [palabras, setPalabras] = useState<Array<{ id: string; palabra: string; categoria: string | null }>>([]);
  const [nuevaPalabra, setNuevaPalabra] = useState('');
  const [nuevaCategoria, setNuevaCategoria] = useState('');
  const [cargandoPalabras, setCargandoPalabras] = useState(true);
  const [categoriasExpandidas, setCategoriasExpandidas] = useState<Set<string>>(new Set());

  useEffect(() => {
    cargarConfiguracion();
    cargarRoles2FA();
    cargarReverify();
    cargarPalabras();
  }, [usuarioActualId, idEstablecimiento]);

  const cargarConfiguracion = async () => {
    try {
      if (!usuarioActualId) return;
      const config = await obtenerConfiguracionInactividad(usuarioActualId);
      setInactivityEnabled(config?.cerrarAutomatico || false);
      setMinutosInactividad(config?.minutosInactividad || 30);
    } catch (error) {
      console.error('Error al cargar configuración:', error);
    }
  };

  const handleGuardarInactividad = async () => {
    try {
      setCargandoConfig(true);
      if (!usuarioActualId) throw new Error('No hay usuario activo');
      await guardarConfiguracionInactividad(usuarioActualId, minutosInactividad, inactivityEnabled);
      setMensaje({ tipo: 'éxito', texto: '✅ Configuración guardada correctamente' });
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      setMensaje({ tipo: 'error', texto: '❌ Error al guardar la configuración' });
    } finally {
      setCargandoConfig(false);
    }
  };

  const cargarRoles2FA = async () => {
    setCargandoRoles(true);
    const { data } = await supabase
      .from('usuarios')
      .select('rol, mfa_obligatorio');
    if (data) {
      const mapa = new Map<string, boolean>();
      for (const u of data) {
        if (u.mfa_obligatorio) mapa.set(u.rol, true);
        else if (!mapa.has(u.rol)) mapa.set(u.rol, false);
      }
      const orden = ['ADMIN', 'SECRETARIA', 'BIBLIOTECARIO', 'INSPECTOR', 'PROFESOR', 'ESTUDIANTE', 'APODERADO', 'FUNCIONARIO'];
      const roles = Array.from(mapa.entries())
        .sort((a, b) => {
          const ia = orden.indexOf(a[0]);
          const ib = orden.indexOf(b[0]);
          return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
        })
        .map(([rol, activo]) => ({ rol, activo }));
      setRoles2fa(roles);
    }
    setCargandoRoles(false);
  };

  const cargarReverify = async () => {
    if (!idEstablecimiento) return;
    const { data } = await supabase.from('email_config').select('reverify_minutos').eq('id_establecimiento', idEstablecimiento).eq('activo', true).maybeSingle();
    if (data?.reverify_minutos) setReverifyMinutes(data.reverify_minutos);
  };

  const handleGuardarReverify = async () => {
    if (!idEstablecimiento) { setMensaje({ tipo: 'error', texto: '❌ No hay establecimiento' }); return; }
    try {
      const { data: existing } = await supabase.from('email_config').select('id').eq('id_establecimiento', idEstablecimiento).eq('activo', true).maybeSingle();
      if (existing) {
        await supabase.from('email_config').update({ reverify_minutos: reverifyMinutes }).eq('id', existing.id);
      } else {
        await supabase.from('email_config').insert({ id_establecimiento: idEstablecimiento, email: '', app_password: '', reverify_minutos: reverifyMinutes, activo: true });
      }
      setMensaje({ tipo: 'éxito', texto: `✅ Tiempo de re-verificación guardado: ${reverifyMinutes} min` });
    } catch {
      setMensaje({ tipo: 'error', texto: '❌ Error al guardar' });
    }
  };

  const toggleRol2FA = async (rol: string, activar: boolean) => {
    setRoles2fa(prev => prev.map(r => r.rol === rol ? { ...r, activo: activar } : r));
    const { error } = await supabase
      .from('usuarios')
      .update({ mfa_obligatorio: activar })
      .eq('rol', rol);
    if (error) {
      setRoles2fa(prev => prev.map(r => r.rol === rol ? { ...r, activo: !activar } : r));
      setMensaje({ tipo: 'error', texto: `❌ Error al actualizar rol ${rol}` });
    } else {
      setMensaje({ tipo: 'éxito', texto: `✅ 2FA ${activar ? 'activado' : 'desactivado'} para rol ${rol}` });
    }
  };

  const rolesDisponibles = ['ADMIN', 'SECRETARIA', 'BIBLIOTECARIO', 'INSPECTOR', 'PROFESOR', 'ESTUDIANTE', 'APODERADO'];
  const categoriasDisponibles = [
    'Chilenismos',
    'Insultos compuestos chilenos',
    'Garabatos español general',
    'English profanity',
    'Violencia y amenazas',
    'Racismo y xenofobia',
    'Homofobia y transfobia',
    'Bullying y acoso',
    'Suicidio y autolesiones',
    'Drogas y sustancias ilegales',
    'Pornografía y contenido sexual',
  ];

  const cargarPalabras = async () => {
    if (!idEstablecimiento) { setCargandoPalabras(false); return; }
    setCargandoPalabras(true);
    const { data } = await supabase
      .from('palabras_bloqueadas')
      .select('id, palabra, categoria')
      .eq('id_establecimiento', idEstablecimiento)
      .eq('activo', true)
      .order('categoria', { ascending: true, nullsFirst: false })
      .order('palabra');
    if (data) setPalabras(data);
    setCargandoPalabras(false);
  };

  const agregarPalabra = async () => {
    const p = nuevaPalabra.trim().toLowerCase();
    if (!p || !idEstablecimiento) return;
    if (palabras.some(x => x.palabra === p)) {
      setMensaje({ tipo: 'error', texto: '⚠️ Esa palabra ya está en la lista' });
      return;
    }
    const payload: { palabra: string; id_establecimiento: string; categoria?: string } = { palabra: p, id_establecimiento: idEstablecimiento };
    if (nuevaCategoria) payload.categoria = nuevaCategoria;
    const { data, error } = await supabase
      .from('palabras_bloqueadas')
      .insert(payload)
      .select('id, palabra, categoria')
      .single();
    if (error || !data) {
      setMensaje({ tipo: 'error', texto: '❌ Error al agregar palabra' });
      return;
    }
    setPalabras(prev => [...prev, data].sort((a, b) => (a.categoria || '').localeCompare(b.categoria || '') || a.palabra.localeCompare(b.palabra)));
    setNuevaPalabra('');
    setMensaje({ tipo: 'éxito', texto: `✅ "${p}" agregada a la lista` });
  };

  const eliminarPalabra = async (id: string, palabra: string) => {
    const item = palabras.find(x => x.id === id);
    setPalabras(prev => prev.filter(x => x.id !== id));
    const { error } = await supabase
      .from('palabras_bloqueadas')
      .update({ activo: false })
      .eq('id', id);
    if (error) {
      if (item) setPalabras(prev => [...prev, item].sort((a, b) => (a.categoria || '').localeCompare(b.categoria || '') || a.palabra.localeCompare(b.palabra)));
      setMensaje({ tipo: 'error', texto: '❌ Error al eliminar palabra' });
    } else {
      setMensaje({ tipo: 'éxito', texto: `✅ "${palabra}" eliminada` });
    }
  };

  return (
    <div className="seguridad-container">
      <div className="seguridad-header">
        <h1 className="seguridad-title">🔐 Seguridad</h1>
        <p className="seguridad-subtitle">Configuración de seguridad del sistema</p>
      </div>

      {mensaje && (
        <div className={`seguridad-mensaje seguridad-mensaje-${mensaje.tipo}`}>
          {mensaje.texto}
        </div>
      )}

      {/* Inactividad */}
      <div className="seguridad-card">
        <h2 className="seguridad-card-title">⏱️ Tiempo de Inactividad</h2>
        <div className="configuracion-grid">
          <div className="configuracion-item">
            <label className="configuracion-label toggle-label">
              <input
                type="checkbox"
                checked={inactivityEnabled}
                onChange={e => setInactivityEnabled(e.target.checked)}
                className="toggle-input"
              />
              <span className="toggle-slider"></span>
              Activar cierre automático por inactividad
            </label>
          </div>
          <div className="configuracion-item">
            <label className="configuracion-label">Minutos de inactividad</label>
            <input
              type="number"
              value={minutosInactividad}
              onChange={e => setMinutosInactividad(Math.max(1, parseInt(e.target.value) || 30))}
              min="1" max="480"
              className="configuracion-input"
              disabled={!inactivityEnabled}
            />
          </div>
        </div>
        <button type="button" onClick={handleGuardarInactividad} disabled={cargandoConfig} className="btn-guardar">
          {cargandoConfig ? '⏳ Guardando...' : '💾 Guardar Configuración'}
        </button>
      </div>

      {/* 2FA por Roles */}
      <div className="seguridad-card">
        <h2 className="seguridad-card-title">🔐 Autenticación en Dos Pasos (2FA)</h2>
        <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 16px' }}>
          Activa 2FA por rol. Todos los usuarios del rol seleccionado deberán configurar 2FA en su próximo inicio de sesión.
        </p>
        {cargandoRoles ? (
          <p style={{ fontSize: '13px', color: '#6B7280' }}>⏳ Cargando roles...</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {rolesDisponibles.map(rol => {
              const estado = roles2fa.find(r => r.rol === rol);
              return (
                <label key={rol} style={{
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
                  border: '1px solid #E5E7EB', borderRadius: '8px', cursor: 'pointer',
                  background: estado?.activo ? '#EFF6FF' : '#FFF',
                  transition: 'background 0.15s'
                }}>
                  <input
                    type="checkbox"
                    checked={estado?.activo ?? false}
                    onChange={e => toggleRol2FA(rol, e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ fontWeight: 600, fontSize: '14px', color: '#1F2937', flex: 1 }}>{rol}</span>
                  <span style={{
                    fontSize: '12px', padding: '2px 8px', borderRadius: '4px',
                    background: estado?.activo ? '#DBEAFE' : '#F3F4F6',
                    color: estado?.activo ? '#1D4ED8' : '#6B7280'
                  }}>
                    {estado === undefined ? 'sin usuarios' : estado.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Re-verify 2FA */}
      <div className="seguridad-card">
        <h2 className="seguridad-card-title">🔄 Tiempo de Re-verificación 2FA</h2>
        <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 12px' }}>
          Cada cierto tiempo se solicitará el código 2FA nuevamente para acciones sensibles (enviar correo, etc.).
        </p>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
          <div>
            <label className="configuracion-label">Minutos entre re-verificaciones</label>
            <input
              type="number"
              value={reverifyMinutes}
              onChange={e => setReverifyMinutes(Math.max(1, parseInt(e.target.value) || 60))}
              min="1" max="1440"
              className="configuracion-input"
              style={{ width: '120px' }}
            />
          </div>
          <button type="button" onClick={handleGuardarReverify} className="btn-guardar">
            💾 Guardar
          </button>
        </div>
      </div>

      {/* Palabras Bloqueadas */}
      <div className="seguridad-card">
        <h2 className="seguridad-card-title">🚫 Palabras Bloqueadas</h2>
        <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 12px' }}>
          Estas palabras serán detectadas en el cuerpo de los correos y bloquearán el envío.
        </p>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <input
            type="text"
            value={nuevaPalabra}
            onChange={e => setNuevaPalabra(e.target.value)}
            placeholder="Escribe una palabra..."
            style={{
              flex: 1, padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '6px',
              fontSize: '14px'
            }}
            onKeyDown={e => { if (e.key === 'Enter') agregarPalabra(); }}
          />
          <select
            value={nuevaCategoria}
            onChange={e => setNuevaCategoria(e.target.value)}
            style={{
              width: '220px', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '6px',
              fontSize: '14px'
            }}
          >
            <option value="">Sin categoría</option>
            {categoriasDisponibles.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button type="button" onClick={agregarPalabra} disabled={!nuevaPalabra.trim()} style={{
            padding: '10px 20px', background: nuevaPalabra.trim() ? '#1A3C6B' : '#9CA3AF',
            color: '#FFF', border: 'none', borderRadius: '6px', fontWeight: 600,
            cursor: nuevaPalabra.trim() ? 'pointer' : 'default', whiteSpace: 'nowrap'
          }}>
            + Agregar
          </button>
        </div>
        {cargandoPalabras ? (
          <p style={{ fontSize: '13px', color: '#6B7280' }}>⏳ Cargando…</p>
        ) : palabras.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#9CA3AF' }}>No hay palabras bloqueadas</p>
        ) : (
          <div>
            {Array.from(new Map(palabras.map(p => [p.categoria || 'Sin categoría', p.categoria || null])).entries()).map(([catLabel, catVal]) => {
              const items = palabras.filter(p => (p.categoria || null) === catVal);
              const expandida = categoriasExpandidas.has(catLabel);
              return (
                <div key={catLabel} style={{ marginBottom: '8px' }}>
                  <div
                    onClick={() => {
                      const next = new Set(categoriasExpandidas);
                      if (expandida) next.delete(catLabel); else next.add(catLabel);
                      setCategoriasExpandidas(next);
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px',
                      background: '#F9FAFB', borderRadius: '6px', cursor: 'pointer',
                      border: '1px solid #E5E7EB', userSelect: 'none'
                    }}
                  >
                    <span style={{ fontSize: '12px', color: '#6B7280', transition: 'transform 0.15s', transform: expandida ? 'rotate(90deg)' : undefined }}>▶</span>
                    <span style={{ fontWeight: 600, fontSize: '13px', color: '#374151', flex: 1 }}>{catLabel}</span>
                    <span style={{ fontSize: '12px', color: '#9CA3AF' }}>({items.length})</span>
                    <span style={{ fontSize: '12px', color: expandida ? '#1D4ED8' : '#6B7280' }}>{expandida ? '▼ ocultar' : '▶ mostrar'}</span>
                  </div>
                  {expandida && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '10px 12px' }}>
                      {items.map(p => (
                        <span key={p.id} style={{
                          display: 'inline-flex', alignItems: 'center', gap: '6px',
                          padding: '5px 10px', background: '#FEE2E2', color: '#991B1B',
                          borderRadius: '20px', fontSize: '12px', fontWeight: 500
                        }}>
                          {p.palabra}
                          <button type="button" onClick={() => eliminarPalabra(p.id, p.palabra)} style={{
                            background: 'none', border: 'none', color: '#991B1B',
                            cursor: 'pointer', fontSize: '14px', lineHeight: 1, padding: 0
                          }}>
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Información */}
      <div className="seguridad-info">
        <h3>ℹ️ Información de Seguridad</h3>
        <ul>
          <li>📱 El 2FA debe configurarse desde la página de cada usuario</li>
          <li>⏱️ El tiempo de inactividad aplica a todos los usuarios del sistema</li>
          <li>🔄 El tiempo de re-verificación 2FA es por usuario (localStorage)</li>
          <li>🚫 Las palabras bloqueadas aplican a todos los usuarios del establecimiento</li>
        </ul>
      </div>
    </div>
  );
}
