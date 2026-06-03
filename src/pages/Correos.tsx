import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Button from '../components/Common/Button';

interface Props { idEstablecimiento: string }

const inputStyle: React.CSSProperties = { padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', width: '100%' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px' };

export default function Correos({ idEstablecimiento }: Props) {
  const [email, setEmail] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [displayName, setDisplayName] = useState('SGJA Biblioteca');
  const [replyTo, setReplyTo] = useState('');
  const [puerto, setPuerto] = useState(587);
  const [ssl, setSsl] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [pruebaEnviando, setPruebaEnviando] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [toTest, setToTest] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('email_config').select('*').eq('id_establecimiento', idEstablecimiento).eq('activo', true).maybeSingle();
      if (data) {
        setEmail(data.email || '');
        setAppPassword(data.app_password || '');
        setDisplayName(data.display_name || 'SGJA Biblioteca');
        setReplyTo(data.reply_to || '');
        if (data.smtp_port) setPuerto(data.smtp_port);
        setSsl(data.smtp_port === 465);
      }
    })();
  }, [idEstablecimiento]);

  const guardar = async () => {
    if (!email.trim() || !appPassword.trim()) { setError('Email y contraseña son obligatorios'); return; }
    setGuardando(true); setError(null);
    const { data: existing } = await supabase.from('email_config').select('id').eq('id_establecimiento', idEstablecimiento).maybeSingle();

    const payload = {
      email: email.trim(), app_password: appPassword.trim(),
      display_name: displayName.trim(), reply_to: replyTo.trim() || null,
      smtp_host: 'smtp.gmail.com', smtp_port: puerto,
      id_establecimiento: idEstablecimiento,
    };

    const { error: err } = existing
      ? await supabase.from('email_config').update(payload).eq('id', existing.id)
      : await supabase.from('email_config').insert(payload);

    if (err) { setError(err.message); setGuardando(false); return; }
    localStorage.setItem('sgja_email_config', JSON.stringify({ email: email.trim(), appPassword: appPassword.trim(), displayName: displayName.trim(), port: puerto, ssl: ssl }));
    setExito('Configuración guardada'); setTimeout(() => setExito(null), 3000); setGuardando(false);
  };

  const probarEnvio = async () => {
    if (!toTest.trim()) { setError('Ingresa un correo de prueba'); return; }
    setPruebaEnviando(true); setError(null);
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: toTest.trim(),
          subject: '🔧 Prueba de configuración de correo - SGJA',
          html: `<h2 style="color:#10B981;">✅ Prueba exitosa</h2><p>La configuración de correo electrónico funciona correctamente.</p><hr><p style="font-size:12px;color:#6B7280;">SGJA - Sistema de Gestión de Biblioteca</p>`,
          emailConfig: { email: email.trim(), appPassword: appPassword.trim(), displayName: displayName.trim(), port: puerto, ssl: ssl },
        }),
      });
      const text = await res.text();
      if (!text) { setError('El servidor no respondió'); return; }
      console.log('📨 Respuesta API:', text);
      let data;
      try { data = JSON.parse(text); } catch { setError('Respuesta inválida: ' + text.substring(0, 200)); return; }
      if (!data.ok) { setError(data.error || JSON.stringify(data)); } else { setExito('Correo de prueba enviado ✅'); setTimeout(() => setExito(null), 5000); }
    } catch (e: any) { setError(e.message); }
    setPruebaEnviando(false);
  };

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#1A3C6B', marginBottom: '24px' }}>📧 Correos</h1>

      {error && <p style={{ color: '#DC2626', fontSize: '14px', marginBottom: '12px', padding: '8px 12px', background: '#FEF2F2', borderRadius: '6px' }}>{error}</p>}
      {exito && <p style={{ color: '#10B981', fontSize: '14px', marginBottom: '12px', padding: '8px 12px', background: '#F0FDF4', borderRadius: '6px' }}>{exito}</p>}

      {/* Configuración SMTP */}
      <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '24px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1A3C6B', marginBottom: '16px' }}>Configuración SMTP</h2>
        <div style={{ display: 'grid', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Correo electrónico *</label>
            <input style={inputStyle} value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@andaliensur.cl" />
          </div>
          <div>
            <label style={labelStyle}>Contraseña de aplicación *</label>
            <div style={{ display: 'flex' }}>
              <input type={showPass ? 'text' : 'password'} style={{ ...inputStyle, flex: 1, borderRight: 'none', borderRadius: '8px 0 0 8px' }} value={appPassword} onChange={e => setAppPassword(e.target.value)} placeholder="App Password de Gmail" />
              <button type="button" onClick={() => setShowPass(!showPass)} style={{ padding: '10px 14px', border: '1px solid #D1D5DB', borderLeft: 'none', borderRadius: '0 8px 8px 0', background: '#F3F4F6', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}>
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Nombre del remitente</label>
              <input style={inputStyle} value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="SGJA Biblioteca" />
            </div>
            <div>
              <label style={labelStyle}>Responder a (opcional)</label>
              <input style={inputStyle} value={replyTo} onChange={e => setReplyTo(e.target.value)} placeholder="biblioteca@andaliensur.cl" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'flex-end' }}>
            <div>
              <label style={labelStyle}>Puerto SMTP</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[587, 465].map(p => (
                  <button type="button" key={p} onClick={() => { setPuerto(p); setSsl(p === 465); }} style={{
                    flex: 1, padding: '10px', borderRadius: '8px', border: puerto === p ? '2px solid #1A3C6B' : '1px solid #D1D5DB',
                    background: puerto === p ? '#EFF6FF' : '#FFFFFF', cursor: 'pointer', fontWeight: 600, fontSize: '14px',
                  }}>
                    {p === 587 ? '587 (TLS)' : '465 (SSL)'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={labelStyle}>Servidor SMTP</label>
              <input style={inputStyle} value="smtp.gmail.com" disabled />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={guardar} tipo="exito" cargando={guardando}>💾 Guardar configuración</Button>
          </div>
        </div>
      </div>

      {/* Prueba de envío */}
      <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1A3C6B', marginBottom: '16px' }}>Enviar correo de prueba</h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Correo destino</label>
            <input style={inputStyle} value={toTest} onChange={e => setToTest(e.target.value)} placeholder="tucorreo@ejemplo.com" />
          </div>
          <Button onClick={probarEnvio} tipo="primario" cargando={pruebaEnviando} deshabilitado={!email || !appPassword}>📤 Enviar prueba</Button>
        </div>
      </div>
    </div>
  );
}
