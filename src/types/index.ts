// ============================================================
// AGIL – Tipos y Enums
// src/types/index.ts
// ============================================================

export enum Rol {
  ADMIN       = 'ADMIN',
  INSPECTOR   = 'INSPECTOR',
  PARADOCENTE = 'PARADOCENTE',
  PROFESOR    = 'PROFESOR',
  ESTUDIANTE  = 'ESTUDIANTE',
  APODERADO   = 'APODERADO',
}

export enum EstadoSolicitud {
  INASISTENTE                = 'INASISTENTE',
  ATRASO_JUSTIFICADO        = 'ATRASO_JUSTIFICADO',
  ATRASO_INJUSTIFICADO      = 'ATRASO_INJUSTIFICADO',
  INASISTENCIA_JUSTIFICADA  = 'INASISTENCIA_JUSTIFICADA',
  INASISTENCIA_NO_JUSTIFICADA = 'INASISTENCIA_NO_JUSTIFICADA',
  NO_PRESENTADA             = 'NO_PRESENTADA',
  // Backward compat — se resuelven a los nuevos valores
  JUSTIFICADA               = 'INASISTENCIA_JUSTIFICADA',
  INJUSTIFICADA             = 'INASISTENTE',
  RECHAZADA                 = 'INASISTENCIA_NO_JUSTIFICADA',
  PENDIENTE                 = 'INASISTENTE',
}

export enum TipoRegistro {
  ATRASO = 'ATRASO',
  INASISTENCIA = 'INASISTENCIA',
}

export enum EstadoToken {
  ACTIVO    = 'Activo',
  CONSUMIDO = 'Consumido',
  EXPIRADO  = 'Expirado',
}

export enum TipoDiaCalendario {
  HABIL      = 'HABIL',
  FERIADO    = 'FERIADO',
  VACACIONES = 'VACACIONES',
  EVENTO     = 'EVENTO',
}

export enum OrigenEvento {
  MANUAL     = 'MANUAL',
  AUTOMATICO = 'AUTOMATICO',
}

export interface Establecimiento {
  id_establecimiento:   string;
  nombre:               string;
  logo_url:             string | null;
  codigo?:              string;
  region?:              string;
  activo:               boolean;
}

export interface Usuario {
  id_usuario:          string;
  uid?:                string;
  email:               string;
  nombre_completo:     string;
  apellidos?:          string;
  foto_url:            string | null;
  rol:                 Rol;
  tipo_usuario:        string;
  cuenta_activa:       boolean;
  id_establecimiento:  string | null;
  activo:              boolean;
  mfa_obligatorio:     boolean;
  fecha_creacion?:     Date;
}

export interface Estudiante {
  id_estudiante:       string;
  id_usuario:          string;
  id_establecimiento:  string;
  nombre_completo:     string;
  rut:                 string | null;
  curso:               string;
  anno_ingreso:        number;
  numero:              number | null;
  id_apoderado:        string | null;
  activo:              boolean;
}

export interface Solicitud {
  id_solicitud:        string;
  id_establecimiento:  string;
  id_estudiante:       string;
  id_profesor:         string;
  tipo:                TipoRegistro;
  fecha:               string;
  hora:                string;
  estado:              EstadoSolicitud;
  motivo_codigo:       string | null;
  motivo_descripcion:  string | null;
  observaciones:       string | null;
  respaldo_recibido:   boolean;
  tipo_respaldo:       string | null;
  id_token_qr:         string | null;
  // Nuevos campos para auditoría
  id_inspector_justificador?: string;  // Quién justificó
  hora_justificacion?: string;         // Cuándo se justificó
  curso?:              string;         // Curso del estudiante (para referencia)
  id_bloque?:          string;         // ID del bloque donde ocurrió la ausencia
  bloques_afectados?:  number;         // Cuántos bloques consecutivos está ausente
  creado_en?:          string;         // Timestamp de registro en el sistema (orden de llegada)
  tipo_pase?:          TipoPase;       // Tipo extendido de pase
}

