import { useState, useEffect, useRef, useCallback, useMemo, useReducer } from 'react';
import { supabase } from '../lib/supabase';
import { LUGARES_POR_PISO, type LugarData } from '../data/lugares';
import QRCode from 'qrcode';
import ModalRequerimiento from './ModalRequerimiento';
import {
  uiReducer, PISOS, ZONE_COLORS, ZONE_LABELS, ESTADO_COLORS,
  type LugarRow, type EquipoRow, type ReqRow,
} from './mapaPisoTypes';

const MAP_W = 508;
const MAP_H = 344;

// Utility
const cleanZone = (zone: string) => zone.replace(/^z-/, '');

// Estilos reutilizables
const STYLES = {
  tag: {
    display: 'inline-block' as const,
    padding: '2px 8px',
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 600 as const,
  },
  button: {
    primary: {
      padding: '7px 14px',
      borderRadius: 6,
      border: 'none',
      background: '#1f2937',
      color: '#fff',
      fontSize: 12,
      cursor: 'pointer',
      fontWeight: 500 as const,
      flex: 1,
    },
    secondary: {
      padding: '7px 14px',
      borderRadius: 6,
      border: 'none',
      background: '#2563eb',
      color: '#fff',
      fontSize: 12,
      cursor: 'pointer',
      fontWeight: 500 as const,
      flex: 1,
    },
    close: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontSize: 16,
      color: '#9ca3af',
      padding: 0,
    },
  },
  panel: {
    header: {
      padding: '14px 16px',
      borderBottom: '1px solid #e5e7eb',
      display: 'flex' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
    },
    section: {
      padding: '12px 16px',
      borderBottom: '1px solid #e5e7eb',
    },
    sectionBg: {
      padding: '12px 16px',
      borderBottom: '1px solid #e5e7eb',
      background: '#f9fafb',
    },
  },
  lugar: {
    container: {
      position: 'absolute' as const,
      borderRadius: 4,
      display: 'flex' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      fontSize: 10,
      fontWeight: 500 as const,
      textAlign: 'center' as const,
      padding: 2,
      lineHeight: 1.15,
      overflow: 'visible' as const,
      cursor: 'pointer',
      transition: 'border 150ms ease-out, box-shadow 150ms ease-out, background 150ms ease-out',
    },
    text: {
      textShadow: '0 1px 2px rgba(0,0,0,0.3)',
      pointerEvents: 'none' as const,
    },
  },
  draggable: {
    padding: '3px 10px',
    borderRadius: 4,
    fontSize: 11,
    background: '#f0f4ff',
    color: '#1e40af',
    border: '1px solid #bfdbfe',
    whiteSpace: 'nowrap' as const,
    fontWeight: 500,
    cursor: 'grab',
    transition: 'opacity 150ms ease-out',
  },
} as const;

interface Props {
  idEstablecimiento: string;
  piso?: number;
}

