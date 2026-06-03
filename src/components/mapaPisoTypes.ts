export interface LugarRow {
  id: string;
  piso: number;
  nombre: string;
  zona: string;
  left_pos: number;
  top_pos: number;
  width: number;
  height: number;
  soporte?: boolean;
}

export interface EquipoRow {
  id: string;
  nombre: string;
  marca: string | null;
  modelo: string | null;
  tipo_equipo: string | null;
  estado: string;
  numero_serie: string | null;
  cod_inventario: string | null;
  usuario: string | null;
}

export interface ReqRow {
  id: string;
  tipo_requerimiento: string;
  descripcion: string;
  estado: string;
  prioridad: string;
  created_at: string;
}

export interface UIState {
  piso: number;
  cargando: boolean;
  scale: number;
  scaleAuto: boolean;
  hovered: string | null;
  selected: LugarRow | null;
  cargandoDetalle: boolean;
  qrUrl: string | null;
  qrCodeString: string | null;
  qrCopied: boolean;
  qrCargando: boolean;
  modalReqAbierto: boolean;
  historialModalAbierto: boolean;
  dragDevice: string | null;
  dropHover: string | null;
  esMobil: boolean;
  panelWidth: number;
  panelMaxH: number;
}

export type UIAction =
  | { type: 'SET_PISO'; payload: number }
  | { type: 'SET_CARGANDO'; payload: boolean }
  | { type: 'SET_SCALE'; payload: number }
  | { type: 'SET_SCALE_AUTO'; payload: boolean }
  | { type: 'SET_HOVERED'; payload: string | null }
  | { type: 'SET_SELECTED'; payload: LugarRow | null }
  | { type: 'SET_CARGANDO_DETALLE'; payload: boolean }
  | { type: 'SET_QR_URL'; payload: string | null }
  | { type: 'SET_QR_CODE_STRING'; payload: string | null }
  | { type: 'SET_QR_COPIED'; payload: boolean }
  | { type: 'SET_QR_CARGANDO'; payload: boolean }
  | { type: 'SET_MODAL_REQ'; payload: boolean }
  | { type: 'SET_HISTORIAL_MODAL'; payload: boolean }
  | { type: 'SET_DRAG_DEVICE'; payload: string | null }
  | { type: 'SET_DROP_HOVER'; payload: string | null }
  | { type: 'HANDLE_RESIZE'; payload: { width: number; height: number } }
  | { type: 'RESET_SELECTION' };

export function uiReducer(state: UIState, action: UIAction): UIState {
  switch (action.type) {
    case 'SET_PISO': return { ...state, piso: action.payload };
    case 'SET_CARGANDO': return { ...state, cargando: action.payload };
    case 'SET_SCALE': return { ...state, scale: action.payload, scaleAuto: false };
    case 'SET_SCALE_AUTO': return { ...state, scaleAuto: action.payload };
    case 'SET_HOVERED': return { ...state, hovered: action.payload };
    case 'SET_SELECTED': return { ...state, selected: action.payload };
    case 'SET_CARGANDO_DETALLE': return { ...state, cargandoDetalle: action.payload };
    case 'SET_QR_URL': return { ...state, qrUrl: action.payload };
    case 'SET_QR_CARGANDO': return { ...state, qrCargando: action.payload };
    case 'SET_QR_CODE_STRING': return { ...state, qrCodeString: action.payload };
    case 'SET_QR_COPIED': return { ...state, qrCopied: action.payload };
    case 'SET_MODAL_REQ': return { ...state, modalReqAbierto: action.payload };
    case 'SET_HISTORIAL_MODAL': return { ...state, historialModalAbierto: action.payload };
    case 'SET_DRAG_DEVICE': return { ...state, dragDevice: action.payload };
    case 'SET_DROP_HOVER': return { ...state, dropHover: action.payload };
    case 'HANDLE_RESIZE':
      return {
        ...state,
        esMobil: action.payload.width < 768,
        panelWidth: Math.min(420, Math.max(300, action.payload.width * 0.32)),
        panelMaxH: action.payload.height - 130,
      };
    case 'RESET_SELECTION':
      return { ...state, selected: null, qrUrl: null, qrCodeString: null, qrCopied: false };
    default: return state;
  }
}

export const ESTADO_COLORS: Record<string, string> = {
  Operativo: '#16a34a', 'Con Fallas': '#ea580c',
  'En Reparación': '#ca8a04', Baja: '#6b7280',
};

export const ZONE_LABELS: Record<string, string> = {
  lab: 'Laboratorios', bib: 'Biblioteca', sala: 'Salas',
  admin: 'Administración', com: 'Comedor / Fitness', patio: 'Patio',
  pasillo: 'Pasillo', acceso: 'Acceso', park: 'Estacionamiento',
  internado: 'Internado', pie: 'PIE', other: 'Equipo Mult.', empty: 'Sin uso',
};

export const ZONE_COLORS: Record<string, string> = {
  lab: '#0891b2', patio: '#4ade80', pasillo: '#64748b',
  admin: '#3b82f6', sala: '#8b5cf6', com: '#d97706',
  acceso: '#22c55e', park: '#78716c', internado: '#f43f5e',
  pie: '#a21caf', bib: '#0ea5e9', other: '#6366f1', empty: '#cbd5e1',
};

export const PISOS = [
  { label: 'Subterráneo', valor: 0 },
  { label: 'Piso 1', valor: 1 },
  { label: 'Piso 2', valor: 2 },
  { label: 'Piso 3', valor: 3 },
];