export interface TokenQR {
  id_token:            string;
  id_establecimiento:  string;
  id_solicitud:        string | null;
  estado:              EstadoToken;
  codigo_legible:      string;
  consumed_via:        'QR' | 'MANUAL' | null;
}

export interface MotivoJustificacion {
  id_motivo:           string;
  id_establecimiento:  string;
  codigo:              string;
  descripcion:         string;
  requiere_detalle:    boolean;
  activo:              boolean;
  orden:               number;
  tipo_registro:       TipoRegistro;
}

export interface BloqueHorario {
  id_bloque:           string;
  id_establecimiento:  string;
  numero_bloque:       number;
  nombre_bloque:       string;
  hora_inicio:         string; // HH:mm
  hora_fin:            string; // HH:mm
  duracion_minutos:    number;
  tipo:                'clase' | 'recreo' | 'almuerzo' | 'otro';
  orden:               number;
  activo:              boolean;
  creado_en:           Date;
  actualizado_en:      Date;
}

export interface Curso {
  id_curso:            string;
  id_establecimiento:  string;
  nombre:              string;
  descripcion:         string;
  opcional:            string;
  nivel:               number; // 1-4
  letra:               string; // A-D
  activo:              boolean;
  orden:               number;
  creado_en:           Date;
  actualizado_en:      Date;
}

export interface RegistroBloqueProfesor {
  id_registro:         string;
  id_profesor:         string;
  id_establecimiento:  string;
  id_bloque:           string;
  numero_bloque:       number;
  nombre_bloque:       string;
  hora_registrada:     string; // HH:mm
  hora_inicio_bloque:  string; // HH:mm
  hora_fin_bloque:     string; // HH:mm
  curso:               string;
  fecha:               string; // YYYY-MM-DD
  creado_en:           Date;
}

export interface Funcionario {
  rut:                      string;
  rut_formateado:           string;
  id_usuario:               string | null;
  nombre_completo:          string;
  fecha_nacimiento:         string | null;
  domicilio:                string | null;
  comuna:                   string | null;
  celular:                  string | null;
  correo_personal:          string | null;
  correo_institucional:     string | null;
  tipo_funcionario:         string;
  tipo_contrato:            string;
  titulo_profesional:       string | null;
  universidad:              string | null;
  ano_titulacion:           number | null;
  asignatura:               string | null;
  horas_contrato:           number;
  fecha_ingreso:            string | null;
  fecha_termino:            string | null;
  emergencia_nombre:        string | null;
  emergencia_telefono:      string | null;
  emergencia_parentesco:    string | null;
  vigente:                  boolean;
  tiene_licencia:           boolean;
  tiene_permiso_admin:      boolean;
  usuario_registrado_sistema: boolean;
  creado_en:                string;
  actualizado_en:           string;
}

export interface FuncionarioDocumento {
  id:               string;
  rut_funcionario:  string;
  nombre:           string;
  tipo:             string;
  url:              string;
  subido_en:        string;
}

export interface FuncionarioAusencia {
  id:               string;
  rut_funcionario:  string;
  tipo:             'licencia' | 'permiso_admin' | 'dia_compensado' | 'otro';
  fecha_inicio:     string;
  fecha_termino:    string | null;
  motivo:           string | null;
  registrado_por:   string | null;
  creado_en:        string;
}

export interface ContactoCorreo {
  id: string;
  id_establecimiento: string;
  nombre: string;
  email: string;
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
}

export interface PlantillaCorreo {
  id:               string;
  id_establecimiento: string;
  nombre:           string;
  asunto:           string;
  cuerpo:           string;
  categoria:        string | null;
  ultimo_uso:       string | null;
  creado_por:       string | null;
  activo:           boolean;
  creado_en:        string;
  actualizado_en:   string;
}

// ════════════════════════════════════════════════════════════
// 🏛️ BIBLIOTECA
// ════════════════════════════════════════════════════════════

