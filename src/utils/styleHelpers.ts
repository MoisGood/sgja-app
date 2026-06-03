/**
 * Utilidades para clases Tailwind responsivas
 * Reemplaza la necesidad de getStyles() dinámico
 */

export const tailwindClasses = {
  // Contenedores
  contenedor: 'p-3 sm:p-4 md:p-5 lg:p-6 bg-gray-50 min-h-screen',
  
  // Secciones
  seccionBusqueda: 'mb-4 sm:mb-6 md:mb-8 pb-3 sm:pb-6 border-b-2 border-gray-200',
  seccionFormulario: 'mt-3 sm:mt-4 md:mt-5 pt-3 sm:pt-4 md:pt-5',
  
  // Pestañas
  pestanas: 'flex gap-1 sm:gap-2 md:gap-2 mb-3 sm:mb-4 md:mb-5 border-b-2 border-gray-200 overflow-x-auto',
  botonPestana: 'px-3 sm:px-5 py-2 sm:py-3 bg-gray-100 text-gray-700 border-b-4 border-transparent font-semibold text-xs sm:text-sm cursor-pointer transition-all whitespace-nowrap',
  botonPestanaActivo: 'bg-white text-gray-900 border-b-4 border-primary-600',
  
  // Formularios
  label: 'text-xs sm:text-sm font-semibold text-gray-700',
  input: 'px-2 sm:px-3 py-1.5 sm:py-2.5 border border-gray-300 rounded text-xs sm:text-sm bg-white text-gray-700',
  select: 'px-2 sm:px-3 py-1.5 sm:py-2.5 border border-gray-300 rounded text-xs sm:text-sm bg-white text-gray-700',
  
  // Tablas
  tablaContenedor: 'mb-3 sm:mb-4 md:mb-5 border border-gray-300 rounded-lg overflow-hidden shadow-sm',
  filaEncabezado: 'px-3 sm:px-4 py-2.5 sm:py-3.5 bg-secondary-700 text-white font-semibold text-xs sm:text-sm border-b-2 border-gray-900',
  filaTabla: 'px-3 sm:px-4 py-2.5 sm:py-3.5 border-b border-gray-200 bg-white text-xs sm:text-sm transition-colors',
  
  // Botones
  botonPrimario: 'flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-primary-600 text-white border-none rounded font-semibold text-xs sm:text-sm cursor-pointer hover:bg-primary-700 transition-colors',
  botonSecundario: 'flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-300 text-gray-700 border-none rounded font-semibold text-xs sm:text-sm cursor-pointer hover:bg-gray-400 transition-colors',
  botonSeleccionar: 'px-2 sm:px-3.5 py-1 sm:py-2 bg-blue-100 text-blue-900 border border-blue-300 rounded text-xs sm:text-sm font-semibold cursor-pointer whitespace-nowrap transition-all',
  botonIcono: 'p-1.5 sm:p-2 bg-gray-100 border-2 border-gray-300 rounded text-sm sm:text-base cursor-pointer transition-all flex items-center justify-center',
  
  // Mensajes
  error: 'px-3 sm:px-4 py-2 sm:py-3 bg-red-100 text-red-900 rounded text-xs sm:text-sm mb-3 sm:mb-4',
  exito: 'px-3 sm:px-4 py-2 sm:py-3 bg-green-100 text-green-900 rounded text-xs sm:text-sm mb-3 sm:mb-4',
  
  // Iconos y texto
  icono: 'text-base sm:text-lg',
  subtitulo: 'text-sm sm:text-base font-bold text-gray-900 mb-3 sm:mb-4',
  spinner: 'text-center text-xs sm:text-sm text-gray-500 p-5 sm:p-10',
  
  // Layouts
  grupoFormulario: 'flex flex-col gap-2 mb-3 sm:mb-4',
  filaControles: 'flex flex-col sm:flex-row gap-3 sm:gap-4 mb-3 sm:mb-4',
  fila3Columnas: 'grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4',
  botones: 'flex flex-col sm:flex-row gap-2 sm:gap-3 mt-3 sm:mt-4',
  
  // Datos
  datoEstudiante: 'px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-100 rounded text-xs sm:text-sm mb-3 sm:mb-4',
  leyenda: 'mt-3 sm:mt-4 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200 flex flex-wrap gap-3 sm:gap-6',
  itemLeyenda: 'flex items-center gap-2 text-xs sm:text-sm text-gray-700',
  
  // Paginador
  paginador: 'flex justify-center items-center gap-2 sm:gap-4 mt-3 sm:mt-4 flex-wrap',
  botonPaginador: 'px-2 sm:px-3 py-1 sm:py-2 bg-gray-300 border-none rounded text-xs sm:text-sm cursor-pointer',
  paginaInfo: 'text-xs sm:text-sm font-semibold text-gray-700',
  
  // Estados
  sinDatos: 'text-center text-gray-500 p-3 sm:p-5',
};

/**
 * Obtiene clases dinámicas basadas en condiciones
 */
export function getConditionalClass(
  condition: boolean,
  classIfTrue: string,
  classIfFalse: string
): string {
  return condition ? classIfTrue : classIfFalse;
}

/**
 * Combina múltiples clases de Tailwind
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Estilos inline para casos que no se pueden hacer con Tailwind
 */
export const inlineStyles = {
  autocompletado: {
    position: 'absolute' as const,
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    maxHeight: '150px',
    overflowY: 'auto' as const,
    zIndex: 10,
    marginTop: '4px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  sugerencia: {
    padding: '8px 10px',
    cursor: 'pointer',
    borderBottom: '1px solid #E5E7EB',
    fontSize: '13px',
    color: '#374151',
  },
};
