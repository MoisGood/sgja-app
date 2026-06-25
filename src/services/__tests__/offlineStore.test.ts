import { describe, it, expect, beforeEach } from 'vitest';
import { offlineStore } from '../offlineStore';

beforeEach(async () => {
  const stores: Array<'salas_aprendizaje' | 'asignaturas' | 'periodos' | 'actividades' | 'desempeno' | 'sync_queue' | 'metadata'> = [
    'salas_aprendizaje', 'asignaturas', 'periodos',
    'actividades', 'desempeno', 'sync_queue', 'metadata',
  ];
  for (const store of stores) {
    await offlineStore.clear(store);
  }
});

describe('offlineStore', () => {
  it('escribe y lee un registro', async () => {
    const data = { nombre: 'Sala 1', tipo: 'cognitiva', capacidad: 30 };
    await offlineStore.put('salas_aprendizaje', 'sala-1', data);

    const result = await offlineStore.getById<Record<string, unknown>>('salas_aprendizaje', 'sala-1');
    expect(result).not.toBeNull();
    expect(result?.nombre).toBe('Sala 1');
    expect(result?._synced).toBe(false);
  });

  it('recupera todos los registros de una tabla', async () => {
    await offlineStore.put('periodos', 'p1', { nombre: 'Semestre 1' });
    await offlineStore.put('periodos', 'p2', { nombre: 'Semestre 2' });

    const all = await offlineStore.getAll<Record<string, unknown>>('periodos');
    expect(all).toHaveLength(2);
  });

  it('elimina un registro', async () => {
    await offlineStore.put('asignaturas', 'mat-101', { nombre: 'Matemáticas' });
    await offlineStore.remove('asignaturas', 'mat-101');

    const result = await offlineStore.getById<Record<string, unknown>>('asignaturas', 'mat-101');
    expect(result).toBeNull();
  });

  it('encola sync al hacer put', async () => {
    await offlineStore.put('desempeno', 'd-1', { nota: 5.5 });

    const queue = await offlineStore.getPendingSync();
    expect(queue).toHaveLength(1);
    expect(queue[0].table).toBe('desempeno');
    expect(queue[0].operation).toBe('create');
  });

  it('marca como sincronizado eliminando de la cola', async () => {
    await offlineStore.put('actividades', 'act-1', { nombre: 'Prueba' });
    const queue = await offlineStore.getPendingSync();
    expect(queue).toHaveLength(1);

    await offlineStore.markSynced(queue[0].id!);
    const after = await offlineStore.getPendingSync();
    expect(after).toHaveLength(0);
  });

  it('encola delete al hacer remove', async () => {
    await offlineStore.put('periodos', 'del-1', { nombre: 'Eliminar' });
    await offlineStore.remove('periodos', 'del-1');

    const queue = await offlineStore.getPendingSync();
    const deleteOps = queue.filter(q => q.operation === 'delete');
    expect(deleteOps).toHaveLength(1);
  });

  it('guarda y recupera metadata', async () => {
    await offlineStore.setMetadata('last_sync');
    const val = await offlineStore.getMetadata('last_sync');
    expect(val).toBeGreaterThan(0);
  });

  it('retorna lista vacía si no hay datos', async () => {
    const result = await offlineStore.getAll<Record<string, unknown>>('salas_aprendizaje');
    expect(result).toEqual([]);
  });

  it('retorna null si el id no existe', async () => {
    const result = await offlineStore.getById<Record<string, unknown>>('asignaturas', 'no-existe');
    expect(result).toBeNull();
  });
});
