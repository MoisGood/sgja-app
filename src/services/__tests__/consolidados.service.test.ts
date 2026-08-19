// Tests para consolidados.service.ts
// Archivo: src/services/__tests__/consolidados.service.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockSupabase, successResult, errorResult } from '../../test-utils/supabase-mock';

const mockSupabase = createMockSupabase();

vi.mock('../../lib/supabase', () => ({
  supabase: mockSupabase,
}));

describe('consolidados.service', () => {
  beforeEach(() => {
    mockSupabase.reset();
  });

  describe('enviarConsolidado', () => {
    it('retorna consolidado al enviar correctamente', async () => {
      mockSupabase.setResult(successResult({
        id: 'c1',
        id_paradocente: 'p1',
        id_establecimiento: 'e1',
        fecha: '2026-08-16',
        cursos_json: [{ nivel: '4° Medio', curso: '4°A', total_estudiantes: 30, presentes: 28, atrasados: 1, ausentes: 1 }],
        enviado_en: new Date().toISOString(),
        observaciones: null,
      }));

      const { enviarConsolidado } = await import('../consolidados.service');
      const resultado = await enviarConsolidado('p1', 'e1', '2026-08-16', [
        { nivel: '4° Medio', curso: '4°A', total_estudiantes: 30, presentes: 28, atrasados: 1, ausentes: 1 },
      ]);

      expect(resultado).not.toBeNull();
      expect(resultado?.id).toBe('c1');
    });

    it('retorna null en error', async () => {
      mockSupabase.setResult(errorResult('DB error'));

      const { enviarConsolidado } = await import('../consolidados.service');
      const resultado = await enviarConsolidado('p1', 'e1', '2026-08-16', []);

      expect(resultado).toBeNull();
    });
  });

  describe('obtenerConsolidadosParadocente', () => {
    it('retorna consolidados de una paradocente', async () => {
      mockSupabase.setResult(successResult([
        { id: 'c1', fecha: '2026-08-16' },
        { id: 'c2', fecha: '2026-08-15' },
      ]));

      const { obtenerConsolidadosParadocente } = await import('../consolidados.service');
      const resultado = await obtenerConsolidadosParadocente('p1');

      expect(resultado).toHaveLength(2);
    });
  });

  describe('yaEnvioHoy', () => {
    it('retorna true si ya envió', async () => {
      mockSupabase.setResult(successResult([{ id: 'c1' }]));

      const { yaEnvioHoy } = await import('../consolidados.service');
      const resultado = await yaEnvioHoy('p1', '2026-08-16');

      expect(resultado).toBe(true);
    });

    it('retorna false si no envió', async () => {
      mockSupabase.setResult(successResult([]));

      const { yaEnvioHoy } = await import('../consolidados.service');
      const resultado = await yaEnvioHoy('p1', '2026-08-16');

      expect(resultado).toBe(false);
    });
  });
});
