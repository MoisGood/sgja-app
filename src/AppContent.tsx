// ============================================================
// SGJA – Contenido de la App (Lógica de Autenticación)
// src/AppContent.tsx
// ============================================================

import { useAuth } from './hooks/useAuth';
import { useInactivityWarning } from './hooks/useInactivityWarning';
import { usePermisosUsuario } from './hooks/usePermisosUsuario';
import { useState, lazy, Suspense, useEffect, useRef, useCallback } from 'react';
import ChunkErrorBoundary from './components/ChunkErrorBoundary';
import { supabase } from './lib/supabase';
import { Rol } from './types';
import Login from './pages/Login';
import Layout from './components/Layout';
import DashboardAdmin from './pages/DashboardAdmin';
import DashboardInspector from './pages/DashboardInspector';
import DashboardProfesor from './pages/DashboardProfesor';
import DashboardEstudiante from './pages/DashboardEstudiante';
import DashboardApoderado from './pages/DashboardApoderado';
import GestionUsuarios from './pages/GestionUsuarios';
import RegistrarJustificacion from './pages/RegistrarJustificacion';
import VerJustificaciones from './pages/VerJustificaciones';
import MantenedorMotivos from './pages/MantenedorMotivos';
import GestionPases from './pages/GestionPases';
import JustificacionesAtrasos from './pages/JustificacionesAtrasos';
import Parametros from './pages/Parametros';
import EnLinea from './pages/EnLinea';
import Seguridad from './pages/Seguridad';
import BloqueHorario from './pages/BloqueHorario';
import AsignarPermisos from './pages/AsignarPermisos';
import MantenedorRolesPage from './pages/MantenedorRolesPage';
import Reportes from './pages/Reportes';
import MantenedorCursos from './pages/MantenedorCursos';
import MantenedorFuncionarios from './pages/MantenedorFuncionarios';
import SecretariaAusentes from './pages/SecretariaAusentes';
import DashboardSecretaria from './pages/DashboardSecretaria';
import EnviarCorreo from './pages/EnviarCorreo';
import FormularioRegistroInicial from './pages/FormularioRegistroInicial';
import FormularioDatosPersonales from './pages/FormularioDatosPersonales';
import SolicitudesRegistro from './pages/SolicitudesRegistro';
import MantenedorLibros from './pages/MantenedorLibros';
import Catalogo from './pages/Catalogo';
import Circulacion from './pages/Circulacion';
import Inventario from './pages/Inventario';
import HistorialBiblioteca from './pages/HistorialBiblioteca';
import ConfigBiblioteca from './pages/ConfigBiblioteca';
import Correos from './pages/Correos';
import MonitoreoCorreos from './pages/MonitoreoCorreos';
import MonitoreoFallos from './pages/MonitoreoFallos';
import MantenimientoConfig from './pages/MantenimientoConfig';
import Tecnico from './pages/Tecnico';
import Equipos from './pages/Equipos';
import Ubicaciones from './pages/Ubicaciones';
import Requerimientos from './pages/Requerimientos';
import ConfiguracionTecnico from './pages/ConfiguracionTecnico';
import Ticket from './pages/Ticket';
import AccesosRapidos from './pages/AccesosRapidos';
import MenuTecnico from './pages/MenuTecnico';
import MobileMapa from './pages/MobileMapa';
import MobileEquipos from './pages/MobileEquipos';
import MobileUbicaciones from './pages/MobileUbicaciones';
import MobileConfigTecnico from './pages/MobileConfigTecnico';
import MobileDashboard from './pages/MobileDashboard';
import MobileQrScanner from './pages/MobileQrScanner';
import MobileNavBar from './components/MobileNavBar';
import QrRedirect from './pages/QrRedirect';
import Configurar2FA from './pages/Configurar2FA';
import MantenedorEstablecimiento from './pages/MantenedorEstablecimiento';
import MantenedorSistema from './pages/MantenedorSistema';

const MantenedorEstudiantes = lazy(() => import('./pages/MantenedorEstudiantes'));

