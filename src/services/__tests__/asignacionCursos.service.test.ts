// Tests para asignacionCursos.service.ts
// Archivo: src/services/__tests__/asignacionCursos.service.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockSupabase, successResult, errorResult } from '../../test-utils/supabase-mock';

const mockSupabase = createMockSupabase();

vi.mock('../../lib/supabase', () => ({
  supabase: mockSupabase,
}));

describe('asignacionCursos.service', () => {
  beforeEach(() => {
    mockSupabase.reset();
  });

  describe('obtenerAsignaciones', () => {
    it('retorna asignaciones del establecimiento', async () => {
      mockSupabase.setResult(successResult([
        { id: '1', id_funcionario: 'f1', id_establecimiento: 'e1', nivel: '4° Medio', curso: '4°A', creado_en: '2026-08-16' },
      ]));

      const { obtenerAsignaciones } = await import('../asignacionCursos.service');
      const resultado = await obtenerAsignaciones('e1');

      expect(resultado).toHaveLength(1);
      expect(resultado[0].nivel).toBe('4° Medio');
    });

    it('retorna array vacío en error', async () => {
      mockSupabase.setResult(errorResult('DB error'));

      const { obtenerAsignaciones } = await import('../asignacionCursos.service');
      const resultado = await obtenerAsignaciones('e1');

      expect(resultado).toHaveLength(0);
    });
  });

  describe('obtenerCursosParadocente', () => {
    it('retorna cursos de una paradocente', async () => {
      mockSupabase.setResult(successResult([
        { nivel: '4° Medio', curso: '4°A' },
        { nivel: '4° Medio', curso: '4°B' },
      ]));

      const { obtenerCursosParadocente } = await import('../asignacionCursos.service');
      const resultado = await obtenerCursosParadocente('f1');

      expect(resultado).toHaveLength(2);
    });
  });

  describe('asignarCurso', () => {
    it('retorna true al asignar correctamente', async () => {
      mockSupabase.setResult(successResult(null));

      const { asignarCurso } = await import('../asignacionCursos.service');
      const resultado = await asignarCurso('f1', 'e1', '4° Medio', '4°A');

      expect(resultado).toBe(true);
    });

    it('retorna false en error', async () => {
      mockSupabase.setResult(errorResult('Duplicate'));

      const { asignarCurso } = await import('../asignacionCursos.service');
      const resultado = await asignarCurso('f1', 'e1', '4° Medio', '4°A');

      expect(resultado).toBe(false);
    });
  });

  describe('desasignarCurso', () => {
    it('retorna true al eliminar', async () => {
      mockSupabase.setResult(successResult(null));

      const { desasignarCurso } = await import('../asignacionCursos.service');
      const resultado = await desasignarCurso('id-asignacion');

      expect(resultado).toBe(true);
    });
  });

  describe('estaAsignado', () => {
    it('retorna true si está asignado', async () => {
      mockSupabase.setResult(successResult([{ id: '1' }]));

      const { estaAsignado } = await import('../asignacionCursos.service');
      const resultado = await estaAsignado('f1', '4° Medio', '4°A');

      expect(resultado).toBe(true);
    });

    it('retorna false si no está asignado', async () => {
      mockSupabase.setResult(successResult([]));

      const { estaAsignado } = await import('../asignacionCursos.service');
      const resultado = await estaAsignado('f1', '4° Medio', '4°A');

      expect(resultado).toBe(false);
    });
  });
});
