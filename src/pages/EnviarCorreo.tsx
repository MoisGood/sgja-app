import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { obtenerFuncionarios } from '../services/funcionarios';
import { obtenerPlantillas, renderizarPlantilla, crearPlantilla } from '../services/plantillasCorreo';
import { obtenerContactos, crearContacto, eliminarContacto } from '../services/contactosCorreo';
import { enviarCorreo } from '../services/emailService';
import type { Funcionario, PlantillaCorreo, ContactoCorreo } from '../types';
import { Book, Pencil, Trash2 } from 'lucide-react';

const HISTORIAL_KEY = 'historial_cuerpos_correo';
const MAX_HISTORIAL = 10;
const HISTORIAL_CORREOS_KEY = 'historial_correos_enviados';

function cargarHistorial(): string[] {
  try { const raw = localStorage.getItem(HISTORIAL_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
}
function guardarHistorial(texto: string): void {
  const h = cargarHistorial().filter(x => x !== texto);
  h.unshift(texto);
  localStorage.setItem(HISTORIAL_KEY, JSON.stringify(h.slice(0, MAX_HISTORIAL)));
}
function eliminarHistorial(idx: number): string[] {
  const h = cargarHistorial(); h.splice(idx, 1);
  localStorage.setItem(HISTORIAL_KEY, JSON.stringify(h)); return [...h];
}
function cargarHistorialCorreos(): string[] {
  try { const raw = localStorage.getItem(HISTORIAL_CORREOS_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
}
function guardarHistorialCorreo(email: string): void {
  const h = cargarHistorialCorreos().filter(e => e !== email);
  h.unshift(email);
  localStorage.setItem(HISTORIAL_CORREOS_KEY, JSON.stringify(h.slice(0, 20)));
}

interface Props { idEstablecimiento: string; }

export default function EnviarCorreo({ idEstablecimiento }: Props) {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [plantillas, setPlantillas] = useState<PlantillaCorreo[]>([]);
  const [contactos, setContactos] = useState<ContactoCorreo[]>([]);
  const [cargando, setCargando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  const [destinatario, setDestinatario] = useState('');
  const [plantillaId, setPlantillaId] = useState('');
  const [asunto, setAsunto] = useState('');
  const [cuerpo, setCuerpo] = useState('');
  const [guardarHistorialActivo, setGuardarHistorialActivo] = useState(true);
  const [historial, setHistorial] = useState<string[]>(cargarHistorial());
  const [mostrarHistorialCuerpos, setMostrarHistorialCuerpos] = useState(false);
  const emailConfig = useRef<{ email: string; appPassword: string; displayName?: string; port?: number; ssl?: boolean; reverifyMinutos?: number } | null>(null);

  const [mostrarModalPlantilla, setMostrarModalPlantilla] = useState(false);
  const [tituloPlantilla, setTituloPlantilla] = useState('');
  const [noPreguntarDeNuevo, setNoPreguntarDeNuevo] = useState(false);
  const noPreguntarSesion = useRef(sessionStorage.getItem('no_preguntar_plantilla') === 'true');

  const [mostrarModalContactos, setMostrarModalContactos] = useState(false);
  const [contactosFiltro, setContactosFiltro] = useState('');
  const [nuevoContactoNombre, setNuevoContactoNombre] = useState('');
  const [nuevoContactoEmail, setNuevoContactoEmail] = useState('');
  const [editandoContacto, setEditandoContacto] = useState<ContactoCorreo | null>(null);

  const [mostrarSugDestino, setMostrarSugDestino] = useState(false);
  const destinoRef = useRef<HTMLDivElement>(null);
  const [letraFiltro, setLetraFiltro] = useState('');
  const palabrasBloqueadas = useRef<string[]>([]);
  const [mostrarModal2FA, setMostrarModal2FA] = useState(false);
  const [codigo2FA, setCodigo2FA] = useState('');
  const [verificando2FA, setVerificando2FA] = useState(false);
  const callbackEnviar = useRef<(() => Promise<void>) | null>(null);

  function debePreguntarGuardar() {
    return !noPreguntarSesion.current && localStorage.getItem('no_preguntar_plantilla_nunca') !== 'true';
  }

  useEffect(() => {
    setCargando(true);
    const cargarConfig = async () => {
      try { return await supabase.from('email_config').select('*').eq('id_establecimiento', idEstablecimiento).eq('activo', true).maybeSingle(); }
      catch { return { data: null }; }
    };
    Promise.all([
      obtenerFuncionarios().catch(() => [] as Funcionario[]),
      obtenerPlantillas(idEstablecimiento).catch(() => [] as PlantillaCorreo[]),
      cargarConfig(),
      obtenerContactos(idEstablecimiento).catch(() => [] as ContactoCorreo[]),
      supabase.from('palabras_bloqueadas').select('palabra').eq('id_establecimiento', idEstablecimiento).eq('activo', true).then(({ data }) => { palabrasBloqueadas.current = data?.map(p => p.palabra.toLowerCase()) || []; }),
    ])
      .then(([funcs, plants, config, conts]) => {
        setFuncionarios(funcs.filter(f => f.correo_institucional || f.correo_personal));
        setPlantillas(plants);
        setContactos(conts);
        if (config?.data) {
          const c = config.data;
          emailConfig.current = { email: c.email, appPassword: c.app_password, displayName: c.display_name, port: c.smtp_port || 587, ssl: c.smtp_port === 465, reverifyMinutos: c.reverify_minutos || 0 };
        }
      })
      .catch(err => console.error('Error al cargar datos:', err))
      .finally(() => setCargando(false));
  }, [idEstablecimiento]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (destinoRef.current && !destinoRef.current.contains(e.target as Node)) setMostrarSugDestino(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function getVars(func?: Funcionario): Record<string, string> {
    if (!func) return {};
    return {
      rut: func.rut_formateado,
    };
  }

  function handlePlantillaChange(id: string) {
    setPlantillaId(id);
    const p = plantillas.find(x => x.id === id);
    if (p) { setAsunto(p.asunto); setCuerpo(p.cuerpo); }
  }

  function insertarVariable(v: string) {
    const ta = document.getElementById('cuerpo-correo') as HTMLTextAreaElement;
    if (!ta) { setCuerpo(c => c + `{{${v}}}`); return; }
    const s = ta.selectionStart, e = ta.selectionEnd;
    setCuerpo(cuerpo.substring(0, s) + `{{${v}}}` + cuerpo.substring(e));
    requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = s + v.length + 4; ta.focus(); });
  }

  function obtenerCorreoDestino(texto: string): string {
    const func = funcionarios.find(f => f.rut === texto || f.correo_institucional === texto || f.correo_personal === texto);
    if (func) return func.correo_institucional || func.correo_personal || texto;
    const contacto = contactos.find(c => c.email === texto);
    if (contacto) return contacto.email;
    return texto;
  }

  async function handleAgregarContacto() {
    if (!nuevoContactoNombre.trim() || !nuevoContactoEmail.trim()) return;
    try {
      if (editandoContacto) {
        const { error } = await supabase.from('contactos_correo').update({
          nombre: nuevoContactoNombre.trim(), email: nuevoContactoEmail.trim(), actualizado_en: new Date().toISOString(),
        }).eq('id', editandoContacto.id);
        if (error) throw error;
      } else {
        await crearContacto({ id_establecimiento: idEstablecimiento, nombre: nuevoContactoNombre.trim(), email: nuevoContactoEmail.trim() });
      }
      setContactos(await obtenerContactos(idEstablecimiento));
      setNuevoContactoNombre(''); setNuevoContactoEmail(''); setEditandoContacto(null);
    } catch (err) { setError('Error al guardar contacto: ' + (err instanceof Error ? err.message : '')); }
  }

  async function handleEliminarContacto(id: string) {
    try {
      await eliminarContacto(id);
      setContactos(await obtenerContactos(idEstablecimiento));
    } catch { setError('Error al eliminar contacto'); }
  }

  function editarContacto(contacto: ContactoCorreo) {
    setEditandoContacto(contacto);
    setNuevoContactoNombre(contacto.nombre);
    setNuevoContactoEmail(contacto.email);
  }

  function cancelarEdicionContacto() {
    setEditandoContacto(null);
    setNuevoContactoNombre('');
    setNuevoContactoEmail('');
  }

  async function handleEnviar(e: React.FormEvent) {
    e.preventDefault();
    if (!destinatario || !asunto.trim() || !cuerpo.trim()) {
      setError('Completa destinatario, asunto y cuerpo');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(destinatario)) {
      setError('El destinatario no tiene un formato de email válido');
      return;
    }

    const cuerpoMinus = cuerpo.toLowerCase();
    const asuntoMinus = asunto.toLowerCase();
    const textoCompleto = `${cuerpoMinus} ${asuntoMinus}`;
    const palabrasEncontradas = palabrasBloqueadas.current.filter(p => textoCompleto.includes(p));
    if (palabrasEncontradas.length > 0) {
      setError(`El correo contiene palabras bloqueadas: ${palabrasEncontradas.join(', ')}`);
      return;
    }

    if (!emailConfig.current) {
      setError('Configuración de correo no encontrada. Ve a Configuración > Correos para configurarla.');
      return;
    }

    const minutos = emailConfig.current.reverifyMinutos || 0;
    if (minutos > 0) {
      const lastVerify = localStorage.getItem('sgja_last_verify_timestamp');
      const ahora = Date.now();
      if (!lastVerify || (ahora - parseInt(lastVerify)) > minutos * 60000) {
        setCodigo2FA('');
        callbackEnviar.current = ejecutarEnvio;
        setMostrarModal2FA(true);
        return;
      }
    }

    await ejecutarEnvio();
  }

  async function handleVerificar2FA() {
    if (codigo2FA.length !== 6) { setError('Ingresa el código de 6 dígitos'); return; }
    setVerificando2FA(true);
    setError('');
    try {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totp = factors?.all?.find(f => f.factor_type === 'totp' && f.status === 'verified');
      if (!totp) { setError('No hay un factor 2FA configurado'); setVerificando2FA(false); return; }
      const { data: chal, error: err1 } = await supabase.auth.mfa.challenge({ factorId: totp.id });
      if (err1 || !chal) { setError(err1?.message || 'Error al crear desafío'); setVerificando2FA(false); return; }
      const { error: err2 } = await supabase.auth.mfa.verify({ factorId: totp.id, challengeId: chal.id, code: codigo2FA });
      if (err2) { setError(err2.message); setVerificando2FA(false); return; }
      localStorage.setItem('sgja_last_verify_timestamp', String(Date.now()));
      setMostrarModal2FA(false);
      setCodigo2FA('');
      if (callbackEnviar.current) await callbackEnviar.current();
    } catch { setError('Error al verificar 2FA'); }
    finally { setVerificando2FA(false); }
  }

  async function ejecutarEnvio() {
    setEnviando(true); setError(''); setExito('');
    try {
      const func = funcionarios.find(f => f.rut === destinatario || f.correo_institucional === destinatario || f.correo_personal === destinatario);
      const correo = obtenerCorreoDestino(destinatario);
      const vars = getVars(func);
      const cuerpoR = renderizarPlantilla(cuerpo, vars);
      const asuntoR = renderizarPlantilla(asunto, vars);

      const res = await enviarCorreo(correo, asuntoR, `<p>${cuerpoR.replace(/\n/g, '<br>')}</p>`, emailConfig.current!);
      if (!res.success) throw new Error(res.error || 'Error al enviar');

      setExito(`Correo enviado a ${func?.nombre_completo || destinatario} (${correo})`);
      setDestinatario(''); setAsunto(''); setCuerpo(''); setPlantillaId('');
      if (correo) guardarHistorialCorreo(correo);
      if (guardarHistorialActivo && !plantillaId) { guardarHistorial(cuerpo); setHistorial(cargarHistorial()); }
      if (!plantillaId && debePreguntarGuardar()) { setTituloPlantilla(''); setNoPreguntarDeNuevo(false); setMostrarModalPlantilla(true); }
    } catch (err) {
      setError('Error al enviar correo: ' + (err instanceof Error ? err.message : 'desconocido'));
    } finally { setEnviando(false); }
  }

  function cerrarModalPlantilla(noVolverPreguntar?: 'sesion' | 'nunca') {
    if (noVolverPreguntar === 'sesion') { sessionStorage.setItem('no_preguntar_plantilla', 'true'); noPreguntarSesion.current = true; }
    else if (noVolverPreguntar === 'nunca') localStorage.setItem('no_preguntar_plantilla_nunca', 'true');
    setMostrarModalPlantilla(false);
  }

  async function handleGuardarComoPlantilla() {
    if (!tituloPlantilla.trim()) return;
    try {
      await crearPlantilla({ id_establecimiento: idEstablecimiento, nombre: tituloPlantilla.trim(), asunto, cuerpo, categoria: null, ultimo_uso: null, creado_por: null });
      cerrarModalPlantilla(noPreguntarDeNuevo ? 'sesion' : undefined);
      setPlantillas(await obtenerPlantillas(idEstablecimiento));
    } catch (err) { setError('Error al guardar plantilla: ' + (err instanceof Error ? err.message : 'desconocido')); }
  }

  function seleccionarDestinatario(email: string) {
    setDestinatario(email);
    setMostrarSugDestino(false);
    setMostrarModalContactos(false);
  }

  const todosDestinos = [
    ...funcionarios.reduce((acc: { nombre: string; email: string }[], f) => {
      if (f.correo_institucional || f.correo_personal) {
        acc.push({ nombre: f.nombre_completo, email: f.correo_institucional || f.correo_personal! });
      }
      return acc;
    }, []),
    ...contactos.map(c => ({ nombre: c.nombre, email: c.email })),
  ];

  const sugFiltradas = destinatario.trim().length >= 1 && mostrarSugDestino
    ? todosDestinos.filter(d =>
        d.nombre.toLowerCase().includes(destinatario.toLowerCase()) ||
        d.email.toLowerCase().includes(destinatario.toLowerCase())
      ).slice(0, 10)
    : [];

  const letras = [...new Set(contactos.map(c => c.nombre.charAt(0).toUpperCase()))].sort();
  const contactosFiltrados = contactos.filter(c => {
    if (contactosFiltro && !c.nombre.toLowerCase().includes(contactosFiltro.toLowerCase()) && !c.email.toLowerCase().includes(contactosFiltro.toLowerCase())) return false;
    if (letraFiltro && c.nombre.charAt(0).toUpperCase() !== letraFiltro) return false;
    return true;
  });

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ color: '#1a3c6b', marginBottom: '10px' }}>✉️ Redactar Correo</h1>

      {error && <div style={{ padding: '10px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '4px', marginBottom: '15px', fontSize: '13px' }}>{error}</div>}
      {exito && <div style={{ padding: '10px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '4px', marginBottom: '15px' }}>{exito}</div>}

      {cargando ? <p>⏳ Cargando…</p> : (
        <form onSubmit={handleEnviar} style={{ backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
          <div style={{ display: 'grid', gap: '15px' }}>
            <div ref={destinoRef} style={{ position: 'relative' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                Destinatario <span style={{ color: 'red' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="email" value={destinatario}
                  onChange={e => { setDestinatario(e.target.value); setMostrarSugDestino(true); }}
                  onFocus={() => setMostrarSugDestino(true)}
                  placeholder="Correo electrónico..."
                  style={{ flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
                <button type="button" onClick={() => { setContactosFiltro(''); setLetraFiltro(''); setMostrarModalContactos(true); }}
                  title="Contactos" style={{ padding: '8px 10px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '4px', cursor: 'pointer', color: '#1E40AF', display: 'flex', alignItems: 'center' }}>
                  <Book size={18} />
                </button>
              </div>
              {sugFiltradas.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20,
                  backgroundColor: 'white', border: '1px solid #D1D5DB', borderRadius: '0 0 6px 6px',
                  maxHeight: '200px', overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                  {sugFiltradas.map(s => (
                    <button type="button" key={s.email} onClick={() => seleccionarDestinatario(s.email)}
                      style={{ padding: '8px 10px', cursor: 'pointer', fontSize: '13px', borderBottom: '1px solid #F3F4F6' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F3F4F6'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                      <strong>{s.nombre}</strong>
                      <span style={{ color: '#9CA3AF', marginLeft: '8px', fontSize: '12px' }}>{s.email}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Plantilla</label>
              <select value={plantillaId} onChange={e => handlePlantillaChange(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}>
                <option value="">Sin plantilla (escribir manual)</option>
                {plantillas.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Asunto <span style={{ color: 'red' }}>*</span></label>
              <input type="text" value={asunto} onChange={e => setAsunto(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }} />
            </div>

            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Cuerpo <span style={{ color: 'red' }}>*</span></label>
              <textarea id="cuerpo-correo" value={cuerpo} onChange={e => setCuerpo(e.target.value)} rows={10}
                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'monospace' }} />
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                {['rut'].map(v => (
                  <button key={v} type="button" onClick={() => insertarVariable(v)}
                    style={{ padding: '3px 8px', fontSize: '12px', background: '#EFF6FF', color: '#1E40AF', border: '1px solid #BFDBFE', borderRadius: '4px', cursor: 'pointer' }}>
                    {`{{${v}}}`}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label>
                <input type="checkbox" checked={guardarHistorialActivo} onChange={e => setGuardarHistorialActivo(e.target.checked)} />
                {' '}Guardar en historial
              </label>
              {historial.length > 0 && (
                <button type="button" onClick={() => setMostrarHistorialCuerpos(!mostrarHistorialCuerpos)}
                  style={{ padding: '3px 8px', fontSize: '12px', background: '#F3F4F6', border: '1px solid #D1D5DB', borderRadius: '4px', cursor: 'pointer' }}>
                  {mostrarHistorialCuerpos ? 'Ocultar' : `Historial (${historial.length})`}
                </button>
              )}
            </div>

            {mostrarHistorialCuerpos && historial.length > 0 && (
              <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '8px' }}>
                {historial.map((h, i) => (
                  <div key={h} style={{ padding: '6px 0', borderBottom: i < historial.length - 1 ? '1px solid #F3F4F6' : 'none', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <pre style={{ margin: 0, fontSize: '12px', color: '#374151', flex: 1, whiteSpace: 'pre-wrap', maxHeight: '60px', overflow: 'hidden' }}>{h}</pre>
                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                      <button type="button" onClick={() => setCuerpo(h)} style={{ padding: '2px 6px', fontSize: '12px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '3px', cursor: 'pointer' }}>Usar</button>
                      <button type="button" onClick={() => setHistorial(eliminarHistorial(i))} style={{ padding: '2px 6px', fontSize: '12px', background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: '3px', cursor: 'pointer' }}>×</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit" disabled={enviando}
            style={{ marginTop: '20px', padding: '12px 24px', backgroundColor: '#1a3c6b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', opacity: enviando ? 0.6 : 1 }}>
            {enviando ? '⏳ Enviando...' : '📤 Enviar Correo'}
          </button>
        </form>
      )}

      {mostrarModalPlantilla && (
        <button type="button" style={{ ...estilos.modalOverlay, border: 'none' }} onClick={e => { if (e.target === e.currentTarget) cerrarModalPlantilla(); }}>
          <div style={estilos.modalContent}>
            <h3 style={{ margin: '0 0 8px 0', color: '#1A3C6B' }}>Guardar como plantilla</h3>
            <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 16px 0' }}>¿Quieres guardar este correo como plantilla?</p>
            <input autoFocus placeholder="Nombre de la plantilla" value={tituloPlantilla} onChange={e => setTituloPlantilla(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', boxSizing: 'border-box', marginBottom: '12px', fontSize: '14px' }}
              onKeyDown={e => { if (e.key === 'Enter') handleGuardarComoPlantilla(); }} />
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6B7280', marginBottom: '16px', cursor: 'pointer' }}>
              <input type="checkbox" checked={noPreguntarDeNuevo} onChange={e => setNoPreguntarDeNuevo(e.target.checked)} />
              No volver a preguntar en esta sesión
            </label>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => cerrarModalPlantilla(noPreguntarDeNuevo ? 'sesion' : undefined)}
                style={{ padding: '10px 20px', background: '#F3F4F6', border: '1px solid #D1D5DB', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}>No, gracias</button>
              <button type="button" onClick={handleGuardarComoPlantilla} disabled={!tituloPlantilla.trim()}
                style={{ padding: '10px 20px', background: '#1A3C6B', color: '#FFF', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, opacity: tituloPlantilla.trim() ? 1 : 0.5 }}>Guardar</button>
            </div>
          </div>
        </button>
      )}

      {mostrarModalContactos && (
        <button type="button" style={{ ...estilos.modalOverlay, border: 'none' }} onClick={e => { if (e.target === e.currentTarget) setMostrarModalContactos(false); }}>
          <div style={{ ...estilos.modalContent, maxWidth: '500px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, color: '#1A3C6B' }}>📒 Mis contactos</h3>
              <button type="button" onClick={() => setMostrarModalContactos(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6B7280' }}>×</button>
            </div>

            {/* Filtro por letra */}
            <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', marginBottom: '10px' }}>
              <button type="button" onClick={() => setLetraFiltro('')} style={{
                padding: '4px 8px', border: letraFiltro === '' ? '2px solid #1A3C6B' : '1px solid #D1D5DB',
                borderRadius: '4px', background: letraFiltro === '' ? '#EFF6FF' : '#FFF', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#374151'
              }}>Todas</button>
              {letras.map(letra => (
                <button type="button" key={letra} onClick={() => setLetraFiltro(letra)} style={{
                  padding: '4px 8px', border: letraFiltro === letra ? '2px solid #1A3C6B' : '1px solid #D1D5DB',
                  borderRadius: '4px', background: letraFiltro === letra ? '#EFF6FF' : '#FFF', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#374151'
                }}>{letra}</button>
              ))}
            </div>

            <input type="text" placeholder="Buscar contactos..." value={contactosFiltro}
              onChange={e => { setContactosFiltro(e.target.value); }}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', boxSizing: 'border-box', marginBottom: '10px', fontSize: '13px' }} />

            {/* Nuevo / Editar contacto inline */}
            <div style={{ marginBottom: '10px' }}>
              <h4 style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', margin: '0 0 4px 0' }}>
                {editandoContacto ? '✏️ Editar contacto' : '➕ Nuevo contacto'}
              </h4>
              <div style={{ display: 'flex', gap: '4px' }}>
                <input placeholder="Nombre" value={nuevoContactoNombre} onChange={e => setNuevoContactoNombre(e.target.value)}
                  style={{ flex: 1, padding: '6px 8px', border: '1px solid #D1D5DB', borderRadius: '4px', fontSize: '13px' }} />
                <input placeholder="Email" value={nuevoContactoEmail} onChange={e => setNuevoContactoEmail(e.target.value)}
                  style={{ flex: 1, padding: '6px 8px', border: '1px solid #D1D5DB', borderRadius: '4px', fontSize: '13px' }} />
                <button type="button" onClick={handleAgregarContacto} disabled={!nuevoContactoNombre.trim() || !nuevoContactoEmail.trim()}
                  style={{ padding: '6px 10px', background: '#1A3C6B', color: '#FFF', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', opacity: (nuevoContactoNombre.trim() && nuevoContactoEmail.trim()) ? 1 : 0.5 }}>
                  {editandoContacto ? '💾' : '+'}
                </button>
                {editandoContacto && (
                  <button type="button" onClick={cancelarEdicionContacto} style={{ padding: '6px 10px', background: '#F3F4F6', border: '1px solid #D1D5DB', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>×</button>
                )}
              </div>
            </div>

            {/* Lista de contactos */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {contactosFiltrados.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#9CA3AF', fontSize: '13px', padding: '20px' }}>Sin resultados</p>
              ) : (
                contactosFiltrados.map(c => (
                  <div key={c.id}
                    onDoubleClick={() => seleccionarDestinatario(c.email)}
                    style={{ padding: '6px 8px', borderRadius: '4px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F3F4F6'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>{c.nombre}</span>
                      <span style={{ fontSize: '12px', color: '#9CA3AF', marginLeft: '8px' }}>{c.email}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                      <button type="button" onClick={(e) => { e.stopPropagation(); editarContacto(c); }}
                        style={{ padding: '2px 5px', background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', fontSize: '13px' }}
                        title="Editar"><Pencil size={14} /></button>
                      <button type="button" onClick={(e) => { e.stopPropagation(); handleEliminarContacto(c.id); }}
                        style={{ padding: '2px 5px', background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: '13px' }}
                        title="Eliminar"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </button>
      )}

      {mostrarModal2FA && (
        <button type="button" style={{ ...estilos.modalOverlay, border: 'none' }} onClick={e => { if (e.target === e.currentTarget) setMostrarModal2FA(false); }}>
          <div style={{ ...estilos.modalContent, borderTop: '4px solid #1A3C6B', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 8px', color: '#1A3C6B' }}>🔐 Verificación 2FA</h3>
            <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 20px' }}>
              Ingresa el código de Google Authenticator para confirmar el envío
            </p>
            <input
              autoFocus type="text" inputMode="numeric" maxLength={6}
              value={codigo2FA} onChange={e => setCodigo2FA(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              style={{
                width: '160px', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '6px',
                fontSize: '24px', textAlign: 'center', letterSpacing: '8px', fontFamily: 'monospace',
                marginBottom: '16px'
              }}
              onKeyDown={e => { if (e.key === 'Enter') handleVerificar2FA(); }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button type="button" onClick={() => setMostrarModal2FA(false)} style={{
                padding: '10px 20px', background: '#F3F4F6', border: '1px solid #D1D5DB',
                borderRadius: '6px', cursor: 'pointer', fontWeight: 500
              }}>Cancelar</button>
              <button type="button" onClick={handleVerificar2FA} disabled={verificando2FA || codigo2FA.length !== 6} style={{
                padding: '10px 20px', background: codigo2FA.length === 6 ? '#1A3C6B' : '#9CA3AF',
                color: '#FFF', border: 'none', borderRadius: '6px', fontWeight: 600,
                cursor: codigo2FA.length === 6 ? 'pointer' : 'default'
              }}>
                {verificando2FA ? '⏳' : 'Verificar'}
              </button>
            </div>
          </div>
        </button>
      )}
    </div>
  );
}

const estilos: Record<string, React.CSSProperties> = {
  modalOverlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 9999,
  },
  modalContent: {
    background: '#FFF', borderRadius: '12px', padding: '24px',
    maxWidth: '400px', width: '90%', boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
  },
};
