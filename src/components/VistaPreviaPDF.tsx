// src/components/VistaPreviaPDF.tsx
// CFB — Modal con visor PDF incrustado para imprimir el documento oficial

import { X, Printer } from 'lucide-react';

interface Props {
  pdfUrl: string;
  cerrar: () => void;
}

const VistaPreviaPDF = ({ pdfUrl, cerrar }: Props) => {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.6)', display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 12, padding: '10px 16px',
        background: '#1A3C6B', color: '#fff', flexShrink: 0
      }}>
        <button
          onClick={() => {
            const w = window.open(pdfUrl, '_blank');
            if (w) setTimeout(() => w.print(), 500);
          }}
          style={{
            padding: '8px 24px', background: '#fff', color: '#1A3C6B',
            border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
          }}>
          <Printer size={16} /> Imprimir
        </button>
        <button onClick={cerrar}
          style={{
            padding: '8px 16px', background: 'transparent', color: '#fff',
            border: '1px solid rgba(255,255,255,0.4)', borderRadius: 6,
            fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
          }}>
          <X size={16} /> Cerrar
        </button>
      </div>

      {/* Visor PDF — iframe más fiable que embed */}
      <div style={{ flex: 1, background: '#525659' }}>
        <iframe
          src={pdfUrl}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="PDF Declaración de Accidente Escolar"
        />
      </div>
    </div>
  );
};

export default VistaPreviaPDF;
