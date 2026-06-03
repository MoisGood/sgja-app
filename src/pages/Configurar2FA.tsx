import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import QRCode from 'qrcode';

export default function Configurar2FA({ onCompletado }: { onCompletado?: () => void }) {
  const [paso, setPaso] = useState<'cargando' | 'listo' | 'qr' | 'verificado'>('cargando');
  const [error, setError] = useState('');
  const [factorId, setFactorId] = useState('');
  const [qrUri, setQrUri] = useState('');
  const [codigo, setCodigo] = useState('');
  const [verificando, setVerificando] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    supabase.auth.mfa.listFactors().then(({ data, error: err }) => {
      if (err) { setError(err.message); setPaso('listo'); return; }
      const totp = data?.all?.find(f => f.factor_type === 'totp' && f.status === 'verified');
      if (totp) { setPaso('verificado'); return; }
      setPaso('listo');
    });
  }, []);

  async function handleIniciar() {
    setError('');
    const { data, error: err } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
    if (err || !data) { setError(err?.message || 'Error al generar QR'); return; }
    setFactorId(data.id);
    const uri = data.totp?.qr_code || data.totp?.uri;
    if (!uri) { setError('No se pudo obtener el código QR'); return; }
    setQrUri(uri);
    setPaso('qr');
    if (canvasRef.current && data.totp?.uri) {
      QRCode.toCanvas(canvasRef.current, data.totp.uri, { width: 220, margin: 2 }, (err: Error | null | undefined) => {
        if (err) console.error('QR error:', err);
      });
    }
  }

  async function handleVerificar() {
    if (codigo.length !== 6) { setError('Ingresa el código de 6 dígitos'); return; }
    setVerificando(true);
    setError('');
    try {
      const { data: chal, error: err1 } = await supabase.auth.mfa.challenge({ factorId });
      if (err1 || !chal) { setError(err1?.message || 'Error al crear desafío'); return; }
      const { error: err2 } = await supabase.auth.mfa.verify({ factorId, challengeId: chal.id, code: codigo });
      if (err2) { setError(err2.message); return; }
      setPaso('verificado');
    } catch { setError('Error al verificar'); }
    finally { setVerificando(false); }
  }

  return (
    <div style={{ padding: '32px', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ color: '#1A3C6B', margin: '0 0 8px' }}>🔐 Autenticación en Dos Pasos (2FA)</h1>
      <p style={{ color: '#6B7280', fontSize: '14px', margin: '0 0 24px' }}>
        Aumenta la seguridad de tu cuenta con Google Authenticator
      </p>

      {error && (
        <div style={{ padding: '10px', background: '#FEE2E2', color: '#991B1B', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>
          ⚠️ {error}
        </div>
      )}

      {paso === 'cargando' && <p style={{ color: '#6B7280' }}>⏳ Verificando estado...</p>}

      {paso === 'listo' && (
        <div style={{ background: '#FFF', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📱</div>
          <h3 style={{ margin: '0 0 8px', color: '#1A3C6B' }}>Configurar 2FA</h3>
          <p style={{ fontSize: '14px', color: '#6B7280', margin: '0 0 20px' }}>
            Necesitarás la aplicación Google Authenticator en tu teléfono.
          </p>
          <button type="button" onClick={handleIniciar} style={{
            padding: '12px 28px', background: '#1A3C6B', color: '#FFF', border: 'none',
            borderRadius: '8px', fontWeight: 600, fontSize: '15px', cursor: 'pointer'
          }}>
            Generar QR
          </button>
        </div>
      )}

      {paso === 'qr' && (
        <div style={{ background: '#FFF', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '24px', textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 16px', color: '#1A3C6B' }}>Escanea el código QR</h3>
          <div style={{
            display: 'inline-block', padding: '12px', background: '#FFF', borderRadius: '8px',
            border: '2px solid #E5E7EB', marginBottom: '16px'
          }}>
            {qrUri.startsWith('data:') ? (
              <img src={qrUri} alt="QR Code" style={{ width: 220, height: 220 }} />
            ) : (
              <canvas ref={canvasRef} style={{ width: 220, height: 220 }} />
            )}
          </div>
          <ol style={{ textAlign: 'left', fontSize: '13px', color: '#374151', margin: '0 0 20px', paddingLeft: '20px', lineHeight: '1.8' }}>
            <li>Abre <strong>Google Authenticator</strong> en tu teléfono</li>
            <li>Toca <strong>"+"</strong> → <strong>"Escanear código QR"</strong></li>
            <li>Escanea este código con tu teléfono</li>
            <li>Ingresa el código de 6 dígitos aquí abajo</li>
          </ol>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '12px' }}>
            <input
              type="text" inputMode="numeric" maxLength={6} value={codigo}
              onChange={e => setCodigo(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              style={{
                width: '140px', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '6px',
                fontSize: '20px', textAlign: 'center', letterSpacing: '6px', fontFamily: 'monospace'
              }}
              onKeyDown={e => { if (e.key === 'Enter') handleVerificar(); }}
            />
            <button type="button" onClick={handleVerificar} disabled={verificando || codigo.length !== 6} style={{
              padding: '10px 20px', background: codigo.length === 6 ? '#1A3C6B' : '#9CA3AF', color: '#FFF',
              border: 'none', borderRadius: '6px', fontWeight: 600, cursor: codigo.length === 6 ? 'pointer' : 'default'
            }}>
              {verificando ? '⏳' : 'Verificar'}
            </button>
          </div>
          <button type="button" onClick={handleIniciar} style={{
            background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer',
            fontSize: '12px', textDecoration: 'underline'
          }}>
            Generar un nuevo código QR
          </button>
        </div>
      )}

      {paso === 'verificado' && (
        <div style={{ background: '#D1FAE5', border: '1px solid #A7F3D0', borderRadius: '10px', padding: '32px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
          <h3 style={{ margin: '0 0 8px', color: '#065F46' }}>2FA Activado</h3>
          <p style={{ fontSize: '14px', color: '#047857', margin: '0 0 20px' }}>
            Tu cuenta ahora está protegida con autenticación en dos pasos.
          </p>
          {onCompletado && (
            <button type="button" onClick={onCompletado} style={{
              padding: '12px 28px', background: '#065F46', color: '#FFF', border: 'none',
              borderRadius: '8px', fontWeight: 600, fontSize: '15px', cursor: 'pointer'
            }}>
              Continuar
            </button>
          )}
        </div>
      )}
    </div>
  );
}
