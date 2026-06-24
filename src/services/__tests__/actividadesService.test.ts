import { describe, it, expect, beforeEach } from 'vitest';
import { actividadesService } from '../actividades.service';
import { offlineStore } from '../offlineStore';

beforeEach(async () => {
  await offlineStore.clear('actividades');
  await offlineStore.clear('sync_queue');
});

describe('actividadesService', () => {
  const base = {
    id_asignatura: 'mat-101',
    id_periodo: 'per-1',
    id_sala: null,
    nombre: 'Prueba 1',
    descripcion: '',
    ponderacion: 1,
    fecha: '2026-07-15',
    activo: true,
  };

  it('guarda actividad offline', async () => {
    const result = await actividadesService.save(base);
    expect(result).not.toBeNull();
    expect(result?.nombre).toBe('Prueba 1');
    expect(result?.id_asignatura).toBe('mat-101');
  });

  it('recupera todas las actividades', async () => {
    await actividadesService.save({ ...base, nombre: 'Act 1' });
    await actividadesService.save({ ...base, nombre: 'Act 2' });
    const all = await actividadesService.getAll();
    expect(all).toHaveLength(2);
  });

  it('filtra activas', async () => {
    await actividadesService.save({ ...base, nombre: 'Activa', activo: true });
    await actividadesService.save({ ...base, nombre: 'Inactiva', activo: false });
    const activas = await actividadesService.getAll({ activoOnly: true });
    expect(activas).toHaveLength(1);
    expect(activas[0].nombre).toBe('Activa');
  });

  it('recupera por id', async () => {
    const saved = await actividadesService.save(base);
    const found = await actividadesService.getById(saved!.id);
    expect(found).not.toBeNull();
    expect(found?.nombre).toBe('Prueba 1');
  });

  it('retorna null si id no existe', async () => {
    const found = await actividadesService.getById('no-existe');
    expect(found).toBeNull();
  });

  it('filtra por periodo', async () => {
    await actividadesService.save({ ...base, nombre: 'Per1', id_periodo: 'per-1' });
    await actividadesService.save({ ...base, nombre: 'Per2', id_periodo: 'per-2' });
    const results = await actividadesService.getByPeriodo('per-1');
    expect(results).toHaveLength(1);
  });

  it('filtra por asignatura', async () => {
    await actividadesService.save({ ...base, nombre: 'Mat', id_asignatura: 'mat-101' });
    await actividadesService.save({ ...base, nombre: 'Len', id_asignatura: 'len-101' });
    const results = await actividadesService.getByAsignatura('mat-101');
    expect(results).toHaveLength(1);
  });

  it('actualiza actividad', async () => {
    const saved = await actividadesService.save(base);
    const ok = await actividadesService.update(saved!.id, { nombre: 'Actualizado', ponderacion: 3 });
    expect(ok).toBe(true);
    const updated = await actividadesService.getById(saved!.id);
    expect(updated?.nombre).toBe('Actualizado');
    expect(updated?.ponderacion).toBe(3);
  });

  it('elimina actividad', async () => {
    const saved = await actividadesService.save(base);
    const ok = await actividadesService.remove(saved!.id);
    expect(ok).toBe(true);
    const result = await offlineStore.getById<Record<string, unknown>>('actividades', saved!.id);
    expect(result).toBeNull();
  });

  it('retorna lista vacia si no hay datos', async () => {
    const all = await actividadesService.getAll();
    expect(all).toEqual([]);
  });
});
