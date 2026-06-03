// ============================================================
// SGJA – Contexto del Tema (separado para Fast Refresh)
// src/contexts/ThemeContextDef.ts
// ============================================================

import { createContext } from 'react';

interface ThemeContextType {
  temaOscuro: boolean;
  setTemaOscuro: (valor: boolean) => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
