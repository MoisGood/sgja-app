import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Curso } from '../types';
import { useAuth } from '../hooks/useAuth';

interface SupabaseCursoRow {
  id: string;
  id_establecimiento: string;
  codigo?: string;
  nombre?: string;
  nivel?: string | number;
  activo?: boolean;
}

const LETRAS_VALIDAS = ['A', 'B', 'C', 'D'] as const;
const NOMBRES_NIVEL = ['Primero', 'Segundo', 'Tercero', 'Cuarto'];

function obtenerLetraDesdeCodigo(codigo?: string): string {
  if (!codigo) return 'A';
  const match = codigo.toUpperCase().match(/[A-D]$/);
  return match?.[0] ?? 'A';
}

function obtenerNivelNumerico(nivel: string | number | undefined, codigo?: string): number {
  if (typeof nivel === 'number') return nivel;
  if (typeof nivel === 'string') {
    const numero = parseInt(nivel, 10);
    if (!Number.isNaN(numero)) return numero;
  }
  if (codigo) {
    const match = codigo.match(/\d+/);
    if (match?.[0]) return parseInt(match[0], 10);
  }
  return 1;
}

export default function MantenedorCursos() {
  const { idEstablecimiento: idEstablecimientoAuth } = useAuth();
  const idEstablecimiento = idEstablecimientoAuth || '';

  const [cursos, setCursos] = useState<Curso[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mostraModalAgregar, setMostraModalAgregar] = useState(false);
  const [cursoEditando, setCursoEditando] = useState<Curso | null>(null);
  const [pagina, setPagina] = useState(1);
  const itemsPorPagina = 15;

  const [formData, setFormData] = useState({
    nivel: 1,
    letra: 'A',
    opcional: '',
  });

  // Cargar cursos
  const cargarCursos = useCallback(async () => {
    try {
      setCargando(true);
      const { data, error } = await supabase
        .from('cursos')
        .select('*')
        .eq('id_establecimiento', idEstablecimiento)
        .eq('activo', true);

      if (error) throw error;

      const cursosMapeados: Curso[] = ((data || []) as SupabaseCursoRow[])
        .map((curso) => {
          const nivelNumerico = obtenerNivelNumerico(curso.nivel, curso.codigo);
          const letra = obtenerLetraDesdeCodigo(curso.codigo);
          const orden = (nivelNumerico - 1) * 4 + (letra.charCodeAt(0) - 64);
          const nombre = curso.codigo || `${nivelNumerico}${letra}`;

          return {
            id_curso: curso.id,
            id_establecimiento: curso.id_establecimiento,
            nombre,
            descripcion: curso.nombre || `${NOMBRES_NIVEL[nivelNumerico - 1] || 'Primero'} ${letra}`,
            opcional: nombre.replace(/(\d)([A-D])/, '$1°$2'),
            nivel: nivelNumerico,
            letra,
            activo: curso.activo ?? true,
            orden,
            creado_en: new Date(),
            actualizado_en: new Date(),
          };
        })
        .filter((curso) => curso.nivel && curso.letra) // Filtrar cursos con datos válidos
        .sort((a, b) => {
          if (a.nivel !== b.nivel) return a.nivel - b.nivel;
          return (a.letra || '').localeCompare(b.letra || '');
        });
      setCursos(cursosMapeados);
      setPagina(1);
    } catch (err) {
      setError('Error al cargar cursos');
      console.error(err);
    } finally {
      setCargando(false);
    }
  }, [idEstablecimiento]);

  useEffect(() => {
    cargarCursos();
  }, [cargarCursos]);

  // Validar curso
  const validarCurso = () => {
    const { nivel, letra } = formData;
    
    if (!nivel || nivel < 1 || nivel > 4) {
      setError('Nivel debe estar entre 1 y 4');
      return false;
    }
    
    if (!letra || !LETRAS_VALIDAS.includes(letra.toUpperCase() as (typeof LETRAS_VALIDAS)[number])) {
      setError('Letra debe ser A, B, C o D');
      return false;
    }

    // Verificar si ya existe
    const existe = cursos.some(
      (c) =>
        c.nivel === nivel &&
        c.letra === letra.toUpperCase() &&
        (!cursoEditando || c.id_curso !== cursoEditando.id_curso)
    );

    if (existe) {
      setError(`El curso ${nivel}${letra.toUpperCase()} ya existe`);
      return false;
    }

    return true;
  };

  // Agregar curso
  const agregarCurso = async () => {
    setError(null);
    
    if (!validarCurso()) return;

    try {
      const { nivel, letra } = formData;
      const nombre = `${nivel}${letra.toUpperCase()}`;
      const descripcion = `${NOMBRES_NIVEL[nivel - 1]} ${letra.toUpperCase()}`;

      const { error } = await supabase.from('cursos').insert({
        codigo: nombre,
        nombre: descripcion,
        nivel: String(nivel),
        id_establecimiento: idEstablecimiento,
        activo: true,
        actualizado_en: new Date().toISOString(),
      });
      if (error) throw error;

      cargarCursos();
      setMostraModalAgregar(false);
      setFormData({ nivel: 1, letra: 'A', opcional: '' });
    } catch (err) {
      setError('Error al agregar curso');
      console.error(err);
    }
  };

  // Editar curso
  const abrirEditar = (curso: Curso) => {
    setCursoEditando(curso);
    setFormData({
      nivel: curso.nivel,
      letra: curso.letra,
      opcional: curso.opcional,
    });
    setMostraModalAgregar(true);
  };

  const actualizarCurso = async () => {
    setError(null);

    if (!validarCurso() || !cursoEditando) return;

    try {
      const { nivel, letra, opcional } = formData;
      const nombre = `${nivel}${letra.toUpperCase()}`;
      const descripcion = `${NOMBRES_NIVEL[nivel - 1]} ${letra.toUpperCase()}`;

      const { error } = await supabase
        .from('cursos')
        .update({
          codigo: nombre,
          nombre: descripcion,
          nivel: String(nivel),
          actualizado_en: new Date().toISOString(),
        })
        .eq('id', cursoEditando.id_curso)
        .eq('id_establecimiento', idEstablecimiento);

      if (error) throw error;

      if (opcional) {
        // Se mantiene en formData para compatibilidad visual; no se persiste porque la tabla cursos en Supabase no tiene esta columna.
        console.debug('Campo opcional no persistido:', opcional);
      }

      cargarCursos();
      setMostraModalAgregar(false);
      setCursoEditando(null);
      setFormData({ nivel: 1, letra: 'A', opcional: '' });
    } catch (err) {
      setError('Error al actualizar curso');
      console.error(err);
    }
  };

  // Eliminar curso
  const eliminarCurso = async (id: string) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este curso?')) return;

    try {
      const { error } = await supabase
        .from('cursos')
        .delete()
        .eq('id', id)
        .eq('id_establecimiento', idEstablecimiento);

      if (error) throw error;
      cargarCursos();
    } catch (err) {
      setError('Error al eliminar curso');
      console.error(err);
    }
  };

  // Crear cursos predeterminados
  const crearCursosPredeterminados = async () => {
    if (!window.confirm('¿Crear los 16 cursos predeterminados? (1A a 4D)')) return;

    try {
      const cursosPredeterminados: Array<{
        codigo: string;
        nombre: string;
        nivel: string;
        id_establecimiento: string;
        activo: boolean;
      }> = [];

      for (let nivel = 1; nivel <= 4; nivel++) {
        for (let letraIdx = 0; letraIdx < 4; letraIdx++) {
          const letra = String.fromCharCode(65 + letraIdx); // A, B, C, D
          const codigo = `${nivel}${letra}`;
          cursosPredeterminados.push({
            codigo,
            nombre: `${NOMBRES_NIVEL[nivel - 1]} ${letra}`,
            nivel: String(nivel),
            id_establecimiento: idEstablecimiento,
            activo: true,
          });
        }
      }

      const { error } = await supabase.from('cursos').insert(cursosPredeterminados);
      if (error) throw error;

      cargarCursos();
      alert('Cursos predeterminados creados exitosamente');
    } catch (err) {
      setError('Error al crear cursos predeterminados');
      console.error(err);
    }
  };

  if (cargando) return <div style={styles.container}><p>⏳ Cargando…</p></div>;

  return (
    <div style={styles.container}>
      <div style={styles.encabezado}>
        <h1 style={styles.titulo}>📚 Mantenedor de Cursos</h1>
        <p style={styles.subtitulo}>Gestiona los cursos del establecimiento</p>
      </div>

      {error && (
        <div style={styles.errorBanner}>
          <p>{error}</p>
          <button type="button" onClick={() => setError(null)} style={styles.botonCerrar}>✕</button>
        </div>
      )}

      <div style={styles.botones}>
        <button type="button" onClick={() => {
          setCursoEditando(null);
          setFormData({ nivel: 1, letra: 'A', opcional: '' });
          setMostraModalAgregar(true);
        }} style={styles.botonPrimario}>
          ➕ Agregar Curso
        </button>
        <button type="button" onClick={crearCursosPredeterminados} style={styles.botonSecundario}>
          ⚡ Crear Cursos Predeterminados
        </button>
      </div>

      {cursos.length === 0 ? (
        <div style={styles.vacio}>📭 No hay cursos registrados</div>
      ) : (
        <div style={styles.tablaContenedor}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
            <span style={{ fontSize: '13px', color: '#6B7280' }}>Total: {cursos.length} cursos</span>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <button type="button" disabled={pagina <= 1} onClick={() => setPagina(p => p - 1)} style={{
                padding: '4px 10px', border: '1px solid #D1D5DB', borderRadius: '4px',
                background: pagina <= 1 ? '#F3F4F6' : '#FFF', color: pagina <= 1 ? '#D1D5DB' : '#374151',
                cursor: pagina <= 1 ? 'default' : 'pointer', fontSize: '12px'
              }}>◀</button>
              {Array.from({ length: Math.ceil(cursos.length / itemsPorPagina) }, (_, i) => i + 1).map(p => (
                <button type="button" key={p} onClick={() => setPagina(p)} style={{
                  padding: '4px 10px', border: '1px solid #D1D5DB', borderRadius: '4px',
                  background: p === pagina ? '#1A3C6B' : '#FFF', color: p === pagina ? '#FFF' : '#374151',
                  cursor: 'pointer', fontSize: '12px', fontWeight: p === pagina ? 700 : 400
                }}>{p}</button>
              ))}
              <button type="button" disabled={pagina >= Math.ceil(cursos.length / itemsPorPagina)} onClick={() => setPagina(p => p + 1)} style={{
                padding: '4px 10px', border: '1px solid #D1D5DB', borderRadius: '4px',
                background: pagina >= Math.ceil(cursos.length / itemsPorPagina) ? '#F3F4F6' : '#FFF',
                color: pagina >= Math.ceil(cursos.length / itemsPorPagina) ? '#D1D5DB' : '#374151',
                cursor: pagina >= Math.ceil(cursos.length / itemsPorPagina) ? 'default' : 'pointer', fontSize: '12px'
              }}>▶</button>
            </div>
          </div>
          <table style={styles.tabla}>
            <thead>
              <tr style={styles.encabezadoFila}>
                <th style={styles.th}>Nombre</th>
                <th style={styles.th}>Descripción</th>
                <th style={styles.th}>Opcional</th>
                <th style={styles.th}>Nivel</th>
                <th style={styles.th}>Letra</th>
                <th style={styles.th}>Estado</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cursos.slice((pagina - 1) * itemsPorPagina, pagina * itemsPorPagina).map((curso) => (
                <tr key={curso.id_curso} style={styles.fila}>
                  <td style={styles.td}><strong>{curso.nombre}</strong></td>
                  <td style={styles.td}>{curso.descripcion}</td>
                  <td style={styles.td}>{curso.opcional}</td>
                  <td style={styles.td}>{curso.nivel}</td>
                  <td style={styles.td}>{curso.letra}</td>
                  <td style={{...styles.td, fontWeight: 600, color: curso.activo ? '#16A34A' : '#DC2626'}}>
                    {curso.activo ? '✅ Activo' : '❌ Inactivo'}
                  </td>
                  <td style={{...styles.td, display: 'flex', gap: '8px'}}>
                    <button type="button" 
                      onClick={() => abrirEditar(curso)}
                      style={styles.botonIconoEditar}
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button type="button" 
                      onClick={() => eliminarCurso(curso.id_curso)}
                      style={styles.botonIconoEliminar}
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Agregar/Editar */}
      {mostraModalAgregar && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitulo}>
                {cursoEditando ? '✏️ Editar Curso' : '➕ Agregar Curso'}
              </h2>
              <button type="button" onClick={() => {
                setMostraModalAgregar(false);
                setCursoEditando(null);
              }} style={styles.botonCerrarModal}>✕</button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.formulario}>
                <div>
                  <label style={styles.label}>Nivel *</label>
                  <select
                    value={formData.nivel}
                    onChange={(e) => setFormData({ ...formData, nivel: parseInt(e.target.value) })}
                    style={styles.input}
                  >
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                  </select>
                </div>

                <div>
                  <label style={styles.label}>Letra *</label>
                  <select
                    value={formData.letra}
                    onChange={(e) => setFormData({ ...formData, letra: e.target.value })}
                    style={styles.input}
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>

                <div>
                  <label style={styles.label}>Opcional (Ej: 1°A)</label>
                  <input
                    type="text"
                    value={formData.opcional}
                    onChange={(e) => setFormData({ ...formData, opcional: e.target.value })}
                    placeholder="1°A"
                    style={styles.input}
                  />
                </div>

                <div style={styles.preview}>
                  <p><strong>Previsualizacion:</strong></p>
                  <p>• Nombre: {formData.nivel}{formData.letra}</p>
                  <p>• Descripción: {['Primero', 'Segundo', 'Tercero', 'Cuarto'][formData.nivel - 1]} {formData.letra}</p>
                  <p>• Opcional: {formData.opcional || `${formData.nivel}°${formData.letra}`}</p>
                </div>
              </div>

              <div style={styles.botonesModal}>
                <button type="button" 
                  onClick={() => {
                    setMostraModalAgregar(false);
                    setCursoEditando(null);
                  }} 
                  style={styles.botonModalSecundario}
                >
                  Cancelar
                </button>
                <button type="button" 
                  onClick={cursoEditando ? actualizarCurso : agregarCurso}
                  style={styles.botonModalPrimario}
                >
                  {cursoEditando ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  encabezado: {
    marginBottom: '30px',
  },
  titulo: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#1F2937',
    margin: '0 0 8px 0',
  },
  subtitulo: {
    fontSize: '14px',
    color: '#6B7280',
    margin: 0,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderLeft: '4px solid #DC2626',
    padding: '12px 16px',
    borderRadius: '4px',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as React.CSSProperties,
  botones: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px',
  } as React.CSSProperties,
  botonPrimario: {
    backgroundColor: '#3B82F6',
    color: 'white',
    padding: '10px 16px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 500,
    fontSize: '14px',
  } as React.CSSProperties,
  botonSecundario: {
    backgroundColor: '#E5E7EB',
    color: '#374151',
    padding: '10px 16px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 500,
    fontSize: '14px',
  } as React.CSSProperties,
  botonCerrar: {
    background: 'none',
    border: 'none',
    color: '#DC2626',
    cursor: 'pointer',
    fontSize: '20px',
  } as React.CSSProperties,
  vacio: {
    textAlign: 'center',
    padding: '40px',
    color: '#9CA3AF',
    fontSize: '16px',
  } as React.CSSProperties,
  tablaContenedor: {
    backgroundColor: 'white',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  } as React.CSSProperties,
  tabla: {
    width: '100%',
    borderCollapse: 'collapse',
  } as React.CSSProperties,
  encabezadoFila: {
    backgroundColor: '#F3F4F6',
    borderBottom: '1px solid #E5E7EB',
  } as React.CSSProperties,
  th: {
    padding: '12px 16px',
    textAlign: 'left',
    fontWeight: 600,
    color: '#374151',
    fontSize: '14px',
  } as React.CSSProperties,
  fila: {
    borderBottom: '1px solid #E5E7EB',
    transition: 'background-color 0.2s',
  } as React.CSSProperties,
  td: {
    padding: '12px 16px',
    fontSize: '14px',
    color: '#374151',
  } as React.CSSProperties,
  botonIconoEditar: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '18px',
    padding: '4px',
  } as React.CSSProperties,
  botonIconoEliminar: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '18px',
    padding: '4px',
  } as React.CSSProperties,
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  } as React.CSSProperties,
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '8px',
    width: '90%',
    maxWidth: '500px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
  } as React.CSSProperties,
  modalHeader: {
    padding: '20px 24px',
    borderBottom: '1px solid #E5E7EB',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as React.CSSProperties,
  modalTitulo: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#1F2937',
    margin: 0,
  } as React.CSSProperties,
  botonCerrarModal: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#6B7280',
  } as React.CSSProperties,
  modalBody: {
    padding: '24px',
  } as React.CSSProperties,
  formulario: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  } as React.CSSProperties,
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '6px',
  } as React.CSSProperties,
  input: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #D1D5DB',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box',
  } as React.CSSProperties,
  preview: {
    backgroundColor: '#F3F4F6',
    padding: '12px',
    borderRadius: '4px',
    fontSize: '13px',
    color: '#374151',
  } as React.CSSProperties,
  botonesModal: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '20px',
  } as React.CSSProperties,
  botonModalPrimario: {
    backgroundColor: '#3B82F6',
    color: 'white',
    padding: '10px 16px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 500,
    fontSize: '14px',
  } as React.CSSProperties,
  botonModalSecundario: {
    backgroundColor: '#E5E7EB',
    color: '#374151',
    padding: '10px 16px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 500,
    fontSize: '14px',
  } as React.CSSProperties,
};
