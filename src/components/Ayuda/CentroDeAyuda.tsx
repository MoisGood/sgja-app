// src/components/Ayuda/CentroDeAyuda.tsx
import { useState, useRef, useEffect } from 'react';
import { ayudaService } from '../../services/ayuda.service';

const FALLBACK_HARDCODED: { categoria: string; items: { titulo: string; contenido: string }[] }[] = [
  { categoria: 'Ausencias', items: [
    { titulo: '¿Cómo registro una ausencia?', contenido: 'Ve a Justificaciones > Registrar. Selecciona el curso, marca los estudiantes ausentes, elige el motivo y guarda.' },
    { titulo: '¿Puedo registrar ausencias de días anteriores?', contenido: 'Sí, puedes seleccionar una fecha anterior en el calendario antes de registrar.' },
  ]},
  { categoria: 'Justificaciones', items: [
    { titulo: '¿Cómo revisar justificaciones?', contenido: 'Ve a Justificaciones > Ver Justificaciones. Puedes filtrar por fecha, curso o estado.' },
    { titulo: '¿Qué significa cada estado?', contenido: 'Injustificada = sin documento. Justificada = con documento aprobado. Pendiente = en revisión.' },
  ]},
  { categoria: 'Pases', items: [
    { titulo: '¿Cómo gestionar un pase?', contenido: 'Ve a Justificaciones > Gestión de Pases. Ahí puedes crear, aprobar o rechazar pases de estudiantes.' },
  ]},
  { categoria: 'Cuenta', items: [
    { titulo: '¿Dónde veo mi información?', contenido: 'Tu perfil está disponible en el menú de configuración. Puedes actualizar tus datos personales.' },
  ]},
];

// =============== COMPONENTE PRINCIPAL ===============
interface CentroDeAyudaProps {
  isOpen: boolean;
  onClose: () => void;
}

const CentroDeAyuda = ({ isOpen, onClose }: CentroDeAyudaProps) => {
  const [busqueda, setBusqueda] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState<string | null>(null);
  const [faqs, setFaqs] = useState<{ categoria: string; items: { titulo: string; contenido: string }[] }[]>(FALLBACK_HARDCODED);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setBusqueda('');
      setCategoriaActiva(null);
    }
  }, [isOpen]);

  useEffect(() => {
    ayudaService.getFAQs().then(data => {
      if (data.length > 0) {
        const grouped = data.reduce<Record<string, { titulo: string; contenido: string }[]>>((acc, f) => {
          if (!acc[f.categoria]) acc[f.categoria] = [];
          acc[f.categoria].push({ titulo: f.titulo, contenido: f.contenido });
          return acc;
        }, {});
        setFaqs(Object.entries(grouped).map(([categoria, items]) => ({ categoria, items })));
      }
    });
  }, [isOpen]);

  if (!isOpen) return null;

  const categoriasFiltradas = faqs.map(cat => ({
    ...cat,
    items: cat.items.filter(i =>
      i.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
      i.contenido.toLowerCase().includes(busqueda.toLowerCase())
    ),
  })).filter(cat => cat.items.length > 0);

  const categoriasVisibles = categoriaActiva
    ? categoriasFiltradas.filter(c => c.categoria === categoriaActiva)
    : categoriasFiltradas;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]" onClick={onClose}>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[75vh] overflow-hidden mx-4 animate-in"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'slideUp 0.2s ease-out' }}
      >
        <style>{`
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(16px) scale(0.97); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          .faq-enter { animation: fadeIn 0.15s ease-out; }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>

        {/* Header con búsqueda */}
        <div className="p-6 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-800">Centro de Ayuda</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors" aria-label="Cerrar">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              placeholder="Buscar en la ayuda..."
              value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); setCategoriaActiva(null); }}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Categorías (píldoras) */}
        {!busqueda && !categoriaActiva && (
          <div className="px-6 pt-4 pb-2 flex gap-2 overflow-x-auto">
            {faqs.map(cat => (
              <button
                key={cat.categoria}
                onClick={() => setCategoriaActiva(cat.categoria)}
                className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium hover:bg-blue-100 transition-colors whitespace-nowrap"
              >
                {cat.categoria}
              </button>
            ))}
            <button
              onClick={() => setCategoriaActiva(null)}
              className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium hover:bg-gray-200 transition-colors whitespace-nowrap"
            >
              Ver todo
            </button>
          </div>
        )}

        {/* Barra de categoría activa */}
        {categoriaActiva && !busqueda && (
          <div className="px-6 pt-4 pb-1 flex items-center gap-2">
            <button onClick={() => setCategoriaActiva(null)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
              ← Todas las categorías
            </button>
            <span className="text-xs text-gray-300">/</span>
            <span className="text-xs text-gray-500 font-medium">{categoriaActiva}</span>
          </div>
        )}

        {/* Resultados de búsqueda o categoría */}
        <div className="p-6 pt-3 overflow-y-auto" style={{ maxHeight: 'calc(75vh - 180px)' }}>
          {categoriasVisibles.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-gray-500 text-sm">No encontramos resultados para <strong>"{busqueda}"</strong></p>
              <p className="text-gray-400 text-xs mt-1">Prueba con otras palabras clave</p>
            </div>
          ) : (
            categoriasVisibles.map((cat, idx) => (
              <div key={cat.categoria} className={idx > 0 ? 'mt-6' : ''}>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="w-4 h-px bg-gray-300" />
                  {cat.categoria}
                </h3>
                <div className="space-y-1.5">
                  {cat.items.map(item => (
                    <FaqItem key={item.titulo} titulo={item.titulo} contenido={item.contenido} />
                  ))}
                </div>
              </div>
            ))
          )}

          {/* Sección de Tutoriales (siempre visible al final) */}
          {!busqueda && (
            <div className="mt-8 pt-6 border-t border-gray-100">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-4 h-px bg-gray-300" />
                Tutoriales disponibles
              </h3>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                <p className="text-amber-800 text-sm font-medium mb-1">Próximamente</p>
                <p className="text-amber-600 text-xs">Los tutoriales guiados paso a paso están en desarrollo.</p>
              </div>
            </div>
          )}

          <div className="h-4" />
        </div>
      </div>
    </div>
  );
};

// =============== COMPONENTE FAQ ITEM ===============
const FaqItem = ({ titulo, contenido }: { titulo: string; contenido: string }) => {
  const [expandido, setExpandido] = useState(false);

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${expandido ? 'border-blue-200 shadow-sm' : 'border-gray-100 hover:border-gray-200'}`}>
      <button
        onClick={() => setExpandido(!expandido)}
        className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left bg-white hover:bg-gray-50/50 transition-colors"
      >
        <span className="text-sm font-medium text-gray-800">{titulo}</span>
        <svg
          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${expandido ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {expandido && (
        <div className="px-4 pb-3 pt-0 faq-enter">
          <p className="text-sm text-gray-600 leading-relaxed">{contenido}</p>
        </div>
      )}
    </div>
  );
};

export default CentroDeAyuda;