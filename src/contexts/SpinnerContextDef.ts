// ============================================================
// AGIL – Contexto del Spinner (separado para Fast Refresh)
// src/contexts/SpinnerContextDef.ts
// ============================================================

import { createContext } from 'react';

export type TipoSpinner =
  | 'clip'
  | 'ring'
  | 'pacman'
  | 'grid'
  | 'puff'
  | 'scale'
  | 'dot'
  | 'sync'
  | 'beat'
  | 'moon';

export const OPCIONES_SPINNER: { valor: TipoSpinner; etiqueta: string }[] = [
  { valor: 'clip', etiqueta: 'Clip' },
  { valor: 'ring', etiqueta: 'Ring' },
  { valor: 'pacman', etiqueta: 'Pacman' },
  { valor: 'grid', etiqueta: 'Grid' },
  { valor: 'puff', etiqueta: 'Puff' },
  { valor: 'scale', etiqueta: 'Scale' },
  { valor: 'dot', etiqueta: 'Dots' },
  { valor: 'sync', etiqueta: 'Sync' },
  { valor: 'beat', etiqueta: 'Beat' },
  { valor: 'moon', etiqueta: 'Moon' },
];

export function tipoSpinnerValido(valor: unknown): valor is TipoSpinner {
  return typeof valor === 'string' && OPCIONES_SPINNER.some(o => o.valor === valor);
}

export const COLORES_SPINNER: string[] = [
  '#2563EB',
  '#1A3C6B',
  '#7C3AED',
  '#DC2626',
  '#10B981',
  '#F59E0B',
  '#EC4899',
  '#6B7280',
];

const COLOR_DEFAULT = '#2563EB';

export function colorSpinnerValido(valor: unknown): valor is string {
  return typeof valor === 'string' && /^#[0-9a-fA-F]{6}$/.test(valor);
}

export const TAMAÑO_SPINNER_DEFECTO = 32;
export const TEXTO_SPINNER_DEFECTO = 'Cargando...';

function numeroValido(valor: unknown): valor is number {
  return typeof valor === 'number' && Number.isFinite(valor) && valor >= 12 && valor <= 100;
}

interface SpinnerContextType {
  tipo: TipoSpinner;
  setTipo: (tipo: TipoSpinner) => void;
  color: string;
  setColor: (color: string) => void;
  tamaño: number;
  setTamaño: (tamaño: number) => void;
  texto: string;
  setTexto: (texto: string) => void;
}

export { numeroValido as tamañoSpinnerValido };
export const COLOR_SPINNER_DEFECTO = COLOR_DEFAULT;
export const SpinnerContext = createContext<SpinnerContextType | undefined>(undefined);
