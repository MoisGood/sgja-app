import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import QRCode from 'qrcode';
import Card from '../components/Common/Card';
import Button from '../components/Common/Button';
import Modal from '../components/Common/Modal';

interface Props {
  idEstablecimiento: string;
}

interface DispositivoRow {
  id: string;
  nombre: string;
  activo: boolean;
  inventariable?: boolean;
}

interface QrCodeRow { id: string; codigo: string; tipo: string; id_referencia: string; created_at: string }

type Tab = 'dispositivos' | 'fallas' | 'diagnosticos' | 'soluciones' | 'observaciones' | 'qr' | 'correo';

const TABS: { key: Tab; icono: string; label: string }[] = [
  { key: 'dispositivos', icono: '📦', label: 'Dispositivos' },
  { key: 'fallas', icono: '⚠️', label: 'Fallas' },
  { key: 'diagnosticos', icono: '🔍', label: 'Diagnósticos' },
  { key: 'soluciones', icono: '✅', label: 'Soluciones' },
  { key: 'observaciones', icono: '📝', label: 'Observaciones' },
  { key: 'qr', icono: '📱', label: 'QR' },
  { key: 'correo', icono: '📧', label: 'Correo' },
];

const inputStyle: React.CSSProperties = {
  width: 280, maxWidth: '100%', padding: '8px 12px', fontSize: 14,
  border: '1px solid #D1D5DB', borderRadius: 8, color: '#1F2937',
  background: '#FFFFFF', outline: 'none', boxSizing: 'border-box',
};

const itemRowStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '8px 12px', background: '#F9FAFB', borderRadius: 8,
  border: '1px solid #E5E7EB',
};

const pagBtnStyle: React.CSSProperties = {
  padding: '6px 14px', fontSize: 13, border: '1px solid #D1D5DB',
  borderRadius: 6, background: '#FFFFFF', color: '#374151',
  cursor: 'pointer', fontWeight: 500,
};

