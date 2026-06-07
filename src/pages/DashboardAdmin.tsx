// ============================================================
// SGJA – Dashboard Admin
// src/pages/DashboardAdmin.tsx
// ============================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/dashboard.css';

interface Props {
  idEstablecimiento: string;
}

export default function DashboardAdmin(_props: Props) {
  const navigate = useNavigate();
  const [configuracionExpandida, setConfiguracionExpandida] = useState(false);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Dashboard Admin</h1>
        <p className="dashboard-subtitle">Bienvenido al panel de administración</p>
      </div>

      {/* ⚡ OPTIMIZACIÓN: Tabla de solicitudes eliminada para reducir lecturas en dashboard */}
      {/* Ver DetallesSolicitudes.tsx para historial completo */}

      {/* Accesos Rápidos */}
      <div style={{ background: 'white', borderRadius: '12px', padding: 'clamp(1rem, 3vw, 1.5rem)', marginTop: '1.5rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', border: '1px solid #e5e7eb' }}>
        <h3 style={{ fontSize: 'clamp(1rem, 3vw, 1.25rem)', fontWeight: 600, marginBottom: '0.5rem' }}>⚡ Accesos Rápidos</h3>
        <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem' }}>Funciones principales</p>
        <div className="dashboard-actions">
          <AccesoRapido icono="👥" titulo="Gestionar Usuarios" onClick={() => navigate('/gestion-usuarios')} />
          <AccesoRapido icono="📋" titulo="Crear Solicitud" onClick={() => navigate('/registrar')} />
          <AccesoRapido icono="🛡️" titulo="Seguridad" onClick={() => navigate('/seguridad')} />
          <AccesoRapido icono="⚙️" titulo="Parámetros" onClick={() => navigate('/parametros')} />
          <AccesoRapido icono="⚙️" titulo="Configuración" onClick={() => setConfiguracionExpandida(!configuracionExpandida)} />
        </div>

        {/* Menú de Configuración */}
        {configuracionExpandida && (
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600 }}>🔧 Configuración del Sistema</p>
            <div className="dashboard-actions">
              <AccesoRapido icono="🔐" titulo="Asignar Permisos" onClick={() => { navigate('/asignar-permisos'); setConfiguracionExpandida(false); }} />
              <AccesoRapido icono="⏰" titulo="Bloques Horarios" onClick={() => { navigate('/bloque-horario'); setConfiguracionExpandida(false); }} />
              <AccesoRapido icono="📚" titulo="Mantenedor Cursos" onClick={() => { navigate('/mantenedor-cursos'); setConfiguracionExpandida(false); }} />
              <AccesoRapido icono="👥" titulo="Mantenedor Estudiantes" onClick={() => { navigate('/mantenedor-estudiantes'); setConfiguracionExpandida(false); }} />
              <AccesoRapido icono="📊" titulo="Reportes" onClick={() => { navigate('/reportes'); setConfiguracionExpandida(false); }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface AccesoRapidoProps {
  icono: string;
  titulo: string;
  onClick?: () => void;
}

function AccesoRapido({ icono, titulo, onClick }: AccesoRapidoProps) {
  return (
    <button type="button" 
      onClick={onClick}
      className="action-btn"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        minHeight: '100px',
      }}
    >
      <div style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)' }}>{icono}</div>
      <p style={{ fontWeight: 600, fontSize: 'clamp(0.75rem, 2vw, 0.875rem)' }}>{titulo}</p>
    </button>
  );
}
