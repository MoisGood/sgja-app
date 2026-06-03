// ============================================================
// SGJA – Componente Input
// src/components/Common/Input.tsx
// ============================================================

interface InputProps {
  tipo?: 'texto' | 'email' | 'password' | 'numero' | 'fecha';
  placeholder?: string;
  valor?: string;
  onChange?: (valor: string) => void;
  etiqueta?: string;
  error?: string;
  deshabilitado?: boolean;
  requerido?: boolean;
  anchoCompleto?: boolean;
}

export default function Input({
  tipo = 'texto',
  placeholder,
  valor,
  onChange,
  etiqueta,
  error,
  deshabilitado = false,
  requerido = false,
  anchoCompleto = true,
}: InputProps) {
  const tiposInput: Record<string, string> = {
    texto: 'text',
    email: 'email',
    password: 'password',
    numero: 'number',
    fecha: 'date',
  };

  return (
    <div style={{ marginBottom: '16px', width: anchoCompleto ? '100%' : 'auto' }}>
      {etiqueta && (
        <label
          style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '6px',
          }}
        >
          {etiqueta}
          {requerido && <span style={{ color: '#DC2626' }}>*</span>}
        </label>
      )}

      <input
        type={tiposInput[tipo]}
        placeholder={placeholder}
        value={valor}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={deshabilitado}
        style={{
          width: '100%',
          padding: '10px 12px',
          fontSize: '14px',
          border: error ? '1px solid #DC2626' : '1px solid #D1D5DB',
          borderRadius: '8px',
          fontFamily: 'Arial, sans-serif',
          boxSizing: 'border-box',
          backgroundColor: deshabilitado ? '#F9FAFB' : '#FFFFFF',
          color: '#374151',
          transition: 'border-color 0.2s',
        }}
        onFocus={(e) => {
          if (!error) {
            e.currentTarget.style.borderColor = '#1A3C6B';
          }
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error ? '#DC2626' : '#D1D5DB';
        }}
      />

      {error && (
        <p
          style={{
            fontSize: '12px',
            color: '#DC2626',
            marginTop: '4px',
            margin: '4px 0 0 0',
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
