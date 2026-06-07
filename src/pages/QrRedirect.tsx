import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function QrRedirect() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [msg, setMsg] = useState('⏳ Resolviendo código QR…');

  useEffect(() => {
    const codigo = searchParams.get('c');

    if (!codigo) {
      setMsg('⚠️ No se encontró código QR en la URL. Usa: /#/qr?c=CODIGO');
      return;
    }

    (async () => {
      // 1. Buscar en qr_codes
      const { data: qr } = await supabase
        .from('qr_codes')
        .select('tipo, id_referencia')
        .eq('codigo', codigo)
        .eq('activo', true)
        .maybeSingle();

      if (qr) {
        const destino = qr.tipo === 'lugar'
          ? `/ticket?lugar=${qr.id_referencia}`
          : `/ticket?equipo=${qr.id_referencia}`;
        navigate(destino);
        return;
      }

      // 2. Buscar por nombre de lugar (case-insensitive, toma el primero si hay duplicados)
      const { data: lugares } = await supabase
        .from('lugares')
        .select('id')
        .ilike('nombre', codigo)
        .eq('activo', true)
        .limit(1);

      if (lugares && lugares.length > 0) {
        navigate(`/ticket?lugar=${lugares[0].id}`);
        return;
      }

      setMsg(`❌ Código "${codigo}" no encontrado como QR ni como lugar.`);
    })();
  }, []);

  return (
    <div style={{ minHeight:'100vh', background:'#0f172a', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ textAlign:'center', color:'#f1f5f9' }}>
        <div style={{ fontSize:48, marginBottom:12 }}>📷</div>
        <p style={{ fontSize:16 }}>{msg}</p>
      </div>
    </div>
  );
}
