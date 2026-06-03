import { useState, useEffect, forwardRef } from 'react';
import { supabase } from '../lib/supabase';

interface Props {
  lugar: { id: string; nombre: string; piso: number };
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
    ]).then(([fRes, dRes]) => {
      if (fRes.data) setSugFallas(fRes.data.map(x => x.nombre));
      if (dRes.data) setSugDiags(dRes.data.map(x => x.nombre));
    });
  }, [idEstablecimiento]);

  async function guardar() {
    if (!descripcion.trim() || !idUsuarioDb) return;
    setGuardando(true);
    const payload = {
      id_establecimiento: idEstablecimiento,
      id_lugar: lugar.id,
      id_equipo: idEquipo || null,
      id_solicitante: idUsuarioDb,
      tipo_requerimiento: tipo,
      descripcion: descripcion.trim(),
      posible_falla: posibleFalla.trim() || null,
      diagnostico: diagnostico.trim() || null,
      prioridad,
      estado,
      observaciones: observaciones.trim() || null,
      fecha_solicitud: new Date().toISOString().split('T')[0],
    };
    const { error } = await supabase.rpc('insertar_requerimiento', {
      p_id_establecimiento: payload.id_establecimiento,
      p_id_lugar: payload.id_lugar,
      p_id_equipo: payload.id_equipo,
      p_id_solicitante: payload.id_solicitante,
      p_tipo_requerimiento: payload.tipo_requerimiento,
      p_descripcion: payload.descripcion,
      p_posible_falla: payload.posible_falla,
      p_diagnostico: payload.diagnostico,
      p_prioridad: payload.prioridad,
      p_estado: payload.estado,
      p_fecha_solicitud: payload.fecha_solicitud,
    });
    if (error) {
      // Fallback: direct INSERT
      const { error: ie } = await supabase.from('requerimientos').insert(payload);
      if (ie) { alert('Error: ' + ie.message); setGuardando(false); return; }
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
            <label style={labelStyle}>Equipo asignado</label>
            <select value={idEquipo} onChange={e => setIdEquipo(e.target.value)} style={inputStyle}>
              <option value="">Seleccionar equipo (opcional)</option>
              {equipos.map(eq => (
                <option key={eq.id} value={eq.id}>
                  {eq.nombre}{eq.marca ? ` (${eq.marca})` : ''} — {eq.estado}
                </option>
              ))}
            </select>
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
