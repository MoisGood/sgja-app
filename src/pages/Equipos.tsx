import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import QRCode from 'qrcode';
import { supabase } from '../lib/supabase';
import { handleError, showError, showSuccess } from '../utils/errorHandler';
import type { Equipo, Lugar } from '../types';

interface Props { idEstablecimiento: string }

const ESTADOS = ['Operativo', 'Con Fallas', 'En Reparación', 'Baja'];

export default function Equipos({ idEstablecimiento }: Props) {
  const [equipos, setEquipos] = useState<(Equipo & { lugar_nombre?: string; usuario_nombre?: string })[]>([]);
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [usuarios, setUsuarios] = useState<{ id: string; nombre: string; email: string }[]>([]);
  const [cargando, setCargando] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    nombre: '', marca: '', modelo: '', tipo_equipo: '', numero_serie: '',
    cod_inventario: '', estado: 'Operativo' as Equipo['estado'], id_lugar: '', id_usuario: '',
  });
  const [qrUrl, setQrUrl] = useState('');
  const [qrCargando, setQrCargando] = useState(false);
  const [busquedaUsuario, setBusquedaUsuario] = useState('');
  const [usuarioSelNombre, setUsuarioSelNombre] = useState('');
  const [sugerenciasUsuario, setSugerenciasUsuario] = useState<{ id: string; nombre: string; email: string }[]>([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [modalCrearUsuario, setModalCrearUsuario] = useState(false);
  const [nuevoUsuarioEmail, setNuevoUsuarioEmail] = useState('');
  const [creandoUsuario, setCreandoUsuario] = useState(false);
  const [tabEquipos, setTabEquipos] = useState<'equipos' | 'usuarios'>('equipos');

  // Scanner
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [escaneando, setEscaneando] = useState<'cod_inventario' | 'numero_serie' | null>(null);
  const [scannerError, setScannerError] = useState('');

  async function load() {
    const [eqRes, lugRes, usrRes] = await Promise.all([
      supabase.from('equipos').select('*').eq('id_establecimiento', idEstablecimiento).eq('activo', true).order('nombre'),
      supabase.from('lugares').select('*').eq('id_establecimiento', idEstablecimiento).eq('activo', true).order('nombre'),
      supabase.from('usuarios').select('id,nombre,email').eq('id_establecimiento', idEstablecimiento).not('email', 'like', 'eliminado_%@sgja.cl').order('nombre'),
    ]);
    if (eqRes.data) setEquipos(eqRes.data);
    if (lugRes.data) setLugares(lugRes.data);
    if (usrRes.data) setUsuarios(usrRes.data);
    setCargando(false);
  }

  useEffect(() => { if (idEstablecimiento) load(); }, [idEstablecimiento]);

  useEffect(() => {
    return () => { if (scannerRef.current) { scannerRef.current.stop().catch(() => {}); } };
  }, []);

  function detenerScanner() {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
    setEscaneando(null);
  }

  async function iniciarScanner(campo: 'cod_inventario' | 'numero_serie') {
    setScannerError('');
    if (escaneando) { detenerScanner(); return; }
    if (!navigator.mediaDevices?.getUserMedia) {
      setScannerError('Tu navegador no soporta cámara');
      return;
    }
    setEscaneando(campo);
    await new Promise(r => setTimeout(r, 50));
    try {
      const testStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      testStream.getTracks().forEach(t => t.stop());
    } catch {
      detenerScanner();
      setScannerError('Permiso de cámara denegado');
      return;
    }
    try {
      const scanner = new Html5Qrcode('barcode-reader', { verbose: false, formatsToSupport: [
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
        ],
      });
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 80 } },
        (texto) => {
          setForm(prev => ({ ...prev, [campo]: texto }));
          detenerScanner();
        },
        () => {},
      );
    } catch (err: any) {
      detenerScanner();
      setScannerError('Error al iniciar cámara: ' + (err?.message || ''));
    }
  }

  async function guardar() {
    if (!form.nombre.trim()) return;
    setQrUrl('');
    const payload: Record<string, any> = {
      nombre: form.nombre, id_establecimiento: idEstablecimiento,
      id_lugar: form.id_lugar || null, marca: form.marca || null,
      modelo: form.modelo || null, tipo_equipo: form.tipo_equipo || null,
      numero_serie: form.numero_serie || null,
      cod_inventario: form.cod_inventario || null,
      estado: form.estado,
      id_usuario: form.id_usuario || null,
    };
    if (editId) {
      const oldEquipo = equipos.find(e => e.id === editId);
      const oldNombre = oldEquipo?.nombre;
      const { error } = await supabase.from('equipos').update(payload).eq('id', editId);
      if (error) { showError('Error al actualizar: ' + error.message); return; }
      if (oldNombre && oldNombre !== payload.nombre && payload.id_lugar) {
        await supabase.from('ubicaciones').update({ dispositivo_nombre: payload.nombre })
          .eq('dispositivo_nombre', oldNombre).eq('id_lugar', payload.id_lugar);
      }
    } else {
      const { error: rpcErr } = await supabase.rpc('insertar_equipo', {
        p_nombre: payload.nombre,
        p_id_establecimiento: payload.id_establecimiento,
        p_id_lugar: payload.id_lugar,
        p_marca: payload.marca,
        p_modelo: payload.modelo,
        p_tipo_equipo: payload.tipo_equipo,
        p_numero_serie: payload.numero_serie,
        p_cod_inventario: payload.cod_inventario,
        p_estado: payload.estado,
      });
      if (rpcErr) {
        const { error: insertErr } = await supabase.from('equipos').insert(payload);
        if (insertErr) { showError('Error al crear equipo: ' + insertErr.message); return; }
      }
    }
    // Generar QR con datos del equipo
    setQrCargando(true);
    try {
      const qrText = [
        `Equipo: ${form.nombre}`,
        form.cod_inventario ? `Inventario: ${form.cod_inventario}` : '',
        form.numero_serie ? `S/N: ${form.numero_serie}` : '',
        form.marca ? `Marca: ${form.marca}` : '',
        form.modelo ? `Modelo: ${form.modelo}` : '',
      ].filter(Boolean).join('\n');
      const svg = await QRCode.toString(qrText, { type: 'svg', width: 200, margin: 1 });
      setQrUrl(`data:image/svg+xml,${encodeURIComponent(svg)}`);
    } catch { showError('Error al generar código QR'); }
    setQrCargando(false);
    setShowForm(false); setEditId(null);
    setForm({ nombre: '', marca: '', modelo: '', tipo_equipo: '', numero_serie: '', cod_inventario: '', estado: 'Operativo', id_lugar: '', id_usuario: '' });
    setBusquedaUsuario(''); setUsuarioSelNombre(''); setMostrarSugerencias(false);
    load();
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar este equipo?')) return;
    await supabase.from('equipos').update({ activo: false }).eq('id', id);
    load();
  }

  function editar(e: Equipo) {
    setForm({
      nombre: e.nombre, marca: e.marca || '', modelo: e.modelo || '',
      tipo_equipo: e.tipo_equipo || '', numero_serie: e.numero_serie || '',
      cod_inventario: e.cod_inventario || '', estado: e.estado,
      id_lugar: e.id_lugar || '', id_usuario: e.id_usuario || '',
    });
    const usr = usuarios.find(u => u.id === e.id_usuario);
    setBusquedaUsuario(usr ? usr.nombre : '');
    setUsuarioSelNombre(usr ? usr.nombre : '');
    setEditId(e.id);
    setQrUrl('');
    setShowForm(true);
  }

  if (cargando) return <p>⏳ Cargando equipos…</p>;

  const sBtn: React.CSSProperties = { padding: '6px 14px', borderRadius: 6, border: '1px solid #475569', background: '#0f172a', color: '#f1f5f9', fontSize: 13, cursor: 'pointer' };
  const sInp: React.CSSProperties = { width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #475569', background: '#1e293b', color: '#f1f5f9', fontSize: 13, boxSizing: 'border-box' };
  const sLab: React.CSSProperties = { fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 2 };
  const sIconBtn: React.CSSProperties = {
    padding: '4px 8px', borderRadius: 4, border: '1px solid #475569',
    background: '#1e293b', color: '#f1f5f9', fontSize: 14, cursor: 'pointer',
    lineHeight: 1, display: 'flex', alignItems: 'center',
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: '#1A3C6B', margin: 0 }}>🖥️ Equipos</h1>
        <button onClick={() => {
          setEditId(null);
          setForm({ nombre: '', marca: '', modelo: '', tipo_equipo: '', numero_serie: '', cod_inventario: '', estado: 'Operativo', id_lugar: '', id_usuario: '' });
          setQrUrl('');
          setBusquedaUsuario(''); setUsuarioSelNombre(''); setMostrarSugerencias(false);
          setShowForm(true);
        }} style={sBtn}>➕ Nuevo</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['equipos', 'usuarios'] as const).map(t => (
          <button key={t} onClick={() => setTabEquipos(t)}
            style={{
              padding: '8px 16px', borderRadius: 8, border: 'none',
              background: tabEquipos === t ? '#1A3C6B' : '#F3F4F6',
              color: tabEquipos === t ? '#fff' : '#374151',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
            {t === 'equipos' ? '🔧 Equipos' : '👤 Usuarios'}
          </button>
        ))}
      </div>

      {tabEquipos === 'usuarios' ? (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#0f172a', color: '#94a3b8' }}>
                <th style={thS}>Usuario</th><th style={thS}>Correo</th><th style={thS}>Lugar</th><th style={thS}>Equipo</th><th style={thS}>Cód. Inventario</th><th style={thS}>Estado</th><th style={thS}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const rows = usuarios
                  .filter(u => equipos.some(e => e.id_usuario === u.id))
                  .flatMap(u => equipos.filter(e => e.id_usuario === u.id).map(eq => ({ u, eq })));
                return rows.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24, color: '#64748b' }}>Sin usuarios con equipos asignados</td></tr>
                ) : rows.map(({ u, eq }) => (
                  <tr key={eq.id} style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={tdS}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span>👤</span> {u.nombre}
                      </span>
                    </td>
                    <td style={{ ...tdS, color: '#94a3b8', fontSize: 12 }}>{u.email}</td>
                    <td style={tdS}>{lugares.find(l => l.id === eq.id_lugar)?.nombre || '—'}</td>
                    <td style={tdS}>{eq.nombre}</td>
                    <td style={{ ...tdS, color: '#94a3b8' }}>{eq.cod_inventario || '—'}</td>
                    <td style={tdS}><EstadoBadge estado={eq.estado} /></td>
                    <td style={tdS}>
                      <button onClick={() => editar(eq)} style={{ ...sBtn, padding: '3px 8px', fontSize: 11, marginRight: 4 }}>✏️</button>
                      <button onClick={() => eliminar(eq.id)} style={{ ...sBtn, padding: '3px 8px', fontSize: 11 }}>🗑️</button>
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      ) : (
        <>

      {showForm && (
        <div style={{ background: '#0f172a', border: '1px solid #475569', borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))', gap: 10 }}>
            {[
              { label: 'Nombre', field: 'nombre' },
              { label: 'Marca', field: 'marca' },
              { label: 'Modelo', field: 'modelo' },
              { label: 'Tipo', field: 'tipo_equipo' },
            ].map(({ label, field }) => (
              <div key={field}>
                <label style={sLab}>{label}</label>
                <input value={(form as any)[field]} onChange={e => setForm({ ...form, [field]: e.target.value })} style={sInp} />
              </div>
            ))}
            {/* N° Serie con cámara */}
            <div>
              <label style={sLab}>N° Serie</label>
              <div style={{ display: 'flex', gap: 4 }}>
                <input value={form.numero_serie} onChange={e => setForm({ ...form, numero_serie: e.target.value })} style={{ ...sInp, flex: 1 }} />
                <button onClick={() => iniciarScanner('numero_serie')} style={sIconBtn} title="Escanear código de barras">
                  📷
                </button>
              </div>
            </div>
            {/* Código Inventario con cámara */}
            <div>
              <label style={sLab}>Cód. Inventario</label>
              <div style={{ display: 'flex', gap: 4 }}>
                <input value={form.cod_inventario} onChange={e => setForm({ ...form, cod_inventario: e.target.value })} style={{ ...sInp, flex: 1 }} />
                <button onClick={() => iniciarScanner('cod_inventario')} style={sIconBtn} title="Escanear código de barras">
                  📷
                </button>
              </div>
            </div>
            <div>
              <label style={sLab}>Estado</label>
              <select value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value as Equipo['estado'] })} style={sInp}>
                {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label style={sLab}>Ubicación</label>
              <select value={form.id_lugar} onChange={e => setForm({ ...form, id_lugar: e.target.value })} style={sInp}>
                <option value="">— Sin lugar —</option>
                {lugares.map(l => <option key={l.id} value={l.id} disabled={l.soporte === false} style={{ opacity: l.soporte === false ? 0.5 : 1 }}>{l.nombre} (Piso {l.piso}){l.soporte === false ? ' 🔒' : ''}</option>)}
              </select>
            </div>
            {/* Usuario asignado */}
            <div style={{ position: 'relative' }}>
              <label style={sLab}>Usuario asignado</label>
              <input value={busquedaUsuario}
                onChange={e => {
                  setBusquedaUsuario(e.target.value);
                  setForm({ ...form, id_usuario: '' });
                  setUsuarioSelNombre('');
                  if (e.target.value.length >= 1) {
                    const filtrados = usuarios.filter(u =>
                      u.nombre.toLowerCase().includes(e.target.value.toLowerCase()) ||
                      u.email.toLowerCase().includes(e.target.value.toLowerCase())
                    ).slice(0, 8);
                    setSugerenciasUsuario(filtrados);
                    setMostrarSugerencias(true);
                  } else {
                    setSugerenciasUsuario([]);
                    setMostrarSugerencias(false);
                  }
                }}
                onFocus={() => { if (busquedaUsuario.length >= 1 && sugerenciasUsuario.length > 0) setMostrarSugerencias(true); }}
                onBlur={() => setTimeout(() => setMostrarSugerencias(false), 200)}
                placeholder="Buscar por nombre o email…"
                style={{ ...sInp, boxSizing: 'border-box' }} />
              {mostrarSugerencias && sugerenciasUsuario.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#1e293b', border: '1px solid #475569', borderRadius: 4, zIndex: 10, maxHeight: 200, overflowY: 'auto' }}>
                  {sugerenciasUsuario.map(u => (
                    <div key={u.id} onMouseDown={() => { setForm({ ...form, id_usuario: u.id }); setBusquedaUsuario(u.nombre); setUsuarioSelNombre(u.nombre); setMostrarSugerencias(false); }}
                      style={{ padding: '6px 10px', cursor: 'pointer', fontSize: 13, color: '#f1f5f9', borderBottom: '1px solid #334155' }}>
                      <div>{u.nombre}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{u.email}</div>
                    </div>
                  ))}
                </div>
              )}
              {mostrarSugerencias && busquedaUsuario.length >= 1 && sugerenciasUsuario.length === 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#1e293b', border: '1px solid #475569', borderRadius: 4, zIndex: 10, padding: 8 }}>
                  <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 6px' }}>No se encontró el usuario.</p>
                  <button onMouseDown={() => { setMostrarSugerencias(false); setModalCrearUsuario(true); }}
                    style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>
                    + Crear usuario
                  </button>
                </div>
              )}
              {usuarioSelNombre && !mostrarSugerencias && form.id_usuario && (
                <p style={{ fontSize: 11, color: '#4ade80', margin: '2px 0 0' }}>✓ {usuarioSelNombre}</p>
              )}
            </div>
          </div>

          {/* Scanner inline */}
          {escaneando && (
            <div style={{ marginTop: 10 }}>
              <div style={{ position: 'relative', background: '#000', borderRadius: 6, overflow: 'hidden', maxWidth: 320 }}>
                <div id="barcode-reader" style={{ width: '100%', minHeight: 180 }} />
              </div>
              <div style={{ marginTop: 6, display: 'flex', gap: 8, alignItems: 'center' }}>
                <button onClick={detenerScanner} style={{ ...sBtn, background: '#dc2626' }}>✕ Cancelar</button>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>Enfoca el código de barras</span>
              </div>
            </div>
          )}
          {scannerError && <p style={{ fontSize: 11, color: '#fca5a5', marginTop: 6 }}>⚠️ {scannerError}</p>}

          {/* QR generado */}
          {qrUrl && (
            <div style={{ marginTop: 12, textAlign: 'center', padding: 12, background: '#1e293b', borderRadius: 8 }}>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 6px' }}>📱 Código QR del equipo</p>
              <img src={qrUrl} alt="QR equipo" style={{ width: 150, height: 150 }} />
            </div>
          )}

          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button onClick={guardar} style={{ ...sBtn, background: '#1e40af' }}>
              {qrCargando ? '⏳' : editId ? 'Actualizar' : 'Guardar'}
            </button>
            <button onClick={() => { setShowForm(false); setEditId(null); setQrUrl(''); }} style={sBtn}>Cancelar</button>
          </div>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#0f172a', color: '#94a3b8' }}>
              <th style={thS}>Nombre</th>
              <th style={thS}>Usuario</th>
              <th style={thS}>Cod. Inventario</th>
              <th style={thS}>Marca</th>
              <th style={thS}>Modelo</th>
              <th style={thS}>Tipo</th>
              <th style={thS}>N° Serie</th>
              <th style={thS}>Estado</th>
              <th style={thS}>Ubicación</th>
              <th style={thS}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {equipos.map(e => (
              <tr key={e.id} style={{ borderBottom: '1px solid #1e293b' }}>
                <td style={tdS}>{e.nombre}</td>
                <td style={{ ...tdS, fontSize: 12 }}>{e.id_usuario ? (usuarios.find(u => u.id === e.id_usuario)?.nombre || '—') : '—'}</td>
                <td style={tdS}>{e.cod_inventario || '—'}</td>
                <td style={tdS}>{e.marca || '—'}</td>
                <td style={tdS}>{e.modelo || '—'}</td>
                <td style={tdS}>{e.tipo_equipo || '—'}</td>
                <td style={tdS}>{e.numero_serie || '—'}</td>
                <td style={tdS}><EstadoBadge estado={e.estado} /></td>
                <td style={tdS}>{lugares.find(l => l.id === e.id_lugar)?.nombre || '—'}</td>
                <td style={tdS}>
                  <button onClick={() => editar(e)} style={{ ...sBtn, padding: '3px 8px', fontSize: 11, marginRight: 4 }}>✏️</button>
                  <button onClick={() => eliminar(e.id)} style={{ ...sBtn, padding: '3px 8px', fontSize: 11 }}>🗑️</button>
                </td>
              </tr>
            ))}
            {equipos.length === 0 && <tr><td colSpan={10} style={{ textAlign: 'center', padding: 24, color: '#64748b' }}>Sin equipos registrados</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Modal Crear Usuario */}
      {modalCrearUsuario && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, padding: 24, maxWidth: 400, width: '90%' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, color: '#f1f5f9' }}>➕ Crear Usuario</h3>
            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12 }}>El usuario recibirá un correo para completar su registro.</p>
            <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Correo electrónico *</label>
            <input value={nuevoUsuarioEmail} onChange={e => setNuevoUsuarioEmail(e.target.value)} placeholder="correo@ejemplo.cl"
              style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #475569', background: '#1e293b', color: '#f1f5f9', fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 16 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={async () => {
                if (!nuevoUsuarioEmail.trim()) return;
                setCreandoUsuario(true);
                // Guardar sesión actual del admin antes de crear usuario
                const { data: { session } } = await supabase.auth.getSession();
                const { data, error } = await supabase.auth.signUp({ email: nuevoUsuarioEmail.trim(), password: Math.random().toString(36).slice(-8) });
                // Restaurar sesión del admin inmediatamente
                if (session) {
                  await supabase.auth.setSession({ access_token: session.access_token, refresh_token: session.refresh_token });
                }
                if (error) { handleError(error, 'Error al crear usuario'); setCreandoUsuario(false); return; }
                const uid = data.user?.id;
                if (!uid) { showError('Error: no se pudo crear el usuario'); setCreandoUsuario(false); return; }
                const { error: insertError } = await supabase.from('solicitudes_registro').insert({
                  uid,
                  nombre: nuevoUsuarioEmail.trim().split('@')[0],
                  apellidos: '',
                  correo: nuevoUsuarioEmail.trim(),
                  estado: 'pendiente',
                });
                if (insertError) { handleError(insertError, 'Error al crear solicitud'); setCreandoUsuario(false); return; }
                setModalCrearUsuario(false);
                setNuevoUsuarioEmail('');
                setCreandoUsuario(false);
                showSuccess('Solicitud de registro enviada');
              }} disabled={creandoUsuario || !nuevoUsuarioEmail.trim()}
                style={{
                  flex: 1, padding: '10px', borderRadius: 8, border: 'none',
                  background: creandoUsuario || !nuevoUsuarioEmail.trim() ? '#334155' : '#2563eb',
                  color: '#fff', fontSize: 13, fontWeight: 600, cursor: creandoUsuario || !nuevoUsuarioEmail.trim() ? 'not-allowed' : 'pointer',
                }}>
                {creandoUsuario ? '⏳ Creando…' : 'Crear usuario'}
              </button>
              <button onClick={() => { setModalCrearUsuario(false); setNuevoUsuarioEmail(''); }}
                style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #475569', background: 'transparent', color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}

const thS: React.CSSProperties = { padding: '8px 10px', textAlign: 'left', fontWeight: 500, fontSize: 12, borderBottom: '2px solid #334155' };
const tdS: React.CSSProperties = { padding: '8px 10px', borderBottom: '1px solid #1e293b' };

function EstadoBadge({ estado }: { estado: string }) {
  const colors: Record<string, string> = { 'Operativo': '#22c55e', 'Con Fallas': '#f59e0b', 'En Reparación': '#ef4444', 'Baja': '#64748b' };
  return <span style={{ background: colors[estado] || '#64748b', color: '#0f172a', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600 }}>{estado}</span>;
}
