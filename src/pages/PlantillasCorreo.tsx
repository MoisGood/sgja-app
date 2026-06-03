import { useState, useEffect, useRef, useCallback } from 'react';
import { obtenerPlantillas, crearPlantilla, actualizarPlantilla, eliminarPlantilla, VARIABLES_DISPONIBLES } from '../services/plantillasCorreo';
import type { PlantillaCorreo } from '../types';

interface Props {
  idEstablecimiento: string;
  usuarioId: string;
}

function CardPlantilla({ p, editando, abrirEditar, handleDuplicar, handleEliminar }: {
  p: PlantillaCorreo;
  editando: PlantillaCorreo | null;
  abrirEditar: (p: PlantillaCorreo) => void;
  handleDuplicar: (p: PlantillaCorreo) => void;
  handleEliminar: (id: string) => void;
}) {
  const esActual = editando?.id === p.id;
  return (
    <div
      onClick={() => !esActual && abrirEditar(p)}
      style={{
        padding: '14px 16px', marginBottom: '8px', borderRadius: '8px',
        border: esActual ? '2px solid #1A3C6B' : '1px solid #E5E7EB',
        background: esActual ? '#EFF6FF' : '#FFF',
        cursor: 'pointer', transition: 'box-shadow 0.15s',
      }}
      onMouseEnter={e => { if (!esActual) e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; }}
      onMouseLeave={e => { if (!esActual) e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, color: '#1A3C6B', marginBottom: '2px' }}>{p.nombre}</div>
          <div style={{ fontSize: '12px', color: '#6B7280' }}>
            <span>Asunto: {p.asunto}</span>
          </div>
          <pre style={{ fontSize: '12px', color: '#9CA3AF', margin: '6px 0 0 0', whiteSpace: 'pre-wrap', maxHeight: '40px', overflow: 'hidden' }}>{p.cuerpo}</pre>
        </div>
        <div style={{ display: 'flex', gap: '4px', flexShrink: 0, marginLeft: '12px' }} onClick={e => e.stopPropagation()}>
          <button type="button" onClick={() => handleDuplicar(p)} title="Duplicar" style={{ padding: '4px 8px', fontSize: '12px', background: '#F3F4F6', border: '1px solid #D1D5DB', borderRadius: '4px', cursor: 'pointer' }}>📋</button>
          <button type="button" onClick={() => handleEliminar(p.id)} title="Eliminar" style={{ padding: '4px 8px', fontSize: '12px', background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: '4px', cursor: 'pointer' }}>🗑️</button>
        </div>
      </div>
    </div>
  );
}

