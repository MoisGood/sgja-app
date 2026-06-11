import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import MapaPiso from '../components/MapaPiso';
import ConfigurarMapa from '../components/ConfigurarMapa';
import EditorMapa from '../components/EditorMapa';
import SyncMapa from '../components/SyncMapa';

interface Props {
  idEstablecimiento: string;
  tabInicial?: string;
}

const TABS = [
  { id: 'mapa', etiqueta: 'Mapa' },
  { id: 'sync', etiqueta: 'Sincronizar' },
  { id: 'configurar', etiqueta: 'Configurar Mapa' },
  { id: 'editor', etiqueta: 'Editor mapa' },
];

export default function Tecnico({ idEstablecimiento, tabInicial = 'mapa' }: Props) {
  const [cargando, setCargando] = useState(true);
  const [tab, setTab] = useState(tabInicial);

  useEffect(() => {
    if (!idEstablecimiento) return;
    supabase.from('equipos').select('*')
      .eq('id_establecimiento', idEstablecimiento)
      .then(() => { setCargando(false); });
  }, [idEstablecimiento]);

  if (!idEstablecimiento) return null;
  if (cargando) return <p style={{ color: '#94a3b8' }}>⏳ Cargando…</p>;

  const tabStyle = (activo: boolean): React.CSSProperties => ({
    padding: '8px 20px',
    borderRadius: '8px 8px 0 0',
    border: 'none',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: activo ? 600 : 400,
    background: activo ? '#0f172a' : 'transparent',
    color: activo ? '#fbbf24' : '#94a3b8',
    borderBottom: activo ? '2px solid #fbbf24' : '2px solid transparent',
    transition: 'all 0.15s',
  });

  return (
    <div style={{ padding: '12px 8px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#1A3C6B', marginBottom: 16 }}>🛠️ Técnico - Ubicaciones</h1>

      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #334155', marginBottom: 20 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={tabStyle(tab === t.id)}>
            {t.etiqueta}
          </button>
        ))}
      </div>

      {tab === 'mapa' && <MapaPiso idEstablecimiento={idEstablecimiento} />}
      {tab === 'sync' && <SyncMapa idEstablecimiento={idEstablecimiento} />}
      {tab === 'configurar' && <ConfigurarMapa idEstablecimiento={idEstablecimiento} />}
      {tab === 'editor' && <EditorMapa />}
    </div>
  );
}