export default function ConfiguracionTecnico({ idEstablecimiento }: Props) {
  const [tab, setTab] = useState<Tab>('dispositivos');
  const [dispositivos, setDispositivos] = useState<DispositivoRow[]>([]);
  const [fallas, setFallas] = useState<DispositivoRow[]>([]);
  const [editFalla, setEditFalla] = useState<string | null>(null);
  const [nombreFalla, setNombreFalla] = useState('');
  const [diagnosticos, setDiagnosticos] = useState<DispositivoRow[]>([]);
  const [editDiag, setEditDiag] = useState<string | null>(null);
  const [nombreDiag, setNombreDiag] = useState('');
  const [soluciones, setSoluciones] = useState<DispositivoRow[]>([]);
  const [editSol, setEditSol] = useState<string | null>(null);
  const [nombreSol, setNombreSol] = useState('');
  const [observaciones, setObservaciones] = useState<DispositivoRow[]>([]);
  const [editObs, setEditObs] = useState<string | null>(null);
  const [nombreObs, setNombreObs] = useState('');
  const [qrCodes, setQrCodes] = useState<QrCodeRow[]>([]);
  const [qrDataUrls, setQrDataUrls] = useState<Record<string, string>>({});
  const [lugaresMap, setLugaresMap] = useState<Record<string, string>>({});
  const [equiposMap, setEquiposMap] = useState<Record<string, string>>({});
  const [qrModalId, setQrModalId] = useState<string | null>(null);
  const POR_PAGINA = 10;
  const [paginaDisp, setPaginaDisp] = useState(0);
  const [paginaFallas, setPaginaFallas] = useState(0);
  const [paginaDiag, setPaginaDiag] = useState(0);
  const [paginaSol, setPaginaSol] = useState(0);
  const [paginaObs, setPaginaObs] = useState(0);
  const [qrPagina, setQrPagina] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [nombreDisp, setNombreDisp] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  async function load() {
    setErrorMsg('');
    const { data, error } = await supabase
      .from('configuracion_dispositivos')
      .select('id, nombre, activo, inventariable')
      .eq('id_establecimiento', idEstablecimiento)
      .eq('activo', true)
      .order('nombre');
    if (error) { setErrorMsg('Dispositivos: ' + error.message); setCargando(false); return; }
    if (data) setDispositivos(data);
    setCargando(false);
  }

  async function loadQrCodes() {
    setErrorMsg('');
    const [qrRes, lugRes, eqRes] = await Promise.all([
      supabase.from('qr_codes').select('id, codigo, tipo, id_referencia, created_at').eq('activo', true).order('created_at', { ascending: false }),
      supabase.from('lugares').select('id, nombre').eq('id_establecimiento', idEstablecimiento).eq('activo', true),
      supabase.from('equipos').select('id, nombre').eq('id_establecimiento', idEstablecimiento).eq('activo', true),
    ]);
    if (qrRes.error) { setErrorMsg('QR: ' + qrRes.error.message); return; }
    if (lugRes.data) setLugaresMap(Object.fromEntries(lugRes.data.map(l => [l.id, l.nombre])));
    if (eqRes.data) setEquiposMap(Object.fromEntries(eqRes.data.map(e => [e.id, e.nombre])));
    if (qrRes.data) {
      setQrCodes(qrRes.data);
      const base = (window.location.origin + '/#/tecnico/qr?c=');
      const entries = await Promise.all(qrRes.data.map(async q => {
        try {
          const svg = await QRCode.toString(base + encodeURIComponent(q.codigo), { type: 'svg', margin: 1 });
          const url = `data:image/svg+xml,${encodeURIComponent(svg)}`;
          return [q.id, url] as const;
        } catch (err) {
          console.error('QR gen error:', q.codigo, err);
          return [q.id, ''] as const;
        }
      }));
      setQrDataUrls(Object.fromEntries(entries));
    }
  }

  async function loadFallas() {
    setErrorMsg('');
    const { data, error } = await supabase
      .from('posibles_fallas')
      .select('id, nombre, activo')
      .eq('id_establecimiento', idEstablecimiento)
      .eq('activo', true)
      .order('nombre');
    if (error) { setErrorMsg('Fallas: ' + error.message); return; }
    if (data) setFallas(data);
  }

  async function loadDiagnosticos() {
    setErrorMsg('');
    const { data, error } = await supabase
      .from('posibles_diagnosticos')
      .select('id, nombre, activo')
      .eq('id_establecimiento', idEstablecimiento)
      .eq('activo', true)
      .order('nombre');
    if (error) { setErrorMsg('Diagnósticos: ' + error.message); return; }
    if (data) setDiagnosticos(data);
  }

  async function loadSoluciones() {
    setErrorMsg('');
    const { data, error } = await supabase
      .from('posibles_soluciones')
      .select('id, nombre, activo')
      .eq('id_establecimiento', idEstablecimiento)
      .eq('activo', true)
      .order('nombre');
    if (error) { setErrorMsg('Soluciones: ' + error.message); return; }
    if (data) setSoluciones(data);
  }

  async function loadObservaciones() {
    setErrorMsg('');
    const { data, error } = await supabase
      .from('posibles_observaciones')
      .select('id, nombre, activo')
      .eq('id_establecimiento', idEstablecimiento)
      .eq('activo', true)
      .order('nombre');
    if (error) { setErrorMsg('Observaciones: ' + error.message); return; }
    if (data) setObservaciones(data);
  }

  useEffect(() => {
    if (idEstablecimiento) {
      load();
      loadFallas();
      loadDiagnosticos();
      loadSoluciones();
      loadObservaciones();
      loadQrCodes();
    }
  }, [idEstablecimiento]);

  async function guardarDispositivo() {
    const nombre = nombreDisp.trim();
    if (!nombre) return;
    if (editId) {
      setDispositivos(prev => prev.map(d => d.id === editId ? { ...d, nombre } : d));
      await supabase.from('configuracion_dispositivos').update({ nombre }).eq('id', editId);
    } else {
      const { data } = await supabase.from('configuracion_dispositivos').insert({
        id_establecimiento: idEstablecimiento, nombre,
      }).select('id, nombre, activo, inventariable');
      if (data) setDispositivos(prev => [...prev, ...(data as DispositivoRow[])]);
      else load();
    }
    setEditId(null);
    setNombreDisp('');
  }

  async function toggleInventariable(d: DispositivoRow) {
    const nuevo = !d.inventariable;
    setDispositivos(prev => prev.map(x => x.id === d.id ? { ...x, inventariable: nuevo } : x));
    await supabase.from('configuracion_dispositivos').update({ inventariable: nuevo }).eq('id', d.id);
  }

  async function eliminarDispositivo(id: string) {
    if (!confirm('¿Anular este dispositivo?')) return;
    setDispositivos(prev => prev.filter(x => x.id !== id));
    await supabase.from('configuracion_dispositivos').update({ activo: false }).eq('id', id);
  }

  async function guardarDiag() {
    const nombre = nombreDiag.trim();
    if (!nombre) return;
    if (editDiag) {
      await supabase.from('posibles_diagnosticos').update({ nombre }).eq('id', editDiag);
    } else {
      await supabase.from('posibles_diagnosticos').insert({
        id_establecimiento: idEstablecimiento, nombre,
      });
    }
    setEditDiag(null);
    setNombreDiag('');
    loadDiagnosticos();
  }

  async function eliminarDiag(id: string) {
    if (!confirm('¿Anular este diagnóstico?')) return;
    await supabase.from('posibles_diagnosticos').update({ activo: false }).eq('id', id);
    loadDiagnosticos();
  }

  async function guardarFalla() {
    const nombre = nombreFalla.trim();
    if (!nombre) return;
    if (editFalla) {
      await supabase.from('posibles_fallas').update({ nombre }).eq('id', editFalla);
    } else {
      await supabase.from('posibles_fallas').insert({
        id_establecimiento: idEstablecimiento, nombre,
      });
    }
    setEditFalla(null);
    setNombreFalla('');
    loadFallas();
  }

  async function eliminarFalla(id: string) {
    if (!confirm('¿Anular esta posible falla?')) return;
    await supabase.from('posibles_fallas').update({ activo: false }).eq('id', id);
    loadFallas();
  }

  async function guardarSol() {
    const nombre = nombreSol.trim();
    if (!nombre) return;
    if (editSol) {
      await supabase.from('posibles_soluciones').update({ nombre }).eq('id', editSol);
    } else {
      await supabase.from('posibles_soluciones').insert({
        id_establecimiento: idEstablecimiento, nombre,
      });
    }
    setEditSol(null);
    setNombreSol('');
    loadSoluciones();
  }

  async function eliminarSol(id: string) {
    if (!confirm('¿Anular esta solución?')) return;
    await supabase.from('posibles_soluciones').update({ activo: false }).eq('id', id);
    loadSoluciones();
  }

  async function guardarObs() {
    const nombre = nombreObs.trim();
    if (!nombre) return;
    if (editObs) {
      await supabase.from('posibles_observaciones').update({ nombre }).eq('id', editObs);
    } else {
      await supabase.from('posibles_observaciones').insert({
        id_establecimiento: idEstablecimiento, nombre,
      });
    }
    setEditObs(null);
    setNombreObs('');
    loadObservaciones();
  }

  async function eliminarObs(id: string) {
    if (!confirm('¿Anular esta observación?')) return;
    await supabase.from('posibles_observaciones').update({ activo: false }).eq('id', id);
    loadObservaciones();
  }

  if (cargando) return <p style={{ color: '#6B7280', padding: 24 }}>⏳ Cargando configuración…</p>;

  function Paginador({ total, pagina, setPagina }: { total: number; pagina: number; setPagina: (n: number) => void }) {
    if (total <= POR_PAGINA) return null;
    const totalPag = Math.ceil(total / POR_PAGINA);
    return (
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center', marginTop: 12, paddingTop: 8, borderTop: '1px solid #E5E7EB' }}>
        <button disabled={pagina === 0} onClick={() => setPagina(pagina - 1)} style={{
          ...pagBtnStyle, opacity: pagina === 0 ? 0.4 : 1, cursor: pagina === 0 ? 'default' : 'pointer',
        }}>← Anterior</button>
        <span style={{ color: '#6B7280', fontSize: 13 }}>Pág. {pagina + 1} de {totalPag}</span>
        <button disabled={pagina + 1 >= totalPag} onClick={() => setPagina(pagina + 1)} style={{
          ...pagBtnStyle, opacity: pagina + 1 >= totalPag ? 0.4 : 1, cursor: pagina + 1 >= totalPag ? 'default' : 'pointer',
        }}>Siguiente →</button>
      </div>
    );
  }

  function renderItemList(
    label: string,
    items: DispositivoRow[],
    value: string,
    setValue: (v: string) => void,
    editingId: string | null,
    setEditingId: (v: string | null) => void,
    guardar: () => void,
    eliminar: (id: string) => void,
    emptyMsg: string,
  ) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            placeholder={`Nombre del ${label.toLowerCase()}`}
            value={value}
            onChange={e => setValue(e.target.value)}
            style={inputStyle}
            maxLength={200}
            onKeyDown={e => { if (e.key === 'Enter') guardar(); }}
          />
          <Button tipo={editingId ? 'primario' : 'exito'} tamaño="pequeño" onClick={guardar}>
            {editingId ? '💾 Actualizar' : '➕ Agregar'}
          </Button>
          {editingId && (
            <Button tipo="secundario" tamaño="pequeño" onClick={() => { setEditingId(null); setValue(''); }}>
              ❌ Cancelar
            </Button>
          )}
        </div>
        {items.length === 0 ? (
          <p style={{ color: '#9CA3AF', fontSize: 13, fontStyle: 'italic', margin: 0 }}>{emptyMsg}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {items.map(d => (
              <div key={d.id} style={itemRowStyle}>
                <span style={{ color: '#1F2937', fontSize: 14 }}>{d.nombre}</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <Button tamaño="pequeño" tipo="secundario" onClick={() => { setValue(d.nombre); setEditingId(d.id); }}>
                    ✏️
                  </Button>
                  <Button tamaño="pequeño" tipo="peligro" onClick={() => eliminar(d.id)}>
                    🚫
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ background: '#F3F4F6', minHeight: '100vh', padding: 24 }}>
      <style>{`
        @media print {
          @page { size: letter; margin: 0.4in; }
          body { background: #fff !important; margin: 0; padding: 0; }
          header, nav, footer, .sidebar, .no-print { display: none !important; }
          .qr-print-page { display: block !important; }
        }
        .qr-print-page { display: none; }
      `}</style>

      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1A3C6B', margin: '0 0 20px' }}>
        ⚙️ Configuración Técnico
      </h1>

      <div style={{ marginBottom: 20 }}>
        <Button tipo="secundario" tamaño="pequeño" onClick={async () => {
          if ('serviceWorker' in navigator) {
            const regs = await navigator.serviceWorker.getRegistrations();
            for (const reg of regs) await reg.unregister();
            const keys = await caches.keys();
            for (const key of keys) await caches.delete(key);
            alert('Cache y Service Worker desactivados. La página se recargará.');
            window.location.reload();
          }
        }}>🧹 Desactivar cache</Button>
      </div>

      {errorMsg && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', padding: '10px 16px', borderRadius: 8, marginBottom: 20, fontSize: 13 }}>
          {errorMsg}
        </div>
      )}

      {/* Tabs */}
      <Card padding="0" sombra="pequeña">
        <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB', overflowX: 'auto' }}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: '10px 20px', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
                border: 'none', borderBottom: '2px solid transparent', cursor: 'pointer',
                color: tab === t.key ? '#1A3C6B' : '#6B7280',
                background: tab === t.key ? '#FFFFFF' : 'transparent',
                borderBottomColor: tab === t.key ? '#1A3C6B' : 'transparent',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (tab !== t.key) e.currentTarget.style.background = '#F9FAFB'; }}
              onMouseLeave={e => { if (tab !== t.key) e.currentTarget.style.background = 'transparent'; }}
            >
              {t.icono} {t.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Tab content */}
      <div style={{ marginTop: 20 }}>
        {/* Tab: Dispositivos */}
        {tab === 'dispositivos' && (
          <Card titulo="📦 Dispositivos" descripcion="Lista maestra de dispositivos. 📦 = inventariable, 🔌 = no inventariable.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                  placeholder="Nombre del dispositivo"
                  value={nombreDisp}
                  onChange={e => setNombreDisp(e.target.value)}
                  style={inputStyle}
                  maxLength={200}
                  onKeyDown={e => { if (e.key === 'Enter') guardarDispositivo(); }}
                />
                <Button tipo={editId ? 'primario' : 'exito'} tamaño="pequeño" onClick={guardarDispositivo}>
                  {editId ? '💾 Actualizar' : '➕ Agregar'}
                </Button>
                {editId && (
                  <Button tipo="secundario" tamaño="pequeño" onClick={() => { setEditId(null); setNombreDisp(''); }}>
                    ❌ Cancelar
                  </Button>
                )}
              </div>
              {dispositivos.length === 0 ? (
                <p style={{ color: '#9CA3AF', fontSize: 13, fontStyle: 'italic', margin: 0 }}>Sin dispositivos registrados.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {dispositivos.slice(paginaDisp * POR_PAGINA, (paginaDisp + 1) * POR_PAGINA).map(d => (
                    <div key={d.id} style={itemRowStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          onClick={() => toggleInventariable(d)}
                          title={d.inventariable ? 'Inventariable — clic para cambiar' : 'No inventariable — clic para cambiar'}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: 0, lineHeight: 1,
                            opacity: d.inventariable ? 1 : 0.5,
                          }}
                        >{d.inventariable ? '📦' : '🔌'}</button>
                        <span style={{ color: '#1F2937', fontSize: 14 }}>{d.nombre}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <Button tamaño="pequeño" tipo="secundario" onClick={() => { setNombreDisp(d.nombre); setEditId(d.id); }}>
                          ✏️
                        </Button>
                        <Button tamaño="pequeño" tipo="peligro" onClick={() => eliminarDispositivo(d.id)}>
                          🚫
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Paginador total={dispositivos.length} pagina={paginaDisp} setPagina={setPaginaDisp} />
          </Card>
        )}

        {/* Tab: Fallas */}
        {tab === 'fallas' && (
          <Card titulo="⚠️ Posibles Fallas" descripcion="Catálogo de fallas sugeridas al crear tickets.">
            {renderItemList('Posible Falla', fallas.slice(paginaFallas * POR_PAGINA, (paginaFallas + 1) * POR_PAGINA), nombreFalla, setNombreFalla, editFalla, setEditFalla, guardarFalla, eliminarFalla, 'Sin posibles fallas registradas.')}
            <Paginador total={fallas.length} pagina={paginaFallas} setPagina={setPaginaFallas} />
          </Card>
        )}

        {/* Tab: Diagnósticos */}
        {tab === 'diagnosticos' && (
          <Card titulo="🔍 Diagnósticos" descripcion="Catálogo de diagnósticos predefinidos.">
            {renderItemList('Diagnóstico', diagnosticos.slice(paginaDiag * POR_PAGINA, (paginaDiag + 1) * POR_PAGINA), nombreDiag, setNombreDiag, editDiag, setEditDiag, guardarDiag, eliminarDiag, 'Sin diagnósticos registrados.')}
            <Paginador total={diagnosticos.length} pagina={paginaDiag} setPagina={setPaginaDiag} />
          </Card>
        )}

        {/* Tab: Soluciones */}
        {tab === 'soluciones' && (
          <Card titulo="✅ Soluciones" descripcion="Catálogo de soluciones frecuentes.">
            {renderItemList('Solución', soluciones.slice(paginaSol * POR_PAGINA, (paginaSol + 1) * POR_PAGINA), nombreSol, setNombreSol, editSol, setEditSol, guardarSol, eliminarSol, 'Sin soluciones registradas.')}
            <Paginador total={soluciones.length} pagina={paginaSol} setPagina={setPaginaSol} />
          </Card>
        )}

        {/* Tab: Observaciones */}
        {tab === 'observaciones' && (
          <Card titulo="📝 Observaciones" descripcion="Catálogo de observaciones predefinidas.">
            {renderItemList('Observación', observaciones.slice(paginaObs * POR_PAGINA, (paginaObs + 1) * POR_PAGINA), nombreObs, setNombreObs, editObs, setEditObs, guardarObs, eliminarObs, 'Sin observaciones registradas.')}
            <Paginador total={observaciones.length} pagina={paginaObs} setPagina={setPaginaObs} />
          </Card>
        )}

        {/* Tab: QR */}
        {tab === 'qr' && (
          <Card
            titulo="📱 Códigos QR"
            descripcion={`${qrCodes.length} código${qrCodes.length !== 1 ? 's' : ''} QR registrado${qrCodes.length !== 1 ? 's' : ''}.`}
          >
            <div className="no-print" style={{ marginBottom: 16 }}>
              <Button tipo="secundario" tamaño="pequeño" onClick={() => window.print()}>🖨️ Imprimir</Button>
            </div>

            {/* Vista en pantalla */}
            <div className="no-print">
              {qrCodes.length === 0 ? (
                <p style={{ color: '#9CA3AF', fontSize: 13, fontStyle: 'italic' }}>Sin códigos QR registrados.</p>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {qrCodes.slice(qrPagina * POR_PAGINA, (qrPagina + 1) * POR_PAGINA).map((q) => {
                      const nombre = q.tipo === 'lugar' ? lugaresMap[q.id_referencia] : equiposMap[q.id_referencia];
                      const num = qrCodes.indexOf(q) + 1;
                      return (
                        <div
                          key={q.id}
                          onClick={() => setQrModalId(q.id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '10px 12px', borderBottom: '1px solid #F3F4F6',
                            cursor: 'pointer', transition: 'background 0.1s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#F9FAFB'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                        >
                          <span style={{ color: '#9CA3AF', fontSize: 12, minWidth: 24, textAlign: 'right' }}>{num}.</span>
                          <span style={{ color: '#1F2937', fontSize: 14, flex: 1 }}>{nombre || q.codigo}</span>
                          <code style={{ color: '#9CA3AF', fontSize: 11 }}>{q.codigo}</code>
                        </div>
                      );
                    })}
                  </div>
                  <Paginador total={qrCodes.length} pagina={qrPagina} setPagina={setQrPagina} />
                </>
              )}
            </div>

            {/* Vista impresión */}
            <div className="qr-print-page">
              <h1 style={{ textAlign: 'center', fontSize: 18, fontWeight: 700, margin: '0 0 8px', color: '#000' }}>
                QR de ubicaciones
              </h1>
              {Array.from({ length: Math.ceil(qrCodes.length / 40) }, (_, pg) => (
                <div key={pg} style={{ pageBreakAfter: pg < Math.ceil(qrCodes.length / 40) - 1 ? 'always' : 'avoid' }}>
                  {pg > 0 && (
                    <h2 style={{ textAlign: 'center', fontSize: 14, margin: '0 0 6px', color: '#666' }}>
                      QR de ubicaciones (pág. {pg + 1})
                    </h2>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}>
                    {Array.from({ length: 40 }, (_, i) => {
                      const idx = pg * 40 + i;
                      const q = qrCodes[idx];
                      const num = idx + 1;
                      const nombre = q ? (q.tipo === 'lugar' ? lugaresMap[q.id_referencia] : equiposMap[q.id_referencia]) : '';
                      return (
                        <div key={i} style={{
                          border: '1px dashed #aaa', padding: 4,
                          display: 'flex', flexDirection: 'column', alignItems: 'center',
                          justifyContent: 'center', minHeight: 100,
                        }}>
                          {q && qrDataUrls[q.id] ? (
                            <img src={qrDataUrls[q.id]} alt={q.codigo} style={{ width: 65, height: 65 }} />
                          ) : (
                            q && <div style={{ width: 65, height: 65, background: '#eee' }} />
                          )}
                          {q && <code style={{ fontSize: 7, color: '#333', marginTop: 1 }}>{num}. {q.codigo}</code>}
                          {nombre && <span style={{ fontSize: 7, color: '#555', textAlign: 'center', lineHeight: 1.1 }}>{nombre}</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Tab: Correo */}
        {tab === 'correo' && (
          <Card titulo="📧 Configuración de Correo" descripcion="Próximamente.">
            <ul style={{ color: '#6B7280', fontSize: 13, margin: 0, paddingLeft: 20 }}>
              <li style={{ marginBottom: 4 }}>Lista de correos predefinidos</li>
              <li style={{ marginBottom: 4 }}>Checkbox al cerrar ticket: "Enviar correo"</li>
              <li style={{ marginBottom: 4 }}>Selección manual de destinatarios</li>
            </ul>
          </Card>
        )}
      </div>

      {/* Modal QR */}
      <Modal
        abierto={!!qrModalId}
        onCerrar={() => setQrModalId(null)}
        titulo="📱 Código QR"
        tamaño="pequeño"
        pie={
          <div style={{ display: 'flex', gap: 8, width: '100%' }}>
            <Button tipo="primario" tamaño="pequeño" onClick={() => {
              const q = qrCodes.find(x => x.id === qrModalId);
              if (q) navigator.clipboard.writeText(q.codigo);
            }}>📋 Copiar</Button>
            <Button tipo="peligro" tamaño="pequeño" onClick={async () => {
              const q = qrCodes.find(x => x.id === qrModalId);
              if (!q || !confirm(`¿Eliminar QR "${q.codigo}"?`)) return;
              await supabase.from('qr_codes').update({ activo: false }).eq('id', q.id);
              setQrModalId(null);
              loadQrCodes();
            }}>🚫 Eliminar</Button>
            <Button tipo="secundario" tamaño="pequeño" onClick={() => setQrModalId(null)}>Cerrar</Button>
          </div>
        }
      >
        {(() => {
          const q = qrCodes.find(x => x.id === qrModalId);
          if (!q) return null;
          const nombre = q.tipo === 'lugar' ? lugaresMap[q.id_referencia] : equiposMap[q.id_referencia];
          return (
            <div style={{ textAlign: 'center' }}>
              {qrDataUrls[q.id] && (
                <img src={qrDataUrls[q.id]} alt={q.codigo} style={{ width: 200, height: 200, margin: '0 auto 12px', borderRadius: 8 }} />
              )}
              <code style={{ color: '#2563EB', fontSize: 13, fontWeight: 600, wordBreak: 'break-all', display: 'block', marginBottom: 4 }}>{q.codigo}</code>
              {nombre && <p style={{ color: '#1F2937', fontSize: 14, margin: '0 0 4px' }}>📍 {nombre}</p>}
              <p style={{ color: '#9CA3AF', fontSize: 12, margin: 0 }}>{q.tipo === 'lugar' ? 'Lugar' : 'Equipo'}</p>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
