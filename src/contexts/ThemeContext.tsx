// ============================================================
// SGJA – Contexto Global de Tema (Provider)
// src/contexts/ThemeContext.tsx
// ============================================================

import React, { useState, useEffect } from 'react';
import { ThemeContext } from './ThemeContextDef';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [temaOscuro, setTemaOscuroState] = useState(() => {
    if (typeof window === 'undefined') return false;
    const guardado = localStorage.getItem('sgja_tema_oscuro');
    return guardado ? JSON.parse(guardado) : false;
  });

  const setTemaOscuro = (valor: boolean) => {
    setTemaOscuroState(valor);
    localStorage.setItem('sgja_tema_oscuro', JSON.stringify(valor));
  };

  useEffect(() => {
    // Aplicar tema al documento
    if (temaOscuro) {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.style.colorScheme = 'dark';
      document.body.style.backgroundColor = '#111827';
      document.body.style.color = '#f3f4f6';
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.style.colorScheme = 'light';
      document.body.style.backgroundColor = '#ffffff';
      document.body.style.color = '#1f2937';
    }
  }, [temaOscuro]);

  return (
    <ThemeContext.Provider value={{ temaOscuro, setTemaOscuro }}>
      {children}
    </ThemeContext.Provider>
  );
}

export { ThemeContext };
