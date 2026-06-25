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

/* ──────────────────────────────────────────────
   Helpers
   ────────────────────────────────────────────── */

/** Simula la query de conteo que hace validarTicket internamente. */
function mockUserTicketCount(supabase: any, count: number) {
  supabase.chain.select = vi.fn((sel?: string, opts?: any) => {
    if (opts?.count === 'exact' && opts?.head === true) {
      return { eq: vi.fn(() => ({ in: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ count })) })) })) };
    }
    return supabase.chain;
  });
}

/** Fuerza a chain.select a delegar en supabase.chain (default). */
function restoreChainSelect(supabase: any) {
  supabase.chain.select = vi.fn(() => supabase.chain);
}

/* ──────────────────────────────────────────────
   validarTicket
   ────────────────────────────────────────────── */

describe('validarTicket', () => {
  it('1. equipo en estado Baja → bloqueante', async () => {
    const { validarTicket } = await import('../requerimiento.service');
    const res = await validarTicket({
      equipo: { id: 'e1', estado: 'Baja' },
      posibleFalla: '',
      solicitanteId: 's1',
    });
    expect(res).toEqual({ type: 'bloqueante', mensaje: expect.stringContaining('dado de baja') });
  });

  it('2. equipo sin usuario responsable → advertencia', async () => {
    const { validarTicket } = await import('../requerimiento.service');
    const res = await validarTicket({
      equipo: { id: 'e1', estado: 'Operativo', id_usuario: null },
      posibleFalla: '',
      solicitanteId: 's1',
    });
    expect(res).toEqual({ type: 'advertencia', mensaje: expect.stringContaining('no tiene un usuario responsable') });
  });

  it('3. usuario responsable inactivo → advertencia', async () => {
    const { validarTicket } = await import('../requerimiento.service');
    const { supabase } = await import('../../lib/supabase') as any;
    supabase.chain.maybeSingle.mockResolvedValue(successResult({ activo: false }));
    const res = await validarTicket({
      equipo: { id: 'e1', estado: 'Operativo', id_usuario: 'u1' },
      posibleFalla: '',
      solicitanteId: 's1',
    });
    expect(res).toEqual({ type: 'advertencia', mensaje: expect.stringContaining('inactivo') });
  });

  it('4. misma falla duplicada → bloqueante', async () => {
    const { validarTicket } = await import('../requerimiento.service');
    const { supabase } = await import('../../lib/supabase') as any;
    supabase.chain.limit.mockResolvedValue(successResult([{ id: 'dup' }]));
    const res = await validarTicket({
      equipo: { id: 'e1', estado: 'Operativo', id_usuario: 'u1' },
      posibleFalla: 'no enciende',
      solicitanteId: 's1',
    });
    expect(res).toEqual({ type: 'bloqueante', mensaje: expect.stringContaining('falla similar') });
  });

  it('5. falla diferente en mismo equipo → permite', async () => {
    const { validarTicket } = await import('../requerimiento.service');
    const { supabase } = await import('../../lib/supabase') as any;
    supabase.chain.limit.mockResolvedValue(successResult([]));
    const res = await validarTicket({
      equipo: { id: 'e1', estado: 'Operativo', id_usuario: 'u1' },
      posibleFalla: 'ruido extraño',
      solicitanteId: 's1',
    });
    expect(res).toBeNull();
  });

  it('6. lugar sin soporte → advertencia', async () => {
    const { validarTicket } = await import('../requerimiento.service');
    const res = await validarTicket({
      equipo: null,
      posibleFalla: '',
      solicitanteId: 's1',
      lugarSoporte: false,
    });
    expect(res).toEqual({ type: 'advertencia', mensaje: expect.stringContaining('no tiene soporte') });
  });

  it('7. usuario con 3+ tickets activos → advertencia', async () => {
    const { validarTicket } = await import('../requerimiento.service');
    const { supabase } = await import('../../lib/supabase') as any;
    mockUserTicketCount(supabase, 3);
    const res = await validarTicket({
      equipo: null,
      posibleFalla: '',
      solicitanteId: 's1',
    });
    expect(res).toEqual({ type: 'advertencia', mensaje: expect.stringContaining('3 o más tickets') });
    restoreChainSelect(supabase);
  });

  it('8. sin equipo y sin restricciones → permite', async () => {
    const { validarTicket } = await import('../requerimiento.service');
    const res = await validarTicket({
      equipo: null,
      posibleFalla: '',
      solicitanteId: 's1',
    });
    expect(res).toBeNull();
  });

  it('9. sin equipo pero usuario con 2 tickets → permite (límite es 3)', async () => {
    const { validarTicket } = await import('../requerimiento.service');
    const { supabase } = await import('../../lib/supabase') as any;
    mockUserTicketCount(supabase, 2);
    const res = await validarTicket({
      equipo: null,
      posibleFalla: '',
      solicitanteId: 's1',
    });
    expect(res).toBeNull();
    restoreChainSelect(supabase);
  });

  it('10. posibleFalla vacía no busca duplicados', async () => {
    const { validarTicket } = await import('../requerimiento.service');
    const { supabase } = await import('../../lib/supabase') as any;
    supabase.chain.limit = vi.fn();
    await validarTicket({
      equipo: { id: 'e1', estado: 'Operativo', id_usuario: 'u1' },
      posibleFalla: '',
      solicitanteId: 's1',
    });
    expect(supabase.chain.limit).not.toHaveBeenCalled();
  });
});

