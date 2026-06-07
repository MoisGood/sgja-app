import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockSupabase, successResult, errorResult } from '../../test-utils/supabase-mock';

vi.mock('../../lib/supabase', () => {
  const mock = createMockSupabase();
  return { supabase: mock };
});

const mockUsuario = {
  id: 'u1', uid: 'u1', nombre: 'Juan', apellidos: 'Pérez',
  email: 'juan@test.cl', rol: 'PROFESOR', activo: true,
  id_establecimiento: 'e1', foto_url: null,
};

beforeEach(async () => {
  vi.clearAllMocks();
  const { supabase } = await import('../../lib/supabase') as any;
  supabase.reset();
});

describe('obtenerUsuario', () => {
  it('returns user when found', async () => {
    const { obtenerUsuario } = await import('../usuarios.service');
    const { supabase } = await import('../../lib/supabase') as any;
    supabase.chain.single.mockResolvedValue(successResult(mockUsuario));

    const result = await obtenerUsuario('u1');
    expect(result).not.toBeNull();
    expect(result!.id_usuario).toBe('u1');
    expect(supabase.from).toHaveBeenCalledWith('usuarios');
  });

  it('returns null on PGRST116 (not found)', async () => {
    const { obtenerUsuario } = await import('../usuarios.service');
    const { supabase } = await import('../../lib/supabase') as any;
    supabase.chain.single.mockResolvedValue(errorResult('Not found', 'PGRST116'));

    const result = await obtenerUsuario('nonexistent');
    expect(result).toBeNull();
  });

  it('throws on database error', async () => {
    const { obtenerUsuario } = await import('../usuarios.service');
    const { supabase } = await import('../../lib/supabase') as any;
    supabase.chain.single.mockResolvedValue(errorResult('Connection failed'));

    await expect(obtenerUsuario('u1')).rejects.toThrow();
  });
});

describe('obtenerProfesoresDelEstablecimiento', () => {
  it('returns filtered PROFESOR users', async () => {
    const { obtenerProfesoresDelEstablecimiento } = await import('../usuarios.service');
    const { supabase } = await import('../../lib/supabase') as any;
    supabase.setResult(successResult([mockUsuario]));

    const result = await obtenerProfesoresDelEstablecimiento('e1');
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
  });
});

describe('obtenerTodosLosUsuarios', () => {
  it('returns all users excluding deleted emails', async () => {
    const { obtenerTodosLosUsuarios } = await import('../usuarios.service');
    const { supabase } = await import('../../lib/supabase') as any;
    supabase.setResult(successResult([mockUsuario]));

    const result = await obtenerTodosLosUsuarios();
    expect(result).toHaveLength(1);
  });
});

describe('crearUsuario', () => {
  it('creates user successfully', async () => {
    const { crearUsuario } = await import('../usuarios.service');
    const { supabase } = await import('../../lib/supabase') as any;

    await expect(crearUsuario('u3', { email: 'test@test.cl' } as any)).resolves.not.toThrow();
    expect(supabase.from).toHaveBeenCalledWith('usuarios');
  });

  it('throws on insert error', async () => {
    const { crearUsuario } = await import('../usuarios.service');
    const { supabase } = await import('../../lib/supabase') as any;
    supabase.setResult(errorResult('Duplicate key'));

    await expect(crearUsuario('u3', { email: 'dup@test.cl' } as any)).rejects.toThrow();
  });
});

describe('actualizarUsuario', () => {
  it('updates user via repository', async () => {
    const { actualizarUsuario } = await import('../usuarios.service');
    await expect(actualizarUsuario('u1', { nombre_completo: 'Nuevo' } as any)).resolves.not.toThrow();
  });
});

describe('eliminarUsuario', () => {
  it('soft-deletes by setting activo=false', async () => {
    const { eliminarUsuario } = await import('../usuarios.service');
    const { supabase } = await import('../../lib/supabase') as any;

    await expect(eliminarUsuario('u1')).resolves.not.toThrow();
    expect(supabase.from).toHaveBeenCalledWith('usuarios');
  });
});

describe('eliminarUsuarioPermanente', () => {
  it('calls RPC function', async () => {
    const { eliminarUsuarioPermanente } = await import('../usuarios.service');
    const { supabase } = await import('../../lib/supabase') as any;

    supabase.rpc.mockResolvedValue(successResult({}));

    await expect(eliminarUsuarioPermanente('u1', 'test motivo')).resolves.not.toThrow();
    expect(supabase.rpc).toHaveBeenCalledWith('eliminar_usuario_permanente', {
      p_id_usuario: 'u1',
      p_motivo: 'test motivo',
    });
  });

  it('throws when RPC returns error', async () => {
    const { eliminarUsuarioPermanente } = await import('../usuarios.service');
    const { supabase } = await import('../../lib/supabase') as any;

    supabase.rpc.mockResolvedValue(successResult({ error: 'No puedes eliminar' }));

    await expect(eliminarUsuarioPermanente('u1', 'motivo')).rejects.toThrow('No puedes eliminar');
  });
});

describe('obtenerUsuariosPorEstablecimientoTodos', () => {
  it('returns users filtered by establecimiento', async () => {
    const { obtenerUsuariosPorEstablecimientoTodos } = await import('../usuarios.service');
    const { supabase } = await import('../../lib/supabase') as any;
    supabase.setResult(successResult([mockUsuario]));

    const result = await obtenerUsuariosPorEstablecimientoTodos('e1');
    expect(result).toHaveLength(1);
    expect(result[0].id_usuario).toBe('u1');
  });
});
