import { useState, useRef, type CSSProperties } from 'react';
import type { Estudiante, Solicitud } from '../types';
import { EstadoSolicitud, TipoRegistro } from '../types';
import DatePicker, { registerLocale } from 'react-datepicker/dist/es/index.js';
import { es } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import '../styles/registrar.css';

registerLocale('es', es);

interface Props {
  solicitudes: Solicitud[];
  estudiantes: Estudiante[];
  cursos: string[];
  profesoresMap: Record<string, string>;
  pestanaActiva: 'todos' | 'injustificados' | 'justificados' | 'anulados';
  onPestanaChange: (tab: 'todos' | 'injustificados' | 'justificados' | 'anulados') => void;
  filtrosCurso: string;
  onFiltroChange: (curso: string) => void;
  filtroFecha: string;
  onFiltroFechaChange: (fecha: string) => void;
  paginaActual: number;
  onPaginaChange: (page: number) => void;
  itemsPorPagina: number;
  onItemsPorPaginaChange: (items: number) => void;
  onFilaClick?: (solicitud: Solicitud) => void;
  // Encabezado formulario
  fechaForm: string;
  onFechaFormChange: (fecha: string) => void;
  horaForm: string;
  onHoraFormChange: (hora: string) => void;
  // Lookup individual por RUT
  rutLookup: string;
  onRutLookupChange: (rut: string) => void;
  onBuscarRut: () => void;
  estudianteLookup: Estudiante | null;
  estadoLookup: 'justificado' | 'injustificado' | 'sin_registro' | null;
  estadoManual: string;
  onEstadoManualChange: (estado: string) => void;
  onCrearJustificacion: () => void;
  // Motivos (comportamiento radio: uno u otro)
  tipoNuevo: TipoRegistro;
  onTipoNuevoChange: (tipo: TipoRegistro) => void;
}

// ─── Estilos del diseno (extraidos de Justificar1.html) ──────
const sRow: CSSProperties = { display: 'flex', gap: 12, alignItems: 'stretch', flexWrap: 'wrap' };
const sCampo: CSSProperties = { background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 3 };
const sLabel: CSSProperties = { fontSize: 9, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.3px' };
const sInput: CSSProperties = { border: '1px solid #d1d5db', borderRadius: 4, padding: '7px 10px', fontSize: 13, width: '100%', background: '#fff', color: '#1F2937' };
const sReadonly: CSSProperties = { ...sInput, background: '#f3f4f6', color: '#374151' };
const sChk: CSSProperties = { display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#374151', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 4, padding: '5px 10px', cursor: 'pointer' };
const GRID_COLS = '110px 1.3fr 90px 100px 70px 1fr 140px 120px';

const normRut = (r: string | null | undefined) => (r || '').replace(/[.\-\s]/g, '').toLowerCase();

function Divider() {
  return (
    <div style={{
      width: '100%', height: 2, margin: '4px 0', background: '#cccccc',
      WebkitMaskImage: 'linear-gradient(to right,transparent,#000 15%,#000 85%,transparent)',
      maskImage: 'linear-gradient(to right,transparent,#000 15%,#000 85%,transparent)',
    }} />
  );
}

function Badge({ variante }: { variante: 'justificado' | 'injustificado' | 'sin_registro' | 'anulado' }) {
  const conf = {
    justificado:   { bg: '#D1FAE5', color: '#065F46', border: '#6EE7B7', text: 'Justificado' },
    injustificado: { bg: '#FEE2E2', color: '#991B1B', border: '#FCA5A5', text: 'Injustificado' },
    sin_registro:  { bg: '#F3F4F6', color: '#6B7280', border: '#D1D5DB', text: 'Sin registro hoy' },
    anulado:       { bg: '#E5E7EB', color: '#374151', border: '#9CA3AF', text: 'Anulado' },
  }[variante];
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: 9999,
      fontSize: 11, fontWeight: 700, background: conf.bg, color: conf.color,
      border: `1px solid ${conf.border}`, whiteSpace: 'nowrap',
    }}>
      {conf.text}
    </span>
  );
}

const esJustificado = (e: EstadoSolicitud) =>
  e === EstadoSolicitud.ATRASO_JUSTIFICADO || e === EstadoSolicitud.INASISTENCIA_JUSTIFICADA;

