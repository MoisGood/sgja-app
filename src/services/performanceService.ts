import { offlineStore } from './offlineStore';
import { cacheService } from './cacheService';
import { supabase } from '../lib/supabase';
import type { Desempeno, Promedio } from '../types';

async function getAllDesempenoRaw(): Promise<Record<string, unknown>[]> {
  const offline = await offlineStore.getAll<Record<string, unknown>>('desempeno');
  if (offline.length > 0) return offline;
  const cached = await cacheService.get<Record<string, unknown>[]>('desempeno_all');
  if (cached) return cached;
  const { data, error } = await supabase.from('desempeno').select('*');
  if (error) throw error;
  const result = (data || []) as Record<string, unknown>[];
  await cacheService.set('desempeno_all', result, 5);
  return result;
}

export const performanceService = {
  async saveDesempeno(data: Omit<Desempeno, 'id' | 'created_at'>): Promise<Desempeno | null> {
    try {
      const id = crypto.randomUUID();
      const record: Record<string, unknown> = {
        id,
        id_actividad: data.id_actividad,
        id_estudiante: data.id_estudiante,
        nota: data.nota,
        observaciones: data.observaciones,
        activo: data.activo ?? true,
        created_at: new Date().toISOString(),
      };
      await offlineStore.put('desempeno', id, record);
      await cacheService.invalidate('desempeno_all');
      return record as unknown as Desempeno;
    } catch (error) {
      console.error('performanceService.saveDesempeno:', error);
      return null;
    }
  },

  async saveDesempenoBatch(items: Omit<Desempeno, 'id' | 'created_at'>[]): Promise<number> {
    let saved = 0;
    for (const item of items) {
      const result = await this.saveDesempeno(item);
      if (result) saved++;
    }
    return saved;
  },

  async updateDesempeno(id: string, data: Partial<Desempeno>): Promise<boolean> {
    try {
      const existing = await offlineStore.getById<Record<string, unknown>>('desempeno', id);
      if (!existing) return false;
      const updated = { ...existing, ...data, _synced: false, _updated_at: Date.now() };
      await offlineStore.put('desempeno', id, updated);
      await cacheService.invalidate('desempeno_all');
      return true;
    } catch (error) {
      console.error('performanceService.updateDesempeno:', error);
      return false;
    }
  },

  async getDesempenoByActividad(actividadId: string): Promise<Desempeno[]> {
    try {
      const all = await getAllDesempenoRaw();
      const items = all.filter(r => r.id_actividad === actividadId && r.activo !== false);
      return items as unknown as Desempeno[];
    } catch (error) {
      console.error('performanceService.getDesempenoByActividad:', error);
      return [];
    }
  },

  async getDesempenoByEstudiante(estudianteId: string): Promise<Desempeno[]> {
    try {
      const all = await getAllDesempenoRaw();
      const items = all.filter(r => r.id_estudiante === estudianteId && r.activo !== false);
      return items as unknown as Desempeno[];
    } catch (error) {
      console.error('performanceService.getDesempenoByEstudiante:', error);
      return [];
    }
  },

  async getDesempeno(id: string): Promise<Desempeno | null> {
    try {
      const raw = await offlineStore.getById<Record<string, unknown>>('desempeno', id);
      if (raw) return raw as unknown as Desempeno;
      const { data, error } = await supabase.from('desempeno').select('*').eq('id', id).single();
      if (error && error.code === 'PGRST116') return null;
      if (error) throw error;
      return data as Desempeno;
    } catch (error) {
      console.error('performanceService.getDesempeno:', error);
      return null;
    }
  },

  async removeDesempeno(id: string): Promise<boolean> {
    try {
      await offlineStore.remove('desempeno', id);
      await cacheService.invalidate('desempeno_all');
      return true;
    } catch (error) {
      console.error('performanceService.removeDesempeno:', error);
      return false;
    }
  },

  async calcularPromedio(
    estudianteId: string,
    asignaturaId: string,
    periodoId: string,
    actividadesOverride?: { id: string; ponderacion: number }[]
  ): Promise<Promedio | null> {
    try {
      const actividades = actividadesOverride ?? await (async () => {
        const { data, error: errAct } = await supabase
          .from('actividades')
          .select('id, ponderacion')
          .eq('id_asignatura', asignaturaId)
          .eq('id_periodo', periodoId)
          .eq('activo', true);
        if (errAct) throw errAct;
        return data;
      })();
      if (!actividades || actividades.length === 0) return null;
      const actividadIds = actividades.map(a => a.id);
      const all = await this.getDesempenoByEstudiante(estudianteId);
      const notas = all.filter(d => actividadIds.includes(d.id_actividad) && d.nota !== null);
      if (notas.length === 0) return null;
      const mapPond = Object.fromEntries(actividades.map(a => [a.id, a.ponderacion]));
      const totalPeso = notas.reduce((sum, d) => sum + (mapPond[d.id_actividad] ?? 1), 0);
      const sumaPonderada = notas.reduce((sum, d) => sum + (d.nota ?? 0) * (mapPond[d.id_actividad] ?? 1), 0);
      const promedio = totalPeso > 0 ? sumaPonderada / totalPeso : 0;
      const id = `${estudianteId}_${asignaturaId}_${periodoId}`;
      const estado = promedio < 4.0 ? 'riesgo' : 'activo';
      const prom: Promedio = {
        id,
        id_estudiante: estudianteId,
        id_asignatura: asignaturaId,
        id_periodo: periodoId,
        promedio_final: Math.round(promedio * 100) / 100,
        estado,
        activo: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return prom;
    } catch (error) {
      console.error('performanceService.calcularPromedio:', error);
      return null;
    }
  },

  async getPendingCount(): Promise<number> {
    const queue = await offlineStore.getPendingSync();
    return queue.filter(q => q.table === 'desempeno').length;
  },
};
