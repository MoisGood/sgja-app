import { createContext, useState, useEffect, type ReactNode } from 'react';

export type Skin = 'base' | 'profesional' | 'juvenil' | 'senior';

export interface SkinContextType {
  skin: Skin;
  setSkin: (s: Skin) => void;
}

export const SkinContext = createContext<SkinContextType>({
  skin: 'base',
  setSkin: () => {},
});

const STORAGE_KEY = 'sgja_skin';

export function SkinProvider({ children }: { children: ReactNode }) {
  const [skin, setSkinState] = useState<Skin>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'base' || stored === 'profesional' || stored === 'juvenil' || stored === 'senior') return stored;
    } catch {}
    return 'base';
  });

  const setSkin = (s: Skin) => {
    setSkinState(s);
    try { localStorage.setItem(STORAGE_KEY, s); } catch {}
  };

  useEffect(() => {
    document.documentElement.dataset.skin = skin;
    return () => { document.documentElement.dataset.skin = 'base'; };
  }, [skin]);

  return (
    <SkinContext.Provider value={{ skin, setSkin }}>
      {children}
    </SkinContext.Provider>
  );
}
