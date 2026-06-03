import { useState, useEffect } from 'react';
import {
  obtenerFuncionarios,
  crearFuncionario,
  actualizarFuncionario,
  cambiarEstadoFuncionario,
  obtenerUsuariosSinFuncionario,
} from '../services/funcionarios';
import type { Funcionario } from '../types';
import type { UsuarioSinFuncionario } from '../services/funcionarios';
import { validarRUT, formatearRUT, formatoSimple, limpiarRUT } from '../utils/rutUtils';

export default function MantenedorFuncionarios() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editando, setEditando] = useState<Funcionario | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [errorRUT, setErrorRUT] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [soloVigentes, setSoloVigentes] = useState(true);
  const [usuariosSinFunc, setUsuariosSinFunc] = useState<UsuarioSinFuncionario[]>([]);
  const [importando, setImportando] = useState<string | null>(null);
  const [mostrarPreview, setMostrarPreview] = useState(false);
  const [funcionarioPreview, setFuncionarioPreview] = useState<Funcionario | null>(null);
  const [mostrarListaCompleta, setMostrarListaCompleta] = useState(false);
  const [pagina, setPagina] = useState(1);
  const itemsPorPagina = 15;
  const [filtroTipoFunc, setFiltroTipoFunc] = useState('');
  const [filtroContrato, setFiltroContrato] = useState('');
  const [filtroLicencia, setFiltroLicencia] = useState('');

  const [form, setForm] = useState({
    rut: '',
    nombre_completo: '',
    fecha_nacimiento: '',
    domicilio: '',
    comuna: '',
    celular: '',
    correo_personal: '',
    correo_institucional: '',
    tipo_funcionario: 'docente',
    tipo_contrato: 'plazo_fijo',
    titulo_profesional: '',
    universidad: '',
    ano_titulacion: new Date().getFullYear(),
    asignatura: '',
    horas_contrato: 0,
    fecha_ingreso: new Date().toISOString().split('T')[0],
    fecha_termino: null as string | null,
    emergencia_nombre: '',
    emergencia_telefono: '',
    emergencia_parentesco: '',
  });

  // Cargar funcionarios al montar
  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setCargando(true);
    try {
      const datos = await obtenerFuncionarios();
      setFuncionarios(datos);
      setError('');
    } catch (err) {
      setError('Error al cargar funcionarios');
      console.error(err);
    }
    try {
      const sinFunc = await obtenerUsuariosSinFuncionario();
      setUsuariosSinFunc(sinFunc);
    } catch (err) {
      console.error('Error al obtener usuarios sin funcionario:', err);
    } finally {
      setCargando(false);
    }
  }

  function limpiarFormulario() {
    setForm({
      rut: '',
      nombre_completo: '',
      fecha_nacimiento: '',
      domicilio: '',
      comuna: '',
      celular: '',
      correo_personal: '',
      correo_institucional: '',
      tipo_funcionario: 'docente',
      tipo_contrato: 'plazo_fijo',
      titulo_profesional: '',
      universidad: '',
      ano_titulacion: new Date().getFullYear(),
      asignatura: '',
      horas_contrato: 0,
      fecha_ingreso: new Date().toISOString().split('T')[0],
      fecha_termino: null,
      emergencia_nombre: '',
      emergencia_telefono: '',
      emergencia_parentesco: '',
    });
    setEditando(null);
    setMostrarFormulario(false);
    setErrorRUT('');
  }

  async function handleImportarUsuario(u: UsuarioSinFuncionario) {
    setImportando(u.id_usuario);
    try {
      await crearFuncionario({
        rut: u.id_usuario.slice(0, 12),
        rut_formateado: u.id_usuario.slice(0, 12),
        id_usuario: u.id_usuario,
        nombre_completo: u.nombre_completo,
        fecha_nacimiento: null,
        domicilio: null,
        comuna: null,
        celular: null,
        correo_personal: u.email,
        correo_institucional: null,
        tipo_funcionario: u.rol.toLowerCase(),
        tipo_contrato: 'plazo_fijo',
        titulo_profesional: null,
        universidad: null,
        ano_titulacion: null,
        asignatura: null,
        horas_contrato: 0,
        fecha_ingreso: null,
        fecha_termino: null,
        emergencia_nombre: null,
        emergencia_telefono: null,
        emergencia_parentesco: null,
        vigente: true,
        tiene_licencia: false,
        tiene_permiso_admin: false,
        usuario_registrado_sistema: true,
      });
      await cargarDatos();
    } catch (err) {
      setError('Error al importar usuario');
      console.error(err);
    } finally {
      setImportando(null);
    }
  }

  function imprimirListado() {
    const vigentes = funcionarios.filter(f => f.vigente);
    const filas = vigentes.map(f => `
      <tr>
        <td>${f.rut_formateado}</td>
        <td>${f.nombre_completo}</td>
        <td>${f.tipo_funcionario}</td>
        <td>${f.tipo_contrato}</td>
        <td>${f.celular || ''}</td>
        <td>${f.correo_institucional || f.correo_personal || ''}</td>
        <td>${f.vigente ? 'Sí' : 'No'}</td>
      </tr>
    `).join('');

    const ventana = window.open('', '_blank');
    if (!ventana) return;
    ventana.document.write(`
      <html>
      <head>
        <title>Listado de Funcionarios</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #1a3c6b; font-size: 18px; margin-bottom: 5px; }
          p { color: #666; font-size: 12px; margin-bottom: 15px; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th { background: #1a3c6b; color: white; padding: 8px; text-align: left; }
          td { padding: 6px 8px; border-bottom: 1px solid #ddd; }
          tr:nth-child(even) { background: #f9f9f9; }
          .total { margin-top: 10px; font-size: 12px; color: #555; }
        </style>
      </head>
      <body>
        <h1>📋 Listado de Funcionarios Activos</h1>
        <p>Generado el ${new Date().toLocaleDateString('es-CL')}</p>
        <table>
          <thead>
            <tr>
              <th>RUT</th>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Contrato</th>
              <th>Teléfono</th>
              <th>Correo</th>
              <th>Vigente</th>
            </tr>
          </thead>
          <tbody>${filas}</tbody>
        </table>
        <p class="total">Total: ${vigentes.length} funcionarios activos</p>
        <script>
          window.onload = function() { window.print(); window.close(); }
        <\/script>
      </body>
      </html>
    `);
    ventana.document.close();
  }

  function validarFormulario(): boolean {
    // Campos obligatorios
    if (!form.rut.trim()) {
      setError('⚠️ RUT es obligatorio');
      return false;
    }
    if (!form.nombre_completo.trim()) {
      setError('⚠️ Nombre es obligatorio');
      return false;
    }
    if (!form.domicilio.trim()) {
      setError('⚠️ Domicilio es obligatorio');
      return false;
    }
    if (!form.comuna.trim()) {
      setError('⚠️ Comuna es obligatoria');
      return false;
    }
    if (!form.celular.trim()) {
      setError('⚠️ Celular es obligatorio');
      return false;
    }
    if (!form.correo_personal.trim()) {
      setError('⚠️ Correo personal es obligatorio');
      return false;
    }

    // Validar formato de correo personal
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.correo_personal)) {
      setError('⚠️ Correo personal debe ser un email válido');
      return false;
    }

    // Validar RUT
    if (!validarRUT(form.rut)) {
      setErrorRUT('RUT inválido');
      return false;
    }

    setErrorRUT('');
    setError('');
    return true;
  }

  async function handleGuardar() {
    if (!validarFormulario()) {
      return;
    }

    setCargando(true);
    setError('');

    try {
      const rawRut = limpiarRUT(form.rut);
      const correo_inst = form.correo_institucional || `${form.nombre_completo.toLowerCase().replace(/\s+/g, '.')}@andaliensur.cl`;

      if (editando) {
        await actualizarFuncionario(editando.rut, {
          rut: formatoSimple(rawRut),
          rut_formateado: formatearRUT(rawRut),
          nombre_completo: form.nombre_completo,
          fecha_nacimiento: form.fecha_nacimiento || null,
          domicilio: form.domicilio,
          comuna: form.comuna,
          celular: form.celular,
          correo_personal: form.correo_personal,
          correo_institucional: correo_inst,
          tipo_funcionario: form.tipo_funcionario,
          tipo_contrato: form.tipo_contrato,
          titulo_profesional: form.titulo_profesional || null,
          universidad: form.universidad || null,
          ano_titulacion: form.ano_titulacion || null,
          asignatura: form.asignatura || null,
          horas_contrato: form.horas_contrato,
          fecha_ingreso: form.fecha_ingreso || null,
          fecha_termino: form.fecha_termino,
          emergencia_nombre: form.emergencia_nombre || null,
          emergencia_telefono: form.emergencia_telefono || null,
          emergencia_parentesco: form.emergencia_parentesco || null,
          id_usuario: editando.id_usuario,
          vigente: editando.vigente,
          tiene_licencia: editando.tiene_licencia,
          tiene_permiso_admin: editando.tiene_permiso_admin,
          usuario_registrado_sistema: editando.usuario_registrado_sistema,
        });
      } else {
        await crearFuncionario({
          rut: formatoSimple(rawRut),
          rut_formateado: formatearRUT(rawRut),
          nombre_completo: form.nombre_completo,
          fecha_nacimiento: form.fecha_nacimiento || null,
          domicilio: form.domicilio,
          comuna: form.comuna,
          celular: form.celular,
          correo_personal: form.correo_personal,
          correo_institucional: correo_inst,
          tipo_funcionario: form.tipo_funcionario,
          tipo_contrato: form.tipo_contrato,
          titulo_profesional: form.titulo_profesional || null,
          universidad: form.universidad || null,
          ano_titulacion: form.ano_titulacion || null,
          asignatura: form.asignatura || null,
          horas_contrato: form.horas_contrato,
          fecha_ingreso: form.fecha_ingreso || null,
          fecha_termino: form.fecha_termino,
          emergencia_nombre: form.emergencia_nombre || null,
          emergencia_telefono: form.emergencia_telefono || null,
          emergencia_parentesco: form.emergencia_parentesco || null,
          id_usuario: null,
          vigente: true,
          tiene_licencia: false,
          tiene_permiso_admin: false,
          usuario_registrado_sistema: false,
        });
      }

      await cargarDatos();
      limpiarFormulario();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error al guardar');
      }
    } finally {
      setCargando(false);
    }
  }

  async function handleCambiarEstado(funcionario: Funcionario, nuevoEstado: boolean) {
    const accion = nuevoEstado ? 'vigente' : 'no vigente';
    if (!window.confirm(`¿Cambiar estado de ${funcionario.nombre_completo} a ${accion}?`)) {
      return;
    }

    setCargando(true);
    try {
      await cambiarEstadoFuncionario(funcionario.rut, nuevoEstado);
      await cargarDatos();
      setError('');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error al cambiar estado');
      }
    } finally {
      setCargando(false);
    }
  }

  function handleEditar(funcionario: Funcionario) {
    setEditando(funcionario);
    setForm({
      rut: funcionario.rut,
      nombre_completo: funcionario.nombre_completo,
      fecha_nacimiento: funcionario.fecha_nacimiento || '',
      domicilio: funcionario.domicilio || '',
      comuna: funcionario.comuna || '',
      celular: funcionario.celular || '',
      correo_personal: funcionario.correo_personal || '',
      correo_institucional: funcionario.correo_institucional || '',
      tipo_funcionario: funcionario.tipo_funcionario || 'docente',
      tipo_contrato: funcionario.tipo_contrato || 'plazo_fijo',
      titulo_profesional: funcionario.titulo_profesional || '',
      universidad: funcionario.universidad || '',
      ano_titulacion: funcionario.ano_titulacion ?? new Date().getFullYear(),
      asignatura: funcionario.asignatura || '',
      horas_contrato: funcionario.horas_contrato,
      fecha_ingreso: funcionario.fecha_ingreso || '',
      fecha_termino: funcionario.fecha_termino || null,
      emergencia_nombre: funcionario.emergencia_nombre || '',
      emergencia_telefono: funcionario.emergencia_telefono || '',
      emergencia_parentesco: funcionario.emergencia_parentesco || '',
    });
    setMostrarFormulario(true);
    window.scrollTo(0, 0);
  }

  // Filtrar funcionarios por búsqueda - Mostrar solo últimos 3 ingresados
  const funcionariosFiltrados = funcionarios
    .filter(f => !soloVigentes || f.vigente)
    .filter(f =>
      f.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()) ||
      f.rut.includes(busqueda) ||
      (f.titulo_profesional && f.titulo_profesional.toLowerCase().includes(busqueda.toLowerCase()))
    );

  const funcionariosRecientes = funcionariosFiltrados.slice(0, 5);

  // Fusionar funcionarios + usuarios sin funcionario para lista completa
  const usuariosComoFuncionarios: Funcionario[] = usuariosSinFunc.map(u => ({
    rut: u.id_usuario,
    rut_formateado: u.id_usuario.slice(0, 8),
    id_usuario: u.id_usuario,
    nombre_completo: u.nombre_completo,
    tipo_funcionario: '—',
    tipo_contrato: '—',
    titulo_profesional: null,
    universidad: null,
    ano_titulacion: null,
    asignatura: null,
    horas_contrato: 0,
    fecha_nacimiento: null,
    domicilio: null,
    comuna: null,
    celular: null,
    correo_personal: u.email,
    correo_institucional: null,
    fecha_ingreso: null,
    fecha_termino: null,
    emergencia_nombre: null,
    emergencia_telefono: null,
    emergencia_parentesco: null,
    vigente: true,
    tiene_licencia: false,
    tiene_permiso_admin: false,
    usuario_registrado_sistema: true,
    creado_en: '',
    actualizado_en: '',
  }));
  const todosFuncionarios = [...funcionarios, ...usuariosComoFuncionarios];

  const funcionariosCompleto = todosFuncionarios.filter(f => {
    if (filtroTipoFunc && f.tipo_funcionario !== filtroTipoFunc) return false;
    if (filtroContrato && f.tipo_contrato !== filtroContrato) return false;
    if (filtroLicencia === 'si' && !f.tiene_licencia) return false;
    if (filtroLicencia === 'no' && f.tiene_licencia) return false;
    return true;
  });
  const totalPaginas = Math.max(1, Math.ceil(funcionariosCompleto.length / itemsPorPagina));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const funcionariosPaginados = funcionariosCompleto.slice((paginaSegura - 1) * itemsPorPagina, paginaSegura * itemsPorPagina);

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' , color:'#1a3c6b'}}>
      <h1 style={{ color: '#1a3c6b' }}>👥 Mantenedor de Funcionarios</h1>

      {error && (
        <div style={{
          backgroundColor: '#fee',
          color: '#c33',
          padding: '10px',
          borderRadius: '4px',
          marginBottom: '10px',
          border: '1px solid #fcc'
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* TABLA DE ÚLTIMOS 3 FUNCIONARIOS - ELIMINADA */}

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Buscar por nombre, RUT o título..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{
            flex: 1,
            padding: '8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        />
        <button type="button" 
          onClick={() => {
            limpiarFormulario();
            setMostrarFormulario(!mostrarFormulario);
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          {mostrarFormulario ? '✕ Cancelar' : '+ Nuevo Funcionario'}
        </button>
      </div>

      {/* FORMULARIO */}
      {mostrarFormulario && (
        <div style={{
          backgroundColor: '#f9f9f9',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #e0e0e0'
        }}>
          <h2 style={{ color: '#333' }}>{editando ? '✏️ Editar Funcionario' : '➕ Nuevo Funcionario'}</h2>

          {errorRUT && (
            <div style={{
              backgroundColor: '#fee',
              color: '#c33',
              padding: '8px',
              borderRadius: '4px',
              marginBottom: '15px',
              border: '1px solid #fcc',
              fontSize: '12px'
            }}>
              ⚠️ {errorRUT}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
            {/* RUT */}
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                RUT (Ej: 19845356-8) <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="19845356-8"
                value={form.rut}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9kK]/g, '');
                  setForm({ ...form, rut: raw });
                  if (raw.length >= 2) {
                    setErrorRUT(validarRUT(raw) ? '' : 'RUT inválido');
                  } else {
                    setErrorRUT('');
                  }
                }}
                onBlur={(e) => {
                  const val = e.target.value.trim();
                  if (val) {
                    setForm({ ...form, rut: formatearRUT(val) });
                    setErrorRUT(validarRUT(val) ? '' : 'RUT inválido');
                  }
                }}
                disabled={!!editando}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: errorRUT ? '2px solid #c33' : '1px solid #ccc',
                  borderRadius: '4px',
                  boxSizing: 'border-box',
                  opacity: editando ? 0.5 : 1
                }}
              />
            </div>

            {/* NOMBRE */}
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                Nombre Completo <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                value={form.nombre_completo}
                onChange={(e) => setForm({ ...form, nombre_completo: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* TIPO FUNCIONARIO */}
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                Tipo Funcionario <span style={{ color: 'red' }}>*</span>
              </label>
              <select
                value={form.tipo_funcionario}
                onChange={(e) => setForm({ ...form, tipo_funcionario: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
              >
                <option value="docente">Docente</option>
                <option value="paradocente">Paradocente</option>
                <option value="auxiliar">Auxiliar</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            {/* TIPO CONTRATO */}
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                Tipo Contrato <span style={{ color: 'red' }}>*</span>
              </label>
              <select
                value={form.tipo_contrato}
                onChange={(e) => setForm({ ...form, tipo_contrato: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
              >
                <option value="plazo_fijo">Plazo Fijo</option>
                <option value="a_contrata">A Contrata</option>
                <option value="practicante">Practicante</option>
              </select>
            </div>

            {/* ASIGNATURA */}
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                Asignatura
              </label>
              <input
                type="text"
                value={form.asignatura}
                onChange={(e) => setForm({ ...form, asignatura: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
              />
            </div>

            {/* FECHA NACIMIENTO - OPCIONAL */}
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                Fecha de Nacimiento
              </label>
              <input
                type="date"
                value={form.fecha_nacimiento}
                onChange={(e) => setForm({ ...form, fecha_nacimiento: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* DOMICILIO */}
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                Domicilio <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                value={form.domicilio}
                onChange={(e) => setForm({ ...form, domicilio: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* COMUNA */}
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                Comuna <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                value={form.comuna}
                onChange={(e) => setForm({ ...form, comuna: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* CELULAR */}
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                Celular <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="tel"
                value={form.celular}
                onChange={(e) => setForm({ ...form, celular: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* CORREO PERSONAL */}
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                Correo Personal <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="email"
                value={form.correo_personal}
                onChange={(e) => setForm({ ...form, correo_personal: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* CORREO INSTITUCIONAL - OPCIONAL */}
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                Correo Institucional (@andaliensur.cl)
              </label>
              <input
                type="email"
                value={form.correo_institucional}
                onChange={(e) => setForm({ ...form, correo_institucional: e.target.value })}
                placeholder="auto-generado si está vacío"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  boxSizing: 'border-box',
                  backgroundColor: '#f5f5f5'
                }}
              />
              <small style={{ color: '#666' }}>Se auto-genera si está vacío</small>
            </div>

            {/* TÍTULO PROFESIONAL - OPCIONAL */}
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                Título Profesional
              </label>
              <input
                type="text"
                value={form.titulo_profesional}
                onChange={(e) => setForm({ ...form, titulo_profesional: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* UNIVERSIDAD - OPCIONAL */}
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                Universidad
              </label>
              <input
                type="text"
                value={form.universidad}
                onChange={(e) => setForm({ ...form, universidad: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* AÑO TITULACIÓN - OPCIONAL */}
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                Año de Titulación
              </label>
              <input
                type="number"
                value={form.ano_titulacion}
                onChange={(e) => setForm({ ...form, ano_titulacion: parseInt(e.target.value) })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* FECHA INGRESO - OPCIONAL */}
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                Fecha de Ingreso
              </label>
              <input
                type="date"
                value={form.fecha_ingreso}
                onChange={(e) => setForm({ ...form, fecha_ingreso: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* FECHA TÉRMINO - OPCIONAL */}
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                Fecha de Término
              </label>
              <input
                type="date"
                value={form.fecha_termino || ''}
                onChange={(e) => setForm({ ...form, fecha_termino: e.target.value || null })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* HORAS CONTRATO - OPCIONAL */}
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                Horas de Contrato
              </label>
              <input
                type="number"
                value={form.horas_contrato}
                onChange={(e) => setForm({ ...form, horas_contrato: parseInt(e.target.value) })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* EMERGENCIA - NOMBRE */}
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                Contacto Emergencia - Nombre
              </label>
              <input
                type="text"
                value={form.emergencia_nombre}
                onChange={(e) => setForm({ ...form, emergencia_nombre: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
              />
            </div>

            {/* EMERGENCIA - TELÉFONO */}
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                Contacto Emergencia - Teléfono
              </label>
              <input
                type="tel"
                value={form.emergencia_telefono}
                onChange={(e) => setForm({ ...form, emergencia_telefono: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
              />
            </div>

            {/* EMERGENCIA - PARENTESCO */}
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                Contacto Emergencia - Parentesco
              </label>
              <input
                type="text"
                value={form.emergencia_parentesco}
                onChange={(e) => setForm({ ...form, emergencia_parentesco: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            <button type="button" 
              onClick={handleGuardar}
              disabled={cargando}
              style={{
                padding: '10px 20px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
                opacity: cargando ? 0.6 : 1
              }}
            >
              {cargando ? '⏳ Guardando...' : '💾 Guardar'}
            </button>
            <button type="button" 
              onClick={limpiarFormulario}
              style={{
                padding: '10px 20px',
                backgroundColor: '#757575',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* USUARIOS SIN FUNCIONARIO ASOCIADO */}
      {usuariosSinFunc.length > 0 && (
        <div style={{ marginTop: '25px', padding: '15px', backgroundColor: '#fff8e1', border: '1px solid #ffe082', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 10px', color: '#795548', fontSize: '15px' }}>
            ⏳ Usuarios sin funcionario asociado ({usuariosSinFunc.length})
          </h3>
          <p style={{ fontSize: '12px', color: '#888', margin: '0 0 10px' }}>
            Estos usuarios del sistema (ADMIN, INSPECTOR, PROFESOR, etc.) aún no tienen un registro en la tabla funcionarios. Impórtalos para que aparezcan en búsquedas y ausentes.
          </p>
          <div style={{ overflowX: 'auto', border: '1px solid #ffe082', borderRadius: '4px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: '#fff3cd' }}>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Nombre</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Email</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Rol</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {usuariosSinFunc.map(u => (
                  <tr key={u.id_usuario} style={{ borderBottom: '1px solid #ffe082' }}>
                    <td style={{ padding: '8px' }}><strong>{u.nombre_completo}</strong></td>
                    <td style={{ padding: '8px' }}>{u.email}</td>
                    <td style={{ padding: '8px' }}>{u.rol}</td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      <button type="button" 
                        onClick={() => handleImportarUsuario(u)}
                        disabled={importando === u.id_usuario}
                        style={{
                          padding: '5px 12px',
                          backgroundColor: '#FF9800',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          opacity: importando === u.id_usuario ? 0.6 : 1,
                        }}
                      >
                        {importando === u.id_usuario ? '⏳' : '📥 Importar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* LISTA DE FUNCIONARIOS RECIENTES */}
      <div style={{ marginTop: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
          <h2 style={{ color: '#1a3c6b', margin: 0 }}>📊 Funcionarios Recientes ({funcionariosRecientes.length})</h2>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', cursor: 'pointer' }}>
              <input type="checkbox" checked={soloVigentes} onChange={(e) => setSoloVigentes(e.target.checked)} />
              Solo vigentes
            </label>
            <button type="button" onClick={imprimirListado} style={{
              padding: '8px 14px',
              backgroundColor: '#d32f2f',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '13px'
            }}>
              📄 Ver todos (PDF)
            </button>
            <button type="button" onClick={() => setMostrarListaCompleta(true)} style={{
              padding: '8px 14px',
              backgroundColor: '#1a3c6b',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '13px'
            }}>
              📋 Lista completa
            </button>
          </div>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <input
            type="text"
            placeholder="Buscar por nombre, RUT o título..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{
              width: '100%',
              maxWidth: '350px',
              padding: '8px 12px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {cargando && !mostrarFormulario && <p>⏳ Cargando…</p>}

        {funcionariosRecientes.length === 0 && !cargando ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>No hay funcionarios que coincidan con la búsqueda</p>
        ) : (
          <div style={{
            overflowX: 'auto',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '13px'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: '10px', textAlign: 'left' }}>RUT</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Nombre</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Teléfono</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Comuna</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>Estado</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {funcionariosRecientes.map((func) => (
                  <tr key={func.rut} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px' }}><strong>{func.rut_formateado}</strong></td>
                    <td style={{ padding: '10px' }}>{func.nombre_completo}</td>
                    <td style={{ padding: '10px' }}>{func.celular}</td>
                    <td style={{ padding: '10px' }}>{func.comuna}</td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '3px',
                        backgroundColor: func.vigente ? '#d4edda' : '#f8d7da',
                        color: func.vigente ? '#155724' : '#721c24',
                        fontWeight: 'bold',
                        fontSize: '12px'
                      }}>
                        {func.vigente ? '✓ Vigente' : '✗ No Vigente'}
                      </span>
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <button type="button" 
                        onClick={() => {
                          setFuncionarioPreview(func);
                          setMostrarPreview(true);
                        }}
                        style={{
                          marginRight: '5px',
                          padding: '5px 10px',
                          backgroundColor: '#4285F4',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        👁️ Ver
                      </button>
                      <button type="button" 
                        onClick={() => handleEditar(func)}
                        style={{
                          marginRight: '5px',
                          padding: '5px 10px',
                          backgroundColor: '#2196F3',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        ✏️ Editar
                      </button>
                      <button type="button" 
                        onClick={() => handleCambiarEstado(func, !func.vigente)}
                        style={{
                          padding: '5px 10px',
                          backgroundColor: func.vigente ? '#f44336' : '#4CAF50',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        {func.vigente ? '❌ No Vigente' : '✅ Vigente'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL LISTA COMPLETA */}
      {mostrarListaCompleta && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white', padding: '25px', borderRadius: '8px',
            maxWidth: '1100px', width: '95%', maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h2 style={{ margin: 0, color: '#1a3c6b' }}>
                📋 Lista de Funcionarios ({funcionariosCompleto.length})
              </h2>
              <button type="button" onClick={() => { setMostrarListaCompleta(false); setPagina(1); }} style={{
                padding: '8px 16px', backgroundColor: '#f44336', color: 'white',
                border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'
              }}>
                ✕ Cerrar
              </button>
            </div>

            {/* FILTROS */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '15px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              <select value={filtroTipoFunc} onChange={(e) => { setFiltroTipoFunc(e.target.value); setPagina(1); }}
                style={{ padding: '6px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '12px' }}>
                <option value="">Tipo funcionario</option>
                <option value="docente">Docente</option>
                <option value="paradocente">Paradocente</option>
                <option value="auxiliar">Auxiliar</option>
                <option value="otro">Otro</option>
              </select>
              <select value={filtroContrato} onChange={(e) => { setFiltroContrato(e.target.value); setPagina(1); }}
                style={{ padding: '6px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '12px' }}>
                <option value="">Tipo contrato</option>
                <option value="plazo_fijo">Plazo Fijo</option>
                <option value="a_contrata">A Contrata</option>
                <option value="practicante">Practicante</option>
              </select>
              <select value={filtroLicencia} onChange={(e) => { setFiltroLicencia(e.target.value); setPagina(1); }}
                style={{ padding: '6px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '12px' }}>
                <option value="">Licencia</option>
                <option value="si">🩺 Con licencia</option>
                <option value="no">Sin licencia</option>
              </select>
            </div>

            {/* TABLA */}
            <div style={{ overflowX: 'auto', border: '1px solid #ddd', borderRadius: '4px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                    <th style={{ padding: '8px', textAlign: 'left' }}>RUT</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Nombre</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Tipo</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Contrato</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>Licencia</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>Estado</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {funcionariosPaginados.length === 0 ? (
                    <tr><td colSpan={7} style={{ padding: '20px', textAlign: 'center', color: '#999' }}>Sin resultados</td></tr>
                  ) : funcionariosPaginados.map(f => (
                    <tr key={f.rut} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '8px' }}>{f.rut_formateado}</td>
                      <td style={{ padding: '8px' }}><strong>{f.nombre_completo}</strong></td>
                      <td style={{ padding: '8px' }}>{f.tipo_funcionario}</td>
                      <td style={{ padding: '8px' }}>{f.tipo_contrato}</td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        {f.tiene_licencia
                          ? <span style={{ padding: '2px 6px', borderRadius: '3px', backgroundColor: '#fff3cd', color: '#856404', fontSize: '12px', fontWeight: 'bold' }}>Sí</span>
                          : '—'}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <span style={{
                          padding: '3px 8px', borderRadius: '3px', fontSize: '12px', fontWeight: 'bold',
                          backgroundColor: f.vigente ? '#d4edda' : '#f8d7da',
                          color: f.vigente ? '#155724' : '#721c24'
                        }}>
                          {f.vigente ? '✓ Vigente' : '✗ No Vigente'}
                        </span>
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        {f.creado_en === '' ? (
                          <button type="button" onClick={() => {
                            const u = usuariosSinFunc.find(u2 => u2.id_usuario === f.id_usuario);
                            if (u) handleImportarUsuario(u);
                          }} disabled={importando === f.id_usuario} style={{
                            padding: '4px 10px', backgroundColor: '#FF9800', color: 'white',
                            border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold',
                            opacity: importando === f.id_usuario ? 0.6 : 1
                          }}>
                            {importando === f.id_usuario ? '⏳' : '📥 Importar'}
                          </button>
                        ) : (
                          <>
                            <button type="button" onClick={() => handleEditar(f)} style={{
                              padding: '4px 8px', backgroundColor: '#2196F3', color: 'white',
                              border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px', marginRight: '4px'
                            }}>
                              ✏️
                            </button>
                            <button type="button" onClick={() => handleCambiarEstado(f, !f.vigente)} style={{
                              padding: '4px 8px', backgroundColor: f.vigente ? '#f44336' : '#4CAF50', color: 'white',
                              border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px'
                            }}>
                              {f.vigente ? '❌' : '✅'}
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PAGINADOR */}
            {totalPaginas > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '15px' }}>
                <button type="button" disabled={paginaSegura <= 1} onClick={() => setPagina(p => Math.max(1, p - 1))} style={{
                  padding: '6px 12px', backgroundColor: paginaSegura <= 1 ? '#ccc' : '#1a3c6b', color: 'white',
                  border: 'none', borderRadius: '4px', cursor: paginaSegura <= 1 ? 'default' : 'pointer', fontWeight: 'bold', fontSize: '13px'
                }}>
                  ◀ Anterior
                </button>
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(p => (
                  <button type="button" key={p} onClick={() => setPagina(p)} style={{
                    padding: '6px 12px', backgroundColor: p === paginaSegura ? '#1a3c6b' : '#e0e0e0',
                    color: p === paginaSegura ? 'white' : '#333',
                    border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: p === paginaSegura ? 'bold' : 'normal', fontSize: '13px'
                  }}>
                    {p}
                  </button>
                ))}
                <button type="button" disabled={paginaSegura >= totalPaginas} onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} style={{
                  padding: '6px 12px', backgroundColor: paginaSegura >= totalPaginas ? '#ccc' : '#1a3c6b', color: 'white',
                  border: 'none', borderRadius: '4px', cursor: paginaSegura >= totalPaginas ? 'default' : 'pointer', fontWeight: 'bold', fontSize: '13px'
                }}>
                  Siguiente ▶
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE VISTA PREVIA */}
      {mostrarPreview && funcionarioPreview && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)'
          }}>
            <h2 style={{ color: '#333', marginBottom: '20px' }}>
              {funcionarioPreview.nombre_completo}
            </h2>

            <div style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #eee' }}>
              <p><strong>RUT:</strong> {funcionarioPreview.rut_formateado}</p>
              <p><strong>Tipo:</strong> {funcionarioPreview.tipo_funcionario}</p>
              <p><strong>Contrato:</strong> {funcionarioPreview.tipo_contrato}</p>
              <p><strong>Título Profesional:</strong> {funcionarioPreview.titulo_profesional || 'N/A'}</p>
              {funcionarioPreview.asignatura && <p><strong>Asignatura:</strong> {funcionarioPreview.asignatura}</p>}
            </div>

            <div style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #eee' }}>
              <h3 style={{ color: '#555', fontSize: '14px', marginBottom: '10px' }}>📍 Información de Contacto</h3>
              <p><strong>Domicilio:</strong> {funcionarioPreview.domicilio}</p>
              <p><strong>Comuna:</strong> {funcionarioPreview.comuna}</p>
              <p><strong>Celular:</strong> {funcionarioPreview.celular}</p>
              <p><strong>Correo Personal:</strong> {funcionarioPreview.correo_personal}</p>
              <p><strong>Correo Institucional:</strong> {funcionarioPreview.correo_institucional}</p>
            </div>

            <div style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #eee' }}>
              <h3 style={{ color: '#555', fontSize: '14px', marginBottom: '10px' }}>🎓 Información Académica</h3>
              <p><strong>Universidad:</strong> {funcionarioPreview.universidad || 'N/A'}</p>
              <p><strong>Horas de Contrato:</strong> {funcionarioPreview.horas_contrato || 0} horas</p>
            </div>

            {funcionarioPreview.emergencia_nombre && (
              <div style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #eee' }}>
                <h3 style={{ color: '#555', fontSize: '14px', marginBottom: '10px' }}>🆘 Contacto de Emergencia</h3>
                <p><strong>Nombre:</strong> {funcionarioPreview.emergencia_nombre}</p>
                <p><strong>Teléfono:</strong> {funcionarioPreview.emergencia_telefono}</p>
                <p><strong>Parentesco:</strong> {funcionarioPreview.emergencia_parentesco}</p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" 
                onClick={() => {
                  setMostrarPreview(false);
                  setFuncionarioPreview(null);
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#757575',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                ← Volver
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
