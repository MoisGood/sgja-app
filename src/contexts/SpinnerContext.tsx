// ============================================================
// AGIL – Contexto Global del Spinner (Provider)
// src/contexts/SpinnerContext.tsx
// ============================================================

import React, { useState } from 'react';
import {
  SpinnerContext, tipoSpinnerValido, colorSpinnerValido, tamañoSpinnerValido,
  COLOR_SPINNER_DEFECTO, TAMAÑO_SPINNER_DEFECTO, TEXTO_SPINNER_DEFECTO,
} from './SpinnerContextDef';
import type { TipoSpinner } from './SpinnerContextDef';

const CLAVE_TIPO = 'sgja_spinner';
const CLAVE_COLOR = 'sgja_spinner_color';
const CLAVE_TAMAÑO = 'sgja_spinner_tamaño';
const CLAVE_TEXTO = 'sgja_spinner_texto';

export function SpinnerProvider({ children }: { children: React.ReactNode }) {
  const [tipo, setTipoState] = useState<TipoSpinner>(() => {
    if (typeof window === 'undefined') return 'clip';
    const guardado = localStorage.getItem(CLAVE_TIPO);
    return tipoSpinnerValido(guardado) ? guardado : 'clip';
  });

  const [color, setColorState] = useState<string>(() => {
    if (typeof window === 'undefined') return COLOR_SPINNER_DEFECTO;
    const guardado = localStorage.getItem(CLAVE_COLOR);
    return colorSpinnerValido(guardado) ? guardado : COLOR_SPINNER_DEFECTO;
  });

  const [tamaño, setTamañoState] = useState<number>(() => {
    if (typeof window === 'undefined') return TAMAÑO_SPINNER_DEFECTO;
    const guardado = localStorage.getItem(CLAVE_TAMAÑO);
    if (guardado === null) return TAMAÑO_SPINNER_DEFECTO;
    const n = Number(guardado);
    return tamañoSpinnerValido(n) ? n : TAMAÑO_SPINNER_DEFECTO;
  });

  const [texto, setTextoState] = useState<string>(() => {
    if (typeof window === 'undefined') return TEXTO_SPINNER_DEFECTO;
    const guardado = localStorage.getItem(CLAVE_TEXTO);
    return guardado !== null ? guardado : TEXTO_SPINNER_DEFECTO;
  });

  const setTipo = (nuevo: TipoSpinner) => {
    setTipoState(nuevo);
    try { localStorage.setItem(CLAVE_TIPO, nuevo); } catch {}
  };

  const setColor = (nuevo: string) => {
    setColorState(nuevo);
    try { localStorage.setItem(CLAVE_COLOR, nuevo); } catch {}
  };

  const setTamaño = (nuevo: number) => {
    setTamañoState(nuevo);
    try { localStorage.setItem(CLAVE_TAMAÑO, String(nuevo)); } catch {}
  };

  const setTexto = (nuevo: string) => {
    setTextoState(nuevo);
    try { localStorage.setItem(CLAVE_TEXTO, nuevo); } catch {}
  };

  return (
    <SpinnerContext.Provider value={{ tipo, setTipo, color, setColor, tamaño, setTamaño, texto, setTexto }}>
      {children}
    </SpinnerContext.Provider>
  );
}

export { SpinnerContext };
