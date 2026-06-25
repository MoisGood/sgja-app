import { describe, it, expect, vi, beforeEach } from 'vitest';
import { syncEngine } from '../syncEngine';
import { offlineStore } from '../offlineStore';

beforeEach(async () => {
  await offlineStore.clear('sync_queue');
  await offlineStore.clear('metadata');
});

describe('syncEngine', () => {
  it('expone status online/offline', () => {
    expect(['online', 'offline']).toContain(syncEngine.status);
  });

  it('notifica suscriptores al suscribirse', () => {
    const listener = vi.fn();
    const unsub = syncEngine.subscribe(listener);
    expect(listener).toHaveBeenCalledTimes(1);
    unsub();
  });

  it('no notifica después de unsubscribe', () => {
    const listener = vi.fn();
    const unsub = syncEngine.subscribe(listener);
    unsub();
    listener.mockClear();
    syncEngine.subscribe(() => {});
    expect(listener).not.toHaveBeenCalled();
  });

  it('retorna 0 pendientes si no hay sync_queue', async () => {
    const pending = await offlineStore.getPendingSync();
    expect(pending).toHaveLength(0);
  });

  it('detecta items pendientes en la cola', async () => {
    await offlineStore.put('desempeno', 'd-test', { nota: 6.0 });
    await offlineStore.put('actividades', 'a-test', { nombre: 'Test' });
    const pending = await offlineStore.getPendingSync();
    expect(pending).toHaveLength(2);
  });
});
