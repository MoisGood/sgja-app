// ============================================================
// AGIL – Selector de Spinner (opción para cambiar el spinner)
// src/components/Common/SpinnerSelector.tsx
// ============================================================

import { useState } from 'react';
import {
  ClipLoader, RingLoader, PacmanLoader, GridLoader, PuffLoader,
  ScaleLoader, DotLoader, SyncLoader, BeatLoader, MoonLoader,
} from 'react-spinners';
import { OPCIONES_SPINNER, COLORES_SPINNER } from '../../contexts/SpinnerContextDef';
import type { TipoSpinner } from '../../contexts/SpinnerContextDef';
import { useSpinner } from '../../hooks/useSpinner';

const PREVIEW: Record<TipoSpinner, React.ComponentType<any>> = {
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

interface Props {
  temaOscuro?: boolean;
  onCambiar?: () => void;
}

export default function SpinnerSelector({ temaOscuro = false, onCambiar }: Props) {
  const { tipo, setTipo, color, setColor, tamaño, setTamaño, texto, setTexto } = useSpinner();
  const [hover, setHover] = useState<TipoSpinner | null>(null);

  const sub = temaOscuro ? '#9ca3af' : '#6b7280';
  const borde = temaOscuro ? '#374151' : '#e5e7eb';
  const activoBg = temaOscuro ? '#1a3d6b' : '#eff6ff';
  const activoBorde = '#2563EB';
  const fondo = temaOscuro ? '#1f2937' : '#ffffff';
  const inputColor = temaOscuro ? '#f3f4f6' : '#1f2937';

  const tamañosPreset = [20, 32, 48, 64];

  return (
    <div>
      {/* Selector de color */}
      <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: sub }}>
        Color del indicador
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        {COLORES_SPINNER.map(c => {
          const activo = c.toLowerCase() === color.toLowerCase();
          return (
            <button
              key={c}
              type="button"
              title={c}
              onClick={() => { setColor(c); onCambiar?.(); }}
              style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                background: c,
                border: activo ? `3px solid ${temaOscuro ? '#f3f4f6' : '#1f2937'}` : `2px solid ${borde}`,
                cursor: 'pointer',
                outline: activo ? `2px solid ${c}` : 'none',
                padding: 0,
                transition: 'all 0.15s ease',
                boxShadow: activo ? '0 0 0 2px rgba(37,99,235,0.35)' : 'none',
              }}
            />
          );
        })}
        <label
          title="Color personalizado"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            borderRadius: 8,
            border: `1px dashed ${borde}`,
            cursor: 'pointer',
            fontSize: 12,
            color: sub,
          }}
        >
          <input
            type="color"
            value={color}
            onChange={(e) => { setColor(e.target.value); onCambiar?.(); }}
            style={{ width: 26, height: 26, border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
          />
          Personalizado
        </label>
      </div>

      {/* Selector de tamaño */}
      <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: sub }}>
        Tamaño del indicador
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        {tamañosPreset.map(t => {
          const activo = t === tamaño;
          return (
            <button
              key={t}
              type="button"
              title={`${t}px`}
              onClick={() => { setTamaño(t); onCambiar?.(); }}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                border: `2px solid ${activo ? activoBorde : borde}`,
                background: activo ? activoBg : 'transparent',
                color: activo ? activoBorde : sub,
                fontSize: 13,
                fontWeight: activo ? 700 : 500,
                cursor: 'pointer',
              }}
            >
              {t}px
            </button>
          );
        })}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 160 }}>
          <input
            type="range"
            min={12}
            max={100}
            value={tamaño}
            onChange={(e) => { setTamaño(Number(e.target.value)); onCambiar?.(); }}
            style={{ flex: 1, accentColor: activoBorde }}
            title="Tamaño personalizado"
          />
          <span style={{ fontSize: 13, fontWeight: 600, color: inputColor, minWidth: 38, textAlign: 'right' }}>
            {tamaño}px
          </span>
        </div>
      </div>

      {/* Selector de texto */}
      <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: sub }}>
        Texto de carga
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.25rem' }}>
        <input
          type="text"
          value={texto}
          placeholder="Texto al lado del indicador..."
          onChange={(e) => { setTexto(e.target.value); onCambiar?.(); }}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: 8,
            border: `1px solid ${borde}`,
            background: fondo,
            color: inputColor,
            fontSize: 14,
            outline: 'none',
          }}
        />
        <button
          type="button"
          title="Quitar texto"
          onClick={() => { setTexto(''); onCambiar?.(); }}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: `1px solid ${borde}`,
            background: 'transparent',
            color: sub,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Sin texto
        </button>
      </div>

      {/* Selector de estilo */}
      <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: sub }}>
        Estilo del indicador
      </p>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
        gap: 10,
      }}>
        {OPCIONES_SPINNER.map(op => {
          const activo = op.valor === tipo;
          const Componente = PREVIEW[op.valor];
          return (
            <button
              key={op.valor}
              type="button"
              title={op.etiqueta}
              onClick={() => { setTipo(op.valor); onCambiar?.(); }}
              onMouseEnter={() => setHover(op.valor)}
              onMouseLeave={() => setHover(null)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '14px 8px',
                minHeight: 86,
                borderRadius: 10,
                border: `2px solid ${activo ? activoBorde : borde}`,
                background: activo ? activoBg : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                color: sub,
              }}
            >
              <Componente
                loading
                color={activo || hover === op.valor ? color : sub}
                size={tamaño}
                width={Math.max(2, Math.round(tamaño / 6))}
                height={Math.round(tamaño * 0.7)}
                radius={Math.max(2, Math.round(tamaño / 9))}
              />
              <span style={{ fontSize: 12, fontWeight: activo ? 700 : 500, color: sub }}>
                {op.etiqueta}
              </span>
              {activo && <span style={{ fontSize: 11, color: activoBorde, fontWeight: 700 }}>✓ Activo</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
