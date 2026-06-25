// src/components/Ayuda/FlotanteAyuda.tsx
import { useState } from 'react';
import CentroDeAyuda from './CentroDeAyuda';

interface FlotanteAyudaProps {
  isOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
}

const FlotanteAyuda = ({ isOpen: isOpenExterno, onOpen, onClose }: FlotanteAyudaProps) => {
  const [isOpenInterno, setIsOpenInterno] = useState(false);
  const isOpen = isOpenExterno !== undefined ? isOpenExterno : isOpenInterno;

  const abrir = () => { if (onOpen) onOpen(); else setIsOpenInterno(true); };
  const cerrar = () => { if (onClose) onClose(); else setIsOpenInterno(false); };

  return (
    <>
      <button
        onClick={abrir}
        className="fixed bottom-5 right-5 z-50 w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 hover:shadow-xl active:scale-95 transition-all cursor-pointer"
        aria-label="Abrir centro de ayuda"
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 16.121a3 3 0 104.242-4.242 3 3 0 00-4.242 4.242z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a10 10 0 100 20 10 10 0 000-20z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
        </svg>
      </button>

      <CentroDeAyuda isOpen={isOpen} onClose={cerrar} />
    </>
  );
};

export default FlotanteAyuda;