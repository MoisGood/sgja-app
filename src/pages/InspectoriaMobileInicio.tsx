import { useTheme } from '../hooks/useTheme';

interface Props {
  nombre: string;
}

export default function InspectoriaMobileInicio({ nombre }: Props) {
  const { temaOscuro } = useTheme();

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
    padding: 24,
    border: temaOscuro ? '1px solid #374151' : '1px solid #e2e8f0',
    textAlign: 'center',
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

      <div style={cardStyle}>
        <div style={iconStyle}>
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
