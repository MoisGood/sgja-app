import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockSupabase, successResult, errorResult } from '../../test-utils/supabase-mock';

vi.mock('../../lib/supabase', () => {
  const mock = createMockSupabase();
  return { supabase: mock };
});

beforeEach(async () => {
  vi.clearAllMocks();
  const { supabase } = await import('../../lib/supabase') as any;
  supabase.reset();
});

describe('enviarSolicitudRegistro', () => {
  it('inserts a pending registration request', async () => {
    const { enviarSolicitudRegistro } = await import('../registro.service');
    const { supabase } = await import('../../lib/supabase') as any;

    const result = await enviarSolicitudRegistro('u1', 'test@test.cl', 'Juan', 'Pérez');
    expect(result.error).toBeNull();
    expect(supabase.from).toHaveBeenCalledWith('solicitudes_registro');
  });

  it('returns error message on failure', async () => {
    const { enviarSolicitudRegistro } = await import('../registro.service');
    const { supabase } = await import('../../lib/supabase') as any;
    supabase.setResult(errorResult('Duplicate entry'));

    const result = await enviarSolicitudRegistro('u1', 'dup@test.cl', 'Juan', 'Pérez');
    expect(result.error).toBe('Duplicate entry');
  });
});

describe('aprobarSolicitud', () => {
  it('calls RPC and returns success', async () => {
    const { aprobarSolicitud } = await import('../registro.service');
    const { supabase } = await import('../../lib/supabase') as any;

    supabase.rpc.mockResolvedValue(successResult({}));

    const result = await aprobarSolicitud('u1', 'PROFESOR');
    expect(result.error).toBeNull();
    expect(supabase.rpc).toHaveBeenCalledWith('aprobar_solicitud_registro', {
      p_uid: 'u1',
      p_rol: 'PROFESOR',
    });
  });
});

describe('guardarDatosPersonales', () => {
  it('saves DatosPersonales for non-funcionario user', async () => {
    const { guardarDatosPersonales, DatosPersonales } = await import('../registro.service');
    const { supabase } = await import('../../lib/supabase') as any;

    const mockDatos: DatosPersonales = {
      uid: 'u1',
      rut: null,
      nombres: 'Juan',
      apellidos: 'Pérez',
      email_personal: null,
      telefono: null,
      ciudad: null,
      direccion: null,
      asignatura: null,
      horas: null,
      emergencia_nombre: null,
      emergencia_telefono: null,
      emergencia_parentesco: null,
    };

    supabase.chain.upsert = vi.fn(() => Promise.resolve(successResult(null)));

    const result = await guardarDatosPersonales(mockDatos);
    expect(result.error).toBeNull();
  });
});

describe('obtenerSolicitudesPaginadas', () => {
  it('returns paginated results with count', async () => {
    const { obtenerSolicitudesPaginadas } = await import('../registro.service');
    const { supabase } = await import('../../lib/supabase') as any;

    const mockData = [
      { id_solicitud: 1, uid: 'u1', nombre: 'A', apellidos: 'B', correo: 'a@b.cl', fecha_solicitud: '2026-01-01', estado: 'pendiente', respuesta_enviada: false, fecha_respuesta: null },
    ];

    supabase.chain.select = vi.fn(() => ({
      order: vi.fn(() => ({
        range: vi.fn(() => Promise.resolve(successResult(mockData))),
      })),
    }));

    const result = await obtenerSolicitudesPaginadas(1, 7);
    expect(result.data).toHaveLength(1);
    expect(typeof result.total).toBe('number');
  });
});
