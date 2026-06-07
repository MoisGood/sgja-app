import { useSesion } from './useSesion';
import { useUsuarioLogueado } from './useUsuarioLogueado';
import type { PerfilState } from './useUsuarioLogueado';

export type { PerfilState };

export interface AuthState extends PerfilState {
  cargando: boolean;
}

export function useAuth(): AuthState {
  const { user, cargando: sesionCargando } = useSesion();
  const { perfil, cargando: perfilCargando } = useUsuarioLogueado(user);

  return {
    ...perfil,
    cargando: sesionCargando || perfilCargando,
  };
}
