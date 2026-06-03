// ============================================================
// Componente de Prueba de Conexión a Supabase
// src/components/TestSupabaseConnection.tsx
// ============================================================

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export function TestSupabaseConnection() {
  const [status, setStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  const [message, setMessage] = useState<string>('Verificando conexión...');
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log('🔄 Iniciando prueba de conexión con Supabase...');
        
        // Obtener el estado de autenticación
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw new Error(`Error al obtener sesión: ${sessionError.message}`);
        }

        // Intentar una consulta simple
        const { data, error } = await supabase
          .from('usuarios')
          .select('*')
          .limit(1);

        if (error) {
          // Si la tabla no existe, es normal, pero la conexión funciona
          if (error.code === 'PGRST116') {
            console.warn('⚠️ La tabla "usuarios" no existe, pero la conexión funciona');
            setStatus('connected');
            setMessage('✅ Conexión con Supabase: EXITOSA');
            setDetails({
              url: SUPABASE_URL,
              connected: true,
              message: 'La conexión con Supabase funciona correctamente',
              session: session ? 'Sesión activa' : 'No hay sesión',
              error: 'La tabla "usuarios" no existe (es normal en prueba inicial)',
            });
          } else {
            throw error;
          }
        } else {
          setStatus('connected');
          setMessage('✅ Conexión con Supabase: EXITOSA');
          setDetails({
            url: SUPABASE_URL,
            connected: true,
            recordsFound: data?.length || 0,
            session: session ? 'Sesión activa' : 'No hay sesión',
          });
        }
      } catch (err: any) {
        console.error('❌ Error de conexión:', err);
        setStatus('error');
        setMessage(`❌ Error: ${err.message}`);
        setDetails({
          error: err.message,
          url: SUPABASE_URL,
        });
      }
    };

    testConnection();
  }, []);

  return (
    <div style={{
      padding: '20px',
      margin: '20px',
      border: '2px solid',
      borderRadius: '8px',
      fontFamily: 'monospace',
      borderColor: status === 'connected' ? 'green' : status === 'error' ? 'red' : 'blue',
      backgroundColor: status === 'connected' ? '#f0fff4' : status === 'error' ? '#fff5f5' : '#f0f4ff',
    }}>
      <h2 style={{ margin: '0 0 10px 0' }}>
        {status === 'loading' && '⏳ Probando conexión...'}
        {status === 'connected' && '✅ Conexión exitosa'}
        {status === 'error' && '❌ Error de conexión'}
      </h2>
      <p style={{ margin: '10px 0' }}>{message}</p>
      {details && (
        <details style={{ margin: '10px 0' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Ver detalles</summary>
          <pre style={{
            backgroundColor: '#f9f9f9',
            padding: '10px',
            borderRadius: '4px',
            overflow: 'auto',
            maxHeight: '300px',
            marginTop: '10px',
          }}>
            {JSON.stringify(details, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}
