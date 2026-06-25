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

  const darkVars: Record<string, string> = {
    '--text-primary': 'var(--md-inverse-on-surface)',
    '--text-secondary': 'var(--md-outline)',
    '--bg-primary': 'var(--md-inverse-surface)',
    '--bg-secondary': '#1f2937',
    '--bg-card': '#374151',
    '--border': '#4b5563',
    '--md-surface': '#111827',
    '--md-surface-container-lowest': '#111827',
    '--md-surface-container-low': '#1a2332',
    '--md-surface-container': '#1f2937',
    '--md-surface-container-high': '#2d3748',
    '--md-surface-container-highest': '#374151',
    '--md-surface-variant': '#2d3748',
    '--md-on-surface': '#f3f4f6',
    '--md-on-surface-variant': '#9ca3af',
    '--md-secondary': '#6b7280',
    '--md-secondary-container': '#2d3748',
    '--md-on-secondary-container': '#9ca3af',
    '--md-primary-container': '#7a1f3d',
    '--md-on-primary-container': '#ffb1c2',
    '--md-primary-fixed': '#7a1f3d',
    '--md-on-primary-fixed': '#ffd9df',
    '--md-primary-fixed-dim': '#b03a5a',
    '--md-tertiary-container': '#1a3d6b',
    '--md-on-tertiary-container': '#a8c8ff',
    '--md-tertiary-fixed': '#1a3d6b',
    '--md-on-tertiary-fixed': '#d6e3ff',
    '--md-on-tertiary-fixed-variant': '#7dafff',
    '--md-outline': '#4b5563',
    '--md-outline-variant': '#374151',
    '--md-error': '#ef4444',
    '--md-on-error': '#ffffff',
    '--md-error-container': '#7f1d1d',
    '--md-on-error-container': '#fecaca',
  };

  useEffect(() => {
    const html = document.documentElement;
    if (temaOscuro) {
      html.setAttribute('data-theme', 'dark');
      html.style.colorScheme = 'dark';
      Object.entries(darkVars).forEach(([key, value]) => {
        html.style.setProperty(key, value);
      });
    } else {
      html.setAttribute('data-theme', 'light');
      html.style.colorScheme = 'light';
      Object.keys(darkVars).forEach((key) => {
        html.style.removeProperty(key);
      });
    }
  }, [temaOscuro]);

  return (
    <ThemeContext.Provider value={{ temaOscuro, setTemaOscuro }}>
      {children}
    </ThemeContext.Provider>
  );
}

export { ThemeContext };
