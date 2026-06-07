import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockSupabase, successResult } from '../../test-utils/supabase-mock';

vi.mock('../../lib/supabase', () => {
  const mock = createMockSupabase();
  return { supabase: mock };
});

beforeEach(async () => {
  vi.clearAllMocks();
  const { supabase } = await import('../../lib/supabase') as any;
  supabase.reset();
});

describe('guardarPermisosRol', () => {
  it('updates existing config when found', async () => {
    const { guardarPermisosRol } = await import('../roles.service');
    const { supabase } = await import('../../lib/supabase') as any;
    supabase.chain.maybeSingle.mockResolvedValue(successResult({ id: 'cfg1' }));

    await expect(guardarPermisosRol('est1', 'PROFESOR', ['/dashboard'])).resolves.not.toThrow();
  });

  it('inserts new config when not found', async () => {
    const { guardarPermisosRol } = await import('../roles.service');
    const { supabase } = await import('../../lib/supabase') as any;
    supabase.chain.maybeSingle.mockResolvedValue(successResult(null));

    await expect(guardarPermisosRol('est1', 'ADMIN', ['/dashboard'])).resolves.not.toThrow();
  });
});

describe('obtenerRolesPersonalizados', () => {
  it('returns predefined roles plus custom roles from DB', async () => {
    const { obtenerRolesPersonalizados } = await import('../roles.service');

    const result = await obtenerRolesPersonalizados('est1');
    expect(result.length).toBeGreaterThanOrEqual(5);
    const names = result.map(r => r.nombre_rol);
    expect(names).toContain('ADMIN');
    expect(names).toContain('PROFESOR');
    expect(names).toContain('ESTUDIANTE');
  });
});

describe('crearRolPersonalizado', () => {
  it('creates role and returns no error', async () => {
    const { crearRolPersonalizado } = await import('../roles.service');

    const result = await crearRolPersonalizado('est1', 'BIBLIOTECARIO', 'Encargado de biblioteca');
    expect(result.error).toBeNull();
  });
});
