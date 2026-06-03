// ============================================================
// SGJA – Mantenedor de Estudiantes (Mejorado)
// src/pages/MantenedorEstudiantes.tsx
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  obtenerEstudiantesDelEstablecimiento,
  crearEstudiante as crearEstudianteDB,
  actualizarEstudiante as actualizarEstudianteDB,
  eliminarEstudiante as eliminarEstudianteDB,
  verificarRutDuplicado,
  verificarRutsDuplicados,
  crearEstudiantesBatch,
  obtenerTodosLosCursos,
} from '../services/database';
import { obtenerUsuariosDelEstablecimiento } from '../services/supabaseDB';
import type { Estudiante } from '../types';

interface Props {
  idEstablecimiento: string;
}

interface EstudianteValidacion {
  numero: string;
  rut: string;
  nombre: string;
  apellidos: string;
  curso: string;
  anno_ingreso: string;
  estado: string;
  valido: boolean;
  errores: string[];
}

interface EstudianteConId extends Estudiante {
  id: string;
}

export default function MantenedorEstudiantes({ idEstablecimiento }: Props) {
  const [estudiantes, setEstudiantes] = useState<EstudianteConId[]>([]);
  const cursos = useRef<Array<{ id: string; codigo: string; nombre: string; nivel: string }>>([]);
  const [apoderados, setApoderados] = useState<Array<{ id: string; uid: string; nombre_completo: string; email: string }>>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mostraModalAgregar, setMostraModalAgregar] = useState(false);
  const [mostraModalValidacion, setMostraModalValidacion] = useState(false);
  const [estudiantesValidados, setEstudiantesValidados] = useState<EstudianteValidacion[]>([]);
  const [progreso, setProgreso] = useState(0);
  const [subiendo, setSubiendo] = useState(false);

  // Filtros
  const [filtroCurso, setFiltroCurso] = useState<string>('TODOS');
  const [filtroAnio, setFiltroAnio] = useState<string>('TODOS');

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const estudiantesPorPagina = 20;

  // Modal editar
  const [estudianteEditando, setEstudianteEditando] = useState<EstudianteConId | null>(null);

  // Formulario
  const [formData, setFormData] = useState({
    numero: '',
    rut: '',
    nombre: '',
    apellidos: '',
    curso: '1A',
    anno_ingreso: new Date().getFullYear().toString(),
    id_apoderado: '',
    activo: true,
  });

  const cargarEstudiantes = useCallback(async () => {
    try {
      setCargando(true);
      const data = await obtenerEstudiantesDelEstablecimiento(idEstablecimiento) as any;
      setEstudiantes(data || []);
    } catch (err) {
      setError('Error al cargar estudiantes');
      console.error(err);
    } finally {
      setCargando(false);
    }
  }, [idEstablecimiento]);

  // Cargar cursos disponibles
  const cargarCursos = useCallback(async () => {
    try {
      const data = await obtenerTodosLosCursos(idEstablecimiento);
      cursos.current = data;
    } catch (err) {
      console.error('Error al cargar cursos:', err);
    }
  }, [idEstablecimiento]);

  const cargarApoderados = useCallback(async () => {
    try {
      const usuarios = await obtenerUsuariosDelEstablecimiento(idEstablecimiento);
      const apoderadosList = usuarios.reduce((acc: Array<{ id: string; uid: string; nombre_completo: string; email: string }>, u) => {
        if (u.rol === 'APODERADO' && u.activo) {
          acc.push({ id: u.id, uid: u.uid || '', nombre_completo: u.nombre, email: u.email });
        }
        return acc;
      }, []);
      setApoderados(apoderadosList);
    } catch (err) {
      console.error('Error al cargar apoderados:', err);
    }
  }, [idEstablecimiento]);

  useEffect(() => {
    cargarEstudiantes();
    cargarCursos();
    cargarApoderados();
  }, [cargarEstudiantes, cargarCursos, cargarApoderados]);

  // Validar RUT simple
  const validarRut = (rut: string): boolean => {
    const rutLimpio = rut.replace(/[.-]/g, '').trim();
    if (!rutLimpio || rutLimpio.length < 7) return false;
    const cuerpo = rutLimpio.slice(0, -1);
    const digito = rutLimpio.slice(-1);
    if (!/^\d+$/.test(cuerpo)) return false;
    return /^[\dkK]$/.test(digito);
  };

  // Validar RUT duplicado en Supabase
  const validarRutDuplicadoFn = async (rut: string, excluirId?: string): Promise<boolean> => {
    try {
      return await verificarRutDuplicado(idEstablecimiento, rut, excluirId);
    } catch (err) {
      console.error('Error al validar RUT duplicado:', err);
      return false;
    }
  };

  const validarRutsDuplicadosEnLote = async (ruts: string[]): Promise<string[]> => {
    try {
      return await verificarRutsDuplicados(idEstablecimiento, ruts);
    } catch (err) {
      console.error('Error al validar RUTs duplicados en lote:', err);
      return [];
    }
  };

  // Validar datos de estudiante
  // Función para normalizar texto (solo trim, sin cambiar caracteres)
  const normalizarTexto = (texto: string): string => {
    if (!texto) return '';
    return texto.trim();
  };

  const validarEstudiante = (est: any): EstudianteValidacion => {
    const errores: string[] = [];

    // Validar número
    const numero = est.numero?.toString().trim() || '';
    if (!numero) {
      errores.push('Número requerido');
    }

    // Validar RUT
    const rut = est.rut?.toString().trim() || '';
    if (!rut) {
      errores.push('RUT requerido');
    } else if (!validarRut(rut)) {
      errores.push('RUT inválido');
    }

    // Validar nombres (puede venir como 'nombre' o 'nombres')
    const nombresRaw = (est.nombres || est.nombre)?.toString().trim() || '';
    const nombres = normalizarTexto(nombresRaw);
    if (!nombres) {
      errores.push('Nombres requerido');
    }

    // Validar apellidos
    const apellidosRaw = est.apellidos?.toString().trim() || '';
    const apellidos = normalizarTexto(apellidosRaw);
    if (!apellidos) {
      errores.push('Apellidos requeridos');
    }

    // Validar curso contra la colección de cursos
    const cursoRaw = est.curso?.toString().trim().toUpperCase() || '';
    const cursoExiste = cursos.current.some((c) => c.nombre === cursoRaw);
    if (!cursoRaw) {
      errores.push('Curso requerido');
    } else if (!cursoExiste) {
      errores.push(`Curso "${cursoRaw}" no existe en el sistema (disponibles: ${cursos.current.map(c => c.nombre).join(', ')})`);
    }

    // Validar año de ingreso
    const anno = parseInt(est.anno_ingreso?.toString() || '0');
    const annoActual = new Date().getFullYear();
    if (!est.anno_ingreso || isNaN(anno) || anno < 2000 || anno > annoActual) {
      errores.push('Año de ingreso inválido');
    }

    // Validar estado
    const estadosValidos = ['activo', 'inactivo'];
    const estadoLower = (est.estado?.toString() || '').toLowerCase().trim();
    if (!estadoLower || !estadosValidos.includes(estadoLower)) {
      errores.push('Estado inválido (activo o inactivo)');
    }

    return {
      numero: numero,
      rut: rut,
      nombre: nombres,
      apellidos: apellidos,
      curso: cursoRaw,
      anno_ingreso: est.anno_ingreso?.toString() || '',
      estado: estadoLower,
      valido: errores.length === 0,
      errores,
    };
  };

  const descargarTemplate = () => {
    const headers = ['numero', 'rut', 'nombres', 'apellidos', 'curso', 'anno_ingreso', 'estado'];
    const filaEjemplo = ['1', '191234567', 'Juan', 'Perez', '1A', new Date().getFullYear().toString(), 'activo'];
    
    const csv = [
      headers.join(','),
      filaEjemplo.join(','),
    ].join('\n');

    // Agregar BOM para UTF-8 (para que Excel lea correctamente)
    const csvWithBOM = '\uFEFF' + csv;
    const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `plantilla-estudiantes-${new Date().getTime()}.csv`;
    link.click();
  };

  const procesarCSV = (file: File): Promise<EstudianteValidacion[]> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (event: ProgressEvent<FileReader>) => {
        try {
          const text = event.target?.result;
          
          if (typeof text !== 'string' || text.length === 0) {
            throw new Error('El archivo está vacío');
          }
          
          let processedText = text;
          
          // Remover BOM si existe (UTF-8 BOM: EF BB BF)
          if (processedText.charCodeAt(0) === 0xFEFF) {
            processedText = processedText.slice(1);
          }
          
          const lines = processedText.trim().split('\n');
          
          if (lines.length < 2) {
            throw new Error('El archivo debe tener al menos un encabezado y una fila de datos');
          }
          
          const encabezados = lines[0].split(',').map((h) => h.trim().toLowerCase());

          // Validar que los encabezados sean correctos
          const encabezadosRequeridos = ['numero', 'rut', 'nombres', 'apellidos', 'curso', 'anno_ingreso', 'estado'];
          const encabezadosFaltantes = encabezadosRequeridos.filter(e => !encabezados.includes(e));
          
          if (encabezadosFaltantes.length > 0) {
            throw new Error(`Encabezados faltantes en el CSV: ${encabezadosFaltantes.join(', ')}`);
          }

          const validados: EstudianteValidacion[] = [];
          const rutsValidar: string[] = [];

          // PASO 1: Validar estructura y recopilar RUTs
          for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            
            const valores: string[] = [];
            let currentValue = '';
            let insideQuotes = false;
            
            for (let j = 0; j < lines[i].length; j++) {
              const char = lines[i][j];
              
              if (char === '"') {
                insideQuotes = !insideQuotes;
              } else if (char === ',' && !insideQuotes) {
                valores.push(currentValue.trim().replace(/^"|"$/g, ''));
                currentValue = '';
              } else {
                currentValue += char;
              }
            }
            valores.push(currentValue.trim().replace(/^"|"$/g, ''));

            const estudiante: Record<string, string> = {};
            encabezados.forEach((header, index) => {
              estudiante[header] = (valores[index] || '').trim();
            });

            const validado = validarEstudiante(estudiante);
            
            if (validado.valido && validado.rut) {
              rutsValidar.push(validado.rut);
            }
            
            validados.push(validado);
            setProgreso(Math.round((i / (lines.length - 1)) * 40));
          }

          // PASO 2: Validar RUTs en lote
          if (rutsValidar.length > 0) {
            validarRutsDuplicadosEnLote(rutsValidar).then((rutsDuplicados) => {
              validados.forEach((validado) => {
                if (validado.valido && validado.rut && rutsDuplicados.includes(validado.rut)) {
                  validado.valido = false;
                  validado.errores.push('RUT ya existe en el sistema');
                }
              });
              setProgreso(50);
              resolve(validados);
            }).catch((err) => {
              console.error('Error al validar RUTs:', err);
              setProgreso(50);
              resolve(validados);
            });
          } else {
            setProgreso(50);
            resolve(validados);
          }
        } catch (err) {
          console.error('Error al procesar CSV:', err);
          setError(`Error en CSV: ${err instanceof Error ? err.message : 'Error desconocido'}`);
          resolve([]);
        }
      };
      
      reader.onerror = () => {
        console.error('Error al leer archivo:', reader.error);
        setError('No se pudo leer el archivo. Asegúrate de que el archivo esté guardado en UTF-8.');
        resolve([]);
      };
      
      reader.onabort = () => {
        console.error('Lectura del archivo cancelada');
        setError('La lectura del archivo fue cancelada');
        resolve([]);
      };
      
      // Leer archivo como UTF-8
      try {
        reader.readAsText(file, 'UTF-8');
      } catch (err) {
        console.error('Error al iniciar lectura:', err);
        setError('No se pudo leer el archivo. Verifica que sea un archivo CSV válido guardado en UTF-8.');
        resolve([]);
      }
    });
  };

  const importarCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProgreso(0);
    setMostraModalValidacion(true);

    // Primera revisión (con validación de duplicados)
    const validados = await procesarCSV(file);
    setProgreso(75);

    // Segunda revisión (validación doble)
    await new Promise(resolve => setTimeout(resolve, 800));
    const validados2 = await Promise.all(validados.map(async (v) => {
      const validado = validarEstudiante({
        numero: v.numero,
        rut: v.rut,
        nombre: v.nombre,
        apellidos: v.apellidos,
        curso: v.curso,
        anno_ingreso: v.anno_ingreso,
        estado: v.estado,
      });
      
      // Segunda verificación de duplicados
      if (validado.valido && validado.rut) {
        const rutDuplicado = await validarRutDuplicadoFn(validado.rut);
        if (rutDuplicado) {
          validado.valido = false;
          validado.errores.push('RUT ya existe en el sistema');
        }
      }
      
      return validado;
    }));

    setEstudiantesValidados(validados2);
    setProgreso(100);
  };

  const subirEstudiantes = async () => {
    try {
      setSubiendo(true);

      const validos = estudiantesValidados.filter(e => e.valido);
      const estudiantesSubir = validos.map(est => ({
        id_establecimiento: idEstablecimiento,
        rut: est.rut,
        nombre_completo: `${normalizarTexto(est.nombre)} ${normalizarTexto(est.apellidos)}`,
        curso: est.curso,
        anno_ingreso: parseInt(est.anno_ingreso),
        activo: est.estado === 'activo',
      }));

      await crearEstudiantesBatch(estudiantesSubir);

      setProgreso(100);
      await cargarEstudiantes();
      setMostraModalValidacion(false);
      setEstudiantesValidados([]);
      setProgreso(0);
      setError(null);
    } catch (err) {
      setError('Error al subir estudiantes');
      console.error(err);
    } finally {
      setSubiendo(false);
    }
  };

  const agregarEstudiante = async () => {
    if (!formData.rut || !formData.nombre || !formData.apellidos) {
      alert('Completa todos los campos requeridos');
      return;
    }

    // Validar RUT
    if (!validarRut(formData.rut)) {
      setError('RUT inválido. Revisa el formato (ej: 19.123.456-7)');
      return;
    }

    try {
      // Verificar si el RUT ya existe
      const rutDuplicado = await validarRutDuplicadoFn(formData.rut);
      if (rutDuplicado) {
        setError('Este RUT ya está registrado en el sistema');
        return;
      }

      await crearEstudianteDB({
        id_establecimiento: idEstablecimiento,
        rut: formData.rut,
        nombre_completo: `${normalizarTexto(formData.nombre)} ${normalizarTexto(formData.apellidos)}`,
        curso: formData.curso,
        anno_ingreso: parseInt(formData.anno_ingreso),
        id_apoderado: formData.id_apoderado || null,
        activo: true,
      });

      setFormData({
        numero: '',
        rut: '',
        nombre: '',
        apellidos: '',
        curso: '1A',
        anno_ingreso: new Date().getFullYear().toString(),
        id_apoderado: '',
        activo: true,
      });
      setMostraModalAgregar(false);
      setError(null);
      cargarEstudiantes();
    } catch (err) {
      setError('Error al agregar estudiante');
      console.error(err);
    }
  };

  const abrirEditar = (estudiante: EstudianteConId) => {
    const [nombre, ...apellidosParts] = estudiante.nombre_completo.split(' ');
    const apellidos = apellidosParts.join(' ');
    
    setEstudianteEditando(estudiante);
    setFormData({
      numero: '',
      rut: estudiante.rut || '',
      nombre: nombre || '',
      apellidos: apellidos || '',
      curso: estudiante.curso || '1A',
      anno_ingreso: estudiante.anno_ingreso?.toString() || new Date().getFullYear().toString(),
      id_apoderado: estudiante.id_apoderado || '',
      activo: estudiante.activo || true,
    });
    setMostraModalAgregar(true);
  };

  const actualizarEstudiante = async () => {
    if (!formData.rut || !formData.nombre || !formData.apellidos) {
      alert('Completa todos los campos requeridos');
      return;
    }

    // Validar RUT
    if (!validarRut(formData.rut)) {
      setError('RUT inválido. Revisa el formato (ej: 19.123.456-7)');
      return;
    }

    if (!estudianteEditando?.id) {
      setError('Error: ID de estudiante no encontrado');
      return;
    }

    try {
      // Verificar si el RUT ya existe (excepto el actual)
      const rutYaExiste = await validarRutDuplicadoFn(formData.rut, estudianteEditando.id);
      
      if (rutYaExiste) {
        setError('Este RUT ya está registrado en el sistema');
        return;
      }

      await actualizarEstudianteDB(estudianteEditando.id, {
        rut: formData.rut,
        nombre_completo: `${normalizarTexto(formData.nombre)} ${normalizarTexto(formData.apellidos)}`,
        curso: formData.curso,
        anno_ingreso: parseInt(formData.anno_ingreso),
        id_apoderado: formData.id_apoderado || null,
        activo: formData.activo,
      });

      setFormData({
        numero: '',
        rut: '',
        nombre: '',
        apellidos: '',
        curso: '1A',
        anno_ingreso: new Date().getFullYear().toString(),
        id_apoderado: '',
        activo: true,
      });
      setEstudianteEditando(null);
      setMostraModalAgregar(false);
      setError(null);
      cargarEstudiantes();
    } catch (err) {
      setError('Error al actualizar estudiante');
      console.error(err);
    }
  };

  const eliminarEstudiante = async (id: string) => {
    if (!confirm('¿Eliminar este estudiante?')) return;
    try {
      await eliminarEstudianteDB(id);
      cargarEstudiantes();
    } catch (err) {
      setError('Error al eliminar estudiante');
      console.error(err);
    }
  };

  const descargarDatos = () => {
    const estudiantesFiltrados = estudiantes.filter(est => {
      const cumpleCurso = filtroCurso === 'TODOS' || est.curso === filtroCurso;
      const cumpleAnio = filtroAnio === 'TODOS' || (est.anno_ingreso && est.anno_ingreso.toString() === filtroAnio);
      return cumpleCurso && cumpleAnio;
    });

    if (estudiantesFiltrados.length === 0) {
      alert('No hay estudiantes para descargar con los filtros seleccionados');
      return;
    }

    // Crear CSV
    const headers = ['N°', 'RUT', 'Nombres', 'Curso', 'Año Ingreso', 'Estado'];
    const rows = estudiantesFiltrados.map((est, idx) => [
      (idx + 1).toString(),
      est.rut || '',
      est.nombre_completo,
      est.curso,
      est.anno_ingreso ? est.anno_ingreso.toString() : 'N/A',
      est.activo ? 'Activo' : 'Inactivo',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    
    const nombreArchivo = filtroAnio === 'TODOS' 
      ? 'estudiantes_todos_anos.csv'
      : `estudiantes_${filtroAnio}.csv`;
    
    link.setAttribute('download', nombreArchivo);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (cargando) return <div style={styles.container}><p>⏳ Cargando…</p></div>;

  return (
    <div style={styles.container}>
      <div style={styles.encabezado}>
        <h1 style={styles.titulo}>👥 Mantenedor de Estudiantes</h1>
        <p style={styles.subtitulo}>Gestiona el listado de estudiantes del establecimiento</p>
      </div>

      {error && (
        <div style={styles.errorBanner}>
          <p>{error}</p>
          <button type="button" onClick={() => setError(null)} style={styles.botonCerrar}>✕</button>
        </div>
      )}

      <div style={styles.botones}>
        <button type="button" onClick={() => setMostraModalAgregar(true)} style={styles.botonPrimario}>
          ➕ Agregar Estudiante
        </button>
        <button type="button" onClick={descargarTemplate} style={styles.botonSecundario}>
          📥 Descargar Plantilla
        </button>
        <label style={styles.botonSecundario}>
          📤 Importar CSV
          <input
            type="file"
            accept=".csv"
            onChange={importarCSV}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      {/* Filtros */}
      <div style={styles.filtrosContenedor}>
        <div style={styles.grupoFiltro}>
          <label style={styles.labelFiltro}>📚 Cursos:</label>
          <select
            value={filtroCurso}
            onChange={(e) => {
              setFiltroCurso(e.target.value);
              setPaginaActual(1); // Resetear a página 1
            }}
            style={styles.selectFiltro}
          >
            <option value="TODOS">Todos los cursos</option>
            <option value="1A">1A</option>
            <option value="1B">1B</option>
            <option value="2A">2A</option>
            <option value="2B">2B</option>
            <option value="3A">3A</option>
            <option value="3B">3B</option>
            <option value="4A">4A</option>
            <option value="4B">4B</option>
          </select>
        </div>

        <div style={styles.grupoFiltro}>
          <label style={styles.labelFiltro}>📅 Año de Ingreso:</label>
          <select
            value={filtroAnio}
            onChange={(e) => {
              setFiltroAnio(e.target.value);
              setPaginaActual(1); // Resetear a página 1
            }}
            style={styles.selectFiltro}
          >
            <option value="TODOS">Todos los años</option>
            {Array.from(
              new Set(
                estudiantes
                  .map((e) => e.anno_ingreso)
                  .filter((anno) => anno !== undefined && anno !== null)
              )
            )
              .sort((a, b) => Number(b) - Number(a))
              .map((anio) => (
                <option key={anio} value={String(anio)}>
                  {anio}
                </option>
              ))}
          </select>
        </div>

        <div style={{...styles.grupoFiltro, display: 'flex', alignItems: 'flex-end'}}>
          <button type="button" onClick={descargarDatos} style={styles.botonSecundario}>
            📥 Descargar Datos
          </button>
        </div>
      </div>

      {estudiantes.length === 0 ? (
        <div style={styles.vacio}>📭 No hay estudiantes registrados</div>
      ) : (
        <div style={styles.tablaContenedor}>
          <table style={styles.tabla}>
            <thead>
              <tr style={styles.encabezadoFila}>
                <th style={styles.th}>N°</th>
                <th style={styles.th}>RUT</th>
                <th style={styles.th}>Nombres</th>
                <th style={styles.th}>Curso</th>
                <th style={styles.th}>Año Ingreso</th>
                <th style={styles.th}>Estado</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const estudiantesFiltrados = estudiantes
                  .filter(est => {
                    const cumpleCurso = filtroCurso === 'TODOS' || est.curso === filtroCurso;
                    const cumpleAnio = filtroAnio === 'TODOS' || (est.anno_ingreso && est.anno_ingreso.toString() === filtroAnio);
                    return cumpleCurso && cumpleAnio;
                  });

                const indiceInicio = (paginaActual - 1) * estudiantesPorPagina;
                const indiceFinal = indiceInicio + estudiantesPorPagina;
                const estudiantesPaginados = estudiantesFiltrados.slice(indiceInicio, indiceFinal);

                return estudiantesPaginados.map((est, idx) => (
                  <tr key={est.id} style={styles.fila}>
                    <td style={styles.td}>{((paginaActual - 1) * estudiantesPorPagina) + idx + 1}</td>
                    <td style={styles.td}>{est.rut || 'N/A'}</td>
                    <td style={styles.td}>{est.nombre_completo}</td>
                    <td style={styles.td}>{est.curso}</td>
                    <td style={styles.td}>{est.anno_ingreso?.toString() || 'N/A'}</td>
                    <td style={{...styles.td, fontWeight: 600, color: est.activo ? '#16A34A' : '#DC2626'}}>
                      {est.activo ? '✅ Activo' : '❌ Inactivo'}
                    </td>
                    <td style={{...styles.td, display: 'flex', gap: '8px'}}>
                      <button type="button" 
                        onClick={() => abrirEditar(est)}
                        style={styles.botonIconoEditar}
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button type="button" 
                        onClick={() => eliminarEstudiante(est.id!)}
                        style={styles.botonIconoEliminar}
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>

          {/* Paginador */}
          {(() => {
            const estudiantesFiltrados = estudiantes
              .filter(est => {
                const cumpleCurso = filtroCurso === 'TODOS' || est.curso === filtroCurso;
                const cumpleAnio = filtroAnio === 'TODOS' || (est.anno_ingreso && est.anno_ingreso.toString() === filtroAnio);
                return cumpleCurso && cumpleAnio;
              });
            const totalPaginas = Math.ceil(estudiantesFiltrados.length / estudiantesPorPagina);

            if (totalPaginas <= 1) return null;

            return (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
                marginTop: '20px',
                padding: '16px',
                backgroundColor: '#F9FAFB',
                borderRadius: '8px'
              }}>
                <button type="button" 
                  onClick={() => setPaginaActual(Math.max(1, paginaActual - 1))}
                  disabled={paginaActual === 1}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: paginaActual === 1 ? '#E5E7EB' : '#3B82F6',
                    color: paginaActual === 1 ? '#9CA3AF' : 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: paginaActual === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 500
                  }}
                >
                  ← Anterior
                </button>

                <div style={{
                  display: 'flex',
                  gap: '4px',
                  alignItems: 'center'
                }}>
                  {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(pagina => (
                    <button type="button" 
                      key={pagina}
                      onClick={() => setPaginaActual(pagina)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: paginaActual === pagina ? '#3B82F6' : '#E5E7EB',
                        color: paginaActual === pagina ? 'white' : '#374151',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: paginaActual === pagina ? 600 : 500,
                        minWidth: '36px'
                      }}
                    >
                      {pagina}
                    </button>
                  ))}
                </div>

                <button type="button" 
                  onClick={() => setPaginaActual(Math.min(totalPaginas, paginaActual + 1))}
                  disabled={paginaActual === totalPaginas}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: paginaActual === totalPaginas ? '#E5E7EB' : '#3B82F6',
                    color: paginaActual === totalPaginas ? '#9CA3AF' : 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: paginaActual === totalPaginas ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 500
                  }}
                >
                  Siguiente →
                </button>

                <span style={{
                  marginLeft: '16px',
                  fontSize: '14px',
                  color: '#6B7280',
                  fontWeight: 500
                }}>
                  Página {paginaActual} de {totalPaginas}
                </span>
              </div>
            );
          })()}

          {estudiantes.filter(est => {
            const cumpleCurso = filtroCurso === 'TODOS' || est.curso === filtroCurso;
            const cumpleAnio = filtroAnio === 'TODOS' || est.anno_ingreso.toString() === filtroAnio;
            return cumpleCurso && cumpleAnio;
          }).length === 0 && (
            <div style={styles.sinResultados}>
              No hay estudiantes que coincidan con los filtros seleccionados
            </div>
          )}
        </div>
      )}

      {/* Modal Agregar */}
      {mostraModalAgregar && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitulo}>
                {estudianteEditando ? '✏️ Editar Estudiante' : '➕ Agregar Estudiante'}
              </h2>
              <button type="button" 
                onClick={() => {
                  setMostraModalAgregar(false);
                  setEstudianteEditando(null);
                }} 
                style={styles.botonCerrarModal}
              >
                ✕
              </button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.formulario}>
                <div>
                  <label style={styles.label}>RUT *</label>
                  <input
                    type="text"
                    value={formData.rut}
                    onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                    placeholder="19.123.456-7"
                    style={styles.input}
                  />
                </div>
                <div>
                  <label style={styles.label}>Nombre *</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    style={styles.input}
                  />
                </div>
                <div>
                  <label style={styles.label}>Apellidos *</label>
                  <input
                    type="text"
                    value={formData.apellidos}
                    onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                    style={styles.input}
                  />
                </div>
                <div>
                  <label style={styles.label}>Curso</label>
                  <select
                    value={formData.curso}
                    onChange={(e) => setFormData({ ...formData, curso: e.target.value })}
                    style={styles.input}
                  >
                    <option value="1A">1A</option>
                    <option value="1B">1B</option>
                    <option value="2A">2A</option>
                    <option value="2B">2B</option>
                    <option value="3A">3A</option>
                    <option value="3B">3B</option>
                    <option value="4A">4A</option>
                    <option value="4B">4B</option>
                  </select>
                </div>
                <div>
                  <label style={styles.label}>Año de Ingreso</label>
                  <input
                    type="number"
                    value={formData.anno_ingreso}
                    onChange={(e) => setFormData({ ...formData, anno_ingreso: e.target.value })}
                    style={styles.input}
                  />
                </div>
                <div>
                  <label style={styles.label}>Apoderado</label>
                  <select
                    value={formData.id_apoderado}
                    onChange={(e) => setFormData({ ...formData, id_apoderado: e.target.value })}
                    style={styles.input}
                  >
                    <option value="">Sin apoderado</option>
                    {apoderados.map(ap => (
                      <option key={ap.id} value={ap.uid}>
                        {ap.nombre_completo} ({ap.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={styles.label}>
                    <input
                      type="checkbox"
                      checked={formData.activo}
                      onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                      style={{ marginRight: '8px' }}
                    />
                    ✅ Estudiante Activo
                  </label>
                </div>
              </div>
              <div style={styles.botonesModal}>
                <button type="button" 
                  onClick={() => {
                    setMostraModalAgregar(false);
                    setEstudianteEditando(null);
                    setFormData({
                      numero: '',
                      rut: '',
                      nombre: '',
                      apellidos: '',
                      curso: '1A',
                      anno_ingreso: new Date().getFullYear().toString(),
                      id_apoderado: '',
                      activo: true,
                    });
                  }} 
                  style={styles.botonModalSecundario}
                >
                  Cancelar
                </button>
                <button type="button" 
                  onClick={estudianteEditando ? actualizarEstudiante : agregarEstudiante} 
                  style={styles.botonModalPrimario}
                >
                  {estudianteEditando ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Validación */}
      {mostraModalValidacion && (
        <div style={styles.modal}>
          <div style={{...styles.modalContent, maxHeight: '90vh', overflowY: 'auto'}}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitulo}>📊 Validación de Estudiantes</h2>
              <button type="button" onClick={() => setMostraModalValidacion(false)} style={styles.botonCerrarModal}>✕</button>
            </div>

            {/* Progress Bar */}
            <div style={styles.progressContainer}>
              <div style={styles.progressBar}>
                <div style={{...styles.progressFill, width: `${progreso}%`}}></div>
              </div>
              <p style={styles.progressText}>{progreso}% completado</p>
            </div>

            {/* Resultados */}
            <div style={styles.modalBody}>
              {estudiantesValidados.length === 0 ? (
                <p style={{textAlign: 'center', color: '#6B7280'}}>⏳ Validando datos...</p>
              ) : (
                <div>
                  <div style={styles.resumenValidacion}>
                    <span style={{color: '#16A34A', fontWeight: 600}}>
                      ✓ Válidos: {estudiantesValidados.filter(e => e.valido).length}
                    </span>
                    <span style={{color: '#DC2626', fontWeight: 600}}>
                      ✗ Inválidos: {estudiantesValidados.filter(e => !e.valido).length}
                    </span>
                  </div>

                  <div style={styles.listaValidacion}>
                    {estudiantesValidados.map((est, idx) => (
                      <div key={idx} style={{
                        ...styles.itemValidacion,
                        borderLeftColor: est.valido ? '#16A34A' : '#DC2626',
                        backgroundColor: est.valido ? '#F0FDF4' : '#FEF2F2',
                      }}>
                        <div style={styles.itemEncabezado}>
                          <span style={{fontSize: '20px'}}>
                            {est.valido ? '✅' : '❌'}
                          </span>
                          <span style={styles.itemNombre}>
                            {est.nombre} {est.apellidos} ({est.rut})
                          </span>
                        </div>
                        {est.errores.length > 0 && (
                          <ul style={styles.listaErrores}>
                            {est.errores.map((error, i) => (
                              <li key={`${error}-${i}`} style={{color: '#DC2626', fontSize: '12px'}}>
                                {error}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Botones */}
            <div style={styles.botonesModal}>
              <button type="button" 
                onClick={() => setMostraModalValidacion(false)}
                style={styles.botonModalSecundario}
              >
                Cancelar
              </button>
              <button type="button" 
                onClick={subirEstudiantes}
                disabled={subiendo || estudiantesValidados.filter(e => e.valido).length === 0}
                style={{
                  ...styles.botonModalPrimario,
                  opacity: subiendo || estudiantesValidados.filter(e => e.valido).length === 0 ? 0.5 : 1,
                  cursor: subiendo || estudiantesValidados.filter(e => e.valido).length === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                {subiendo ? '⏳ Subiendo...' : `✓ Subir ${estudiantesValidados.filter(e => e.valido).length} Estudiantes`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
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
    flexWrap: 'wrap',
  },
  botonPrimario: {
    padding: '10px 16px',
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'background-color 0.2s',
  },
  botonSecundario: {
    padding: '10px 16px',
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'background-color 0.2s',
  },
  errorBanner: {
    padding: '12px 16px',
    backgroundColor: '#FEE2E2',
    color: '#DC2626',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  botonCerrar: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#DC2626',
    cursor: 'pointer',
    fontSize: '18px',
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
  botonIconoEditar: {
    padding: '6px 10px',
    backgroundColor: '#F59E0B',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'background-color 0.2s',
  },
  modal: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    maxWidth: '600px',
    width: '90%',
  },
  modalHeader: {
    padding: '20px',
    borderBottom: '1px solid #E5E7EB',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitulo: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '700',
    color: '#1F2937',
  },
  botonCerrarModal: {
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#6B7280',
  },
  modalBody: {
    padding: '20px',
  },
  formulario: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#374151',
    backgroundColor: '#FFFFFF',
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const,
  },
  botonesModal: {
    padding: '20px',
    borderTop: '1px solid #E5E7EB',
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },
  botonModalPrimario: {
    padding: '10px 16px',
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'background-color 0.2s',
  },
  botonModalSecundario: {
    padding: '10px 16px',
    backgroundColor: '#E5E7EB',
    color: '#374151',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'background-color 0.2s',
  },
  progressContainer: {
    padding: '20px',
    backgroundColor: '#F9FAFB',
    borderBottom: '1px solid #E5E7EB',
  },
  progressBar: {
    width: '100%',
    height: '8px',
    backgroundColor: '#E5E7EB',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '8px',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    transition: 'width 0.3s ease',
  },
  progressText: {
    textAlign: 'center' as const,
    fontSize: '12px',
    color: '#6B7280',
    margin: 0,
  },
  resumenValidacion: {
    display: 'flex',
    gap: '24px',
    padding: '12px',
    backgroundColor: '#F9FAFB',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px',
  },
  listaValidacion: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    maxHeight: '400px',
    overflowY: 'auto' as const,
  },
  itemValidacion: {
    borderLeft: '4px solid',
    padding: '12px',
    borderRadius: '8px',
    backgroundColor: '#F9FAFB',
  },
  itemEncabezado: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    marginBottom: '8px',
  },
  itemNombre: {
    fontWeight: '600',
    color: '#1F2937',
  },
  listaErrores: {
    margin: '8px 0 0 0',
    paddingLeft: '20px',
  },
  filtrosContenedor: {
    display: 'flex',
    gap: '24px',
    marginBottom: '24px',
    padding: '16px',
    backgroundColor: '#F9FAFB',
    borderRadius: '8px',
    border: '1px solid #E5E7EB',
  },
  grupoFiltro: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    minWidth: '200px',
  },
  labelFiltro: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
  },
  selectFiltro: {
    padding: '10px 12px',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#374151',
    backgroundColor: '#FFFFFF',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  sinResultados: {
    padding: '24px',
    textAlign: 'center' as const,
    color: '#6B7280',
    fontSize: '14px',
    backgroundColor: '#FAFAFA',
  },
};
