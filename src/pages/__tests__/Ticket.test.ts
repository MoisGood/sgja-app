import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSupabase = {
  from: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  in: vi.fn(() => mockSupabase),
  ilike: vi.fn(() => mockSupabase),
  limit: vi.fn(() => mockSupabase),
  order: vi.fn(() => mockSupabase),
  maybeSingle: vi.fn(() => mockSupabase),
  single: vi.fn(() => mockSupabase),
};

// Simula validarTicket sin depender de React ni DOM
async function validarTicket(
  eq: any,
  posibleFalla: string,
  solicitanteId: string,
  lugar: { soporte?: boolean },
  supabase: any
): Promise<string | null> {
  if (eq) {
    if (eq.estado === 'Baja') {
      return '❌ El equipo está dado de baja. No se puede crear un ticket.';
    }
    if (!eq.id_usuario) {
      return '⚠️ El equipo no tiene un usuario responsable asignado. Asigna uno antes de crear el ticket.';
    }

    const { data: usr } = await supabase.from('usuarios').select('activo').eq('id', eq.id_usuario).maybeSingle();
    if (usr && !usr.activo) {
      return '⚠️ El usuario responsable del equipo está inactivo.';
    }

    if (posibleFalla.trim()) {
      const { data: dup } = await supabase
        .from('requerimientos')
        .select('id')
        .eq('id_equipo', eq.id)
        .in('estado', ['Pendiente', 'En Proceso'])
        .eq('activo', true)
        .ilike('posible_falla', `%${posibleFalla.trim()}%`)
        .limit(1);
      if (dup && dup.length > 0) {
        return '❌ Ya hay un ticket abierto para este equipo con una falla similar.';
      }
    }
  }

  if (lugar && lugar.soporte === false) {
    return '⚠️ Este lugar no tiene soporte activo. ¿Seguro que deseas continuar?';
  }

  const { count: userTicketCount } = await supabase
    .from('requerimientos').select('*', { count: 'exact', head: true })
    .eq('id_solicitante', solicitanteId).in('estado', ['Pendiente', 'En Proceso']).eq('activo', true);

  if ((userTicketCount || 0) >= 3) {
    return '⚠️ El usuario ya tiene 3 o más tickets abiertos. ¿Deseas continuar?';
  }

  return null;
}

describe('validarTicket', () => {
  function crearMock(opts: {
    usuarioActivo?: boolean;
    dupEncontrado?: boolean;
    countTickets?: number;
  } = {}) {
    const { usuarioActivo = true, dupEncontrado = false, countTickets = 0 } = opts;
    function buildChain(isIdPath = false): any {
      const chain: Record<string, any> = {};
      chain.select = vi.fn((sel?: string, opts2?: any) => {
        if (opts2?.count === 'exact' && opts2?.head === true) {
          return { eq: vi.fn(() => ({ in: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ count: countTickets })) })) })) };
        }
        if (sel === 'id') {
          return buildChain(true);
        }
        return buildChain();
      });
      chain.eq = vi.fn(() => isIdPath ? buildChain(true) : buildChain());
      chain.in = vi.fn(() => isIdPath ? buildChain(true) : buildChain());
      chain.ilike = vi.fn(() => isIdPath ? buildChain(true) : buildChain());
      chain.limit = vi.fn(() => isIdPath ? Promise.resolve({ data: dupEncontrado ? [{ id: 'dup' }] : [] }) : buildChain());
      chain.order = vi.fn(() => buildChain());
      chain.maybeSingle = vi.fn(() => Promise.resolve({ data: usuarioActivo ? { activo: true } : { activo: false } }));
      chain.single = vi.fn(() => buildChain());
      return chain;
    }
    const supabase = { from: vi.fn(() => buildChain()) };
    return supabase;
  }

  it('1. equipo en estado Baja → bloquea', async () => {
    const res = await validarTicket({ id: '1', estado: 'Baja' }, '', 'uid123', {}, crearMock());
    expect(res).toContain('dado de baja');
  });

  it('2. equipo sin usuario responsable → warning', async () => {
    const res = await validarTicket({ id: '1', estado: 'Operativo', id_usuario: null }, '', 'uid123', {}, crearMock());
    expect(res).toContain('no tiene un usuario responsable');
  });

  it('3. usuario responsable inactivo → warning', async () => {
    const res = await validarTicket({ id: '1', estado: 'Operativo', id_usuario: 'u1' }, '', 'uid123', {}, crearMock({ usuarioActivo: false }));
    expect(res).toContain('está inactivo');
  });

  it('4. misma falla duplicada → bloquea', async () => {
    const res = await validarTicket({ id: '1', estado: 'Operativo', id_usuario: 'u1' }, 'no enciende', 'uid123', {}, crearMock({ dupEncontrado: true }));
    expect(res).toContain('falla similar');
  });

  it('5. falla diferente con mismo equipo → permite', async () => {
    const res = await validarTicket({ id: '1', estado: 'Operativo', id_usuario: 'u1' }, 'problema diferente', 'uid123', {}, crearMock({ countTickets: 1 }));
    expect(res).toBeNull();
  });

  it('6. lugar sin soporte → warning', async () => {
    const res = await validarTicket({ id: '1', estado: 'Operativo', id_usuario: 'u1' }, 'falla', 'uid123', { soporte: false }, crearMock());
    expect(res).toContain('no tiene soporte activo');
  });

  it('7. usuario con 3+ tickets → warning', async () => {
    const res = await validarTicket({ id: '1', estado: 'Operativo', id_usuario: 'u1' }, 'falla', 'uid123', {}, crearMock({ countTickets: 3 }));
    expect(res).toContain('3 o más tickets');
  });

  it('8. sin equipo (genérico) + sin restricciones → permite', async () => {
    const res = await validarTicket(null, '', 'uid123', {}, crearMock());
    expect(res).toBeNull();
  });
});
