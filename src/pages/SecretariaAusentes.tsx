import { useState, useEffect, useRef, useCallback } from 'react';
import { obtenerFuncionarios, actualizarFuncionario } from '../services/funcionarios';
import {
  obtenerAusenciasActivas,
  registrarAusencia,
  eliminarAusencia,
} from '../services/funcionarioAusencias';
import { logError } from '../utils/errorHandler';
import { supabase } from '../lib/supabase';
import type { Funcionario } from '../types';

interface AusenciaRow {
  id: string;
  rut_funcionario: string;
  tipo: string;
  fecha_inicio: string;
  fecha_termino: string | null;
  motivo: string | null;
  funcionarios: { nombre_completo: string; vigente: boolean } | null;
}

async function limpiarVencidas(aus: AusenciaRow[]) {
  const hoy = new Date().toISOString().split('T')[0];
  await Promise.all(aus.map(async (a) => {
    if (a.fecha_termino && a.fecha_termino < hoy) {
      const esVirtual = a.id.startsWith('virtual-');
      if (!esVirtual) {
        await eliminarAusencia(a.id).catch(e => logError(e, 'Error al eliminar ausencia'));
      }
      if (!(a.tipo === 'otro' && a.motivo === 'Día compensado')) {
        await actualizarFuncionario(a.rut_funcionario, {
          [a.tipo === 'licencia' ? 'tiene_licencia' : 'tiene_permiso_admin']: false,
        }).catch(e => logError(e, 'Error al actualizar funcionario en limpieza'));
      }
    }
  }));
}

