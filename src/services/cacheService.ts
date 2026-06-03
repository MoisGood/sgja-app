// ============================================================
// SGJA – Cache Local Service (IndexedDB)
// src/services/cacheService.ts
// Reduce lecturas de Firestore usando almacenamiento local
// ============================================================

import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // en milisegundos
}

interface CacheDB extends DBSchema {
  datos: {
    key: string;
    value: CacheEntry<unknown>;
  };
}

const DB_NAME = 'sgja-cache';
const DB_VERSION = 1;
const STORE_NAME = 'datos';

let dbInstance: IDBPDatabase<CacheDB> | null = null;

async function getDB() {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<CacheDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });

  return dbInstance;
}

export const cacheService = {
  /**
   * Obtener dato del cache
   * Retorna null si no existe o expiró
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const db = await getDB();
      const entry = (await db.get(STORE_NAME, key)) as CacheEntry<T> | undefined;

      if (!entry) {
        return null;
      }

      // Verificar si expiró
      const ahora = Date.now();
      if (ahora - entry.timestamp > entry.ttl) {
        await db.delete(STORE_NAME, key);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.error('Error al obtener del cache:', error);
      return null;
    }
  },

  /**
   * Guardar dato en cache con TTL
   */
  async set<T>(key: string, data: T, ttlMinutos: number = 30) {
    try {
      const db = await getDB();
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl: ttlMinutos * 60 * 1000,
      };
      await db.put(STORE_NAME, entry, key);
    } catch (error) {
      console.error('Error al guardar en cache:', error);
    }
  },

  /**
   * Limpiar todo el cache
   */
  async clear() {
    try {
      const db = await getDB();
      await db.clear(STORE_NAME);
    } catch (error) {
      console.error('Error al limpiar cache:', error);
    }
  },

  /**
   * Obtener todas las claves del cache
   */
  async getAllKeys(): Promise<string[]> {
    try {
      const db = await getDB();
      return (await db.getAllKeys(STORE_NAME)) as string[];
    } catch (error) {
      console.error('Error al obtener claves del cache:', error);
      return [];
    }
  },

  /**
   * Invalidar cache de una clave específica
   */
  async invalidate(key: string) {
    try {
      const db = await getDB();
      await db.delete(STORE_NAME, key);
    } catch (error) {
      console.error('Error al invalidar cache:', error);
    }
  },

  /**
   * Obtener info del cache (debug)
   */
  async getStats() {
    try {
      const db = await getDB();
      const keys = await this.getAllKeys();
      let totalSize = 0;
      let expiredCount = 0;

      const entries = await Promise.all(keys.map(key => db.get(STORE_NAME, key) as Promise<CacheEntry<unknown> | undefined>));
      for (const entry of entries) {
        if (entry) {
          const ahora = Date.now();
          if (ahora - entry.timestamp > entry.ttl) {
            expiredCount++;
          }
          totalSize += JSON.stringify(entry).length;
        }
      }

      return {
        totalKeys: keys.length,
        expiredCount,
        totalSizeKB: Math.round(totalSize / 1024),
      };
    } catch (error) {
      console.error('Error al obtener stats:', error);
      return { totalKeys: 0, expiredCount: 0, totalSizeKB: 0 };
    }
  },
};
