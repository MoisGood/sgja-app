// ============================================================
// SGJA – Layout Principal con Sidebar
// src/components/Layout.tsx
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { registrarCierre } from '../services/online';
import { obtenerConfiguracionInactividad } from '../services/online';
import { obtenerEstablecimiento } from '../services/database';
import { Rol } from '../types';
import { MobileLayout } from './MobileLayout';
import { useTheme } from '../hooks/useTheme';
import { usePermisosUsuario } from '../hooks/usePermisosUsuario';
import DatosPersonalesModal from './DatosPersonalesModal';
import Sidebar from './Sidebar';
import Header from './Header';
import { Wrench, UserX, Map, Monitor, Building2, ExternalLink } from 'lucide-react';
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  BookOpen,
  Calendar,
  Settings,
  Shield,
  Mail,
} from 'lucide-react';

interface Props {
  children:             React.ReactNode;
  rol:                  Rol;
  nombre:               string;
  email:                string;
  rutaActiva:           string;
  onRutaChange:         (ruta: string) => void;
  usuarioId?:           string;
  idEstablecimiento:    string | null;
}

interface MenuItem {
  icono:     React.ReactNode;
  etiqueta:  string;
  ruta:      string;
  roles:     Rol[];
  submenu?:  MenuItem[];
}

