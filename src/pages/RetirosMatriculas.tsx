// ============================================================
// AGIL – Retiros de Estudiantes
// src/pages/RetirosMatriculas.tsx
// Registro de retiros de estudiantes + listado con filtro por año.
// ============================================================

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Save, Trash2 } from 'lucide-react';
import Spinner from '../components/Common/Spinner';
import { useTheme } from '../hooks/useTheme';
import {
  crearRetiroEstudiante,
  obtenerRetiros,
  anularRetiro,
} from '../services/matricula.service';
import { validarRUT, limpiarRUT, formatoSimple } from '../utils/rutUtils';
import type { RetiroDatos, RetiroEstudiante } from '../types';

interface Props {
  idEstablecimiento: string;
  idFuncionario: string;
}

const NIVELES = [
  { valor: '1', etiqueta: '1° Medio' },
  { valor: '2', etiqueta: '2° Medio' },
  { valor: '3', etiqueta: '3° Medio' },
  { valor: '4', etiqueta: '4° Medio' },
];

const s: Record<string, React.CSSProperties> = {
  contenedor: { maxWidth: '980px', margin: '0 auto', padding: '8px 0 40px', fontFamily: 'Arial, sans-serif', color: '#1F2937' },
  titulo: { fontSize: '22px', fontWeight: 700, color: '#1A3C6B', margin: '0 0 4px 0' },
  subtitulo: { fontSize: '13px', color: '#6B7280', margin: '0 0 20px 0' },
  tarjeta: { background: '#fff', borderRadius: '12px', boxShadow: '0 2px 16px rgba(0,0,0,0.08)', padding: '20px', border: '1px solid #E5E7EB' },
  tarjetaTitulo: { fontSize: '16px', fontWeight: 700, color: '#1A3C6B', margin: '0 0 16px 0' },
  fila: { display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' },
  label: { fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', margin: '0 0 4px 0' },
  input: { border: '1px solid #D1D5DB', borderRadius: '6px', padding: '8px 10px', fontSize: '14px', width: '100%', boxSizing: 'border-box', background: '#fff', color: '#1F2937' },
  error: { fontSize: '11px', color: '#DC2626', margin: '2px 0 0 0' },
  botonNav: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 22px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer' },
  tabla: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
  th: { textAlign: 'left', padding: '8px 10px', background: '#F3F4F6', color: '#374151', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap', borderBottom: '1px solid #E5E7EB' },
  td: { padding: '10px', borderBottom: '1px solid #F3F4F6', verticalAlign: 'middle' },
};

function formVacio(): RetiroDatos {
  return {
    rut: '',
    nombres: '',
    apellido_paterno: '',
    apellido_materno: '',
    nivel: '1',
    curso: '',
    fecha_retiro: new Date().toISOString().slice(0, 10),
    motivo: '',
  };
}

export default function RetirosMatriculas({ idEstablecimiento, idFuncionario }: Props) {
  const { temaOscuro } = useTheme();
  const [form, setForm] = useState<RetiroDatos>(formVacio());
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);
  const [retiros, setRetiros] = useState<RetiroEstudiante[]>([]);
  const [cargando, setCargando] = useState(true);
  const [anio, setAnio] = useState<number>(new Date().getFullYear());

  const setCampo = <K extends keyof RetiroDatos>(clave: K, valor: RetiroDatos[K]) => {
    setForm((f) => ({ ...f, [clave]: valor }));
  };

  const cargar = async () => {
    setCargando(true);
    const data = await obtenerRetiros(idEstablecimiento);
    setRetiros(data);
    setCargando(false);
  };

  useEffect(() => {
    void (async () => {
      await cargar();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idEstablecimiento]);

  const anosDisponibles = useMemo(() => {
    const anios = Array.from(new Set(retiros.map((r) => new Date(r.creado_en).getFullYear())));
    if (anios.length === 0) anios.push(new Date().getFullYear());
    return anios.sort((a, b) => b - a);
  }, [retiros]);

  const filtrados = useMemo(
    () => retiros.filter((r) => new Date(r.creado_en).getFullYear() === anio),
    [retiros, anio]
  );

  const validar = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.rut.trim()) e.rut = 'El RUT es obligatorio';
    else if (!validarRUT(form.rut)) e.rut = 'RUT inválido';
    if (!form.nombres.trim()) e.nombres = 'Obligatorio';
    if (!form.apellido_paterno.trim()) e.apellido_paterno = 'Obligatorio';
    if (!form.apellido_materno.trim()) e.apellido_materno = 'Obligatorio';
    if (!form.fecha_retiro) e.fecha_retiro = 'Selecciona la fecha';
    if (!form.motivo.trim()) e.motivo = 'Indica el motivo del retiro';
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const guardar = async () => {
    if (!validar()) return;
    setGuardando(true);
    const creado = await crearRetiroEstudiante({
      idEstablecimiento,
      idFuncionario,
      datos: { ...form, rut: formatoSimple(form.rut) },
    });
    setGuardando(false);
    if (!creado) return;
    toast.success('Retiro registrado correctamente.');
    setForm(formVacio());
    cargar();
  };

  const anular = async (id: string) => {
    if (!window.confirm('¿Eliminar este registro de retiro?')) return;
    const ok = await anularRetiro(id);
    if (!ok) return;
    toast.success('Retiro eliminado.');
    cargar();
  };

  const fondo = temaOscuro ? '#111827' : '#FFFFFF';
  const borde = temaOscuro ? '#374151' : '#E5E7EB';
  const inputStyle = { ...s.input, background: temaOscuro ? '#111827' : '#fff', color: temaOscuro ? '#F3F4F6' : '#1F2937' };

  return (
    <div style={{ ...s.contenedor, color: temaOscuro ? '#F3F4F6' : undefined }}>
      <h1 style={s.titulo}>🎓 Retiros de Estudiantes</h1>
      <p style={s.subtitulo}>Registra el retiro de un estudiante del establecimiento.</p>

      <div style={{ ...s.tarjeta, background: fondo, borderColor: borde, marginBottom: '24px' }}>
        <h2 style={{ ...s.tarjetaTitulo, color: temaOscuro ? '#93C5FD' : undefined }}>Registrar Retiro</h2>

        <div style={s.fila}>
          <div style={{ flex: '1 1 160px', minWidth: 0 }}>
            <p style={s.label}>RUT del estudiante</p>
            <input value={form.rut} onChange={(e) => setCampo('rut', limpiarRUT(e.target.value))} placeholder="12.345.678-9" style={inputStyle} />
            {errores.rut && <p style={s.error}>{errores.rut}</p>}
          </div>
          <div style={{ flex: '1 1 180px', minWidth: 0 }}>
            <p style={s.label}>Nombres</p>
            <input value={form.nombres} onChange={(e) => setCampo('nombres', e.target.value)} style={inputStyle} />
            {errores.nombres && <p style={s.error}>{errores.nombres}</p>}
          </div>
          <div style={{ flex: '1 1 160px', minWidth: 0 }}>
            <p style={s.label}>Apellido Paterno</p>
            <input value={form.apellido_paterno} onChange={(e) => setCampo('apellido_paterno', e.target.value)} style={inputStyle} />
            {errores.apellido_paterno && <p style={s.error}>{errores.apellido_paterno}</p>}
          </div>
          <div style={{ flex: '1 1 160px', minWidth: 0 }}>
            <p style={s.label}>Apellido Materno</p>
            <input value={form.apellido_materno} onChange={(e) => setCampo('apellido_materno', e.target.value)} style={inputStyle} />
            {errores.apellido_materno && <p style={s.error}>{errores.apellido_materno}</p>}
          </div>
        </div>

        <div style={s.fila}>
          <div style={{ flex: '1 1 160px', minWidth: 0 }}>
            <p style={s.label}>Nivel</p>
            <select value={form.nivel} onChange={(e) => setCampo('nivel', e.target.value)} style={inputStyle}>
              {NIVELES.map((n) => <option key={n.valor} value={n.valor}>{n.etiqueta}</option>)}
            </select>
          </div>
          <div style={{ flex: '1 1 180px', minWidth: 0 }}>
            <p style={s.label}>Fecha de retiro</p>
            <input type="date" value={form.fecha_retiro} onChange={(e) => setCampo('fecha_retiro', e.target.value)} style={inputStyle} />
            {errores.fecha_retiro && <p style={s.error}>{errores.fecha_retiro}</p>}
          </div>
          <div style={{ flex: '2 1 300px', minWidth: 0 }}>
            <p style={s.label}>Motivo</p>
            <input value={form.motivo} onChange={(e) => setCampo('motivo', e.target.value)} placeholder="Ej: Cambio de establecimiento, traslado de ciudad…" style={inputStyle} />
            {errores.motivo && <p style={s.error}>{errores.motivo}</p>}
          </div>
        </div>

        <button
          type="button"
          onClick={guardar}
          disabled={guardando}
          style={{ ...s.botonNav, background: '#10B981', color: '#FFFFFF', opacity: guardando ? 0.6 : 1 }}
        >
          {guardando ? <Spinner tamaño={16} /> : <Save size={16} />}
          {guardando ? 'Guardando…' : 'Registrar Retiro'}
        </button>
      </div>

      <div style={{ ...s.tarjeta, background: fondo, borderColor: borde }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
          <h2 style={{ ...s.tarjetaTitulo, margin: 0, color: temaOscuro ? '#93C5FD' : undefined }}>Historial de Retiros</h2>
          <select value={anio} onChange={(e) => setAnio(Number(e.target.value))} style={{ ...inputStyle, width: 'auto' }}>
            {anosDisponibles.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        {cargando ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '30px' }}><Spinner /></div>
        ) : filtrados.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#9CA3AF', padding: '30px 0', fontSize: '14px' }}>No hay retiros registrados en {anio}.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={s.tabla}>
              <thead>
                <tr>
                  <th style={s.th}>Estudiante</th>
                  <th style={s.th}>RUT</th>
                  <th style={s.th}>Nivel</th>
                  <th style={s.th}>Fecha de retiro</th>
                  <th style={s.th}>Motivo</th>
                  <th style={s.th}></th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((r) => (
                  <tr key={r.id} style={{ color: temaOscuro ? '#E5E7EB' : undefined }}>
                    <td style={s.td}><strong>{r.nombre_completo || '—'}</strong></td>
                    <td style={s.td}>{r.rut || '—'}</td>
                    <td style={s.td}>{r.nivel || '—'}</td>
                    <td style={s.td}>{r.fecha_retiro ? new Date(r.fecha_retiro + 'T00:00:00').toLocaleDateString('es-CL') : '—'}</td>
                    <td style={s.td}>{r.motivo || '—'}</td>
                    <td style={s.td}>
                      <button
                        type="button"
                        onClick={() => anular(r.id)}
                        style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer' }}
                        title="Eliminar registro"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
