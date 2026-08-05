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
  estado: EstadoSolicitud.INASISTENTE,
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
  it('finds solicitud in solicitudes table', async () => {
    const { obtenerSolicitud } = await import('../solicitudes.service');
    const { supabase } = await import('../../lib/supabase') as any;
    supabase.chain.single.mockResolvedValue(successResult(mockSolicitud));

    const result = await obtenerSolicitud('s1');
    expect(result).not.toBeNull();
    expect(result!.id_solicitud).toBe('s1');
    expect(supabase.from).toHaveBeenCalledWith('solicitudes');
  });

  it('returns null when not found', async () => {
    const { obtenerSolicitud } = await import('../solicitudes.service');
    const { supabase } = await import('../../lib/supabase') as any;
    supabase.chain.single.mockResolvedValue(errorResult('Not found', 'PGRST116'));

    const result = await obtenerSolicitud('s1');
    expect(result).toBeNull();
    expect(supabase.from).toHaveBeenCalledWith('solicitudes');
  });
});

describe('obtenerSolicitudesDelEstablecimiento', () => {
  it('returns solicitudes array', async () => {
    const { obtenerSolicitudesDelEstablecimiento } = await import('../solicitudes.service');
    const { supabase } = await import('../../lib/supabase') as any;
    supabase.setResult(successResult([mockSolicitud]));

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
  it('inserts into solicitudes table', async () => {
    const { crearSolicitud } = await import('../solicitudes.service');
    const { supabase } = await import('../../lib/supabase') as any;

    await crearSolicitud(mockSolicitud);
    expect(supabase.from).toHaveBeenCalledWith('solicitudes');
  });
});

describe('justificarSolicitud (backward compat)', () => {
  it('does not throw when called', async () => {
    const { justificarSolicitud } = await import('../solicitudes.service');
    const { supabase } = await import('../../lib/supabase') as any;
    supabase.setResult(successResult([{ ...mockSolicitud, estado: EstadoSolicitud.INASISTENCIA_JUSTIFICADA }]));

    await expect(justificarSolicitud('s1', mockSolicitud, 'M01', 'Enfermedad')).resolves.not.toThrow();
    expect(supabase.from).toHaveBeenCalledWith('solicitudes');
  });
});

describe('justificarInasistencia (guarda de concurrencia)', () => {
  it('throws when el registro ya no está INASISTENTE (anulado/justificado)', async () => {
    const { justificarInasistencia } = await import('../solicitudes.service');
    const { supabase } = await import('../../lib/supabase') as any;
    supabase.setResult(successResult([]));

    await expect(
      justificarInasistencia('s1', 'M01', 'Enfermedad', 'insp1', true)
    ).rejects.toThrow('El registro fue anulado o modificado por otro usuario');
  });

  it('resolves cuando la fila fue actualizada', async () => {
    const { justificarInasistencia } = await import('../solicitudes.service');
    const { supabase } = await import('../../lib/supabase') as any;
    supabase.setResult(successResult([{ ...mockSolicitud, estado: EstadoSolicitud.INASISTENCIA_JUSTIFICADA }]));

    await expect(
      justificarInasistencia('s1', 'M01', 'Enfermedad', 'insp1', true)
    ).resolves.not.toThrow();
  });
});
