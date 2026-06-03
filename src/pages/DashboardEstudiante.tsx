// ============================================================
// SGJA – Dashboard Estudiante
// src/pages/DashboardEstudiante.tsx
// ============================================================

import { useState, useEffect } from 'react';
import { Card, Button, EstadoBadge } from '../components/Common';
import { obtenerSolicitudesPorEstudiante } from '../services/database';
import type { Solicitud } from '../types';
import { getEmojiTipo, getLabelSimple } from '../utils/tipoRegistroHelper';

interface Props {
  idEstudiante: string;
}

export default function DashboardEstudiante({ idEstudiante }: Props) {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const ITEMS_POR_PAGINA = 10;
  const [filtroMes, setFiltroMes] = useState(new Date().getMonth().toString());
  const [filtroAno, setFiltroAno] = useState(new Date().getFullYear().toString());

  const solicitudesFiltradas = solicitudes.filter(s => {
    const d = new Date(s.fecha);
    const mesOk = filtroMes === '' || d.getMonth().toString() === filtroMes;
    const anoOk = filtroAno === '' || d.getFullYear().toString() === filtroAno;
    return mesOk && anoOk;
  });

  useEffect(() => {
    const doFetch = async () => {
      try {
        setCargando(true);
        setError(null);
        const data = await obtenerSolicitudesPorEstudiante(idEstudiante).catch(() => []);
        setSolicitudes(data || []);
        setPaginaActual(1);
      } catch (err) {
        setError('Error al cargar solicitudes');
        console.error(err);
        setSolicitudes([]);
      } finally {
        setCargando(false);
      }
    };
    doFetch();
  }, [idEstudiante]);

  const handleReintentar = async () => {
    try {
      setCargando(true);
      const data = await obtenerSolicitudesPorEstudiante(idEstudiante);
      setSolicitudes(data);
      setError(null);
      setPaginaActual(1);
    } catch (err) {
      setError('Error al cargar solicitudes');
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  // Calcular paginación
  const totalPaginas = Math.ceil(solicitudesFiltradas.length / ITEMS_POR_PAGINA);
  const indiceInicio = (paginaActual - 1) * ITEMS_POR_PAGINA;
  const indiceFin = indiceInicio + ITEMS_POR_PAGINA;
  const solicitudesPaginadas = solicitudesFiltradas.slice(indiceInicio, indiceFin);

  const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  if (cargando) {
    return (
      <div style={styles.contenedor}>
        <p style={styles.cargando}>⏳ Cargando solicitudes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.contenedor}>
        <Card titulo="Error" padding="24px">
          <p style={styles.error}>{error}</p>
          <Button onClick={handleReintentar}>Reintentar</Button>
        </Card>
      </div>
    );
  }

  return (
    <div style={styles.contenedor}>
      {/* Encabezado */}
      <div style={styles.encabezado}>
        <h1 style={styles.titulo}>Mi Historial de Justificaciones</h1>
        <p style={styles.subtitulo}>Visualiza el estado de tus solicitudes</p>
      </div>

      {/* Filtro mes/año */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <select value={filtroMes} onChange={e => { setFiltroMes(e.target.value); setPaginaActual(1); }} style={{ padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', flex: 1, minWidth: '120px' }}>
          <option value="">Todos los meses</option>
          {MESES.map((m, i) => <option key={m} value={i}>{m}</option>)}
        </select>
        <select value={filtroAno} onChange={e => { setFiltroAno(e.target.value); setPaginaActual(1); }} style={{ padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', width: '100px' }}>
          <option value="">Todos</option>
          {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {/* Solicitudes */}
      <Card
        titulo="Mis Solicitudes"
        descripcion={`Mostrando ${solicitudesFiltradas.length} de ${solicitudes.length} solicitudes`}
        padding="24px"
      >
        {solicitudes.length === 0 ? (
          <p style={styles.sinDatos}>No tienes solicitudes registradas</p>
        ) : (
          <>
            {/* Tabla */}
            <div style={styles.tablaContenedor}>
              <table style={styles.tabla}>
                <thead>
                  <tr style={styles.encabezadoTabla}>
                    <th style={styles.celda}>Fecha</th>
                    <th style={styles.celda}>Tipo</th>
                    <th style={styles.celda}>Motivo</th>
                    <th style={styles.celda}>Estado</th>
                    <th style={styles.celda}>Observaciones</th>
                  </tr>
                </thead>
                <tbody>
                  {solicitudesPaginadas.map((sol, idx) => (
                    <tr key={idx} style={styles.filaTabla}>
                      <td style={styles.celda}>
                        {new Date(sol.fecha).toLocaleDateString('es-CL')}
                      </td>
                      <td style={styles.celda}>
                        {getEmojiTipo(sol.tipo)} {getLabelSimple(sol.tipo)}
                      </td>
                      <td style={styles.celda}>{sol.motivo_descripcion || '-'}</td>
                      <td style={styles.celda}>
                        <EstadoBadge estado={sol.estado} />
                      </td>
                      <td style={styles.celda}>{sol.observaciones || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            <div style={styles.paginacion}>
              <button type="button" 
                onClick={() => setPaginaActual(Math.max(1, paginaActual - 1))}
                disabled={paginaActual === 1}
                style={{
                  ...styles.botonPaginacion,
                  opacity: paginaActual === 1 ? 0.5 : 1,
                  cursor: paginaActual === 1 ? 'not-allowed' : 'pointer',
                }}
              >
                ← Anterior
              </button>

              <div style={styles.indicePaginacion}>
                Página {paginaActual} de {totalPaginas}
              </div>

              <button type="button" 
                onClick={() => setPaginaActual(Math.min(totalPaginas, paginaActual + 1))}
                disabled={paginaActual === totalPaginas}
                style={{
                  ...styles.botonPaginacion,
                  opacity: paginaActual === totalPaginas ? 0.5 : 1,
                  cursor: paginaActual === totalPaginas ? 'not-allowed' : 'pointer',
                }}
              >
                Siguiente →
              </button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

  // ── Fin ──
const styles: Record<string, React.CSSProperties> = {
  contenedor: {
    padding: '24px',
    backgroundColor: '#F9FAFB',
    minHeight: '100vh',
  },
  encabezado: {
    marginBottom: '24px',
  },
  titulo: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1A3C6B',
    margin: '0 0 8px 0',
  },
  subtitulo: {
    fontSize: '14px',
    color: '#6B7280',
    margin: 0,
  },

  tablaContenedor: {
    overflowX: 'auto',
    marginBottom: '16px',
  } as React.CSSProperties,
  tabla: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
    backgroundColor: '#FFFFFF',
  } as React.CSSProperties,
  encabezadoTabla: {
    backgroundColor: '#F3F4F6',
    borderBottom: '2px solid #D1D5DB',
  } as React.CSSProperties,
  filaTabla: {
    borderBottom: '1px solid #E5E7EB',
  } as React.CSSProperties,
  celda: {
    padding: '12px',
    textAlign: 'left',
    color: '#374151',
  } as React.CSSProperties,
  paginacion: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '12px',
    marginTop: '16px',
    padding: '16px',
    backgroundColor: '#F9FAFB',
    borderRadius: '8px',
  } as React.CSSProperties,
  botonPaginacion: {
    padding: '8px 16px',
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  } as React.CSSProperties,
  indicePaginacion: {
    fontSize: '14px',
    color: '#6B7280',
    fontWeight: '500',
  },
  cargando: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: '16px',
    margin: '40px 0',
  },
  error: {
    color: '#991B1B',
    fontSize: '14px',
    marginBottom: '16px',
  },
  sinDatos: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: '14px',
    padding: '20px',
  },
};
