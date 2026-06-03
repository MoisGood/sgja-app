// ============================================================
// SGJA – Mantenedor de Bloques de Horario
// src/pages/BloqueHorario.tsx
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { Button, Modal } from '../components/Common';
import {
  obtenerBloquesHorarios,
  crearBloqueHorario,
  actualizarBloqueHorario,
  eliminarBloqueHorario,
} from '../services/database';
import type { BloqueHorario } from '../types';

interface Props {
  idEstablecimiento: string;
}

type TipoBloque = 'clase' | 'recreo' | 'almuerzo' | 'otro';

interface FormBloque {
  nombre_bloque: string;
  hora_inicio: string;
  hora_fin: string;
  tipo: TipoBloque;
}

export default function BloqueHorario({ idEstablecimiento }: Props) {
  const [bloques, setBloques] = useState<BloqueHorario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalCrear, setModalCrear] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [bloqueEditar, setBloqueEditar] = useState<BloqueHorario | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [esMobil, setEsMobil] = useState(window.innerWidth < 768);

  const [formCrear, setFormCrear] = useState<FormBloque>({
    nombre_bloque: '',
    hora_inicio: '08:00',
    hora_fin: '08:45',
    tipo: 'clase',
  });

  const [formEditar, setFormEditar] = useState<FormBloque>({
    nombre_bloque: '',
    hora_inicio: '',
    hora_fin: '',
    tipo: 'clase',
  });

  const cargarBloques = useCallback(async () => {
    try {
      setCargando(true);
      setError(null);
      const data = await obtenerBloquesHorarios(idEstablecimiento);
      setBloques(data);
    } catch (err) {
      setError('Error al cargar bloques horarios');
      console.error(err);
    } finally {
      setCargando(false);
    }
  }, [idEstablecimiento]);

  useEffect(() => {
    cargarBloques();
  }, [cargarBloques]);

  useEffect(() => {
    const handleResize = () => setEsMobil(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleCrearBloque = async () => {
    if (!formCrear.nombre_bloque || !formCrear.hora_inicio || !formCrear.hora_fin) {
      setError('Todos los campos son obligatorios');
      return;
    }

    try {
      setGuardando(true);
      const orden = bloques.length + 1;
      await crearBloqueHorario(
        idEstablecimiento,
        formCrear.nombre_bloque,
        formCrear.hora_inicio,
        formCrear.hora_fin,
        formCrear.tipo,
        orden
      );
      await cargarBloques();
      setModalCrear(false);
      setFormCrear({
        nombre_bloque: '',
        hora_inicio: '08:00',
        hora_fin: '08:45',
        tipo: 'clase',
      });
      setError(null);
    } catch (err) {
      setError('Error al crear bloque horario');
      console.error(err);
    } finally {
      setGuardando(false);
    }
  };

  const handleEditarBloque = async () => {
    if (!bloqueEditar) return;

    try {
      setGuardando(true);
      await actualizarBloqueHorario(bloqueEditar.id_bloque, {
        nombre_bloque: formEditar.nombre_bloque,
        hora_inicio: formEditar.hora_inicio,
        hora_fin: formEditar.hora_fin,
        tipo: formEditar.tipo,
      });
      await cargarBloques();
      setModalEditar(false);
      setBloqueEditar(null);
      setError(null);
    } catch (err) {
      setError('Error al actualizar bloque horario');
      console.error(err);
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminarBloque = async (idBloque: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este bloque?')) return;

    try {
      setGuardando(true);
      await eliminarBloqueHorario(idBloque);
      await cargarBloques();
      setError(null);
    } catch (err) {
      setError('Error al eliminar bloque horario');
      console.error(err);
    } finally {
      setGuardando(false);
    }
  };

  const abrirModalEditar = (bloque: BloqueHorario) => {
    setBloqueEditar(bloque);
    setFormEditar({
      nombre_bloque: bloque.nombre_bloque,
      hora_inicio: bloque.hora_inicio,
      hora_fin: bloque.hora_fin,
      tipo: bloque.tipo as 'clase' | 'recreo' | 'almuerzo' | 'otro',
    });
    setModalEditar(true);
  };

  const getTipoColor = (tipo: string) => {
    const colores: Record<string, string> = {
      clase: '#3B82F6',
      recreo: '#10B981',
      almuerzo: '#F59E0B',
      otro: '#6B7280',
    };
    return colores[tipo] || '#6B7280';
  };

  return (
    <div style={styles.contenedor}>
      <div style={styles.encabezado}>
        <h1 style={styles.titulo}>⏰ Bloques de Horario</h1>
        <p style={styles.subtitulo}>Administra los bloques horarios del establecimiento</p>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.botones}>
        <Button onClick={() => setModalCrear(true)} tipo="exito" anchoCompleto={esMobil}>
          ➕ Crear Bloque
        </Button>
      </div>

      {cargando ? (
        <div style={styles.cargando}>⏳ Cargando bloques horarios...</div>
      ) : bloques.length === 0 ? (
        <div style={styles.vacio}>📭 No hay bloques de horario configurados</div>
      ) : (
        <div style={styles.tablaContenedor}>
          <table style={styles.tabla}>
            <thead>
              <tr style={styles.encabezadoFila}>
                <th style={styles.th}>N°</th>
                <th style={styles.th}>Nombre</th>
                <th style={styles.th}>Inicio</th>
                <th style={styles.th}>Fin</th>
                <th style={styles.th}>Duración</th>
                <th style={styles.th}>Tipo</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {bloques.map((bloque, idx) => (
                <tr key={bloque.id_bloque} style={styles.fila}>
                  <td style={styles.td}>{idx + 1}</td>
                  <td style={styles.td}>{bloque.nombre_bloque}</td>
                  <td style={styles.td}>{bloque.hora_inicio}</td>
                  <td style={styles.td}>{bloque.hora_fin}</td>
                  <td style={styles.td}>{bloque.duracion_minutos} min</td>
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.tipoBadge,
                        backgroundColor: getTipoColor(bloque.tipo),
                      }}
                    >
                      {bloque.tipo}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.accionesGrupo}>
                      <button type="button" 
                        onClick={() => abrirModalEditar(bloque)}
                        style={styles.botonIcono}
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button type="button" 
                        onClick={() => handleEliminarBloque(bloque.id_bloque)}
                        style={styles.botonIconoEliminar}
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Crear */}
      <Modal abierto={modalCrear} titulo="Crear Bloque Horario" onCerrar={() => setModalCrear(false)}>
        <div style={styles.formulario}>
          <label style={styles.etiqueta}>
            Nombre del Bloque
            <input
              type="text"
              value={formCrear.nombre_bloque}
              onChange={(e) => setFormCrear({ ...formCrear, nombre_bloque: e.target.value })}
              placeholder="ej: Bloque 1, Recreo"
              style={styles.input}
            />
          </label>

          <label style={styles.etiqueta}>
            Hora Inicio
            <input
              type="time"
              value={formCrear.hora_inicio}
              onChange={(e) => setFormCrear({ ...formCrear, hora_inicio: e.target.value })}
              style={styles.input}
            />
          </label>

          <label style={styles.etiqueta}>
            Hora Fin
            <input
              type="time"
              value={formCrear.hora_fin}
              onChange={(e) => setFormCrear({ ...formCrear, hora_fin: e.target.value })}
              style={styles.input}
            />
          </label>

          <label style={styles.etiqueta}>
            Tipo
            <select
              value={formCrear.tipo}
              onChange={(e) => setFormCrear({ ...formCrear, tipo: e.target.value as TipoBloque })}
              style={styles.input}
            >
              <option value="clase">Clase</option>
              <option value="recreo">Recreo</option>
              <option value="almuerzo">Almuerzo</option>
              <option value="otro">Otro</option>
            </select>
          </label>

          <div style={styles.botonesModal}>
            <Button onClick={() => setModalCrear(false)} tipo="secundario">
              Cancelar
            </Button>
            <Button onClick={handleCrearBloque} tipo="exito" deshabilitado={guardando}>
              {guardando ? '⏳ Guardando...' : 'Guardar'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Editar */}
      <Modal abierto={modalEditar} titulo="Editar Bloque Horario" onCerrar={() => setModalEditar(false)}>
        <div style={styles.formulario}>
          <label style={styles.etiqueta}>
            Nombre del Bloque
            <input
              type="text"
              value={formEditar.nombre_bloque}
              onChange={(e) => setFormEditar({ ...formEditar, nombre_bloque: e.target.value })}
              style={styles.input}
            />
          </label>

          <label style={styles.etiqueta}>
            Hora Inicio
            <input
              type="time"
              value={formEditar.hora_inicio}
              onChange={(e) => setFormEditar({ ...formEditar, hora_inicio: e.target.value })}
              style={styles.input}
            />
          </label>

          <label style={styles.etiqueta}>
            Hora Fin
            <input
              type="time"
              value={formEditar.hora_fin}
              onChange={(e) => setFormEditar({ ...formEditar, hora_fin: e.target.value })}
              style={styles.input}
            />
          </label>

          <label style={styles.etiqueta}>
            Tipo
            <select
              value={formEditar.tipo}
              onChange={(e) => setFormEditar({ ...formEditar, tipo: e.target.value as TipoBloque })}
              style={styles.input}
            >
              <option value="clase">Clase</option>
              <option value="recreo">Recreo</option>
              <option value="almuerzo">Almuerzo</option>
              <option value="otro">Otro</option>
            </select>
          </label>

          <div style={styles.botonesModal}>
            <Button onClick={() => setModalEditar(false)} tipo="secundario">
              Cancelar
            </Button>
            <Button onClick={handleEditarBloque} tipo="exito" deshabilitado={guardando}>
              {guardando ? '⏳ Guardando...' : 'Actualizar'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  contenedor: {
    padding: '16px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  encabezado: {
    marginBottom: '24px',
  },
  titulo: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1F2937',
    margin: '0 0 8px 0',
  },
  subtitulo: {
    fontSize: '14px',
    color: '#6B7280',
    margin: 0,
  },
  botones: {
    marginBottom: '24px',
    display: 'flex',
    gap: '12px',
  },
  error: {
    padding: '12px 16px',
    backgroundColor: '#FEE2E2',
    color: '#DC2626',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px',
  },
  cargando: {
    textAlign: 'center',
    padding: '48px 24px',
    color: '#6B7280',
    fontSize: '14px',
  },
  vacio: {
    textAlign: 'center',
    padding: '48px 24px',
    color: '#6B7280',
    fontSize: '14px',
  },
  tablaContenedor: {
    overflowX: 'auto',
    borderRadius: '8px',
    border: '1px solid #E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  tabla: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '14px',
  },
  encabezadoFila: {
    backgroundColor: '#F3F4F6',
    borderBottom: '2px solid #E5E7EB',
  },
  th: {
    padding: '12px 16px',
    textAlign: 'left' as const,
    fontWeight: '600',
    color: '#374151',
    fontSize: '13px',
  },
  fila: {
    borderBottom: '1px solid #E5E7EB',
  },
  td: {
    padding: '12px 16px',
    color: '#1F2937',
  },
  accionesGrupo: {
    display: 'flex',
    gap: '8px',
  },
  botonIcono: {
    padding: '6px 10px',
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'background-color 0.2s',
  },
  botonIconoEliminar: {
    padding: '6px 10px',
    backgroundColor: '#EF4444',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'background-color 0.2s',
  },
  tipoBadge: {
    color: '#FFFFFF',
    padding: '4px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'capitalize' as const,
  },
  gridDesktop: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '16px',
  },
  gridMovil: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  tarjeta: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '16px',
    borderLeft: '4px solid #3B82F6',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  tarjetaEncabezado: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  nombreBloque: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '600',
    color: '#1F2937',
  },
  tiempos: {
    marginBottom: '12px',
  },
  tiempo: {
    margin: '4px 0',
    fontSize: '13px',
    color: '#374151',
  },
  acciones: {
    display: 'flex',
    gap: '8px',
  },
  botonEditar: {
    flex: 1,
    padding: '8px 12px',
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    transition: 'background-color 0.2s',
  },
  botonEliminar: {
    flex: 1,
    padding: '8px 12px',
    backgroundColor: '#EF4444',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    transition: 'background-color 0.2s',
  },
  formulario: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  etiqueta: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
  },
  input: {
    padding: '10px 12px',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#374151',
    backgroundColor: '#FFFFFF',
    fontFamily: 'inherit',
  },
  botonesModal: {
    display: 'flex',
    gap: '12px',
    marginTop: '24px',
    justifyContent: 'flex-end',
  },
};
