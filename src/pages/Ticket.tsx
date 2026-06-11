import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { validarTicket, crearRequerimiento } from '../services/requerimiento.service';
import { subirEvidencia, obtenerEvidencias } from '../services/evidenciaService';

interface Props {
  idEstablecimiento: string;
  idUsuario: string;
}

interface Lugar { id: string; nombre: string; piso: number; soporte?: boolean; abreviatura?: string }
interface Equipo { id: string; nombre: string; id_lugar?: string; estado?: string; id_usuario?: string }

type Paso = 'loading' | 'splash' | 'create' | 'close' | 'view' | 'done';

const s = {
  page: {
    minHeight: '100dvh',
    background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
  } as React.CSSProperties,
  card: {
    width: '100%', maxWidth: 440,
    background: '#1e293b', borderRadius: 20, padding: 28,
    border: '1px solid #334155', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  } as React.CSSProperties,
  badge: {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
  } as React.CSSProperties,
  label: {
    fontSize: 12, color: '#94a3b8', display: 'block',
    marginBottom: 6, fontWeight: 500, letterSpacing: '0.3px',
  } as React.CSSProperties,
  inp: {
    width: '100%', padding: '12px 14px', borderRadius: 10,
    border: '1px solid #334155', background: '#0f172a', color: '#f1f5f9',
    fontSize: 15, outline: 'none', boxSizing: 'border-box',
  } as React.CSSProperties,
  sel: {
    width: '100%', padding: '12px 14px', borderRadius: 10,
    border: '1px solid #334155', background: '#0f172a', color: '#f1f5f9',
    fontSize: 15, outline: 'none', cursor: 'pointer',
    appearance: 'none' as const,
  } as React.CSSProperties,
  ta: {
    width: '100%', padding: '12px 14px', borderRadius: 10,
    border: '1px solid #334155', background: '#0f172a', color: '#f1f5f9',
    fontSize: 15, outline: 'none', resize: 'vertical', minHeight: 80,
    fontFamily: 'inherit', boxSizing: 'border-box',
  } as React.CSSProperties,
  btnRow: { display: 'flex', gap: 10, marginTop: 20 } as React.CSSProperties,
  btnSec: {
    flex: 1, padding: '14px 16px', borderRadius: 12,
    border: '1px solid #475569', background: 'transparent',
    color: '#94a3b8', fontSize: 14, fontWeight: 500,
    cursor: 'pointer', textAlign: 'center',
  } as React.CSSProperties,
};

