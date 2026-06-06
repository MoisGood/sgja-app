import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

export default function MantenedorSistema() {
  const [nombreSistema, setNombreSistema] = useState('SGJA');
  const [subtitulo, setSubtitulo] = useState('');
  const [version, setVersion] = useState('1.0.0');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [licencia, setLicencia] = useState('');
  const [autoria, setAutoria] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('config_sistema').select('*').eq('id', 1).single();
      if (data) {
        setNombreSistema(data.nombre_sistema || 'SGJA');
        setSubtitulo(data.subtitulo || '');
        setVersion(data.version || '1.0.0');
        setFaviconUrl(data.favicon_url || '');
        setLicencia(data.licencia || '');
        setAutoria(data.autoria || '');
      }
    })();
  }, []);

  async function subirFavicon(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setMensaje('⚠️ Solo imágenes.'); return; }
    if (file.size > 1 * 1024 * 1024) { setMensaje('⚠️ Máximo 1 MB.'); return; }
    setSubiendo(true);
    setMensaje('');
    const ext = file.name.split('.').pop();
    const path = `favicon/sistema.${ext}`;
    const { error } = await supabase.storage.from('logos').upload(path, file, { upsert: true });
    if (error) {
      setMensaje('⚠️ Error al subir: ' + error.message);
      setSubiendo(false);
      return;
    }
    const { data: pub } = supabase.storage.from('logos').getPublicUrl(path);
    const url = pub.publicUrl;
    setFaviconUrl(url);
    const { error: err2 } = await supabase.from('config_sistema').update({ favicon_url: url }).eq('id', 1);
    if (err2) {
      setMensaje('⚠️ Icono subido pero no se pudo guardar en BD: ' + err2.message);
    } else {
      aplicarGlobal();
      setMensaje('✅ Icono subido y guardado.');
    }
    setSubiendo(false);
  }

  async function guardar() {
    setGuardando(true);
    setMensaje('');
    const payload = {
      nombre_sistema: nombreSistema.trim(),
      subtitulo: subtitulo.trim() || null,
      version: version.trim(),
      favicon_url: faviconUrl.trim() || null,
      licencia: licencia.trim() || null,
      autoria: autoria.trim() || null,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('config_sistema').upsert({ id: 1, ...payload });
    if (error) {
      setMensaje('⚠️ Error al guardar: ' + error.message);
    } else {
      aplicarGlobal();
      setMensaje('✅ Configuración guardada correctamente.');
    }
    setGuardando(false);
  }

  function aplicarGlobal() {
    if (faviconUrl) {
      let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
      link.href = faviconUrl;
    }
    if (nombreSistema) {
      document.title = nombreSistema;
      document.querySelector('meta[property="og:title"]')?.setAttribute('content', nombreSistema);
      document.querySelector('meta[name="apple-mobile-web-app-title"]')?.setAttribute('content', nombreSistema);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #475569',
    background: '#1e293b', color: '#f1f5f9', fontSize: 14, outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ padding: 24, maxWidth: 640 }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, color: '#1A3C6B', margin: '0 0 20px' }}>
        ⚙️ Datos del Sistema
      </h1>

      {mensaje && (
        <p style={{ fontSize: 13, color: mensaje.includes('Error') ? '#fca5a5' : '#4ade80', marginBottom: 12 }}>
          {mensaje}
        </p>
      )}

      <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, padding: 20 }}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Nombre del Sistema</label>
          <input value={nombreSistema} onChange={e => setNombreSistema(e.target.value)} style={inputStyle} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Subtítulo</label>
          <input value={subtitulo} onChange={e => setSubtitulo(e.target.value)} placeholder="Breve descripción del sistema" style={inputStyle} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Versión</label>
          <input value={version} onChange={e => setVersion(e.target.value)} placeholder="1.0.0" style={inputStyle} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Icono de pestaña (Favicon)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => fileRef.current?.click()} disabled={subiendo}
              style={{
                padding: '8px 16px', borderRadius: 8, border: '1px solid #475569',
                background: '#1e293b', color: '#f1f5f9', fontSize: 13, cursor: subiendo ? 'not-allowed' : 'pointer',
              }}>
              {subiendo ? '⏳ Subiendo…' : '📁 Seleccionar archivo'}
            </button>
            {faviconUrl && (
              <button onClick={() => { setFaviconUrl(''); supabase.from('config_sistema').update({ favicon_url: null }).eq('id', 1); }} style={{
                padding: '4px 10px', borderRadius: 6, border: '1px solid #dc2626',
                background: 'transparent', color: '#fca5a5', fontSize: 12, cursor: 'pointer',
              }}>
                Eliminar
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={subirFavicon} style={{ display: 'none' }} />
          {faviconUrl && (
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <img src={faviconUrl} alt="favicon" style={{ height: 32, width: 32, borderRadius: 4, objectFit: 'contain' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <span style={{ fontSize: 12, color: '#64748b' }}>Vista previa</span>
            </div>
          )}
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Licencia</label>
          <textarea value={licencia} onChange={e => setLicencia(e.target.value)} rows={3}
            placeholder="Tipo de licencia, términos de uso…"
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Autoría</label>
          <textarea value={autoria} onChange={e => setAutoria(e.target.value)} rows={2}
            placeholder="Desarrollado por…"
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
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
    </div>
  );
}
