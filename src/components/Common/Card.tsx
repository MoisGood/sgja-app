// ============================================================
// SGJA – Componente Card
// src/components/Common/Card.tsx
// ============================================================

interface CardProps {
  children: React.ReactNode;
  titulo?: string;
  descripcion?: string;
  footer?: React.ReactNode;
  padding?: string;
  sombra?: 'pequeña' | 'normal' | 'grande';
}

export default function Card({
  children,
  titulo,
  descripcion,
  footer,
  padding = '24px',
  sombra = 'normal',
}: CardProps) {
  const sombras: Record<string, string> = {
    pequeña: '0 1px 3px rgba(0,0,0,0.05)',
    normal: '0 2px 12px rgba(0,0,0,0.06)',
    grande: '0 4px 24px rgba(0,0,0,0.10)',
  };

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        padding,
        boxShadow: sombras[sombra],
        border: '1px solid #E5E7EB',
      }}
    >
      {titulo && (
        <div style={{ marginBottom: '16px' }}>
          <h3
            style={{
              fontSize: '18px',
              fontWeight: '700',
              color: '#1A3C6B',
              margin: '0 0 4px 0',
            }}
          >
            {titulo}
          </h3>
          {descripcion && (
            <p
              style={{
                fontSize: '13px',
                color: '#6B7280',
                margin: 0,
              }}
            >
              {descripcion}
            </p>
          )}
        </div>
      )}

      {children}

      {footer && (
        <div
          style={{
            borderTop: '1px solid #E5E7EB',
            marginTop: '16px',
            paddingTop: '16px',
          }}
        >
          {footer}
        </div>
      )}
    </div>
  );
}
