import { useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';

interface Props {
  nombre: string;
}

interface AccesoRapido {
  icono: string;
  titulo: string;
  descripcion: string;
  ruta: string;
  color: string;
  bg: string;
}

const ACCESOS_POR_ROL: Record<string, AccesoRapido[]> = {
  PARADOCENTE: [
    { icono: 'emergency', titulo: 'Formulario de Accidente', descripcion: 'Registrar un accidente escolar', ruta: '/registrar-accidente', color: '#dc2626', bg: '#fee2e2' },
    { icono: 'assignment', titulo: 'Gestión de Pases', descripcion: 'Crear y justificar atrasos e inasistencias', ruta: '/inspectoria/m/gestion-pases', color: '#d97706', bg: '#fef3c7' },
    { icono: 'visibility', titulo: 'Ver Pases', descripcion: 'Revisar los pases registrados', ruta: '/inspectoria/m/ver-pases', color: '#2563eb', bg: '#dbeafe' },
  ],
  INSPECTOR: [
    { icono: 'emergency', titulo: 'Formulario de Accidente', descripcion: 'Registrar un accidente escolar', ruta: '/registrar-accidente', color: '#dc2626', bg: '#fee2e2' },
    { icono: 'assignment', titulo: 'Gestión de Pases', descripcion: 'Crear y justificar atrasos e inasistencias', ruta: '/inspectoria/m/gestion-pases', color: '#d97706', bg: '#fef3c7' },
    { icono: 'visibility', titulo: 'Ver Pases', descripcion: 'Revisar los pases registrados', ruta: '/inspectoria/m/ver-pases', color: '#2563eb', bg: '#dbeafe' },
  ],
  PROFESOR: [
    { icono: 'emergency', titulo: 'Formulario de Accidente', descripcion: 'Registrar un accidente escolar', ruta: '/registrar-accidente', color: '#dc2626', bg: '#fee2e2' },
    { icono: 'add_circle', titulo: 'Crear Pase', descripcion: 'Registrar un pase de tu estudiante', ruta: '/inspectoria/m/crear-pase', color: '#059669', bg: '#d1fae5' },
  ],
};

export default function InspectoriaMobileInicio({ nombre }: Props) {
  const { temaOscuro } = useTheme();
  const { rol } = useAuth();
  const navigate = useNavigate();

  const accesos = ACCESOS_POR_ROL[rol as string] || [];

  const containerStyle: React.CSSProperties = {
    padding: '24px 16px',
  };

  const greetingStyle: React.CSSProperties = {
    fontSize: 22,
    fontWeight: 700,
    color: temaOscuro ? '#f3f4f6' : '#191c1e',
    margin: '0 0 4px',
    lineHeight: 1.3,
  };

  const subStyle: React.CSSProperties = {
    fontSize: 14,
    color: temaOscuro ? '#9ca3af' : '#554245',
    margin: '0 0 24px',
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: temaOscuro ? '#1f2937' : '#ffffff',
    borderRadius: 16,
    padding: 16,
    border: temaOscuro ? '1px solid #374151' : '1px solid #e2e8f0',
  };

  const iconStyle: React.CSSProperties = {
    fontSize: 48,
    color: temaOscuro ? '#ffb1c2' : '#7a1f3d',
    marginBottom: 12,
  };

  return (
    <div style={containerStyle}>
      <h1 style={greetingStyle}>
        ¡Hola, {nombre.split(' ')[0]}!
      </h1>
      <p style={subStyle}>
        Ahora estamos más juntos — Intranet del establecimiento
      </p>

      {accesos.length > 0 && (
        <>
          <p style={{
            fontSize: 13, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
            color: temaOscuro ? '#9ca3af' : '#554245', margin: '0 0 12px',
          }}>
            Accesos rápidos
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 24 }}>
            {accesos.map((a, i) => (
              <button
                key={i}
                type="button"
                onClick={() => navigate(a.ruta)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', gap: 8, padding: '18px 12px',
                  border: 'none', borderRadius: 16, cursor: 'pointer',
                  background: a.bg, textAlign: 'center',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 32, color: a.color }}>
                  {a.icono}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: temaOscuro ? '#f3f4f6' : '#191c1e', lineHeight: 1.2 }}>
                  {a.titulo}
                </span>
                <span style={{ fontSize: 11, color: temaOscuro ? '#9ca3af' : '#554245', lineHeight: 1.2 }}>
                  {a.descripcion}
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      <div style={cardStyle}>
        <div style={{ ...iconStyle, marginBottom: 12 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48 }}>campaign</span>
        </div>
        <p style={{ fontSize: 16, fontWeight: 600, margin: '0 0 4px', color: temaOscuro ? '#f3f4f6' : '#191c1e' }}>
          Próximamente publicaciones
        </p>
        <p style={{ fontSize: 13, color: temaOscuro ? '#9ca3af' : '#554245', margin: 0 }}>
          Aquí aparecerán las noticias, comunicados y novedades del establecimiento.
        </p>
      </div>
    </div>
  );
}
