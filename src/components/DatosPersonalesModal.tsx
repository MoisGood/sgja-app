import { useState, useEffect } from 'react';
import Modal from './Common/Modal';
import Button from './Common/Button';
import { supabase } from '../lib/supabase';
import { Rol } from '../types';
import type { DatosPersonales } from '../services/database';

interface Props {
  abierto: boolean;
  onCerrar: () => void;
  usuarioId: string;
  nombre: string;
  rol: Rol;
  email: string;
}

const ESTILO_INPUT: React.CSSProperties = {
  padding: '10px 12px',
  border: '1px solid #E5E7EB',
  borderRadius: '8px',
  fontSize: '14px',
  color: '#374151',
  backgroundColor: '#FFFFFF',
  width: '100%',
  boxSizing: 'border-box',
};

const ESTILO_SELECT: React.CSSProperties = {
  ...ESTILO_INPUT,
  cursor: 'pointer',
};

const ESTILO_LABEL: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  fontSize: '14px',
  fontWeight: '500',
  color: '#374151',
  width: '100%',
};

const ESTILO_CAMPO_LECTURA: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  fontSize: '14px',
  fontWeight: '500',
  color: '#374151',
  width: '100%',
};

const ESTILO_TEXTO_LECTURA: React.CSSProperties = {
  padding: '8px 0',
  fontSize: '14px',
  color: '#374151',
  borderBottom: '1px solid #F3F4F6',
};

