import { useState } from 'react';
import { Rol } from '../types';
import { guardarDatosPersonales } from '../services/database';
import { validarRUT, formatearRUT, formatoSimple, limpiarRUT } from '../utils/rutUtils';

interface Props {
  uid: string;
  email: string;
  nombre: string;
  apellidos: string;
  rol: Rol;
  onGuardado: () => void;
  onCerrarSesion: () => void;
}

const PARENTESCOS = ['padres', 'conyugue', 'pareja', 'hijo', 'otro'];

export default function FormularioDatosPersonales({
  uid, email, nombre, apellidos, rol, onGuardado, onCerrarSesion
}: Props) {
  const [nombres, setNombres] = useState(nombre);
  const [apellidosState, setApellidosState] = useState(apellidos);
  const [rut, setRut] = useState('');
  const [emailPersonal, setEmailPersonal] = useState('');
  const [telefono, setTelefono] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [direccion, setDireccion] = useState('');
  const [asignatura, setAsignatura] = useState('');
  const [horas, setHoras] = useState('');
  const [emergenciaNombre, setEmergenciaNombre] = useState('');
  const [emergenciaTelefono, setEmergenciaTelefono] = useState('');
  const [emergenciaParentesco, setEmergenciaParentesco] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const esProfesor = rol === Rol.PROFESOR;

  const handleSubmit = async () => {
    const faltantes: string[] = [];
    if (!nombres.trim()) faltantes.push('Nombres');
    if (!apellidosState.trim()) faltantes.push('Apellidos');
    if (!rut.trim()) faltantes.push('RUT');
    if (!telefono.trim()) faltantes.push('Teléfono');
    if (!ciudad.trim()) faltantes.push('Ciudad');
    if (!direccion.trim()) faltantes.push('Dirección');
    if (!emergenciaNombre.trim()) faltantes.push('Nombre contacto emergencia');
    if (!emergenciaTelefono.trim()) faltantes.push('Teléfono contacto emergencia');
    if (!emergenciaParentesco) faltantes.push('Parentesco emergencia');
    if (faltantes.length > 0) {
      setError(`Campos obligatorios: ${faltantes.join(', ')}`);
      return;
    }
    if (!validarRUT(limpiarRUT(rut))) {
      setError('RUT inválido');
      return;
    }
    setEnviando(true);
    setError(null);

    const res = await guardarDatosPersonales({
      uid,
      rut: formatoSimple(limpiarRUT(rut)) || null,
      nombres: nombres.trim(),
      apellidos: apellidosState.trim(),
      email_personal: emailPersonal.trim() || null,
      telefono: telefono.trim() || null,
      ciudad: ciudad.trim() || null,
      direccion: direccion.trim() || null,
      asignatura: esProfesor ? (asignatura.trim() || null) : null,
      horas: esProfesor ? (horas ? parseInt(horas, 10) : null) : null,
      emergencia_nombre: emergenciaNombre.trim() || null,
      emergencia_telefono: emergenciaTelefono.trim() || null,
      emergencia_parentesco: emergenciaParentesco || null,
    });

    if (res.error) {
      setError(res.error);
      setEnviando(false);
    } else {
      onGuardado();
    }
  };

  const inputStyle = {
    width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB',
    borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box',
  } as const;
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: '600', color: '#333', marginBottom: '6px' };
  const campoStyle: React.CSSProperties = { marginBottom: '16px' };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', minHeight: '100vh', background: '#F3F4F6', padding: '24px 16px' }}>
      <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '32px', maxWidth: '600px', width: '100%', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <p style={{ textAlign: 'center', fontSize: '48px', margin: '0 0 8px 0' }}>📋</p>
        <h2 style={{ textAlign: 'center', fontSize: '22px', fontWeight: '700', color: '#1A3C6B', margin: '0 0 8px 0' }}>
          Completa tus datos
        </h2>
        <p style={{ textAlign: 'center', fontSize: '14px', color: '#666', margin: '0 0 24px 0' }}>
          Antes de continuar, necesitamos que completes tu información personal ({email}).
        </p>

        <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#1A3C6B', margin: '0 0 12px 0', paddingBottom: '8px', borderBottom: '1px solid #E5E7EB' }}>
          Datos personales
        </h3>

        <div style={campoStyle}>
          <label style={{ ...labelStyle, color: '#9CA3AF' }}>Correo registrado</label>
          <input style={{ ...inputStyle, backgroundColor: '#F3F4F6', color: '#6B7280' }} value={email} disabled />
        </div>
        <div style={campoStyle}>
          <label style={labelStyle}>RUT *</label>
          <input style={{ ...inputStyle, borderColor: rut.length >= 2 && !validarRUT(limpiarRUT(rut)) ? '#dc3545' : '#D1D5DB' }} value={rut} onChange={e => setRut(e.target.value.replace(/[^0-9kK]/g, ''))} onBlur={e => { if (e.target.value.trim()) setRut(formatearRUT(e.target.value)); }} placeholder="12.345.678-5" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={campoStyle}>
            <label style={labelStyle}>Nombres *</label>
            <input style={inputStyle} value={nombres} onChange={e => setNombres(e.target.value)} />
          </div>
          <div style={campoStyle}>
            <label style={labelStyle}>Apellidos *</label>
            <input style={inputStyle} value={apellidosState} onChange={e => setApellidosState(e.target.value)} />
          </div>
        </div>

        <div style={campoStyle}>
          <label style={labelStyle}>Email personal</label>
          <input style={inputStyle} value={emailPersonal} onChange={e => setEmailPersonal(e.target.value)} placeholder="tucorreo@gmail.com" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={campoStyle}>
            <label style={labelStyle}>Teléfono *</label>
            <input style={inputStyle} value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="+56 9 1234 5678" />
          </div>
          <div style={campoStyle}>
            <label style={labelStyle}>Ciudad *</label>
            <input style={inputStyle} value={ciudad} onChange={e => setCiudad(e.target.value)} placeholder="Ej: Santiago" />
          </div>
        </div>

        <div style={campoStyle}>
          <label style={labelStyle}>Dirección *</label>
          <input style={inputStyle} value={direccion} onChange={e => setDireccion(e.target.value)} placeholder="Calle, número, comuna" />
        </div>

        {esProfesor && (
          <>
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#1A3C6B', margin: '24px 0 12px 0', paddingBottom: '8px', borderBottom: '1px solid #E5E7EB' }}>
              Datos académicos
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={campoStyle}>
                <label style={labelStyle}>Asignatura</label>
                <input style={inputStyle} value={asignatura} onChange={e => setAsignatura(e.target.value)} placeholder="Ej: Matemáticas" />
              </div>
              <div style={campoStyle}>
                <label style={labelStyle}>Horas semanales</label>
                <input style={inputStyle} type="number" value={horas} onChange={e => setHoras(e.target.value)} placeholder="Ej: 40" />
              </div>
            </div>
          </>
        )}

        <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#1A3C6B', margin: '24px 0 12px 0', paddingBottom: '8px', borderBottom: '1px solid #E5E7EB' }}>
          Contacto de emergencia
        </h3>

        <div style={campoStyle}>
          <label style={labelStyle}>Nombre completo *</label>
          <input style={inputStyle} value={emergenciaNombre} onChange={e => setEmergenciaNombre(e.target.value)} placeholder="Nombre y apellidos" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={campoStyle}>
            <label style={labelStyle}>Teléfono *</label>
            <input style={inputStyle} value={emergenciaTelefono} onChange={e => setEmergenciaTelefono(e.target.value)} placeholder="+56 9 1234 5678" />
          </div>
          <div style={campoStyle}>
            <label style={labelStyle}>Parentesco *</label>
            <select
              style={inputStyle}
              value={emergenciaParentesco}
              onChange={e => setEmergenciaParentesco(e.target.value)}
            >
              <option value="">Seleccionar...</option>
              {PARENTESCOS.map(p => (
                <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: '12px', color: '#999', margin: '16px 0 0 0', fontStyle: 'italic' }}>
          Estos datos son de uso exclusivo del establecimiento educacional.
        </p>

        {error && <p style={{ color: '#EF4444', fontSize: '13px', textAlign: 'center', margin: '8px 0' }}>{error}</p>}

        <button type="button"           onClick={handleSubmit}
          disabled={enviando}
          style={{
            width: '100%', padding: '12px', background: '#1A3C6B', color: '#FFFFFF',
            border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600',
            cursor: 'pointer', marginTop: '16px', opacity: enviando ? 0.6 : 1,
          }}
        >
          {enviando ? '⏳ Guardando...' : 'Guardar y continuar'}
        </button>

        <button type="button" onClick={onCerrarSesion} style={{
          width: '100%', padding: '10px', background: 'transparent', color: '#666',
          border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '13px',
          cursor: 'pointer', marginTop: '12px',
        }}>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
