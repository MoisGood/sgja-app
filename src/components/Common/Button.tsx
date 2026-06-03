// ============================================================
// SGJA – Componente Button
// src/components/Common/Button.tsx
// ============================================================

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  tipo?: 'primario' | 'secundario' | 'peligro' | 'exito';
  deshabilitado?: boolean;
  cargando?: boolean;
  anchoCompleto?: boolean;
  tamaño?: 'pequeño' | 'normal' | 'grande';
}

export default function Button({
  children,
  onClick,
  tipo = 'primario',
  deshabilitado = false,
  cargando = false,
  anchoCompleto = false,
  tamaño = 'normal',
}: ButtonProps) {
  const estilosBase: React.CSSProperties = {
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: deshabilitado || cargando ? 'not-allowed' : 'pointer',
    opacity: deshabilitado || cargando ? 0.6 : 1,
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: anchoCompleto ? '100%' : 'auto',
  };

  const estilosPorTamaño: Record<string, React.CSSProperties> = {
    pequeño: { padding: '6px 12px', fontSize: '12px' },
    normal: { padding: '10px 24px', fontSize: '14px' },
    grande: { padding: '14px 32px', fontSize: '16px' },
  };

  const estilosPorTipo: Record<string, React.CSSProperties> = {
    primario: {
      backgroundColor: '#1A3C6B',
      color: '#FFFFFF',
    },
    secundario: {
      backgroundColor: '#F3F4F6',
      color: '#374151',
      border: '1px solid #D1D5DB',
    },
    peligro: {
      backgroundColor: '#DC2626',
      color: '#FFFFFF',
    },
    exito: {
      backgroundColor: '#10B981',
      color: '#FFFFFF',
    },
  };

  return (
    <button type="button" 
      onClick={onClick}
      disabled={deshabilitado || cargando}
      style={{
        ...estilosBase,
        ...estilosPorTamaño[tamaño],
        ...estilosPorTipo[tipo],
      }}
    >
      {cargando ? '⏳' : children}
    </button>
  );
}
