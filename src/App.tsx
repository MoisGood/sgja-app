// ============================================================
// SGJA – App Principal
// src/App.tsx
// ============================================================

import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { ThemeProvider } from './contexts/ThemeContext';
import { MonitorLecturas } from './components/MonitorLecturas';
import { TestMonitor } from './components/TestMonitor';

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
  return (
    <ThemeProvider>
      <RouterProvider router={router} />
      {mostrarMonitor && <MonitorLecturas />}
      {mostrarMonitor && <TestMonitor />}
    </ThemeProvider>
  );
}