export default function AppContent() {
  const { uid, rol, idEstablecimiento, cargando, autorizado, usuarioInactivo, documentoExiste, nombre, apellidos, email, datosPendientes, mantenimientoBloqueo, mttoHorario } = useAuth();
  const [rutaActiva, setRutaActiva] = useState(() => {
    const hash = window.location.hash.replace(/^#/, '') || '/dashboard';
    return hash.split('?')[0];
  });

  // Redirigir TECNICO al dashboard móvil en carga inicial
  const redirigidoRef = useRef(false);
  useEffect(() => {
    if ((rol as string) === 'TECNICO' && !redirigidoRef.current) {
      const hash = window.location.hash.replace(/^#/, '').split('?')[0];
      if (!hash || hash === '/dashboard') {
        redirigidoRef.current = true;
        window.location.hash = '/tecnico/m/inicio';
      }
    }
  }, [rol]);
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

  useEffect(() => {
    const handler = () => {
      const hash = window.location.hash.replace(/^#/, '') || '/dashboard';
      setRutaActiva(hash.split('?')[0]);
    };
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const { mostrarModal, segundosRestantes, cerrandoSesion, extenderSesion } = useInactivityWarning(rol, autorizado);
  const { permisos: permisosRol } = usePermisosUsuario(idEstablecimiento || '', rol as Rol);
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

  const renderizarDashboard = () => {
    if (!idEstablecimiento) return null;
    const estab = idEstablecimiento;
    const user = uid || '';
    
    switch (rutaActiva) {
      case '/secretaria':
        return <DashboardSecretaria nombre={nombre || 'Usuario'} onNavegar={setRutaActiva} />;
      case '/gestion-usuarios':
        return puedeVer('/gestion-usuarios', 'ADMIN') ? <GestionUsuarios idEstablecimiento={estab} /> : null;
      case '/registrar':
        return (rol === 'ADMIN' || rol === 'INSPECTOR' || rol === 'PROFESOR') ? <RegistrarJustificacion idEstablecimiento={estab} idUsuario={user} /> : null;
      case '/ver-justificaciones':
        return (rol === 'ADMIN' || rol === 'INSPECTOR') ? <VerJustificaciones idEstablecimiento={estab} rol={rol} idUsuario={user} /> : null;
      case '/mantenedor-motivos':
        return puedeVer('/mantenedor-motivos', 'ADMIN') ? <MantenedorMotivos idEstablecimiento={estab} /> : null;
      case '/gestion-pases':
        return (rol === 'ADMIN' || rol === 'PROFESOR' || rol === 'INSPECTOR') ? <GestionPases idEstablecimiento={estab} rol={rol} idUsuarioActual={user} /> : null;
      case '/justificaciones':
        return (rol === 'ADMIN' || rol === 'INSPECTOR') ? <JustificacionesAtrasos idEstablecimiento={estab} /> : null;
      case '/parametros':
        return puedeVer('/parametros', 'ADMIN') ? <Parametros idEstablecimiento={estab} /> : null;
      case '/en-linea':
        return puedeVer('/en-linea', 'ADMIN') ? <EnLinea /> : null;
      case '/seguridad':
        return puedeVer('/seguridad', 'ADMIN') ? <Seguridad /> : null;
      case '/configurar-2fa':
        return <Configurar2FA />;
      case '/bloque-horario':
        return puedeVer('/bloque-horario', 'ADMIN') ? <BloqueHorario idEstablecimiento={estab} /> : null;
      case '/asignar-permisos':
        return puedeVer('/asignar-permisos', 'ADMIN') ? <AsignarPermisos idEstablecimiento={estab} /> : null;
      case '/mantenedor-roles':
        return puedeVer('/mantenedor-roles', 'ADMIN') ? <MantenedorRolesPage idEstablecimiento={estab} /> : null;
      case '/mantenedor-establecimiento':
        return puedeVer('/mantenedor-establecimiento', 'ADMIN') ? <MantenedorEstablecimiento idEstablecimiento={estab} /> : null;
      case '/reportes':
        return puedeVer('/reportes', 'ADMIN') ? <Reportes idEstablecimiento={estab} /> : null;
      case '/mantenedor-estudiantes':
        return puedeVer('/mantenedor-estudiantes', 'ADMIN') ? (
          <ChunkErrorBoundary>
            <Suspense fallback={<div style={styles.textoCarga}>Cargando mantenedor...</div>}>
              <MantenedorEstudiantes idEstablecimiento={estab} />
            </Suspense>
          </ChunkErrorBoundary>
        ) : null;
      case '/mantenedor-cursos':
        return puedeVer('/mantenedor-cursos', 'ADMIN') ? <MantenedorCursos /> : null;
      case '/mantenedor-funcionarios':
        return puedeVer('/mantenedor-funcionarios', 'ADMIN') ? <MantenedorFuncionarios /> : null;
      case '/secretaria/ausentes':
        return puedeVer('/secretaria/ausentes', 'ADMIN') ? <SecretariaAusentes /> : null;
      case '/secretaria/enviar-correo':
        return puedeVer('/secretaria/enviar-correo', 'ADMIN') ? <EnviarCorreo idEstablecimiento={estab} /> : null;

      case '/solicitudes-registro':
        return puedeVer('/solicitudes-registro', 'ADMIN') ? <SolicitudesRegistro idEstablecimiento={estab} /> : null;
      case '/prestamos':
        return puedeVer('/prestamos', 'ADMIN') ? <Circulacion idEstablecimiento={estab} usuarioId={uid || ''} /> : null;
      case '/historial-biblioteca':
        return puedeVer('/historial-biblioteca', 'ADMIN') ? <HistorialBiblioteca idEstablecimiento={estab} /> : null;
      case '/config-biblioteca':
        return puedeVer('/config-biblioteca', 'ADMIN') ? <ConfigBiblioteca idEstablecimiento={estab} /> : null;
      case '/correos':
        return puedeVer('/correos', 'ADMIN') ? <Correos idEstablecimiento={estab} /> : null;
      case '/config-sistema':
        return puedeVer('/config-sistema', 'ADMIN') ? <MantenedorSistema /> : null;
      case '/sistema':
        return puedeVer('/sistema', 'ADMIN') ? <MantenimientoConfig idEstablecimiento={estab} /> : null;
      case '/monitoreo-correos':
        return puedeVer('/monitoreo-correos', 'ADMIN') ? <MonitoreoCorreos idEstablecimiento={estab} /> : null;
      case '/monitoreo-fallos':
        return puedeVer('/monitoreo-fallos', 'ADMIN') ? <MonitoreoFallos idEstablecimiento={estab} /> : null;
      case '/libros':
        return puedeVer('/libros', 'ADMIN') ? <MantenedorLibros idEstablecimiento={estab} /> : null;
      case '/catalogo':
        return puedeVer('/catalogo', 'ADMIN') ? <Catalogo idEstablecimiento={estab} /> : null;
      case '/inventario':
        return puedeVer('/inventario', 'ADMIN') ? <Inventario idEstablecimiento={estab} /> : null;
      case '/tecnico/qr':
        return <QrRedirect />;
      case '/ticket':
        return (rol === 'ADMIN' || rol === 'TECNICO' as string) ? <Ticket idEstablecimiento={estab} idUsuario={user} /> : null;
      case '/tecnico':
      case '/tecnico/mapa':
        return puedeVer('/tecnico', 'ADMIN') ? <Tecnico idEstablecimiento={estab} /> : null;
      case '/tecnico/equipos':
        return puedeVer('/tecnico', 'ADMIN') ? <Equipos idEstablecimiento={estab} /> : null;
      case '/tecnico/ubicaciones':
        return puedeVer('/tecnico', 'ADMIN') ? <Ubicaciones idEstablecimiento={estab} /> : null;
      case '/tecnico/requerimientos':
        return puedeVer('/tecnico', 'ADMIN') ? <Requerimientos idEstablecimiento={estab} /> : null;
      case '/tecnico/accesos':
        return (rol === 'ADMIN' || rol === 'TECNICO' as string) ? <AccesosRapidos idEstablecimiento={estab} /> : null;
      case '/tecnico/menu':
        return (rol === 'ADMIN' || rol === 'TECNICO' as string) ? <MenuTecnico idEstablecimiento={estab} /> : null;
      case '/tecnico/m/inicio':
        return (rol === 'ADMIN' || rol === 'TECNICO' as string) ? <MobileDashboard idEstablecimiento={estab} /> : null;
      case '/tecnico/m/mapa':
        return (rol === 'ADMIN' || rol === 'TECNICO' as string) ? <MobileMapa idEstablecimiento={estab} /> : null;
      case '/tecnico/m/equipos':
        return (rol === 'ADMIN' || rol === 'TECNICO' as string) ? <MobileEquipos idEstablecimiento={estab} /> : null;
      case '/tecnico/m/ubicaciones':
        return (rol === 'ADMIN' || rol === 'TECNICO' as string) ? <MobileUbicaciones idEstablecimiento={estab} /> : null;
      case '/tecnico/m/config':
        return (rol === 'ADMIN' || rol === 'TECNICO' as string) ? <MobileConfigTecnico idEstablecimiento={estab} /> : null;
      case '/tecnico/m/qr':
        return (rol === 'ADMIN' || rol === 'TECNICO' as string) ? <MobileQrScanner /> : null;
      case '/tecnico/m/accesos':
        return (rol === 'ADMIN' || rol === 'TECNICO' as string) ? <AccesosRapidos idEstablecimiento={estab} /> : null;
      case '/tecnico/configuracion':
        return puedeVer('/tecnico', 'ADMIN') ? <ConfiguracionTecnico idEstablecimiento={estab} /> : null;
      default:
        return renderizarPorRol();
    }
  };

  const renderizarPorRol = () => {
    if (!idEstablecimiento) return null;
    const estab = idEstablecimiento;
    const user = uid || '';
    
    switch (rol as string) {
      case 'ADMIN':
        return <DashboardAdmin idEstablecimiento={estab} onNavegar={setRutaActiva} />;
      case 'INSPECTOR':
        return <DashboardInspector idEstablecimiento={estab} />;
      case 'PROFESOR':
        return <DashboardProfesor idEstablecimiento={estab} idProfesor={user} />;
      case 'ESTUDIANTE':
        return <DashboardEstudiante idEstudiante={user} />;
      case 'APODERADO':
        return <DashboardApoderado idApoderado={user} idEstablecimiento={estab} />;
      case 'TECNICO':
        return <AccesosRapidos idEstablecimiento={estab} />;
      default:
        return <DashboardSecretaria nombre={nombre || 'Usuario'} onNavegar={setRutaActiva} />;
    }
  };

  return (
    <>
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
        rutaActiva={rutaActiva}
        onRutaChange={setRutaActiva}
        usuarioId={uid}
        idEstablecimiento={idEstablecimiento}
      >
        {renderizarDashboard()}
        {rutaActiva.startsWith('/tecnico/m/') && <MobileNavBar />}
      </Layout>
    </>
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