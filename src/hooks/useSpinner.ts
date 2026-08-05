// ============================================================
// AGIL – Hook useSpinner
// src/hooks/useSpinner.ts
// ============================================================

import { useContext } from 'react';
import { SpinnerContext } from '../contexts/SpinnerContextDef';

export function useSpinner() {
  const context = useContext(SpinnerContext);
  if (!context) {
    throw new Error('useSpinner debe usarse dentro de SpinnerProvider');
  }
  return context;
}
