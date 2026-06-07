import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockSupabase, successResult, errorResult } from '../../test-utils/supabase-mock';
import { EstadoSolicitud } from '../../types';

vi.mock('../../lib/supabase', () => {
  const mock = createMockSupabase();
  return { supabase: mock };
});

const mockSolicitud = {
  id_solicitud: 's1',
  id_establecimiento: 'est1',
  id_estudiante: 'e1',
  id_profesor: 'p1',
  tipo: 'INASISTENCIA',
  fecha: '2026-06-01',
  hora: '09:00',
  estado: EstadoSolicitud.INJUSTIFICADA,
  motivo_codigo: null,
  motivo_descripcion: null,
  observaciones: null,
  respaldo_recibido: false,
  tipo_respaldo: null,
  id_token_qr: null,
};

beforeEach(async () => {
  vi.clearAllMocks();
  const { supabase } = await import('../../lib/supabase') as any;
  supabase.reset();
});

describe('obtenerSolicitud', () => {
  it('finds solicitud in justificadas first', async () => {
    const { obtenerSolicitud } = await import('../solicitudes.service');
    const { supabase } = await import('../../lib/supabase') as any;
    supabase.chain.single.mockResolvedValue(successResult(mockSolicitud));

    const result = await obtenerSolicitud('s1');
    expect(result).not.toBeNull();
    expect(result!.id_solicitud).toBe('s1');
    expect(supabase.from).toHaveBeenCalledWith('justificadas');
  });

  it('falls back to injustificadas when not in justificadas', async () => {
    const { obtenerSolicitud } = await import('../solicitudes.service');
    const { supabase } = await import('../../lib/supabase') as any;
    supabase.chain.single
      .mockResolvedValueOnce(errorResult('Not found', 'PGRST116'))
      .mockResolvedValueOnce(successResult(mockSolicitud));

    const result = await obtenerSolicitud('s1');
    expect(result).not.toBeNull();
    expect(supabase.from).toHaveBeenCalledWith('injustificadas');
  });
});

describe('obtenerSolicitudesDelEstablecimiento', () => {
  it('returns solicitudes array', async () => {
    const { obtenerSolicitudesDelEstablecimiento } = await import('../solicitudes.service');
    const { supabase } = await import('../../lib/supabase') as any;
    let callIdx = 0;
    supabase.from = vi.fn(() => {
      callIdx++;
      supabase.setResult(successResult(callIdx <= 1 ? [] : [mockSolicitud]));
      return supabase.chain;
    });

    const result = await obtenerSolicitudesDelEstablecimiento('est1');
    expect(Array.isArray(result)).toBe(true);
  });

  it('returns empty array on error', async () => {
    const { obtenerSolicitudesDelEstablecimiento } = await import('../solicitudes.service');
    const { supabase } = await import('../../lib/supabase') as any;
    supabase.setResult(errorResult('DB error'));

    const result = await obtenerSolicitudesDelEstablecimiento('est1');
    expect(result).toEqual([]);
  });
});

describe('crearSolicitud', () => {
  it('inserts into justificadas when JUSTIFICADA', async () => {
    const { crearSolicitud } = await import('../solicitudes.service');
    const { supabase } = await import('../../lib/supabase') as any;

    await crearSolicitud({ ...mockSolicitud, estado: EstadoSolicitud.JUSTIFICADA });
    expect(supabase.from).toHaveBeenCalledWith('justificadas');
  });

  it('inserts into injustificadas otherwise', async () => {
    const { crearSolicitud } = await import('../solicitudes.service');
    const { supabase } = await import('../../lib/supabase') as any;

    await crearSolicitud(mockSolicitud);
    expect(supabase.from).toHaveBeenCalledWith('injustificadas');
  });
});

describe('justificarSolicitud', () => {
  it('moves from injustificadas to justificadas', async () => {
    const { justificarSolicitud } = await import('../solicitudes.service');
    const { supabase } = await import('../../lib/supabase') as any;

    await expect(justificarSolicitud('s1', mockSolicitud, 'M01', 'Enfermedad')).resolves.not.toThrow();
  });
});
