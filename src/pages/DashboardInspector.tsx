// ============================================================
// SGJA – Dashboard Inspector
// src/pages/DashboardInspector.tsx
// ============================================================

import { useState, useEffect } from 'react';
import { Card, Button, EstadoBadge } from '../components/Common';
import {
  obtenerSolicitudesDelEstablecimiento,
  actualizarEstadoSolicitud,
} from '../services/database';
import type { Solicitud, EstadoSolicitud } from '../types';
import { getEmojiTipo, getLabelSimple } from '../utils/tipoRegistroHelper';

interface Props {
  idEstablecimiento: string;
}

export default function DashboardInspector({ idEstablecimiento }: Props) {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [filtroEstado, setFiltroEstado] = useState<EstadoSolicitud | 'TODAS'>('TODAS');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const doFetch = async () => {
      try {
        setCargando(true);
        setError(null);
        const estado = filtroEstado === 'TODAS' ? undefined : (filtroEstado as EstadoSolicitud);
        const data = await obtenerSolicitudesDelEstablecimiento(idEstablecimiento, estado).catch(() => []);
        setSolicitudes(data || []);
      } catch (err) {
        setError('Error al cargar solicitudes');
        console.error(err);
        setSolicitudes([]);
      } finally {
        setCargando(false);
      }
    };
    doFetch();
  }, [filtroEstado, idEstablecimiento]);

  const handleCambiarEstado = async (idSolicitud: string, nuevoEstado: EstadoSolicitud) => {
    try {
      await actualizarEstadoSolicitud(idSolicitud, nuevoEstado);
      const estado = filtroEstado === 'TODAS' ? undefined : (filtroEstado as EstadoSolicitud);
      const data = await obtenerSolicitudesDelEstablecimiento(idEstablecimiento, estado);
      setSolicitudes(data);
    } catch (err) {
      setError('Error al actualizar solicitud');
      console.error(err);
    }
  };

  const handleReintentar = async () => {
    try {
      setCargando(true);
      const estado = filtroEstado === 'TODAS' ? undefined : (filtroEstado as EstadoSolicitud);
      const data = await obtenerSolicitudesDelEstablecimiento(idEstablecimiento, estado);
      setSolicitudes(data);
      setError(null);
    } catch (err) {
      setError('Error al cargar solicitudes');
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

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
        <h1 style={styles.titulo}>Dashboard Inspector</h1>
        <p style={styles.subtitulo}>Revisión de solicitudes de justificación</p>
      </div>

      {/* Filtros */}
      <Card titulo="Filtros" padding="16px" sombra="pequeña">
        <div style={styles.filtros}>
          {['TODAS', 'Injustificada', 'Justificada', 'Rechazada', 'No presentada'].map((estado) => (
            <button type="button" 
              key={estado}
              onClick={() => setFiltroEstado(estado as 'TODAS' | EstadoSolicitud)}
              style={{
                ...styles.botonFiltro,
                backgroundColor: filtroEstado === estado ? '#1A3C6B' : '#F3F4F6',
                color: filtroEstado === estado ? '#FFFFFF' : '#374151',
              }}
            >
              {estado}
            </button>
          ))}
        </div>
      </Card>

      {/* Listado de Solicitudes */}
      <Card
        titulo="Solicitudes a Revisar"
        descripcion={`Total: ${solicitudes.length} solicitudes`}
        padding="24px"
      >
        {solicitudes.length === 0 ? (
          <p style={styles.sinDatos}>No hay solicitudes con este filtro</p>
        ) : (
          <div style={styles.lista}>
            {solicitudes.map((solicitud, idx) => (
              <div key={idx} style={styles.itemSolicitud}>
                <div style={styles.itemHeader}>
                  <div>
                    <p style={styles.itemTitulo}>
                      {getEmojiTipo(solicitud.tipo)} {getLabelSimple(solicitud.tipo)}
                    </p>
                    <p style={styles.itemSubtitulo}>
                      Estudiante: {solicitud.id_estudiante}
                    </p>
                    <p style={styles.itemTexto}>
                      Fecha: {new Date(solicitud.fecha).toLocaleDateString('es-CL')}
                    </p>
                  </div>
                  <EstadoBadge estado={solicitud.estado} />
                </div>

                {solicitud.motivo_descripcion && (
                  <div style={styles.motivo}>
                    <p style={styles.motivoTitulo}>Motivo:</p>
                    <p style={styles.motivoTexto}>{solicitud.motivo_descripcion}</p>
                  </div>
                )}

                <div style={styles.acciones}>
                  <Button
                    tamaño="pequeño"
                    tipo="exito"
                    onClick={() => handleCambiarEstado(solicitud.id_solicitud, 'Aprobada' as EstadoSolicitud)}
                  >
                    ✓ Aprobar
                  </Button>
                  <Button
                    tamaño="pequeño"
                    tipo="peligro"
                    onClick={() => handleCambiarEstado(solicitud.id_solicitud, 'Rechazada' as EstadoSolicitud)}
                  >
                    ✗ Rechazar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

  // ── Mantenimiento ──

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
  filtros: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  botonFiltro: {
    padding: '8px 16px',
    fontSize: '12px',
    fontWeight: '600',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  lista: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  itemSolicitud: {
    backgroundColor: '#F9FAFB',
    borderRadius: '8px',
    padding: '16px',
    border: '1px solid #E5E7EB',
  },
  itemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
  },
  itemTitulo: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#1A3C6B',
    margin: '0 0 4px 0',
  },
  itemSubtitulo: {
    fontSize: '13px',
    color: '#6B7280',
    margin: '0 0 4px 0',
  },
  itemTexto: {
    fontSize: '12px',
    color: '#9CA3AF',
    margin: 0,
  },
  motivo: {
    backgroundColor: '#FFFFFF',
    borderLeft: '3px solid #0369A1',
    padding: '12px',
    marginBottom: '12px',
    borderRadius: '4px',
  },
  motivoTitulo: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#374151',
    margin: '0 0 4px 0',
  },
  motivoTexto: {
    fontSize: '13px',
    color: '#6B7280',
    margin: 0,
  },
  acciones: {
    display: 'flex',
    gap: '8px',
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
