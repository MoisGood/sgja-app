import { describe, it, expect } from 'vitest';
import { obtenerTodasLasPaginas } from '../paginas.service';

describe('obtenerTodasLasPaginas', () => {
  it('returns a non-empty array of pages', () => {
    const pages = obtenerTodasLasPaginas();
    expect(Array.isArray(pages)).toBe(true);
    expect(pages.length).toBeGreaterThan(30);
  });

  it('each page has ruta, nombre, descripcion', () => {
    const pages = obtenerTodasLasPaginas();
    for (const p of pages) {
      expect(p).toHaveProperty('ruta');
      expect(p).toHaveProperty('nombre');
      expect(p).toHaveProperty('descripcion');
    }
  });

  it('includes key routes', () => {
    const pages = obtenerTodasLasPaginas();
    const rutas = pages.map(p => p.ruta);
    expect(rutas).toContain('/dashboard');
    expect(rutas).toContain('/configuracion');
    expect(rutas).toContain('/gestion-usuarios');
  });
});
