// Tests para syncManager.service.ts
// Archivo: src/services/__tests__/syncManager.service.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  sincronizarTodo,
  estadisticasSync,
} from '../syncManager.service';
import { agregarOperacion, limpiarTabla as limpiarCola } from '../offlineQueue.service';
import { limpiarTabla } from '../localDb.service';
import 'fake-indexeddb/auto';

// Mock de supabase
const { mockInsert, mockUpdate, mockSingle, mockEq, mockSelect, mockFrom } = vi.hoisted(() => {
  const mockSingle = vi.fn(() => Promise.resolve({ data: null, error: null }));
  const mockEq2 = vi.fn(() => ({ single: mockSingle }));
  const mockEq1 = vi.fn(() => ({ eq: mockEq2, single: mockSingle }));
  const mockInsert = vi.fn(() => Promise.resolve({ data: null, error: null }));
  const mockUpdate = vi.fn(() => ({
    eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
  }));
  const mockSelect = vi.fn(() => ({ limit: vi.fn(() => Promise.resolve({ data: [], error: null })), eq: mockEq1 }));
  const mockFrom = vi.fn(() => ({ select: mockSelect, insert: mockInsert, update: mockUpdate }));
  return { mockInsert, mockUpdate, mockSingle, mockEq: mockEq1, mockSelect, mockFrom };
});

vi.mock('../../lib/supabase', () => ({
  supabase: { from: mockFrom },
}));

describe('syncManager.service', () => {
  beforeEach(async () => {
    await limpiarTabla('estudiantes');
    await limpiarTabla('asistencia');
    await limpiarTabla('cola_sync');
    vi.clearAllMocks();
    mockInsert.mockResolvedValue({ data: null, error: null });
    mockFrom.mockReturnValue({ select: mockSelect, insert: mockInsert, update: mockUpdate });
  });

  describe('sincronizarTodo', () => {
    it('retorna 0 si no hay operaciones pendientes', async () => {
      const resultado = await sincronizarTodo();
      expect(resultado.exitosas).toBe(0);
      expect(resultado.fallidas).toBe(0);
    });

    it('sincroniza operaciones pendientes', async () => {
      await agregarOperacion('asistencia', {
        estudiante_id: 'e1',
        fecha: '2026-08-16',
        estado: 'presente',
        registrado_por: 'func-001',
      });

      const resultado = await sincronizarTodo();
      expect(resultado.exitosas).toBe(1);
    });

    it('maneja errores de red', async () => {
      // Forzar error en supabase
      mockInsert.mockResolvedValue({ data: null, error: { message: 'Network error' } });
      mockFrom.mockReturnValue({
        select: mockSelect,
        insert: mockInsert,
        update: mockUpdate,
      });

      await agregarOperacion('asistencia', {
        estudiante_id: 'e1',
        fecha: '2026-08-16',
        estado: 'presente',
        registrado_por: 'func-001',
      });

      const resultado = await sincronizarTodo();
      expect(resultado.exitosas).toBe(0);
      expect(resultado.fallidas).toBe(1);
      expect(resultado.errores.length).toBe(1);
    });
  });

  describe('estadisticasSync', () => {
    it('retorna estadísticas correctas', async () => {
      await agregarOperacion('asistencia', { id: '1' });
      await agregarOperacion('retiro', { id: '2' });

      const stats = await estadisticasSync();
      expect(stats.total).toBe(2);
      expect(stats.pendientes).toBe(2);
      expect(typeof stats.conectado).toBe('boolean');
    });
  });
});
