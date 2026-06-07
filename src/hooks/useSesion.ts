import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface SesionState {
  user: User | null;
  session: Session | null;
  cargando: boolean;
}

function limpiarStorage() {
  localStorage.removeItem('id_usuario_actual');
  sessionStorage.removeItem('id_usuario_actual');
  sessionStorage.removeItem('auth_error');
}

export function useSesion(): SesionState {
  const [state, setState] = useState<SesionState>(() => ({
    user: null,
    session: null,
    cargando: true,
  }));

  useEffect(() => {
    let mounted = true;
    let authEventReceived = false;
    let settleTimer: ReturnType<typeof setTimeout>;

    const actualizar = (session: Session | null) => {
      if (!mounted) return;

      if (!session?.user) {
        limpiarStorage();
      }

      setState({
        user: session?.user ?? null,
        session,
        cargando: false,
      });
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        authEventReceived = true;
        clearTimeout(settleTimer);
        settleTimer = setTimeout(() => actualizar(session), 800);
      }
    );

    const safetyTimer = setTimeout(() => {
      if (mounted && !authEventReceived) {
        setState(prev => ({ ...prev, cargando: false }));
      }
    }, 30000);

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      clearTimeout(settleTimer);
      subscription?.unsubscribe();
    };
  }, []);

  return state;
}
