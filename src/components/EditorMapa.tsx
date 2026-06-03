const EDITOR_PATH = '/editor_plano.html';

export default function EditorMapa() {
  const abrirEditor = () => {
    const url = `${window.location.origin}${EDITOR_PATH}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: 12,
      padding: '48px 32px',
      textAlign: 'center',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    }}>
      <p style={{ fontSize: 48, margin: '0 0 16px 0' }}>🗺️</p>
      <h3 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 600, color: '#1f2937' }}>
        Editor de Plano
      </h3>
      <p style={{ margin: '0 0 24px 0', fontSize: 14, color: '#6b7280' }}>
        Abre el editor visual en una nueva pestaña para modificar las ubicaciones del mapa.
      </p>
      <button
        onClick={abrirEditor}
        style={{
          padding: '10px 24px', borderRadius: 8, border: 'none',
          background: '#2563eb', color: '#fff', fontSize: 14,
          cursor: 'pointer', fontWeight: 600,
        }}
      >
        ✏️ Abrir Editor
      </button>
    </div>
  );
}
