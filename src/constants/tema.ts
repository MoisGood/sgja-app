// ============================================================
// SGJA – Constantes de Tema
// src/constants/tema.ts
// ============================================================

export const COLORES_TEMA = {
  claro: {
    fondo: '#ffffff',
    fondoSecundario: '#f9fafb',
    fondoTerciario: '#f3f4f6',
    texto: '#1f2937',
    textoSecundario: '#6b7280',
    textoTerciario: '#9ca3af',
    borde: '#e5e7eb',
    bordeSecundario: '#d1d5db',
    cardFondo: 'white',
    inputFondo: 'white',
    inputBorde: '#d1d5db',
  },
  oscuro: {
    fondo: '#111827',
    fondoSecundario: '#1f2937',
    fondoTerciario: '#374151',
    texto: '#f3f4f6',
    textoSecundario: '#9ca3af',
    textoTerciario: '#6b7280',
    borde: '#374151',
    bordeSecundario: '#4b5563',
    cardFondo: '#1f2937',
    inputFondo: '#111827',
    inputBorde: '#4b5563',
  },
};

export function obtenerColores(temaOscuro: boolean) {
  return temaOscuro ? COLORES_TEMA.oscuro : COLORES_TEMA.claro;
}
