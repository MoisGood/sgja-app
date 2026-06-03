// ============================================================
// SGJA – Página No Encontrada
// src/pages/NotFound.tsx
// ============================================================

import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 px-4 py-8">
      <div className="bg-white rounded-2xl p-12 md:p-16 text-center max-w-md shadow-lg">
        <p className="text-6xl md:text-7xl font-bold text-blue-900 m-0">404</p>
        <h1 className="text-2xl md:text-3xl font-bold text-blue-900 mt-4 mb-2">
          Página no encontrada
        </h1>
        <p className="text-sm md:text-base text-gray-600 mb-6 md:mb-8">
          La página que buscas no existe.
        </p>
        <button type="button" 
          onClick={() => navigate('/')}
          className="px-6 md:px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-lg hover:shadow-lg transition-shadow text-sm md:text-base"
        >
          Volver al inicio
        </button>
      </div>
    </div>
  );
}
