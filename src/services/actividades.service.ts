import { offlineStore } from './offlineStore';
import { cacheService } from './cacheService';
import { supabase } from '../lib/supabase';
import type { Actividad } from '../types';

async function getAllRaw(): Promise<Record<string, unknown>[]> {
  const offline = await offlineStore.getAll<Record<string, unknown>>('actividades');
  if (offline.length > 0) return offline;
  const cached = await cacheService.get<Record<string, unknown>[]>('actividades_all');
  if (cached) return cached;
  const { data, error } = await supabase.from('actividades').select('*');
  if (error) throw error;
  const result = (data || []) as Record<string, unknown>[];
  await cacheService.set('actividades_all', result, 10);
  return result;
}

export const actividadesService = {
  async getAll(options?: { activoOnly?: boolean }): Promise<Actividad[]> {
    try {
      const all = await getAllRaw();
      let items = all as unknown as Actividad[];
      if (options?.activoOnly) items = items.filter(a => a.activo !== false);
      return items.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    } catch (error) {
      console.error('actividadesService.getAll:', error);
      return [];
    }
  },

  async getById(id: string): Promise<Actividad | null> {
    try {
      const raw = await offlineStore.getById<Record<string, unknown>>('actividades', id);
      if (raw) return raw as unknown as Actividad;
      const { data, error } = await supabase.from('actividades').select('*').eq('id', id).single();
      if (error && error.code === 'PGRST116') return null;
      if (error) throw error;
      return data as Actividad;
    } catch (error) {
      console.error('actividadesService.getById:', error);
      return null;
    }
  },

  async getByPeriodo(periodoId: string): Promise<Actividad[]> {
    const all = await this.getAll({ activoOnly: true });
    return all.filter(a => a.id_periodo === periodoId);
  },

  async getByAsignatura(asignaturaId: string): Promise<Actividad[]> {
    const all = await this.getAll({ activoOnly: true });
    return all.filter(a => a.id_asignatura === asignaturaId);
  },

  async save(data: Omit<Actividad, 'id' | 'created_at' | 'updated_at'>): Promise<Actividad | null> {
    try {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const record: Record<string, unknown> = {
        id,
        id_asignatura: data.id_asignatura,
        id_periodo: data.id_periodo,
        id_sala: data.id_sala ?? null,
        nombre: data.nombre,
        descripcion: data.descripcion ?? '',
        ponderacion: data.ponderacion,
        fecha: data.fecha,
        activo: data.activo ?? true,
        created_at: now,
        updated_at: now,
      };
      await offlineStore.put('actividades', id, record);
      await cacheService.invalidate('actividades_all');
      return record as unknown as Actividad;
    } catch (error) {
      console.error('actividadesService.save:', error);
      return null;
    }
  },

  async update(id: string, data: Partial<Actividad>): Promise<boolean> {
    try {
      const existing = await offlineStore.getById<Record<string, unknown>>('actividades', id);
      if (!existing) return false;
      const updated = { ...existing, ...data, updated_at: new Date().toISOString(), _synced: false, _updated_at: Date.now() };
      await offlineStore.put('actividades', id, updated);
      await cacheService.invalidate('actividades_all');
      return true;
    } catch (error) {
      console.error('actividadesService.update:', error);
      return false;
    }
  },

  async remove(id: string): Promise<boolean> {
    try {
      await offlineStore.remove('actividades', id);
      await cacheService.invalidate('actividades_all');
      return true;
    } catch (error) {
      console.error('actividadesService.remove:', error);
      return false;
    }
  },
};
