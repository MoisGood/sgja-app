// ============================================================
// SGJA – Sistema de Rutas Centralizado
// src/router.tsx
// ============================================================

import { createBrowserRouter } from 'react-router-dom';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import AppContent from './AppContent';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppContent />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);
