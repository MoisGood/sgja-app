// ============================================================
// SGJA – Hook useTheme
// src/hooks/useTheme.ts
// ============================================================

import { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContextDef';

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe usarse dentro de ThemeProvider');
  }
  return context;
}

export { obtenerColores } from '../constants/tema';
export { COLORES_TEMA } from '../constants/tema';

