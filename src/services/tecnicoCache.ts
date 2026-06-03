import { cacheService } from './cacheService';
import { supabase } from '../lib/supabase';
import type { PosibleFalla, PosibleDiagnostico, PosibleSolucion, PosibleObservacion, Equipo, Lugar } from '../types';

const PREFIX = 'tecnico_';

export interface TecnicoCacheData {
  equipos: (Equipo & { lugar_nombre?: string })[];
  lugares: Lugar[];
  posibles_fallas: PosibleFalla[];
  posibles_diagnosticos: PosibleDiagnostico[];
  posibles_soluciones: PosibleSolucion[];
  posibles_observaciones: PosibleObservacion[];
}

function key(idEst: string, name: string) {
  return `${PREFIX}${idEst}_${name}`;
}

export const tecnicoCache = {
  async getAll(idEstablecimiento: string): Promise<TecnicoCacheData | null> {
    return cacheService.get<TecnicoCacheData>(key(idEstablecimiento, 'full'));
  },

  async setAll(idEstablecimiento: string, data: TecnicoCacheData) {
    await cacheService.set(key(idEstablecimiento, 'full'), data, 60);
  },

  async prefetch(idEstablecimiento: string): Promise<TecnicoCacheData> {
    const [eqRes, lugRes, fRes, dRes, sRes, oRes] = await Promise.all([
      supabase.from('equipos').select('*').eq('id_establecimiento', idEstablecimiento).eq('activo', true).order('nombre'),
      supabase.from('lugares').select('*').eq('id_establecimiento', idEstablecimiento).eq('activo', true).order('nombre'),
      supabase.from('posibles_fallas').select('*').order('nombre'),
      supabase.from('posibles_diagnosticos').select('*').order('nombre'),
      supabase.from('posibles_soluciones').select('*').order('nombre'),
      supabase.from('posibles_observaciones').select('*').order('nombre'),
    ]);

    const data: TecnicoCacheData = {
      equipos: eqRes.data ?? [],
      lugares: lugRes.data ?? [],
      posibles_fallas: fRes.data ?? [],
      posibles_diagnosticos: dRes.data ?? [],
      posibles_soluciones: sRes.data ?? [],
      posibles_observaciones: oRes.data ?? [],
    };

    await this.setAll(idEstablecimiento, data);
    return data;
  },

  async clear(idEstablecimiento?: string) {
    if (idEstablecimiento) {
      await cacheService.invalidate(key(idEstablecimiento, 'full'));
    } else {
      await cacheService.clear();
    }
  },
};