export default function SecretariaAusentes() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [ausencias, setAusencias] = useState<AusenciaRow[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  // Buscador
  const [busqueda, setBusqueda] = useState('');
  const [mostrarSug, setMostrarSug] = useState(false);
  const [seleccionado, setSeleccionado] = useState<Funcionario | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Formulario ausencia
  const [tipo, setTipo] = useState<'licencia' | 'permiso_admin' | 'dia_compensado'>('licencia');
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0]);
  const [fechaTermino, setFechaTermino] = useState('');

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setMostrarSug(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    try {
      const [funcs, aus] = await Promise.all([
        obtenerFuncionarios(),
        obtenerAusenciasActivas() as Promise<AusenciaRow[]>,
      ]);
      setFuncionarios(funcs);
      const rutsConAusencia = new Set(aus.map(a => a.rut_funcionario));
      for (const f of funcs) {
        if (f.tiene_licencia && !rutsConAusencia.has(f.rut)) {
          aus.push({
            id: `virtual-licencia-${f.rut}`,
            rut_funcionario: f.rut,
            tipo: 'licencia',
            fecha_inicio: new Date().toISOString().split('T')[0],
            fecha_termino: null,
            motivo: null,
            funcionarios: { nombre_completo: f.nombre_completo, vigente: f.vigente },
          });
        }
        if (f.tiene_permiso_admin && !rutsConAusencia.has(f.rut)) {
          aus.push({
            id: `virtual-permiso-${f.rut}`,
            rut_funcionario: f.rut,
            tipo: 'permiso_admin',
            fecha_inicio: new Date().toISOString().split('T')[0],
            fecha_termino: null,
            motivo: null,
            funcionarios: { nombre_completo: f.nombre_completo, vigente: f.vigente },
          });
        }
      }
      setAusencias(aus);
      setSeleccionado(prev => {
        if (prev) {
          const fresco = funcs.find(f => f.rut === prev.rut);
          return fresco || prev;
        }
        return prev;
      });
      await limpiarVencidas(aus);
      setError('');
    } catch {
      setError('Error al cargar datos');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  const sugerencias = busqueda.trim().length >= 2 && !seleccionado
    ? funcionarios.filter(f =>
        f.vigente && (
          f.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()) ||
          f.rut_formateado.includes(busqueda) ||
          f.rut.includes(busqueda)
        )
      ).slice(0, 10)
    : [];

  function validarFormulario(): string | null {
    if (!seleccionado) return 'Selecciona un funcionario';
    if (!fechaInicio) return 'Fecha de inicio es obligatoria';
    if (!fechaTermino) return 'Fecha de término es obligatoria';
    if (fechaTermino < fechaInicio) return 'Fecha de término debe ser posterior o igual a inicio';

    // Máximo 1 mes de duración
    const diffMs = new Date(fechaTermino).getTime() - new Date(fechaInicio).getTime();
    const diffDias = diffMs / (1000 * 60 * 60 * 24);
    if (diffDias > 31) return 'La ausencia no puede superar 1 mes de duración';

    // Si ya tiene cualquier ausencia activa, no puede registrar otra
    if (seleccionado.tiene_licencia) {
      return `${seleccionado.nombre_completo} ya tiene una licencia activa, no puede registrar otra ausencia`;
    }
    if (seleccionado.tiene_permiso_admin) {
      return `${seleccionado.nombre_completo} ya tiene un permiso administrativo activo, no puede registrar otra ausencia`;
    }

    // Validar vigencia
    if (!seleccionado.vigente) return `${seleccionado.nombre_completo} está inactivo, no puede registrar ausencias`;

    return null;
  }

  async function handleRegistrar() {
    const validationError = validarFormulario();
    if (validationError) { setError(validationError); return; }

    setCargando(true);
    setError('');
    try {
      const esCompensado = tipo === 'dia_compensado';
      await registrarAusencia({
        rut_funcionario: seleccionado!.rut,
        tipo: esCompensado ? 'otro' : tipo,
        fecha_inicio: fechaInicio,
        fecha_termino: fechaTermino || null,
        motivo: esCompensado ? 'Día compensado' : null,
        registrado_por: null,
      });
      if (!esCompensado) {
        await actualizarFuncionario(seleccionado!.rut, {
          [tipo === 'licencia' ? 'tiene_licencia' : 'tiene_permiso_admin']: true,
        });
      }
      const label = tipo === 'licencia' ? 'Licencia' : tipo === 'permiso_admin' ? 'Permiso' : 'Día Compensado';
      setExito(`${label} registrado para ${seleccionado!.nombre_completo}`);
      limpiar();
      await cargarDatos();
    } catch {
      setError('Error al registrar');
    } finally {
      setCargando(false);
    }
  }

  async function handleEliminar(a: AusenciaRow) {
    if (!confirm(`¿Quitar ausencia de ${a.funcionarios?.nombre_completo || a.rut_funcionario}?`)) return;
    try {
      const esVirtual = a.id.startsWith('virtual-');
      if (!esVirtual) {
        await eliminarAusencia(a.id);
      }
      if (!(a.tipo === 'otro' && a.motivo === 'Día compensado')) {
        await actualizarFuncionario(a.rut_funcionario, {
          [a.tipo === 'licencia' ? 'tiene_licencia' : 'tiene_permiso_admin']: false,
        });
      }
      await cargarDatos();
    } catch {
      setError('Error al eliminar');
    }
  }

  async function handleInactivar(f: Funcionario) {
    setCargando(true);
    try {
      await actualizarFuncionario(f.rut, { vigente: false });
      if (f.id_usuario) {
        await supabase.from('usuarios').update({ activo: false }).eq('id', f.id_usuario);
      }
      // Limpiar ausencias activas al inactivar
      const ausActivas = ausencias.filter(a => a.rut_funcionario === f.rut);
      await Promise.all(ausActivas.map(a => eliminarAusencia(a.id).catch(e => logError(e, 'Error al eliminar ausencia en inactivación'))));
      if (ausActivas.some(a => a.tipo === 'licencia')) {
        await actualizarFuncionario(f.rut, { tiene_licencia: false }).catch(e => logError(e, 'Error al limpiar licencia en inactivación'));
      }
      if (ausActivas.some(a => a.tipo === 'permiso_admin')) {
        await actualizarFuncionario(f.rut, { tiene_permiso_admin: false }).catch(e => logError(e, 'Error al limpiar permiso admin en inactivación'));
      }
      setExito(`${f.nombre_completo} marcado como inactivo (ausencias limpiadas)`);
      await cargarDatos();
    } catch {
      setError('Error al inactivar');
    } finally {
      setCargando(false);
    }
  }

  function limpiar() {
    setSeleccionado(null);
    setBusqueda('');
    setFechaInicio(new Date().toISOString().split('T')[0]);
    setFechaTermino('');
  }

  return (
    <div style={s.container}>
      <h1 style={s.headerTitle}>Ausentes</h1>

      {error && <div style={s.errorBanner}>{error}</div>}
      {exito && <div style={s.successBanner}>{exito}</div>}

      {/* FORMULARIO */}
      <div style={s.formSection}>
        <h3 style={{ margin: '0 0 15px', color: '#333' }}>Registrar Ausencia</h3>

        <div ref={searchRef} style={{ position: 'relative', marginBottom: '15px' }}>
          <label htmlFor="buscar-funcionario" style={s.label}>
            Buscar funcionario por nombre o RUT <span style={{ color: 'red' }}>*</span>
          </label>
          <input
            id="buscar-funcionario"
            type="text"
            placeholder={seleccionado ? seleccionado.nombre_completo : "Escribe nombre o RUT..."}
            value={seleccionado ? `${seleccionado.nombre_completo} (${seleccionado.rut_formateado})` : busqueda}
            onChange={(e) => { setBusqueda(e.target.value); setSeleccionado(null); setMostrarSug(true); }}
            onFocus={() => setMostrarSug(true)}
            style={{
              width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px',
              boxSizing: 'border-box', backgroundColor: seleccionado ? '#e8f5e9' : 'white',
            }}
          />
          {seleccionado && (
            <button type="button" onClick={limpiar} style={{
              position: 'absolute', right: '8px', top: '32px', background: 'none',
              border: 'none', cursor: 'pointer', fontSize: '16px', color: '#999'
            }}>✕</button>
          )}
          {mostrarSug && sugerencias.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
              backgroundColor: 'white', border: '1px solid #ccc', borderTop: 'none',
              borderRadius: '0 0 4px 4px', maxHeight: '250px', overflowY: 'auto', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
            }}>
              {sugerencias.map(f => (
                <button type="button" key={f.rut} onClick={() => { setSeleccionado(f); setBusqueda(''); setMostrarSug(false); }}
                  style={{ padding: '8px 10px', cursor: 'pointer', fontSize: '13px', borderBottom: '1px solid #eee' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <strong>{f.nombre_completo}</strong>
                  <span style={{ color: '#999', marginLeft: '8px' }}>{f.rut_formateado}</span>
                  <span style={{ color: '#bbb', marginLeft: '8px', fontSize: '12px' }}>{f.tipo_funcionario}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {seleccionado && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', alignItems: 'end' }}>
            <div>
              <label htmlFor="tipo-ausencia" style={s.label}>Tipo</label>
              <select id="tipo-ausencia" value={tipo} onChange={e => setTipo(e.target.value as any)}
                style={s.input}>
                <option value="licencia">Licencia Médica</option>
                <option value="permiso_admin">Permiso Administrativo</option>
                <option value="dia_compensado">Día Compensado</option>
              </select>
            </div>
            <div>
              <label htmlFor="fecha-inicio" style={s.label}>Fecha Inicio</label>
              <input id="fecha-inicio" type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)}
                style={s.input} />
            </div>
            <div>
              <label htmlFor="fecha-termino" style={s.label}>Fecha Término <span style={{ color: 'red' }}>*</span></label>
              <input id="fecha-termino" type="date" value={fechaTermino} onChange={e => setFechaTermino(e.target.value)}
                style={s.input} />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px' }}>
              <button type="button" onClick={handleRegistrar} disabled={cargando} style={{
                ...s.btnPrimary, opacity: cargando ? 0.6 : 1
              }}>
                {cargando ? '⏳' : 'Registrar'}
              </button>
            </div>
            <div style={{ gridColumn: '1 / -1', marginTop: '4px', paddingTop: '12px', borderTop: '1px dashed #ddd' }}>
              <button type="button" onClick={() => {
                if (!window.confirm(`⚠️ ESTO ES DESTRUCTIVO\n\n¿Estás SEGURO de marcar a ${seleccionado.nombre_completo} como INACTIVO?`)) return;
                if (!window.confirm(`Esta acción desactivará su cuenta de usuario y limpiará todas sus ausencias activas.\n\n¿Confirmas?`)) return;
                handleInactivar(seleccionado);
              }} style={{
                padding: '6px 14px', backgroundColor: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb',
                borderRadius: '4px', cursor: 'pointer', fontSize: '12px'
              }}>
                🚫 Inactivar funcionario
              </button>
              <span style={{ marginLeft: '8px', fontSize: '12px', color: '#999' }}>Despedir / Dar de baja</span>
            </div>
          </div>
        )}
      </div>

      {/* LISTA AUSENCIAS ACTIVAS */}
      {cargando && !seleccionado && <p>Cargando…</p>}

      {!cargando && ausencias.length === 0 && (
        <p style={{ color: '#666', fontStyle: 'italic' }}>No hay ausencias activas registradas</p>
      )}

      {ausencias.length > 0 && (
        <div style={{ overflowX: 'auto', border: '1px solid #ddd', borderRadius: '4px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                <th style={{ padding: '10px', textAlign: 'left' }}>Funcionario</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Tipo</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Inicio</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Término</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {ausencias.map(a => (
                <tr key={a.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px' }}><strong>{a.funcionarios?.nombre_completo || a.rut_funcionario}</strong></td>
                  <td style={{ padding: '10px' }}>
                    <span style={{
                      padding: '3px 8px', borderRadius: '3px', fontSize: '12px', fontWeight: 'bold',
                      backgroundColor: a.tipo === 'licencia' ? '#fff3cd' : a.tipo === 'permiso_admin' ? '#cce5ff' : a.tipo === 'otro' && a.motivo === 'Día compensado' ? '#d1e7dd' : '#f8f9fa',
                      color: a.tipo === 'licencia' ? '#856404' : a.tipo === 'permiso_admin' ? '#004085' : a.tipo === 'otro' && a.motivo === 'Día compensado' ? '#0f5132' : '#383d41',
                    }}>
                      {a.tipo === 'licencia' ? 'Licencia' : a.tipo === 'permiso_admin' ? 'Permiso Admin' : a.tipo === 'otro' && a.motivo === 'Día compensado' ? 'Día Compensado' : 'Otro'}
                    </span>
                  </td>
                  <td style={{ padding: '10px' }}>{new Date(a.fecha_inicio).toLocaleDateString('es-CL')}</td>
                  <td style={{ padding: '10px' }}>{a.fecha_termino ? new Date(a.fecha_termino).toLocaleDateString('es-CL') : '—'}</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    <button type="button" onClick={() => handleEliminar(a)} style={s.btnDanger}>
                      Quitar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const s = {
  label: { fontWeight: 'bold' as const, display: 'block' as const, marginBottom: '5px', fontSize: '13px' },
  input: { width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' as const },
  errorBanner: { padding: '10px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '4px', marginBottom: '15px' },
  successBanner: { padding: '10px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '4px', marginBottom: '15px' },
  container: { padding: '20px', maxWidth: '1000px', margin: '0 auto' as const },
  formSection: { backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '25px' },
  headerTitle: { color: '#1a3c6b', marginBottom: '20px' },
  btnPrimary: { padding: '10px 24px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' as const, fontWeight: 'bold' as const },
  btnDanger: { padding: '5px 10px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' as const, fontSize: '12px' },
};
