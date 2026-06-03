import { useState } from 'react';
import { enviarSolicitudRegistro } from '../services/database';

interface Props {
  uid: string;
  email: string;
  nombre: string;
  apellidos: string;
  onEnviado: () => void;
  onCerrarSesion: () => void;
}

export default function FormularioRegistroInicial({ uid, email, nombre: nombreInicial, apellidos: apellidosInicial, onEnviado, onCerrarSesion }: Props) {
  const [nombre, setNombre] = useState(nombreInicial);
  const [apellidos, setApellidos] = useState(apellidosInicial);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  const handleSubmit = async () => {
    if (!nombre.trim() || !apellidos.trim()) {
      setError('Completa todos los campos');
      return;
    }
    setEnviando(true);
    setError(null);
    const res = await enviarSolicitudRegistro(uid, email, nombre.trim(), apellidos.trim());
    if (res.error) {
      setError(res.error);
      setEnviando(false);
    } else {
      setExito(true);
      onEnviado();
    }
  };

  if (exito) {
    return (
      <div style={styles.pantalla}>
        <div style={styles.card}>
          <p style={styles.iconoGrande}>✅</p>
          <h2 style={styles.titulo}>Solicitud Enviada</h2>
          <p style={styles.texto}>
            Tu solicitud de registro ha sido enviada correctamente.
          </p>
          <p style={styles.subTexto}>
            Un administrador revisará tus datos y activará tu cuenta pronto.
            Recibirás un correo cuando tu cuenta esté activa.
          </p>
          <button type="button" onClick={onCerrarSesion} style={styles.botonSalir}>Cerrar sesión</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.pantalla}>
      <div style={styles.card}>
        <p style={styles.iconoGrande}>👋</p>
        <h2 style={styles.titulo}>Bienvenido a SGJA</h2>
        <p style={styles.texto}>
          Tu cuenta de Google ({email}) aún no está registrada en el sistema.
        </p>
        <p style={styles.subTexto}>
          Ingresa tus nombres y apellidos para solicitar el acceso.
          El administrador revisará tu solicitud y te contactará cuando tu cuenta esté activa.
        </p>

        <div style={styles.campo}>
          <label style={styles.etiqueta}>Nombres</label>
          <input
            style={styles.input}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Juan"
          />
        </div>

        <div style={styles.campo}>
          <label style={styles.etiqueta}>Apellidos</label>
          <input
            style={styles.input}
            value={apellidos}
            onChange={(e) => setApellidos(e.target.value)}
            placeholder="Ej: Pérez González"
          />
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <button type="button"           onClick={handleSubmit}
          disabled={enviando}
          style={{
            ...styles.botonEnviar,
            opacity: enviando ? 0.6 : 1,
          }}
        >
          {enviando ? '⏳ Enviando...' : 'Solicitar Registro'}
        </button>

        <button type="button" onClick={onCerrarSesion} style={styles.botonSalir}>Cerrar sesión</button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  pantalla: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: '#F3F4F6',
    padding: '16px',
  },
  card: {
    background: '#FFFFFF',
    borderRadius: '12px',
    padding: '32px',
    maxWidth: '440px',
    width: '100%',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  },
  iconoGrande: {
    textAlign: 'center',
    fontSize: '48px',
    margin: '0 0 16px 0',
  },
  titulo: {
    textAlign: 'center',
    fontSize: '22px',
    fontWeight: '700',
    color: '#1A3C6B',
    margin: '0 0 8px 0',
  },
  texto: {
    textAlign: 'center',
    fontSize: '14px',
    color: '#555',
    margin: '0 0 8px 0',
    lineHeight: '1.5',
  },
  subTexto: {
    textAlign: 'center',
    fontSize: '13px',
    color: '#888',
    margin: '0 0 24px 0',
    lineHeight: '1.5',
  },
  campo: {
    marginBottom: '16px',
  },
  etiqueta: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  error: {
    color: '#EF4444',
    fontSize: '13px',
    textAlign: 'center',
    margin: '8px 0',
  },
  botonEnviar: {
    width: '100%',
    padding: '12px',
    background: '#1A3C6B',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
  },
  botonSalir: {
    width: '100%',
    padding: '10px',
    background: 'transparent',
    color: '#666',
    border: '1px solid #D1D5DB',
    borderRadius: '8px',
    fontSize: '13px',
    cursor: 'pointer',
    marginTop: '12px',
  },
};
