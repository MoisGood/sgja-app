import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import QRCode from 'qrcode';
import { Wrench, Camera, X, Loader, Pencil, Trash2, User, Plus, Image as ImageIcon } from 'lucide-react';
import MobileSwipeWrapper from '../components/MobileSwipeWrapper';
import { supabase } from '../lib/supabase';
import { tecnicoCache } from '../services/tecnicoCache';
import { handleError, showError, showSuccess } from '../utils/errorHandler';
import { subirFotoEquipo } from '../services/evidenciaService';
import { decodificarBarcode } from '../services/barcodeDecoder';
import type { Equipo, Lugar } from '../types';

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' as const } },
};

interface Props { idEstablecimiento: string }

const ESTADOS = ['Operativo', 'Con Fallas', 'En Reparación', 'Baja'];
const ESTADO_COLORS: Record<string, string> = {
  Operativo: '#16a34a', 'Con Fallas': '#ea580c',
  'En Reparación': '#ca8a04', Baja: '#6b7280',
};

const POR_PAGINA = 15;

export default function MobileEquipos({ idEstablecimiento }: Props) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const idLugarFiltro = searchParams.get('id_lugar') || '';
  const [equipos, setEquipos] = useState<(Equipo & { lugar_nombre?: string; usuario_nombre?: string })[]>([]);
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [usuarios, setUsuarios] = useState<{id: string; nombre: string; email: string}[]>([]);
  const [sugerenciasTipo, setSugerenciasTipo] = useState<string[]>([]);
  const [limite, setLimite] = useState(POR_PAGINA);
  const centinelaRef = useRef<HTMLDivElement | null>(null);
  const [cargando, setCargando] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    nombre: '', marca: '', modelo: '', tipo_equipo: '', numero_serie: '',
    cod_inventario: '', estado: 'Operativo' as Equipo['estado'], id_lugar: '', id_usuario: '',
    foto_url: '',
  });
  const [, setPendingFoto] = useState<File | null>(null);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const camaraInputRef = useRef<HTMLInputElement | null>(null);
  const galeriaInputRef = useRef<HTMLInputElement | null>(null);
  const dmInputRef = useRef<HTMLInputElement | null>(null);
  const [qrUrl, setQrUrl] = useState('');

  const [busquedaUsuario, setBusquedaUsuario] = useState('');
  const [usuarioSelNombre, setUsuarioSelNombre] = useState('');
  const [sugerenciasUsuario, setSugerenciasUsuario] = useState<{id:string;nombre:string;email:string}[]>([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [mostrarSugTipos, setMostrarSugTipos] = useState(false);
  const [sugTiposFiltradas, setSugTiposFiltradas] = useState<string[]>([]);
  const [modalCrearUsuario, setModalCrearUsuario] = useState(false);
  const [nuevoUsuarioEmail, setNuevoUsuarioEmail] = useState('');
  const [creandoUsuario, setCreandoUsuario] = useState(false);
  const [tabEquipos, setTabEquipos] = useState<'equipos' | 'usuarios'>('equipos');
  const [sugerenciasNombre, setSugerenciasNombre] = useState<string[]>([]);
  const [sugNombreFiltradas, setSugNombreFiltradas] = useState<string[]>([]);
  const [mostrarSugNombre, setMostrarSugNombre] = useState(false);
  const [sugerenciasMarca, setSugerenciasMarca] = useState<string[]>([]);
  const [sugMarcaFiltradas, setSugMarcaFiltradas] = useState<string[]>([]);
  const [mostrarSugMarca, setMostrarSugMarca] = useState(false);
  const [sugerenciasModelo, setSugerenciasModelo] = useState<string[]>([]);
  const [sugModeloFiltradas, setSugModeloFiltradas] = useState<string[]>([]);
  const [mostrarSugModelo, setMostrarSugModelo] = useState(false);
  const [busquedaLugar, setBusquedaLugar] = useState('');
  const [lugarSelNombre, setLugarSelNombre] = useState('');
  const [sugerenciasLugar, setSugerenciasLugar] = useState<Lugar[]>([]);
  const [mostrarSugLugar, setMostrarSugLugar] = useState(false);
  const [dmImageUrl, setDmImageUrl] = useState<string | null>(null);
  const [dmZoom, setDmZoom] = useState(0.65);
  const [dmRotacion, setDmRotacion] = useState(0);
  const [dmPanX, setDmPanX] = useState(0);
  const [dmPanY, setDmPanY] = useState(0);
  const dmPanning = useRef(false);
  const dmPanStart = useRef({ x: 0, y: 0 });
  const dmCropRef = useRef<HTMLDivElement | null>(null);
  const dmImgRef = useRef<HTMLImageElement | null>(null);
  const barcodeInputRef = useRef<HTMLInputElement | null>(null);
  const [campoBarcode, setCampoBarcode] = useState<'numero_serie' | 'cod_inventario' | null>(null);

  useEffect(() => { if (idEstablecimiento) load(); }, [idEstablecimiento]);

  async function scanBarcode(campo: 'numero_serie' | 'cod_inventario') {
    setCampoBarcode(campo);
    requestAnimationFrame(() => barcodeInputRef.current?.click());
  }

  async function procesarBarcode(file: File) {
    if (!campoBarcode) return;
    const result = await decodificarBarcode(file);
    if (result) {
      setForm(prev => ({ ...prev, [campoBarcode!]: result.text }));
      showSuccess('Código detectado: ' + result.text);
    } else {
      showError('No se pudo decodificar ningún código.');
    }
    setCampoBarcode(null);
    if (barcodeInputRef.current) barcodeInputRef.current.value = '';
  }

  async function load() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate('/login'); return; }
    const { error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) { navigate('/login'); return; }

    const cached = await tecnicoCache.getAll(idEstablecimiento);
    if (cached) {
      setEquipos(cached.equipos);
      setLugares(cached.lugares);
      setCargando(false);
    }

    const [eqRes, lugRes, usrRes, tipoEqRes, tipoCatRes] = await Promise.all([
      supabase.from('equipos').select('*').eq('id_establecimiento', idEstablecimiento).eq('activo', true).order('nombre'),
      supabase.from('lugares').select('*').eq('id_establecimiento', idEstablecimiento).eq('activo', true).order('nombre'),
      supabase.from('usuarios').select('id, nombre, email').eq('id_establecimiento', idEstablecimiento).eq('activo', true).order('nombre'),
      supabase.from('equipos').select('tipo_equipo').eq('id_establecimiento', idEstablecimiento).eq('activo', true).not('tipo_equipo', 'is', null),
      supabase.from('configuracion_dispositivos').select('nombre').eq('activo', true),
    ]);
    if (eqRes.data) {
      setEquipos(eqRes.data);
      const nombres = [...new Set(eqRes.data.map(e => e.nombre).filter(Boolean))] as string[];
      const marcas = [...new Set(eqRes.data.map(e => e.marca).filter(Boolean))] as string[];
      const modelos = [...new Set(eqRes.data.map(e => e.modelo).filter(Boolean))] as string[];
      setSugerenciasNombre(nombres);
      setSugerenciasMarca(marcas);
      setSugerenciasModelo(modelos);
    }
    if (lugRes.data) setLugares(lugRes.data);
    if (usrRes.data) setUsuarios(usrRes.data);
    const tiposHistoricos = [...new Set((tipoEqRes.data || []).map(r => r.tipo_equipo).filter(Boolean))] as string[];
    const tiposCatalogo = (tipoCatRes.data || []).map(r => r.nombre);
    setSugerenciasTipo([...new Set([...tiposCatalogo, ...tiposHistoricos])]);
    setCargando(false);
  }

  async function manejarFoto(file: File) {
    setPendingFoto(file);
    const previewUrl = URL.createObjectURL(file);
    setForm(prev => ({ ...prev, foto_url: previewUrl }));
    setSubiendoFoto(true);
    const { url, error } = await subirFotoEquipo(idEstablecimiento, file);
    setSubiendoFoto(false);
    if (error) { showError('Error al subir foto: ' + error); return; }
    if (url) setForm(prev => ({ ...prev, foto_url: url }));
    setPendingFoto(null);
  }

  async function scanDataMatrix(file: File) {
    const url = URL.createObjectURL(file);
    setDmImageUrl(url);
    setDmZoom(0.65);
    setDmRotacion(0);
    setDmPanX(0);
    setDmPanY(0);
    const result = await decodificarBarcode(file);
    if (result) {
      setForm(prev => ({ ...prev, numero_serie: result.text }));
      cerrarDmScanner();
      showSuccess('Código detectado: ' + result.text);
    }
  }

  function cerrarDmScanner() {
    setDmImageUrl(null);
    if (dmInputRef.current) dmInputRef.current.value = '';
  }

  function renderCrop(): HTMLCanvasElement | null {
    if (!dmCropRef.current || !dmImgRef.current) return null;
    const style = getComputedStyle(dmImgRef.current);
    if (!style.transform || style.transform === 'none') return null;
    const matrix = new DOMMatrix(style.transform);
    const scale = Math.sqrt(matrix.a * matrix.a + matrix.b * matrix.b);
    if (scale === 0) return null;
    const cont = dmCropRef.current.getBoundingClientRect();
    const imgPoint = matrix.inverse().transformPoint({ x: cont.width / 2, y: cont.height / 2 });
    const OVERLAY = 280;
    const half = (OVERLAY / 2) / scale;
    const OUT = 512;
    const canvas = document.createElement('canvas');
    canvas.width = OUT;
    canvas.height = OUT;
    canvas.getContext('2d')!.drawImage(dmImgRef.current, imgPoint.x - half, imgPoint.y - half, half * 2, half * 2, 0, 0, OUT, OUT);
    return canvas;
  }

  function descargarCrop() {
    const canvas = renderCrop();
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'dm-crop.png';
    link.href = canvas.toDataURL();
    link.click();
  }

  async function cropAndDecode() {
    const canvas = renderCrop();
    if (!canvas) { showError('Error al procesar la imagen.'); return; }
    const result = await decodificarBarcode(canvas);
    if (result) {
      setForm(prev => ({ ...prev, numero_serie: result.text }));
      cerrarDmScanner();
      showSuccess('Código detectado: ' + result.text);
    } else {
      showError('No se detectó ningún código en la imagen recortada. Ajusta zoom/rotación/recorte e intenta de nuevo.');
    }
  }

  function removerFoto() {
    setForm(prev => ({ ...prev, foto_url: '' }));
    setPendingFoto(null);
    if (camaraInputRef.current) camaraInputRef.current.value = '';
    if (galeriaInputRef.current) galeriaInputRef.current.value = '';
  }

  async function guardar() {
    if (!form.nombre.trim()) return;
    setQrUrl('');

    // Validar que el equipo no esté ya registrado en otra ubicación
    if (form.numero_serie) {
      const { data: dupe } = await supabase
        .from('equipos')
        .select('id, id_lugar')
        .eq('numero_serie', form.numero_serie)
        .eq('id_establecimiento', idEstablecimiento)
        .eq('activo', true)
        .neq('id', editId || '')
        .limit(1)
        .maybeSingle();
      if (dupe && dupe.id_lugar && dupe.id_lugar !== form.id_lugar) {
        showError(`El equipo con N° Serie ${form.numero_serie} ya está registrado en otra ubicación.`);
        return;
      }
    }
    if (form.cod_inventario) {
      const { data: dupe } = await supabase
        .from('equipos')
        .select('id, id_lugar')
        .eq('cod_inventario', form.cod_inventario)
        .eq('id_establecimiento', idEstablecimiento)
        .eq('activo', true)
        .neq('id', editId || '')
        .limit(1)
        .maybeSingle();
      if (dupe && dupe.id_lugar && dupe.id_lugar !== form.id_lugar) {
        showError(`El equipo con Cód. Inventario ${form.cod_inventario} ya está registrado en otra ubicación.`);
        return;
      }
    }

    const payload: Record<string, any> = {
      nombre: form.nombre, id_establecimiento: idEstablecimiento,
      id_lugar: form.id_lugar || null, id_usuario: form.id_usuario || null,
      marca: form.marca || null,
      modelo: form.modelo || null, tipo_equipo: form.tipo_equipo || null,
      numero_serie: form.numero_serie || null,
      cod_inventario: form.cod_inventario || null, estado: form.estado,
      foto_url: form.foto_url || null,
    };
    if (editId) {
      await supabase.from('equipos').update(payload).eq('id', editId);
    } else {
      const { error: rpcErr } = await supabase.rpc('insertar_equipo', {
        p_nombre: payload.nombre, p_id_establecimiento: payload.id_establecimiento,
        p_id_lugar: payload.id_lugar, p_marca: payload.marca, p_modelo: payload.modelo,
        p_tipo_equipo: payload.tipo_equipo, p_numero_serie: payload.numero_serie,
        p_cod_inventario: payload.cod_inventario, p_estado: payload.estado,
        p_id_usuario: payload.id_usuario, p_foto_url: payload.foto_url,
      });
      if (rpcErr) await supabase.from('equipos').insert(payload);
    }
    try {
      const qrText = [
        `Equipo: ${form.nombre}`,
        form.cod_inventario ? `Inventario: ${form.cod_inventario}` : '',
        form.numero_serie ? `S/N: ${form.numero_serie}` : '',
      ].filter(Boolean).join('\n');
      const svg = await QRCode.toString(qrText, { type: 'svg', width: 200, margin: 1 });
      setQrUrl(`data:image/svg+xml,${encodeURIComponent(svg)}`);
    } catch { /* ignore */ }
    setShowForm(false); setEditId(null);
            setForm({ nombre: '', marca: '', modelo: '', tipo_equipo: '', numero_serie: '', cod_inventario: '', estado: 'Operativo', id_lugar: '', id_usuario: '', foto_url: '' });
    setBusquedaUsuario(''); setUsuarioSelNombre(''); setBusquedaLugar(''); setLugarSelNombre('');
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
      foto_url: e.foto_url || '',
    });
    const usr = usuarios.find(u => u.id === e.id_usuario);
    setBusquedaUsuario(usr ? usr.nombre : '');
    setUsuarioSelNombre(usr ? usr.nombre : '');
    const lug = lugares.find(l => l.id === e.id_lugar);
    setBusquedaLugar(lug ? lug.nombre : '');
    setLugarSelNombre(lug ? lug.nombre : '');
    setEditId(e.id); setQrUrl(''); setShowForm(true);
  }

  const sInpMob: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    border: '1px solid #E5E7EB', background: '#fff', color: '#1F2937',
    fontSize: 14, boxSizing: 'border-box',
  };

  const equiposFiltrados = useMemo(() => {
    return !idLugarFiltro ? equipos : equipos.filter(e => e.id_lugar === idLugarFiltro);
  }, [equipos, idLugarFiltro]);

  const cargarMas = useCallback(() => {
    if (limite < equiposFiltrados.length) setLimite(prev => Math.min(prev + POR_PAGINA, equiposFiltrados.length));
  }, [limite, equiposFiltrados.length]);

  useEffect(() => {
    if (!centinelaRef.current) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) cargarMas();
    }, { rootMargin: '100px' });
    obs.observe(centinelaRef.current);
    return () => obs.disconnect();
  }, [cargarMas, equiposFiltrados.length, limite]);

  const lugarFiltroNombre = idLugarFiltro ? lugares.find(l => l.id === idLugarFiltro)?.nombre : null;
  useEffect(() => { setLimite(POR_PAGINA); }, [idLugarFiltro]);

  return (
    <MobileSwipeWrapper>
    <div style={{ padding: 16, maxWidth: 500, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1A3C6B', margin: 0, flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Wrench size={20} /> Equipos
        </h1>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setEditId(null); setForm({ nombre: '', marca: '', modelo: '', tipo_equipo: '', numero_serie: '', cod_inventario: '', estado: 'Operativo', id_lugar: idLugarFiltro || '', id_usuario: '', foto_url: '' }); setBusquedaUsuario(''); setUsuarioSelNombre(''); setBusquedaLugar(''); setLugarSelNombre(''); setQrUrl(''); setPendingFoto(null); if (camaraInputRef.current) camaraInputRef.current.value = ''; if (galeriaInputRef.current) galeriaInputRef.current.value = ''; setShowForm(true); }} style={{
          padding: '8px 16px', borderRadius: 8, border: 'none',
          background: '#1e40af', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>+ Nuevo</motion.button>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {(['equipos', 'usuarios'] as const).map(t => (
          <button key={t} onClick={() => setTabEquipos(t)}
            style={{
              flex: 1, padding: '8px', borderRadius: 8, border: 'none',
              background: tabEquipos === t ? '#1A3C6B' : '#F3F4F6',
              color: tabEquipos === t ? '#fff' : '#374151',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
            {t === 'equipos' ? '🔧 Equipos' : '👤 Usuarios'}
          </button>
        ))}
      </div>

      {tabEquipos === 'usuarios' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(() => {
            const usuariosConEquipos = usuarios.filter(u => equipos.some(e => e.id_usuario === u.id));
            return usuariosConEquipos.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 13, padding: 24 }}>Sin usuarios con equipos asignados</p>
            ) : usuariosConEquipos.map(u => {
              const eqs = equipos.filter(e => e.id_usuario === u.id);
              return (
                <motion.div key={u.id} variants={itemVariants}
                  style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '12px 14px' }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#1F2937', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <User size={16} /> {u.nombre}
                    <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 400 }}>({eqs.length})</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>{u.email}</div>
                  <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {eqs.map(eq => (
                      <div key={eq.id} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '6px 10px', background: '#F9FAFB', borderRadius: 8, fontSize: 13,
                      }}>
                        <span>{eq.nombre}</span>
                        <span style={{
                          padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                          background: `${ESTADO_COLORS[eq.estado] || '#6b7280'}18`,
                          color: ESTADO_COLORS[eq.estado] || '#6b7280',
                        }}>{eq.estado}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            });
          })()}
        </div>
      ) : (
        <>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 16, marginBottom: 12 }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ position: 'relative' }}>
              <input value={form.nombre}
                onChange={e => {
                  setForm({ ...form, nombre: e.target.value });
                  const filtradas = sugerenciasNombre.filter(s =>
                    s.toLowerCase().includes(e.target.value.toLowerCase())
                  ).slice(0, 10);
                  setSugNombreFiltradas(filtradas);
                  setMostrarSugNombre(e.target.value.length > 0 && filtradas.length > 0);
                }}
                onFocus={() => { if (sugNombreFiltradas.length > 0) setMostrarSugNombre(true); }}
                onBlur={() => setTimeout(() => setMostrarSugNombre(false), 200)}
                placeholder="Nombre" style={sInpMob} />
              {mostrarSugNombre && sugNombreFiltradas.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, zIndex: 20, maxHeight: 180, overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  {sugNombreFiltradas.map(s => (
                    <div key={s} onMouseDown={() => { setForm({ ...form, nombre: s }); setMostrarSugNombre(false); }}
                      style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, color: '#1F2937', borderBottom: '1px solid #F3F4F6' }}>
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input value={form.marca}
                  onChange={e => {
                    setForm({ ...form, marca: e.target.value });
                    const filtradas = sugerenciasMarca.filter(s =>
                      s.toLowerCase().includes(e.target.value.toLowerCase())
                    ).slice(0, 10);
                    setSugMarcaFiltradas(filtradas);
                    setMostrarSugMarca(e.target.value.length > 0 && filtradas.length > 0);
                  }}
                  onFocus={() => { if (sugMarcaFiltradas.length > 0) setMostrarSugMarca(true); }}
                  onBlur={() => setTimeout(() => setMostrarSugMarca(false), 200)}
                  placeholder="Marca" style={sInpMob} />
                {mostrarSugMarca && sugMarcaFiltradas.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, zIndex: 20, maxHeight: 180, overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    {sugMarcaFiltradas.map(s => (
                      <div key={s} onMouseDown={() => { setForm({ ...form, marca: s }); setMostrarSugMarca(false); }}
                        style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, color: '#1F2937', borderBottom: '1px solid #F3F4F6' }}>
                        {s}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ position: 'relative', flex: 1 }}>
                <input value={form.modelo}
                  onChange={e => {
                    setForm({ ...form, modelo: e.target.value });
                    const filtradas = sugerenciasModelo.filter(s =>
                      s.toLowerCase().includes(e.target.value.toLowerCase())
                    ).slice(0, 10);
                    setSugModeloFiltradas(filtradas);
                    setMostrarSugModelo(e.target.value.length > 0 && filtradas.length > 0);
                  }}
                  onFocus={() => { if (sugModeloFiltradas.length > 0) setMostrarSugModelo(true); }}
                  onBlur={() => setTimeout(() => setMostrarSugModelo(false), 200)}
                  placeholder="Modelo" style={sInpMob} />
                {mostrarSugModelo && sugModeloFiltradas.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, zIndex: 20, maxHeight: 180, overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    {sugModeloFiltradas.map(s => (
                      <div key={s} onMouseDown={() => { setForm({ ...form, modelo: s }); setMostrarSugModelo(false); }}
                        style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, color: '#1F2937', borderBottom: '1px solid #F3F4F6' }}>
                        {s}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div style={{ position: 'relative' }}>
              <input value={form.tipo_equipo}
                onChange={e => {
                  setForm({ ...form, tipo_equipo: e.target.value });
                  const filtradas = sugerenciasTipo.filter(s =>
                    s.toLowerCase().includes(e.target.value.toLowerCase())
                  ).slice(0, 10);
                  setSugTiposFiltradas(filtradas);
                  setMostrarSugTipos(e.target.value.length > 0 && filtradas.length > 0);
                }}
                onFocus={() => { if (sugTiposFiltradas.length > 0) setMostrarSugTipos(true); }}
                onBlur={() => setTimeout(() => setMostrarSugTipos(false), 200)}
                placeholder="Tipo" style={sInpMob} />
              {mostrarSugTipos && sugTiposFiltradas.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, zIndex: 20, maxHeight: 180, overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  {sugTiposFiltradas.map(s => (
                    <div key={s} onMouseDown={() => { setForm({ ...form, tipo_equipo: s }); setMostrarSugTipos(false); }}
                      style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, color: '#1F2937', borderBottom: '1px solid #F3F4F6' }}>
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <input value={form.numero_serie} onChange={e => setForm({ ...form, numero_serie: e.target.value })} placeholder="N° Serie" style={{ ...sInpMob, flex: 1 }} />
              <button onClick={() => scanBarcode('numero_serie')} style={{
                padding: '10px', borderRadius: 8, border: '1px solid #E5E7EB',
                background: '#fff', lineHeight: 1, display: 'flex',
              }}><Camera size={18} /></button>
              <button onClick={() => dmInputRef.current?.click()} title="Escanear Data Matrix (foto)" style={{
                padding: '10px', borderRadius: 8, border: '1px solid #E5E7EB',
                background: '#fff', lineHeight: 1, display: 'flex', alignItems: 'center', fontSize: 10, fontWeight: 600, color: '#6366f1',
              }}>DM</button>
            </div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <input value={form.cod_inventario} onChange={e => setForm({ ...form, cod_inventario: e.target.value })} placeholder="Cód. Inventario" style={{ ...sInpMob, flex: 1 }} />
              <button onClick={() => scanBarcode('cod_inventario')} style={{
                padding: '10px', borderRadius: 8, border: '1px solid #E5E7EB',
                background: '#fff', lineHeight: 1, display: 'flex',
              }}><Camera size={18} /></button>
            </div>
            <select value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value as Equipo['estado'] })} style={sInpMob}>
              {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
            <div style={{ position: 'relative' }}>
              <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>Ubicación</label>
              <input value={lugarSelNombre}
                onChange={e => {
                  setBusquedaLugar(e.target.value);
                  setLugarSelNombre(e.target.value);
                  setForm({ ...form, id_lugar: '' });
                  if (e.target.value.length >= 1) {
                    const filtrados = lugares.filter(l =>
                      l.nombre.toLowerCase().includes(e.target.value.toLowerCase()) ||
                      (l.piso?.toString() || '').includes(e.target.value)
                    ).slice(0, 8);
                    setSugerenciasLugar(filtrados);
                    setMostrarSugLugar(true);
                  } else {
                    setSugerenciasLugar([]);
                    setMostrarSugLugar(false);
                  }
                }}
                onFocus={() => { if (lugares.length > 0 && busquedaLugar.length >= 1 && sugerenciasLugar.length > 0) setMostrarSugLugar(true); }}
                onBlur={() => setTimeout(() => setMostrarSugLugar(false), 200)}
                placeholder="Buscar ubicación…"
                style={sInpMob} />
              {mostrarSugLugar && sugerenciasLugar.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, zIndex: 20, maxHeight: 200, overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  {sugerenciasLugar.map(l => (
                    <div key={l.id} onMouseDown={() => {
                      setForm({ ...form, id_lugar: l.id });
                      setBusquedaLugar(l.nombre);
                      setLugarSelNombre(l.nombre + (l.soporte === false ? ' 🔒' : ''));
                      setMostrarSugLugar(false);
                    }}
                      style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, color: '#1F2937', borderBottom: '1px solid #F3F4F6' }}>
                      <div>{l.nombre} <span style={{ fontSize: 11, color: '#9CA3AF' }}>(Piso {l.piso})</span></div>
                    </div>
                  ))}
                </div>
              )}
              {lugarSelNombre && !mostrarSugLugar && form.id_lugar && (
                <p style={{ fontSize: 11, color: '#16a34a', margin: '2px 0 0' }}>✓ {lugarSelNombre}</p>
              )}
            </div>

            {/* Usuario asignado */}
            <div style={{ position: 'relative' }}>
              <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>Usuario asignado</label>
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
                style={sInpMob} />

              {mostrarSugerencias && sugerenciasUsuario.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, zIndex: 20, maxHeight: 200, overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  {sugerenciasUsuario.map(u => (
                    <div key={u.id} onMouseDown={() => {
                      setForm({ ...form, id_usuario: u.id });
                      setBusquedaUsuario(u.nombre);
                      setUsuarioSelNombre(u.nombre);
                      setMostrarSugerencias(false);
                    }}
                      style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, color: '#1F2937', borderBottom: '1px solid #F3F4F6' }}>
                      <div>{u.nombre}</div>
                      <div style={{ fontSize: 11, color: '#9CA3AF' }}>{u.email}</div>
                    </div>
                  ))}
                </div>
              )}

              {mostrarSugerencias && busquedaUsuario.length >= 1 && sugerenciasUsuario.length === 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, zIndex: 20, padding: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  <p style={{ fontSize: 12, color: '#9CA3AF', margin: '0 0 8px' }}>No se encontró el usuario.</p>
                  <button onMouseDown={() => { setMostrarSugerencias(false); setModalCrearUsuario(true); }}
                    style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Plus size={12} /> Crear usuario
                  </button>
                </div>
              )}

              {usuarioSelNombre && !mostrarSugerencias && form.id_usuario && (
                <p style={{ fontSize: 11, color: '#16a34a', margin: '2px 0 0' }}>✓ {usuarioSelNombre}</p>
              )}
            </div>
          </div>

          {/* Foto */}
          <div>
            <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>Foto del equipo</label>
            <input
              ref={camaraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) manejarFoto(file);
              }}
            />
            <input
              ref={galeriaInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) manejarFoto(file);
              }}
            />
            <input
              ref={dmInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) scanDataMatrix(file);
              }}
            />
            <input ref={barcodeInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) procesarBarcode(f); }} />
            <div id="dm-reader-m" style={{ display: 'none' }} />
            {form.foto_url ? (
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img src={form.foto_url} alt="Preview" style={{ width: 72, height: 72, borderRadius: 8, objectFit: 'cover', border: '1px solid #E5E7EB' }} />
                <button onClick={removerFoto} style={{
                  position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', border: 'none',
                  background: '#dc2626', color: '#fff', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
                }}><X size={12} /></button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => camaraInputRef.current?.click()} disabled={subiendoFoto} style={{
                  flex: 1, padding: '10px', borderRadius: 8, border: '1px dashed #D1D5DB', background: '#F9FAFB',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, cursor: subiendoFoto ? 'default' : 'pointer', fontSize: 11, color: '#9CA3AF',
                }}>
                  {subiendoFoto ? <Loader size={16} className="animate-spin" /> : <Camera size={20} />}
                  <span>{subiendoFoto ? 'Subiendo…' : 'Cámara'}</span>
                </button>
                <button onClick={() => galeriaInputRef.current?.click()} disabled={subiendoFoto} style={{
                  flex: 1, padding: '10px', borderRadius: 8, border: '1px dashed #D1D5DB', background: '#F9FAFB',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, cursor: subiendoFoto ? 'default' : 'pointer', fontSize: 11, color: '#9CA3AF',
                }}>
                  {subiendoFoto ? <Loader size={16} className="animate-spin" /> : <ImageIcon size={20} />}
                  <span>{subiendoFoto ? 'Subiendo…' : 'Galería'}</span>
                </button>
              </div>
            )}
          </div>

          {qrUrl && (
            <div style={{ marginTop: 10, textAlign: 'center', padding: 10, background: '#F9FAFB', borderRadius: 8 }}>
              <img src={qrUrl} alt="QR" style={{ width: 120, height: 120 }} />
            </div>
          )}

          <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
            <motion.button whileTap={{ scale: 0.95 }} onClick={guardar} style={{
              flex: 1, padding: '10px', borderRadius: 8, border: 'none',
              background: '#1e40af', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}>{editId ? 'Actualizar' : 'Guardar'}</motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setShowForm(false); setEditId(null); setQrUrl(''); setBusquedaUsuario(''); setUsuarioSelNombre(''); setBusquedaLugar(''); setLugarSelNombre(''); }} style={{
              padding: '10px 16px', borderRadius: 8, border: '1px solid #E5E7EB',
              background: '#fff', color: '#374151', fontSize: 14, cursor: 'pointer',
            }}>Cancelar</motion.button>
          </div>
        </motion.div>
      )}

      {/* Data Matrix crop modal */}
      {dmImageUrl && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: '#000', zIndex: 1000, display: 'flex', flexDirection: 'column',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 16px', background: '#111',
          }}>
            <button onClick={cerrarDmScanner} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 14 }}>Cancelar</button>
            <span style={{ color: '#ccc', fontSize: 11 }}>Ajusta el código en el recuadro</span>
            <button onClick={cropAndDecode} style={{
              background: '#6366f1', border: 'none', color: '#fff', padding: '6px 16px',
              borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}>Escanear</button>
            <button onClick={descargarCrop} style={{
              background: 'none', border: '1px solid #555', color: '#ccc', padding: '6px 12px',
              borderRadius: 6, cursor: 'pointer', fontSize: 11,
            }} title="Descargar recorte para depuración">⬇</button>
          </div>
          <div
            ref={dmCropRef}
            style={{ flex: 1, overflow: 'hidden', position: 'relative', touchAction: 'none' }}
            onPointerDown={e => {
              dmPanning.current = true;
              dmPanStart.current = { x: e.clientX - dmPanX, y: e.clientY - dmPanY };
              (e.target as HTMLElement).setPointerCapture(e.pointerId);
            }}
            onPointerMove={e => {
              if (!dmPanning.current) return;
              setDmPanX(e.clientX - dmPanStart.current.x);
              setDmPanY(e.clientY - dmPanStart.current.y);
            }}
            onPointerUp={() => { dmPanning.current = false; }}
          >
            <img
              ref={dmImgRef}
              src={dmImageUrl}
              alt="Data Matrix"
              draggable={false}
              style={{
                position: 'absolute', top: 0, left: 0,
                transform: `translate(${dmPanX}px, ${dmPanY}px) scale(${dmZoom}) rotate(${dmRotacion}deg)`,
                transformOrigin: '0 0',
                maxWidth: 'none', userSelect: 'none', WebkitUserSelect: 'none', pointerEvents: 'none',
              }}
            />
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
            }}>
              <div style={{
                width: 280, height: 280, border: '2px solid #6366f1',
                borderRadius: 8, boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
              }} />
            </div>
          </div>
          <div style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16,
            padding: '12px 16px', background: '#111',
          }}>
            <button onClick={() => setDmZoom(z => Math.max(0.5, +(z - 0.05).toFixed(2)))} style={{
              width: 40, height: 40, borderRadius: 8, border: '1px solid #444',
              background: '#222', color: '#fff', fontSize: 20, cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>−</button>
            <span style={{ color: '#fff', fontSize: 12, minWidth: 50, textAlign: 'center' }}>{Math.round(dmZoom * 100)}%</span>
            <button onClick={() => setDmZoom(z => Math.min(5, +(z + 0.05).toFixed(2)))} style={{
              width: 40, height: 40, borderRadius: 8, border: '1px solid #444',
              background: '#222', color: '#fff', fontSize: 20, cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>+</button>
            <button onClick={() => setDmRotacion(r => (r + 90) % 360)} style={{
              width: 40, height: 40, borderRadius: 8, border: '1px solid #444',
              background: '#222', color: '#fff', fontSize: 14, cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }} title="Rotar 90°">↻</button>
            <button onClick={() => { setDmZoom(0.65); setDmRotacion(0); setDmPanX(0); setDmPanY(0); }} style={{
              background: 'none', border: '1px solid #444', color: '#ccc', borderRadius: 6,
              padding: '6px 12px', cursor: 'pointer', fontSize: 12, marginLeft: 4,
            }}>Restablecer</button>
          </div>
        </div>
      )}

      {cargando ? (
        <div style={{ textAlign: 'center', color: '#9CA3AF', padding: 24 }}><Loader size={24} /></div>
      ) : (
        <motion.div
          initial="hidden" animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
          style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
        >
          {idLugarFiltro && lugarFiltroNombre && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#EFF6FF', borderRadius: 8, marginBottom: 12, border: '1px solid #BFDBFE' }}>
              <span style={{ flex: 1, fontSize: 13, color: '#1E40AF' }}>Equipos de: <strong>{lugarFiltroNombre}</strong></span>
              <button onClick={() => navigate('/tecnico/m/equipos')} style={{
                padding: '4px 10px', borderRadius: 6, border: '1px solid #93C5FD',
                background: '#fff', color: '#1E40AF', fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap',
              }}>Ver todos</button>
            </div>
          )}
          {equiposFiltrados.slice(0, limite).map(e => {
            const usrNombre = usuarios.find(u => u.id === e.id_usuario)?.nombre;
            return (
              <motion.div
                key={e.id}
                variants={itemVariants}
                whileTap={{ scale: 0.98 }}
                style={{
                  background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12,
                  padding: '12px 14px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#1F2937' }}>{e.nombre}</div>
                    <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                      {[e.marca, e.modelo].filter(Boolean).join(' · ') || '—'}
                    </div>
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>
                      {e.cod_inventario && <span>Inv: {e.cod_inventario} </span>}
                      {e.numero_serie && <span>S/N: {e.numero_serie}</span>}
                    </div>
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>
                      {lugares.find(l => l.id === e.id_lugar)?.nombre || '—'}
                    </div>
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <User size={11} />
                      {usrNombre || '—'}
                    </div>
                    {e.foto_url && (
                      <div style={{ marginTop: 4 }}>
                        <img src={e.foto_url} alt="" style={{ width: 48, height: 48, borderRadius: 6, objectFit: 'cover', border: '1px solid #E5E7EB' }} />
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                      background: `${ESTADO_COLORS[e.estado] || '#6b7280'}18`,
                      color: ESTADO_COLORS[e.estado] || '#6b7280',
                    }}>{e.estado}</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => editar(e)} style={{
                        padding: '4px 8px', borderRadius: 6, border: '1px solid #E5E7EB',
                        background: '#fff', cursor: 'pointer', lineHeight: 1, display: 'flex',
                      }}>
                        <Pencil size={14} />
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => eliminar(e.id)} style={{
                        padding: '4px 8px', borderRadius: 6, border: '1px solid #E5E7EB',
                        background: '#fff', cursor: 'pointer', lineHeight: 1, display: 'flex',
                      }}>
                        <Trash2 size={14} />
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
          {equiposFiltrados.length === 0 && <p style={{ textAlign: 'center', color: '#9CA3AF', padding: 24 }}>Sin equipos</p>}
          {limite < equiposFiltrados.length && (
            <div ref={centinelaRef} style={{ height: 1 }} />
          )}
          {limite < equiposFiltrados.length && (
            <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 12, padding: '4px 0' }}>
              <Loader size={14} className="animate-spin" />
            </div>
          )}
        </motion.div>
      )}

      {/* Crear Usuario modal */}
      {modalCrearUsuario && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, maxWidth: 400, width: '90%' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, color: '#1F2937', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={18} /> Crear Usuario
            </h3>
            <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>El usuario recibirá un correo para completar su registro.</p>
            <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>Correo electrónico *</label>
            <input value={nuevoUsuarioEmail} onChange={e => setNuevoUsuarioEmail(e.target.value)} placeholder="correo@ejemplo.cl"
              style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #D1D5DB', background: '#F9FAFB', color: '#1F2937', fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 16 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={async () => {
                if (!nuevoUsuarioEmail.trim()) return;
                setCreandoUsuario(true);
                const { data: { session } } = await supabase.auth.getSession();
                const { data, error } = await supabase.auth.signUp({
                  email: nuevoUsuarioEmail.trim(),
                  password: Math.random().toString(36).slice(-8),
                });
                if (session) {
                  await supabase.auth.setSession({
                    access_token: session.access_token,
                    refresh_token: session.refresh_token,
                  });
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
                  background: creandoUsuario || !nuevoUsuarioEmail.trim() ? '#9CA3AF' : '#1e40af',
                  color: '#fff', fontSize: 14, fontWeight: 600, cursor: creandoUsuario || !nuevoUsuarioEmail.trim() ? 'default' : 'pointer',
                }}>
                {creandoUsuario ? '⏳ Creando…' : 'Crear usuario'}
              </button>
              <button onClick={() => { setModalCrearUsuario(false); setNuevoUsuarioEmail(''); }}
                style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #D1D5DB', background: '#fff', color: '#374151', fontSize: 14, cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
    </MobileSwipeWrapper>
  );
}
