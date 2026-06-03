import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface SesionCloud {
  uid: string;
  tipo: string;
  sessionId: string;
}

interface FuncionarioInfo {
  uid: string;
  nombre_completo: string;
  email: string;
  rol: string;
}

const WS_URL = 'https://icy-limit-9f6c.soportetipresente.workers.dev';

export default function EnLinea() {
  const [sesiones, setSesiones] = useState<SesionCloud[]>([]);
  const [funcionarios, setFuncionarios] = useState<FuncionarioInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<'todos' | 'conectados'>('conectados');
  const [cerrando, setCerrando] = useState<Set<string>>(new Set());

  useEffect(() => {
    const s = document.createElement('style');
    s.textContent = `@keyframes progBar { 0% { width: 10% } 50% { width: 60% } 100% { width: 10% } }`;
    document.head.appendChild(s);
    return () => s.remove();
  }, []);

  useEffect(() => {
    const poll = async () => {
      await Promise.all([cargarFuncionarios(), cargarSesiones()]);
    };
    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, []);

  async function cargarFuncionarios() {
    const { data: usuarios, error } = await supabase
      .from('usuarios')
      .select('id, nombre, email, rol');
    if (error) {
      console.error('EnLinea: error al cargar usuarios', error);
      return;
    }
    if (usuarios) {
      setFuncionarios(usuarios.map(u => ({
        uid: u.id,
        nombre_completo: u.nombre || 'Sin nombre',
        email: u.email || '',
        rol: u.rol || '',
      })));
    }
  }

  async function cargarSesiones() {
    try {
      const res = await fetch(`${WS_URL}/api/sesiones`);
      if (res.ok) {
        const data = await res.json();
        setSesiones(data);
      }
    } catch {} finally {
      setLoading(false);
    }
  }

  const funcionarioPorUid = (uid: string) => funcionarios.find(f => f.uid === uid);

  const cerrarSesionUsuario = async (uid: string, sessionId: string) => {
    setCerrando(prev => new Set(prev).add(sessionId));
    try {
      await fetch(`${WS_URL}/api/cerrar-sesion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, sessionId }),
      });
    } catch {}
  };

  const sesionesConNombre = sesiones.map(s => ({
    ...s,
    info: funcionarioPorUid(s.uid),
  }));

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', color: '#1A3C6B', margin: '0 0 4px' }}>Usuarios En Línea</h1>
      <p style={{ fontSize: '14px', color: '#6B7280', margin: '0 0 20px' }}>
        Usuarios conectados vía WebSocket en tiempo real
      </p>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {(['conectados', 'todos'] as const).map(op => (
          <button type="button" key={op} onClick={() => setFiltro(op)} style={{
            padding: '8px 16px', border: '1px solid #D1D5DB', borderRadius: '6px',
            background: filtro === op ? '#1A3C6B' : '#FFF',
            color: filtro === op ? '#FFF' : '#374151', cursor: 'pointer',
            fontWeight: filtro === op ? 600 : 400, fontSize: '13px'
          }}>
            {op === 'conectados' ? `🟢 Conectados (${sesiones.length})` : `📋 Todos (${sesionesConNombre.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: '#6B7280', fontSize: '14px' }}>⏳ Cargando…</div>
      ) : sesionesConNombre.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '40px', fontSize: '14px' }}>
          {filtro === 'conectados' ? '🟢 No hay usuarios conectados' : '📭 No hay datos'}
        </div>
      ) : (
        <div style={{ background: '#FFF', borderRadius: '8px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '2px solid #E5E7EB' }}>
                <th style={th}>Estado</th>
                <th style={th}>Nombre</th>
                <th style={th}>Email</th>
                <th style={th}>Rol</th>
                <th style={th}>Dispositivo</th>
                <th style={th}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {sesionesConNombre.map(s => (
                <tr key={s.sessionId} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={td}><span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#10B981' }}></span></td>
                  <td style={{ ...td, fontWeight: 600 }}>{s.info?.nombre_completo || s.uid.slice(0, 8)}</td>
                  <td style={td}>{s.info?.email || '—'}</td>
                  <td style={td}><span style={{ padding: '2px 8px', borderRadius: '4px', background: '#DBEAFE', color: '#1E40AF', fontSize: '12px', fontWeight: 600 }}>{s.info?.rol || '—'}</span></td>
                  <td style={td}>{s.tipo === 'movil' ? '📱 Móvil' : '🖥️ Computador'}</td>
                  <td style={td}>
                    {cerrando.has(s.sessionId) ? (
                      <div style={{ width: '60px', height: '4px', background: '#E5E7EB', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: '100%', height: '100%', background: '#EF4444', borderRadius: '2px', animation: 'progBar 1.2s ease-in-out infinite' }} />
                      </div>
                    ) : (
                      <button type="button" onClick={() => cerrarSesionUsuario(s.uid, s.sessionId)} style={{
                        padding: '4px 10px', background: '#EF4444', color: '#FFF', border: 'none',
                        borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                      }}>
                        Cerrar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const th: React.CSSProperties = { padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#6B7280', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' };
const td: React.CSSProperties = { padding: '10px 14px', color: '#374151' };
