// ============================================================
// SGJA – Contenido de la App (Lógica de Autenticación)
// src/AppContent.tsx
// ============================================================

import { useAuth } from './hooks/useAuth';
import { useInactivityWarning } from './hooks/useInactivityWarning';
import { usePermisosUsuario } from './hooks/usePermisosUsuario';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { Rol } from './types';
import Login from './pages/Login';
import Layout from './components/Layout';
import DashboardAdmin from './pages/DashboardAdmin';
import DashboardInspector from './pages/DashboardInspector';
import DashboardProfesor from './pages/DashboardProfesor';
import DashboardEstudiante from './pages/DashboardEstudiante';
import DashboardApoderado from './pages/DashboardApoderado';
import GestionUsuariosPage from './pages/GestionUsuariosPage';
import Mantenedores from './pages/Mantenedores';
import RegistrarJustificacion from './pages/RegistrarJustificacion';
import VerJustificaciones from './pages/VerJustificaciones';
import GestionPases from './pages/GestionPases';
import JustificacionesAtrasos from './pages/JustificacionesAtrasos';
import Parametros from './pages/Parametros';
import EnLinea from './pages/EnLinea';
import Seguridad from './pages/Seguridad';
import AsignarPermisos from './pages/AsignarPermisos';
import DashboardSecretaria from './pages/DashboardSecretaria';
import SecretariaAusentes from './pages/SecretariaAusentes';
import EnviarCorreo from './pages/EnviarCorreo';
import MantenedorFuncionarios from './pages/MantenedorFuncionarios';
import FormularioRegistroInicial from './pages/FormularioRegistroInicial';
import FormularioDatosPersonales from './pages/FormularioDatosPersonales';
import MantenedorLibros from './pages/MantenedorLibros';
import Catalogo from './pages/Catalogo';
import Circulacion from './pages/Circulacion';
import ConfigBiblioteca from './pages/ConfigBiblioteca';
import HistorialBiblioteca from './pages/HistorialBiblioteca';
import Inventario from './pages/Inventario';
import MonitoreoCorreos from './pages/MonitoreoCorreos';
import Correos from './pages/Correos';
import MonitoreoFallos from './pages/MonitoreoFallos';
import MantenimientoConfig from './pages/MantenimientoConfig';
import Tecnico from './pages/Tecnico';
import Equipos from './pages/Equipos';
import Ubicaciones from './pages/Ubicaciones';
import Requerimientos from './pages/Requerimientos';
import ConfiguracionTecnico from './pages/ConfiguracionTecnico';
import Ticket from './pages/Ticket';
import AccesosRapidos from './pages/AccesosRapidos';

import MobileMapa from './pages/MobileMapa';
import MobileEquipos from './pages/MobileEquipos';
import MobileUbicaciones from './pages/MobileUbicaciones';
import MobileConfigTecnico from './pages/MobileConfigTecnico';
import MobileDashboard from './pages/MobileDashboard';
import MobileGrid from './pages/MobileGrid';
import HistorialMovil from './pages/HistorialMovil';
import MobileTickets from './pages/MobileTickets';
import MobileInventario from './pages/MobileInventario';
import MobileQrScanner from './pages/MobileQrScanner';
import { SkinProvider } from './contexts/SkinContext';
import QrRedirect from './pages/QrRedirect';
import Configurar2FA from './pages/Configurar2FA';
import AyudaPage from './pages/AyudaPage';
import AdminAyuda from './pages/AdminAyuda';

