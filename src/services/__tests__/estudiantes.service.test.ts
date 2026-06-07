import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockSupabase, successResult, errorResult, notFoundResult } from '../../test-utils/supabase-mock';

vi.mock('../../lib/supabase', () => {
  const mock = createMockSupabase();
  return { supabase: mock };
});

const mockEstudiante = {
  id: 'e1',
  id_establecimiento: 'est1',
  rut: '12.345.678-9',
  nombre_completo: 'Pedro González',
  curso: '1A',
  anno_ingreso: 2024,
  id_apoderado: null,
  activo: true,
};

beforeEach(async () => {
  vi.clearAllMocks();
  const { supabase } = await import('../../lib/supabase') as any;
  supabase.reset();
});

describe('obtenerEstudiante', () => {
  it('returns student when found', async () => {
    const { obtenerEstudiante } = await import('../estudiantes.service');
    const { supabase } = await import('../../lib/supabase') as any;
    supabase.chain.single.mockResolvedValue(successResult(mockEstudiante));

    const result = await obtenerEstudiante('e1');
    expect(result).not.toBeNull();
    expect(supabase.from).toHaveBeenCalledWith('estudiantes');
  });

  it('returns null on PGRST116', async () => {
    const { obtenerEstudiante } = await import('../estudiantes.service');
    const { supabase } = await import('../../lib/supabase') as any;
    supabase.chain.single.mockResolvedValue(notFoundResult());

    const result = await obtenerEstudiante('nonexistent');
    expect(result).toBeNull();
  });
});

describe('crearEstudiante', () => {
  it('creates student successfully', async () => {
    const { crearEstudiante } = await import('../estudiantes.service');

    await expect(crearEstudiante({
      id_establecimiento: 'est1',
      rut: '11.111.111-1',
      nombre_completo: 'Nuevo',
      curso: '2B',
      anno_ingreso: 2025,
    })).resolves.not.toThrow();
  });
});

describe('eliminarEstudiante', () => {
  it('deletes student by id', async () => {
    const { eliminarEstudiante } = await import('../estudiantes.service');

    await expect(eliminarEstudiante('e1')).resolves.not.toThrow();
  });
});

describe('verificarRutDuplicado', () => {
  it('returns true when RUT exists', async () => {
    const { verificarRutDuplicado } = await import('../estudiantes.service');
    const { supabase } = await import('../../lib/supabase') as any;
    supabase.chain.select.mockImplementation(() => ({
      eq: () => ({
        eq: () => Promise.resolve({ count: 1, error: null, data: null }),
      }),
    }));

    const result = await verificarRutDuplicado('est1', '12.345.678-9');
    expect(result).toBe(true);
  });

  it('returns false when RUT does not exist', async () => {
    const { verificarRutDuplicado } = await import('../estudiantes.service');
    const { supabase } = await import('../../lib/supabase') as any;
    supabase.chain.select.mockImplementation(() => ({
      eq: () => ({
        eq: () => Promise.resolve({ count: 0, error: null, data: null }),
      }),
    }));

    const result = await verificarRutDuplicado('est1', '99.999.999-9');
    expect(result).toBe(false);
  });
});

describe('crearEstudiantesBatch', () => {
  it('inserts multiple students', async () => {
    const { crearEstudiantesBatch } = await import('../estudiantes.service');

    await expect(crearEstudiantesBatch([
      { id_establecimiento: 'est1', rut: '1', nombre_completo: 'A', curso: '1A', anno_ingreso: 2024, activo: true },
      { id_establecimiento: 'est1', rut: '2', nombre_completo: 'B', curso: '1A', anno_ingreso: 2024, activo: true },
    ])).resolves.not.toThrow();
  });
});
