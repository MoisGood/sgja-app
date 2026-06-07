import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Camera, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

export default function MobileQrScanner() {
  const navigate = useNavigate();
  const [camError, setCamError] = useState('');
  const [detenido, setDetenido] = useState(false);
  const [scanKey, setScanKey] = useState(0);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    let activo = true;

    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCamError('Tu navegador no soporta acceso a cámara.');
        return;
      }
      try {
        const testStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        testStream.getTracks().forEach(t => t.stop());
      } catch {
        setCamError('Permiso de cámara denegado');
        return;
      }
      await new Promise(r => setTimeout(r, 100));
      const el = document.getElementById('m-qr-reader');
      if (!el || !activo) return;
      try {
        const scanner = new Html5Qrcode('m-qr-reader');
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (texto) => {
            if (!activo) return;
            scanner.stop().catch(() => {});
            scannerRef.current = null;
            setDetenido(true);
            const match = texto.match(/[?&]c=([^&]+)/);
            const codigo = match ? decodeURIComponent(match[1]) : texto;
            navigate(`/tecnico/qr?c=${encodeURIComponent(codigo)}`);
          },
          () => {},
        );
      } catch (err: any) {
        if (!activo) return;
        const msg = err?.message || '';
        if (msg.includes('NotAllowed') || msg.includes('Permission')) setCamError('Permiso denegado');
        else if (msg.includes('NotFound')) setCamError('No se detectó cámara');
        else if (msg.includes('NotReadable')) setCamError('Cámara ocupada por otra app');
        else setCamError('No se pudo acceder a la cámara');
      }
    })();

    return () => {
      activo = false;
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [scanKey]);

  const reintentar = () => {
    setCamError('');
    setDetenido(false);
    setScanKey(k => k + 1);
  };

  if (camError) {
    return (
      <div style={{ padding: '16px 16px 72px', textAlign: 'center' }}>
        <AlertTriangle size={24} style={{ color: '#dc2626', marginBottom: 8 }} />
        <p style={{ fontSize: 14, color: '#dc2626', marginBottom: 16 }}>{camError}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={reintentar}
            style={{
              padding: '10px 20px', borderRadius: 8, border: 'none',
              background: '#16a34a', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <RefreshCw size={16} />
            Reintentar
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/tecnico/m/inicio')}
            style={{
              padding: '10px 20px', borderRadius: 8, border: 'none',
              background: '#1e40af', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Volver al inicio
          </motion.button>
        </div>
      </div>
    );
  }

  if (detenido) {
    return (
      <div style={{ padding: '16px 16px 72px', textAlign: 'center' }}>
        <CheckCircle2 size={28} style={{ color: '#16a34a', marginBottom: 8 }} />
        <p style={{ color: '#16a34a', fontSize: 14 }}>Código detectado, redirigiendo…</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px 16px 72px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <button onClick={() => navigate('/tecnico/m/inicio')} style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#1A3C6B', display: 'flex',
        }}><ArrowLeft size={22} /></button>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: '#1A3C6B', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Camera size={20} />
          Escanear QR
        </h1>
      </div>
      <div id="m-qr-reader" style={{
        width: '100%', maxWidth: 320, margin: '0 auto', borderRadius: 8, overflow: 'hidden',
        minHeight: 250,
      }} />
      <p style={{ color: '#9CA3AF', fontSize: 12, textAlign: 'center', marginTop: 12 }}>
        Apunta la cámara a un código QR
      </p>
    </div>
  );
}
