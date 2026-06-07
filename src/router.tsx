// ============================================================
// SGJA – Sistema de Rutas Centralizado
// src/router.tsx
// ============================================================

import { createHashRouter } from 'react-router-dom';
import Login from './pages/Login';
import AppContent from './AppContent';

export const router = createHashRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '*',
    element: <AppContent />,
  },
]);