export default function AppContent() {
  const { uid, rol, idEstablecimiento, cargando, autorizado, usuarioInactivo, documentoExiste, nombre, apellidos, email, datosPendientes, mantenimientoBloqueo, mttoHorario } = useAuth();
  const [errorSesion, setErrorSesion] = useState<string | null>(null);
  const [mostrarFormDatos, setMostrarFormDatos] = useState(false);
  const [mfaPendiente, setMfaPendiente] = useState(false);
  const [cargandoMfa, setCargandoMfa] = useState(true);
  const [otraPestanaAbierta, setOtraPestanaAbierta] = useState(false);
  const [kickedByAdmin, setKickedByAdmin] = useState(false);

  useEffect(() => {
    const s = document.createElement('style');
    s.textContent = `@keyframes progBarKick { 0% { width: 0% } 100% { width: 100% } }`;
    document.head.appendChild(s);
    return () => s.remove();
  }, []);

  useEffect(() => {
    supabase.from('config_sistema').select('*').eq('id', 1).single().then(({ data }) => {
      if (!data) return;
      if (data.favicon_url) {
        let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
        if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
        link.href = data.favicon_url;
      }
      if (data.nombre_sistema) {
        document.title = data.nombre_sistema;
        document.querySelector('meta[property="og:title"]')?.setAttribute('content', data.nombre_sistema);
        document.querySelector('meta[name="apple-mobile-web-app-title"]')?.setAttribute('content', data.nombre_sistema);
      }
    });
  }, []);

  const { mostrarModal, segundosRestantes, cerrandoSesion, extenderSesion } = useInactivityWarning(rol, autorizado);
  const { permisos: permisosRol, cargando: cargandoPermisos } = usePermisosUsuario(idEstablecimiento || '', rol as Rol);
  const esRolPredefinido = Object.values(Rol).includes(rol as Rol);
  const [mantenimientoCountdown, setMantenimientoCountdown] = useState<number | null>(null);
  const countdownRef = useRef(mantenimientoCountdown);
  countdownRef.current = mantenimientoCountdown;

  useEffect(() => {
    if (cerrandoSesion) {
      cerrarSesion();
    }
  }, [cerrandoSesion]);

  // ── Countdown de mantenimiento ──
  useEffect(() => {
    if (mantenimientoCountdown === null) return;
    if (mantenimientoCountdown <= 0) { cerrarSesion(); return; }
    const t = setTimeout(() => setMantenimientoCountdown(mantenimientoCountdown - 1), 1000);
    return () => clearTimeout(t);
  }, [mantenimientoCountdown]);

  // ── Chequeo periódico de mantenimiento (cada 30s) ──
  useEffect(() => {
    if (!autorizado || !idEstablecimiento || rol === 'ADMIN') return;
    const interval = setInterval(async () => {
      const { obtenerEstadoMantenimiento, invalidarCacheMantenimiento, debeBloquear } = await import('./services/mantenimientoService');
      invalidarCacheMantenimiento();
      const mtto = await obtenerEstadoMantenimiento(idEstablecimiento!);
      if (debeBloquear(mtto.activo, mtto.desde, mtto.hasta, rol!, mtto.modo)) {
        if (countdownRef.current === null) setMantenimientoCountdown(60);
      } else {
        setMantenimientoCountdown(null);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [autorizado, idEstablecimiento, rol]);

  // ── Verificar si el usuario debe configurar 2FA ──
  useEffect(() => {
    if (!autorizado || !uid) { setCargandoMfa(false); return; }
    setCargandoMfa(true);
    (async () => {
      const { data: userRow } = await supabase
        .from('usuarios')
        .select('mfa_obligatorio')
        .eq('uid', uid)
        .single();
      if (userRow?.mfa_obligatorio) {
        const { data: factors } = await supabase.auth.mfa.listFactors();
        const tiene2fa = factors?.all?.some(f => f.factor_type === 'totp' && f.status === 'verified');
        setMfaPendiente(!tiene2fa);
      }
      setCargandoMfa(false);
    })();
  }, [autorizado, uid]);

  // ── BroadcastChannel: detectar pestañas duplicadas ──
  useEffect(() => {
    if (!autorizado || !uid) return;
    const canal = new BroadcastChannel('sgja_sesiones');
    const ping = { tipo: 'ping', uid };
    let respondido = false;

    canal.onmessage = (e) => {
      if (e.data.tipo === 'ping' && e.data.uid === uid) {
        canal.postMessage({ tipo: 'pong', uid });
      }
      if (e.data.tipo === 'pong' && e.data.uid === uid && !respondido) {
        respondido = true;
        setOtraPestanaAbierta(true);
      }
    };

    canal.postMessage(ping);
    const timer = setTimeout(() => { if (!respondido) setOtraPestanaAbierta(false); }, 500);

    return () => {
      clearTimeout(timer);
      canal.postMessage({ tipo: 'cerrar', uid });
      canal.close();
    };
  }, [autorizado, uid]);

  // ── WebSocket Cloudflare: detectar sesiones en otros navegadores/dispositivos ──
  const esMovil = useCallback(() => /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent), []);

  useEffect(() => {
    if (!autorizado || !uid) return;

    let ws: WebSocket | null = null;
    let reconectarTimer: ReturnType<typeof setTimeout> | null = null;
    let kicked = false;
    const sessionId = crypto.randomUUID?.() || Math.random().toString(36).slice(2);

    const conectar = () => {
      try {
        ws = new WebSocket('wss://icy-limit-9f6c.soportetipresente.workers.dev/ws');

        ws.onopen = () => {
          ws?.send(JSON.stringify({
            tipoMsg: 'registrar',
            uid,
            tipo: esMovil() ? 'movil' : 'computador',
            sessionId,
          }));
          ws?.send(JSON.stringify({ tipoMsg: 'ping' }));
        };

        ws.onmessage = (e) => {
          try {
            const datos = JSON.parse(e.data);
            if (datos.tipoMsg === 'kick') {
              kicked = true;
              setKickedByAdmin(true);
              setTimeout(cerrarSesion, 1500);
            }
          } catch {}
        };

        ws.onclose = () => {
          if (!kicked) reconectarTimer = setTimeout(conectar, 5000);
        };

        ws.onerror = () => {
          ws?.close();
        };
      } catch {}
    };

    conectar();

    return () => {
      if (reconectarTimer) clearTimeout(reconectarTimer);
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
  }, [autorizado, uid, esMovil]);

  // ── Cerrar sesión ──
  const cerrarSesion = async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    localStorage.clear();
    sessionStorage.clear();
    document.cookie.split(';').forEach(c => { document.cookie = c.replace(/^ +/, '').replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`); });
  };

  // ── Pantalla de carga inicial ──
  if (cargando) {
    return (
      <div style={styles.pantallaCarga}>
        <p style={styles.spinner}>⏳</p>
        <p style={styles.textoCarga}>Cargando SGJA...</p>
      </div>
    );
  }

  // ── Sin sesión → Login ──
  if (!uid) {
    return <Login />;
  }

  // ── Usuario inactivo → Formulario de registro o pantalla de espera ──
  if (usuarioInactivo) {
      if (!documentoExiste && uid && email) {
      return (
        <FormularioRegistroInicial
          uid={uid}
          email={email}
          nombre={nombre || ''}
          apellidos={apellidos || ''}
          onEnviado={() => window.location.reload()}
          onCerrarSesion={cerrarSesion}
        />
      );
    }

    return (
      <div style={styles.pantallaCarga}>
        <div style={styles.card}>
          <p style={styles.icono}>⏳</p>
          <h2 style={styles.titulo}>Solicitud en Revisión</h2>
          <p style={styles.texto}>
            Tu solicitud de registro está siendo revisada.
          </p>
          <p style={styles.subTexto}>
            Un administrador revisará tus datos pronto. Serás notificado cuando tu cuenta esté activa.
          </p>
          <button type="button" onClick={cerrarSesion} style={styles.botonSalir}>Cerrar sesión</button>
        </div>
      </div>
    );
  }

  // ── Mantenimiento activo → bloquear no-ADMIN ──
  if (mantenimientoBloqueo) {
    return (
      <div style={styles.pantallaCarga}>
        <div style={{ ...styles.card, textAlign: 'center' }}>
          <p style={{ fontSize: '48px', margin: '0 0 16px 0' }}>🔧</p>
          <h2 style={{ fontSize: '22px', fontWeight: 600, color: '#1A3C6B', margin: '0 0 8px 0' }}>Sistema en mantenimiento</h2>
          <p style={{ fontSize: '14px', color: '#6B7280', margin: '0 0 16px 0' }}>
            El sistema solo está disponible de <strong>{mttoHorario}</strong>.
            <br />Fuera de este horario el acceso está restringido.
          </p>
          <button type="button" onClick={cerrarSesion} style={{ padding: '10px 24px', background: '#EF4444', color: '#FFF', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  // ── Usuario activo pero sin datos personales → popup + formulario ──
  if (datosPendientes && uid && nombre && rol) {
    if (!mostrarFormDatos) {
      return (
        <div style={styles.pantallaCarga}>
          <div style={styles.card}>
            <p style={{ textAlign: 'center', fontSize: '48px', margin: '0 0 16px 0' }}>⚠️</p>
            <h2 style={styles.titulo}>Datos incompletos</h2>
            <p style={styles.texto}>
              Tu perfil de funcionario está incompleto. Antes de continuar usando la plataforma,
              debes completar tu información personal.
            </p>
            <p style={styles.subTexto}>
              Estos datos son de uso exclusivo del establecimiento educacional.
            </p>
            <button type="button" 
              onClick={() => setMostrarFormDatos(true)}
              style={{ width: '100%', padding: '12px', background: '#1A3C6B', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', marginTop: '16px' }}
            >
              Completar datos
            </button>
            <button type="button" onClick={cerrarSesion} style={styles.botonSalir}>Cerrar sesión</button>
          </div>
        </div>
      );
    }

    return (
      <FormularioDatosPersonales
        uid={uid}
        email={email || ''}
        nombre={nombre}
        apellidos={apellidos || ''}
        rol={rol}
        onGuardado={() => window.location.reload()}
        onCerrarSesion={cerrarSesion}
      />
    );
  }

  // ── MFA pendiente → obligado a configurar 2FA ──
  if (cargandoMfa) {
    return (
      <div style={styles.pantallaCarga}>
        <p style={styles.spinner}>⏳</p>
        <p style={styles.textoCarga}>Verificando seguridad...</p>
      </div>
    );
  }

  if (mfaPendiente) {
    return <Configurar2FA onCompletado={() => { setMfaPendiente(false); window.location.reload(); }} />;
  }

  // ── Sin autorización → No tiene acceso ──
  if (!autorizado || !rol) {
    return (
      <div style={styles.pantallaCarga}>
        <div style={styles.card}>
          <p style={styles.icono}>🚫</p>
          <h2 style={styles.titulo}>Acceso Denegado</h2>
          <p style={styles.texto}>
            Tu cuenta no tiene permisos. Contacta al administrador.
          </p>
          <button type="button" 
            onClick={cerrarSesion}
            style={styles.botonSalir}
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  // ── Sesión activa con rol → mostrar Layout ──
  const puedeVer = (ruta: string, ...rolesAdmitidos: string[]) => {
    if (!idEstablecimiento) return false;
    if (esRolPredefinido) return rolesAdmitidos.length === 0 ? rol === 'ADMIN' : rolesAdmitidos.includes(rol);
    return permisosRol.includes(ruta);
  };

  const renderRoleDashboard = () => {
    if (!idEstablecimiento) return null;
    switch (rol as string) {
      case 'ADMIN':
        return <DashboardAdmin idEstablecimiento={idEstablecimiento} />;
      case 'INSPECTOR':
        return <DashboardInspector idEstablecimiento={idEstablecimiento} />;
      case 'PROFESOR':
        return <DashboardProfesor idEstablecimiento={idEstablecimiento} idProfesor={uid || ''} />;
      case 'ESTUDIANTE':
        return <DashboardEstudiante idEstudiante={uid || ''} />;
      case 'APODERADO':
        return <DashboardApoderado idApoderado={uid || ''} idEstablecimiento={idEstablecimiento} />;
      case 'TECNICO':
        return <Navigate to="/tecnico/m/inicio" replace />;
      default:
        return <DashboardSecretaria nombre={nombre || 'Usuario'} />;
    }
  };

  return (
    <SkinProvider>
      {/* Modal de error de sesión (límite alcanzado) */}
      {errorSesion && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>⚠️ Límite de sesiones alcanzado</h2>
            </div>
            <div style={styles.modalBody}>
              <p style={styles.modalText}>{errorSesion}</p>
            </div>
            <div style={styles.modalFooter}>
              <button type="button" 
                onClick={() => setErrorSesion(null)}
                style={styles.modalButton}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de mantenimiento */}
      {mantenimientoCountdown !== null && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalContentInactivity, borderTop: '4px solid #EF4444' }}>
            <div style={styles.modalHeaderInactivity}>
              <h2 style={styles.modalTitleInactivity}>🔧 Sistema en mantenimiento</h2>
            </div>
            <div style={styles.modalBodyInactivity}>
              <p style={styles.modalTextInactivity}>
                El sistema ha activado el modo mantenimiento. Tu sesión se cerrará automáticamente.
              </p>
              <div style={styles.cronometro}>
                <span style={styles.cronometroNumero}>{mantenimientoCountdown}</span>
                <span style={styles.cronometroTexto}>segundos</span>
              </div>
            </div>
            <div style={styles.modalFooterInactivity}>
              <button type="button" onClick={cerrarSesion} style={styles.botonCerrarAhora}>
                Cerrar sesión ahora
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de inactividad */}
      {mostrarModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContentInactivity}>
            <div style={styles.modalHeaderInactivity}>
              <h2 style={styles.modalTitleInactivity}>⏰ Sesión próxima a cerrar</h2>
            </div>
            <div style={styles.modalBodyInactivity}>
              <p style={styles.modalTextInactivity}>
                Has estado inactivo por un tiempo. Tu sesión se cerrará automáticamente si no respondes.
              </p>
              <div style={styles.cronometro}>
                <span style={styles.cronometroNumero}>{segundosRestantes}</span>
                <span style={styles.cronometroTexto}>segundos</span>
              </div>
            </div>
            <div style={styles.modalFooterInactivity}>
              <button type="button" 
                onClick={extenderSesion}
                style={styles.botonContinuar}
              >
                Continuar sesión
              </button>
              <button type="button" 
                onClick={cerrarSesion}
                style={styles.botonCerrarAhora}
              >
                Cerrar ahora
              </button>
            </div>
          </div>
        </div>
      )}

      {otraPestanaAbierta && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999,
          backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: '#FFF', borderRadius: '12px', padding: '32px',
            maxWidth: '400px', width: '90%', textAlign: 'center',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>⚠️</div>
            <h3 style={{ margin: '0 0 8px', color: '#92400E', fontSize: '18px' }}>Sesión duplicada</h3>
            <p style={{ margin: '0 0 20px', color: '#6B7280', fontSize: '14px', lineHeight: '1.5' }}>
              Ya tienes esta aplicación abierta en otra pestaña. Cierra esta pestaña para evitar conflictos.
            </p>
            <button type="button" onClick={() => window.close()} style={{
              padding: '12px 28px', background: '#EF4444', color: '#FFF', border: 'none',
              borderRadius: '8px', fontWeight: 600, fontSize: '15px', cursor: 'pointer'
            }}>
              Cerrar pestaña
            </button>
          </div>
        </div>
      )}

      {kickedByAdmin && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999,
          backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: '#FFF', borderRadius: '12px', padding: '32px',
            maxWidth: '400px', width: '90%', textAlign: 'center',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔒</div>
            <h3 style={{ margin: '0 0 8px', color: '#991B1B', fontSize: '18px' }}>Sesión cerrada por administrador</h3>
            <p style={{ margin: '0 0 20px', color: '#6B7280', fontSize: '14px', lineHeight: '1.5' }}>
              Un administrador cerró tu sesión remotamente. Serás redirigido al inicio de sesión...
            </p>
            <div style={{ width: '100%', height: '4px', background: '#E5E7EB', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ width: '100%', height: '100%', background: '#EF4444', borderRadius: '2px', animation: 'progBarKick 1.5s linear forwards' }} />
            </div>
          </div>
        </div>
      )}

      <Layout
        rol={rol}
        nombre={nombre || email || 'Usuario'}
        email={email || ''}
        usuarioId={uid}
        idEstablecimiento={idEstablecimiento}
        permisos={permisosRol}
        cargandoPermisos={cargandoPermisos}
      >
        <Routes>
          <Route path="/" element={(rol as string) === 'TECNICO' ? <Navigate to="/tecnico/m/inicio" replace /> : renderRoleDashboard()} />
          <Route path="/dashboard" element={(rol as string) === 'TECNICO' ? <Navigate to="/tecnico/m/inicio" replace /> : renderRoleDashboard()} />
          <Route path="/secretaria" element={<DashboardSecretaria nombre={nombre || 'Usuario'} />} />
          <Route path="/secretaria/ausentes" element={puedeVer('/secretaria', 'ADMIN') ? <SecretariaAusentes /> : null} />
          <Route path="/secretaria/enviar-correo" element={puedeVer('/secretaria', 'ADMIN') ? <EnviarCorreo idEstablecimiento={idEstablecimiento!} /> : null} />
          <Route path="/mantenedor-funcionarios" element={puedeVer('/mantenedor-funcionarios', 'ADMIN') ? <MantenedorFuncionarios /> : null} />
          <Route path="/gestion-usuarios" element={puedeVer('/gestion-usuarios', 'ADMIN') ? <GestionUsuariosPage idEstablecimiento={idEstablecimiento!} /> : null} />
          <Route path="/gestion" element={puedeVer('/gestion', 'ADMIN') ? <GestionUsuariosPage idEstablecimiento={idEstablecimiento!} /> : null} />
          <Route path="/mantenedores" element={puedeVer('/mantenedores', 'ADMIN') ? <Mantenedores idEstablecimiento={idEstablecimiento!} /> : null} />
          <Route path="/registrar" element={(rol === 'ADMIN' || rol === 'INSPECTOR' || rol === 'PROFESOR') ? <RegistrarJustificacion idEstablecimiento={idEstablecimiento!} idUsuario={uid || ''} /> : null} />
          <Route path="/ver-justificaciones" element={(rol === 'ADMIN' || rol === 'INSPECTOR') ? <VerJustificaciones idEstablecimiento={idEstablecimiento!} rol={rol} idUsuario={uid || ''} /> : null} />
          <Route path="/gestion-pases" element={(rol === 'ADMIN' || rol === 'PROFESOR' || rol === 'INSPECTOR') ? <GestionPases idEstablecimiento={idEstablecimiento!} rol={rol} idUsuarioActual={uid || ''} /> : null} />
          <Route path="/justificaciones" element={(rol === 'ADMIN' || rol === 'INSPECTOR') ? <JustificacionesAtrasos idEstablecimiento={idEstablecimiento!} /> : null} />
          <Route path="/parametros" element={puedeVer('/parametros', 'ADMIN') ? <Parametros idEstablecimiento={idEstablecimiento!} /> : null} />
          <Route path="/en-linea" element={puedeVer('/en-linea', 'ADMIN') ? <EnLinea /> : null} />
          <Route path="/seguridad" element={puedeVer('/seguridad', 'ADMIN') ? <Seguridad /> : null} />
          <Route path="/configurar-2fa" element={<Configurar2FA />} />
          <Route path="/asignar-permisos" element={puedeVer('/asignar-permisos', 'ADMIN') ? <AsignarPermisos idEstablecimiento={idEstablecimiento!} /> : null} />
          <Route path="/sistema" element={puedeVer('/sistema', 'ADMIN') ? <MantenimientoConfig idEstablecimiento={idEstablecimiento!} /> : null} />
          <Route path="/monitoreo-correos" element={puedeVer('/monitoreo-correos', 'ADMIN') ? <MonitoreoCorreos idEstablecimiento={idEstablecimiento!} /> : null} />
          <Route path="/correos" element={puedeVer('/correos', 'ADMIN') ? <Correos idEstablecimiento={idEstablecimiento!} /> : null} />
          <Route path="/monitoreo-fallos" element={puedeVer('/monitoreo-fallos', 'ADMIN') ? <MonitoreoFallos idEstablecimiento={idEstablecimiento!} /> : null} />
          <Route path="/libros" element={puedeVer('/libros', 'ADMIN') ? <MantenedorLibros idEstablecimiento={idEstablecimiento!} /> : null} />
          <Route path="/catalogo" element={puedeVer('/catalogo', 'ADMIN') ? <Catalogo idEstablecimiento={idEstablecimiento!} /> : null} />
          <Route path="/biblioteca" element={puedeVer('/biblioteca', 'ADMIN') ? <Catalogo idEstablecimiento={idEstablecimiento!} /> : null} />
          <Route path="/prestamos" element={puedeVer('/prestamos', 'ADMIN') ? <Circulacion idEstablecimiento={idEstablecimiento!} usuarioId={uid || ''} /> : null} />
          <Route path="/historial-biblioteca" element={puedeVer('/historial-biblioteca', 'ADMIN') ? <HistorialBiblioteca idEstablecimiento={idEstablecimiento!} /> : null} />
          <Route path="/config-biblioteca" element={puedeVer('/config-biblioteca', 'ADMIN') ? <ConfigBiblioteca idEstablecimiento={idEstablecimiento!} /> : null} />
          <Route path="/inventario" element={puedeVer('/inventario', 'ADMIN') ? <Inventario idEstablecimiento={idEstablecimiento!} /> : null} />
          <Route path="/tecnico/qr" element={<QrRedirect />} />
          <Route path="/ticket" element={(rol === 'ADMIN' || rol === 'TECNICO' as string) ? <Ticket idEstablecimiento={idEstablecimiento!} idUsuario={uid || ''} /> : null} />
          <Route path="/tecnico" element={puedeVer('/tecnico', 'ADMIN') ? <Tecnico idEstablecimiento={idEstablecimiento!} /> : null} />
          <Route path="/tecnico/mapa" element={puedeVer('/tecnico', 'ADMIN') ? <Tecnico idEstablecimiento={idEstablecimiento!} /> : null} />
          <Route path="/tecnico/equipos" element={puedeVer('/tecnico', 'ADMIN') ? <Equipos idEstablecimiento={idEstablecimiento!} /> : null} />
          <Route path="/tecnico/ubicaciones" element={puedeVer('/tecnico', 'ADMIN') ? <Ubicaciones idEstablecimiento={idEstablecimiento!} /> : null} />
          <Route path="/tecnico/requerimientos" element={puedeVer('/tecnico', 'ADMIN') ? <Requerimientos idEstablecimiento={idEstablecimiento!} /> : null} />
          <Route path="/tecnico/accesos" element={(rol === 'ADMIN' || rol === 'TECNICO' as string) ? <AccesosRapidos idEstablecimiento={idEstablecimiento!} /> : null} />
          <Route path="/tecnico/menu" element={(rol === 'ADMIN' || rol === 'TECNICO' as string) ? <Navigate to="/tecnico/m/inicio" replace /> : null} />
          <Route path="/tecnico/m/inicio" element={(rol === 'ADMIN' || rol === 'TECNICO' as string) ? <MobileDashboard idEstablecimiento={idEstablecimiento!} nombre={nombre || ''} apellidos={apellidos || ''} /> : null} />
          <Route path="/tecnico/m/historial" element={(rol === 'ADMIN' || rol === 'TECNICO' as string) ? <HistorialMovil idEstablecimiento={idEstablecimiento!} /> : null} />
          <Route path="/tecnico/m/tickets" element={(rol === 'ADMIN' || rol === 'TECNICO' as string) ? <MobileTickets idEstablecimiento={idEstablecimiento!} /> : null} />
          <Route path="/tecnico/m/mapa" element={(rol === 'ADMIN' || rol === 'TECNICO' as string) ? <MobileMapa idEstablecimiento={idEstablecimiento!} /> : null} />
          <Route path="/tecnico/m/grid" element={(rol === 'ADMIN' || rol === 'TECNICO' as string) ? <MobileGrid idEstablecimiento={idEstablecimiento!} /> : null} />
          <Route path="/tecnico/m/equipos" element={(rol === 'ADMIN' || rol === 'TECNICO' as string) ? <MobileEquipos idEstablecimiento={idEstablecimiento!} /> : null} />
          <Route path="/tecnico/m/inventario" element={(rol === 'ADMIN' || rol === 'TECNICO' as string) ? <MobileInventario idEstablecimiento={idEstablecimiento!} /> : null} />
          <Route path="/tecnico/m/ubicaciones" element={(rol === 'ADMIN' || rol === 'TECNICO' as string) ? <MobileUbicaciones idEstablecimiento={idEstablecimiento!} /> : null} />
          <Route path="/tecnico/m/config" element={(rol === 'ADMIN' || rol === 'TECNICO' as string) ? <MobileConfigTecnico idEstablecimiento={idEstablecimiento!} /> : null} />
          <Route path="/tecnico/m/qr" element={(rol === 'ADMIN' || rol === 'TECNICO' as string) ? <MobileQrScanner idEstablecimiento={idEstablecimiento!} nombre={nombre || ''} apellidos={apellidos || ''} /> : null} />
          <Route path="/tecnico/m/accesos" element={(rol === 'ADMIN' || rol === 'TECNICO' as string) ? <AccesosRapidos idEstablecimiento={idEstablecimiento!} /> : null} />
          <Route path="/tecnico/configuracion" element={puedeVer('/tecnico', 'ADMIN') ? <ConfiguracionTecnico idEstablecimiento={idEstablecimiento!} /> : null} />
          <Route path="/ayuda" element={<AyudaPage />} />
          <Route path="/ayuda/admin" element={rol === 'ADMIN' ? <AdminAyuda /> : <AyudaPage />} />
          <Route path="*" element={renderRoleDashboard()} />
        </Routes>
      </Layout>
    </SkinProvider>
  );
}

const styles: Record<string, React.CSSProperties> = {
  pantallaCarga: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    fontFamily: 'Arial, sans-serif',
    flexDirection: 'column',
    gap: '12px',
  },
  spinner: {
    fontSize: '48px',
    margin: 0,
  },
  textoCarga: {
    color: '#6B7280',
    fontSize: '16px',
    margin: 0,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '48px 40px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
    textAlign: 'center',
  },
  icono: {
    fontSize: '48px',
    margin: '0 0 16px 0',
  },
  titulo: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1A3C6B',
    margin: '0 0 16px 0',
  },
  texto: {
    fontSize: '14px',
    color: '#374151',
    margin: '0 0 12px 0',
    lineHeight: '1.5',
  },
  subTexto: {
    fontSize: '13px',
    color: '#6B7280',
    margin: '0 0 24px 0',
    lineHeight: '1.5',
  },
  botonActivar: {
    padding: '12px 24px',
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    marginBottom: '12px',
    transition: 'background-color 0.2s',
  } as React.CSSProperties,
  botonSalir: {
    padding: '10px 24px',
    backgroundColor: '#F3F4F6',
    color: '#374151',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  error: {
    color: '#DC2626',
    fontSize: '12px',
    backgroundColor: '#FEE2E2',
    padding: '8px 12px',
    borderRadius: '6px',
    margin: '0 0 16px 0',
  },
  dashboardTemp: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
  },
  bienvenidaTexto: {
    fontSize: '15px',
    color: '#374151',
    margin: 0,
  },
  modalOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
    maxWidth: '500px',
    width: '90%',
    overflow: 'hidden',
  },
  modalHeader: {
    padding: '24px',
    borderBottom: '1px solid #E5E7EB',
  },
  modalTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '700',
    color: '#DC2626',
  },
  modalBody: {
    padding: '24px',
  },
  modalText: {
    margin: 0,
    fontSize: '14px',
    color: '#374151',
    lineHeight: '1.6',
  },
  modalFooter: {
    padding: '16px 24px',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    borderTop: '1px solid #E5E7EB',
  },
  modalButton: {
    padding: '10px 20px',
    backgroundColor: '#DC2626',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  // Estilos para modal de inactividad
  modalContentInactivity: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    width: '90%',
    maxWidth: '420px',
    padding: 0,
  },
  modalHeaderInactivity: {
    padding: '24px',
    borderBottom: '1px solid #FEE2E2',
    backgroundColor: '#FEF2F2',
  },
  modalTitleInactivity: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '700',
    color: '#DC2626',
  },
  modalBodyInactivity: {
    padding: '24px',
    textAlign: 'center' as const,
  },
  modalTextInactivity: {
    margin: '0 0 16px 0',
    fontSize: '14px',
    color: '#374151',
    lineHeight: '1.6',
  },
  cronometro: {
    margin: '24px 0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
  },
  cronometroNumero: {
    fontSize: '48px',
    fontWeight: '700',
    color: '#DC2626',
    fontFamily: 'monospace',
    minWidth: '80px',
  },
  cronometroTexto: {
    fontSize: '14px',
    color: '#6B7280',
  },
  modalFooterInactivity: {
    padding: '16px 24px',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    borderTop: '1px solid #E5E7EB',
  },
  botonContinuar: {
    padding: '10px 20px',
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  botonCerrarAhora: {
    padding: '10px 20px',
    backgroundColor: '#E5E7EB',
    color: '#374151',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};