export default function MapaPiso({ idEstablecimiento, piso: pisoInicial = 1 }: Props) {
  const zoomBtnStyle: React.CSSProperties = {
    width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', color: '#374151',
    fontSize: 16, cursor: 'pointer', fontWeight: 600, lineHeight: 1,
    transition: 'all .1s',
  };
const [lugares, setLugares] = useState<LugarRow[]>([]);
const [equipos, setEquipos] = useState<EquipoRow[]>([]);
const [requerimientos, setRequerimientos] = useState<ReqRow[]>([]);
const [ubicaciones, setUbicaciones] = useState<{ id: string; dispositivo_nombre: string; cantidad: number }[]>([]);
const [dispositivosDB, setDispositivosDB] = useState<string[]>([]);
const [dispositivosInv, setDispositivosInv] = useState<Record<string, boolean>>({});
const [usuariosList, setUsuariosList] = useState<string[]>([]);
const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
const [editUsuario, setEditUsuario] = useState<string | null>(null);
const [editUsuarioVal, setEditUsuarioVal] = useState('');
const [searchTerm, setSearchTerm] = useState('');
interface PendienteResumen { id: string; tipo_requerimiento: string; prioridad: string; estado: string; }
const [pendientesPorLugar, setPendientesPorLugar] = useState<Record<string, PendienteResumen[]>>({});
const [qrExiste, setQrExiste] = useState(false);
const [dispositivosAbierto, setDispositivosAbierto] = useState(false);
const [historialAbierto, setHistorialAbierto] = useState(false);
const [filtroMes, setFiltroMes] = useState('');
const [filtroEstado, setFiltroEstado] = useState<string[]>([]);
const [procesoModal, setProcesoModal] = useState<{ lugar: LugarRow; tickets: ReqRow[] } | null>(null);
  
  const [ui, dispatch] = useReducer(uiReducer, {
    piso: pisoInicial,
    cargando: true,
    scale: 1,
    scaleAuto: true,
    hovered: null,
    selected: null,
    cargandoDetalle: false,
    qrUrl: null,
    qrCodeString: null,
    qrCopied: false,
    qrCargando: false,
    modalReqAbierto: false,
    historialModalAbierto: false,
    dragDevice: null,
    dropHover: null,
    esMobil: typeof window !== 'undefined' ? window.innerWidth < 768 : false,
    panelWidth: typeof window !== 'undefined' ? Math.min(420, Math.max(300, window.innerWidth * 0.32)) : 300,
    panelMaxH: typeof window !== 'undefined' ? window.innerHeight - 130 : 0,
  });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleResize() {
      dispatch({ type: 'HANDLE_RESIZE', payload: { width: window.innerWidth, height: window.innerHeight } });
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!idEstablecimiento) return;
    let isMounted = true;

    dispatch({ type: 'SET_CARGANDO', payload: true });
    setSearchTerm('');
    
    (async () => {
      try {
        const { data: lugaresData, error } = await supabase
          .from('lugares')
          .select('*')
          .eq('id_establecimiento', idEstablecimiento)
          .eq('piso', ui.piso)
          .eq('activo', true)
          .order('top_pos');
        
        if (error) throw error;
        
        if (!isMounted) return;

        let lugaresPiso: LugarRow[];
        if (lugaresData && lugaresData.length > 0) {
          lugaresPiso = lugaresData.map((r: LugarRow) => ({ ...r, zona: cleanZone(r.zona) }));
        } else {
          const fallback = LUGARES_POR_PISO[ui.piso] || [];
          lugaresPiso = fallback.map((l: LugarData, i) => ({
            id: `fallback-${ui.piso}-${i}`,
            piso: ui.piso,
            nombre: l.text,
            zona: cleanZone(l.zone),
            left_pos: l.left,
            top_pos: l.top,
            width: l.width,
            height: l.height,
          }));
        }
        setLugares(lugaresPiso);

        // Cargar detalles de requerimientos pendientes para estos lugares
        const idsLugar = lugaresPiso.map(l => l.id).filter(id => !id.startsWith('fallback-'));
        if (idsLugar.length > 0) {
          const { data: reqs } = await supabase.from('requerimientos')
            .select('id_lugar,id,tipo_requerimiento,prioridad,estado')
            .in('id_lugar', idsLugar).eq('activo', true);
          if (reqs) {
            const agrupado: Record<string, PendienteResumen[]> = {};
            for (const r of reqs) {
              if (!agrupado[r.id_lugar]) agrupado[r.id_lugar] = [];
              agrupado[r.id_lugar].push({ id: r.id, tipo_requerimiento: r.tipo_requerimiento, prioridad: r.prioridad, estado: r.estado });
            }
            setPendientesPorLugar(agrupado);
          }
        } else {
          setPendientesPorLugar({});
        }

        const { data: dispData } = await supabase
          .from('configuracion_dispositivos')
          .select('nombre, inventariable')
          .eq('activo', true)
          .order('nombre');
        if (dispData && dispData.length > 0) {
          setDispositivosDB(dispData.map((d: { nombre: string }) => d.nombre));
          const invMap: Record<string, boolean> = {};
          dispData.forEach((d: { nombre: string; inventariable: boolean }) => { invMap[d.nombre] = d.inventariable; });
          setDispositivosInv(invMap);
        }
        const { data: usuariosData } = await supabase.from('usuarios').select('nombre_completo').eq('id_establecimiento', idEstablecimiento).eq('activo', true).order('nombre_completo');
        if (usuariosData) setUsuariosList(usuariosData.map(u => u.nombre_completo));
      } catch (err) {
        if (isMounted) {
          console.error('Error cargando lugares:', err);
          setLugares([]);
        }
      } finally {
        if (isMounted) {
          dispatch({ type: 'SET_CARGANDO', payload: false });
        }
      }
    })();

    return () => { isMounted = false; };
  }, [idEstablecimiento, ui.piso]);

  useEffect(() => {
    function calcScale() {
      if (!ui.scaleAuto) return;
      const el = wrapperRef.current;
      if (!el) return;
      const parent = el.closest('.map-container-fluid');
      if (!parent) return;
      const maxW = parent.clientWidth - 4;
      const maxH = window.innerHeight - 200;
      if (maxW > 0 && maxH > 0) {
        const s = Math.min(maxW / MAP_W, maxH / MAP_H);
        dispatch({ type: 'SET_SCALE', payload: s });
        dispatch({ type: 'SET_SCALE_AUTO', payload: true });
        el.style.height = `${MAP_H * s}px`;
      }
    }
    calcScale();
    const parentEl = wrapperRef.current?.parentElement;
    let observer: ResizeObserver | null = null;
    if (parentEl) {
      observer = new ResizeObserver(calcScale);
      observer.observe(parentEl);
    }
    window.addEventListener('resize', calcScale);
    return () => {
      window.removeEventListener('resize', calcScale);
      if (observer) observer.disconnect();
    };
  }, [ui.scaleAuto]);

  useEffect(() => {
    if (!ui.selected) return;
    
    function handleClickOutside(e: MouseEvent) {
      if (modalRef.current?.contains(e.target as Node)) return;
      if (panelRef.current && !panelRef.current.contains(e.target as Node) &&
          mapRef.current && !mapRef.current.contains(e.target as Node)) {
        dispatch({ type: 'RESET_SELECTION' });
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [ui.selected]);

  const cargarUbicaciones = useCallback(async (lugarId: string) => {
    const { data } = await supabase.from('ubicaciones')
      .select('id, dispositivo_nombre, cantidad')
      .eq('id_lugar', lugarId)
      .eq('activo', true)
      .order('dispositivo_nombre');
    setUbicaciones((data || []) as { id: string; dispositivo_nombre: string; cantidad: number }[]);
  }, []);

  const seleccionarLugar = useCallback(async (lugar: LugarRow) => {
    if (lugar.soporte === false) {
      dispatch({ type: 'SET_SELECTED', payload: lugar });
      dispatch({ type: 'SET_QR_URL', payload: null });
      dispatch({ type: 'SET_CARGANDO_DETALLE', payload: false });
      return;
    }
    dispatch({ type: 'SET_SELECTED', payload: lugar });
    dispatch({ type: 'SET_QR_URL', payload: null });
    dispatch({ type: 'SET_CARGANDO_DETALLE', payload: true });
    setQrExiste(false);
    const [eqData, reqData, qrData] = await Promise.all([
      supabase.from('equipos').select('id, nombre, marca, modelo, tipo_equipo, estado, numero_serie, cod_inventario, usuario')
        .eq('id_lugar', lugar.id).eq('activo', true),
      supabase.from('requerimientos').select('id, tipo_requerimiento, descripcion, estado, prioridad, created_at')
        .eq('id_lugar', lugar.id).eq('activo', true).order('created_at', { ascending: false }).limit(10),
      supabase.from('qr_codes').select('id').eq('id_referencia', lugar.id).eq('activo', true).maybeSingle(),
    ]);
    setEquipos((eqData.data || []) as EquipoRow[]);
    setRequerimientos((reqData.data || []) as ReqRow[]);
    if (qrData.data) setQrExiste(true);
    await cargarUbicaciones(lugar.id);
    dispatch({ type: 'SET_CARGANDO_DETALLE', payload: false });
  }, [cargarUbicaciones]);

  async function generarQR(lugar: LugarRow) {
    if (lugar.soporte === false) return;
    if (ui.qrUrl) {
      dispatch({ type: 'SET_QR_URL', payload: null });
      dispatch({ type: 'SET_QR_CODE_STRING', payload: null });
      return;
    }
    if (qrExiste) {
      // Cargar QR existente desde la DB
      dispatch({ type: 'SET_QR_CARGANDO', payload: true });
      const { data: qr } = await supabase.from('qr_codes')
        .select('codigo')
        .eq('id_referencia', lugar.id)
        .eq('activo', true)
        .maybeSingle();
      if (qr) {
        const url = `${window.location.origin}/#/tecnico/qr?c=${encodeURIComponent(qr.codigo)}`;
        const svg = await QRCode.toString(url, {
          type: 'svg', width: 250, margin: 2, color: { dark: '#1f2937', light: '#ffffff' },
          errorCorrectionLevel: 'H',
        });
        dispatch({ type: 'SET_QR_URL', payload: `data:image/svg+xml,${encodeURIComponent(svg)}` });
        dispatch({ type: 'SET_QR_CODE_STRING', payload: qr.codigo });
      }
      dispatch({ type: 'SET_QR_CARGANDO', payload: false });
      return;
    }
    // Generar QR nuevo
    dispatch({ type: 'SET_QR_CARGANDO', payload: true });
    try {
      // Generar código legible desde el nombre
      const codigo = lugar.nombre
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '');
      const qrUrl = `${window.location.origin}/#/tecnico/qr?c=${encodeURIComponent(codigo)}`;
      const svg = await QRCode.toString(qrUrl, {
        type: 'svg', width: 250, margin: 2, color: { dark: '#1f2937', light: '#ffffff' },
        errorCorrectionLevel: 'H'
      });
      const dataUrl = `data:image/svg+xml,${encodeURIComponent(svg)}`;
      // Guardar en DB vía RPC (bypass RLS)
      const { error: dbError } = await supabase.rpc('insertar_qr', {
        p_codigo: codigo,
        p_tipo: 'lugar',
        p_id_referencia: lugar.id,
      });
      if (dbError) console.warn('QR no se guardó en DB:', dbError.message);
      dispatch({ type: 'SET_QR_URL', payload: dataUrl });
      dispatch({ type: 'SET_QR_CODE_STRING', payload: codigo });
    } catch (err) {
      console.error('Error generando QR:', err);
      dispatch({ type: 'SET_QR_URL', payload: null });
      dispatch({ type: 'SET_QR_CODE_STRING', payload: null });
    } finally {
      dispatch({ type: 'SET_QR_CARGANDO', payload: false });
    }
  }

  async function asegurarEquipo(device: string, lugarId: string): Promise<Error | null> {
    const { data: existentes, error: selErr } = await supabase
      .from('equipos')
      .select('id')
      .eq('nombre', device)
      .eq('id_lugar', lugarId)
      .eq('activo', true)
      .limit(1);
    if (selErr) return selErr;
    if (existentes && existentes.length > 0) return null;
    const { error: rpcErr } = await supabase.rpc('insertar_equipo', {
      p_nombre: device,
      p_id_establecimiento: idEstablecimiento,
      p_id_lugar: lugarId,
      p_estado: 'Operativo',
    });
    if (rpcErr) {
      console.warn('RPC insertar_equipo falló, reintentando inserción directa:', rpcErr.message);
      const { error: insertErr } = await supabase.from('equipos').insert({
        nombre: device, id_establecimiento: idEstablecimiento,
        id_lugar: lugarId, estado: 'Operativo',
      }).select();
      if (insertErr) return insertErr;
    }
    return null;
  }

  async function recargarRequerimientos(lugarId: string) {
    try {
      const { data, error } = await supabase.from('requerimientos')
        .select('id, tipo_requerimiento, descripcion, estado, prioridad, created_at')
        .eq('id_lugar', lugarId).eq('activo', true)
        .order('created_at', { ascending: false }).limit(10);
      
      if (error) throw error;
      if (data) setRequerimientos(data as ReqRow[]);
    } catch (err) {
      console.error('Error recargando requerimientos:', err);
    }
  }

  const lugaresFiltrados = useMemo(
    () => searchTerm ? lugares.filter(l => l.nombre.toLowerCase().includes(searchTerm.toLowerCase())) : lugares,
    [lugares, searchTerm],
  );
  const zonasUsadas = useMemo(() => [...new Set(lugaresFiltrados.map(l => l.zona))], [lugaresFiltrados]);

  return (
    <div style={{ 
      display: 'flex', 
      gap: 20, 
      flexDirection: ui.esMobil ? 'column' : 'row',
      alignItems: 'flex-start',
      width: '100%',
      maxWidth: '1600px',
      margin: '0 auto'
    }}>
      {/* Sección del Mapa */}
      <div className="map-container-fluid" style={{ flex: 1, width: '100%', minWidth: 0 }}>
        <div style={{ background: '#fff', padding: '16px', borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#111827' }}>Distribución de Planta</h2>
            <select
              value={ui.piso}
              onChange={e => { dispatch({ type: 'SET_PISO', payload: Number(e.target.value) }); dispatch({ type: 'RESET_SELECTION' }); }}
              style={{
                padding: '6px 32px 6px 12px', borderRadius: 8, border: '1px solid #d1d5db',
                background: '#fff', color: '#1f2937', fontSize: 13, cursor: 'pointer',
                fontWeight: 500, outline: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
              aria-label="Seleccionar piso del edificio"
            >
              {PISOS.map(p => <option key={p.valor} value={p.valor}>{p.label}</option>)}
            </select>

            <input
              type="text"
              placeholder="Buscar lugar…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db',
                fontSize: 13, outline: 'none', width: 140, background: '#fff', color: '#1f2937',
              }}
              aria-label="Buscar lugar en el mapa"
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
              <button
                onClick={() => dispatch({ type: 'SET_SCALE', payload: Math.max(0.3, ui.scale - 0.1) })}
                style={zoomBtnStyle}
                aria-label="Alejar"
                title="Alejar"
              >−</button>
              <input
                type="range"
                min="0.3" max="2" step="0.05"
                value={ui.scale}
                onChange={e => {
                  const v = parseFloat(e.target.value);
                  dispatch({ type: 'SET_SCALE', payload: v });
                }}
                style={{ width: 80, cursor: 'pointer', accentColor: '#2563eb' }}
                aria-label="Zoom del mapa"
              />
              <button
                onClick={() => dispatch({ type: 'SET_SCALE', payload: Math.min(2, ui.scale + 0.1) })}
                style={zoomBtnStyle}
                aria-label="Acercar"
                title="Acercar"
              >+</button>
              <span style={{ fontSize: 12, color: '#6b7280', minWidth: 38, textAlign: 'center', fontWeight: 500 }}>
                {Math.round(ui.scale * 100)}%
              </span>
              <button
                onClick={() => dispatch({ type: 'SET_SCALE_AUTO', payload: true })}
                style={{
                  ...zoomBtnStyle,
                  background: ui.scaleAuto ? '#2563eb' : '#fff',
                  color: ui.scaleAuto ? '#fff' : '#374151',
                  borderColor: ui.scaleAuto ? '#2563eb' : '#d1d5db',
                }}
                aria-label="Ajustar zoom automático"
                title="Ajustar al contenedor"
              >⌂</button>
            </div>
          </div>

          {ui.cargando ? (
            <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
              <span style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>⏳ Cargando mapa interactivo…</span>
            </div>
          ) : (
            <div ref={wrapperRef} style={{ width: '100%', overflow: 'hidden', position: 'relative', display: 'flex', justifyContent: 'center' }}>
              <div
                ref={mapRef}
                style={{
                  transformOrigin: 'top left',
                  transform: `scale(${ui.scale})`,
                  width: MAP_W, height: MAP_H,
                  position: 'relative',
                  background: '#f8fafc',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden',
                }}
                role="main"
                aria-label="Mapa interactivo del edificio"
              >
                {lugaresFiltrados.map(l => {
                  const isSelected = ui.selected?.id === l.id;
                  const isDropTarget = ui.dropHover === l.id;
                  const isHovered = ui.hovered === l.id;
                  const sinSoporte = l.soporte === false;
                  return (
                    <button
                      key={l.id}
                      onMouseEnter={() => dispatch({ type: 'SET_HOVERED', payload: l.id })}
                      onMouseLeave={() => dispatch({ type: 'SET_HOVERED', payload: null })}
                      onClick={() => seleccionarLugar(l)}
                      onDragOver={e => { if (!sinSoporte) { e.preventDefault(); dispatch({ type: 'SET_DROP_HOVER', payload: l.id }); } }}
                      onDragLeave={() => dispatch({ type: 'SET_DROP_HOVER', payload: null })}
                      onDrop={async e => {
                        if (sinSoporte) return;
                        e.preventDefault();
                        dispatch({ type: 'SET_DROP_HOVER', payload: null });
                        let device = e.dataTransfer.getData('text/plain') || ui.dragDevice || '';
                        if (!device) {
                          device = prompt('Nombre del dispositivo:') || '';
                          if (!device) return;
                        }
                        const q = prompt(`¿Cuántos "${device}" hay en ${l.nombre}?`, '1');
                        if (q === null) return;
                        const n = parseInt(q);
                        if (isNaN(n) || n < 0) return;
                        await supabase.from('ubicaciones').upsert({
                          id_lugar: l.id, id_establecimiento: idEstablecimiento,
                          dispositivo_nombre: device, cantidad: n, activo: true,
                        }, { onConflict: 'id_lugar, dispositivo_nombre', ignoreDuplicates: false });
                        if (dispositivosInv[device] !== false) await asegurarEquipo(device, l.id);
                        dispatch({ type: 'SET_DRAG_DEVICE', payload: null });
                        await seleccionarLugar(l);
                      }}
                      style={{
                        ...STYLES.lugar.container,
                        left: l.left_pos, top: l.top_pos,
                        width: l.width, height: l.height,
                        border: isSelected ? '2px solid #2563eb' : isDropTarget ? '2px dashed #f59e0b' : isHovered ? '2px solid #fbbf24' : sinSoporte ? '2px solid #e5e7eb' : '1px solid rgba(0,0,0,0.1)',
                        background: sinSoporte ? '#fef2f2' : ZONE_COLORS[l.zona] || '#6366f1',
                        color: sinSoporte ? '#dc2626' : l.zona === 'patio' || l.zona === 'acceso' ? '#14532d' : '#fff',
                        boxShadow: isSelected ? '0 0 0 2px rgba(37,99,235,0.3)' : isDropTarget ? '0 0 0 3px rgba(245,158,11,0.5)' : isHovered ? '0 0 8px rgba(251,191,36,0.4)' : 'none',
                        zIndex: isSelected ? 10 : isDropTarget ? 6 : isHovered ? 5 : 1,
                        cursor: 'pointer',
                        opacity: 1,
                      }}
                      aria-label={`Lugar: ${l.nombre}${sinSoporte ? ' (sin soporte)' : ''}`}
                      aria-pressed={isSelected}
                      disabled={false}
                      title={(() => {
                        const items = pendientesPorLugar[l.id] || [];
                        if (items.length === 0) return l.nombre;
                        const urg = items.filter(p => p.prioridad === 'Urgente' || p.prioridad === 'Alta').length;
                        const proc = items.filter(p => p.estado === 'En Proceso').length;
                        const pend = items.filter(p => p.estado === 'Pendiente').length;
                        return `🔴${urg} 🔵${proc} 🟠${pend} · ${l.nombre}`;
                      })()}
                    >
                      <span style={STYLES.lugar.text}>
                        {l.nombre}
                        {sinSoporte && <span style={{ fontSize: 8, display: 'block', opacity: 0.7 }}>sin soporte</span>}
                      </span>
                      {(() => {
                        const items = pendientesPorLugar[l.id] || [];
                        const urgente = items.filter(p => p.prioridad === 'Urgente' || p.prioridad === 'Alta').length;
                        const proceso = items.filter(p => p.estado === 'En Proceso').length;
                        const pendiente = items.filter(p => p.estado === 'Pendiente').length;
                        const completado = items.filter(p => p.estado === 'Completada' || p.estado === 'Cancelada').length;
                        const dots: [string, number, string][] = [];
                        if (urgente > 0) dots.push(['🔴', urgente, '#dc2626']);
                        if (proceso > 0) dots.push(['🔵', proceso, '#2563eb']);
                        if (pendiente > 0) dots.push(['🟠', pendiente, '#f59e0b']);
                        if (completado > 0) dots.push(['⚪', completado, '#d1d5db']);
                        if (dots.length === 0) return null;
                        return (
                          <div style={{ position: 'absolute', bottom: 2, right: 2, display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            {dots.map(([label, count, color], i) => {
                              const esAzul = color === '#2563eb';
                              return (
                                <span key={i} title={esAzul ? 'En Proceso — clic para ver' : `${label} ${count}`}
                                  onClick={esAzul ? async (e) => {
                                    e.stopPropagation();
                                    const { data } = await supabase.from('requerimientos')
                                      .select('id,tipo_requerimiento,descripcion,estado,prioridad,created_at')
                                      .eq('id_lugar', l.id).eq('activo', true).eq('estado', 'En Proceso')
                                      .order('created_at', { ascending: false });
                                    if (data) setProcesoModal({ lugar: l, tickets: data as ReqRow[] });
                                  } : undefined}
                                  style={{
                                    width: 16, height: 16, borderRadius: '50%', background: color,
                                    color: '#fff', fontSize: 9, fontWeight: 700,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 0 0 1.5px rgba(255,255,255,0.9)',
                                    cursor: esAzul ? 'pointer' : 'default',
                                  }}>
                                  {count}
                                </span>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          
          {!ui.cargando && zonasUsadas.length > 0 && (
            <div style={{
              marginTop: 16,
              display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center',
              padding: '10px', background: '#f9fafb', borderRadius: 8,
              fontSize: 11, border: '1px solid #f1f5f9'
            }}>
              {zonasUsadas.map(z => (
                <span key={z} style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#6b7280' }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: ZONE_COLORS[z] || '#6366f1', display: 'inline-block' }} />
                  {ZONE_LABELS[z] || z}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal móvil con ficha del lugar + equipos */}
      {ui.esMobil && ui.selected && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'flex-end', padding: 0,
        }} onClick={() => dispatch({ type: 'RESET_SELECTION' })}>
          <div style={{
            background: '#fff', borderRadius: '16px 16px 0 0', width: '100%',
            maxHeight: '80vh', overflowY: 'auto',
            boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
            padding: 20,
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#1A3C6B' }}>{ui.selected.nombre}</h3>
              <button onClick={() => dispatch({ type: 'RESET_SELECTION' })}
                style={{ background: 'none', border: 'none', fontSize: 20, color: '#9CA3AF', cursor: 'pointer', padding: '0 4px' }}>
                ✕
              </button>
            </div>
            <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
              <span><strong style={{ color: '#374151' }}>Piso:</strong> {PISOS[ui.selected.piso]?.label || ui.selected.piso}</span>
              <span style={{
                display: 'inline-block', padding: '2px 8px', borderRadius: 4,
                fontSize: 11, fontWeight: 600,
                background: `${ZONE_COLORS[ui.selected.zona] || '#6366f1'}20`,
                color: ZONE_COLORS[ui.selected.zona] || '#6366f1',
              }}>
                {ZONE_LABELS[ui.selected.zona] || ui.selected.zona}
              </span>
            </div>
            {ui.selected.soporte === false ? (
              <div style={{
                padding: '16px', background: '#FFF3F0', borderRadius: 8,
                border: '1px solid #FFCDB8', color: '#B43A1C', textAlign: 'center',
                fontSize: 13, fontWeight: 500,
              }}>
                ⛔ Lugar sin soporte activo
              </div>
            ) : (
              <><h4 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 600, color: '#1A3C6B' }}>🖥️ Equipos</h4>
            {equipos.length === 0 ? (
              <p style={{ color: '#9CA3AF', fontSize: 13, padding: '12px 0' }}>Sin equipos asignados</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {equipos.map(eq => (
                  <div key={eq.id} style={{
                    padding: '10px 12px', background: '#F9FAFB', borderRadius: 8,
                    border: '1px solid #E5E7EB',
                  }}>
                    <div style={{ fontWeight: 600, color: '#1F2937', fontSize: 14 }}>{eq.nombre}</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 2, color: '#6B7280', fontSize: 12, flexWrap: 'wrap' }}>
                      {eq.marca && <span>{eq.marca}</span>}
                      {eq.modelo && <span>{eq.modelo}</span>}
                      {eq.numero_serie && <span>S/N: {eq.numero_serie}</span>}
                    </div>
                    <span style={{
                      display: 'inline-block', marginTop: 4, padding: '2px 8px', borderRadius: 4,
                      fontSize: 11, fontWeight: 600,
                      background: `${ESTADO_COLORS[eq.estado] || '#6b7280'}18`,
                      color: ESTADO_COLORS[eq.estado] || '#6b7280',
                    }}>
                      {eq.estado}
                    </span>
                  </div>
                ))}
              </div>
            )}</>
            )}
          </div>
        </div>
      )}

      {!ui.esMobil && ui.selected && (
        <div
          ref={panelRef}
          style={{
            width: ui.esMobil ? '100%' : ui.panelWidth,
            flexShrink: 0,
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 10,
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            overflow: 'hidden',
            fontSize: 13,
            maxHeight: ui.esMobil ? 'none' : ui.panelMaxH,
            overflowY: 'auto',
          }}
          role="complementary"
          aria-label={`Panel de detalles: ${ui.selected.nombre}`}
        >
          <div style={STYLES.panel.header}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#1f2937' }}>{ui.selected.nombre}</h3>
            <button onClick={() => dispatch({ type: 'RESET_SELECTION' })}
              style={STYLES.button.close}
              aria-label="Cerrar panel de detalles">
              ✕
            </button>
          </div>

          <div style={STYLES.panel.sectionBg}>
            <div style={{ display: 'flex', gap: 16, fontSize: 12, alignItems: 'center' }}>
              <span><span style={{ color: '#6b7280' }}>Piso:</span> <strong style={{ color: '#1f2937' }}>{PISOS[ui.selected.piso]?.label || ui.selected.piso}</strong></span>
              <span style={{ ...STYLES.tag, background: `${ZONE_COLORS[ui.selected.zona] || '#6366f1'}20`, color: ZONE_COLORS[ui.selected.zona] || '#6366f1' }}>
                {ZONE_LABELS[ui.selected.zona] || ui.selected.zona}
              </span>
              {ui.selected.soporte === false && (
                <span style={{ ...STYLES.tag, background: '#fef9c3', color: '#92400e' }}>Sin soporte</span>
              )}
            </div>
          </div>

          {ui.selected.soporte === false ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
              Lugar sin soporte activo — no se pueden crear tickets, generar QR ni asignar dispositivos.
            </div>
          ) : (
            <>
          <div style={{ padding: '12px 16px', display: 'flex', gap: 8, flexWrap: 'wrap', borderBottom: '1px solid #e5e7eb' }}>
            <button onClick={() => ui.selected && generarQR(ui.selected)}
              style={STYLES.button.primary}
              aria-label={ui.qrUrl ? 'Cerrar código QR' : qrExiste ? 'Ver código QR' : 'Generar código QR'}
              disabled={ui.qrCargando}>
              {ui.qrCargando ? '⏳' : ui.qrUrl ? '✕ Cerrar QR' : qrExiste ? '📱 Ver QR' : '📱 Generar QR'}
            </button>
            <button onClick={() => dispatch({ type: 'SET_MODAL_REQ', payload: true })}
              style={STYLES.button.secondary}
              aria-label="Crear nuevo requerimiento">
              🎫 Ticket
            </button>
          </div>

          {ui.qrUrl && (
            <div style={{ padding: '10px 16px', textAlign: 'center', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
              <img src={ui.qrUrl} alt={`Código QR para ${ui.selected.nombre}`} style={{ width: 80, height: 80 }} />
              {ui.qrCodeString && (
                <div style={{ marginTop: 8 }}>
                  <code style={{
                    background: '#1e293b', color: '#f1f5f9', padding: '4px 12px',
                    borderRadius: 6, fontSize: 14, fontWeight: 600, letterSpacing: '0.5px',
                  }}>{ui.qrCodeString}</code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(ui.qrCodeString!);
                      dispatch({ type: 'SET_QR_COPIED', payload: true });
                      setTimeout(() => dispatch({ type: 'SET_QR_COPIED', payload: false }), 1500);
                    }}
                    style={{
                      marginLeft: 6, padding: '4px 10px', borderRadius: 6,
                      border: '1px solid #475569', background: '#0f172a',
                      color: ui.qrCopied ? '#4ade80' : '#f1f5f9', fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    {ui.qrCopied ? '✓ Copiado' : 'Copiar'}
                  </button>
                </div>
              )}
              <p style={{ margin: '4px 0 0', fontSize: 11, color: '#6b7280' }}>
                Escanea con la app o usa el código en Accesos
              </p>
            </div>
          )}

          {ui.cargandoDetalle ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#9ca3af', fontSize: 12 }} aria-live="polite">⏳ Cargando…</div>
          ) : (
            <>
              <div
                onDragOver={e => { e.preventDefault(); dispatch({ type: 'SET_DROP_HOVER', payload: 'equipos-panel' }); }}
                onDragLeave={() => dispatch({ type: 'SET_DROP_HOVER', payload: null })}
                onDrop={async e => {
                  e.preventDefault();
                  dispatch({ type: 'SET_DROP_HOVER', payload: null });
                    try {
                    let device = e.dataTransfer.getData('text/plain') || ui.dragDevice || '';
                    if (!device) {
                      device = prompt('Nombre del dispositivo:') || '';
                      if (!device) return;
                    }
                    dispatch({ type: 'SET_DRAG_DEVICE', payload: null });
                    if (!ui.selected) return;
                    const q = prompt(`¿Cuántos "${device}" hay en ${ui.selected.nombre}?`, '1');
                    if (q === null) return;
                    const n = parseInt(q);
                    if (isNaN(n) || n < 0) return;
                    const { error: upsertErr } = await supabase.rpc('upsertar_ubicacion', {
                      p_id_lugar: ui.selected.id,
                      p_id_establecimiento: idEstablecimiento,
                      p_dispositivo_nombre: device,
                      p_cantidad: n,
                    });
                    if (upsertErr) {
                      const { error: fallbackErr } = await supabase.from('ubicaciones').upsert({
                        id_lugar: ui.selected.id, id_establecimiento: idEstablecimiento,
                        dispositivo_nombre: device, cantidad: n, activo: true,
                      }, { onConflict: 'id_lugar, dispositivo_nombre', ignoreDuplicates: false }).select();
                      if (fallbackErr) { console.error('Error al guardar ubicación:', fallbackErr); alert('Error al guardar. Revisa consola (F12).'); return; }
                    }
                    if (dispositivosInv[device] !== false) {
                      const eqErr = await asegurarEquipo(device, ui.selected.id);
                      if (eqErr) { console.error('Error al crear equipo:', eqErr); alert('Error al crear el equipo. Revisa consola (F12).'); return; }
                    }
                    await cargarUbicaciones(ui.selected.id);
                  } catch (err: any) {
                    console.error('Error en onDrop equipos:', err);
                    alert('Error inesperado. Revisa consola (F12).');
                  }
                }}
                style={{
                  padding: '12px 16px', borderBottom: '1px solid #e5e7eb',
                  background: ui.dropHover === 'equipos-panel' ? '#f0f9ff' : 'transparent',
                  transition: 'background 150ms ease',
                }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: 13, fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: 4 }}>
                  🖥️ Equipos
                </h4>
                {(() => {
                  // Group equipos by tipo_equipo (fallback to nombre)
                  const groups = new Map<string, EquipoRow[]>();
                  for (const eq of equipos) {
                    const key = eq.tipo_equipo || eq.nombre;
                    if (!groups.has(key)) groups.set(key, []);
                    groups.get(key)!.push(eq);
                  }
                  // Merge ubicaciones counts into groups
                  const groupEntries = Array.from(groups.entries());
                  for (const u of ubicaciones) {
                    if (!groups.has(u.dispositivo_nombre)) {
                      groupEntries.push([u.dispositivo_nombre, []]);
                    }
                  }
                  // Unique entries
                  const allKeys = new Set<string>();
                  for (const [k] of groupEntries) allKeys.add(k);
                  for (const u of ubicaciones) allKeys.add(u.dispositivo_nombre);
                  const sortedKeys = Array.from(allKeys).sort();

                  if (sortedKeys.length === 0) {
                    return <p style={{ margin: 0, fontSize: 12, color: '#9ca3af' }}>Sin equipos asignados</p>;
                  }

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {sortedKeys.map(key => {
                        const groupEquipos = groups.get(key) || [];
                        const ubic = ubicaciones.find(u => u.dispositivo_nombre === key);
                        const count = ubic ? ubic.cantidad : groupEquipos.length;
                        const isExpanded = expandedGroup === key;
                        return (
                          <div key={key} style={{ borderRadius: 6, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                            <div
                              onClick={() => setExpandedGroup(isExpanded ? null : key)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '6px 10px', cursor: 'pointer',
                                background: isExpanded ? '#eff6ff' : '#f9fafb',
                                fontWeight: 600, fontSize: 12, color: '#1e40af',
                                borderBottom: isExpanded ? '1px solid #e5e7eb' : 'none',
                                userSelect: 'none',
                              }}
                            >
                              <span style={{ fontSize: 10, transition: 'transform .15s', transform: isExpanded ? 'rotate(90deg)' : 'none' }}>▶</span>
                              <span style={{ flex: 1 }}>{key} ({count})</span>
                              <button
                                onClick={async e => { e.stopPropagation(); if (!ui.selected) return; const u = ubicaciones.find(x => x.dispositivo_nombre === key); if (!u && groupEquipos.length === 0) return; if (groupEquipos.length > 0 && !confirm(`Hay ${groupEquipos.length} equipo(s) asignado(s) a "${key}". ¿Borrar todo?`)) return; if (groupEquipos.length > 0) { const ids = new Set(groupEquipos.map(e => e.id)); setEquipos(prev => prev.filter(e => !ids.has(e.id))); await Promise.all(groupEquipos.map(eq => supabase.from('equipos').update({ activo: false }).eq('id', eq.id))); } if (u) { setUbicaciones(prev => prev.filter(x => x.id !== u.id)); await supabase.from('ubicaciones').update({ activo: false }).eq('id', u.id); } }}
                                style={{ cursor: 'pointer', fontSize: 13, color: '#1e40af', opacity: 0.4, background: 'none', border: 'none', padding: 0, lineHeight: 1 }}
                                title="Anular grupo"
                              >✕</button>
                            </div>
                            {isExpanded && groupEquipos.length > 0 && (
                              <div style={{ padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {groupEquipos.map(eq => (
                                  <div key={eq.id} style={{
                                    padding: '6px 8px', background: '#fff', borderRadius: 4,
                                    border: '1px solid #f3f4f6', fontSize: 11,
                                  }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <span style={{ fontWeight: 500, color: '#1f2937' }}>{eq.nombre}</span>
                                      <button
                                        onClick={async e => { e.stopPropagation(); if (!ui.selected) return; if (!confirm(`¿Quitar "${eq.nombre}" de ${ui.selected.nombre}?`)) return; setEquipos(prev => prev.filter(e => e.id !== eq.id)); await supabase.from('equipos').update({ activo: false }).eq('id', eq.id); const ubic = ubicaciones.find(u => u.dispositivo_nombre === key); if (ubic) { if (ubic.cantidad <= 1) { setUbicaciones(prev => prev.filter(x => x.id !== ubic.id)); await supabase.from('ubicaciones').update({ activo: false }).eq('id', ubic.id); } else { setUbicaciones(prev => prev.map(x => x.id === ubic.id ? { ...x, cantidad: x.cantidad - 1 } : x)); await supabase.from('ubicaciones').update({ cantidad: ubic.cantidad - 1 }).eq('id', ubic.id); } } }}
                                        style={{ cursor: 'pointer', fontSize: 12, color: '#ef4444', opacity: 0.5, background: 'none', border: 'none', padding: '0 2px', lineHeight: 1, fontWeight: 700 }}
                                        title={`Eliminar ${eq.nombre}`}
                                      >✕</button>
                                    </div>
                                    <div style={{ display: 'flex', gap: 6, marginTop: 1, color: '#6b7280', fontSize: 10, flexWrap: 'wrap' }}>
                                      {eq.cod_inventario && <span><strong>Cod:</strong> {eq.cod_inventario}</span>}
                                      {eq.marca && <span>{eq.marca}</span>}
                                      {eq.modelo && <span>{eq.modelo}</span>}
                                      {eq.numero_serie && <span>S/N: {eq.numero_serie}</span>}
                                    </div>
                                    <div style={{ display: 'flex', gap: 4, marginTop: 2, alignItems: 'center' }}>
                                      {editUsuario === eq.id ? (
                                        <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                                          <input
                                            autoFocus
                                            value={editUsuarioVal}
                                            onChange={e => setEditUsuarioVal(e.target.value)}
                                            list="usuarios-list"
                                            onBlur={async () => {
                                              const val = editUsuarioVal.trim();
                                              if (val && !usuariosList.includes(val) && confirm(`¿Crear usuario "${val}"?`)) {
                                                await supabase.from('usuarios').insert({ nombre_completo: val, id_establecimiento: idEstablecimiento, activo: true });
                                                setUsuariosList(prev => [...prev, val]);
                                              }
                                              await supabase.from('equipos').update({ usuario: val || null }).eq('id', eq.id);
                                              setEditUsuario(null);
                                              if (ui.selected) cargarUbicaciones(ui.selected.id);
                                            }}
                                            onKeyDown={async e => {
                                              if (e.key === 'Enter') {
                                                const val = editUsuarioVal.trim();
                                                if (val && !usuariosList.includes(val) && confirm(`¿Crear usuario "${val}"?`)) {
                                                  await supabase.from('usuarios').insert({ nombre_completo: val, id_establecimiento: idEstablecimiento, activo: true });
                                                  setUsuariosList(prev => [...prev, val]);
                                                }
                                                await supabase.from('equipos').update({ usuario: val || null }).eq('id', eq.id);
                                                setEditUsuario(null);
                                                if (ui.selected) cargarUbicaciones(ui.selected.id);
                                              }
                                              if (e.key === 'Escape') setEditUsuario(null);
                                            }}
                                            style={{ width: 140, padding: '2px 6px', fontSize: 10, border: '1px solid #3b82f6', borderRadius: 4, outline: 'none' }}
                                            placeholder="Usuario"
                                            maxLength={200}
                                          />
                                          <datalist id="usuarios-list">
                                            {usuariosList.map(u => <option key={u} value={u} />)}
                                          </datalist>
                                          {editUsuarioVal.trim() && !usuariosList.includes(editUsuarioVal.trim()) && (
                                            <button
                                              onClick={async () => {
                                                const val = editUsuarioVal.trim();
                                                await supabase.from('usuarios').insert({ nombre_completo: val, id_establecimiento: idEstablecimiento, activo: true });
                                                setUsuariosList(prev => [...prev, val]);
                                                await supabase.from('equipos').update({ usuario: val }).eq('id', eq.id);
                                                setEditUsuario(null);
                                                if (ui.selected) cargarUbicaciones(ui.selected.id);
                                              }}
                                              title="Crear usuario"
                                              style={{ cursor: 'pointer', background: '#10b981', color: '#fff', border: 'none', borderRadius: 4, fontSize: 10, padding: '2px 6px', fontWeight: 700 }}
                                            >+ Crear</button>
                                          )}
                                        </div>
                                      ) : (
                                        <span
                                          onClick={() => { setEditUsuario(eq.id); setEditUsuarioVal(eq.usuario || ''); }}
                                          style={{ fontSize: 10, color: eq.usuario ? '#374151' : '#9ca3af', cursor: 'pointer', fontWeight: 500 }}
                                          title="Click para asignar usuario"
                                        >
                                          👤 {eq.usuario || 'Asignar usuario'}
                                        </span>
                                      )}
                                      <span style={{ ...STYLES.tag, fontSize: 10, background: `${ESTADO_COLORS[eq.estado] || '#6b7280'}18`, color: ESTADO_COLORS[eq.estado] || '#6b7280' }}>
                                        {eq.estado}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            {isExpanded && groupEquipos.length === 0 && (
                              <div style={{ padding: '8px 10px', fontSize: 11, color: '#9ca3af' }}>
                                Sin equipos individuales registrados. Créalos desde Equipos.
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              <div style={{ padding: '10px 16px', borderTop: '1px solid #e5e7eb' }}>
                <button onClick={() => setDispositivosAbierto(!dispositivosAbierto)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <h4 style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#374151' }} id="dispositivos-label">Agregar Dispositivos</h4>
                  <span style={{ fontSize: 10, color: '#9ca3af' }}>{dispositivosAbierto ? '▲' : '▼'}</span>
                </button>
                {dispositivosAbierto && (
                  <>
                    <p style={{ margin: '6px 0 6px', fontSize: 10, color: '#9ca3af' }}>Arrastra uno a una sala del mapa o haz clic para agregar</p>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }} role="region" aria-labelledby="dispositivos-label">
                      {dispositivosDB.map(d => (
                        <button
                          key={d}
                          draggable
                          onDragStart={e => { dispatch({ type: 'SET_DRAG_DEVICE', payload: d }); e.dataTransfer.setData('text/plain', d); e.dataTransfer.effectAllowed = 'move'; }}
                          onDragEnd={() => dispatch({ type: 'SET_DRAG_DEVICE', payload: null })}
                          onClick={async () => {
                            if (!ui.selected) return;
                            const q = prompt(`¿Cuántos "${d}" hay en ${ui.selected.nombre}?`, '1');
                            if (q === null) return;
                            const n = parseInt(q);
                            if (isNaN(n) || n < 0) return;
                            const { error: upsertErr } = await supabase.rpc('upsertar_ubicacion', {
                              p_id_lugar: ui.selected.id,
                              p_id_establecimiento: idEstablecimiento,
                              p_dispositivo_nombre: d,
                              p_cantidad: n,
                            });
                            if (upsertErr) {
                              const { error: fallbackErr } = await supabase.from('ubicaciones').upsert({
                                id_lugar: ui.selected.id, id_establecimiento: idEstablecimiento,
                                dispositivo_nombre: d, cantidad: n, activo: true,
                              }, { onConflict: 'id_lugar, dispositivo_nombre', ignoreDuplicates: false }).select();
                              if (fallbackErr) { console.error('Error al guardar ubicación:', fallbackErr); alert('Error al guardar. Revisa consola (F12).'); return; }
                            }
                            if (dispositivosInv[d] !== false) {
                              const eqErr = await asegurarEquipo(d, ui.selected.id);
                              if (eqErr) { console.error('Error al crear equipo:', eqErr); alert('Error al crear el equipo. Revisa consola (F12).'); return; }
                            }
                            await cargarUbicaciones(ui.selected.id);
                          }}
                          style={{
                            ...STYLES.draggable,
                            opacity: ui.dragDevice === d ? 0.4 : 1,
                          }}
                          aria-label={`Dispositivo ${d}. Arrástralo a una sala del mapa o haz clic para agregar`}
                          title={`Arrastra o haz clic para agregar ${d}`}>
                          {d}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div style={{ padding: '12px 16px' }}>
                <button onClick={() => setHistorialAbierto(!historialAbierto)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <h4 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#374151' }} id="historial-label">
                    Historial Reciente {requerimientos.length > 0 && <span style={{ color: '#9ca3af', fontWeight: 400 }}>({requerimientos.length})</span>}
                  </h4>
                  <span style={{ fontSize: 10, color: '#9ca3af' }}>{historialAbierto ? '▲' : '▼'}</span>
                </button>
                {historialAbierto && (
                  <>
                    {(() => {
                      const grupos: Record<string, ReqRow[]> = { '🔴 Urgente': [], '🔄 En Proceso': [], '⏳ Pendiente': [], '✅ Completada': [], '❌ Cancelada': [] };
                      for (const r of requerimientos) {
                        if (r.prioridad === 'Urgente') grupos['🔴 Urgente'].push(r);
                        else if (r.estado === 'En Proceso') grupos['🔄 En Proceso'].push(r);
                        else if (r.estado === 'Pendiente') grupos['⏳ Pendiente'].push(r);
                        else if (r.estado === 'Completada') grupos['✅ Completada'].push(r);
                        else if (r.estado === 'Cancelada') grupos['❌ Cancelada'].push(r);
                      }
                      return Object.entries(grupos).filter(([, items]) => items.length > 0).map(([label, items]) => (
                        <div key={label} style={{ marginBottom: 8 }}>
                          <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 600, color: '#6b7280' }}>{label} ({items.length})</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {items.slice(0, 3).map(req => (
                              <div key={req.id} style={{ padding: '6px 8px', background: '#f9fafb', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 12 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontWeight: 500, color: '#1f2937', fontSize: 11 }}>{req.tipo_requerimiento}</span>
                                  <span style={{ ...STYLES.tag, fontSize: 9, background: req.estado === 'Completada' ? '#dcfce7' : req.estado === 'En Proceso' ? '#dbeafe' : req.estado === 'Cancelada' ? '#fee2e2' : '#fef3c7', color: req.estado === 'Completada' ? '#166534' : req.estado === 'En Proceso' ? '#0c4a6e' : req.estado === 'Cancelada' ? '#991b1b' : '#92400e' }}>
                                    {req.estado}
                                  </span>
                                </div>
                                <p style={{ margin: '2px 0 0', color: '#6b7280', fontSize: 10, lineHeight: 1.3 }}>{req.descripcion}</p>
                                <span style={{ color: '#9ca3af', fontSize: 9, marginTop: 2, display: 'block' }}>
                                  {new Date(req.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ));
                    })()}
                    {requerimientos.length === 0 && <p style={{ margin: 0, fontSize: 12, color: '#9ca3af' }}>Sin requerimientos</p>}
                    <div style={{ textAlign: 'center', marginTop: 4 }}>
                      <button onClick={() => dispatch({ type: 'SET_HISTORIAL_MODAL', payload: true })} style={{
                        background: 'none', border: 'none', color: '#3b82f6', fontSize: 12, cursor: 'pointer', padding: '4px 0', fontWeight: 500,
                      }}>
                        Ver todo →
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
            </>
          )}  
        </div>
      )}

      {ui.modalReqAbierto && ui.selected && (
        <ModalRequerimiento
          ref={modalRef}
          lugar={ui.selected}
          equipos={equipos}
          idEstablecimiento={idEstablecimiento}
          onCerrar={() => dispatch({ type: 'SET_MODAL_REQ', payload: false })}
          onCreado={() => {
            dispatch({ type: 'SET_MODAL_REQ', payload: false });
            if (ui.selected) recargarRequerimientos(ui.selected.id);
          }}
        />
      )}

      {(() => {
        const requerimientosFiltrados = requerimientos.filter(r => {
          if (filtroMes) {
            const fecha = new Date(r.created_at);
            const mesVal = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
            if (mesVal !== filtroMes) return false;
          }
          if (filtroEstado.length > 0 && !filtroEstado.includes(r.estado)) return false;
          return true;
        });
        return ui.historialModalAbierto && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.4)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: 16,
        }} onClick={() => dispatch({ type: 'SET_HISTORIAL_MODAL', payload: false })}>
          <div style={{
            background: '#fff', borderRadius: 12, width: '100%', maxWidth: 520,
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)', overflow: 'hidden',
            maxHeight: '90vh', display: 'flex', flexDirection: 'column',
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              padding: '16px 20px', borderBottom: '1px solid #e5e7eb',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#1f2937' }}>
                📋 Historial · {ui.selected?.nombre}
              </h3>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button onClick={() => {
                  const printWin = window.open('', '_blank');
                  if (!printWin) return;
                  const rows = requerimientosFiltrados.map(r =>
                    `<tr>
                      <td style="padding:6px 8px;border:1px solid #d1d5db;font-size:12px">${r.tipo_requerimiento}</td>
                      <td style="padding:6px 8px;border:1px solid #d1d5db;font-size:12px">${r.prioridad}</td>
                      <td style="padding:6px 8px;border:1px solid #d1d5db;font-size:12px">${r.estado}</td>
                      <td style="padding:6px 8px;border:1px solid #d1d5db;font-size:12px">${r.descripcion}</td>
                      <td style="padding:6px 8px;border:1px solid #d1d5db;font-size:12px">${new Date(r.created_at).toLocaleDateString('es-CL')}</td>
                    </tr>`
                  ).join('');
                  printWin.document.write(`
                    <html><head><title>Historial - ${ui.selected?.nombre}</title>
                    <style>body{font-family:sans-serif;padding:20px}table{width:100%;border-collapse:collapse}
                    th{background:#f3f4f6;padding:6px 8px;border:1px solid #d1d5db;font-size:12px;text-align:left}
                    </style></head>
                    <body><h2 style="font-size:16px">Historial · ${ui.selected?.nombre}</h2>
                    <table><thead><tr>
                      <th>Tipo</th><th>Prioridad</th><th>Estado</th><th>Descripción</th><th>Fecha</th>
                    </tr></thead><tbody>${rows}</tbody></table></body></html>
                  `);
                  printWin.document.close();
                  printWin.print();
                }} style={{
                  padding: '6px 12px', borderRadius: 6, border: '1px solid #475569',
                  background: '#0f172a', color: '#f1f5f9', fontSize: 12, cursor: 'pointer',
                }}>
                  🖨️ PDF
                </button>
                <button onClick={() => dispatch({ type: 'SET_HISTORIAL_MODAL', payload: false })}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#9ca3af', padding: '0 4px' }}>
                  ✕
                </button>
              </div>
            </div>
            <div style={{ padding: '8px 20px', display: 'flex', gap: 8, alignItems: 'center', borderBottom: '1px solid #e5e7eb' }}>
              <select value={filtroMes} onChange={e => setFiltroMes(e.target.value)}
                style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #d1d5db', fontSize: 12, background: '#fff', color: '#374151' }}>
                <option value="">Todos los meses</option>
                {Array.from({ length: 12 }, (_, i) => {
                  const d = new Date(); d.setMonth(d.getMonth() - i);
                  const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                  return <option key={val} value={val}>{d.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}</option>;
                })}
              </select>
              {['Pendiente', 'En Proceso', 'Completada', 'Cancelada'].map(est => (
                <label key={est} style={{ fontSize: 12, color: '#374151', display: 'flex', alignItems: 'center', gap: 3, cursor: 'pointer' }}>
                  <input type="checkbox" checked={filtroEstado.length === 0 || filtroEstado.includes(est)}
                    onChange={() => setFiltroEstado(prev =>
                      prev.includes(est) ? prev.filter(e => e !== est) : [...prev, est]
                    )} />
                  {est}
                </label>
              ))}
            </div>
            <div style={{ padding: '12px 20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {requerimientosFiltrados.length === 0 ? (
                  <p style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', padding: 24 }}>Sin requerimientos para este lugar.</p>
                ) : (
                  requerimientosFiltrados.map(req => (
                    <div key={req.id} style={{
                      padding: '10px 12px', background: '#f9fafb', borderRadius: 8,
                      border: '1px solid #e5e7eb', fontSize: 13,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontWeight: 600, color: '#1f2937' }}>{req.tipo_requerimiento}</span>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <span style={{ fontSize: 11, color: '#6b7280', background: '#e5e7eb', padding: '1px 8px', borderRadius: 4, fontWeight: 500 }}>{req.prioridad}</span>
                          <span style={{
                            ...STYLES.tag, fontSize: 10,
                            background: req.estado === 'Completada' ? '#dcfce7' : req.estado === 'En Proceso' ? '#dbeafe' : req.estado === 'Cancelada' ? '#fee2e2' : '#fef3c7',
                            color: req.estado === 'Completada' ? '#166534' : req.estado === 'En Proceso' ? '#0c4a6e' : req.estado === 'Cancelada' ? '#991b1b' : '#92400e',
                          }}>
                            {req.estado}
                          </span>
                        </div>
                      </div>
                      <p style={{ margin: 0, color: '#4b5563', fontSize: 12, lineHeight: 1.4 }}>{req.descripcion}</p>
                      <div style={{ color: '#9ca3af', fontSize: 10, marginTop: 4 }}>
                        {new Date(req.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {procesoModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1100,
          background: 'rgba(0,0,0,0.4)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: 16,
        }} onClick={() => setProcesoModal(null)}>
          <div style={{
            background: '#fff', borderRadius: 12, width: '100%', maxWidth: 440,
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)', overflow: 'hidden',
            maxHeight: '80vh', display: 'flex', flexDirection: 'column',
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              padding: '14px 18px', borderBottom: '1px solid #e5e7eb',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#1f2937' }}>
                🔵 En Proceso · {procesoModal.lugar.nombre}
              </h3>
              <button onClick={() => setProcesoModal(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#9ca3af', padding: '0 4px' }}>
                ✕
              </button>
            </div>
            <div style={{ padding: '12px 18px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {procesoModal.tickets.length === 0 ? (
                <p style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', padding: 24 }}>Sin tickets en proceso.</p>
              ) : (
                procesoModal.tickets.map(ticket => (
                  <div key={ticket.id} style={{
                    padding: '10px 12px', background: '#f9fafb', borderRadius: 8,
                    border: '1px solid #e5e7eb', fontSize: 13,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, color: '#1f2937' }}>{ticket.tipo_requerimiento}</span>
                      <span style={{
                        ...STYLES.tag, fontSize: 10,
                        background: '#dbeafe', color: '#0c4a6e',
                      }}>{ticket.prioridad}</span>
                    </div>
                    <p style={{ margin: '0 0 4px', color: '#4b5563', fontSize: 12, lineHeight: 1.4 }}>{ticket.descripcion}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#9ca3af', fontSize: 10 }}>
                        {new Date(ticket.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
                      </span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => { window.location.hash = `#/ticket?ticket=${ticket.id}`; }}
                          style={{
                            padding: '4px 10px', borderRadius: 6, border: 'none',
                            background: '#2563eb', color: '#fff', fontSize: 11, cursor: 'pointer', fontWeight: 600,
                          }}>
                          Ver
                        </button>
                        <button onClick={async () => {
                          if (!confirm(`¿Completar "${ticket.tipo_requerimiento}"?`)) return;
                          await supabase.from('requerimientos').update({
                            estado: 'Completada',
                            fecha_cierre: new Date().toISOString(),
                          }).eq('id', ticket.id);
                          setProcesoModal(null);
                          if (procesoModal?.lugar) {
                            const { data } = await supabase.from('requerimientos')
                              .select('id,tipo_requerimiento,descripcion,estado,prioridad,created_at')
                              .eq('id_lugar', procesoModal.lugar.id).eq('activo', true).eq('estado', 'En Proceso')
                              .order('created_at', { ascending: false });
                            if (data) setProcesoModal({ lugar: procesoModal.lugar, tickets: data as ReqRow[] });
                          }
                        }} style={{
                          padding: '4px 10px', borderRadius: 6, border: 'none',
                          background: '#059669', color: '#fff', fontSize: 11, cursor: 'pointer', fontWeight: 600,
                        }}>
                          ✓
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
