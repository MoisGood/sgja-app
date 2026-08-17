// ============================================================
// AGIL – Ver Matrículas
// src/pages/VerMatriculas.tsx
// Lista matrículas del establecimiento con filtros por año,
// nivel y tipo, más impresión de los PDF de consentimiento.
// ============================================================

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Printer, Search, FilePlus2 } from 'lucide-react';
import Spinner from '../components/Common/Spinner';
import { useTheme } from '../hooks/useTheme';
import { obtenerMatriculas } from '../services/matricula.service';
import { abrirPDFConsentimiento } from '../services/consentimiento-pdf.service';
import { limpiarRUT } from '../utils/rutUtils';
import type { Matricula } from '../types';

interface Props {
  idEstablecimiento: string;
}

const NIVELES_FILTRO = ['1° Medio', '2° Medio', '3° Medio', '4° Medio'];
const TIPOS = [
  { valor: '', etiqueta: 'Todos' },
  { valor: 'nueva', etiqueta: 'Nueva' },
  { valor: 'continuidad', etiqueta: 'Continuidad (2°-4°)' },
];

const s: Record<string, React.CSSProperties> = {
  contenedor: { maxWidth: '1100px', margin: '0 auto', padding: '8px 0 40px', fontFamily: 'Arial, sans-serif', color: '#1F2937' },
  titulo: { fontSize: '22px', fontWeight: 700, color: '#1A3C6B', margin: '0 0 4px 0' },
  subtitulo: { fontSize: '13px', color: '#6B7280', margin: '0 0 20px 0' },
  tarjeta: { background: '#fff', borderRadius: '12px', boxShadow: '0 2px 16px rgba(0,0,0,0.08)', padding: '20px', border: '1px solid #E5E7EB' },
  filtros: { display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px', alignItems: 'flex-end' },
  label: { fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', margin: '0 0 4px 0' },
  select: { border: '1px solid #D1D5DB', borderRadius: '6px', padding: '8px 10px', fontSize: '14px', background: '#fff', color: '#1F2937' },
  input: { border: '1px solid #D1D5DB', borderRadius: '6px', padding: '8px 10px', fontSize: '14px', width: '100%', boxSizing: 'border-box' },
  tablaWrap: { overflowX: 'auto' },
  tabla: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
  th: { textAlign: 'left', padding: '8px 10px', background: '#F3F4F6', color: '#374151', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap', borderBottom: '1px solid #E5E7EB' },
  td: { padding: '10px', borderBottom: '1px solid #F3F4F6', verticalAlign: 'middle' },
  badge: { display: 'inline-block', padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 600 },
  botonNav: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 18px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer' },
};

function badgeEstado(estado: string): { texto: string; color: string; fondo: string } {
  if (estado === 'anulada') return { texto: 'Anulada', color: '#DC2626', fondo: '#FEE2E2' };
  if (estado === 'continuidad') return { texto: 'Continuidad', color: '#1A3C6B', fondo: '#DBEAFE' };
  return { texto: 'Completada', color: '#047857', fondo: '#D1FAE5' };
}

export default function VerMatriculas({ idEstablecimiento }: Props) {
  const { temaOscuro } = useTheme();
  const navigate = useNavigate();
  const [matriculas, setMatriculas] = useState<Matricula[]>([]);
  const [cargando, setCargando] = useState(true);
  const [anio, setAnio] = useState<number>(new Date().getFullYear());
  const [nivel, setNivel] = useState('');
  const [tipo, setTipo] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [imprimiendo, setImprimiendo] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    (async () => {
      setCargando(true);
      const data = await obtenerMatriculas(idEstablecimiento);
      if (!activo) return;
      setMatriculas(data);
      setCargando(false);
    })();
    return () => { activo = false; };
  }, [idEstablecimiento]);

  const anosDisponibles = useMemo(() => {
    const anios = Array.from(new Set(matriculas.map((m) => new Date(m.creado_en).getFullYear())));
    if (anios.length === 0) anios.push(new Date().getFullYear());
    return anios.sort((a, b) => b - a);
  }, [matriculas]);

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return matriculas.filter((m) => {
      if (new Date(m.creado_en).getFullYear() !== anio) return false;
      if (nivel && m.nivel !== nivel) return false;
      if (tipo && (m.tipo || 'nueva') !== tipo) return false;
      if (!q) return true;
      const hayRut = m.rut ? limpiarRUT(m.rut).includes(limpiarRUT(q)) : false;
      const hayNombre = m.nombre_completo ? m.nombre_completo.toLowerCase().includes(q) : false;
      return hayRut || hayNombre;
    });
  }, [matriculas, anio, nivel, tipo, busqueda]);

  const imprimir = async (m: Matricula) => {
    setImprimiendo(m.id);
    try {
      const pref = m.datos.tipo_apoderado === 'Suplente' ? 'apoderado_suplente' : 'apoderado_titular';
      const apod = m.datos[pref] ?? m.datos.apoderado_titular;
      const nombreApo = [apod.apellido_paterno, apod.apellido_materno, apod.nombres].filter(Boolean).join(' ');
      const fecha = new Date(m.creado_en).toLocaleDateString('es-CL').split('-').join('/');
      await abrirPDFConsentimiento({ plantilla: 'imagen', nombreApoderado: nombreApo, rutApoderado: apod.rut, fecha });
    } finally {
      setImprimiendo(null);
    }
  };

  const fondo = temaOscuro ? '#111827' : '#FFFFFF';
  const borde = temaOscuro ? '#374151' : '#E5E7EB';

  return (
    <div style={{ ...s.contenedor, color: temaOscuro ? '#F3F4F6' : undefined }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={s.titulo}>📋 Ver Matrículas</h1>
          <p style={s.subtitulo}>Lista de matrículas registradas en el establecimiento.</p>
        </div>
        <button type="button" onClick={() => navigate('/matriculas/nueva')} style={{ ...s.botonNav, background: '#1A3C6B', color: '#FFFFFF' }}>
          <FilePlus2 size={16} /> Nueva Matrícula
        </button>
      </div>

      <div style={{ ...s.tarjeta, background: fondo, borderColor: borde }}>
        <div style={s.filtros}>
          <div>
            <p style={s.label}>Año</p>
            <select value={anio} onChange={(e) => setAnio(Number(e.target.value))} style={s.select}>
              {anosDisponibles.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <p style={s.label}>Nivel</p>
            <select value={nivel} onChange={(e) => setNivel(e.target.value)} style={s.select}>
              <option value="">Todos</option>
              {NIVELES_FILTRO.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <p style={s.label}>Tipo</p>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={s.select}>
              {TIPOS.map((t) => <option key={t.valor || 'todos'} value={t.valor}>{t.etiqueta}</option>)}
            </select>
          </div>
          <div style={{ flex: '1 1 220px', minWidth: 0 }}>
            <p style={s.label}>Buscar (nombre o RUT)</p>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 9, top: 10, color: '#9CA3AF' }} />
              <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Nombre o RUT…" style={{ ...s.input, paddingLeft: '30px' }} />
            </div>
          </div>
        </div>

        {cargando ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <Spinner />
          </div>
        ) : filtradas.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#9CA3AF', padding: '40px 0', fontSize: '14px' }}>
            No hay matrículas para los filtros seleccionados.
          </p>
        ) : (
          <div style={s.tablaWrap}>
            <table style={s.tabla}>
              <thead>
                <tr>
                  <th style={s.th}>Estudiante</th>
                  <th style={s.th}>RUT</th>
                  <th style={s.th}>Nivel</th>
                  <th style={s.th}>Tipo</th>
                  <th style={s.th}>Fecha</th>
                  <th style={s.th}>Estado</th>
                  <th style={s.th}>Consentimiento</th>
                  <th style={s.th}>PDF</th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map((m) => {
                  const est = badgeEstado(m.estado === 'anulada' ? 'anulada' : m.tipo || 'completada');
                  const consCompleto = !!m.datos?.consentimiento_completo;
                  return (
                    <tr key={m.id} style={{ color: temaOscuro ? '#E5E7EB' : undefined }}>
                      <td style={s.td}><strong>{m.nombre_completo || '—'}</strong></td>
                      <td style={s.td}>{m.rut || '—'}</td>
                      <td style={s.td}>{m.nivel || '—'}</td>
                      <td style={s.td}>{(m.tipo || 'nueva') === 'nueva' ? 'Nueva' : 'Continuidad'}</td>
                      <td style={s.td}>{new Date(m.creado_en).toLocaleDateString('es-CL')}</td>
                      <td style={s.td}>
                        <span style={{ ...s.badge, color: est.color, background: est.fondo }}>{est.texto}</span>
                      </td>
                      <td style={s.td}>
                        {m.estado === 'anulada' ? (
                          <span style={{ color: '#9CA3AF', fontSize: '12px' }}>No aplica</span>
                        ) : consCompleto ? (
                          <span style={{ ...s.badge, color: '#047857', background: '#D1FAE5' }}>Completo</span>
                        ) : (
                          <span style={{ ...s.badge, color: '#B45309', background: '#FEF3C7' }}>Pendiente</span>
                        )}
                      </td>
                      <td style={s.td}>
                        {m.estado !== 'anulada' && (
                          <button
                            type="button"
                            onClick={() => imprimir(m)}
                            disabled={imprimiendo === m.id}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              background: 'none', border: 'none', color: '#1A3C6B',
                              cursor: 'pointer', fontSize: '12px', textDecoration: 'underline',
                            }}
                          >
                            <Printer size={13} /> {imprimiendo === m.id ? 'Generando…' : 'Imprimir'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '12px' }}>
          {filtradas.length} resultado(s) de {matriculas.length} matrículas en {anio}.
        </p>
      </div>
    </div>
  );
}