export default function Ticket({ idEstablecimiento, idUsuario }: Props) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [paso, setPaso] = useState<Paso>('loading');
  const [lugar, setLugar] = useState<Lugar | null>(null);
  const [equiposLugar, setEquiposLugar] = useState<Equipo[]>([]);
  const [todosEquipos, setTodosEquipos] = useState<(Equipo & { estado?: string; id_usuario?: string })[]>([]);
  const [todosUsuarios, setTodosUsuarios] = useState<{ id: string; nombre: string; email: string }[]>([]);
  const [ticketActivo, setTicketActivo] = useState<any>(null);
  const [ticketsActivos, setTicketsActivos] = useState<any[]>([]);
  const [nombresUsuarios, setNombresUsuarios] = useState<Record<string, string>>({});
  const [pagTicket, setPagTicket] = useState(0);
  const POR_PAG_TICKET = 4;
  const [idUsuarioDb, setIdUsuarioDb] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState('');
  const [evidencias, setEvidencias] = useState<string[]>([]);
  const [subiendoEvidencia, setSubiendoEvidencia] = useState(false);

  const [posibleFalla, setPosibleFalla] = useState('');
  const [diagnostico, setDiagnostico] = useState('');
  const [solucion, setSolucion] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [tipoReq, setTipoReq] = useState('Reparación');
  const [prioridad, setPrioridad] = useState('Normal');

  const [sugerenciasFalla, setSugerenciasFalla] = useState<string[]>([]);
  const [sugerenciasDiagnostico, setSugerenciasDiagnostico] = useState<string[]>([]);
  const [sugerenciasSolucion, setSugerenciasSolucion] = useState<string[]>([]);
  const [sugerenciasObs, setSugerenciasObs] = useState<string[]>([]);
  const [equipoSel, setEquipoSel] = useState<string>('');
  const [buscarUsuario, setBuscarUsuario] = useState('');
  const [usuarioSel, setUsuarioSel] = useState<{ id: string; nombre: string } | null>(null);
  const [sugUsuarios, setSugUsuarios] = useState<{ id: string; nombre: string }[]>([]);
  const [mostrarSugUsu, setMostrarSugUsu] = useState(false);
  const [equiposFiltrados, setEquiposFiltrados] = useState<(Equipo & { estado?: string; id_usuario?: string })[]>([]);

  useEffect(() => {
    if (!idEstablecimiento || !idUsuario) return;
    // Resolver usuarios.id desde auth.uid
    supabase.from('usuarios').select('id').eq('uid', idUsuario).maybeSingle()
      .then(({ data }) => { if (data) setIdUsuarioDb(data.id); });

    const ticketId = searchParams.get('ticket');
    const lugarId = searchParams.get('lugar');
    const equipoId = searchParams.get('equipo');
    const lugarNombre = searchParams.get('lugar_nombre');

    if (ticketId) {
      loadTicket(ticketId);
      return;
    }

    if (!lugarId && !equipoId && !lugarNombre) {
      setMensaje('⚠️ Falta parámetro ?lugar=ID o ?equipo=ID en la URL.');
      setPaso('done');
      return;
    }

    Promise.all([
      supabase.from('lugares').select('id, nombre, piso, soporte').eq('id_establecimiento', idEstablecimiento).eq('activo', true),
      supabase.from('equipos').select('id, nombre, id_lugar, id_usuario, estado').eq('id_establecimiento', idEstablecimiento).eq('activo', true),
      supabase.from('usuarios').select('id, nombre, email').eq('id_establecimiento', idEstablecimiento).eq('activo', true),
    ]).then(([lugRes, eqRes, usrRes]) => {
      const todosLugares = (lugRes.data || []) as Lugar[];
      const todosEquipos = (eqRes.data || []) as (Equipo & { estado?: string; id_usuario?: string })[];
      const todosUsuarios = (usrRes.data || []) as { id: string; nombre: string; email: string }[];

      let lugarSel: Lugar | null = null;
      let equipoSelInicial: Equipo | null = null;

      if (equipoId) {
        equipoSelInicial = todosEquipos.find(e => e.id === equipoId) || null;
        if (equipoSelInicial) {
          lugarSel = todosLugares.find(l => l.id === equipoSelInicial!.id_lugar) || null;
        }
      } else if (lugarId) {
        lugarSel = todosLugares.find(l => l.id === lugarId) || null;
      }

      if (!lugarSel && lugarNombre) {
        lugarSel = todosLugares.find(l => l.nombre.toLowerCase() === lugarNombre.toLowerCase()) || null;
      }

      if (!lugarSel) {
        setMensaje('⚠️ Lugar no encontrado para este establecimiento.');
        setPaso('done');
        return;
      }

      setLugar(lugarSel);
      setTodosEquipos(todosEquipos);
      setTodosUsuarios(todosUsuarios);

      const eqs = todosEquipos.filter(e => e.id_lugar === lugarSel!.id);
      setEquiposLugar(eqs);
      if (equipoSelInicial) setEquipoSel(equipoSelInicial.id);

      setPaso('splash');

      supabase
        .from('requerimientos')
        .select('*')
        .eq('id_establecimiento', idEstablecimiento)
        .eq('id_lugar', lugarSel.id)
        .in('estado', ['Pendiente', 'En Proceso'])
        .eq('activo', true)
        .order('created_at', { ascending: false })
        .then(async ({ data }) => {
          setTicketsActivos(data || []);
          setPagTicket(0);
          if (data && data.length > 0) {
            setPosibleFalla(data[0].posible_falla || '');
            setDiagnostico(data[0].diagnostico || '');
            const ids = [...new Set(data.map(t => t.id_solicitante).filter(Boolean))];
            if (ids.length > 0) {
              const { data: users } = await supabase.from('usuarios').select('id, nombre').in('id', ids);
              const mapa: Record<string, string> = {};
              (users || []).forEach(u => { mapa[u.id] = u.nombre; });
              setNombresUsuarios(mapa);
            }
          }
        });
    });
  }, [idEstablecimiento]);

  const cargarSugerencias = useCallback(async () => {
    const [reqRes, fallasRes, diagsRes, solsRes, obsRes] = await Promise.all([
      supabase.from('requerimientos')
        .select('posible_falla, diagnostico, solucion, observaciones')
        .eq('id_establecimiento', idEstablecimiento)
        .not('estado', 'eq', 'Cancelada'),
      supabase.from('posibles_fallas')
        .select('nombre')
        .eq('id_establecimiento', idEstablecimiento)
        .eq('activo', true),
      supabase.from('posibles_diagnosticos')
        .select('nombre')
        .eq('id_establecimiento', idEstablecimiento)
        .eq('activo', true),
      supabase.from('posibles_soluciones')
        .select('nombre')
        .eq('id_establecimiento', idEstablecimiento)
        .eq('activo', true),
      supabase.from('posibles_observaciones')
        .select('nombre')
        .eq('id_establecimiento', idEstablecimiento)
        .eq('activo', true),
    ]);

    const historicoFallas = [...new Set((reqRes.data || []).map(r => r.posible_falla).filter(Boolean))] as string[];
    const catalogoFallas = (fallasRes.data || []).map(f => f.nombre);
    setSugerenciasFalla([...new Set([...catalogoFallas, ...historicoFallas])]);

    const historicoDiags = [...new Set((reqRes.data || []).map(r => r.diagnostico).filter(Boolean))] as string[];
    const catalogoDiags = (diagsRes.data || []).map(d => d.nombre);
    setSugerenciasDiagnostico([...new Set([...catalogoDiags, ...historicoDiags])]);

    const historicoSols = [...new Set((reqRes.data || []).map(r => r.solucion).filter(Boolean))] as string[];
    const catalogoSols = (solsRes.data || []).map(s => s.nombre);
    setSugerenciasSolucion([...new Set([...catalogoSols, ...historicoSols])]);

    const historicoObs = [...new Set((reqRes.data || []).map(r => r.observaciones).filter(Boolean))] as string[];
    const catalogoObs = (obsRes.data || []).map(o => o.nombre);
    setSugerenciasObs([...new Set([...catalogoObs, ...historicoObs])]);
  }, [idEstablecimiento]);

  useEffect(() => { cargarSugerencias(); }, [cargarSugerencias]);

  const [creando, setCreando] = useState(false);

  // Ticket view state (desde ?ticket=ID)
  const [ticketData, setTicketData] = useState<any>(null);
  const [lugarTicket, setLugarticket] = useState<string>('');
  const [equipoTicket, setEquipoTicket] = useState<string>('');
  const [conforme, setConforme] = useState(false);
  const [enviarCorreo, setEnviarCorreo] = useState(false);
  const [cierreProgramado, setCierreProgramado] = useState('');

  async function loadTicket(id: string) {
    if (!idEstablecimiento) return;
    setMensaje('');
    const { data: req } = await supabase.from('requerimientos').select('*').eq('id', id).single();
    if (!req) { setMensaje('⚠️ Ticket no encontrado.'); setPaso('done'); return; }
    setTicketData(req);
    setPosibleFalla(req.posible_falla || '');
    setDiagnostico(req.diagnostico || '');
    setSolucion(req.solucion || '');
    setObservaciones(req.observaciones || '');
    if (req.id_lugar) {
      const { data: lug } = await supabase.from('lugares').select('nombre').eq('id', req.id_lugar).single();
      if (lug) setLugarticket(lug.nombre);
    }
    if (req.id_equipo) {
      const { data: eq } = await supabase.from('equipos').select('nombre').eq('id', req.id_equipo).single();
      if (eq) setEquipoTicket(eq.nombre);
    }
    setPaso('view');
    obtenerEvidencias(id).then(urls => setEvidencias(urls));
  }

  async function crearTicket() {
    if (!diagnostico.trim() || creando) return;
    setCreando(true);
    setMensaje('');

    const { data: userData, error: userErr } = await supabase
      .from('usuarios').select('id').eq('uid', idUsuario).maybeSingle();
    if (userErr || !userData) {
      setMensaje('❌ Error: usuario no encontrado en la base de datos.');
      setCreando(false);
      return;
    }
    const idSolicitante = userData.id;

    const eq = todosEquipos.find(e => e.id === equipoSel) || null;

    const errVal = await validarTicket({
      equipo: eq ? { id: eq.id, estado: eq.estado || 'Operativo', id_usuario: eq.id_usuario } : null,
      posibleFalla,
      solicitanteId: idSolicitante,
      lugarSoporte: lugar?.soporte,
    });

    if (errVal) {
      if (errVal.type === 'bloqueante') {
        setMensaje('❌ ' + errVal.mensaje);
        setCreando(false);
        return;
      }
      if (!confirm('⚠️ ' + errVal.mensaje + '\n\n¿Continuar de todas formas?')) {
        setCreando(false);
        return;
      }
    }

    const descripcion = `[Ticket rápido] ${posibleFalla ? `Falla: ${posibleFalla}. ` : ''}${diagnostico}`;
    const res = await crearRequerimiento({
      idEstablecimiento,
      idLugar: lugar!.id,
      idEquipo: eq?.id || null,
      idSolicitante,
      tipoReq,
      descripcion,
      posibleFalla: posibleFalla || null,
      diagnostico: diagnostico || null,
      prioridad,
      estado: 'En Proceso',
      lugarSoporte: lugar?.soporte,
    });

    if (res.error) {
      setMensaje(`❌ Error al crear: ${res.error}`);
      setCreando(false);
      return;
    }
    setCreando(false);
    setMensaje('✅ Ticket creado exitosamente.');
    setPaso('done');
  }

  const [cerrando, setCerrando] = useState(false);

  async function cerrarTicket() {
    if (!solucion.trim() || cerrando || !idUsuarioDb) return;
    setCerrando(true);
    setMensaje('');
    const { error } = await supabase
      .from('requerimientos')
      .update({
        solucion: solucion || null,
        observaciones: observaciones || null,
        estado: 'Completada',
        fecha_atencion: new Date().toISOString().slice(0, 10),
        fecha_cierre: new Date().toISOString(),
        id_tecnico_cierre: idUsuarioDb,
      })
      .eq('id', ticketActivo.id);
    setCerrando(false);
    if (error) { setMensaje(`❌ Error al cerrar: ${error.message}`); return; }
    setMensaje('✅ Ticket cerrado exitosamente.');
    setPaso('done');
  }

  async function cancelarTicket() {
    if (!idUsuarioDb) return;
    await supabase
      .from('requerimientos')
      .update({ estado: 'Cancelada', fecha_cierre: new Date().toISOString(), id_tecnico_cierre: idUsuarioDb })
      .eq('id', ticketActivo.id);
    setMensaje('✕ Ticket cancelado.');
    setPaso('done');
  }

  if (paso === 'loading') {
    return (
      <div style={s.page}>
        <div style={{ textAlign: 'center', color: '#94a3b8' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
          <div style={{ fontSize: 15 }}>Cargando información…</div>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.card}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: paso === 'splash' ? 20 : 4 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>
            {paso === 'splash' ? '📍' : paso === 'create' ? '🔧' : paso === 'close' ? '✅' : '🎉'}
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
            {paso === 'splash' && lugar && `Requerimiento en ${lugar.nombre}`}
            {paso === 'create' && 'Registrar Diagnóstico'}
            {paso === 'close' && 'Cerrar Ticket'}
            {paso === 'done' && 'Listo'}
          </h1>
        </div>

        {/* Splash */}
        {paso === 'splash' && lugar && (
          <div>
              <div style={{
                background: '#0f172a', borderRadius: 14, padding: 16,
                marginBottom: 16, border: '1px solid #334155',
              }}>
                <div style={{ fontSize: 13, color: '#64748b', marginBottom: 2 }}>📍 Ubicación</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>{lugar.nombre}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Piso {lugar.piso}</div>
              </div>

            {/* Selector de equipo */}
            <div style={{ marginBottom: 16 }}>
              <label style={s.label}>Seleccionar Equipo</label>
              <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                <select
                  value={equipoSel}
                  onChange={e => setEquipoSel(e.target.value)}
                  style={{ ...s.sel, flex: 1 }}
                >
                  <option value="">— Sin equipo específico —</option>
                  {(buscarUsuario ? equiposFiltrados : equiposLugar).map(eq => {
                    const usr = todosUsuarios.find(u => u.id === eq.id_usuario);
                    return (
                      <option key={eq.id} value={eq.id} disabled={eq.estado === 'Baja'} style={eq.estado === 'Baja' ? { opacity: 0.4 } : {}}>
                        {eq.nombre}{eq.estado === 'Baja' ? ' (Baja)' : ''}{usr ? ` · ${usr.nombre}` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div style={{ position: 'relative' }}>
                <input value={buscarUsuario} onChange={e => {
                  setBuscarUsuario(e.target.value);
                  setUsuarioSel(null);
                  setEquipoSel('');
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
                  placeholder="Buscar usuario…" style={{ ...s.inp, fontSize: 13 }} />
                {mostrarSugUsu && sugUsuarios.length > 0 && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20,
                    background: '#0f172a', border: '1px solid #475569', borderRadius: 8,
                    maxHeight: 200, overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                  }}>
                    {sugUsuarios.map(u => (
                      <div key={u.id} onMouseDown={() => {
                        setBuscarUsuario(u.nombre);
                        setUsuarioSel(u);
                        setMostrarSugUsu(false);
                        const encontrados = todosEquipos.filter(e => e.id_usuario === u.id);
                        setEquiposFiltrados(encontrados);
                        if (encontrados.length > 0) setEquipoSel(encontrados[0].id);
                      }} style={{
                        padding: '8px 12px', cursor: 'pointer', fontSize: 13, color: '#f1f5f9',
                        borderBottom: '1px solid #334155',
                      }}>
                        {u.nombre}
                      </div>
                    ))}
                  </div>
                )}
                {usuarioSel && !mostrarSugUsu && (
                  <p style={{ fontSize: 11, color: '#4ade80', margin: '4px 0 0' }}>
                    ✓ {usuarioSel.nombre} · {equiposFiltrados.length} equipo(s)
                  </p>
                )}
              </div>
              {equiposLugar.length === 0 && (
                <p style={{ fontSize: 11, color: '#64748b', margin: '4px 0 0' }}>
                  No hay equipos registrados en este lugar
                </p>
              )}
              {equipoSel && (() => {
                const eqSel = todosEquipos.find(e => e.id === equipoSel);
                return eqSel && eqSel.estado === 'Baja' ? (
                  <p style={{ fontSize: 11, color: '#fca5a5', margin: '4px 0 0' }}>⚠️ Este equipo está dado de baja</p>
                ) : eqSel && !eqSel.id_usuario ? (
                  <p style={{ fontSize: 11, color: '#fcd34d', margin: '4px 0 0' }}>⚠️ Este equipo no tiene responsable asignado</p>
                ) : null;
              })()}
              {lugar.soporte === false && (
                <p style={{ fontSize: 11, color: '#fca5a5', margin: '4px 0 0' }}>⚠️ Este lugar no tiene soporte activo</p>
              )}
            </div>

            {/* Tickets activos del lugar */}
            {ticketsActivos.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ ...s.label, marginBottom: 6, fontSize: 11 }}>Tickets abiertos ({ticketsActivos.length})</label>
                {ticketsActivos.slice(pagTicket * POR_PAG_TICKET, (pagTicket + 1) * POR_PAG_TICKET).map(t => (
                  <div key={t.id} onClick={() => {
                    setTicketActivo(t);
                    setTicketData(t);
                    setPosibleFalla(t.posible_falla || '');
                    setDiagnostico(t.diagnostico || '');
                    setSolucion(t.solucion || '');
                    setObservaciones(t.observaciones || '');
                    const pasoDestino = t.estado === 'Pendiente' ? 'view' : 'close';
                    if (pasoDestino === 'view') obtenerEvidencias(t.id).then(urls => setEvidencias(urls));
                    setPaso(pasoDestino);
                  }} style={{
                    background: '#1e3a5f', borderRadius: 8, padding: '8px 12px',
                    marginBottom: 6, border: '1px solid #2563eb40', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 8, fontSize: 12,
                  }}>
                    <span style={{ fontSize: 14 }}>🔄</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: '#93c5fd', fontSize: 13 }}>
                        {t.codigo || '#' + t.id.slice(0, 6)}
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: 11, marginTop: 1 }}>
                        {new Date(t.created_at).toLocaleDateString()} · {nombresUsuarios[t.id_solicitante] || '—'}
                      </div>
                    </div>
                    <span style={{
                      padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600,
                      background: t.estado === 'En Proceso' ? '#1e3a5f' : '#451a03',
                      color: t.estado === 'En Proceso' ? '#93c5fd' : '#fcd34d',
                      whiteSpace: 'nowrap',
                    }}>{t.estado}</span>
                  </div>
                ))}
                {ticketsActivos.length > POR_PAG_TICKET && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 6 }}>
                    <button onClick={() => setPagTicket(p => Math.max(0, p - 1))}
                      disabled={pagTicket === 0}
                      style={{ ...s.btnSec, padding: '4px 12px', fontSize: 11, flex: 'none' }}>
                      ← Anterior
                    </button>
                    <span style={{ fontSize: 11, color: '#64748b', alignSelf: 'center' }}>
                      {pagTicket + 1} / {Math.ceil(ticketsActivos.length / POR_PAG_TICKET)}
                    </span>
                    <button onClick={() => setPagTicket(p => Math.min(Math.ceil(ticketsActivos.length / POR_PAG_TICKET) - 1, p + 1))}
                      disabled={pagTicket >= Math.ceil(ticketsActivos.length / POR_PAG_TICKET) - 1}
                      style={{ ...s.btnSec, padding: '4px 12px', fontSize: 11, flex: 'none' }}>
                      Siguiente →
                    </button>
                  </div>
                )}
              </div>
            )}

            {ticketsActivos.length === 0 && (
              <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12, textAlign: 'center' }}>
                No hay tickets abiertos en este lugar
              </p>
            )}

            <button
              onClick={() => setPaso('create')}
              style={{
                width: '100%', padding: '14px 20px', borderRadius: 12, border: 'none',
                background: '#059669', color: '#fff',
                fontSize: 15, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              + Nuevo Ticket
            </button>

            <button
              onClick={() => { navigate('/tecnico/m/grid'); }}
              style={{ ...s.btnSec, marginTop: 10, width: '100%' }}
            >
              Cancelar
            </button>
          </div>
        )}

        {/* Create */}
        {paso === 'create' && (
          <div>
            {lugar && (
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16, textAlign: 'center' }}>
                📍 {lugar.nombre}
                {equipoSel && todosEquipos.find(e => e.id === equipoSel) && (
                  <> · 🔧 {todosEquipos.find(e => e.id === equipoSel)!.nombre}</>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
              <div style={{ flex: 1 }}>
                <label style={s.label}>Tipo</label>
                <select value={tipoReq} onChange={e => setTipoReq(e.target.value)} style={s.sel}>
                  <option value="Reparación">Reparación</option>
                  <option value="Mantención">Mantención</option>
                  <option value="Instalación">Instalación</option>
                  <option value="Traslado">Traslado</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={s.label}>Prioridad</label>
                <select value={prioridad} onChange={e => setPrioridad(e.target.value)} style={s.sel}>
                  <option value="Baja">Baja</option>
                  <option value="Normal">Normal</option>
                  <option value="Alta">Alta</option>
                  <option value="Urgente">Urgente</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={s.label}>Posible Falla</label>
              <input
                list="fallas" value={posibleFalla}
                onChange={e => setPosibleFalla(e.target.value)}
                placeholder="¿Qué crees que falla?"
                style={s.inp}
              />
              <datalist id="fallas">
                {sugerenciasFalla.map((sug, i) => <option key={i} value={sug} />)}
              </datalist>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={s.label}>Diagnóstico *</label>
              <input
                value={diagnostico}
                onChange={e => setDiagnostico(e.target.value)}
                placeholder="Describe lo que detectaste…"
                list="diags"
                style={s.inp}
              />
              <datalist id="diags">
                {sugerenciasDiagnostico.map((sug, i) => <option key={i} value={sug} />)}
              </datalist>
            </div>

            {mensaje && (
              <p style={{ fontSize: 13, color: mensaje.includes('Error') ? '#fca5a5' : '#4ade80', marginBottom: 10, textAlign: 'center' }}>
                {mensaje}
              </p>
            )}

            <button
              onClick={crearTicket}
              disabled={!diagnostico.trim() || creando}
              style={{
                width: '100%', padding: '14px 20px', borderRadius: 12, border: 'none',
                background: diagnostico.trim() && !creando ? '#059669' : '#334155',
                color: diagnostico.trim() && !creando ? '#fff' : '#64748b',
                fontSize: 15, fontWeight: 600,
                cursor: diagnostico.trim() && !creando ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {creando ? '⏳ Creando…' : '💾 Crear Ticket'}
            </button>

            <div style={s.btnRow}>
              <button onClick={() => setPaso('splash')} style={s.btnSec}>← Atrás</button>
            </div>
          </div>
        )}

        {/* Close */}
        {paso === 'close' && ticketActivo && (
          <div>
            {lugar && (
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12, textAlign: 'center' }}>
                📍 {lugar.nombre}
              </div>
            )}

            <div style={{
              background: '#0f172a', borderRadius: 10, padding: 12,
              marginBottom: 18, border: '1px solid #334155',
            }}>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Ticket activo</div>
              <div style={{ fontSize: 13, color: '#f1f5f9', fontWeight: 500 }}>
                {ticketActivo.descripcion?.slice(0, 80)}{ticketActivo.descripcion?.length > 80 ? '…' : ''}
              </div>
              <div style={{ marginTop: 6 }}>
                <span style={{ ...s.badge, background: '#1e3a5f', color: '#93c5fd' }}>
                  {ticketActivo.estado}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={s.label}>Solución *</label>
              <input
                list="sols" value={solucion}
                onChange={e => setSolucion(e.target.value)}
                placeholder="¿Cómo lo solucionaste?"
                style={s.inp}
              />
              <datalist id="sols">
                {sugerenciasSolucion.map((sug, i) => <option key={i} value={sug} />)}
              </datalist>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={s.label}>Observaciones</label>
              <textarea
                value={observaciones}
                onChange={e => setObservaciones(e.target.value)}
                placeholder="Notas adicionales (opcional)"
                rows={3}
                style={s.ta}
              />
              <datalist id="obs-sugs">
                {sugerenciasObs.map((sug, i) => <option key={i} value={sug} />)}
              </datalist>
            </div>

            {/* Evidencia foto */}
            <div style={{ marginBottom: 18 }}>
              <label style={s.label}>Foto reparación (opcional)</label>
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
                    const file = new File([photoBlob], `reparacion_${Date.now()}.jpg`, { type: 'image/jpeg' });
                    const res = await subirEvidencia(ticketActivo.id, file, 'reparacion');
                    setSubiendoEvidencia(false);
                    if (res.error) { alert('Error: ' + res.error); return; }
                    if (res.url) setEvidencias(prev => [...prev, res.url!]);
                  } catch { alert('No se pudo acceder a la cámara'); }
                }}
                  style={{
                    padding: '10px 16px', borderRadius: 8, border: '1px solid #475569',
                    background: '#1e293b', color: '#f1f5f9', fontSize: 13, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                  📸 Cámara
                </button>
                <input type="file" accept="image/*" id="close-foto"
                  onChange={async e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 5 * 1024 * 1024) { alert('La imagen no puede superar 5MB'); return; }
                    setSubiendoEvidencia(true);
                    const res = await subirEvidencia(ticketActivo.id, file, 'reparacion');
                    setSubiendoEvidencia(false);
                    if (res.error) { alert('Error: ' + res.error); return; }
                    if (res.url) setEvidencias(prev => [...prev, res.url!]);
                  }}
                  style={{ display: 'none' }} />
                <button type="button" onClick={() => document.getElementById('close-foto')?.click()}
                  style={{
                    padding: '10px 16px', borderRadius: 8, border: '1px solid #475569',
                    background: '#1e293b', color: '#f1f5f9', fontSize: 13, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                  📁 Subir archivo
                </button>
                {subiendoEvidencia && <span style={{ fontSize: 12, color: '#64748b' }}>Subiendo...</span>}
              </div>
              {evidencias.length > 0 && (
                <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                  {evidencias.map((url, i) => (
                    <img key={i} src={url} alt="reparacion"
                      style={{ width: 50, height: 50, borderRadius: 4, objectFit: 'cover', border: '1px solid #334155' }} />
                  ))}
                </div>
              )}
            </div>

            {mensaje && (
              <p style={{ fontSize: 13, color: mensaje.includes('Error') ? '#fca5a5' : '#4ade80', marginBottom: 10, textAlign: 'center' }}>
                {mensaje}
              </p>
            )}

            <button
              onClick={cerrarTicket}
              disabled={!solucion.trim() || cerrando}
              style={{
                width: '100%', padding: '14px 20px', borderRadius: 12, border: 'none',
                background: solucion.trim() && !cerrando ? '#2563eb' : '#334155',
                color: solucion.trim() && !cerrando ? '#fff' : '#64748b',
                fontSize: 15, fontWeight: 600,
                cursor: solucion.trim() && !cerrando ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {cerrando ? '⏳ Cerrando…' : '✅ Cerrar Ticket'}
            </button>

            <div style={s.btnRow}>
              <button onClick={() => setPaso('splash')} style={s.btnSec}>← Atrás</button>
              <button onClick={cancelarTicket} style={{ ...s.btnSec, border: '1px solid #dc2626', color: '#fca5a5' }}>
                ✕ Cancelar
              </button>
            </div>
          </div>
        )}

        {/* View — 3 etapas para ticket existente desde mapa */}
        {paso === 'view' && ticketData && (
          <div>
            {/* Volver */}
            <button onClick={() => window.history.back()}
              style={{ ...s.btnSec, width: '100%', marginBottom: 16, textAlign: 'center' }}>
              ← Volver
            </button>

            {/* Etapa 1: Recepción */}
            <div style={{ background: '#0f172a', borderRadius: 12, padding: 14, marginBottom: 12, border: '1px solid #334155' }}>
              <h3 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: '#93c5fd', display: 'flex', alignItems: 'center', gap: 6 }}>
                📋 Recepción
              </h3>
              {lugarTicket && <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>📍 {lugarTicket}</div>}
              {equipoTicket && <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>🔧 {equipoTicket}</div>}
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>👤 {ticketData.descripcion}</div>
              <div style={{ marginBottom: 8 }}>
                <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 2 }}>Posible Falla</label>
                <div style={{ fontSize: 13, color: '#f1f5f9' }}>{posibleFalla || '—'}</div>
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 2 }}>Diagnóstico</label>
                {ticketData.estado === 'En Proceso' ? (
                  <input value={diagnostico} onChange={e => setDiagnostico(e.target.value)}
                    placeholder="Describe el diagnóstico…"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #334155', background: '#1e293b', color: '#f1f5f9', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                ) : (
                  <div style={{ fontSize: 13, color: '#f1f5f9' }}>{diagnostico || '—'}</div>
                )}
              </div>
              <div style={{ marginTop: 8 }}>
                <span style={{ ...s.badge, background: ticketData.estado === 'En Proceso' ? '#1e3a5f' : ticketData.estado === 'Completada' ? '#064e3b' : '#451a03', color: ticketData.estado === 'En Proceso' ? '#93c5fd' : ticketData.estado === 'Completada' ? '#6ee7b7' : '#fcd34d' }}>
                  {ticketData.estado}
                </span>
                <span style={{ ...s.badge, background: '#1e293b', color: '#94a3b8', marginLeft: 6 }}>{ticketData.prioridad}</span>
              </div>
            </div>

            {/* Etapa 2: Avances */}
            {(ticketData.estado === 'En Proceso' || ticketData.estado === 'Pendiente' || ticketData.estado === 'Completada') && (
              <div style={{ background: '#0f172a', borderRadius: 12, padding: 14, marginBottom: 12, border: '1px solid #334155' }}>
                <h3 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: '#fcd34d', display: 'flex', alignItems: 'center', gap: 6 }}>
                  🔧 Avances
                </h3>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 3 }}>Solución</label>
                  {ticketData.estado !== 'Completada' ? (
                    <input value={solucion} onChange={e => setSolucion(e.target.value)}
                      placeholder="¿Cómo lo solucionaste?"
                      list="sols"
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #334155', background: '#1e293b', color: '#f1f5f9', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                  ) : (
                    <div style={{ fontSize: 13, color: '#f1f5f9' }}>{solucion || '—'}</div>
                  )}
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 3 }}>Observaciones</label>
                  {ticketData.estado !== 'Completada' ? (
                    <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)}
                      placeholder="Notas adicionales…" rows={2}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #334155', background: '#1e293b', color: '#f1f5f9', fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                  ) : (
                    <div style={{ fontSize: 13, color: '#f1f5f9' }}>{observaciones || '—'}</div>
                  )}
                </div>
                {/* Evidencia foto reparacion */}
                {ticketData.estado !== 'Completada' && (
                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 3 }}>Foto reparación</label>
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
                        const file = new File([photoBlob], `reparacion_${Date.now()}.jpg`, { type: 'image/jpeg' });
                        const res = await subirEvidencia(ticketData.id, file, 'reparacion');
                        setSubiendoEvidencia(false);
                        if (res.error) { alert('Error: ' + res.error); return; }
                        if (res.url) setEvidencias(prev => [...prev, res.url!]);
                      } catch { alert('No se pudo acceder a la cámara'); }
                    }}
                      style={{
                        padding: '8px 14px', borderRadius: 8, border: '1px solid #475569',
                        background: '#1e293b', color: '#f1f5f9', fontSize: 12, cursor: 'pointer',
                      }}>📸 Cámara</button>
                    <input type="file" accept="image/*" id="view-foto" style={{ display: 'none' }}
                      onChange={async e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 5 * 1024 * 1024) { alert('La imagen no puede superar 5MB'); return; }
                        setSubiendoEvidencia(true);
                        const res = await subirEvidencia(ticketData.id, file, 'reparacion');
                        setSubiendoEvidencia(false);
                        if (res.error) { alert('Error: ' + res.error); return; }
                        if (res.url) setEvidencias(prev => [...prev, res.url!]);
                      }} />
                    <button type="button" onClick={() => document.getElementById('view-foto')?.click()}
                      style={{
                        padding: '8px 14px', borderRadius: 8, border: '1px solid #475569',
                        background: '#1e293b', color: '#f1f5f9', fontSize: 12, cursor: 'pointer',
                      }}>📁 Subir</button>
                    {subiendoEvidencia && <span style={{ fontSize: 11, color: '#64748b' }}>Subiendo...</span>}
                  </div>
                  {evidencias.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                      {evidencias.map((url, i) => (
                        <img key={i} src={url} alt="reparacion"
                          style={{ width: 50, height: 50, borderRadius: 4, objectFit: 'cover', border: '1px solid #334155' }} />
                      ))}
                    </div>
                  )}
                </div>
                )}
                {ticketData.estado !== 'Completada' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={async () => {
                      if (!solucion.trim()) return alert('Agrega una solución primero.');
                      await supabase.from('requerimientos').update({ solucion: solucion || null, observaciones: observaciones || null, estado: 'Completada', fecha_cierre: new Date().toISOString() }).eq('id', ticketData.id);
                      setMensaje('✅ Ticket completado.');
                      setPaso('done');
                    }} style={{
                      flex: 1, padding: '10px', borderRadius: 10, border: 'none',
                      background: '#059669', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    }}>
                      ✓ Completado
                    </button>
                    <button onClick={async () => {
                      await supabase.from('requerimientos').update({ solucion: solucion || null, observaciones: observaciones || null, estado: 'Pendiente' }).eq('id', ticketData.id);
                      setMensaje('⏳ Ticket marcado como pendiente.');
                      setPaso('done');
                    }} style={{
                      flex: 1, padding: '10px', borderRadius: 10, border: '1px solid #f59e0b',
                      background: 'transparent', color: '#fcd34d', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    }}>
                      Pendiente
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Etapa 3: Cierre */}
            {ticketData.estado === 'Completada' && (
              <div style={{ background: '#0f172a', borderRadius: 12, padding: 14, marginBottom: 12, border: '1px solid #334155' }}>
                <h3 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: '#6ee7b7', display: 'flex', alignItems: 'center', gap: 6 }}>
                  ✅ Cierre
                </h3>
                {ticketData.fecha_cierre && (
                  <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>
                    Cerrado: {new Date(ticketData.fecha_cierre).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
                {evidencias.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 3 }}>Fotos de evidencia</label>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {evidencias.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                          <img src={url} alt={`evidencia ${i+1}`}
                            style={{ width: 80, height: 80, borderRadius: 6, objectFit: 'cover', border: '1px solid #334155', cursor: 'pointer' }}
                            onClick={e => { e.preventDefault(); window.open(url, '_blank'); }} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                <label style={{ fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', marginBottom: 8 }}>
                  <input type="checkbox" checked={conforme} onChange={e => setConforme(e.target.checked)} />
                  Usuario conforme
                </label>
                <label style={{ fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', marginBottom: 8 }}>
                  <input type="checkbox" checked={enviarCorreo} onChange={e => setEnviarCorreo(e.target.checked)} />
                  Enviar correo de cierre
                </label>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 3 }}>Cierre programado</label>
                  <input type="datetime-local" value={cierreProgramado} onChange={e => setCierreProgramado(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #334155', background: '#1e293b', color: '#f1f5f9', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <button onClick={async () => {
                  if (!conforme) return alert('Confirma que el usuario está conforme.');
                  if (enviarCorreo) console.log('📧 Enviar correo de cierre (pendiente implementar)');
                  const updates: any = { conforme: true };
                  if (cierreProgramado) updates.fecha_cierre = new Date(cierreProgramado).toISOString();
                  await supabase.from('requerimientos').update(updates).eq('id', ticketData.id);
                  setMensaje('✅ Ticket cerrado definitivamente.');
                  setPaso('done');
                }} style={{
                  width: '100%', padding: '10px', borderRadius: 10, border: 'none',
                  background: conforme ? '#2563eb' : '#334155',
                  color: conforme ? '#fff' : '#64748b', fontSize: 13, fontWeight: 600, cursor: conforme ? 'pointer' : 'not-allowed',
                }}>
                  Cerrar Definitivamente
                </button>
              </div>
            )}

            {mensaje && (
              <p style={{ fontSize: 13, color: mensaje.includes('Error') ? '#fca5a5' : '#4ade80', textAlign: 'center', marginTop: 10 }}>
                {mensaje}
              </p>
            )}
          </div>
        )}

        {/* Done */}
        {paso === 'done' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>
              {mensaje.includes('Error') ? '❌' : mensaje.includes('cancelado') ? '✕' : '✅'}
            </div>
            <p style={{ color: '#f1f5f9', fontSize: 16, fontWeight: 500, margin: '0 0 4px' }}>{mensaje}</p>
            <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 24px' }}>
              {lugar && `📍 ${lugar.nombre}${equipoSel && todosEquipos.find(e => e.id === equipoSel) ? ` · 🔧 ${todosEquipos.find(e => e.id === equipoSel)!.nombre}` : ''}`}
            </p>
            <button
              onClick={() => {
                try { window.close(); } catch {}
                window.location.href = window.location.href.split('#')[0] + '#/tecnico/m/inicio';
              }}
              style={{
                width: '100%', padding: '14px 20px', borderRadius: 12, border: 'none',
                background: '#1e40af', color: '#fff',
                fontSize: 15, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              Volver al Dashboard
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
