import type { Estudiante, Solicitud } from '../types';
import { EstadoSolicitud } from '../types';
import '../styles/registrar.css';

interface Props {
  solicitudes: Solicitud[];
  estudiantes: Estudiante[];
  cursos: string[];
  pestanaActiva: 'todos' | 'injustificados' | 'justificados';
  onPestanaChange: (tab: 'todos' | 'injustificados' | 'justificados') => void;
  busquedaRut: string;
  onBusquedaChange: (rut: string) => void;
  filtrosCurso: string;
  onFiltroChange: (curso: string) => void;
  filtroFecha: string;
  onFiltroFechaChange: (fecha: string) => void;
  paginaActual: number;
  onPaginaChange: (page: number) => void;
  itemsPorPagina: number;
  onItemsPorPaginaChange: (items: number) => void;
  onFilaClick?: (solicitud: Solicitud) => void;
}

export function RegistrarJustificacionUI({
  solicitudes,
  estudiantes,
  cursos,
  pestanaActiva,
  onPestanaChange,
  busquedaRut,
  onBusquedaChange,
  filtrosCurso,
  onFiltroChange,
  filtroFecha,
  onFiltroFechaChange,
  paginaActual,
  onPaginaChange,
  itemsPorPagina,
  onItemsPorPaginaChange,
  onFilaClick,
}: Props) {
  // Obtener fecha de hoy en formato YYYY-MM-DD
  const hoy = new Date().toISOString().split('T')[0];

  // Filtrar solicitudes
  const solicitudesFiltradas = solicitudes.filter(sol => {
    const est = estudiantes.find(e => e.id_estudiante === sol.id_estudiante);
    
    // Filtro por estado (todos/injustificado/justificado)
    const estaEnEstado =
      pestanaActiva === 'todos'
        ? true
        : pestanaActiva === 'injustificados'
          ? sol.estado === EstadoSolicitud.INJUSTIFICADA
          : sol.estado === EstadoSolicitud.JUSTIFICADA;

    // Filtro por RUT
    const cumpleBusqueda = !busquedaRut || (est?.rut || '').includes(busquedaRut);
    
    // Filtro por Curso
    const cumpleCurso = !filtrosCurso || est?.curso === filtrosCurso;
    
    // Filtro por Fecha (solo del día actual)
    const cumpleFecha = sol.fecha === hoy;

    return estaEnEstado && cumpleBusqueda && cumpleCurso && cumpleFecha;
  });

  const totalPaginas = Math.ceil(solicitudesFiltradas.length / itemsPorPagina);
  const inicio = (paginaActual - 1) * itemsPorPagina;
  const solicitudesEnPagina = solicitudesFiltradas.slice(inicio, inicio + itemsPorPagina);

  // Función para obtener icono según estado
  const getEstadoIcono = (estado: EstadoSolicitud) => {
    if (estado === EstadoSolicitud.JUSTIFICADA) return '✅';
    if (estado === EstadoSolicitud.INJUSTIFICADA) return '🕐';
    return '⚠️';
  };

  return (
    <div className="registrar-container">
      <div className="registrar-wrapper">
        {/* HEADER */}
        <div className="registrar-header">
          <h1 className="registrar-title">Registrar Justificación</h1>
          <p className="registrar-subtitle">Gestionar justificaciones e injustificaciones</p>
        </div>

        {/* FILTROS */}
        <div className="registrar-form-section" style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f9fafb', borderRadius: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            {/* Filtro Estado */}
            <div>
              <label style={{ display: 'block', fontWeight: '600', fontSize: '0.875rem', marginBottom: '0.5rem', color: '#374151' }}>Estado</label>
              <select
                value={pestanaActiva}
                onChange={(e) => {
                  onPestanaChange(e.target.value as 'todos' | 'injustificados' | 'justificados');
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
              </select>
            </div>

            {/* Filtro RUT */}
            <div>
              <label style={{ display: 'block', fontWeight: '600', fontSize: '0.875rem', marginBottom: '0.5rem', color: '#374151' }}>Buscar RUT</label>
              <input
                type="text"
                placeholder="Ej: 12345678-9"
                value={busquedaRut}
                onChange={(e) => {
                  onBusquedaChange(e.target.value);
                  onPaginaChange(1);
                }}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  fontSize: '0.875rem',
                }}
              />
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
              <input
                type="date"
                value={filtroFecha}
                onChange={(e) => {
                  onFiltroFechaChange(e.target.value);
                  onPaginaChange(1);
                }}
                min="2026-03-01"
                max={new Date().toISOString().split('T')[0]}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
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
        </div>

        {/* TABLA */}
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden', marginBottom: '1.5rem' }}>
          {/* Encabezado */}
          <div style={{ display: 'none' }}>
            {/* Hidden on mobile */}
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '100px 180px 100px 100px 80px 120px 60px', gap: '1rem', padding: '1rem', background: '#f3f4f6', borderBottom: '2px solid #e5e7eb', fontWeight: '600', fontSize: '0.875rem', color: '#374151' }}>
            <div style={{ textAlign: 'center' }}>RUT</div>           
            <div>Nombre</div>
            <div>Curso</div>
            <div>Hora</div>
            <div>Fecha</div>
            <div style={{ textAlign: 'center' }}>Tipo</div>
            <div style={{ textAlign: 'center' }}>Estado</div>
          </div>

          {/* Filas */}
          {solicitudesEnPagina.length > 0 ? (
            solicitudesEnPagina.map((sol) => {
              const est = estudiantes.find((e) => e.id_estudiante === sol.id_estudiante);
              const esSeleccionable = sol.estado === EstadoSolicitud.INJUSTIFICADA;
              
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
                    gridTemplateColumns: '100px 200px 100px 100px 120px 120px 60px',
                    gap: '1rem',
                    padding: '0.2rem',
                    borderBottom: '1px solid #e5e7eb',
                    alignItems: 'center',
                    fontSize: '0.875rem',
                    color: '#374151',
                    background: esSeleccionable ? 'white' : '#fafafa',
                    cursor: esSeleccionable ? 'pointer' : 'default',
                    transition: 'all 0.2s ease',
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
                  <div>{sol.hora}</div>
                  <div>{sol.fecha}</div>
                  <div style={{ textAlign: 'center', color: '#6b7280' }}>{sol.tipo}</div>
                  <div style={{ textAlign: 'center', fontSize: '1.25rem' }}>{getEstadoIcono(sol.estado)}</div>
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
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
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
  );
}
