import { useState, useEffect, useMemo } from 'react';
import { Card, Button, Modal } from '../components/Common';
import {
  obtenerAsignaciones,
  asignarCurso,
  desasignarCurso,
} from '../services/asignacionCursos.service';
import { obtenerFuncionarios } from '../services/funcionarios';
import type { AsignacionParadocente, Funcionario } from '../types';

interface Props {
  idEstablecimiento: string;
}

const NIVELES = ['1° Medio', '2° Medio', '3° Medio', '4° Medio'];
const CURSOS = ['A', 'B', 'C', 'D'];

export default function AsignacionCursos({ idEstablecimiento }: Props) {
  const [asignaciones, setAsignaciones] = useState<AsignacionParadocente[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal crear
  const [modalCrear, setModalCrear] = useState(false);
  const [formCrear, setFormCrear] = useState({
    id_funcionario: '',
    nivel: NIVELES[0],
    curso: CURSOS[0],
  });
  const [guardando, setGuardando] = useState(false);

  // Modal eliminar
  const [modalEliminar, setModalEliminar] = useState(false);
  const [asignacionEliminar, setAsignacionEliminar] = useState<AsignacionParadocente | null>(null);

  // Filtro
  const [filtroParadocente, setFiltroParadocente] = useState('');
  const [filtroNivel, setFiltroNivel] = useState('');

  useEffect(() => {
    cargarDatos();
  }, [idEstablecimiento]);

  async function cargarDatos() {
    setCargando(true);
    setError(null);
    try {
      const [asignacionesData, funcionariosData] = await Promise.all([
        obtenerAsignaciones(idEstablecimiento),
        obtenerFuncionarios(),
      ]);
      setAsignaciones(asignacionesData);
      setFuncionarios(funcionariosData);
    } catch (err) {
      setError('Error al cargar datos');
      console.error(err);
    } finally {
      setCargando(false);
    }
  }

  const paradocentes = useMemo(
    () => funcionarios.filter(f => f.tipo_funcionario === 'paradocente' && f.vigente),
    [funcionarios]
  );

  const nombreFuncionario = (idFuncionario: string) =>
    funcionarios.find(f => f.id_usuario === idFuncionario || f.rut === idFuncionario)?.nombre_completo || idFuncionario;

  const asignacionesFiltradas = useMemo(() => {
    let filtradas = [...asignaciones];
    if (filtroParadocente) {
      filtradas = filtradas.filter(a => a.id_funcionario === filtroParadocente);
    }
    if (filtroNivel) {
      filtradas = filtradas.filter(a => a.nivel === filtroNivel);
    }
    return filtradas;
  }, [asignaciones, filtroParadocente, filtroNivel]);

  // ── Crear ──────────────────────────────────────────────────
  function abrirModalCrear() {
    setFormCrear({
      id_funcionario: paradocentes[0]?.id_usuario || paradocentes[0]?.rut || '',
      nivel: NIVELES[0],
      curso: CURSOS[0],
    });
    setModalCrear(true);
  }

  async function handleCrear() {
    if (!formCrear.id_funcionario) {
      setError('Selecciona una paradocente');
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      const ok = await asignarCurso(
        formCrear.id_funcionario,
        idEstablecimiento,
        formCrear.nivel,
        formCrear.curso
      );
      if (ok) {
        setModalCrear(false);
        await cargarDatos();
      } else {
        setError('Error al asignar curso');
      }
    } catch {
      setError('Error al asignar curso');
    } finally {
      setGuardando(false);
    }
  }

  // ── Eliminar ────────────────────────────────────────────────
  function abrirModalEliminar(a: AsignacionParadocente) {
    setAsignacionEliminar(a);
    setModalEliminar(true);
  }

  async function handleEliminar() {
    if (!asignacionEliminar) return;
    setGuardando(true);
    try {
      await desasignarCurso(asignacionEliminar.id);
      setModalEliminar(false);
      await cargarDatos();
    } catch {
      setError('Error al eliminar asignación');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div style={styles.contenedor}>
      <div style={styles.encabezado}>
        <h1 style={styles.titulo}>Asignación de Cursos a Paradocente</h1>
        <p style={styles.subtitulo}>
          Administra qué cursos tiene asignados cada paradocente del establecimiento
        </p>
      </div>

      {error && (
        <div style={styles.errorBox}>
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} style={styles.errorClose}>✕</button>
        </div>
      )}

      {/* Filtros */}
      <div style={styles.filtros}>
        <select
          value={filtroParadocente}
          onChange={e => setFiltroParadocente(e.target.value)}
          style={styles.select}
        >
          <option value="">Todas las paradocentes</option>
          {paradocentes.map(p => (
            <option key={p.rut} value={p.id_usuario || p.rut}>
              {p.nombre_completo}
            </option>
          ))}
        </select>
        <select
          value={filtroNivel}
          onChange={e => setFiltroNivel(e.target.value)}
          style={styles.select}
        >
          <option value="">Todos los niveles</option>
          {NIVELES.map(n => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      {/* Tabla */}
      <div style={styles.fila}>
        <Card padding="0">
          {cargando ? (
            <div style={styles.estadoVacio}>Cargando asignaciones...</div>
          ) : asignacionesFiltradas.length === 0 ? (
            <div style={styles.estadoVacio}>
              {asignaciones.length === 0
                ? 'No hay asignaciones de cursos creadas aún'
                : 'Ninguna asignación coincide con los filtros'}
            </div>
          ) : (
            <div style={styles.tablaContenedor}>
              <table style={styles.tabla}>
                <thead>
                  <tr style={styles.filaEncabezado}>
                    <th style={styles.celdaEncabezado}>Paradocente</th>
                    <th style={styles.celdaEncabezado}>Nivel</th>
                    <th style={styles.celdaEncabezado}>Curso</th>
                    <th style={styles.celdaEncabezado}>Fecha</th>
                    <th style={styles.celdaEncabezado}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {asignacionesFiltradas.map((a, idx) => (
                    <tr
                      key={a.id}
                      style={{
                        ...styles.filaTabla,
                        backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB',
                      }}
                    >
                      <td style={styles.celda}>{nombreFuncionario(a.id_funcionario)}</td>
                      <td style={styles.celda}>{a.nivel}</td>
                      <td style={styles.celda}>
                        <span style={styles.badgeCurso}>{a.curso}</span>
                      </td>
                      <td style={styles.celda}>
                        {a.creado_en ? new Date(a.creado_en).toLocaleDateString('es-CL') : '—'}
                      </td>
                      <td style={styles.celdaAcciones}>
                        <button
                          type="button"
                          onClick={() => abrirModalEliminar(a)}
                          style={styles.botonEliminar}
                          title="Eliminar asignación"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Botón crear */}
      <div style={styles.fila}>
        <Card padding="24px">
          <Button onClick={abrirModalCrear} tipo="exito" anchoCompleto>
            + Asignar Curso a Paradocente
          </Button>
        </Card>
      </div>

      {/* Modal Crear */}
      <Modal abierto={modalCrear} titulo="Asignar Curso" onCerrar={() => setModalCrear(false)}>
        <div style={styles.formulario}>
          <label style={styles.etiqueta}>
            Paradocente
            <select
              value={formCrear.id_funcionario}
              onChange={e => setFormCrear({ ...formCrear, id_funcionario: e.target.value })}
              style={styles.select}
            >
              <option value="">Seleccionar...</option>
              {paradocentes.map(p => (
                <option key={p.rut} value={p.id_usuario || p.rut}>
                  {p.nombre_completo}
                </option>
              ))}
            </select>
          </label>

          <label style={styles.etiqueta}>
            Nivel
            <select
              value={formCrear.nivel}
              onChange={e => setFormCrear({ ...formCrear, nivel: e.target.value })}
              style={styles.select}
            >
              {NIVELES.map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>

          <label style={styles.etiqueta}>
            Curso
            <select
              value={formCrear.curso}
              onChange={e => setFormCrear({ ...formCrear, curso: e.target.value })}
              style={styles.select}
            >
              {CURSOS.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>

          {error && <p style={styles.errorTexto}>{error}</p>}

          <div style={styles.botonesModal}>
            <Button onClick={() => setModalCrear(false)} tipo="secundario">
              Cancelar
            </Button>
            <Button onClick={handleCrear} tipo="exito" cargando={guardando} deshabilitado={guardando}>
              {guardando ? 'Guardando...' : 'Asignar'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Eliminar */}
      <Modal
        abierto={modalEliminar}
        titulo="Eliminar Asignación"
        onCerrar={() => setModalEliminar(false)}
      >
        <div style={styles.formulario}>
          <p style={{ fontSize: 14, color: '#374151', margin: 0 }}>
            ¿Eliminar la asignación de{' '}
            <strong>{asignacionEliminar ? nombreFuncionario(asignacionEliminar.id_funcionario) : ''}</strong>{' '}
            al curso{' '}
            <strong>{asignacionEliminar ? `${asignacionEliminar.nivel} - ${asignacionEliminar.curso}` : ''}</strong>?
          </p>

          <div style={styles.botonesModal}>
            <Button onClick={() => setModalEliminar(false)} tipo="secundario" deshabilitado={guardando}>
              Cancelar
            </Button>
            <Button onClick={handleEliminar} tipo="peligro" cargando={guardando} deshabilitado={guardando}>
              {guardando ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// ESTILOS
// ════════════════════════════════════════════════════════════

const styles: Record<string, React.CSSProperties> = {
  contenedor: {
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
    maxWidth: 1100,
    margin: '0 auto',
  },
  encabezado: { marginBottom: 8 },
  titulo: { fontSize: 24, fontWeight: 700, color: '#1A3C6B', margin: '0 0 8px' },
  subtitulo: { fontSize: 14, color: '#6B7280', margin: 0 },

  errorBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
    padding: '12px 16px',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
  },
  errorClose: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 16,
    color: '#991B1B',
    padding: '2px 6px',
  },

  filtros: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap' as const,
  },
  select: {
    padding: '10px 12px',
    border: '1px solid #E5E7EB',
    borderRadius: 8,
    fontSize: 14,
    color: '#374151',
    backgroundColor: '#FFFFFF',
    cursor: 'pointer',
    minWidth: 180,
  },

  fila: { width: '100%' },

  tablaContenedor: { overflowX: 'auto' },
  tabla: { width: '100%', borderCollapse: 'collapse' },
  filaEncabezado: {
    backgroundColor: '#F3F4F6',
    borderBottom: '2px solid #E5E7EB',
  },
  celdaEncabezado: {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: 12,
    fontWeight: 600,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filaTabla: { borderBottom: '1px solid #E5E7EB' },
  celda: { padding: '12px 16px', fontSize: 14, color: '#374151' },
  celdaAcciones: { padding: '12px 16px', textAlign: 'center' as const },
  badgeCurso: {
    display: 'inline-block',
    padding: '3px 12px',
    borderRadius: 6,
    backgroundColor: '#DBEAFE',
    color: '#1E40AF',
    fontWeight: 600,
    fontSize: 13,
  },
  botonEliminar: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 16,
    color: '#EF4444',
    padding: '4px 8px',
    borderRadius: 4,
  },

  estadoVacio: {
    padding: '48px 24px',
    textAlign: 'center',
    fontSize: 14,
    color: '#9CA3AF',
  },

  formulario: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  etiqueta: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    fontSize: 14,
    fontWeight: 500,
    color: '#374151',
  },
  errorTexto: {
    fontSize: 14,
    color: '#DC2626',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    margin: 0,
  },
  botonesModal: {
    display: 'flex',
    gap: 12,
    marginTop: 24,
    justifyContent: 'flex-end',
  },
};
