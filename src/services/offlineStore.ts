import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';

const DB_NAME = 'sgja-offline';
const DB_VERSION = 1;

interface OfflineDBSchema extends DBSchema {
  desempeno: {
    key: string;
    value: Record<string, unknown> & { _synced: boolean; _updated_at: number };
  };
  actividades: {
    key: string;
    value: Record<string, unknown> & { _synced: boolean; _updated_at: number };
  };
  sync_queue: {
    key: number;
    value: {
      id?: number;
      table: string;
      operation: 'create' | 'update' | 'delete';
      record_id: string;
      data: Record<string, unknown>;
      created_at: number;
      retries: number;
    };
    autoIncrement: true;
  };
  metadata: {
    key: string;
    value: { last_sync_at: number };
  };
}

let dbInstance: IDBPDatabase<OfflineDBSchema> | null = null;

async function getDB() {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<OfflineDBSchema>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const tables = ['desempeno', 'actividades', 'metadata'];
      for (const table of tables) {
        if (!db.objectStoreNames.contains(table)) {
          db.createObjectStore(table);
        }
      }
      if (!db.objectStoreNames.contains('sync_queue')) {
        const queue = db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
        queue.createIndex('created_at', 'created_at');
      }
    },
  });

  return dbInstance;
}

export const offlineStore = {
  async getAll<T extends Record<string, unknown>>(table: string): Promise<T[]> {
    try {
      const db = await getDB();
      const values = await db.getAll(table);
      return values as T[];
    } catch (error) {
      console.error(`offlineStore.getAll(${table}):`, error);
      return [];
    }
  },

  async getById<T extends Record<string, unknown>>(table: string, id: string): Promise<T | null> {
    try {
      const db = await getDB();
      const value = await db.get(table, id);
      return (value as T) ?? null;
    } catch (error) {
      console.error(`offlineStore.getById(${table}, ${id}):`, error);
      return null;
    }
  },

  async put(table: string, id: string, data: Record<string, unknown>) {
    try {
      const db = await getDB();
      const record = { ...data, _synced: false, _updated_at: Date.now() };
      await db.put(table, record, id);
      await db.add('sync_queue', {
        table,
        operation: 'create',
        record_id: id,
        data: record,
        created_at: Date.now(),
        retries: 0,
      });
    } catch (error) {
      console.error(`offlineStore.put(${table}, ${id}):`, error);
    }
  },

  async remove(table: string, id: string) {
    try {
      const db = await getDB();
      await db.delete(table, id);
      await db.add('sync_queue', {
        table,
        operation: 'delete',
        record_id: id,
        data: {},
        created_at: Date.now(),
        retries: 0,
      });
    } catch (error) {
      console.error(`offlineStore.remove(${table}, ${id}):`, error);
    }
  },

  async clear(table: string) {
    try {
      const db = await getDB();
      await db.clear(table);
    } catch (error) {
      console.error(`offlineStore.clear(${table}):`, error);
    }
  },

  async getPendingSync() {
    try {
      const db = await getDB();
      const all = await db.getAll('sync_queue');
      return all.sort((a, b) => a.created_at - b.created_at);
    } catch (error) {
      console.error('offlineStore.getPendingSync:', error);
      return [];
    }
  },

  async markSynced(id: number) {
    try {
      const db = await getDB();
      await db.delete('sync_queue', id);
    } catch (error) {
      console.error(`offlineStore.markSynced(${id}):`, error);
    }
  },

  async getMetadata(key: string): Promise<number | null> {
    try {
      const db = await getDB();
      const entry = await db.get('metadata', key);
      return entry?.last_sync_at ?? null;
    } catch {
      return null;
    }
  },

  async setMetadata(key: string) {
    try {
      const db = await getDB();
      await db.put('metadata', { last_sync_at: Date.now() }, key);
    } catch (error) {
      console.error(`offlineStore.setMetadata(${key}):`, error);
    }
  },
};
