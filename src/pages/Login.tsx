// ============================================================
// SGJA – Pantalla de Login (Supabase Auth - Email/Password)
// src/pages/Login.tsx
// ============================================================

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import '../styles/login.css';

export default function Login() {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mantenimientoActivo, setMantenimientoActivo] = useState(false);
  const [mostrarLogin, setMostrarLogin] = useState(false);

  useEffect(() => {
    const leerErrorOAuth = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const errorCode = searchParams.get('error_code') || hashParams.get('error_code');
      const errorDescription =
        searchParams.get('error_description') || hashParams.get('error_description');

      if (errorCode || errorDescription) {
        const descripcion = decodeURIComponent(errorDescription || '').replace(/\+/g, ' ');
        const mensaje = descripcion || 'No se pudo completar la autenticación con Google.';
        setError(`Error OAuth (${errorCode || 'desconocido'}): ${mensaje}`);
        setCargando(false);
      }
    };

    const handleAuthCallback = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.log('✅ Sesión activa detectada');
          setMensajeExito('Sesión iniciada correctamente.');
        }
      } catch (err: unknown) {
        const authError = err as { code?: string; message?: string };
        console.error('❌ Error al verificar sesión:', authError);
      }
    };

    leerErrorOAuth();
    handleAuthCallback();

    supabase.from('configuracion_sistema').select('mantenimiento_activo').limit(1).then(({ data }) => {
      if (data?.[0]?.mantenimiento_activo) setMantenimientoActivo(true);
    });
  }, []);

  // ── Login con Google OAuth ──
  const handleGoogleLogin = async () => {
    setCargando(true);
    setError(null);
    
    try {
      console.log('🔐 Iniciando login con Google...');
      setMensajeExito(null);
      
      const { error: googleError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (googleError) {
        throw googleError;
      }
      
      console.log('✅ Redireccionando a Google...');
    } catch (e: unknown) {
      const authError = e as { code?: string; message?: string };
      console.error('❌ Error en login con Google:', authError);
      setError('Error al iniciar sesión con Google. Verifica que el provider esté configurado en Supabase.');
      setCargando(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        
        {/* Header */}
        <div className="login-header">
          <img 
            src="/img/logoLiceo1.png"
            alt="Logo Liceo de Niñas de Concepción"
            className="login-logo"
            width="64"
            height="184"
          />
          <p className="login-institution">Liceo de Niñas de Concepción</p>
        </div>

        {/* Títulos */}
        <h1 className="login-title">Apoyo en Gestiones Internas</h1>
        <h2 className="login-subtitle">Iniciar sesión</h2>

        {/* ── Cartel de mantenimiento ── */}
        {mantenimientoActivo && !mostrarLogin && (
          <div style={{ padding: '16px', background: '#FEF3C7', borderRadius: '8px', border: '1px solid #F59E0B', marginBottom: '16px', textAlign: 'center' }}>
            <p style={{ fontSize: '32px', margin: '0 0 8px 0' }}>🔧</p>
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#92400E', margin: '0 0 4px 0' }}>Sistema en mantenimiento</p>
            <p style={{ fontSize: '12px', color: '#92400E', margin: 0 }}>El acceso está restringido en este momento.</p>
            <button type="button" onClick={() => setMostrarLogin(true)} style={{ marginTop: '12px', background: 'none', border: 'none', color: '#1A3C6B', fontSize: '12px', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer' }}>
              Acceso administrador
            </button>
          </div>
        )}

        {/* Botón Google OAuth - Solo opción */}
        {(!mantenimientoActivo || mostrarLogin) && (
          <>
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={cargando}
          style={{
            width: '100%',
            padding: '14px 16px',
            borderRadius: '6px',
            border: '1px solid #ddd',
            backgroundColor: '#fff',
            color: '#333',
            fontSize: '16px',
            fontWeight: '600',
            cursor: cargando ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            transition: 'background-color 0.2s, box-shadow 0.2s',
            marginTop: '24px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          }}
          onMouseEnter={(e) => {
            if (!cargando) {
              e.currentTarget.style.backgroundColor = '#f8f8f8';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#fff';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
          }}
        >
          {cargando ? (
            <>
              <span className="login-spinner"></span>
              <span>Conectando con Google...</span>
            </>
          ) : (
            <>
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.38 8.55 1 10.22 1 12s.38 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Continuar con Google</span>
            </>
          )}
        </button>

        {/* Error */}
        {error && (
          <div className="login-error" style={{ marginTop: '16px' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Mensaje de Éxito */}
        {mensajeExito && (
          <div style={{
            marginTop: '16px',
            padding: '12px',
            backgroundColor: '#d4edda',
            color: '#155724',
            borderRadius: '6px',
            fontSize: '14px',
          }}>
            ✅ {mensajeExito}
          </div>
        )}

        {/* Registro */}
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: '#666', margin: '0 0 8px 0' }}>
            ¿No tienes cuenta?
          </p>
          <button type="button"             onClick={handleGoogleLogin}
            disabled={cargando}
            style={{
              background: 'none',
              border: 'none',
              color: '#1A3C6B',
              fontSize: '14px',
              fontWeight: '600',
              cursor: cargando ? 'not-allowed' : 'pointer',
              textDecoration: 'underline',
              padding: '4px 8px',
            }}
          >
            Registrar con cuenta institucional
          </button>
        </div>

        {/* Footer */}
        <div className="login-footer" style={{ marginTop: '16px' }}>
          Debes utilizar tu correo institucional<br/>
          <strong>tucorreo@andaliensur.cl</strong>
        </div>
        </>
        )}
      </div>
    </div>
  );
}
