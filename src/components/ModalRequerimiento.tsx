import { useState, useEffect, forwardRef } from 'react';
import { supabase } from '../lib/supabase';
import { validarTicket, crearRequerimiento } from '../services/requerimiento.service';
import { subirEvidencia } from '../services/evidenciaService';

interface Props {
  lugar: { id: string; nombre: string; piso: number; soporte?: boolean };
  equipos: { id: string; nombre: string; marca: string | null; modelo: string | null; estado: string }[];
  idEstablecimiento: string;
  onCerrar: () => void;
  onCreado: () => void;
}

const TIPOS = ['Reparación', 'Mantención', 'Instalación', 'Traslado', 'Otro'];
const PRIORIDADES = ['Baja', 'Normal', 'Alta', 'Urgente'];
const ESTADOS = [
  { valor: 'Pendiente', label: 'Pendiente', color: '#f59e0b' },
  { valor: 'En Proceso', label: 'En Proceso', color: '#3b82f6' },
  { valor: 'Completada', label: 'Solucionado', color: '#16a34a' },
  { valor: 'Cancelada', label: 'Anulado', color: '#6b7280' },
];

const ModalRequerimiento = forwardRef<HTMLDivElement, Props>(function ModalRequerimiento(
  { lugar, equipos, idEstablecimiento, onCerrar, onCreado }, ref,
) {
  const [idEquipo, setIdEquipo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tipo, setTipo] = useState('Reparación');
  const [prioridad, setPrioridad] = useState('Normal');
  const [posibleFalla, setPosibleFalla] = useState('');
  const [diagnostico, setDiagnostico] = useState('');
  const [estado, setEstado] = useState('Pendiente');
  const [observaciones, setObservaciones] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [idUsuarioDb, setIdUsuarioDb] = useState<string | null>(null);
  const [sugFallas, setSugFallas] = useState<string[]>([]);
  const [sugDiags, setSugDiags] = useState<string[]>([]);
  const [todosEquipos, setTodosEquipos] = useState<{ id: string; nombre: string; id_usuario?: string; estado: string }[]>([]);
  const [todosUsuarios, setTodosUsuarios] = useState<{ id: string; nombre: string; email: string }[]>([]);
  const [buscarUsuario, setBuscarUsuario] = useState('');
  const [usuarioSel, setUsuarioSel] = useState<{ id: string; nombre: string } | null>(null);
  const [sugUsuarios, setSugUsuarios] = useState<{ id: string; nombre: string }[]>([]);
  const [mostrarSugUsu, setMostrarSugUsu] = useState(false);
  const [equiposFiltrados, setEquiposFiltrados] = useState<{ id: string; nombre: string; id_usuario?: string; estado: string }[]>([]);
  const [evidencias, setEvidencias] = useState<string[]>([]);
  const [subiendoEvidencia, setSubiendoEvidencia] = useState(false);

  useEffect(() => {
    // Resolver usuarios.id desde auth.uid
    supabase.auth.getUser().then(({ data }) => {
      const uid = data?.user?.id;
      if (uid) {
        supabase.from('usuarios').select('id').eq('uid', uid).maybeSingle()
          .then(({ data: u }) => { if (u) setIdUsuarioDb(u.id); });
      }
    });
    // Cargar sugerencias de catálogos
    Promise.all([
      supabase.from('posibles_fallas').select('nombre').eq('id_establecimiento', idEstablecimiento).eq('activo', true),
      supabase.from('posibles_diagnosticos').select('nombre').eq('id_establecimiento', idEstablecimiento).eq('activo', true),
      supabase.from('equipos').select('id, nombre, id_usuario, estado').eq('id_establecimiento', idEstablecimiento).eq('activo', true),
      supabase.from('usuarios').select('id, nombre, email').eq('id_establecimiento', idEstablecimiento).eq('activo', true),
    ]).then(([fRes, dRes, eqRes, usrRes]) => {
      if (fRes.data) setSugFallas(fRes.data.map(x => x.nombre));
      if (dRes.data) setSugDiags(dRes.data.map(x => x.nombre));
      if (eqRes.data) setTodosEquipos(eqRes.data);
      if (usrRes.data) setTodosUsuarios(usrRes.data);
    });
  }, [idEstablecimiento]);

  async function guardar() {
    if (!descripcion.trim() || !idUsuarioDb) return;
    setGuardando(true);

    const equipo = (buscarUsuario ? equiposFiltrados : equipos).find(e => e.id === idEquipo) || null;
    const errVal = await validarTicket({
      equipo: equipo ? { id: equipo.id, estado: equipo.estado, id_usuario: (equipo as any).id_usuario } : null,
      posibleFalla,
      solicitanteId: idUsuarioDb,
      lugarSoporte: lugar.soporte,
    });

    if (errVal) {
      if (errVal.type === 'bloqueante') {
        alert('❌ ' + errVal.mensaje);
        setGuardando(false);
        return;
      }
      if (!confirm('⚠️ ' + errVal.mensaje + '\n\n¿Continuar de todas formas?')) {
        setGuardando(false);
        return;
      }
    }

    const desc = descripcion.trim() + (posibleFalla ? ` (Falla: ${posibleFalla})` : '');
    const res = await crearRequerimiento({
      idEstablecimiento,
      idLugar: lugar.id,
      idEquipo: idEquipo || null,
      idSolicitante: idUsuarioDb,
      tipoReq: tipo,
      descripcion: desc,
      posibleFalla: posibleFalla.trim() || null,
      diagnostico: diagnostico.trim() || null,
      prioridad,
      estado,
      observaciones: observaciones.trim() || null,
      lugarSoporte: lugar.soporte,
    });

    if (res.error) {
      alert('Error: ' + res.error);
      setGuardando(false);
      return;
    }
    setGuardando(false);
    onCreado();
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #d1d5db',
    fontSize: 13, color: '#1f2937', background: '#fff', outline: 'none',
    boxSizing: 'border-box', fontFamily: 'inherit',
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 4, display: 'block',
  };

  return (
    <div ref={ref} style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.4)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 16,
    }} onClick={onCerrar}>
      <div style={{
        background: '#fff', borderRadius: 12, width: '100%', maxWidth: 520,
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)', overflow: 'hidden',
        maxHeight: '90vh', overflowY: 'auto',
      }} onClick={e => e.stopPropagation()}>
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid #e5e7eb',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#1f2937' }}>
              📋 Nuevo Requerimiento
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b7280' }}>
              {lugar.nombre} · Piso {lugar.piso}
            </p>
          </div>
          <button onClick={onCerrar}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#9ca3af', padding: '0 4px' }}>
            ✕
          </button>
        </div>

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Tipo</label>
              <select value={tipo} onChange={e => setTipo(e.target.value)} style={inputStyle}>
                {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Prioridad</label>
              <select value={prioridad} onChange={e => setPrioridad(e.target.value)} style={inputStyle}>
                {PRIORIDADES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Equipo</label>
            <select value={idEquipo} onChange={e => setIdEquipo(e.target.value)} style={inputStyle}>
              <option value="">Seleccionar equipo (opcional)</option>
              {(buscarUsuario ? equiposFiltrados : equipos).map(eq => {
                const usrId = (eq as any).id_usuario;
                const usr = usrId ? todosUsuarios.find(u => u.id === usrId) : null;
                return (
                <option key={eq.id} value={eq.id}>
                  {eq.nombre}{eq.estado ? ` (${eq.estado})` : ''}{usr ? ` — ${usr.nombre}` : ''}
                </option>
              );})}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Buscar equipos por usuario</label>
            <div style={{ position: 'relative' }}>
              <input value={buscarUsuario} onChange={e => {
                setBuscarUsuario(e.target.value);
                setUsuarioSel(null);
                setIdEquipo('');
                if (e.target.value.length >= 1) {
                  const filtrados = todosUsuarios.filter(u =>
                    u.nombre.toLowerCase().includes(e.target.value.toLowerCase()) ||
                    (u.email && u.email.toLowerCase().includes(e.target.value.toLowerCase()))
                  ).slice(0, 8);
                  setSugUsuarios(filtrados);
                  setMostrarSugUsu(true);
                } else {
                  setSugUsuarios([]);
                  setMostrarSugUsu(false);
                  setEquiposFiltrados([]);
                }
              }}
                onFocus={() => { if (sugUsuarios.length > 0) setMostrarSugUsu(true); }}
                onBlur={() => setTimeout(() => setMostrarSugUsu(false), 200)}
                placeholder="Nombre del usuario…" style={inputStyle} />
              {mostrarSugUsu && sugUsuarios.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20,
                  background: '#fff', border: '1px solid #d1d5db', borderRadius: 6,
                  maxHeight: 180, overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}>
                  {sugUsuarios.map(u => (
                    <div key={u.id} onMouseDown={() => {
                      setBuscarUsuario(u.nombre);
                      setUsuarioSel(u);
                      setMostrarSugUsu(false);
                      const encontrados = todosEquipos.filter(e => e.id_usuario === u.id);
                      setEquiposFiltrados(encontrados);
                      if (encontrados.length > 0) setIdEquipo(encontrados[0].id);
                    }} style={{
                      padding: '8px 12px', cursor: 'pointer', fontSize: 13, color: '#1f2937',
                      borderBottom: '1px solid #f3f4f6',
                    }}>
                      {u.nombre}
                    </div>
                  ))}
                </div>
              )}
              {usuarioSel && !mostrarSugUsu && (
                <p style={{ fontSize: 11, color: '#16a34a', margin: '4px 0 0' }}>
                  ✓ {equiposFiltrados.length} equipo(s) de {usuarioSel.nombre}
                </p>
              )}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Descripción *</label>
            <textarea
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              placeholder="Describa el problema o solicitud…"
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }}
            />
          </div>

          <div>
            <label style={labelStyle}>Posible Falla</label>
            <input
              value={posibleFalla}
              onChange={e => setPosibleFalla(e.target.value)}
              list="modal-fallas"
              placeholder="Ej: Sin internet, Pantalla no enciende"
              style={inputStyle}
            />
            <datalist id="modal-fallas">
              {sugFallas.map((s, i) => <option key={i} value={s} />)}
            </datalist>
          </div>

          <div>
            <label style={labelStyle}>Diagnóstico</label>
            <input
              value={diagnostico}
              onChange={e => setDiagnostico(e.target.value)}
              list="modal-diags"
              placeholder="Diagnóstico técnico (opcional)"
              style={inputStyle}
            />
            <datalist id="modal-diags">
              {sugDiags.map((s, i) => <option key={i} value={s} />)}
            </datalist>
          </div>

          <div>
            <label style={labelStyle}>Estado</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {ESTADOS.map(est => (
                <button
                  key={est.valor}
                  type="button"
                  onClick={() => setEstado(est.valor)}
                  style={{
                    padding: '6px 14px', borderRadius: 6, border: `1.5px solid ${est.color}`,
                    background: estado === est.valor ? est.color : '#fff',
                    color: estado === est.valor ? '#fff' : est.color,
                    fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.12s',
                  }}
                >
                  {est.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Observaciones</label>
            <textarea
              value={observaciones}
              onChange={e => setObservaciones(e.target.value)}
              placeholder="Notas adicionales (opcional)"
              rows={2}
              style={{ ...inputStyle, resize: 'vertical', minHeight: 50 }}
            />
          </div>
        </div>

        {/* Evidencia foto */}
        <div style={{ padding: '0 20px 14px' }}>
          <label style={labelStyle}>Foto evidencia (opcional)</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button type="button" onClick={async () => {
              if (!navigator.mediaDevices?.getUserMedia) { alert('Cámara no disponible'); return; }
              try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                const track = stream.getVideoTracks()[0];
                const imageCapture = new (window as any).ImageCapture(track);
                const photoBlob = await imageCapture.takePhoto();
                track.stop();
                if (photoBlob.size > 5 * 1024 * 1024) { alert('La imagen no puede superar 5MB'); return; }
                setSubiendoEvidencia(true);
                const file = new File([photoBlob], `evidencia_${Date.now()}.jpg`, { type: 'image/jpeg' });
                const res = await subirEvidencia('temp_' + Date.now(), file, 'falla');
                setSubiendoEvidencia(false);
                if (res.error) { alert('Error: ' + res.error); return; }
                if (res.url) setEvidencias(prev => [...prev, res.url!]);
              } catch { alert('No se pudo acceder a la cámara'); }
            }}
              style={{
                padding: '8px 14px', borderRadius: 6, border: '1px solid #d1d5db',
                background: '#fff', color: '#374151', fontSize: 12, cursor: 'pointer',
              }}>📸 Cámara</button>
            <input type="file" accept="image/*" id="modal-foto" style={{ display: 'none' }}
              onChange={async e => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 5 * 1024 * 1024) { alert('La imagen no puede superar 5MB'); return; }
                setSubiendoEvidencia(true);
                const res = await subirEvidencia('temp_' + Date.now(), file, 'falla');
                setSubiendoEvidencia(false);
                if (res.error) { alert('Error: ' + res.error); return; }
                if (res.url) setEvidencias(prev => [...prev, res.url!]);
              }} />
            <button type="button" onClick={() => document.getElementById('modal-foto')?.click()}
              style={{
                padding: '8px 14px', borderRadius: 6, border: '1px solid #d1d5db',
                background: '#fff', color: '#374151', fontSize: 12, cursor: 'pointer',
              }}>📁 Subir</button>
            {subiendoEvidencia && <span style={{ fontSize: 12, color: '#6b7280' }}>Subiendo...</span>}
          </div>
          {evidencias.length > 0 && (
            <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
              {evidencias.map((url, i) => (
                <img key={i} src={url} alt="evidencia"
                  style={{ width: 50, height: 50, borderRadius: 4, objectFit: 'cover', border: '1px solid #d1d5db' }} />
              ))}
            </div>
          )}
        </div>

        <div style={{
          padding: '14px 20px', borderTop: '1px solid #e5e7eb',
          display: 'flex', gap: 10, justifyContent: 'flex-end',
        }}>
          <button onClick={onCerrar}
            style={{
              padding: '8px 18px', borderRadius: 6, border: '1px solid #d1d5db',
              background: '#fff', color: '#374151', fontSize: 13, cursor: 'pointer', fontWeight: 500,
            }}>
            Cancelar
          </button>
          <button onClick={guardar} disabled={guardando || !descripcion.trim() || !idUsuarioDb}
            style={{
              padding: '8px 18px', borderRadius: 6, border: 'none',
              background: guardando || !descripcion.trim() || !idUsuarioDb ? '#9ca3af' : '#2563eb',
              color: '#fff', fontSize: 13, cursor: guardando || !descripcion.trim() || !idUsuarioDb ? 'default' : 'pointer',
              fontWeight: 500,
            }}>
            {guardando ? '⏳ Guardando…' : '✓ Crear Requerimiento'}
          </button>
        </div>
      </div>
    </div>
  );
});

export default ModalRequerimiento;