export default function PlantillasCorreo({ idEstablecimiento, usuarioId }: Props) {
  const [plantillas, setPlantillas] = useState<PlantillaCorreo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const [editando, setEditando] = useState<PlantillaCorreo | null>(null);
  const [creando, setCreando] = useState(false);
  const [nombre, setNombre] = useState('');
  const [asunto, setAsunto] = useState('');
  const [cuerpo, setCuerpo] = useState('');
  const [categoria, setCategoria] = useState('');

  const [mostrarVars, setMostrarVars] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const cargar = useCallback(() => {
    setCargando(true);
    obtenerPlantillas(idEstablecimiento)
      .then(setPlantillas)
      .catch(() => setError('Error al cargar plantillas'))
      .finally(() => setCargando(false));
  }, [idEstablecimiento]);

  useEffect(cargar, [cargar]);

  function insertarVariable(clave: string) {
    const ta = textareaRef.current;
    if (!ta) { setCuerpo(c => c + `{{${clave}}}`); return; }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = cuerpo.substring(0, start);
    const after = cuerpo.substring(end);
    const insert = `{{${clave}}}`;
    setCuerpo(before + insert + after);
    requestAnimationFrame(() => {
      ta.selectionStart = ta.selectionEnd = start + insert.length;
      ta.focus();
    });
  }

  function abrirCrear() {
    setEditando(null);
    setCreando(true);
    setNombre('');
    setAsunto('');
    setCuerpo('');
    setCategoria('');
  }

  function abrirEditar(p: PlantillaCorreo) {
    setCreando(false);
    setEditando(p);
    setNombre(p.nombre);
    setAsunto(p.asunto);
    setCuerpo(p.cuerpo);
    setCategoria(p.categoria || '');
  }

  function cerrarForm() {
    setCreando(false);
    setEditando(null);
    setError('');
    setExito('');
  }

  async function handleGuardar() {
    if (!nombre.trim() || !asunto.trim() || !cuerpo.trim()) {
      setError('Completa nombre, asunto y cuerpo');
      return;
    }
    setError('');
    try {
      if (creando) {
        await crearPlantilla({
          id_establecimiento: idEstablecimiento,
          nombre: nombre.trim(),
          asunto: asunto.trim(),
          cuerpo,
          categoria: categoria.trim() || null,
          ultimo_uso: null,
          creado_por: usuarioId,
        });
        setExito('Plantilla creada');
      } else if (editando) {
        await actualizarPlantilla(editando.id, {
          nombre: nombre.trim(),
          asunto: asunto.trim(),
          cuerpo,
          categoria: categoria.trim() || null,
        });
        setExito('Plantilla actualizada');
      }
      cerrarForm();
      cargar();
    } catch {
      setError('Error al guardar plantilla');
    }
  }

  async function handleEliminar(id: string) {
    if (!window.confirm('¿Eliminar esta plantilla?')) return;
    try {
      await eliminarPlantilla(id);
      setExito('Plantilla eliminada');
      if (editando?.id === id) cerrarForm();
      cargar();
    } catch {
      setError('Error al eliminar plantilla');
    }
  }

  function handleDuplicar(p: PlantillaCorreo) {
    setCreando(true);
    setEditando(null);
    setNombre(p.nombre + ' (copia)');
    setAsunto(p.asunto);
    setCuerpo(p.cuerpo);
    setCategoria(p.categoria || '');
  }

  const filtradas = plantillas.filter(p =>
    !busqueda || p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.categoria || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    p.cuerpo.toLowerCase().includes(busqueda.toLowerCase())
  );

  const categoriasUnicas = [...new Set(plantillas.map(p => p.categoria).filter(Boolean))] as string[];

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ color: '#1a3c6b', margin: '0 0 4px 0' }}>📄 Plantillas de Correo</h1>
          <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>Crea y administra plantillas para agilizar el envío de correos</p>
        </div>
        <button type="button" onClick={abrirCrear} style={{
          padding: '10px 20px', background: '#1A3C6B', color: '#FFF', border: 'none',
          borderRadius: '8px', fontWeight: 600, fontSize: '14px', cursor: 'pointer',
        }}>
          + Nueva plantilla
        </button>
      </div>

      <input
        type="text"
        placeholder="Buscar plantillas..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        style={{ width: '100%', padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: '8px', boxSizing: 'border-box', marginBottom: '16px', fontSize: '14px' }}
      />

      {error && <div style={{ padding: '10px', background: '#FEE2E2', color: '#991B1B', borderRadius: '6px', marginBottom: '12px', fontSize: '13px' }}>{error}</div>}
      {exito && <div style={{ padding: '10px', background: '#D1FAE5', color: '#065F46', borderRadius: '6px', marginBottom: '12px', fontSize: '13px' }}>{exito}</div>}

      {(creando || editando) && (
        <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '20px', marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#1A3C6B' }}>{creando ? 'Nueva plantilla' : 'Editar plantilla'}</h3>
          <div style={{ display: 'grid', gap: '14px' }}>
            <div>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: '4px', fontSize: '13px' }}>Nombre <span style={{ color: 'red' }}>*</span></label>
              <input value={nombre} onChange={e => setNombre(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: '4px', fontSize: '13px' }}>Categoría</label>
              <input value={categoria} onChange={e => setCategoria(e.target.value)} placeholder="Ej: Ausencias, General, Notificaciones" list="categorias-sugeridas" style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', boxSizing: 'border-box' }} />
              <datalist id="categorias-sugeridas">
                {categoriasUnicas.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: '4px', fontSize: '13px' }}>Asunto <span style={{ color: 'red' }}>*</span></label>
              <input value={asunto} onChange={e => setAsunto(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ position: 'relative' }}>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: '4px', fontSize: '13px' }}>
                Cuerpo <span style={{ color: 'red' }}>*</span>
              </label>
              <textarea
                ref={textareaRef}
                value={cuerpo}
                onChange={e => setCuerpo(e.target.value)}
                rows={12}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', boxSizing: 'border-box', fontFamily: 'monospace', fontSize: '13px', resize: 'vertical' }}
              />
              <div style={{ position: 'relative', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setMostrarVars(!mostrarVars)}
                  style={{
                    padding: '4px 10px', fontSize: '12px', background: '#EFF6FF',
                    color: '#1E40AF', border: '1px solid #BFDBFE', borderRadius: '4px', cursor: 'pointer',
                  }}
                >
                  {mostrarVars ? '▼ Ocultar variables' : '▶ Insertar variable'}
                </button>
                {mostrarVars && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, zIndex: 20, marginTop: '4px',
                    background: '#FFF', border: '1px solid #E5E7EB', borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)', padding: '8px', minWidth: '200px',
                  }}>
                    {VARIABLES_DISPONIBLES.map(v => (
                      <button
                        key={v.clave}
                        type="button"
                        onClick={() => { insertarVariable(v.clave); setMostrarVars(false); }}
                        style={{
                          display: 'block', width: '100%', textAlign: 'left', padding: '6px 8px',
                          border: 'none', background: 'none', cursor: 'pointer', borderRadius: '4px',
                          fontSize: '13px',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#F3F4F6')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                      >
                        <code style={{ color: '#1E40AF', fontWeight: 600 }}>{`{{${v.clave}}}`}</code>
                        <span style={{ color: '#6B7280', marginLeft: '8px', fontSize: '12px' }}>{v.descripcion}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <button type="button" onClick={handleGuardar} style={{
              padding: '10px 24px', background: '#1A3C6B', color: '#FFF', border: 'none',
              borderRadius: '6px', fontWeight: 600, cursor: 'pointer',
            }}>
              {creando ? 'Crear plantilla' : 'Guardar cambios'}
            </button>
            <button type="button" onClick={cerrarForm} style={{
              padding: '10px 24px', background: '#F3F4F6', color: '#374151', border: '1px solid #D1D5DB',
              borderRadius: '6px', fontWeight: 500, cursor: 'pointer',
            }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {cargando ? <p style={{ textAlign: 'center', color: '#6B7280' }}>⏳ Cargando…</p> : (
        filtradas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>
            {plantillas.length === 0 ? 'Aún no hay plantillas. Crea la primera.' : 'Sin resultados para tu búsqueda.'}
          </div>
        ) : (
          <div>
            {categoriasUnicas.map(cat => {
              const deCategoria = filtradas.filter(p => p.categoria === cat);
              if (deCategoria.length === 0) return null;
              return (
                <div key={cat} style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px 0' }}>{cat}</h3>
                  {deCategoria.map(p => (
                    <CardPlantilla key={p.id} p={p} editando={editando} abrirEditar={abrirEditar} handleDuplicar={handleDuplicar} handleEliminar={handleEliminar} />
                  ))}
                </div>
              );
            })}
            {filtradas.reduce((acc, p) => {
              if (!p.categoria) acc.push(<CardPlantilla key={p.id} p={p} editando={editando} abrirEditar={abrirEditar} handleDuplicar={handleDuplicar} handleEliminar={handleEliminar} />);
              return acc;
            }, [] as React.ReactNode[])}
          </div>
        )
      )}
    </div>
  );
}
