import React, { createContext, useContext } from 'react';
import type { ILibroRepository } from './interfaces/ILibroRepository';
import type { IUsuarioRepository } from './interfaces/IUsuarioRepository';
import type { ISolicitudRepository, IEstudianteRepository, IConfiguracionRepository } from './interfaces/index';
import type { ILugarRepository } from './interfaces/ILugarRepository';
import type { IEquipoRepository } from './interfaces/IEquipoRepository';
import type { IMantencionRepository } from './interfaces/IMantencionRepository';
import type { IRequerimientoRepository } from './interfaces/IRequerimientoRepository';
import { SupabaseLibroRepository } from './impl/SupabaseLibroRepository';
import { SupabaseUsuarioRepository } from './impl/SupabaseUsuarioRepository';
import { SupabaseEstudianteRepository } from './impl/SupabaseEstudianteRepository';
import { SupabaseSolicitudRepository } from './impl/SupabaseSolicitudRepository';
import { SupabaseConfiguracionRepository } from './impl/SupabaseConfiguracionRepository';
import { SupabaseLugarRepository } from './impl/SupabaseLugarRepository';
import { SupabaseEquipoRepository } from './impl/SupabaseEquipoRepository';
import { SupabaseMantencionRepository } from './impl/SupabaseMantencionRepository';
import { SupabaseRequerimientoRepository } from './impl/SupabaseRequerimientoRepository';

export interface Repositories {
  libro: ILibroRepository;
  usuario: IUsuarioRepository;
  solicitud: ISolicitudRepository;
  estudiante: IEstudianteRepository;
  configuracion: IConfiguracionRepository;
  lugar: ILugarRepository;
  equipo: IEquipoRepository;
  mantencion: IMantencionRepository;
  requerimiento: IRequerimientoRepository;
}

const RepoContext = createContext<Repositories | null>(null);

export function RepoProvider({ children }: { children: React.ReactNode }) {
  const repos: Repositories = {
    libro: new SupabaseLibroRepository(),
    usuario: new SupabaseUsuarioRepository(),
    solicitud: new SupabaseSolicitudRepository(),
    estudiante: new SupabaseEstudianteRepository(),
    configuracion: new SupabaseConfiguracionRepository(),
    lugar: new SupabaseLugarRepository(),
    equipo: new SupabaseEquipoRepository(),
    mantencion: new SupabaseMantencionRepository(),
    requerimiento: new SupabaseRequerimientoRepository(),
  };
  return React.createElement(RepoContext.Provider, { value: repos }, children);
}

export function useLibroRepo(): ILibroRepository {
  const ctx = useContext(RepoContext);
  if (!ctx) throw new Error('useLibroRepo must be inside RepoProvider');
  return ctx.libro;
}

export function useUsuarioRepo(): IUsuarioRepository {
  const ctx = useContext(RepoContext);
  if (!ctx) throw new Error('useUsuarioRepo must be inside RepoProvider');
  return ctx.usuario;
}

export function useEstudianteRepo(): IEstudianteRepository {
  const ctx = useContext(RepoContext);
  if (!ctx) throw new Error('useEstudianteRepo must be inside RepoProvider');
  return ctx.estudiante;
}

export function useSolicitudRepo(): ISolicitudRepository {
  const ctx = useContext(RepoContext);
  if (!ctx) throw new Error('useSolicitudRepo must be inside RepoProvider');
  return ctx.solicitud;
}

export function useConfiguracionRepo(): IConfiguracionRepository {
  const ctx = useContext(RepoContext);
  if (!ctx) throw new Error('useConfiguracionRepo must be inside RepoProvider');
  return ctx.configuracion;
}

export function useLugarRepo(): ILugarRepository {
  const ctx = useContext(RepoContext);
  if (!ctx) throw new Error('useLugarRepo must be inside RepoProvider');
  return ctx.lugar;
}

export function useEquipoRepo(): IEquipoRepository {
  const ctx = useContext(RepoContext);
  if (!ctx) throw new Error('useEquipoRepo must be inside RepoProvider');
  return ctx.equipo;
}

export function useMantencionRepo(): IMantencionRepository {
  const ctx = useContext(RepoContext);
  if (!ctx) throw new Error('useMantencionRepo must be inside RepoProvider');
  return ctx.mantencion;
}

export function useRequerimientoRepo(): IRequerimientoRepository {
  const ctx = useContext(RepoContext);
  if (!ctx) throw new Error('useRequerimientoRepo must be inside RepoProvider');
  return ctx.requerimiento;
}
