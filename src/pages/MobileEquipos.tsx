import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import QRCode from 'qrcode';
import { Wrench, Camera, X, Loader, Pencil, Trash2 } from 'lucide-react';
import MobileSwipeWrapper from '../components/MobileSwipeWrapper';
import { supabase } from '../lib/supabase';
import { tecnicoCache } from '../services/tecnicoCache';
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

export default function MobileEquipos({ idEstablecimiento }: Props) {
  const [equipos, setEquipos] = useState<(Equipo & { lugar_nombre?: string })[]>([]);
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [cargando, setCargando] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    nombre: '', marca: '', modelo: '', tipo_equipo: '', numero_serie: '',
    cod_inventario: '', estado: 'Operativo' as Equipo['estado'], id_lugar: '',
  });
  const [qrUrl, setQrUrl] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [escaneando, setEscaneando] = useState<'cod_inventario' | 'numero_serie' | null>(null);

  useEffect(() => {
    if (idEstablecimiento) load();
    return () => { if (scannerRef.current) { scannerRef.current.stop().catch(() => {}); } };
  }, [idEstablecimiento]);

  async function load() {
    // Cache primero
    const cached = await tecnicoCache.getAll(idEstablecimiento);
    if (cached) {
      setEquipos(cached.equipos);
      setLugares(cached.lugares);
      setCargando(false);
    }

    const [eqRes, lugRes] = await Promise.all([
      supabase.from('equipos').select('*').eq('id_establecimiento', idEstablecimiento).eq('activo', true).order('nombre'),
      supabase.from('lugares').select('*').eq('id_establecimiento', idEstablecimiento).eq('activo', true).eq('soporte', true).order('nombre'),
    ]);
    if (eqRes.data) setEquipos(eqRes.data);
    if (lugRes.data) setLugares(lugRes.data);
    setCargando(false);
  }

  function detenerScanner() {
    if (scannerRef.current) { scannerRef.current.stop().catch(() => {}); scannerRef.current = null; }
    setEscaneando(null);
  }

  async function iniciarScanner(campo: 'cod_inventario' | 'numero_serie') {
    if (escaneando) { detenerScanner(); return; }
    if (!navigator.mediaDevices?.getUserMedia) return;
    setEscaneando(campo);
    await new Promise(r => setTimeout(r, 50));
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      s.getTracks().forEach(t => t.stop());
    } catch { detenerScanner(); return; }
    try {
      const scanner = new Html5Qrcode('barcode-reader-m', { verbose: false, formatsToSupport: [
        Html5QrcodeSupportedFormats.CODE_128, Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.EAN_13, Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A, Html5QrcodeSupportedFormats.UPC_E,
      ] });
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 80 } },
        (texto) => { setForm(prev => ({ ...prev, [campo]: texto })); detenerScanner(); },
        () => {},
      );
    } catch { detenerScanner(); }
  }

  async function guardar() {
    if (!form.nombre.trim()) return;
    setQrUrl('');
    const payload: Record<string, any> = {
      nombre: form.nombre, id_establecimiento: idEstablecimiento,
      id_lugar: form.id_lugar || null, marca: form.marca || null,
      modelo: form.modelo || null, tipo_equipo: form.tipo_equipo || null,
      numero_serie: form.numero_serie || null,
      cod_inventario: form.cod_inventario || null, estado: form.estado,
    };
    if (editId) {
      await supabase.from('equipos').update(payload).eq('id', editId);
    } else {
      const { error: rpcErr } = await supabase.rpc('insertar_equipo', {
        p_nombre: payload.nombre, p_id_establecimiento: payload.id_establecimiento,
        p_id_lugar: payload.id_lugar, p_marca: payload.marca, p_modelo: payload.modelo,
        p_tipo_equipo: payload.tipo_equipo, p_numero_serie: payload.numero_serie,
        p_cod_inventario: payload.cod_inventario, p_estado: payload.estado,
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
    setForm({ nombre: '', marca: '', modelo: '', tipo_equipo: '', numero_serie: '', cod_inventario: '', estado: 'Operativo', id_lugar: '' });
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
      cod_inventario: e.cod_inventario || '', estado: e.estado, id_lugar: e.id_lugar || '',
    });
    setEditId(e.id); setQrUrl(''); setShowForm(true);
  }

  const sInpMob: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    border: '1px solid #E5E7EB', background: '#fff', color: '#1F2937',
    fontSize: 14, boxSizing: 'border-box',
  };

  return (
    <MobileSwipeWrapper>
    <div style={{ padding: 16, maxWidth: 500, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1A3C6B', margin: 0, flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Wrench size={20} /> Equipos
        </h1>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setEditId(null); setForm({ nombre: '', marca: '', modelo: '', tipo_equipo: '', numero_serie: '', cod_inventario: '', estado: 'Operativo', id_lugar: '' }); setQrUrl(''); setShowForm(true); }} style={{
          padding: '8px 16px', borderRadius: 8, border: 'none',
          background: '#1e40af', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>+ Nuevo</motion.button>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 16, marginBottom: 12 }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre" style={sInpMob} />
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={form.marca} onChange={e => setForm({ ...form, marca: e.target.value })} placeholder="Marca" style={{ ...sInpMob, flex: 1 }} />
              <input value={form.modelo} onChange={e => setForm({ ...form, modelo: e.target.value })} placeholder="Modelo" style={{ ...sInpMob, flex: 1 }} />
            </div>
            <input value={form.tipo_equipo} onChange={e => setForm({ ...form, tipo_equipo: e.target.value })} placeholder="Tipo" style={sInpMob} />
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <input value={form.numero_serie} onChange={e => setForm({ ...form, numero_serie: e.target.value })} placeholder="N° Serie" style={{ ...sInpMob, flex: 1 }} />
              <button onClick={() => iniciarScanner('numero_serie')} style={{
                padding: '10px', borderRadius: 8, border: '1px solid #E5E7EB',
                background: '#fff', lineHeight: 1, display: 'flex',
              }}><Camera size={18} /></button>
            </div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <input value={form.cod_inventario} onChange={e => setForm({ ...form, cod_inventario: e.target.value })} placeholder="Cód. Inventario" style={{ ...sInpMob, flex: 1 }} />
              <button onClick={() => iniciarScanner('cod_inventario')} style={{
                padding: '10px', borderRadius: 8, border: '1px solid #E5E7EB',
                background: '#fff', lineHeight: 1, display: 'flex',
              }}><Camera size={18} /></button>
            </div>
            <select value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value as Equipo['estado'] })} style={sInpMob}>
              {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
            <select value={form.id_lugar} onChange={e => setForm({ ...form, id_lugar: e.target.value })} style={sInpMob}>
              <option value="">— Sin lugar —</option>
              {lugares.map(l => <option key={l.id} value={l.id}>{l.nombre} (Piso {l.piso})</option>)}
            </select>
          </div>

          {escaneando && (
            <div style={{ marginTop: 10 }}>
              <div style={{ background: '#000', borderRadius: 8, overflow: 'hidden' }}>
                <div id="barcode-reader-m" style={{ width: '100%', minHeight: 150 }} />
              </div>
              <button onClick={detenerScanner} style={{
                marginTop: 6, padding: '6px 16px', borderRadius: 6, border: 'none',
                background: '#dc2626', color: '#fff', fontSize: 12, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 4,
              }}><X size={14} /> Cancelar</button>
            </div>
          )}

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
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setShowForm(false); setEditId(null); setQrUrl(''); }} style={{
              padding: '10px 16px', borderRadius: 8, border: '1px solid #E5E7EB',
              background: '#fff', color: '#374151', fontSize: 14, cursor: 'pointer',
            }}>Cancelar</motion.button>
          </div>
        </motion.div>
      )}

      {cargando ? (
        <div style={{ textAlign: 'center', color: '#9CA3AF', padding: 24 }}><Loader size={24} /></div>
      ) : (
        <motion.div
          initial="hidden" animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
          style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
        >
          {equipos.map(e => (
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
          ))}
          {equipos.length === 0 && <p style={{ textAlign: 'center', color: '#9CA3AF', padding: 24 }}>Sin equipos</p>}
        </motion.div>
      )}
    </div>
    </MobileSwipeWrapper>
  );
}
