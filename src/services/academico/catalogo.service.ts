import { supabase } from '../../lib/supabase';
import { offlineStore } from '../offlineStore';
import { cacheService } from '../cacheService';
import type { SalaAprendizaje, Asignatura, Periodo } from '../../types';

type CatalogTable = 'salas_aprendizaje' | 'asignaturas' | 'periodos';
type CatalogItem = SalaAprendizaje | Asignatura | Periodo;

async function getAllFromTable<T extends CatalogItem>(
  table: CatalogTable,
  cacheKey: string,
  options?: { activoOnly?: boolean }
): Promise<T[]> {
  try {
    const offline = await offlineStore.getAll<Record<string, unknown>>(table);
    if (offline.length > 0) {
      let items = offline as unknown as T[];
      if (options?.activoOnly) items = items.filter(r => (r as unknown as { activo?: boolean }).activo !== false);
      return items;
    }
    const cached = await cacheService.get<T[]>(cacheKey);
    if (cached) return cached;
    let query = supabase.from(table).select('*');
    if (options?.activoOnly) query = query.eq('activo', true);
    const { data, error } = await query.order('nombre');
    if (error) throw error;
    const result = (data || []) as T[];
    await cacheService.set(cacheKey, result, 60);
    return result;
  } catch (error) {
    console.error(`catalogo.getAllFromTable(${table}):`, error);
    const cached = await cacheService.get<T[]>(cacheKey);
    return cached ?? [];
  }
}

async function getByIdFromTable<T extends CatalogItem>(
  table: CatalogTable,
  id: string
): Promise<T | null> {
  try {
    const offline = await offlineStore.getById<Record<string, unknown>>(table, id);
    if (offline) return offline as unknown as T;
    const { data, error } = await supabase.from(table).select('*').eq('id', id).single();
    if (error && error.code === 'PGRST116') return null;
    if (error) throw error;
    return data as T;
  } catch (error) {
    console.error(`catalogo.getByIdFromTable(${table}, ${id}):`, error);
    return null;
  }
}

async function upsertInTable<T extends CatalogItem>(
  table: CatalogTable,
  id: string | undefined,
  data: Partial<T>
): Promise<T | null> {
  try {
    const record = id ? { ...data, id, updated_at: new Date().toISOString() } : { ...data };
    await offlineStore.put(table, id ?? crypto.randomUUID(), record as Record<string, unknown>);
    const cacheKey = `${table}_list`;
    await cacheService.invalidate(cacheKey);
    return record as T;
  } catch (error) {
    console.error(`catalogo.upsert(${table}):`, error);
    return null;
  }
}

async function removeFromTable(table: CatalogTable, id: string): Promise<boolean> {
  try {
    await offlineStore.remove(table, id);
    const cacheKey = `${table}_list`;
    await cacheService.invalidate(cacheKey);
    return true;
  } catch (error) {
    console.error(`catalogo.remove(${table}, ${id}):`, error);
    return false;
  }
}

export const catalogoService = {
  async getSalas(options?: { activoOnly?: boolean }): Promise<SalaAprendizaje[]> {
    return getAllFromTable<SalaAprendizaje>('salas_aprendizaje', 'salas_aprendizaje_list', options);
  },
  async getSalaById(id: string): Promise<SalaAprendizaje | null> {
    return getByIdFromTable<SalaAprendizaje>('salas_aprendizaje', id);
  },
  async upsertSala(id: string | undefined, data: Partial<SalaAprendizaje>): Promise<SalaAprendizaje | null> {
    return upsertInTable<SalaAprendizaje>('salas_aprendizaje', id, data);
  },
  async removeSala(id: string): Promise<boolean> {
    return removeFromTable('salas_aprendizaje', id);
  },

  async getAsignaturas(options?: { activoOnly?: boolean }): Promise<Asignatura[]> {
    return getAllFromTable<Asignatura>('asignaturas', 'asignaturas_list', options);
  },
  async getAsignaturaById(id: string): Promise<Asignatura | null> {
    return getByIdFromTable<Asignatura>('asignaturas', id);
  },
  async upsertAsignatura(id: string | undefined, data: Partial<Asignatura>): Promise<Asignatura | null> {
    return upsertInTable<Asignatura>('asignaturas', id, data);
  },
  async removeAsignatura(id: string): Promise<boolean> {
    return removeFromTable('asignaturas', id);
  },

  async getPeriodos(options?: { activoOnly?: boolean }): Promise<Periodo[]> {
    return getAllFromTable<Periodo>('periodos', 'periodos_list', options);
  },
  async getPeriodoById(id: string): Promise<Periodo | null> {
    return getByIdFromTable<Periodo>('periodos', id);
  },
  async upsertPeriodo(id: string | undefined, data: Partial<Periodo>): Promise<Periodo | null> {
    return upsertInTable<Periodo>('periodos', id, data);
  },
  async removePeriodo(id: string): Promise<boolean> {
    return removeFromTable('periodos', id);
  },
};
