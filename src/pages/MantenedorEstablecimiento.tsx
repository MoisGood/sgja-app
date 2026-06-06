import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

interface Props { idEstablecimiento: string }

export default function MantenedorEstablecimiento({ idEstablecimiento }: Props) {
  const [nombre, setNombre] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [lugares, setLugares] = useState<{ piso: number; nombre: string }[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const [estabRes, lugRes] = await Promise.all([
        supabase.from('establecimientos').select('*').eq('id', idEstablecimiento).single(),
        supabase.from('lugares').select('piso,nombre').eq('id_establecimiento', idEstablecimiento).eq('activo', true).order('piso').order('nombre'),
      ]);
      if (estabRes.data) {
        setNombre(estabRes.data.nombre || '');
        setLogoUrl(estabRes.data.logo_url || '');
      }
      if (lugRes.data) setLugares(lugRes.data);
    })();
  }, [idEstablecimiento]);

  const pisos = [...new Set(lugares.map(l => l.piso))].sort((a, b) => a - b);

  async function subirLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setMensaje('⚠️ Solo imágenes.'); return; }
    if (file.size > 2 * 1024 * 1024) { setMensaje('⚠️ Máximo 2 MB.'); return; }
    setSubiendo(true);
    setMensaje('');
    const ext = file.name.split('.').pop();
    const path = `${idEstablecimiento}/logo.${ext}`;
    const { error } = await supabase.storage.from('logos').upload(path, file, { upsert: true });
    if (error) {
      setMensaje('⚠️ Error al subir: ' + error.message);
      setSubiendo(false);
      return;
    }
    const { data: pub } = supabase.storage.from('logos').getPublicUrl(path);
    const url = pub.publicUrl;
    setLogoUrl(url);
    const { error: err2 } = await supabase.from('establecimientos').update({ logo_url: url }).eq('id', idEstablecimiento);
    if (err2) {
      setMensaje('⚠️ Logo subido pero no se pudo guardar en BD: ' + err2.message);
    } else {
      setMensaje('✅ Logo subido y guardado.');
    }
    setSubiendo(false);
  }

  async function guardar() {
    setGuardando(true);
    setMensaje('');
    const { error } = await supabase.from('establecimientos').update({
      nombre: nombre.trim(),
      logo_url: logoUrl.trim() || null,
    }).eq('id', idEstablecimiento);
    if (error) {
      setMensaje('⚠️ Error al guardar: ' + error.message);
    } else {
      setMensaje('✅ Datos guardados correctamente.');
    }
    setGuardando(false);
  }

  return (
    <div style={{ padding: 24, maxWidth: 640 }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, color: '#1A3C6B', margin: '0 0 20px' }}>
        🏫 Mantenedor Establecimiento
      </h1>

      {mensaje && (
        <p style={{ fontSize: 13, color: mensaje.includes('Error') ? '#fca5a5' : '#4ade80', marginBottom: 12 }}>
          {mensaje}
        </p>
      )}

      <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9', margin: '0 0 16px' }}>Datos del Establecimiento</h2>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Nombre</label>
          <input value={nombre} onChange={e => setNombre(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #475569', background: '#1e293b', color: '#f1f5f9', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Logo</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => fileRef.current?.click()} disabled={subiendo}
              style={{
                padding: '8px 16px', borderRadius: 8, border: '1px solid #475569',
                background: '#1e293b', color: '#f1f5f9', fontSize: 13, cursor: subiendo ? 'not-allowed' : 'pointer',
              }}>
              {subiendo ? '⏳ Subiendo…' : '📁 Seleccionar archivo'}
            </button>
            {logoUrl && (
              <button onClick={() => setLogoUrl('')} style={{
                padding: '4px 10px', borderRadius: 6, border: '1px solid #dc2626',
                background: 'transparent', color: '#fca5a5', fontSize: 12, cursor: 'pointer',
              }}>
                Eliminar
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={subirLogo} style={{ display: 'none' }} />
          {logoUrl && (
            <img src={logoUrl} alt="logo" style={{ height: 56, marginTop: 10, borderRadius: 8, objectFit: 'contain' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          )}
        </div>

        <button onClick={guardar} disabled={guardando}
          style={{
            padding: '10px 24px', borderRadius: 8, border: 'none',
            background: guardando ? '#334155' : '#2563eb', color: '#fff',
            fontSize: 14, fontWeight: 600, cursor: guardando ? 'not-allowed' : 'pointer',
          }}>
          {guardando ? '⏳ Guardando…' : '💾 Guardar'}
        </button>
      </div>

      <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, padding: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9', margin: '0 0 16px' }}>
          🗺️ Lugares en el Mapa ({lugares.length} total)
        </h2>
        {pisos.map(piso => {
          const items = lugares.filter(l => l.piso === piso);
          return (
            <div key={piso} style={{ marginBottom: 12 }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: '#93c5fd', margin: '0 0 6px' }}>
                Piso {piso} ({items.length})
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {items.map((l, i) => (
                  <span key={i} style={{
                    background: '#1e293b', color: '#cbd5e1', padding: '3px 10px',
                    borderRadius: 12, fontSize: 12, border: '1px solid #334155',
                  }}>
                    {l.nombre}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
