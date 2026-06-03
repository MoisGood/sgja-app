// ============================================================
// SGJA – Componente Modal
// src/components/Common/Modal.tsx
// ============================================================

interface ModalProps {
  abierto: boolean;
  onCerrar: () => void;
  titulo: string;
  children: React.ReactNode;
  pie?: React.ReactNode;
  tamaño?: 'pequeño' | 'normal' | 'grande';
}

export default function Modal({
  abierto,
  onCerrar,
  titulo,
  children,
  pie,
  tamaño = 'normal',
}: ModalProps) {
  if (!abierto) return null;

  const anchos: Record<string, string> = {
    pequeño: '320px',
    normal: '500px',
    grande: '700px',
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onCerrar}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          width: anchos[tamaño],
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px rgba(0,0,0,0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h2
            style={{
              fontSize: '18px',
              fontWeight: '700',
              color: '#1A3C6B',
              margin: 0,
            }}
          >
            {titulo}
          </h2>
          <button type="button" 
            onClick={onCerrar}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6B7280',
              padding: 0,
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
          }}
        >
          {children}
        </div>

        {/* Footer */}
        {pie && (
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid #E5E7EB',
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
            }}
          >
            {pie}
          </div>
        )}
      </div>
    </div>
  );
}
