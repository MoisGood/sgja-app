import { cacheService } from './cacheService';
import { supabase } from '../lib/supabase';
import type { AyudaFAQ, AyudaTicket, AyudaCatalogoError } from '../types';

const CACHE_TTL = 10;

export const ayudaService = {
  async getFAQs(): Promise<AyudaFAQ[]> {
    try {
      const cached = await cacheService.get<AyudaFAQ[]>('ayuda_faq_all');
      if (cached) return cached;
      const { data, error } = await supabase.from('ayuda_faq').select('*').order('categoria');
      if (error) throw error;
      const result = (data || []) as AyudaFAQ[];
      await cacheService.set('ayuda_faq_all', result, CACHE_TTL);
      return result;
    } catch (error) {
      console.error('ayudaService.getFAQs:', error);
      return [];
    }
  },

  async saveFAQ(data: Omit<AyudaFAQ, 'id' | 'creado_en' | 'actualizado_en'>): Promise<AyudaFAQ | null> {
    try {
      const { data: result, error } = await supabase.from('ayuda_faq').insert({
        rol: data.rol,
        modulo: data.modulo,
        categoria: data.categoria,
        titulo: data.titulo,
        contenido: data.contenido,
        orden: data.orden ?? 0,
        activo: true,
      }).select().single();
      if (error) throw error;
      await cacheService.invalidate('ayuda_faq_all');
      return result as AyudaFAQ;
    } catch (error) {
      console.error('ayudaService.saveFAQ:', error);
      return null;
    }
  },

  async updateFAQ(id: string, data: Partial<AyudaFAQ>): Promise<boolean> {
    try {
      const { error } = await supabase.from('ayuda_faq').update({
        ...data, actualizado_en: new Date().toISOString(),
      }).eq('id', id);
      if (error) throw error;
      await cacheService.invalidate('ayuda_faq_all');
      return true;
    } catch (error) {
      console.error('ayudaService.updateFAQ:', error);
      return false;
    }
  },

  async deleteFAQ(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('ayuda_faq').update({ activo: false, actualizado_en: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      await cacheService.invalidate('ayuda_faq_all');
      return true;
    } catch (error) {
      console.error('ayudaService.deleteFAQ:', error);
      return false;
    }
  },

  async getTickets(): Promise<AyudaTicket[]> {
    try {
      const { data, error } = await supabase.from('ayuda_tickets').select('*').order('creado_en', { ascending: false });
      if (error) throw error;
      return (data || []) as AyudaTicket[];
    } catch (error) {
      console.error('ayudaService.getTickets:', error);
      return [];
    }
  },

  async getMisTickets(usuarioId: string): Promise<AyudaTicket[]> {
    try {
      const { data, error } = await supabase.from('ayuda_tickets').select('*').eq('usuario_id', usuarioId).order('creado_en', { ascending: false });
      if (error) throw error;
      return (data || []) as AyudaTicket[];
    } catch (error) {
      console.error('ayudaService.getMisTickets:', error);
      return [];
    }
  },

  async createTicket(ticket: Pick<AyudaTicket, 'usuario_id' | 'titulo' | 'descripcion'>): Promise<AyudaTicket | null> {
    try {
      const { data, error } = await supabase.from('ayuda_tickets').insert({
        usuario_id: ticket.usuario_id,
        titulo: ticket.titulo,
        descripcion: ticket.descripcion || null,
        estado: 'abierto',
        prioridad: 'media',
      }).select().single();
      if (error) throw error;
      return data as AyudaTicket;
    } catch (error) {
      console.error('ayudaService.createTicket:', error);
      return null;
    }
  },

  async updateTicketEstado(id: string, estado: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('ayuda_tickets').update({ estado, actualizado_en: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('ayudaService.updateTicketEstado:', error);
      return false;
    }
  },

  async getCatalogoErrores(): Promise<AyudaCatalogoError[]> {
    try {
      const cached = await cacheService.get<AyudaCatalogoError[]>('ayuda_catalogo_all');
      if (cached) return cached;
      const { data, error } = await supabase.from('ayuda_catalogo_errores').select('*').eq('activo', true).order('categoria').order('titulo');
      if (error) throw error;
      const result = (data || []) as AyudaCatalogoError[];
      await cacheService.set('ayuda_catalogo_all', result, CACHE_TTL);
      return result;
    } catch (error) {
      console.error('ayudaService.getCatalogoErrores:', error);
      return [];
    }
  },

  async saveError(data: Pick<AyudaCatalogoError, 'categoria' | 'titulo' | 'descripcion'>): Promise<AyudaCatalogoError | null> {
    try {
      const { data: result, error } = await supabase.from('ayuda_catalogo_errores').insert({
        categoria: data.categoria,
        titulo: data.titulo,
        descripcion: data.descripcion || null,
        activo: true,
      }).select().single();
      if (error) throw error;
      await cacheService.invalidate('ayuda_catalogo_all');
      return result as AyudaCatalogoError;
    } catch (error) {
      console.error('ayudaService.saveError:', error);
      return null;
    }
  },

  async updateError(id: string, data: Partial<AyudaCatalogoError>): Promise<boolean> {
    try {
      const { error } = await supabase.from('ayuda_catalogo_errores').update({
        ...data, actualizado_en: new Date().toISOString(),
      }).eq('id', id);
      if (error) throw error;
      await cacheService.invalidate('ayuda_catalogo_all');
      return true;
    } catch (error) {
      console.error('ayudaService.updateError:', error);
      return false;
    }
  },

  async deleteError(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('ayuda_catalogo_errores').update({ activo: false, actualizado_en: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      await cacheService.invalidate('ayuda_catalogo_all');
      return true;
    } catch (error) {
      console.error('ayudaService.deleteError:', error);
      return false;
    }
  },
};