const MENU_ITEMS: MenuItem[] = [
  { icono: <LayoutDashboard size={20}/>, etiqueta: 'Inicio',          ruta: '/dashboard',    roles: [Rol.ADMIN, Rol.INSPECTOR, Rol.PROFESOR, Rol.ESTUDIANTE, Rol.APODERADO] },
   { 
    icono: <Users size={20}/>, 
    etiqueta: 'Secretaría',   
    ruta: '/secretaria',
    roles: [Rol.ADMIN],
    submenu: [
      { icono: <Users size={20}/>, etiqueta: 'Funcionarios', ruta: '/mantenedor-funcionarios', roles: [Rol.ADMIN] },
      { icono: <UserX size={20}/>, etiqueta: 'Ausentes', ruta: '/secretaria/ausentes', roles: [Rol.ADMIN] },
      { icono: <Mail size={20}/>, etiqueta: 'Redactar Correo', ruta: '/secretaria/enviar-correo', roles: [Rol.ADMIN] },
    ]
  },
  { 
    icono: <BookOpen         size={20}/>, 
    etiqueta: 'Justificaciones', 
    ruta: '/justificaciones',
    roles: [Rol.INSPECTOR, Rol.ADMIN, Rol.PROFESOR],
    submenu: [
      { icono: <ClipboardList size={20}/>, etiqueta: 'Registrar',         ruta: '/registrar',              roles: [Rol.ADMIN, Rol.INSPECTOR, Rol.PROFESOR] },
      { icono: <BookOpen size={20}/>, etiqueta: 'Ver Justificaciones',   ruta: '/ver-justificaciones',    roles: [Rol.ADMIN, Rol.INSPECTOR] },
      { icono: <ClipboardList size={20}/>, etiqueta: 'Gestión de Pases', ruta: '/gestion-pases',         roles: [Rol.ADMIN, Rol.INSPECTOR, Rol.PROFESOR] },
    ]
  },
  {
    icono: <Wrench size={20}/>,
    etiqueta: 'Técnico',
    ruta: '/tecnico',
    roles: [Rol.ADMIN],
    submenu: [
      { icono: <Map size={20}/>, etiqueta: 'Mapa', ruta: '/tecnico/mapa', roles: [Rol.ADMIN] },
      { icono: <Monitor size={20}/>, etiqueta: 'Equipos', ruta: '/tecnico/equipos', roles: [Rol.ADMIN] },
      { icono: <Building2 size={20}/>, etiqueta: 'Ubicaciones', ruta: '/tecnico/ubicaciones', roles: [Rol.ADMIN] },
      { icono: <ClipboardList size={20}/>, etiqueta: 'Requerimientos', ruta: '/tecnico/requerimientos', roles: [Rol.ADMIN] },
      { icono: <Settings size={20}/>, etiqueta: 'Configuración', ruta: '/tecnico/configuracion', roles: [Rol.ADMIN] },
      { icono: <ExternalLink size={20}/>, etiqueta: 'Accesos', ruta: '/tecnico/accesos', roles: [Rol.ADMIN] },
    ]
  },
  {
    icono: <BookOpen size={20}/>,
    etiqueta: 'Biblioteca',
    ruta: '/biblioteca',
    roles: [Rol.ADMIN, Rol.ESTUDIANTE],
    submenu: [
      { icono: <BookOpen size={20}/>, etiqueta: 'Libros', ruta: '/libros', roles: [Rol.ADMIN] },
      { icono: <BookOpen size={20}/>, etiqueta: 'Catálogo', ruta: '/catalogo', roles: [Rol.ADMIN, Rol.ESTUDIANTE] },
      { icono: <ClipboardList size={20}/>, etiqueta: 'Préstamos', ruta: '/prestamos', roles: [Rol.ADMIN] },
      { icono: <ClipboardList size={20}/>, etiqueta: 'Inventario', ruta: '/inventario', roles: [Rol.ADMIN] },
      { icono: <BookOpen size={20}/>, etiqueta: 'Historial', ruta: '/historial-biblioteca', roles: [Rol.ADMIN] },
      { icono: <Settings size={20}/>, etiqueta: 'Configuración', ruta: '/config-biblioteca', roles: [Rol.ADMIN] },
    ]
  },
  {
    icono: <ClipboardList size={20}/>,
    etiqueta: 'Monitoreo',
    ruta: '/monitoreo',
    roles: [Rol.ADMIN],
    submenu: [
      { icono: <Mail size={20}/>, etiqueta: 'Correos', ruta: '/monitoreo-correos', roles: [Rol.ADMIN] },
      { icono: <ClipboardList size={20}/>, etiqueta: 'Operaciones', ruta: '/monitoreo-fallos', roles: [Rol.ADMIN] },
    ]
  },
  { icono: <Shield size={20}/>, etiqueta: 'Seguridad', ruta: '/seguridad', roles: [Rol.ADMIN, Rol.INSPECTOR, Rol.PROFESOR, Rol.ESTUDIANTE, Rol.APODERADO] },
  { 
    icono: <Settings         size={20}/>, 
    etiqueta: 'Configuración',   
    ruta: '/configuracion',
    roles: [Rol.ADMIN, Rol.PROFESOR],
    submenu: [
      { icono: <Users size={20}/>, etiqueta: 'En línea', ruta: '/en-linea', roles: [Rol.ADMIN] },
      { icono: <Users size={20}/>, etiqueta: 'Gestión Usuarios', ruta: '/gestion-usuarios', roles: [Rol.ADMIN, Rol.PROFESOR] },
      { icono: <Users size={20}/>, etiqueta: 'Mantenedor Estudiantes', ruta: '/mantenedor-estudiantes', roles: [Rol.ADMIN] },
      { icono: <Users size={20}/>, etiqueta: 'Mantenedor de Roles', ruta: '/mantenedor-roles', roles: [Rol.ADMIN] },
      { icono: <ClipboardList size={20}/>, etiqueta: 'Motivos de Justificación', ruta: '/mantenedor-motivos', roles: [Rol.ADMIN] },
      { icono: <Settings size={20}/>, etiqueta: 'Parámetros',    ruta: '/parametros',       roles: [Rol.ADMIN] },
      { icono: <Shield size={20}/>, etiqueta: 'Asignar Accesos', ruta: '/asignar-permisos', roles: [Rol.ADMIN] },
      { icono: <Calendar size={20}/>, etiqueta: 'Bloques Horarios', ruta: '/bloque-horario', roles: [Rol.ADMIN] },
      { icono: <Users size={20}/>, etiqueta: 'Solicitudes de Registro', ruta: '/solicitudes-registro', roles: [Rol.ADMIN] },
      { icono: <Mail size={20}/>, etiqueta: 'Correos', ruta: '/correos', roles: [Rol.ADMIN] },
      { icono: <Settings size={20}/>, etiqueta: 'Sistema', ruta: '/sistema', roles: [Rol.ADMIN] },
    ]
  } 
];