export interface Book {
  id: string;
  titulo: string;
  autor: string;
  isbn: string | null;
  editorial: string | null;
  anio_publicacion: number | null;
  categoria: string;
  descripcion: string | null;
  id_establecimiento: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface BookCopy {
  id: string;
  book_id: string;
  codigo_ejemplar: string;
  estanteria: string;
  fila: string;
  estado: 'disponible' | 'prestado' | 'perdido' | 'revision' | 'devuelto-no-procesado';
  id_establecimiento: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface LibraryLoan {
  id: string;
  copy_id: string;
  student_id: string;
  loan_date: string;
  due_date: string;
  returned_at: string | null;
  status: string;
  renewed_count: number;
  fine_amount: number;
  justification_id: string | null;
  delivered_by_user_id: string;
  received_by_user_id: string | null;
  id_establecimiento: string;
  return_condition: string | null;
  created_at: string;
  updated_at: string;
}

export interface LibraryHoliday {
  id: string;
  fecha: string;
  descripcion: string;
  anual: boolean;
  id_establecimiento: string | null;
  activo: boolean;
  created_at: string;
}

export interface JustificationType {
  id: string;
  nombre: string;
  descripcion: string;
  activo: boolean;
  id_establecimiento: string;
  created_at: string;
  updated_at: string;
}

export interface LibraryRule {
  id: string;
  rol: string;
  dias_prestamo: number;
  max_renovaciones: number;
  max_prestamos_simultaneos: number;
  multa_diaria: number;
  id_establecimiento: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

// ════════════════════════════════════════════════════════════
// 🏢 LUGARES (salas, pasillos, patios, accesos)
// ════════════════════════════════════════════════════════════

export interface Lugar {
  id: string;
  id_establecimiento: string;
  piso: number;
  nombre: string;
  zona: string;
  left_pos: number;
  top_pos: number;
  width: number;
  height: number;
  jefe?: string;
  qr_url?: string;
  activo: boolean;
  soporte?: boolean;
  created_at: string;
  updated_at: string;
}

// ════════════════════════════════════════════════════════════
// 📍 UBICACIONES (dispositivos por lugar)
// ════════════════════════════════════════════════════════════

export interface Ubicacion {
  id: string;
  id_lugar: string;
  id_establecimiento: string;
  dispositivo_nombre: string;
  cantidad: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

// ════════════════════════════════════════════════════════════
// 🛠️ MÓDULO TÉCNICO
// ════════════════════════════════════════════════════════════

export type EstadoEquipo = 'Operativo' | 'Con Fallas' | 'En Reparación' | 'Baja';

export interface Equipo {
  id: string;
  id_establecimiento: string;
  id_lugar?: string;
  id_usuario?: string;
  nombre: string;
  marca?: string;
  modelo?: string;
  tipo_equipo?: string;
  numero_serie?: string;
  cod_inventario?: string;
  estado: EstadoEquipo;
  foto_url?: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export type TipoMantencion = 'Preventiva' | 'Correctiva' | 'Formateo' | 'Reinstalación' | 'Actualización' | 'Otro';

export interface Mantencion {
  id: string;
  id_equipo: string;
  id_tecnico?: string;
  tipo_mantencion: TipoMantencion;
  descripcion?: string;
  fecha_mantencion: string;
  proxima_fecha?: string;
  costo?: number;
  activo: boolean;
  created_at: string;
}

export type EstadoRequerimiento = 'Pendiente' | 'En Proceso' | 'Completada' | 'Cancelada';
export type PrioridadRequerimiento = 'Baja' | 'Normal' | 'Alta' | 'Urgente';
export type TipoRequerimiento = 'Reparación' | 'Mantención' | 'Instalación' | 'Traslado' | 'Otro';

export interface Requerimiento {
  id: string;
  id_establecimiento: string;
  id_equipo?: string;
  id_lugar?: string;
  id_solicitante: string;
  id_tecnico_asignado?: string;
  tipo_requerimiento: TipoRequerimiento;
  descripcion: string;
  prioridad: PrioridadRequerimiento;
  estado: EstadoRequerimiento;
  fecha_solicitud: string;
  fecha_atencion?: string;
  observaciones?: string;
  posible_falla?: string;
  diagnostico?: string;
  solucion?: string;
  fecha_cierre?: string;
  id_tecnico_cierre?: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConfiguracionDispositivo {
  id: string;
  id_establecimiento: string;
  nombre: string;
  activo: boolean;
  inventariable: boolean;
  created_at: string;
  updated_at: string;
}

export interface PosibleFalla {
  id: string;
  id_establecimiento: string;
  nombre: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface PosibleDiagnostico {
  id: string;
  id_establecimiento: string;
  nombre: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface PosibleSolucion {
  id: string;
  id_establecimiento: string;
  nombre: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface PosibleObservacion {
  id: string;
  id_establecimiento: string;
  nombre: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface QrCode {
  id: string;
  codigo: string;
  tipo: 'lugar' | 'equipo';
  id_referencia: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Módulo Académico — Catálogos
// ============================================================

export type SalaTipo = 'cognitiva' | 'audiovisual' | 'colaborativa' | 'investigativa' | 'practica' | 'evaluacion';

export interface SalaAprendizaje {
  id: string;
  nombre: string;
  tipo: SalaTipo;
  capacidad: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Asignatura {
  id: string;
  nombre: string;
  nivel: string;
  horas_semanales: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Periodo {
  id: string;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Actividad {
  id: string;
  id_asignatura: string;
  id_periodo: string;
  id_sala: string | null;
  nombre: string;
  descripcion: string;
  ponderacion: number;
  fecha: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Desempeno {
  id: string;
  id_actividad: string;
  id_estudiante: string;
  nota: number | null;
  observaciones: string;
  created_at: string;
  activo: boolean;
}

export interface Promedio {
  id: string;
  id_estudiante: string;
  id_asignatura: string;
  id_periodo: string;
  promedio_final: number;
  estado: 'activo' | 'riesgo' | 'reprobado';
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface AyudaFAQ {
  id: string;
  rol: string[];
  modulo: string;
  categoria: string;
  titulo: string;
  contenido: string;
  orden: number;
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
}

export interface AyudaTicket {
  id: string;
  usuario_id: string;
  titulo: string;
  descripcion?: string;
  estado: 'abierto' | 'en_progreso' | 'resuelto' | 'cerrado';
  prioridad: 'baja' | 'media' | 'alta' | 'critica';
  creado_en: string;
  actualizado_en: string;
}

export interface AyudaCatalogoError {
  id: string;
  categoria: string;
  titulo: string;
  descripcion?: string;
  solucion?: string;
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
}

// ════════════════════════════════════════════════════════════
// ⚕️ ACCIDENTES ESCOLARES
// ════════════════════════════════════════════════════════════

export interface AccidenteEscolar {
  id: string;
  id_establecimiento: string;
  id_estudiante: string;
  id_funcionario: string;
  fecha_accidente: string;
  hora_accidente: string;
  lugar_accidente: string;
  descripcion_accidente: string | null;
  naturaleza_accidente: string | null;
  consecuencia_accidente: string | null;
  parte_cuerpo_afectada: string | null;
  tipo_lesion: string | null;
  primeros_auxilios: string | null;
  testigos: string | null;
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
}

// ════════════════════════════════════════════════════════════
// 📋 MATRÍCULAS DE ESTUDIANTES
// ════════════════════════════════════════════════════════════

export interface TelefonoApoderado {
  activo: boolean;
  valor: string;
}

export interface ApoderadoDatos {
  vinculo: string;
  rut: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  direccion: string;
  region: string;
  comuna: string;
  ocupacion: string;
  nivel_educacional: string;
  ingreso_mensual: string;
  tel_trabajo: TelefonoApoderado;
  tel_casa: TelefonoApoderado;
  tel_movil: TelefonoApoderado;
  correo: string;
}

export interface MatriculaDatos {
  // Sección 1 — Datos Personales
  rut: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  direccion: string;
  region: string;
  comuna: string;
  nacionalidad: string;
  fecha_nacimiento: string;
  movil: string;
  fijo: string;
  correo_personal: string;
  correo_institucional: string;
  nivel: string;
  curso_repetido: string;
  edad_30_marzo: string;
  procedencia_escolar: string;
  curso_actual?: string;

  // Sección 2 — Datos Familiares
  tipo_apoderado: string;
  vive_con: Record<string, number>;
  apoderado_titular: ApoderadoDatos;
  apoderado_suplente: ApoderadoDatos;

  // Sección 3 — Datos Sociales
  becas: string[];
  beca_etnia: string;
  programa_salud: string[];
  porcentaje_rsh: string;
  suf: string;

  // Sección 4 — Datos de Salud
  caracteristicas: string[];
  caracteristicas_detalle: Record<string, string>;
  enfermedades: string[];
  enfermedades_detalle: Record<string, string>;

  // Sección 5 — Conectividad y Académicos
  conectividad: string[];
  electivos_1_2_medio: string[];
  apoyo_hogar: string[];

  // Sección 6 — Consentimiento Ley 21.719
  consentimiento_completo: boolean;
  consentimiento_fecha: string;
  consentimiento_aceptados: Record<string, boolean>;
}

export interface ConsentimientoCasillaConfig {
  id: string;
  titulo: string;
  detalle: string;
  obligatoria: boolean;
  plantilla: 'imagen' | 'datos';
  pdfTitulo: string;
  pdfTexto: string;
}

export interface Matricula {
  id: string;
  id_establecimiento: string;
  id_funcionario: string | null;
  rut: string | null;
  nombre_completo: string | null;
  nivel: string | null;
  curso: string | null;
  fecha_nacimiento: string | null;
  estado: string;
  tipo: string | null;
  datos: MatriculaDatos;
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
}

export interface RetiroDatos {
  rut: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  nivel: string;
  curso: string;
  fecha_retiro: string;
  motivo: string;
}

export interface RetiroEstudiante {
  id: string;
  id_establecimiento: string;
  id_funcionario: string | null;
  rut: string | null;
  nombre_completo: string | null;
  nivel: string | null;
  curso: string | null;
  fecha_retiro: string | null;
  motivo: string | null;
  datos: RetiroDatos;
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
}

// ============================================================
// Asignación de cursos a paradocente
// ============================================================

export interface AsignacionParadocente {
  id: string;
  id_funcionario: string;
  id_establecimiento: string;
  nivel: string;
  curso: string;
  creado_en: string;
}

// ============================================================
// Consolidados de inasistencias
// ============================================================

export interface ConsolidadoEnviado {
  id: string;
  id_paradocente: string;
  id_establecimiento: string;
  fecha: string;
  cursos_json: CursoConsolidado[];
  enviado_en: string;
  observaciones: string | null;
}

export interface CursoConsolidado {
  nivel: string;
  curso: string;
  total_estudiantes: number;
  presentes: number;
  atrasados: number;
  ausentes: number;
}

// ============================================================
// Tipos extendidos de pase
// ============================================================

export type TipoPase =
  | 'atraso'
  | 'inasistencia'
  | 'salida_pedagogica'
  | 'acto'
  | 'desfile'
  | 'salida_medica'
  | 'dental'
  | 'otro';

export const TIPOS_PASE: { valor: TipoPase; etiqueta: string }[] = [
  { valor: 'atraso', etiqueta: 'Atraso' },
  { valor: 'inasistencia', etiqueta: 'Inasistencia' },
  { valor: 'salida_pedagogica', etiqueta: 'Salida Pedagógica' },
  { valor: 'acto', etiqueta: 'Acto' },
  { valor: 'desfile', etiqueta: 'Desfile' },
  { valor: 'salida_medica', etiqueta: 'Salida Médica' },
  { valor: 'dental', etiqueta: 'Dental' },
  { valor: 'otro', etiqueta: 'Otro' },
];