/* ──────────────────────────────────────────────
   crearRequerimiento — flujo por lugar
   ────────────────────────────────────────────── */

describe('crearRequerimiento con lugar (RPC)', () => {
  it('11. éxito: RPC inserta correctamente con código ABREVxx-xxx', async () => {
    const { crearRequerimiento } = await import('../requerimiento.service');
    const { supabase } = await import('../../lib/supabase') as any;

    supabase.chain.single.mockResolvedValue(successResult({ abreviatura: 'SALA' }));
    supabase.rpc.mockResolvedValue(successResult(null));

    const res = await crearRequerimiento({
      idEstablecimiento: 'est1',
      idLugar: 'l1',
      idSolicitante: 's1',
      tipoReq: 'Reparación',
      descripcion: 'Monitor no enciende',
      diagnostico: 'Fusible quemado',
      prioridad: 'Normal',
    });

    expect(res.error).toBeUndefined();
    expect(res.codigo).toMatch(/^SALA\d{2}-\d{3}$/);
    expect(supabase.rpc).toHaveBeenCalledWith('insertar_requerimiento', expect.objectContaining({
      p_id_lugar: 'l1',
    }));
    expect(supabase.chain.insert).not.toHaveBeenCalled();
  });

  it('12. RPC falla → fallback a insert directo', async () => {
    const { crearRequerimiento } = await import('../requerimiento.service');
    const { supabase } = await import('../../lib/supabase') as any;

    supabase.chain.single.mockResolvedValue(successResult({ abreviatura: 'LAB' }));
    supabase.rpc.mockResolvedValue(errorResult('Función no encontrada'));
    supabase.chain.insert.mockResolvedValue(successResult(null));

    const res = await crearRequerimiento({
      idEstablecimiento: 'est1',
      idLugar: 'l1',
      idSolicitante: 's1',
      tipoReq: 'Reparación',
      descripcion: 'Fuga de agua',
      prioridad: 'Urgente',
    });

    expect(res.error).toBeUndefined();
    expect(res.codigo).toMatch(/^LAB\d{2}-\d{3}$/);
    expect(supabase.from).toHaveBeenCalledWith('requerimientos');
  });

  it('13. RPC falla y fallback también falla → error', async () => {
    const { crearRequerimiento } = await import('../requerimiento.service');
    const { supabase } = await import('../../lib/supabase') as any;

    supabase.chain.single.mockResolvedValue(successResult({ abreviatura: 'XX' }));
    supabase.rpc.mockResolvedValue(errorResult('RPC error'));
    supabase.chain.insert.mockResolvedValue(errorResult('Constraint violation'));

    const res = await crearRequerimiento({
      idEstablecimiento: 'est1',
      idLugar: 'l1',
      idSolicitante: 's1',
      tipoReq: 'Reparación',
      descripcion: 'Test',
      prioridad: 'Baja',
    });

    expect(res.error).toBe('Constraint violation');
  });

  it('14. lugar sin abreviatura usa XX por defecto', async () => {
    const { crearRequerimiento } = await import('../requerimiento.service');
    const { supabase } = await import('../../lib/supabase') as any;

    supabase.chain.single.mockResolvedValue(successResult({ abreviatura: null }));
    supabase.rpc.mockResolvedValue(successResult(null));

    const res = await crearRequerimiento({
      idEstablecimiento: 'est1',
      idLugar: 'l1',
      idSolicitante: 's1',
      tipoReq: 'Instalación',
      descripcion: 'Nuevo equipo',
      prioridad: 'Normal',
    });

    expect(res.codigo).toMatch(/^XX\d{2}-\d{3}$/);
  });
});

