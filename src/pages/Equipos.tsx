import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import QRCode from 'qrcode';
import { supabase } from '../lib/supabase';
import { handleError, showError, showSuccess } from '../utils/errorHandler';
import { subirFotoEquipo } from '../services/evidenciaService';
import { decodificarBarcode } from '../services/barcodeDecoder';
import type { Equipo, Lugar } from '../types';

interface Props { idEstablecimiento: string }

const ESTADOS = ['Operativo', 'Con Fallas', 'En Reparación', 'Baja'];

export default function Equipos({ idEstablecimiento }: Props) {
  const [equipos, setEquipos] = useState<(Equipo & { lugar_nombre?: string; usuario_nombre?: string })[]>([]);
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [usuarios, setUsuarios] = useState<{ id: string; nombre: string; email: string }[]>([]);
  const [cargando, setCargando] = useState(true);
  const [paginaEq, setPaginaEq] = useState(1);
  const POR_PAGINA = 20;
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    nombre: '', marca: '', modelo: '', tipo_equipo: '', numero_serie: '',
    cod_inventario: '', estado: 'Operativo' as Equipo['estado'], id_lugar: '', id_usuario: '',
    foto_url: '',
  });
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const camaraInputRef = useRef<HTMLInputElement | null>(null);
  const galeriaInputRef = useRef<HTMLInputElement | null>(null);
  const dmInputRef = useRef<HTMLInputElement | null>(null);
  const [qrUrl, setQrUrl] = useState('');
  const [qrCargando, setQrCargando] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  const [busquedaUsuario, setBusquedaUsuario] = useState('');
  const [usuarioSelNombre, setUsuarioSelNombre] = useState('');
  const [sugerenciasUsuario, setSugerenciasUsuario] = useState<{ id: string; nombre: string; email: string }[]>([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [modalCrearUsuario, setModalCrearUsuario] = useState(false);
  const [nuevoUsuarioEmail, setNuevoUsuarioEmail] = useState('');
  const [creandoUsuario, setCreandoUsuario] = useState(false);
  const [tabEquipos, setTabEquipos] = useState<'equipos' | 'usuarios'>('equipos');

  const COLUMNAS = [
    { key: 'nombre', label: 'Nombre', minW: 100, defaultW: 150 },
    { key: 'usuario', label: 'Usuario', minW: 90, defaultW: 130 },
    { key: 'cod_inventario', label: 'Cod. Inventario', minW: 80, defaultW: 110 },
    { key: 'marca_modelo', label: 'Marca / Modelo', minW: 100, defaultW: 150 },
    { key: 'tipo', label: 'Tipo', minW: 80, defaultW: 100 },
    { key: 'serie', label: 'N° Serie', minW: 80, defaultW: 110 },
    { key: 'estado', label: 'Estado', minW: 70, defaultW: 90 },
    { key: 'ubicacion', label: 'Ubicación', minW: 90, defaultW: 130 },
    { key: 'acciones', label: 'Acciones', minW: 70, defaultW: 85 },
  ] as const;
  type ColKey = typeof COLUMNAS[number]['key'];
  const defaultWidths = Object.fromEntries(COLUMNAS.map(c => [c.key, c.defaultW])) as Record<ColKey, number>;
  const [colWidths, setColWidths] = useState<Record<ColKey, number>>(() => {
    try { const saved = localStorage.getItem('eq_colWidths'); return saved ? { ...defaultWidths, ...JSON.parse(saved) } : defaultWidths; } catch { return defaultWidths; }
  });
  const [colVisible, setColVisible] = useState<Record<ColKey, boolean>>(() => {
    try { const saved = localStorage.getItem('eq_colVisible'); return saved ? JSON.parse(saved) : Object.fromEntries(COLUMNAS.map(c => [c.key, true])) as Record<ColKey, boolean>; } catch { return Object.fromEntries(COLUMNAS.map(c => [c.key, true])) as Record<ColKey, boolean>; }
  });
  const [showColPicker, setShowColPicker] = useState(false);
  const colPickerRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ key: ColKey; startX: number; startW: number } | null>(null);
  const [filtros, setFiltros] = useState<Record<string, string>>({});
  const opcionesFiltro = useMemo(() => {
    return {
      usuario: [...new Set(equipos.map(e => usuarios.find(u => u.id === e.id_usuario)?.nombre || '').filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es')),
      marca_modelo: [...new Set(equipos.map(e => [e.marca, e.modelo].filter(Boolean).join(' · ')).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es')),
      tipo: [...new Set(equipos.map(e => e.tipo_equipo).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, 'es')),
      ubicacion: [...new Set(equipos.map(e => lugares.find(l => l.id === e.id_lugar)?.nombre || '').filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es')),
    };
  }, [equipos, usuarios, lugares]);
  const equiposFiltrados = useMemo(() => {
    let lista = equipos;
    Object.entries(filtros).forEach(([key, val]) => {
      if (!val) return;
      if (key === 'usuario') lista = lista.filter(e => { const n = usuarios.find(u => u.id === e.id_usuario)?.nombre || ''; return n === val; });
      if (key === 'marca_modelo') lista = lista.filter(e => [e.marca, e.modelo].filter(Boolean).join(' · ') === val);
      if (key === 'tipo') lista = lista.filter(e => e.tipo_equipo === val);
      if (key === 'ubicacion') lista = lista.filter(e => { const n = lugares.find(l => l.id === e.id_lugar)?.nombre || ''; return n === val; });
    });
    return lista;
  }, [equipos, filtros, usuarios, lugares]);
  const totalPaginas = Math.ceil(equiposFiltrados.length / POR_PAGINA);
  const equiposPagina = equiposFiltrados.slice((paginaEq - 1) * POR_PAGINA, paginaEq * POR_PAGINA);
  useEffect(() => { setPaginaEq(1); }, [filtros]);

  const iniciarResize = useCallback((key: ColKey, e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = { key, startX: e.clientX, startW: colWidths[key] };
    const onMove = (ev: MouseEvent) => {
      const current = dragRef.current;
      if (!current) return;
      const diff = ev.clientX - current.startX;
      const col = COLUMNAS.find(c => c.key === current.key)!;
      const newW = Math.max(col.minW, current.startW + diff);
      setColWidths(prev => {
        const next = { ...prev, [current.key]: newW };
        localStorage.setItem('eq_colWidths', JSON.stringify(next));
        return next;
      });
    };
    const onUp = () => { dragRef.current = null; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); document.body.style.cursor = ''; };
    document.body.style.cursor = 'col-resize';
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [colWidths]);

  const toggleCol = (key: ColKey) => {
    setColVisible(prev => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem('eq_colVisible', JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (colPickerRef.current && !colPickerRef.current.contains(e.target as Node)) setShowColPicker(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
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

  async function scanBarcode(campo: 'numero_serie' | 'cod_inventario') {
    setCampoBarcode(campo);
    // Pequeño delay para que React procese antes de abrir la cámara
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
    const [eqRes, lugRes, usrRes] = await Promise.all([
      supabase.from('equipos').select('*').eq('id_establecimiento', idEstablecimiento).eq('activo', true).order('nombre'),
      supabase.from('lugares').select('*').eq('id_establecimiento', idEstablecimiento).eq('activo', true).order('nombre'),
      supabase.from('usuarios').select('id,nombre,email').not('email', 'like', 'eliminado_%@sgja.cl').order('nombre').limit(5000),
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
    setCargando(false);
  }

  useEffect(() => { if (idEstablecimiento) load(); }, [idEstablecimiento]);

  async function manejarFoto(file: File) {
    const previewUrl = URL.createObjectURL(file);
    setForm(prev => ({ ...prev, foto_url: previewUrl }));
    setSubiendoFoto(true);
    const { url, error } = await subirFotoEquipo(idEstablecimiento, file);
    setSubiendoFoto(false);
    if (error) { showError('Error al subir foto: ' + error); return; }
    if (url) setForm(prev => ({ ...prev, foto_url: url }));
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
      id_lugar: form.id_lugar || null, marca: form.marca || null,
      modelo: form.modelo || null, tipo_equipo: form.tipo_equipo || null,
      numero_serie: form.numero_serie || null,
      cod_inventario: form.cod_inventario || null,
      estado: form.estado,
      id_usuario: form.id_usuario || null,
      foto_url: form.foto_url || null,
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
        p_id_usuario: payload.id_usuario,
        p_foto_url: payload.foto_url,
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
    setForm({ nombre: '', marca: '', modelo: '', tipo_equipo: '', numero_serie: '', cod_inventario: '', estado: 'Operativo', id_lugar: '', id_usuario: '', foto_url: '' });
    setBusquedaUsuario(''); setUsuarioSelNombre(''); setMostrarSugerencias(false);
    if (camaraInputRef.current) camaraInputRef.current.value = '';
    if (galeriaInputRef.current) galeriaInputRef.current.value = '';
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
    if (usr) {
      setBusquedaUsuario(usr.nombre);
      setUsuarioSelNombre(usr.nombre);
    } else if (e.id_usuario) {
      supabase.from('usuarios').select('id,nombre,email').eq('id', e.id_usuario).maybeSingle().then(({ data }) => {
        if (data) {
          setUsuarios(prev => {
            if (prev.some(u => u.id === data.id)) return prev;
            return [...prev, data];
          });
          setBusquedaUsuario(data.nombre);
          setUsuarioSelNombre(data.nombre);
        }
      });
    } else {
      setBusquedaUsuario('');
      setUsuarioSelNombre('');
    }
    const lug = lugares.find(l => l.id === e.id_lugar);
    setBusquedaLugar(lug ? lug.nombre : '');
    setLugarSelNombre(lug ? lug.nombre : '');
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
          setForm({ nombre: '', marca: '', modelo: '', tipo_equipo: '', numero_serie: '', cod_inventario: '', estado: 'Operativo', id_lugar: '', id_usuario: '', foto_url: '' });
          setQrUrl('');
    setBusquedaUsuario(''); setUsuarioSelNombre(''); setMostrarSugerencias(false);
    setBusquedaLugar(''); setLugarSelNombre('');
          if (camaraInputRef.current) camaraInputRef.current.value = '';
          if (galeriaInputRef.current) galeriaInputRef.current.value = '';
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
        <div onClick={e => { if (e.target === e.currentTarget) { setShowForm(false); setEditId(null); } }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, padding: '40px 16px', overflowY: 'auto' }}>
          <div style={{ background: '#0f172a', border: '1px solid #475569', borderRadius: 8, padding: 16, maxWidth: 800, width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#f1f5f9' }}>{editId ? '✏️ Editar equipo' : '➕ Nuevo equipo'}</h3>
            <button onClick={() => { setShowForm(false); setEditId(null); setQrUrl(''); setForm(prev => ({ ...prev, foto_url: '' })); setBusquedaLugar(''); setLugarSelNombre(''); if (camaraInputRef.current) camaraInputRef.current.value = ''; if (galeriaInputRef.current) galeriaInputRef.current.value = ''; }} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>✕</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))', gap: 10 }}>
            {/* Nombre con autocomplete */}
            <div style={{ position: 'relative' }}>
              <label style={sLab}>Nombre</label>
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
                style={sInp} />
              {mostrarSugNombre && sugNombreFiltradas.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#1e293b', border: '1px solid #475569', borderRadius: 4, zIndex: 10, maxHeight: 180, overflowY: 'auto' }}>
                  {sugNombreFiltradas.map(s => (
                    <div key={s} onMouseDown={() => { setForm({ ...form, nombre: s }); setMostrarSugNombre(false); }}
                      style={{ padding: '6px 10px', cursor: 'pointer', fontSize: 13, color: '#f1f5f9', borderBottom: '1px solid #334155' }}>
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Marca con autocomplete */}
            <div style={{ position: 'relative' }}>
              <label style={sLab}>Marca</label>
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
                style={sInp} />
              {mostrarSugMarca && sugMarcaFiltradas.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#1e293b', border: '1px solid #475569', borderRadius: 4, zIndex: 10, maxHeight: 180, overflowY: 'auto' }}>
                  {sugMarcaFiltradas.map(s => (
                    <div key={s} onMouseDown={() => { setForm({ ...form, marca: s }); setMostrarSugMarca(false); }}
                      style={{ padding: '6px 10px', cursor: 'pointer', fontSize: 13, color: '#f1f5f9', borderBottom: '1px solid #334155' }}>
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Modelo con autocomplete */}
            <div style={{ position: 'relative' }}>
              <label style={sLab}>Modelo</label>
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
                style={sInp} />
              {mostrarSugModelo && sugModeloFiltradas.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#1e293b', border: '1px solid #475569', borderRadius: 4, zIndex: 10, maxHeight: 180, overflowY: 'auto' }}>
                  {sugModeloFiltradas.map(s => (
                    <div key={s} onMouseDown={() => { setForm({ ...form, modelo: s }); setMostrarSugModelo(false); }}
                      style={{ padding: '6px 10px', cursor: 'pointer', fontSize: 13, color: '#f1f5f9', borderBottom: '1px solid #334155' }}>
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {[
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
                <button onClick={() => scanBarcode('numero_serie')} style={sIconBtn} title="Escanear código de barras">
                  📷
                </button>
                <button onClick={() => dmInputRef.current?.click()} style={{ ...sIconBtn, fontSize: 10, fontWeight: 600, color: '#6366f1' }} title="Escanear Data Matrix (foto)">
                  DM
                </button>
              </div>
            </div>
            {/* Código Inventario con cámara */}
            <div>
              <label style={sLab}>Cód. Inventario</label>
              <div style={{ display: 'flex', gap: 4 }}>
                <input value={form.cod_inventario} onChange={e => setForm({ ...form, cod_inventario: e.target.value })} style={{ ...sInp, flex: 1 }} />
                <button onClick={() => scanBarcode('cod_inventario')} style={sIconBtn} title="Escanear código de barras">
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
            <div style={{ position: 'relative' }}>
              <label style={sLab}>Ubicación</label>
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
                style={{ ...sInp, boxSizing: 'border-box' }} />
              {mostrarSugLugar && sugerenciasLugar.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#1e293b', border: '1px solid #475569', borderRadius: 4, zIndex: 10, maxHeight: 200, overflowY: 'auto' }}>
                  {sugerenciasLugar.map(l => (
                    <div key={l.id} onMouseDown={() => {
                      setForm({ ...form, id_lugar: l.id });
                      setBusquedaLugar(l.nombre);
                      setLugarSelNombre(l.nombre);
                      setMostrarSugLugar(false);
                    }}
                      style={{ padding: '6px 10px', cursor: 'pointer', fontSize: 13, color: '#f1f5f9', borderBottom: '1px solid #334155' }}>
                      <div>{l.nombre} <span style={{ fontSize: 11, color: '#64748b' }}>(Piso {l.piso})</span></div>
                    </div>
                  ))}
                </div>
              )}
              {lugarSelNombre && !mostrarSugLugar && form.id_lugar && (
                <p style={{ fontSize: 11, color: '#4ade80', margin: '2px 0 0' }}>✓ {lugarSelNombre}</p>
              )}
            </div>
            {/* Foto */}
            <div>
              <label style={sLab}>Foto del equipo</label>
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
              <div id="dm-reader" style={{ display: 'none' }} />
              {form.foto_url ? (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img src={form.foto_url} alt="Preview" onClick={() => setModalImageUrl(form.foto_url)} style={{ width: 64, height: 64, borderRadius: 6, objectFit: 'cover', border: '1px solid #475569', cursor: 'pointer' }} />
                  <button onClick={removerFoto} style={{
                    position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', border: '1px solid #475569',
                    background: '#dc2626', color: '#fff', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
                  }}>✕</button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => camaraInputRef.current?.click()} disabled={subiendoFoto} style={{
                    flex: 1, padding: '8px', borderRadius: 6, border: '1px dashed #475569', background: '#1e293b',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                    cursor: subiendoFoto ? 'default' : 'pointer', fontSize: 11, color: '#64748b',
                  }}>
                    {subiendoFoto ? '⏳' : '📷'}
                    <span>{subiendoFoto ? 'Subiendo…' : 'Cámara'}</span>
                  </button>
                  <button onClick={() => galeriaInputRef.current?.click()} disabled={subiendoFoto} style={{
                    flex: 1, padding: '8px', borderRadius: 6, border: '1px dashed #475569', background: '#1e293b',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                    cursor: subiendoFoto ? 'default' : 'pointer', fontSize: 11, color: '#64748b',
                  }}>
                    {subiendoFoto ? '⏳' : '🖼️'}
                    <span>{subiendoFoto ? 'Subiendo…' : 'Galería'}</span>
                  </button>
                </div>
              )}
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

          {/* Hidden file input para escanear código de barras */}
          <input ref={barcodeInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) procesarBarcode(f); }} />

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
            <button onClick={() => { setShowForm(false); setEditId(null); setQrUrl(''); setForm(prev => ({ ...prev, foto_url: '' })); setBusquedaLugar(''); setLugarSelNombre(''); if (camaraInputRef.current) camaraInputRef.current.value = ''; if (galeriaInputRef.current) galeriaInputRef.current.value = ''; }} style={sBtn}>Cancelar</button>
          </div>
        </div>
        </div>
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

      {/* Image lightbox */}
      {modalImageUrl && (
        <div onClick={() => setModalImageUrl(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, cursor: 'pointer' }}>
          <div onClick={e => e.stopPropagation()} style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <img src={modalImageUrl} alt="Foto equipo" style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: 8, display: 'block' }} />
            <div style={{ position: 'absolute', top: -36, right: 0, display: 'flex', gap: 8 }}>
              <a href={modalImageUrl} download onClick={e => e.stopPropagation()} style={{ background: '#1e293b', color: '#f1f5f9', padding: '4px 10px', borderRadius: 4, fontSize: 12, textDecoration: 'none', cursor: 'pointer' }}>⬇ Descargar</a>
              <button onClick={() => setModalImageUrl(null)} style={{ background: '#1e293b', border: 'none', color: '#f1f5f9', width: 28, height: 28, borderRadius: 4, cursor: 'pointer', fontSize: 16, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ overflowX: 'auto', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
          <div ref={colPickerRef} style={{ position: 'relative' }}>
            <button onClick={() => setShowColPicker(p => !p)} style={{ ...sBtn, padding: '3px 10px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
              👁 Columnas
            </button>
            {showColPicker && (
              <div style={{
                position: 'absolute', right: 0, top: '100%', background: '#0f172a', border: '1px solid #475569',
                borderRadius: 6, padding: 6, zIndex: 50, minWidth: 160, marginTop: 4,
              }}>
                {COLUMNAS.map(c => (
                  <label key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 12, color: '#f1f5f9', borderRadius: 4, userSelect: 'none' }}>
                    <input type="checkbox" checked={colVisible[c.key]} onChange={() => toggleCol(c.key)} style={{ accentColor: '#6366f1' }} />
                    {c.label}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, tableLayout: 'fixed' }}>
          <thead>
            <tr style={{ background: '#0f172a', color: '#94a3b8' }}>
              {COLUMNAS.filter(c => colVisible[c.key]).map(c => {
                const filterable = ['usuario', 'marca_modelo', 'tipo', 'ubicacion'];
                return (
                  <th key={c.key} style={{ ...thS, width: colWidths[c.key], position: 'relative', overflow: 'visible', verticalAlign: 'top' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontSize: 12 }}>{c.label}</span>
                      {filterable.includes(c.key) && (
                        <select
                          value={filtros[c.key] || ''}
                          onChange={e => setFiltros(prev => ({ ...prev, [c.key]: e.target.value }))}
                          style={{
                            width: '100%', padding: '2px 4px', borderRadius: 3, border: '1px solid #475569',
                            background: '#0f172a', color: '#f1f5f9', fontSize: 11, cursor: 'pointer', outline: 'none',
                          }}
                        >
                          <option value="">Todos</option>
                          {(opcionesFiltro[c.key as keyof typeof opcionesFiltro] || []).map(v => (
                            <option key={v} value={v}>{v}</option>
                          ))}
                        </select>
                      )}
                    </div>
                    <div onMouseDown={e => iniciarResize(c.key, e)} style={{
                      position: 'absolute', right: 0, top: 0, bottom: 0, width: 4,
                      cursor: 'col-resize', userSelect: 'none',
                    }} />
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {equiposPagina.map(e => (
              <tr key={e.id} style={{ borderBottom: '1px solid #1e293b' }}>
                {COLUMNAS.filter(c => colVisible[c.key]).map(c => {
                  if (c.key === 'nombre') return <td key={c.key} style={tdS}>{e.nombre}</td>;
                  if (c.key === 'usuario') return <td key={c.key} style={{ ...tdS, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.id_usuario ? (usuarios.find(u => u.id === e.id_usuario)?.nombre || '—') : '—'}</td>;
                  if (c.key === 'cod_inventario') return <td key={c.key} style={tdS}>{e.cod_inventario?.toString() || '—'}</td>;
                  if (c.key === 'marca_modelo') return <td key={c.key} style={{ ...tdS, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{[e.marca, e.modelo].filter(Boolean).join(' · ') || '—'}</td>;
                  if (c.key === 'tipo') return <td key={c.key} style={tdS}>{e.tipo_equipo || '—'}</td>;
                  if (c.key === 'serie') return <td key={c.key} style={tdS}>{e.numero_serie || '—'}</td>;
                  if (c.key === 'estado') return <td key={c.key} style={tdS}><EstadoBadge estado={e.estado} /></td>;
                  if (c.key === 'ubicacion') return <td key={c.key} style={{ ...tdS, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lugares.find(l => l.id === e.id_lugar)?.nombre || '—'}</td>;
                  if (c.key === 'acciones') return (
                    <td key={c.key} style={tdS}>
                      <button onClick={() => editar(e)} style={{ ...sBtn, padding: '3px 8px', fontSize: 11, marginRight: 4 }}>✏️</button>
                      <button onClick={() => eliminar(e.id)} style={{ ...sBtn, padding: '3px 8px', fontSize: 11 }}>🗑️</button>
                    </td>
                  );
                  return null;
                })}
              </tr>
            ))}
            {equiposFiltrados.length === 0 && <tr><td colSpan={COLUMNAS.filter(c => colVisible[c.key]).length} style={{ textAlign: 'center', padding: 24, color: '#64748b' }}>Sin equipos registrados</td></tr>}
          </tbody>
        </table>
        {totalPaginas > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, padding: '12px 0', borderTop: '1px solid #1e293b', marginTop: 4 }}>
            <button onClick={() => setPaginaEq(p => Math.max(1, p - 1))} disabled={paginaEq === 1} style={{ ...sBtn, padding: '4px 12px', fontSize: 12, opacity: paginaEq === 1 ? 0.5 : 1 }}>← Anterior</button>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>{paginaEq} / {totalPaginas}</span>
            <button onClick={() => setPaginaEq(p => Math.min(totalPaginas, p + 1))} disabled={paginaEq === totalPaginas} style={{ ...sBtn, padding: '4px 12px', fontSize: 12, opacity: paginaEq === totalPaginas ? 0.5 : 1 }}>Siguiente →</button>
          </div>
        )}
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
