import { useContext } from 'react';
import { SkinContext, type SkinContextType } from '../contexts/SkinContext';

export function useSkin(): SkinContextType {
  return useContext(SkinContext);
}