export default function Layout({ children, rol, nombre, email, rutaActiva, onRutaChange, usuarioId, idEstablecimiento }: Props) {
  const { temaOscuro, setTemaOscuro } = useTheme();
  const { permisos, cargando: cargandoPermisos } = usePermisosUsuario(idEstablecimiento || '', rol);
  const [sidebarAbierto, setSidebarAbierto] = useState(true);
  const [submenuAbierto, setSubmenuAbierto] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  const [modalDatosAbierto, setModalDatosAbierto] = useState(false);
  const [establecimientoNombre, setEstablecimientoNombre] = useState('');

  useEffect(() => {
    if (idEstablecimiento) {
      obtenerEstablecimiento(idEstablecimiento)
        .then(e => { if (e) setEstablecimientoNombre(e.nombre || ''); })
        .catch(() => {});
    }
  }, [idEstablecimiento]);

  React.useEffect(() => {
    const handleResize = () => { setIsMobile(window.innerWidth < 768); };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [minutosInactividad, setMinutosInactividad] = useState(30);
  const cerrarAutomaticoRef = useRef(true);
  const [mostrarAdvertencia, setMostrarAdvertencia] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const advRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  React.useEffect(() => {
    if (!usuarioId) return;
    obtenerConfiguracionInactividad(usuarioId).then(config => {
      if (config) {
        setMinutosInactividad(config.minutosInactividad);
        cerrarAutomaticoRef.current = config.cerrarAutomatico;
      }
    }).catch(() => {});
  }, [usuarioId]);

  function reiniciarTimerInactividad() {
    if (!cerrarAutomaticoRef.current) return;
    setMostrarAdvertencia(false);
    clearTimeout(timerRef.current);
    clearTimeout(advRef.current);
    const ms = minutosInactividad * 60 * 1000;
    const advMs = Math.max(0, ms - 60 * 1000);
    if (advMs > 0) advRef.current = setTimeout(() => setMostrarAdvertencia(true), advMs);
    timerRef.current = setTimeout(() => handleLogout(), ms);
  }

  React.useEffect(() => {
    if (!cerrarAutomaticoRef.current) return;
    reiniciarTimerInactividad();
    const eventos = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    eventos.forEach(ev => window.addEventListener(ev, reiniciarTimerInactividad));
    return () => {
      clearTimeout(timerRef.current);
      clearTimeout(advRef.current);
      eventos.forEach(ev => window.removeEventListener(ev, reiniciarTimerInactividad));
    };
  }, [minutosInactividad]);

  const esRolPredefinido = Object.values(Rol).includes(rol as Rol);

  const tienePermiso = (ruta: string) => {
    if (cargandoPermisos) return true;
    if (permisos.length === 0) return false;
    return permisos.includes(ruta);
  };

  const tieneAccesoSub = (sub: MenuItem) => {
    if (!esRolPredefinido) return tienePermiso(sub.ruta);
    if (rol === Rol.ADMIN) return true;
    if (sub.roles.includes(rol)) return tienePermiso(sub.ruta);
    return tienePermiso(sub.ruta);
  };

  const itemsFiltrados = MENU_ITEMS.reduce<MenuItem[]>((acc, item) => {
    const pasa =
      esRolPredefinido && rol === Rol.ADMIN ? true
      : item.submenu && item.submenu.length > 0
        ? item.submenu.filter(tieneAccesoSub).length > 0
      : esRolPredefinido && !item.roles.includes(rol) ? false
      : tienePermiso(item.ruta);

    if (pasa) {
      acc.push({
        ...item,
        submenu: item.submenu?.filter(tieneAccesoSub),
      });
    }
    return acc;
  }, []);

  const handleLogout = async () => {
    try {
      console.log(`🔴 Cerrando sesión para usuario: ${usuarioId}`);
      if (email) {
        console.log(`📝 Registrando cierre en colección online...`);
        await registrarCierre(email);
        // Pequeño delay para asegurar que Supabase procesa la actualización
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log(`✅ Cierre registrado, cerrando sesión en Supabase...`);
      }
      await supabase.auth.signOut();
      console.log(`✅ Sesión cerrada exitosamente`);
    } catch (error) {
      console.error('❌ Error al cerrar sesión:', error);
      // Intentar cerrar sesión de todas formas
      try {
        await supabase.auth.signOut();
      } catch (signOutError) {
        console.error('❌ Error al cerrar sesión en Supabase:', signOutError);
      }
    }
  };

  // Mobile: Usar MobileLayout
  if (isMobile) {
    return (
      <MobileLayout
        rol={rol}
        nombre={nombre}
        email={email}
        onRutaChange={onRutaChange}
        usuarioId={usuarioId}
        idEstablecimiento={idEstablecimiento}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={rutaActiva}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.12 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </MobileLayout>
    );
  }

  // Desktop: Usar layout actual
  return (
    <div style={styles.contenedor} key={`layout-${temaOscuro}`}>
      <Sidebar
        sidebarAbierto={sidebarAbierto}
        setSidebarAbierto={setSidebarAbierto}
        itemsFiltrados={itemsFiltrados}
        rutaActiva={rutaActiva}
        submenuAbierto={submenuAbierto}
        setSubmenuAbierto={setSubmenuAbierto}
        onRutaChange={onRutaChange}
        handleLogout={handleLogout}
      />

      <main style={styles.main}>
        <Header
          temaOscuro={temaOscuro}
          setTemaOscuro={setTemaOscuro}
          nombre={nombre}
          rol={rol}
          email={email}
          usuarioId={usuarioId}
          onAbrirDatos={() => setModalDatosAbierto(true)}
          establecimientoNombre={establecimientoNombre}
        />

        <div style={styles.contenido}>
          <AnimatePresence mode="wait">
            <motion.div
              key={rutaActiva}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.12 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <DatosPersonalesModal
        abierto={modalDatosAbierto}
        onCerrar={() => setModalDatosAbierto(false)}
        usuarioId={usuarioId || ''}
        nombre={nombre}
        rol={rol}
        email={email}
      />

      {mostrarAdvertencia && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999
        }}>
          <div style={{
            background: '#FFF', borderRadius: '12px', padding: '32px', maxWidth: '400px', width: '90%',
            textAlign: 'center', boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>⏳</div>
            <h3 style={{ margin: '0 0 8px', color: '#1A3C6B' }}>¿Sigues ahí?</h3>
            <p style={{ fontSize: '14px', color: '#6B7280', margin: '0 0 24px' }}>
              Tu sesión se cerrará por inactividad en menos de <strong>1 minuto</strong>.
              <br /><small style={{ color: '#9CA3AF' }}>Tiempo configurado: {minutosInactividad} min</small>
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button type="button" onClick={reiniciarTimerInactividad} style={{
                padding: '10px 24px', background: '#1A3C6B', color: '#FFF', border: 'none',
                borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '14px'
              }}>
                Seguir navegando
              </button>
              <button type="button" onClick={handleLogout} style={{
                padding: '10px 24px', background: '#F3F4F6', color: '#374151', border: '1px solid #D1D5DB',
                borderRadius: '8px', fontWeight: 500, cursor: 'pointer', fontSize: '14px'
              }}>
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  contenedor: {
    display:    'flex',
    minHeight:  '100vh',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#F8FAFC',
  },
  sidebar: {
    backgroundColor: '#1A3C6B',
    display:         'flex',
    flexDirection:   'column',
    transition:      'width 0.25s ease, min-width 0.25s ease',
    position:        'sticky',
    top:             0,
    height:          '100vh',
    overflowY:       'auto',
    overflowX:       'hidden',
  },
  sidebarHeader: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    padding:        '20px 16px',
    borderBottom:   '1px solid rgba(255,255,255,0.1)',
  },
  logoArea: {
    display:    'flex',
    alignItems: 'center',
    gap:        '10px',
  },
  logoIcono: {
    fontSize: '28px',
  },
  logoTitulo: {
    color:      '#FFFFFF',
    fontWeight: '700',
    fontSize:   '18px',
    margin:     0,
  },
  logoSub: {
    color:    '#93C5FD',
    fontSize: '12px',
    margin:   0,
  },
  botonMenu: {
    background:   'transparent',
    border:       'none',
    cursor:       'pointer',
    padding:      '4px',
    borderRadius: '6px',
    display:      'flex',
    alignItems:   'center',
  },
  nav: {
    display:       'flex',
    flexDirection: 'column',
    padding:       '12px 8px',
    gap:           '4px',
    flex:          1,
  },
  navItem: {
    display:      'flex',
    alignItems:   'center',
    gap:          '12px',
    padding:      '10px 12px',
    borderRadius: '8px',
    border:       'none',
    cursor:       'pointer',
    width:        '100%',
    transition:   'background-color 0.15s',
    background:   'transparent',
  },
  navEtiqueta: {
    fontSize:     '14px',
    fontWeight:   '500',
    whiteSpace:   'nowrap',
    overflow:     'hidden',
    textOverflow: 'ellipsis',
  },
  submenu: {
    display:       'flex',
    flexDirection: 'column',
    paddingLeft:   '8px',
    gap:           '2px',
  },
  submenuItem: {
    display:      'flex',
    alignItems:   'center',
    gap:          '12px',
    padding:      '8px 12px 8px 20px',
    borderRadius: '6px',
    border:       'none',
    cursor:       'pointer',
    width:        '100%',
    fontSize:     '13px',
    transition:   'background-color 0.15s',
    background:   'transparent',
  } as React.CSSProperties,
  main: {
    flex:          1,
    display:       'flex',
    flexDirection: 'column',
    minWidth:      0,
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottom:    '1px solid #E2E8F0',
    padding:         '16px 32px',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'space-between',
    position:        'sticky',
    top:             0,
    zIndex:          10,
  },
  headerTitulo: {
    fontSize:   '20px',
    fontWeight: '700',
    color:      '#1A3C6B',
    margin:     0,
  },
  headerDerecha: {
    display:    'flex',
    alignItems: 'center',
    gap:        '12px',
  },
  contenido: {
    padding: '32px',
    flex:    1,
  },
};