/* ──────────────────────────────────────────────
   crearRequerimiento — flujo por usuario (sin lugar)
   ────────────────────────────────────────────── */

describe('crearRequerimiento sin lugar (usuario)', () => {
  it('15. éxito: insert directo, código con prefijo GEN', async () => {
    const { crearRequerimiento } = await import('../requerimiento.service');
    const { supabase } = await import('../../lib/supabase') as any;

    supabase.chain.insert.mockResolvedValue(successResult(null));

    const res = await crearRequerimiento({
      idEstablecimiento: 'est1',
      idLugar: null,
      idSolicitante: 's1',
      tipoReq: 'Mantención',
      descripcion: 'Limpieza general',
      diagnostico: 'PC sucia',
      prioridad: 'Baja',
    });

    expect(res.error).toBeUndefined();
    expect(res.codigo).toMatch(/^GEN\d{2}-\d{3}$/);
    expect(supabase.from).toHaveBeenCalledWith('requerimientos');
    expect(supabase.from).not.toHaveBeenCalledWith('lugares');
  });

  it('16. idLugar omitido (undefined) → mismo que null → GEN', async () => {
    const { crearRequerimiento } = await import('../requerimiento.service');
    const { supabase } = await import('../../lib/supabase') as any;

    supabase.chain.insert.mockResolvedValue(successResult(null));

    const res = await crearRequerimiento({
      idEstablecimiento: 'est1',
      idLugar: undefined,
      idSolicitante: 's1',
      tipoReq: 'Otro',
      descripcion: 'Sin lugar',
      prioridad: 'Normal',
    });

    expect(res.codigo).toMatch(/^GEN/);
    expect(supabase.from).toHaveBeenCalledWith('requerimientos');
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it('17. insert directo falla → error', async () => {
    const { crearRequerimiento } = await import('../requerimiento.service');
    const { supabase } = await import('../../lib/supabase') as any;

    supabase.chain.insert.mockResolvedValue(errorResult('Duplicate key'));

    const res = await crearRequerimiento({
      idEstablecimiento: 'est1',
      idLugar: null,
      idSolicitante: 's1',
      tipoReq: 'Reparación',
      descripcion: 'Falla crítica',
      prioridad: 'Urgente',
    });

    expect(res.error).toBe('Duplicate key');
  });

  it('18. payload incluye id_lugar = null (columna nullable)', async () => {
    const { crearRequerimiento } = await import('../requerimiento.service');
    const { supabase } = await import('../../lib/supabase') as any;
    let insertPayload: any;

    supabase.chain.insert.mockImplementation((p: any) => {
      insertPayload = p;
      return Promise.resolve(successResult(null));
    });

    await crearRequerimiento({
      idEstablecimiento: 'est1',
      idLugar: null,
      idSolicitante: 's1',
      tipoReq: 'Reparación',
      descripcion: 'Test',
      prioridad: 'Normal',
    });

    expect(insertPayload.id_lugar).toBeNull();
    expect(insertPayload.codigo).toMatch(/^GEN/);
  });
});

/* ──────────────────────────────────────────────
   Cerrar ticket (update directo en requerimientos)
   ────────────────────────────────────────────── */

describe('cerrarTicket (update directo en requerimientos)', () => {
  it('19. cerrar ticket: update con estado Completada', async () => {
    const { supabase } = await import('../../lib/supabase') as any;
    supabase.setResult(successResult(null));

    const now = new Date().toISOString();
    const { error } = await supabase
      .from('requerimientos')
      .update({
        solucion: 'Se reemplazó la fuente de poder',
        estado: 'Completada',
        fecha_atencion: new Date().toISOString().slice(0, 10),
        fecha_cierre: now,
        id_tecnico_cierre: 'u1',
      })
      .eq('id', 't1');

    expect(error).toBeNull();
    expect(supabase.from).toHaveBeenCalledWith('requerimientos');
    expect(supabase.chain.update).toHaveBeenCalledWith(expect.objectContaining({
      estado: 'Completada',
      solucion: 'Se reemplazó la fuente de poder',
    }));
    expect(supabase.chain.eq).toHaveBeenCalledWith('id', 't1');
  });

  it('20. cancelar ticket: update estado Cancelada', async () => {
    const { supabase } = await import('../../lib/supabase') as any;
    supabase.setResult(successResult(null));

    const { error } = await supabase
      .from('requerimientos')
      .update({ estado: 'Cancelada', fecha_cierre: new Date().toISOString(), id_tecnico_cierre: 'u1' })
      .eq('id', 't1');

    expect(error).toBeNull();
    expect(supabase.chain.update).toHaveBeenCalledWith(expect.objectContaining({
      estado: 'Cancelada',
    }));
  });

  it('21. cerrar ticket con error en la DB', async () => {
    const { supabase } = await import('../../lib/supabase') as any;
    supabase.setResult(errorResult('No se encontró el ticket'));

    const { error } = await supabase
      .from('requerimientos')
      .update({ estado: 'Completada', fecha_cierre: new Date().toISOString() })
      .eq('id', 'inexistente');

    expect(error?.message).toBe('No se encontró el ticket');
  });
});

/* ──────────────────────────────────────────────
   Secuencias completas
   ────────────────────────────────────────────── */

describe('secuencia completa: usuario flow (sin lugar)', () => {
  it('22. validar → crear (sin lugar, con GEN) → cerrar', async () => {
    const { validarTicket, crearRequerimiento } = await import('../requerimiento.service');
    const { supabase } = await import('../../lib/supabase') as any;

    supabase.chain.limit.mockResolvedValue(successResult([]));     // no dup en validar
    supabase.chain.single.mockResolvedValue(successResult(null));  // lugar abrev no se usa aquí
    supabase.chain.insert.mockResolvedValue(successResult(null));  // crear ticket
    supabase.setResult(successResult(null));                       // cerrar ticket

    // 22a. Validación pasa
    const val = await validarTicket({
      equipo: null,
      posibleFalla: 'Pantalla parpadea',
      solicitanteId: 's1',
    });
    expect(val).toBeNull();

    // 22b. Crear ticket para usuario (sin lugar)
    const created = await crearRequerimiento({
      idEstablecimiento: 'est1',
      idLugar: null,
      idEquipo: null,
      idSolicitante: 's1',
      tipoReq: 'Reparación',
      descripcion: '[Ticket rápido] Usuario: Juan Pérez',
      posibleFalla: 'Pantalla parpadea',
      diagnostico: 'Fallas en el monitor',
      prioridad: 'Normal',
      estado: 'En Proceso',
    });
    expect(created.error).toBeUndefined();
    expect(created.codigo).toMatch(/^GEN\d{2}-\d{3}$/);
    const codigoTicket = created.codigo!;

    // 22c. Cerrar ticket
    const { error } = await supabase
      .from('requerimientos')
      .update({ solucion: 'Se cambió el monitor', estado: 'Completada', fecha_cierre: new Date().toISOString(), id_tecnico_cierre: 'u1' })
      .eq('id', 't1');
    expect(error).toBeNull();

    // Verificar código GEN
    expect(codigoTicket).toContain('GEN');
  });
});

describe('secuencia completa: lugar flow', () => {
  it('23. validar (con equipo) → crear (RPC) → cerrar', async () => {
    const { validarTicket, crearRequerimiento } = await import('../requerimiento.service');
    const { supabase } = await import('../../lib/supabase') as any;

    supabase.chain.single.mockResolvedValue(successResult({ abreviatura: 'SALA' }));
    supabase.chain.limit.mockResolvedValue(successResult([]));      // no dup
    supabase.rpc.mockResolvedValue(successResult(null));            // RPC éxito
    supabase.setResult(successResult(null));                        // cerrar ticket

    // 23a. Validación con equipo válido
    const val = await validarTicket({
      equipo: { id: 'e1', estado: 'Operativo', id_usuario: 'u1' },
      posibleFalla: 'Teclado no responde',
      solicitanteId: 's1',
    });
    expect(val).toBeNull();

    // 23b. Crear ticket para lugar con equipo
    const created = await crearRequerimiento({
      idEstablecimiento: 'est1',
      idLugar: 'l1',
      idEquipo: 'e1',
      idSolicitante: 's1',
      tipoReq: 'Reparación',
      descripcion: '[Ticket rápido] Lugar: Sala 3 - Teclado no responde',
      posibleFalla: 'Teclado no responde',
      diagnostico: 'Conexión USB dañada',
      prioridad: 'Alta',
      estado: 'En Proceso',
    });
    expect(created.error).toBeUndefined();
    expect(created.codigo).toMatch(/^SALA\d{2}-\d{3}$/);

    // 23c. Cerrar
    const { error } = await supabase
      .from('requerimientos')
      .update({ solucion: 'Se reemplazó el teclado', estado: 'Completada', fecha_cierre: new Date().toISOString(), id_tecnico_cierre: 'u1' })
      .eq('id', 't1');
    expect(error).toBeNull();
  });
});

/* ──────────────────────────────────────────────
   Casos borde y errores
   ────────────────────────────────────────────── */

describe('casos borde', () => {
  it('24. crearRequerimiento lanza excepción → error genérico', async () => {
    const { crearRequerimiento } = await import('../requerimiento.service');
    const { supabase } = await import('../../lib/supabase') as any;

    supabase.chain.single.mockImplementation(() => { throw new Error('DB timeout'); });

    const res = await crearRequerimiento({
      idEstablecimiento: 'est1',
      idLugar: 'l1',
      idSolicitante: 's1',
      tipoReq: 'Reparación',
      descripcion: 'Error',
      prioridad: 'Normal',
    });

    expect(res.error).toBe('DB timeout');
  });

  it('25. error desconocido no-Error → mensaje genérico', async () => {
    const { crearRequerimiento } = await import('../requerimiento.service');
    const { supabase } = await import('../../lib/supabase') as any;

    supabase.chain.single.mockImplementation(() => { throw 'string error'; });

    const res = await crearRequerimiento({
      idEstablecimiento: 'est1',
      idLugar: 'l1',
      idSolicitante: 's1',
      tipoReq: 'Reparación',
      descripcion: 'Error raro',
      prioridad: 'Normal',
    });

    expect(res.error).toBe('Error desconocido al crear requerimiento');
  });

  it('26. validarTicket con posibleFalla vacía → no busca duplicados', async () => {
    const { validarTicket } = await import('../requerimiento.service');
    const { supabase } = await import('../../lib/supabase') as any;
    supabase.chain.limit = vi.fn();

    await validarTicket({
      equipo: { id: 'e1', estado: 'Operativo', id_usuario: 'u1' },
      posibleFalla: '',
      solicitanteId: 's1',
    });

    expect(supabase.chain.limit).not.toHaveBeenCalled();
  });

  it('27. lugar con soporte undefined → se omite validación de soporte', async () => {
    const { validarTicket } = await import('../requerimiento.service');
    const res = await validarTicket({
      equipo: null,
      posibleFalla: '',
      solicitanteId: 's1',
      lugarSoporte: undefined,
    });
    expect(res).toBeNull();
  });

  it('28. código generado mantiene formato xxLL-TTT (prefijo 2+ letras, seq 2 díg, seq global 3 díg)', async () => {
    const { crearRequerimiento } = await import('../requerimiento.service');
    const { supabase } = await import('../../lib/supabase') as any;

    supabase.chain.single.mockResolvedValue(successResult({ abreviatura: 'A1' }));
    supabase.rpc.mockResolvedValue(successResult(null));

    const res = await crearRequerimiento({
      idEstablecimiento: 'est1',
      idLugar: 'l1',
      idSolicitante: 's1',
      tipoReq: 'Reparación',
      descripcion: 'Test formato código',
      prioridad: 'Normal',
    });

    expect(res.codigo).toMatch(/^[A-Z0-9]{2,4}\d{2}-\d{3}$/);
  });
});
