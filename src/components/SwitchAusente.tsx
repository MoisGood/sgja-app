// ============================================================
// SGJA – Switch Ausente/Presente
// src/components/SwitchAusente.tsx
// ============================================================

interface SwitchAusenteProps {
  idEstudiante: string;
  nombreCompleto: string;
  estado: 'PRESENTE' | 'AUSENTE';
  bloqueado: boolean;
  justificadoPor?: string;
  tipoJustificacion?: string;
  onChange: (nuevoEstado: 'PRESENTE' | 'AUSENTE') => void;
}

export function SwitchAusente({
  estado,
  bloqueado,
  justificadoPor,
  tipoJustificacion,
  onChange,
}: SwitchAusenteProps) {
  const esAusente = estado === 'AUSENTE';

  const styles = {
    container: {
      width: '100%',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px',
    },

    switchContainer: {
      display: 'flex',
      alignItems: 'center',
      backgroundColor: '#f0f0f0',
      borderRadius: '20px',
      padding: '4px',
      height: '40px',
      position: 'relative' as const,
      cursor: bloqueado ? 'not-allowed' : 'pointer',
      transition: 'all 0.3s ease',
      opacity: bloqueado ? 0.7 : 1,
    } as React.CSSProperties,

    switchSide: {
      flex: 1,
      textAlign: 'center' as const,
      fontSize: '12px',
      fontWeight: 'bold' as const,
      color: '#666',
      transition: 'all 0.3s ease',
      userSelect: 'none' as const,
    } as React.CSSProperties,

    switchSideActivo: {
      color: '#fff',
    } as React.CSSProperties,

    switchSlider: {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      border: 'none',
      backgroundColor: '#fff',
      color: '#666',
      fontSize: '16px',
      cursor: bloqueado ? 'not-allowed' : 'pointer',
      transition: 'all 0.3s ease',
      transform: 'translateX(0)',
      margin: '0 4px',
      padding: 0,
      flex: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    } as React.CSSProperties,

    switchSliderActivo: {
      backgroundColor: '#dc2626',
      color: '#fff',
      transform: 'translateX(calc(100% + 8px))',
    } as React.CSSProperties,

    mensajeBloqueado: {
      fontSize: '12px',
      color: '#dc2626',
      fontWeight: 'bold' as const,
      padding: '6px 8px',
      backgroundColor: '#fee2e2',
      borderRadius: '4px',
      textAlign: 'center' as const,
      border: '1px solid #fca5a5',
    } as React.CSSProperties,

    infoBloqueado: {
      fontSize: '10px',
      color: '#991b1b',
      marginTop: '4px',
    } as React.CSSProperties,
  };

  return (
    <div style={styles.container}>
      {/* Switch Visual */}
      <div style={styles.switchContainer}>
        {/* Lado PRESENTE */}
        <div
          style={{
            ...styles.switchSide,
            ...(
              !esAusente && styles.switchSideActivo
            ),
          }}
        >
          ✓ PRESENTE
        </div>

        {/* Slider */}
        <button type="button" 
          onClick={() => !bloqueado && onChange(esAusente ? 'PRESENTE' : 'AUSENTE')}
          disabled={bloqueado}
          style={{
            ...styles.switchSlider,
            ...(esAusente && styles.switchSliderActivo),
          }}
          title={bloqueado ? 'No se puede cambiar (justificado por inspectoría)' : 'Cambiar estado'}
        >
          ●
        </button>

        {/* Lado AUSENTE */}
        <div
          style={{
            ...styles.switchSide,
            ...(
              esAusente && styles.switchSideActivo
            ),
          }}
        >
          ✗ AUSENTE
        </div>
      </div>

      {/* Mensaje si está bloqueado */}
      {bloqueado && justificadoPor && (
        <div style={styles.mensajeBloqueado}>
          <div>⚠️ Inspectoría ya modificó esta justificación</div>
          <div style={styles.infoBloqueado}>
            {justificadoPor} • {tipoJustificacion}
          </div>
        </div>
      )}
    </div>
  );
}