export function RegistrarJustificacionUI({
  solicitudes,
  estudiantes,
  cursos,
  profesoresMap,
  pestanaActiva,
  onPestanaChange,
  filtrosCurso,
  onFiltroChange,
  filtroFecha,
  onFiltroFechaChange,
  paginaActual,
  onPaginaChange,
  itemsPorPagina,
  onItemsPorPaginaChange,
  onFilaClick,
  fechaForm,
  onFechaFormChange,
  horaForm,
  onHoraFormChange,
  rutLookup,
  onRutLookupChange,
  onBuscarRut,
  estudianteLookup,
  estadoLookup,
  estadoManual,
  onEstadoManualChange,
  onCrearJustificacion,
  tipoNuevo,
  onTipoNuevoChange,
}: Props) {
  // Obtener fecha de hoy en formato YYYY-MM-DD
  const hoy = new Date().toISOString().split('T')[0];

  // ── Autocomplete ──
  const [showAc, setShowAc] = useState(false);
  const [acResults, setAcResults] = useState<Estudiante[]>([]);
  const [acHighlightIdx, setAcHighlightIdx] = useState(-1);
  const acRef = useRef<HTMLDivElement>(null);

  const handleRutInput = (val: string) => {
    onRutLookupChange(val);
    setAcHighlightIdx(-1);
    if (val.trim().length < 1) { setShowAc(false); setAcResults([]); return; }
    const norm = normRut(val);
    const found = estudiantes.filter(e => normRut(e.rut).includes(norm) || (e.nombre_completo || '').toLowerCase().includes(norm)).slice(0, 10);
    setAcResults(found);
    setShowAc(found.length > 0);
  };

  const handleSelectAc = (est: Estudiante) => {
    onRutLookupChange(est.rut || '');
    setShowAc(false);
    onBuscarRut();
  };

  // Filtrar solicitudes
  const solicitudesFiltradas = solicitudes.filter(sol => {
    const est = estudiantes.find(e => e.id_estudiante === sol.id_estudiante);

    // Filtro por estado
    const estaEnEstado =
      pestanaActiva === 'todos'
        ? true
        : pestanaActiva === 'injustificados'
          ? sol.estado === EstadoSolicitud.INASISTENTE
          : pestanaActiva === 'anulados'
            ? sol.estado === EstadoSolicitud.NO_PRESENTADA
            : [
                EstadoSolicitud.ATRASO_JUSTIFICADO,
                EstadoSolicitud.INASISTENCIA_JUSTIFICADA,
              ].includes(sol.estado);

    // Filtro por Curso
    const cumpleCurso = !filtrosCurso || est?.curso === filtrosCurso;

    // Filtro por Fecha (default: hoy)
    const cumpleFecha = !filtroFecha
      ? sol.fecha === hoy
      : sol.fecha === filtroFecha;

    return estaEnEstado && cumpleCurso && cumpleFecha;
  });

  const totalPaginas = Math.ceil(solicitudesFiltradas.length / itemsPorPagina);
  const inicio = (paginaActual - 1) * itemsPorPagina;
  const solicitudesEnPagina = solicitudesFiltradas.slice(inicio, inicio + itemsPorPagina);

  return (
    <div className="registrar-container">
      <div className="registrar-wrapper">
        <div style={{
          background: '#fff', borderRadius: 10, boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
          padding: '18px 20px', marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 14,
        }}>

          {/* ─── Fila 1: Titulo + Fecha + Hora ─── */}
          <div style={sRow}>
            <div style={{ fontSize: 36, fontWeight: 400, color: '#374151', flex: 3, minWidth: 180, alignSelf: 'center' }}>
              Justificación
            </div>
            <div style={{ ...sCampo, flex: 1, minWidth: 140 }}>
              <label style={sLabel}>Fecha</label>
              <input type="date" value={fechaForm} onChange={e => onFechaFormChange(e.target.value)} style={sInput} />
            </div>
            <div style={{ ...sCampo, flex: 1, minWidth: 110 }}>
              <label style={sLabel}>Hora</label>
              <input type="time" value={horaForm} onChange={e => onHoraFormChange(e.target.value)} style={sInput} />
            </div>
          </div>

          {/* ─── Fila 2: RUT + Buscar / Nombre / Curso / Estado ─── */}
          <div style={sRow}>
            <div style={{ ...sCampo, flex: 1.5, minWidth: 280, position: 'relative' }}>
              <label style={sLabel}>RUT</label>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <input
                  type="text"
                  value={rutLookup}
                  onChange={e => handleRutInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'ArrowDown' && showAc) {
                      e.preventDefault();
                      setAcHighlightIdx(p => p < acResults.length - 1 ? p + 1 : 0);
                    } else if (e.key === 'ArrowUp' && showAc) {
                      e.preventDefault();
                      setAcHighlightIdx(p => p > 0 ? p - 1 : acResults.length - 1);
                    } else if (e.key === 'Tab' && showAc && !e.shiftKey) {
                      e.preventDefault();
                      if (acHighlightIdx < acResults.length - 1) setAcHighlightIdx(p => p + 1);
                      else { setShowAc(false); setAcHighlightIdx(-1); }
                    } else if (e.key === 'Tab' && showAc && e.shiftKey) {
                      e.preventDefault();
                      if (acHighlightIdx > 0) setAcHighlightIdx(p => p - 1);
                      else { setShowAc(false); setAcHighlightIdx(-1); }
                    } else if (e.key === 'Enter') {
                      e.preventDefault();
                      if (acHighlightIdx >= 0 && acResults[acHighlightIdx]) handleSelectAc(acResults[acHighlightIdx]);
                      else if (acResults.length > 0) handleSelectAc(acResults[0]);
                      else onBuscarRut();
                    } else if (e.key === 'Escape') {
                      setShowAc(false);
                    }
                  }}
                  onBlur={() => setTimeout(() => setShowAc(false), 200)}
                  placeholder="RUT o nombre"
                  autoComplete="off"
                  style={{ ...sInput, flex: 1 }}
                />
                <button
                  type="button"
                  onClick={onBuscarRut}
                  style={{ padding: '7px 14px', background: '#1A3C6B', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  Buscar
                </button>
              </div>
              {showAc && acResults.length > 0 && (
                <div ref={acRef} style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                  background: '#fff', border: '1px solid #d1d5db', borderRadius: '0 0 6px 6px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.12)', maxHeight: 260, overflowY: 'auto',
                }}>
                  {acResults.map((est, idx) => (
                    <button
                      key={est.id_estudiante}
                      type="button"
                      onMouseDown={() => handleSelectAc(est)}
                      onMouseEnter={() => setAcHighlightIdx(idx)}
                      style={{
                        display: 'flex', gap: 8, width: '100%', padding: '8px 12px',
                        border: 'none', borderBottom: '1px solid #f3f4f6',
                        background: idx === acHighlightIdx ? '#EFF6FF' : 'transparent',
                        outline: idx === acHighlightIdx ? '1px solid #1A3C6B' : 'none',
                        outlineOffset: -1, cursor: 'pointer',
                        fontSize: 12, textAlign: 'left', alignItems: 'center',
                      }}
                    >
                      <strong style={{ minWidth: 100, color: '#1A3C6B' }}>{est.rut}</strong>
                      <span style={{ flex: 1, color: '#374151' }}>{est.nombre_completo}</span>
                      <span style={{ color: '#9CA3AF', fontSize: 11 }}>{est.curso}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div style={{ ...sCampo, flex: 3, minWidth: 200 }}>
              <label style={sLabel}>Nombre estudiante</label>
              <input type="text" value={estudianteLookup?.nombre_completo || ''} readOnly placeholder="" style={sReadonly} />
            </div>
            <div style={{ ...sCampo, flex: 1, minWidth: 100 }}>
              <label style={sLabel}>Curso</label>
              <input type="text" value={estudianteLookup?.curso || ''} readOnly placeholder="" style={sReadonly} />
            </div>
            <div style={{ ...sCampo, flex: 1, minWidth: 130 }}>
              <label style={sLabel}>Estado</label>
              <select
                value={estadoManual}
                onChange={e => onEstadoManualChange(e.target.value)}
                onKeyDown={e => {
                  if (e.key === '1') { e.preventDefault(); onEstadoManualChange('Justificado'); }
                  if (e.key === '2') { e.preventDefault(); onEstadoManualChange('Injustificado'); }
                  if (e.key === '3') { e.preventDefault(); onEstadoManualChange('Pendiente'); }
                }}
                style={{ ...sInput, cursor: 'pointer', fontWeight: 600 }}
              >
                <option value="">—</option>
                <option value="Justificado">1. Justificado</option>
                <option value="Injustificado">2. Injustificado</option>
                <option value="Pendiente">3. Pendiente</option>
              </select>
            </div>
          </div>

          {/* ─── Prompt: crear justificación si no hay registro ─── */}
          {estadoLookup === 'sin_registro' && estudianteLookup && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
            background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 8, padding: '10px 14px',
          }}>
            <span style={{ fontSize: 13, color: '#92400E' }}>
              <strong>{estudianteLookup.nombre_completo}</strong> no tiene registro hoy. ¿Desea crear la justificación?
            </span>
            <button
              type="button"
              onClick={onCrearJustificacion}
              style={{ padding: '7px 16px', background: '#10B981', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              Crear justificación
            </button>
          </div>
          )}

          <Divider />

          {/* ─── Motivos del pase (comportamiento radio) ─── */}
          <div style={{ fontSize: 22, fontWeight: 700, color: '#374151' }}>Motivos del pase</div>
          <div style={sRow}>
            <label style={sChk}>
              <input
                type="checkbox"
                checked={tipoNuevo === TipoRegistro.ATRASO}
                onChange={() => onTipoNuevoChange(TipoRegistro.ATRASO)}
              />
              Atraso
            </label>
            <label style={sChk}>
              <input
                type="checkbox"
                checked={tipoNuevo === TipoRegistro.INASISTENCIA}
                onChange={() => onTipoNuevoChange(TipoRegistro.INASISTENCIA)}
              />
              Inasistencia
            </label>
          </div>

          <Divider />

          {/* ─── Buscar estudiantes: filtros + tabla ─── */}
          <div style={{ fontSize: 18, fontWeight: 700, color: '#374151' }}>Buscar estudiantes</div>

          {/* Filtros */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            {/* Filtro Estado */}
            <div>
              <label style={{ display: 'block', fontWeight: '600', fontSize: '0.875rem', marginBottom: '0.5rem', color: '#374151' }}>Estado</label>
              <select
                value={pestanaActiva}
                onChange={(e) => {
                  onPestanaChange(e.target.value as 'todos' | 'injustificados' | 'justificados' | 'anulados');
                  onPaginaChange(1);
                }}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                <option value="todos">📋 Todos</option>
                <option value="injustificados">🕐 Injustificados</option>
                <option value="justificados">✅ Justificados</option>
                <option value="anulados">✕ Anulados</option>
              </select>
            </div>

            {/* Filtro Curso */}
            <div>
              <label style={{ display: 'block', fontWeight: '600', fontSize: '0.875rem', marginBottom: '0.5rem', color: '#374151' }}>Curso</label>
              <select
                value={filtrosCurso}
                onChange={(e) => {
                  onFiltroChange(e.target.value);
                  onPaginaChange(1);
                }}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                <option value="">Todos</option>
                {cursos.map((curso) => (
                  <option key={curso} value={curso}>
                    {curso}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro Fecha */}
            <div>
              <label style={{ display: 'block', fontWeight: '600', fontSize: '0.875rem', marginBottom: '0.5rem', color: '#374151' }}>Fecha</label>
              <DatePicker
                locale="es"
                dateFormat="dd/MM/yyyy"
                selected={filtroFecha ? new Date(filtroFecha + 'T12:00:00') : null}
                onChange={(date) => {
                  if (date) {
                    const y = date.getFullYear();
                    const m = String(date.getMonth() + 1).padStart(2, '0');
                    const d = String(date.getDate()).padStart(2, '0');
                    onFiltroFechaChange(`${y}-${m}-${d}`);
                  } else {
                    onFiltroFechaChange('');
                  }
                  onPaginaChange(1);
                }}
                isClearable
                placeholderText="Seleccionar fecha"
                minDate={new Date(2026, 2, 1)}
                maxDate={new Date()}
                className="rdp-fecha-input"
                wrapperClassName="rdp-fecha-wrapper"
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
              />
            </div>
          </div>

          {/* Items por página */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontWeight: '600', fontSize: '0.875rem', color: '#374151' }}>Mostrar:</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[5, 10, 15, 50].map((num) => (
                <button type="button"
                  key={num}
                  onClick={() => {
                    onItemsPorPaginaChange(num);
                    onPaginaChange(1);
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    border: itemsPorPagina === num ? '2px solid #2563eb' : '1px solid #d1d5db',
                    background: itemsPorPagina === num ? '#dbeafe' : 'white',
                    color: itemsPorPagina === num ? '#2563eb' : '#6b7280',
                    fontWeight: itemsPorPagina === num ? '600' : '500',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                  }}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* TABLA */}
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflowX: 'auto' }}>
            {/* Encabezado */}
            <div style={{ display: 'grid', gridTemplateColumns: GRID_COLS, gap: '0.5rem', padding: '0.75rem 1rem', background: '#f3f4f6', borderBottom: '2px solid #e5e7eb', fontWeight: '600', fontSize: '0.8rem', color: '#374151', minWidth: 900, boxSizing: 'border-box', width: '100%' }}>
              <div>Rut</div>
              <div>Nombre</div>
              <div>Curso</div>
              <div>Fecha</div>
              <div>Hora</div>
              <div>Profesor</div>
              <div style={{ textAlign: 'center' }}>Tipo</div>
              <div style={{ textAlign: 'center' }}>Estado</div>
            </div>

            {/* Filas */}
            {solicitudesEnPagina.length > 0 ? (
              solicitudesEnPagina.map((sol) => {
                const est = estudiantes.find((e) => e.id_estudiante === sol.id_estudiante);
                const esSeleccionable = sol.estado === EstadoSolicitud.INASISTENTE;

                return (
                  <button
                    type="button"
                    key={sol.id_solicitud}
                    onClick={() => {
                      if (esSeleccionable && onFilaClick) {
                        onFilaClick(sol);
                      }
                    }}
                    disabled={!esSeleccionable}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: GRID_COLS,
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      border: 'none',
                      borderBottom: '1px solid #e5e7eb',
                      alignItems: 'center',
                      fontSize: '0.875rem',
                      color: '#374151',
                      background: esSeleccionable ? 'white' : '#fafafa',
                      cursor: esSeleccionable ? 'pointer' : 'default',
                      transition: 'all 0.2s ease',
                      minWidth: 900,
                      textAlign: 'left',
                      boxSizing: 'border-box',
                      width: '100%',
                    }}
                    onMouseEnter={(e) => {
                      if (esSeleccionable) {
                        (e.currentTarget as HTMLElement).style.background = '#f0f9ff';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (esSeleccionable) {
                        (e.currentTarget as HTMLElement).style.background = 'white';
                      }
                    }}
                  >
                    <div style={{ fontWeight: '600' }}>{est?.rut}</div>
                    <div>{est?.nombre_completo}</div>
                    <div>{est?.curso}</div>
                    <div>{sol.fecha}</div>
                    <div>{sol.hora}</div>
                    <div style={{ color: '#6b7280', fontSize: '0.8rem' }}>{profesoresMap[sol.id_profesor] || '—'}</div>
                    <div style={{ textAlign: 'center', color: '#6b7280' }}>{sol.tipo}</div>
                    <div style={{ textAlign: 'center' }}>
                      <Badge variante={sol.estado === EstadoSolicitud.NO_PRESENTADA ? 'anulado' : esJustificado(sol.estado) ? 'justificado' : 'injustificado'} />
                    </div>
                  </button>
                );
              })
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
                <div>No hay registros disponibles</div>
              </div>
            )}
          </div>

          {/* PAGINACIÓN */}
          {totalPaginas > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <button type="button"
                onClick={() => onPaginaChange(Math.max(1, paginaActual - 1))}
                disabled={paginaActual === 1}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  background: paginaActual === 1 ? '#f3f4f6' : 'white',
                  color: paginaActual === 1 ? '#9ca3af' : '#374151',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  cursor: paginaActual === 1 ? 'not-allowed' : 'pointer',
                  opacity: paginaActual === 1 ? 0.6 : 1,
                }}
              >
                ← Anterior
              </button>
              <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                Página <span style={{ color: '#2563eb', fontWeight: '700' }}>{paginaActual}</span> de <span style={{ color: '#2563eb', fontWeight: '700' }}>{totalPaginas}</span>
              </span>
              <button type="button"
                onClick={() => onPaginaChange(Math.min(totalPaginas, paginaActual + 1))}
                disabled={paginaActual === totalPaginas}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  background: paginaActual === totalPaginas ? '#f3f4f6' : 'white',
                  color: paginaActual === totalPaginas ? '#9ca3af' : '#374151',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  cursor: paginaActual === totalPaginas ? 'not-allowed' : 'pointer',
                  opacity: paginaActual === totalPaginas ? 0.6 : 1,
                }}
              >
                Siguiente →
              </button>
            </div>
          )}

          {/* Resumen */}
          <div style={{ background: '#f0f9ff', padding: '1rem', borderRadius: '8px', textAlign: 'center', fontSize: '0.875rem', color: '#0c4a6e', fontWeight: '500' }}>
            Total de registros: <strong>{solicitudesFiltradas.length}</strong> | Mostrando: <strong>{Math.min(itemsPorPagina, solicitudesEnPagina.length)}</strong> por página
          </div>
        </div>
      </div>
    </div>
  );
}
