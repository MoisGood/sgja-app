// ============================================================
// AGIL – Componente Spinner (react-spinners + contexto configurable)
// src/components/Common/Spinner.tsx
// ============================================================

import {
  ClipLoader, RingLoader, PacmanLoader, GridLoader, PuffLoader,
  ScaleLoader, DotLoader, SyncLoader, BeatLoader, MoonLoader,
} from 'react-spinners';
import { useSpinner } from '../../hooks/useSpinner';
import type { TipoSpinner } from '../../contexts/SpinnerContextDef';

interface SpinnerProps {
  tamaño?: number;
  color?: string;
  texto?: string;
  tipo?: TipoSpinner;
  alinear?: 'centro' | 'izquierda' | 'derecha';
  estiloTexto?: React.CSSProperties;
}

const COMPONENTES: Record<TipoSpinner, React.ComponentType<any>> = {
  clip: ClipLoader,
  ring: RingLoader,
  pacman: PacmanLoader,
  grid: GridLoader,
  puff: PuffLoader,
  scale: ScaleLoader,
  dot: DotLoader,
  sync: SyncLoader,
  beat: BeatLoader,
  moon: MoonLoader,
};

export default function Spinner({
  tamaño: tamañoForzado,
  color: colorForzado,
  texto: textoForzado,
  tipo: tipoForzado,
  alinear = 'centro',
  estiloTexto,
}: SpinnerProps) {
  const { tipo, color, tamaño, texto } = useSpinner();
  const tipoEfectivo = tipoForzado || tipo;
  const colorEfectivo = colorForzado || color;
  const tamañoEfectivo = tamañoForzado ?? tamaño;
  const textoEfectivo = textoForzado !== undefined ? textoForzado : texto;
  const Componente = COMPONENTES[tipoEfectivo];

  const propsPorTipo: Record<string, Record<string, number | string>> = {
    scale: { width: Math.max(2, Math.round(tamañoEfectivo / 6)), height: Math.round(tamañoEfectivo * 0.7), radius: Math.max(2, Math.round(tamañoEfectivo / 9)) },
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: textoEfectivo ? 'column' : 'row',
        alignItems: 'center',
        justifyContent: alinear === 'centro' ? 'center' : alinear === 'izquierda' ? 'flex-start' : 'flex-end',
        gap: textoEfectivo ? 10 : 0,
        padding: textoEfectivo ? 16 : 0,
      }}
    >
      <Componente loading color={colorEfectivo} size={tamañoEfectivo} {...propsPorTipo[tipoEfectivo]} />
      {textoEfectivo && (
        <span style={{ fontSize: 14, color: '#6B7280', fontWeight: 500, ...estiloTexto }}>{textoEfectivo}</span>
      )}
    </div>
  );
}