export default function DatosPersonalesModal({ abierto, onCerrar, usuarioId, nombre, rol, email }: Props) {
  const esAdmin = rol === Rol.ADMIN;
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [establecimientos, setEstablecimientos] = useState<{ id: string; nombre: string }[]>([]);
  const [idEstablecimientoSel, setIdEstablecimientoSel] = useState('');
  const [datos, setDatos] = useState<DatosPersonales | null>(null);

  useEffect(() => {
    if (!abierto) return;
    (async () => {
      setCargando(true);
      setError(null);
      const [datosRes, establecimientosRes, usuarioRes] = await Promise.all([
        supabase.from('datospersonalesusuarios').select('*').eq('uid', usuarioId).maybeSingle(),
        supabase.from('establecimientos').select('id, nombre').eq('activo', true).order('nombre'),
        supabase.from('usuarios').select('id_establecimiento').eq('uid', usuarioId).single(),
      ]);
      setDatos(datosRes.data as DatosPersonales | null);
      setEstablecimientos(establecimientosRes.data || []);
      setIdEstablecimientoSel(usuarioRes.data?.id_establecimiento || '');
      setCargando(false);
    })();
  }, [abierto, usuarioId]);

  const guardar = async () => {
    const faltantes: string[] = [];
    if (!datos?.apellidos?.trim()) faltantes.push('Apellidos');
    if (!datos?.telefono?.trim()) faltantes.push('Teléfono');
    if (!datos?.ciudad?.trim()) faltantes.push('Ciudad');
    if (!datos?.direccion?.trim()) faltantes.push('Dirección');
    if (!datos?.emergencia_nombre?.trim()) faltantes.push('Nombre contacto emergencia');
    if (!datos?.emergencia_telefono?.trim()) faltantes.push('Teléfono contacto emergencia');
    if (!datos?.emergencia_parentesco?.trim()) faltantes.push('Parentesco emergencia');
    if (faltantes.length > 0) {
      setError(`Campos obligatorios: ${faltantes.join(', ')}`);
      return;
    }

    setGuardando(true);
    setError(null);

    const datosAGuardar: DatosPersonales = {
      uid: usuarioId,
      rut: datos?.rut || null,
      nombres: datos?.nombres || nombre,
      apellidos: datos?.apellidos || '',
      email_personal: datos?.email_personal || null,
      telefono: datos?.telefono || null,
      ciudad: datos?.ciudad || null,
      direccion: datos?.direccion || null,
      asignatura: datos?.asignatura || null,
      horas: datos?.horas ?? null,
      emergencia_nombre: datos?.emergencia_nombre || null,
      emergencia_telefono: datos?.emergencia_telefono || null,
      emergencia_parentesco: datos?.emergencia_parentesco || null,
    };

    const { error: err1 } = await supabase
      .from('datospersonalesusuarios')
      .upsert({ ...datosAGuardar, updated_at: new Date().toISOString() }, { onConflict: 'uid' });

    if (err1) {
      setError(err1.message);
      setGuardando(false);
      return;
    }

    const { error: err2 } = await supabase
      .from('usuarios')
      .update({ id_establecimiento: idEstablecimientoSel || null })
      .eq('uid', usuarioId);

    if (err2) {
      setError(`Datos guardados, pero error al asignar establecimiento: ${err2.message}`);
    }
    setGuardando(false);
    onCerrar();
  };

  const actualizar = <K extends keyof DatosPersonales>(campo: K, valor: DatosPersonales[K]) => {
    setDatos(prev => prev ? { ...prev, [campo]: valor } : null);
  };

  const campo = (label: string, valor: string | number | null | undefined, campoKey: keyof DatosPersonales, tipo?: string) => {
    if (esAdmin) {
      return (
        <label style={ESTILO_LABEL}>
          {label}
          <input
            type={tipo || 'text'}
            style={ESTILO_INPUT}
            value={valor ?? ''}
            onChange={(e) => {
              const v = tipo === 'number' ? (e.target.value ? Number(e.target.value) : null) : (e.target.value || null);
              actualizar(campoKey, v as never);
            }}
          />
        </label>
      );
    }
    return (
      <div style={ESTILO_LABEL}>
        <span style={{ fontSize: '12px', color: '#9CA3AF' }}>{label}</span>
        <span style={ESTILO_TEXTO_LECTURA}>{valor ?? '—'}</span>
      </div>
    );
  };

  return (
    <Modal abierto={abierto} onCerrar={onCerrar} titulo={`${rol} - ${nombre}`} tamaño="grande">
      {cargando ? (
        <p style={{ textAlign: 'center', color: '#6B7280', padding: '40px 0' }}>Cargando datos personales...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={ESTILO_CAMPO_LECTURA}>
            <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Email de inicio de sesión</span>
            <span style={ESTILO_TEXTO_LECTURA}>{email}</span>
          </div>
          {campo('RUT', datos?.rut, 'rut')}
          {campo('Nombres', datos?.nombres ?? nombre, 'nombres')}
          {campo('Apellidos', datos?.apellidos, 'apellidos')}
          {campo('Email Personal', datos?.email_personal, 'email_personal')}
          {campo('Teléfono', datos?.telefono, 'telefono')}
          {campo('Ciudad', datos?.ciudad, 'ciudad')}
          {campo('Dirección', datos?.direccion, 'direccion')}

          <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '16px' }}>
            <span style={{ fontSize: '15px', fontWeight: '700', color: '#374151' }}>Asignación</span>
          </div>
          {esAdmin ? (
            <label style={ESTILO_LABEL}>
              Establecimiento
              <select style={ESTILO_SELECT} value={idEstablecimientoSel} onChange={(e) => setIdEstablecimientoSel(e.target.value)}>
                <option value="">Sin establecimiento</option>
                {establecimientos.map((e) => (
                  <option key={e.id} value={e.id}>{e.nombre}</option>
                ))}
              </select>
            </label>
          ) : (
            <div style={ESTILO_LABEL}>
              <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Establecimiento</span>
              <span style={ESTILO_TEXTO_LECTURA}>
                {idEstablecimientoSel ? establecimientos.find(e => e.id === idEstablecimientoSel)?.nombre || idEstablecimientoSel : '—'}
              </span>
            </div>
          )}

          {campo('Asignatura', datos?.asignatura, 'asignatura')}
          {campo('Horas', datos?.horas, 'horas', 'number')}

          <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '16px' }}>
            <span style={{ fontSize: '15px', fontWeight: '700', color: '#374151' }}>Contacto de Emergencia</span>
          </div>
          {campo('Nombre', datos?.emergencia_nombre, 'emergencia_nombre')}
          {campo('Teléfono', datos?.emergencia_telefono, 'emergencia_telefono')}
          {esAdmin ? (
            <label style={ESTILO_LABEL}>
              Parentesco
              <select style={ESTILO_SELECT} value={datos?.emergencia_parentesco || ''} onChange={(e) => actualizar('emergencia_parentesco', e.target.value || null)}>
                <option value="">Seleccionar...</option>
                <option value="Padre">Padre</option>
                <option value="Madre">Madre</option>
                <option value="Tutor">Tutor</option>
                <option value="Hermano">Hermano</option>
                <option value="Cónyuge">Cónyuge</option>
                <option value="Otro">Otro</option>
              </select>
            </label>
          ) : (
            <div style={ESTILO_LABEL}>
              <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Parentesco</span>
              <span style={ESTILO_TEXTO_LECTURA}>{datos?.emergencia_parentesco || '—'}</span>
            </div>
          )}

          <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '8px' }}>Uso exclusivo del establecimiento educacional</p>

          {error && <p style={{ color: '#DC2626', fontSize: '14px' }}>{error}</p>}

          <div style={{ display: 'flex', gap: '12px', marginTop: '16px', justifyContent: 'flex-end' }}>
            <Button onClick={onCerrar} tipo="secundario" deshabilitado={guardando}>Cerrar</Button>
            {esAdmin && (
              <Button onClick={guardar} tipo="exito" deshabilitado={guardando} cargando={guardando}>
                {guardando ? 'Guardando...' : 'Guardar'}
              </Button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
