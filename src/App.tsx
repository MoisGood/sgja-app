// ============================================================
// SGJA – App Principal
// src/App.tsx
// ============================================================

import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { router } from './router';
import { ThemeProvider } from './contexts/ThemeContext';
import { MonitorLecturas } from './components/MonitorLecturas';
import { TestMonitor } from './components/TestMonitor';
import { syncEngine } from './services/syncEngine';

// Monitor desactivado por defecto; activar manualmente con SGJA_SHOW_MONITOR=true.
const mostrarMonitor = localStorage.getItem('SGJA_SHOW_MONITOR') === 'true';

// Agregar comando global para activar/desactivar monitor
if (typeof window !== 'undefined') {
  (window as any).toggleMonitor = () => {
    const actual = localStorage.getItem('SGJA_SHOW_MONITOR') === 'true';
    localStorage.setItem('SGJA_SHOW_MONITOR', String(!actual));
  };
  
  (window as any).showMonitor = () => {
    localStorage.setItem('SGJA_SHOW_MONITOR', 'true');
  };
  
  (window as any).hideMonitor = () => {
    localStorage.setItem('SGJA_SHOW_MONITOR', 'false');
  };
}

export default function App() {
  useEffect(() => {
    const stop = syncEngine.start();
    return stop;
  }, []);

  return (
    <ThemeProvider>
      <RouterProvider router={router} />
      <Toaster richColors position="top-right" />
      {mostrarMonitor && <MonitorLecturas />}
      {mostrarMonitor && <TestMonitor />}
    </ThemeProvider>
  );
}
