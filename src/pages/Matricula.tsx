// ============================================================
// AGIL – Formulario de Matrícula de Nuevos Estudiantes
// src/pages/Matricula.tsx
// ============================================================

import { useState, useEffect, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import Spinner from '../components/Common/Spinner';
import { Search, RotateCcw, Check, ChevronLeft, ChevronRight, Send, Printer } from 'lucide-react';
import { formatearRUT, validarRUT } from '../utils/rutUtils';
import {
  crearMatricula,
  buscarEstudiantePorRut,
  guardarConsentimientos,
  anularMatricula,
} from '../services/matricula.service';
import { abrirPDFConsentimiento } from '../services/consentimiento-pdf.service';
import { REGIONES_DE_CHILE, comunasDeRegion, regionDeComuna } from '../data/comunas-chile';
import type { ApoderadoDatos, ConsentimientoCasillaConfig, MatriculaDatos, TelefonoApoderado } from '../types';

interface Props {
  idEstablecimiento: string;
  idFuncionario: string;
}

// ─────────────────────────────────────────────────────────────
// Opciones del formulario
// ─────────────────────────────────────────────────────────────

const NIVELES = [
  { valor: '1', etiqueta: '1° Medio' },
  { valor: '2', etiqueta: '2° Medio' },
  { valor: '3', etiqueta: '3° Medio' },
  { valor: '4', etiqueta: '4° Medio' },
];

const PAISES_SUDAMERICA = [
  'Argentina', 'Bolivia', 'Brasil', 'Chile', 'Colombia', 'Ecuador',
  'Guyana', 'Paraguay', 'Perú', 'Surinam', 'Uruguay', 'Venezuela',
];

const CURSOS_REPETIDOS = [
  '1° Básico', '2° Básico', '3° Básico', '4° Básico', '5° Básico', '6° Básico',
  '7° Básico', '8° Básico', '1° Medio', '2° Medio', '3° Medio', '4° Medio',
];

const VINCULOS = ['Madre', 'Padre', 'Tutor/a', 'Tio/a', 'Abuelo/a', 'Primo/a'];
const OCUPACIONES = ['Desempleado', 'Empleado', 'Estudiante', 'Dueña de Casa'];
const NIVELES_EDUCACIONALES = [
  'Básica Completa',
  'Básica Incompleta',
  'Media Completa',
  'Media Incompleta',
  'Superior Técnica Completa',
  'Superior Técnica Incompleta',
  'Superior Universitaria Completa',
  'Superior Universitaria Incompleta',
  'Post Grado',
  'Diplomado',
  'Otro',
];

interface OpcionLista {
  valor: string;
  etiqueta: string;
  detalle?: boolean;
}

const BECAS: OpcionLista[] = [
  { valor: 'Estudiante Prioritario', etiqueta: 'Estudiante Prioritario' },
  { valor: 'Estudiante Preferente', etiqueta: 'Estudiante Preferente' },
  {
    valor: 'Subsistema de Chile Seguridades y Oportunidades (Chile Solidario)',
    etiqueta: 'Subsistema de Chile Seguridades y Oportunidades (Chile Solidario)',
  },
  { valor: 'Beca Indígena', etiqueta: 'Beca Indígena' },
  { valor: 'Beca Presidente de la República', etiqueta: 'Beca Presidente de la República' },
  { valor: 'Etnia', etiqueta: 'Etnia', detalle: true },
];

const PROGRAMA_SALUD: OpcionLista[] = [
  { valor: 'Otorrino', etiqueta: 'Otorrino' },
  { valor: 'Oftalmología', etiqueta: 'Oftalmología' },
  { valor: 'Columna', etiqueta: 'Columna' },
  { valor: 'Atención Dental', etiqueta: 'Atención Dental' },
];

const CARACTERISTICAS: OpcionLista[] = [
  { valor: 'Peso en Kg', etiqueta: 'Peso en Kg', detalle: true },
  { valor: 'Estatura, Altura', etiqueta: 'Estatura, Altura', detalle: true },
  { valor: 'Usa Lentes Ópticos', etiqueta: 'Usa Lentes Ópticos' },
  { valor: 'Audífonos', etiqueta: 'Audífonos' },
  { valor: 'Plantillas', etiqueta: 'Plantillas' },
  { valor: 'Otro', etiqueta: 'Otro', detalle: true },
];

const ENFERMEDADES: OpcionLista[] = [
  { valor: 'Autoinmune', etiqueta: 'Autoinmune' },
  { valor: 'Cardiacas', etiqueta: 'Cardiacas' },
  { valor: 'Respiratorias', etiqueta: 'Respiratorias' },
  { valor: 'Diabetes', etiqueta: 'Diabetes' },
  { valor: 'Otra', etiqueta: 'Otra', detalle: true },
  { valor: 'Enfermedad en Tratamiento', etiqueta: 'Enfermedad en Tratamiento', detalle: true },
  { valor: 'Medicamento de uso habitual', etiqueta: 'Medicamento de uso habitual', detalle: true },
  { valor: 'Capacidades diferentes', etiqueta: 'Capacidades diferentes' },
  { valor: 'Alergias ¿Cuales?', etiqueta: 'Alergias ¿Cuales?', detalle: true },
];

const CONECTIVIDAD: OpcionLista[] = [
  { valor: 'Estudiante cuenta con conexión a internet estable para plataformas online', etiqueta: 'Estudiante cuenta con conexión a internet estable para plataformas online' },
  { valor: 'La estudiante podría recibir ayuda tecnológica en casa', etiqueta: 'La estudiante podría recibir ayuda tecnológica en casa' },
  { valor: 'Notebook propio', etiqueta: 'Notebook propio' },
  { valor: 'Computador propio', etiqueta: 'Computador propio' },
  { valor: 'Computador y notebook compartido', etiqueta: 'Computador y notebook compartido' },
  { valor: 'Tablet propio', etiqueta: 'Tablet propio' },
  { valor: 'Tablet compartido', etiqueta: 'Tablet compartido' },
  { valor: 'Tablet facilitado por el liceo', etiqueta: 'Tablet facilitado por el liceo' },
  { valor: 'Smartphone propio', etiqueta: 'Smartphone propio' },
  { valor: 'Smartphone compartido', etiqueta: 'Smartphone compartido' },
];

const ELECTIVOS: OpcionLista[] = [
  { valor: 'Religión', etiqueta: 'Religión' },
  { valor: 'Artes', etiqueta: 'Artes' },
];

const APOYO_HOGAR: OpcionLista[] = [
  { valor: 'La Estudiante puede recibir ayuda con sus quehaceres escolares en casa.', etiqueta: 'La Estudiante puede recibir ayuda con sus quehaceres escolares en casa.' },
];

const CONSENTIMIENTO_CASILLAS: ConsentimientoCasillaConfig[] = [
  {
    id: 'tratamiento_academico',
    titulo: 'Tratamiento de datos personales para fines académicos y administrativos.',
    detalle: 'Se autoriza a la institución a recopilar y tratar los datos personales del estudiante (incluyendo RUN, nombres, apellidos, fecha de nacimiento, dirección, teléfonos y correos electrónicos) exclusivamente para los fines de gestión académica, registro de asistencia, justificación de inasistencias, emisión de certificados y demás trámites internos propios del sistema educativo, de conformidad con la Ley 21.719.',
    obligatoria: true,
    plantilla: 'datos',
    pdfTitulo: 'Consentimiento para tratamiento de datos personales con fines académicos',
    pdfTexto: 'El/la apoderado/a autoriza expresamente a la institución educativa a tratar los datos personales del estudiante para fines académicos y administrativos, incluyendo gestión de matrícula, calificaciones, asistencia, certificados y trámites internos.',
  },
  {
    id: 'fotografias_institucionales',
    titulo: 'Fotografías y videos durante actividades institucionales.',
    detalle: 'Se autoriza a la institución a capturar fotografías y videos del estudiante durante actividades educativas, ceremonias, eventos deportivos, salidas pedagógicas y demás actividades institucionales realizadas dentro y fuera del establecimiento.',
    obligatoria: true,
    plantilla: 'imagen',
    pdfTitulo: 'Consentimiento para fotografías y videos institucionales',
    pdfTexto: 'El/la apoderado/a autoriza a la institución educativa a capturar imágenes y videos del estudiante durante actividades institucionales.',
  },
  {
    id: 'publicacion_web',
    titulo: 'Publicación en sitio web oficial del establecimiento.',
    detalle: 'Se autoriza a la institución a publicar fotografías y videos del estudiante en el sitio web oficial del establecimiento, con fines informativos y de difusión de actividades educativas.',
    obligatoria: false,
    plantilla: 'imagen',
    pdfTitulo: 'Consentimiento para publicación en sitio web',
    pdfTexto: 'El/la apoderado/a autoriza la publicación de imágenes del estudiante en el sitio web oficial del establecimiento educativo.',
  },
  {
    id: 'publicacion_rrss',
    titulo: 'Publicación en redes sociales oficiales del establecimiento.',
    detalle: 'Se autoriza a la institución a publicar fotografías y videos del estudiante en las redes sociales oficiales del establecimiento (Facebook, Instagram, X, entre otras), con fines de difusión de actividades educativas.',
    obligatoria: false,
    plantilla: 'imagen',
    pdfTitulo: 'Consentimiento para publicación en redes sociales',
    pdfTexto: 'El/la apoderado/a autoriza la publicación de imágenes del estudiante en las redes sociales oficiales del establecimiento educativo.',
  },
  {
    id: 'material_institucional',
    titulo: 'Uso en material institucional o informativo.',
    detalle: 'Se autoriza a la institución a utilizar fotografías y videos del estudiante en material institucional impreso o digital, tales como folletos, afiches, presentaciones y otros materiales informativos del establecimiento.',
    obligatoria: false,
    plantilla: 'imagen',
    pdfTitulo: 'Consentimiento para uso en material institucional',
    pdfTexto: 'El/la apoderado/a autoriza el uso de imágenes del estudiante en material institucional impreso o digital del establecimiento educativo.',
  },
  {
    id: 'declaracion_conocimiento',
    titulo: 'Usted está en conocimiento acerca de la Ley de Protección de Datos y acepta que el establecimiento le ha brindado toda la información necesaria.',
    detalle: 'Declaro haber sido informado/a sobre la Ley 21.719 de Protección de Datos Personales, sus derechos ARCO+ (Acceso, Rectificación, Cancelación, Oposición y Portabilidad), la finalidad del tratamiento de datos, el responsable del tratamiento, la duración del mismo y los canales de contacto para ejercer sus derechos o revocar este consentimiento.',
    obligatoria: true,
    plantilla: 'datos',
    pdfTitulo: 'Declaración de conocimiento — Ley 21.719',
    pdfTexto: 'El/la apoderado/a declara estar en conocimiento de la Ley 21.719 de Protección de Datos Personales, haber recibido información completa sobre el tratamiento de datos y sus derechos ARCO+.',
  },
];

interface ViveConOpcion {
  valor: string;
  etiqueta: string;
  contador: boolean;
}

const VIVE_CON: ViveConOpcion[] = [
  { valor: 'Padre', etiqueta: 'Padre', contador: false },
  { valor: 'Madre', etiqueta: 'Madre', contador: false },
  { valor: 'Hermano', etiqueta: 'Hermano', contador: true },
  { valor: 'Hermana', etiqueta: 'Hermana', contador: true },
  { valor: 'Abuelo', etiqueta: 'Abuelo', contador: true },
  { valor: 'Abuela', etiqueta: 'Abuela', contador: true },
  { valor: 'Madrastra', etiqueta: 'Madrastra', contador: false },
  { valor: 'Padrastro', etiqueta: 'Padrastro', contador: false },
  { valor: 'Primo', etiqueta: 'Primo', contador: true },
  { valor: 'Prima', etiqueta: 'Prima', contador: true },
  { valor: 'Tío', etiqueta: 'Tío', contador: true },
  { valor: 'Tía', etiqueta: 'Tía', contador: true },
];

const PASOS = ['Datos Personales', 'Datos Familiares', 'Datos Sociales', 'Datos de Salud', 'Conectividad'];

const BORRADOR_KEY = 'matricula_borrador_v2';

// ─────────────────────────────────────────────────────────────
// Estado inicial
// ─────────────────────────────────────────────────────────────

function telefonoVacio(): TelefonoApoderado {
  return { activo: false, valor: '' };
}

function apoderadoVacio(): ApoderadoDatos {
  return {
    vinculo: '',
    rut: '',
    nombres: '',
    apellido_paterno: '',
    apellido_materno: '',
    direccion: '',
    region: 'Biobío',
    comuna: 'Concepción',
    ocupacion: '',
    nivel_educacional: '',
    ingreso_mensual: '',
    tel_trabajo: telefonoVacio(),
    tel_casa: telefonoVacio(),
    tel_movil: telefonoVacio(),
    correo: '',
  };
}

function formInicial(): MatriculaDatos {
  return {
    rut: '',
    nombres: '',
    apellido_paterno: '',
    apellido_materno: '',
    direccion: '',
    region: 'Biobío',
    comuna: 'Concepción',
    nacionalidad: 'Chile',
    fecha_nacimiento: '',
    movil: '',
    fijo: '',
    correo_personal: '',
    correo_institucional: '',
    nivel: '',
    curso_repetido: '',
    edad_30_marzo: '',
    procedencia_escolar: '',
    tipo_apoderado: '',
    vive_con: {},
    apoderado_titular: apoderadoVacio(),
    apoderado_suplente: apoderadoVacio(),
    becas: [],
    beca_etnia: '',
    programa_salud: [],
    porcentaje_rsh: '',
    suf: '',
    caracteristicas: [],
    caracteristicas_detalle: {},
    enfermedades: [],
    enfermedades_detalle: {},
    conectividad: [],
    electivos_1_2_medio: [],
    apoyo_hogar: [],
    consentimiento_completo: false,
    consentimiento_fecha: '',
    consentimiento_aceptados: {},
  };
}

// ─────────────────────────────────────────────────────────────
// Validadores
// ─────────────────────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LETRAS_REGEX = /^[a-zA-ZÁÉÍÓÚÜÑáéíóúüñ' ]+$/;

function soloLetras(valor: string): boolean {
  return LETRAS_REGEX.test(valor.trim());
}

function emailValido(valor: string): boolean {
  if (!valor.trim()) return true;
  return EMAIL_REGEX.test(valor.trim());
}

function telefonoValido(valor: string, digitos: number[]): boolean {
  if (!valor.trim()) return true;
  const limpio = valor.replace(/\D/g, '');
  return digitos.includes(limpio.length);
}

function calcularEdad30Marzo(fechaISO: string): string {
  if (!fechaISO) return '';
  const [y, m, d] = fechaISO.split('-').map(Number);
  if (!y || !m || !d) return '';
  const nacimiento = new Date(y, m - 1, d);
  const anioCorte = new Date().getFullYear();
  const corte = new Date(anioCorte, 2, 30);
  let edad = anioCorte - y;
  if (nacimiento > corte) edad--;
  return edad >= 0 ? String(edad) : '';
}

function validarSeccion1(f: MatriculaDatos): Record<string, string> {
  const e: Record<string, string> = {};
  if (!f.rut.trim()) e.rut = 'El RUT es obligatorio';
  else if (!validarRUT(f.rut)) e.rut = 'RUT inválido (verifica el dígito verificador)';
  if (!f.nombres.trim()) e.nombres = 'Obligatorio';
  else if (!soloLetras(f.nombres)) e.nombres = 'Solo letras';
  if (!f.apellido_paterno.trim()) e.apellido_paterno = 'Obligatorio';
  else if (!soloLetras(f.apellido_paterno)) e.apellido_paterno = 'Solo letras';
  if (!f.apellido_materno.trim()) e.apellido_materno = 'Obligatorio';
  else if (!soloLetras(f.apellido_materno)) e.apellido_materno = 'Solo letras';
  if (!f.direccion.trim()) e.direccion = 'Obligatorio';
  if (!f.comuna) e.comuna = 'Selecciona una comuna';
  if (!f.fecha_nacimiento) e.fecha_nacimiento = 'Obligatorio';
  else if (f.fecha_nacimiento < '2006-01-01') e.fecha_nacimiento = 'La fecha debe ser 2006 o posterior';
  else if (f.fecha_nacimiento > new Date().toISOString().slice(0, 10)) e.fecha_nacimiento = 'No puede ser futura';
  if (!telefonoValido(f.movil, [9])) e.movil = 'Debe tener 9 dígitos';
  if (!telefonoValido(f.fijo, [8, 9])) e.fijo = 'Debe tener 8 a 9 dígitos';
  if (!emailValido(f.correo_personal)) e.correo_personal = 'Correo inválido';
  if (!emailValido(f.correo_institucional)) e.correo_institucional = 'Correo inválido';
  if (!f.nivel.trim()) e.nivel = 'Obligatorio';
  if (!f.procedencia_escolar.trim()) e.procedencia_escolar = 'Obligatorio';
  return e;
}

function validarApoderado(a: ApoderadoDatos, pref: 'titular' | 'suplente'): Record<string, string> {
  const e: Record<string, string> = {};
  if (!a.vinculo) e[`${pref}_vinculo`] = 'Selecciona el vínculo';
  if (!a.rut.trim()) e[`${pref}_rut`] = 'Obligatorio';
  else if (!validarRUT(a.rut)) e[`${pref}_rut`] = 'RUT inválido';
  if (!a.nombres.trim()) e[`${pref}_nombres`] = 'Obligatorio';
  else if (!soloLetras(a.nombres)) e[`${pref}_nombres`] = 'Solo letras';
  if (!a.apellido_paterno.trim()) e[`${pref}_apellido_paterno`] = 'Obligatorio';
  else if (!soloLetras(a.apellido_paterno)) e[`${pref}_apellido_paterno`] = 'Solo letras';
  if (!a.apellido_materno.trim()) e[`${pref}_apellido_materno`] = 'Obligatorio';
  else if (!soloLetras(a.apellido_materno)) e[`${pref}_apellido_materno`] = 'Solo letras';
  if (!a.direccion.trim()) e[`${pref}_direccion`] = 'Obligatorio';
  if (!a.comuna.trim()) e[`${pref}_comuna`] = 'Selecciona una comuna';
  if (pref === 'titular') {
    if (!a.ocupacion) e[`${pref}_ocupacion`] = 'Selecciona una opción';
    if (!a.nivel_educacional) e[`${pref}_nivel_educacional`] = 'Selecciona una opción';
  }
  const telfs: TelefonoApoderado[] = [a.tel_trabajo, a.tel_casa, a.tel_movil];
  const alMenosUno = telfs.some((t) => t.activo && t.valor.trim());
  if (!alMenosUno) e[`${pref}_telefonos`] = 'Registra al menos un teléfono activo';
  telfs.forEach((t, i) => {
    if (t.activo && !telefonoValido(t.valor, [8, 9])) {
      e[`${pref}_tel_${i}`] = 'Debe tener 8 a 9 dígitos';
    }
  });
  if (!emailValido(a.correo)) e[`${pref}_correo`] = 'Correo inválido';
  return e;
}

function validarSeccion2(f: MatriculaDatos): Record<string, string> {
  const e: Record<string, string> = {};
  if (!f.tipo_apoderado) e.tipo_apoderado = 'Selecciona una opción';
  const totalViveCon = Object.values(f.vive_con).reduce((a, b) => a + (b || 0), 0);
  if (totalViveCon < 1) e.vive_con = 'Selecciona al menos 1 conviviente';
  Object.assign(e, validarApoderado(f.apoderado_titular, 'titular'));
  Object.assign(e, validarApoderado(f.apoderado_suplente, 'suplente'));
  return e;
}

function validarSeccion3(f: MatriculaDatos): Record<string, string> {
  const e: Record<string, string> = {};
  if (f.becas.length < 1) e.becas = 'Selecciona al menos 1 beca o beneficio';
  if (f.programa_salud.length < 1) e.programa_salud = 'Selecciona al menos 1 programa';
  return e;
}

function validarTodo(f: MatriculaDatos): Record<string, string> {
  return { ...validarSeccion1(f), ...validarSeccion2(f), ...validarSeccion3(f) };
}

function apoderadoCompleto(a: ApoderadoDatos, esSuplenteAp: boolean): boolean {
  if (!a.vinculo || !a.rut.trim() || !validarRUT(a.rut)) return false;
  if (!a.nombres.trim() || !a.apellido_paterno.trim() || !a.apellido_materno.trim()) return false;
  if (!a.direccion.trim() || !a.comuna.trim()) return false;
  if (!esSuplenteAp && (!a.ocupacion || !a.nivel_educacional)) return false;
  const telfs: TelefonoApoderado[] = [a.tel_trabajo, a.tel_casa, a.tel_movil];
  if (!telfs.some((t) => t.activo && t.valor.trim())) return false;
  return emailValido(a.correo);
}

// ─────────────────────────────────────────────────────────────
// Componentes UI internos
// ─────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  contenedor: {
    maxWidth: '960px',
    margin: '0 auto',
    padding: '8px 0 40px',
    fontFamily: 'Arial, sans-serif',
    color: '#1F2937',
  },
  titulo: { fontSize: '22px', fontWeight: 700, color: '#1A3C6B', margin: '0 0 4px 0' },
  subtitulo: { fontSize: '13px', color: '#6B7280', margin: '0 0 20px 0' },
  progreso: { display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' },
  pasoDot: {
    display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px',
    fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: '1px solid #E5E7EB', background: '#fff',
    color: '#6B7280', transition: 'all 0.15s',
  },
  tarjeta: {
    background: '#fff', borderRadius: '12px', boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
    padding: '24px', border: '1px solid #E5E7EB',
  },
  tarjetaHdr: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    paddingBottom: '14px', borderBottom: '1px solid #E5E7EB', marginBottom: '18px',
  },
  tarjetaTitulo: { fontSize: '16px', fontWeight: 700, color: '#1A3C6B', margin: 0 },
  campo: {
    background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px',
    padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '0',
  },
  campoLabel: {
    fontSize: '10px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase',
    letterSpacing: '0.3px', display: 'flex', alignItems: 'center', gap: '4px',
  },
  input: {
    border: '1px solid #D1D5DB', borderRadius: '6px', padding: '8px 10px', fontSize: '14px',
    fontFamily: 'inherit', color: '#1F2937', background: '#fff', width: '100%', boxSizing: 'border-box',
  },
  select: {
    width: '100%', padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: '6px',
    fontSize: '14px', fontFamily: 'inherit', background: '#fff', color: '#1F2937',
  },
  error: { fontSize: '11px', color: '#DC2626', margin: '2px 0 0 0' },
  fila: { display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' },
  nav: { display: 'flex', justifyContent: 'space-between', marginTop: '20px', gap: '10px' },
  lista: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '6px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px',
  },
  itemChk: {
    display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#374151',
    background: '#fff', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '6px 8px',
    cursor: 'pointer', userSelect: 'none',
  },
  botonNav: {
    display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 22px',
    borderRadius: '8px', fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer',
  },
  contador: { display: 'inline-flex', alignItems: 'center', gap: '6px' },
};

function Campo({ label, requerido, error, children, style }: {
  label: string; requerido?: boolean; error?: string; children: React.ReactNode; style?: React.CSSProperties;
}) {
  return (
    <div style={{ ...s.campo, ...style }}>
      <span style={s.campoLabel}>
        {label}
        {requerido && <span style={{ color: '#DC2626' }}>*</span>}
      </span>
      {children}
      {error && <p style={s.error}>{error}</p>}
    </div>
  );
}

function CampoTelefono({ label, error, telefono, onChange }: {
  label: string; error?: string; telefono: TelefonoApoderado; onChange: (t: TelefonoApoderado) => void;
}) {
  return (
    <Campo label={label} error={error}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <input
          type="checkbox"
          checked={telefono.activo}
          onChange={(e) => onChange({ ...telefono, activo: e.target.checked })}
          style={{ flex: '0 0 auto' }}
        />
        <input
          type="tel"
          value={telefono.valor}
          onChange={(e) => onChange({ ...telefono, valor: e.target.value.replace(/\D/g, '') })}
          placeholder={telefono.activo ? 'Número' : 'Activada = emergencia'}
          style={s.input}
        />
      </div>
    </Campo>
  );
}

// ─────────────────────────────────────────────────────────────
// Página
// ─────────────────────────────────────────────────────────────

export default function Matricula({ idEstablecimiento, idFuncionario }: Props) {
  const { temaOscuro } = useTheme();
  const { rol } = useAuth();
  const [form, setForm] = useState<MatriculaDatos>(() => {
    const normalizar = (f: MatriculaDatos): MatriculaDatos => ({
      ...f,
      region: f.region || regionDeComuna(f.comuna),
      apoderado_titular: {
        ...f.apoderado_titular,
        region: f.apoderado_titular.region || regionDeComuna(f.apoderado_titular.comuna),
      },
      apoderado_suplente: {
        ...f.apoderado_suplente,
        region: f.apoderado_suplente.region || regionDeComuna(f.apoderado_suplente.comuna),
      },
    });
    try {
      const b = localStorage.getItem(BORRADOR_KEY);
      if (b) {
        const parsed = JSON.parse(b);
        if (parsed && typeof parsed === 'object' && 'rut' in parsed) {
          return normalizar({ ...formInicial(), ...parsed });
        }
      }
    } catch {
      /* borrador corrupto → iniciar vacío */
    }
    return formInicial();
  });
  const [paso, setPaso] = useState(1);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [focoVinculo, setFocoVinculo] = useState(false);
  const vinculoRef = useRef<HTMLSelectElement | null>(null);
  const [matriculaGuardada, setMatriculaGuardada] = useState<import('../types').Matricula | null>(null);
  const [consentimientoAceptados, setConsentimientoAceptados] = useState<Record<string, boolean>>({});
  const [modalDetalle, setModalDetalle] = useState<ConsentimientoCasillaConfig | null>(null);
  const [guardandoCons, setGuardandoCons] = useState(false);
  const [anulando, setAnulando] = useState(false);

  const edad30Marzo = calcularEdad30Marzo(form.fecha_nacimiento);

  // Autoguardar borrador
  useEffect(() => {
    try {
      localStorage.setItem(BORRADOR_KEY, JSON.stringify(form));
    } catch {
      /* sin almacenamiento */
    }
  }, [form]);

  useEffect(() => {
    if (focoVinculo) {
      vinculoRef.current?.focus();
      setFocoVinculo(false);
    }
  }, [focoVinculo]);

  const setCampo = <K extends keyof MatriculaDatos>(clave: K, valor: MatriculaDatos[K]) => {
    setForm((f) => ({ ...f, [clave]: valor }));
  };

  const esAdmin = rol === 'ADMIN';

  const autocompletarFormulario = () => {
    const telefono = (valor: string): TelefonoApoderado => ({ activo: valor.length > 0, valor });
    setForm({
      ...formInicial(),
      rut: '11.111.111-1',
      nombres: 'María Ignacia',
      apellido_paterno: 'González',
      apellido_materno: 'Fernández',
      direccion: 'Av. Los Carrera 1234',
      region: 'Biobío',
      comuna: 'Concepción',
      nacionalidad: 'Chile',
      fecha_nacimiento: '2010-05-15',
      movil: '912345678',
      fijo: '412345678',
      correo_personal: 'maria.gonzalez@ejemplo.cl',
      correo_institucional: 'matricula@liceoninas.cl',
      nivel: '1',
      curso_repetido: '',
      edad_30_marzo: '',
      procedencia_escolar: 'Colegio San Andrés',
      tipo_apoderado: 'Titular',
      vive_con: { Padre: 1, Madre: 1, Hermana: 1 },
      apoderado_titular: {
        vinculo: 'Madre',
        rut: '16.345.678-8',
        nombres: 'María Loreto',
        apellido_paterno: 'González',
        apellido_materno: 'Soto',
        direccion: 'Av. Los Carrera 1234',
        region: 'Biobío',
        comuna: 'Concepción',
        ocupacion: 'Empleado',
        nivel_educacional: 'Media Completa',
        ingreso_mensual: '900000',
        tel_trabajo: telefono('412345678'),
        tel_casa: telefono('412233445'),
        tel_movil: telefono('987654321'),
        correo: 'maria.loreto.gonzalez@ejemplo.cl',
      },
      apoderado_suplente: {
        vinculo: 'Padre',
        rut: '15.555.555-6',
        nombres: 'Juan Pablo',
        apellido_paterno: 'González',
        apellido_materno: 'Reyes',
        direccion: 'Av. Los Carrera 1234',
        region: 'Biobío',
        comuna: 'Concepción',
        ocupacion: 'Empleado',
        nivel_educacional: 'Media Completa',
        ingreso_mensual: '950000',
        tel_trabajo: telefono('412244556'),
        tel_casa: telefono(''),
        tel_movil: telefono('922334455'),
        correo: 'juan.pablo.gonzalez@ejemplo.cl',
      },
      becas: ['Estudiante Prioritario'],
      beca_etnia: '',
      programa_salud: ['Oftalmología'],
      porcentaje_rsh: '60',
      suf: 'No',
      caracteristicas: [],
      caracteristicas_detalle: {},
      enfermedades: [],
      enfermedades_detalle: {},
      conectividad: [],
      electivos_1_2_medio: [],
      apoyo_hogar: [],
      consentimiento_completo: false,
      consentimiento_fecha: '',
      consentimiento_aceptados: {},
    });
    setErrores({});
    toast.success('Formulario autocompletado con datos de ejemplo');
  };

  const esSuplente = form.tipo_apoderado === 'Suplente';
  const soloNivel12 = form.nivel === '1' || form.nivel === '2';
  const pref = esSuplente ? 'suplente' : 'titular';
  const apoderadoClave = esSuplente ? 'apoderado_suplente' : 'apoderado_titular';
  const apoderado = form[apoderadoClave];
  const titularCompleto = apoderadoCompleto(form.apoderado_titular, false);
  const suplenteCompleto = apoderadoCompleto(form.apoderado_suplente, true);

  const setApod = <K extends keyof ApoderadoDatos>(campo: K, valor: ApoderadoDatos[K]) => {
    setForm((f) => {
      const clave = f.tipo_apoderado === 'Suplente' ? 'apoderado_suplente' : 'apoderado_titular';
      return { ...f, [clave]: { ...f[clave], [campo]: valor } };
    });
  };

  const cambiarRegionEstudiante = (region: string) => {
    setCampo('region', region);
    setCampo('comuna', '');
  };

  const cambiarRegionApoderado = (region: string) => {
    setApod('region', region);
    setApod('comuna', '');
  };

  const cambiarNivel = (valor: string) => {
    setCampo('nivel', valor);
    if (valor !== '1' && valor !== '2') {
      setCampo('electivos_1_2_medio', []);
    }
  };

  const toggleLista = (clave: 'becas' | 'programa_salud' | 'caracteristicas' | 'enfermedades' | 'conectividad' | 'electivos_1_2_medio' | 'apoyo_hogar', valor: string) => {
    setForm((f) => {
      const actual = f[clave];
      const nuevo = actual.includes(valor) ? actual.filter((v) => v !== valor) : [...actual, valor];
      return { ...f, [clave]: nuevo };
    });
  };

  const totalViveCon = useMemo(
    () => Object.values(form.vive_con).reduce((a, b) => a + (b || 0), 0),
    [form.vive_con]
  );

  const incrementarViveCon = (item: ViveConOpcion) => {
    setForm((f) => ({
      ...f,
      vive_con: { ...f.vive_con, [item.valor]: (f.vive_con[item.valor] || 0) + 1 },
    }));
  };

  const toggleViveConSimple = (item: ViveConOpcion) => {
    setForm((f) => ({
      ...f,
      vive_con: {
        ...f.vive_con,
        [item.valor]: f.vive_con[item.valor] ? 0 : 1,
      },
    }));
  };

  const resetItemViveCon = (item: ViveConOpcion) => {
    setForm((f) => ({ ...f, vive_con: { ...f.vive_con, [item.valor]: 0 } }));
  };

  const resetViveCon = () => {
    setForm((f) => ({ ...f, vive_con: {} }));
  };

  const enfocarApoderadoFaltante = (errs: Record<string, string>) => {
    const faltaSuplente = Object.keys(errs).some((k) => k.startsWith('suplente_'));
    const faltaTitular = Object.keys(errs).some((k) => k.startsWith('titular_'));
    if (faltaSuplente && !faltaTitular && form.tipo_apoderado !== 'Suplente') {
      setForm((f) => ({ ...f, tipo_apoderado: 'Suplente' }));
      setFocoVinculo(true);
    } else if (faltaTitular && !faltaSuplente && form.tipo_apoderado !== 'Titular') {
      setForm((f) => ({ ...f, tipo_apoderado: 'Titular' }));
      setFocoVinculo(true);
    }
  };

  const irA = (n: number) => {
    let erroresNuevos: Record<string, string> = {};
    if (n > paso) {
      if (paso === 1) erroresNuevos = validarSeccion1(form);
      else if (paso === 2) {
        erroresNuevos = validarSeccion2(form);
        if (Object.keys(erroresNuevos).length > 0) enfocarApoderadoFaltante(erroresNuevos);
      }
      else if (paso === 3) erroresNuevos = validarSeccion3(form);
    }
    setErrores(erroresNuevos);
    if (Object.keys(erroresNuevos).length > 0) {
      toast.error('Corrige los campos marcados antes de continuar');
      return;
    }
    setPaso(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const buscarPorRut = async () => {
    const rut = form.rut;
    if (!rut.trim()) {
      toast.info('Ingresa un RUT para buscar');
      return;
    }
    if (!validarRUT(rut)) {
      toast.error('El RUT ingresado no es válido');
      return;
    }
    setBuscando(true);
    const encontrado = await buscarEstudiantePorRut(rut, idEstablecimiento);
    setBuscando(false);
    if (!encontrado) {
      toast.info(`RUT ${formatearRUT(rut)} no encontrado en el establecimiento`);
      return;
    }
    const partes = (encontrado.nombre_completo || '').trim().split(/\s+/);
    const apellidoPaterno = partes[0] || '';
    const apellidoMaterno = partes[1] || '';
    const nombres = partes.slice(2).join(' ') || '';
    setForm((f) => ({
      ...f,
      apellido_paterno: apellidoPaterno || f.apellido_paterno,
      apellido_materno: apellidoMaterno || f.apellido_materno,
      nombres: nombres || f.nombres,
      nivel: encontrado.curso || f.nivel,
    }));
    toast.success('Estudiante encontrado. Datos autocompletados');
  };

  const finalizar = async () => {
    const todos = validarTodo(form);
    setErrores(todos);
    if (Object.keys(todos).length > 0) {
      const seccionConError =
        Object.keys(validarSeccion1(form)).length > 0 ? 1 :
        Object.keys(validarSeccion2(form)).length > 0 ? 2 :
        Object.keys(validarSeccion3(form)).length > 0 ? 3 : 4;
      setPaso(seccionConError);
      if (seccionConError === 2) enfocarApoderadoFaltante(todos);
      toast.error('Corrige los campos marcados');
      return;
    }
    setEnviando(true);
    const resultado = await crearMatricula({
      idEstablecimiento,
      idFuncionario,
      datos: { ...form, edad_30_marzo: edad30Marzo },
    });
    setEnviando(false);
    if (!resultado) return;
    try { localStorage.removeItem(BORRADOR_KEY); } catch { /* noop */ }
    toast.success(`Matrícula guardada. Completa los consentimientos de Ley 21.719.`);
    setMatriculaGuardada(resultado);
    setConsentimientoAceptados(resultado.datos?.consentimiento_aceptados || {});
  };

  const guardarConsentimientoHandler = async () => {
    if (!matriculaGuardada) return;
    const faltaObligatoria = CONSENTIMIENTO_CASILLAS.some((c) => c.obligatoria && !consentimientoAceptados[c.id]);
    if (faltaObligatoria) { toast.error('Debes marcar todas las casillas obligatorias'); return; }
    setGuardandoCons(true);
    const datosUpdated = {
      ...matriculaGuardada.datos,
      consentimiento_completo: true,
      consentimiento_fecha: new Date().toISOString(),
      consentimiento_aceptados: consentimientoAceptados,
    };
    const actualizada = await guardarConsentimientos(matriculaGuardada.id, datosUpdated);
    setGuardandoCons(false);
    if (!actualizada) return;
    setMatriculaGuardada(actualizada);
    toast.success('Consentimientos guardados. Imprime los PDF para la firma del apoderado.');
  };

  const anularHandler = async () => {
    if (!matriculaGuardada) return;
    if (!window.confirm('¿Anular esta matrícula? Quedará en estado "anulada" y no podrá recuperarse.')) return;
    setAnulando(true);
    const datosUpdated = {
      ...matriculaGuardada.datos,
      consentimiento_completo: false,
      consentimiento_fecha: new Date().toISOString(),
      consentimiento_aceptados: {},
    };
    const anulada = await anularMatricula(matriculaGuardada.id, datosUpdated);
    setAnulando(false);
    if (!anulada) return;
    setMatriculaGuardada(anulada);
    toast.error('Matrícula anulada.');
  };

  const toggleConsentimiento = (id: string, checked: boolean) => {
    if (id === 'declaracion_conocimiento') {
      const valores: Record<string, boolean> = {};
      CONSENTIMIENTO_CASILLAS.forEach((c) => { valores[c.id] = checked; });
      setConsentimientoAceptados(valores);
      return;
    }
    setConsentimientoAceptados((prev) => ({ ...prev, [id]: checked }));
  };

  const imprimirPlantilla = async (plantilla: 'imagen' | 'datos') => {
    if (!matriculaGuardada) return;
    const pref = matriculaGuardada.datos.tipo_apoderado === 'Suplente' ? 'apoderado_suplente' : 'apoderado_titular';
    const apod = matriculaGuardada.datos[pref] ?? matriculaGuardada.datos.apoderado_titular;
    const nombreApo = [apod.apellido_paterno, apod.apellido_materno, apod.nombres].filter(Boolean).join(' ');
    await abrirPDFConsentimiento({
      plantilla,
      nombreApoderado: nombreApo,
      rutApoderado: apod.rut,
      fecha: new Date().toLocaleDateString('es-CL').split('-').join('/'),
    });
  };

  const nuevaMatricula = () => {
    setMatriculaGuardada(null);
    setConsentimientoAceptados({});
    setForm(formInicial());
    setErrores({});
    setPaso(1);
    try { localStorage.removeItem(BORRADOR_KEY); } catch { /* noop */ }
  };

  const fondo = temaOscuro ? '#111827' : '#FFFFFF';
  const borde = temaOscuro ? '#374151' : '#E5E7EB';
  const ultimaMarcada = !!consentimientoAceptados['declaracion_conocimiento'];

  return (
    <div style={{ ...s.contenedor, color: temaOscuro ? '#F3F4F6' : undefined }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <h1 style={s.titulo}>📋 Matrícula de Nuevos Estudiantes</h1>
        {esAdmin && !matriculaGuardada && (
          <button
            onClick={autocompletarFormulario}
            style={{
              padding: '7px 14px', borderRadius: '8px', border: '1px solid #1A3C6B',
              background: '#EFF6FF', color: '#1A3C6B', fontWeight: 600,
              fontSize: '12px', cursor: 'pointer', marginBottom: '4px',
            }}
          >
            ✨ Autocompletar (solo admin)
          </button>
        )}
      </div>
      {matriculaGuardada ? (
        <div style={{ ...s.tarjeta, background: fondo, borderColor: borde }}>
          <div style={s.tarjetaHdr}>
            <h2 style={s.tarjetaTitulo}>Consentimiento Ley 21.719 — Protección de Datos Personales</h2>
            <span style={{ fontSize: '11px', color: '#6B7280' }}>Completar después de guardar</span>
          </div>

          <p style={{ fontSize: '13px', color: '#374151', marginBottom: '16px', lineHeight: '1.6' }}>
            De acuerdo a la <strong>Ley 21.719 de Protección de Datos Personales</strong>, se requiere el
            consentimiento del apoderado/a para el tratamiento de datos personales y el uso de imágenes
            del estudiante. A continuación, pregunte al apoderado/a y marque las casillas según corresponda:
          </p>

          <p style={{ fontSize: '14px', color: '#1A3C6B', fontWeight: 600, marginBottom: '20px' }}>
            Acepta usted que su hijo/a sea fotografiado/a y se publiquen sus imágenes en redes sociales,
            sitio web u otros fines institucionales, según se detalla:
          </p>

          {CONSENTIMIENTO_CASILLAS.map((casilla) => {
            const marcado = !!consentimientoAceptados[casilla.id];
            return (
              <div key={casilla.id} style={{ marginBottom: '18px' }}>
                <label
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: '10px',
                    padding: '10px 12px', borderRadius: '8px',
                    border: `1px solid ${marcado ? '#1A3C6B' : '#E5E7EB'}`,
                    background: marcado ? '#EFF6FF' : '#FFFFFF',
                    cursor: 'pointer',
                    fontSize: '13px', color: '#374151',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={marcado}
                    onChange={(e) => toggleConsentimiento(casilla.id, e.target.checked)}
                    style={{ flex: '0 0 auto', marginTop: '2px' }}
                  />
                  <span style={{ flex: 1 }}>
                    {casilla.obligatoria && <span style={{ color: '#DC2626', fontWeight: 700 }}>* </span>}
                    {casilla.titulo}
                  </span>
                </label>
                <div style={{ display: 'flex', gap: '12px', marginTop: '4px', paddingLeft: '32px', fontSize: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setModalDetalle(casilla)}
                    style={{ background: 'none', border: 'none', color: '#1A3C6B', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Ver detalle
                  </button>
                </div>
              </div>
            );
          })}

          {ultimaMarcada && (
            <div
              style={{
                marginTop: '20px', padding: '14px 16px', borderRadius: '8px',
                border: `1px solid ${temaOscuro ? '#3B82F6' : '#1A3C6B'}`,
                background: temaOscuro ? 'rgba(59,130,246,0.12)' : '#EFF6FF',
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: 700, color: temaOscuro ? '#93C5FD' : '#1A3C6B', marginBottom: '10px' }}>
                📄 Imprimir documentos para la firma del apoderado/a:
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => imprimirPlantilla('imagen')}
                  style={{ ...s.botonNav, background: '#1A3C6B', color: '#FFFFFF' }}
                >
                  <Printer size={16} /> Autorización Uso de Imagen
                </button>
                <button
                  type="button"
                  onClick={() => imprimirPlantilla('datos')}
                  style={{ ...s.botonNav, background: '#1A3C6B', color: '#FFFFFF' }}
                >
                  <Printer size={16} /> Consentimiento Datos Personales
                </button>
              </div>
            </div>
          )}

          {matriculaGuardada?.estado !== 'anulada' ? (
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button
                type="button"
                onClick={guardarConsentimientoHandler}
                disabled={guardandoCons}
                style={{ ...s.botonNav, background: '#10B981', color: '#FFFFFF', opacity: guardandoCons ? 0.6 : 1 }}
              >
                {guardandoCons ? <Spinner tamaño={16} /> : <Check size={16} />}
                {guardandoCons ? 'Guardando...' : 'Guardar Consentimientos'}
              </button>
              <button
                type="button"
                onClick={anularHandler}
                disabled={anulando}
                style={{ ...s.botonNav, background: '#F3F4F6', color: '#DC2626', border: '1px solid #DC2626' }}
              >
                {anulando ? <Spinner tamaño={16} /> : '✕'} Anular Matrícula
              </button>
            </div>
          ) : (
            <p style={{ fontSize: '14px', color: '#DC2626', fontWeight: 600, margin: '20px 0 0 0' }}>
              Esta matrícula ha sido anulada. No se requiere consentimiento.
            </p>
          )}

          <button
            type="button"
            onClick={nuevaMatricula}
            style={{ ...s.botonNav, background: '#1A3C6B', color: '#FFFFFF', marginTop: '16px', width: '50%', justifyContent: 'center', alignContent:'center' }}
          >
            Nueva Matrícula
          </button>

          {modalDetalle && (
            <div
              onClick={() => setModalDetalle(null)}
              style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 1000, padding: '20px',
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: '#FFFFFF', borderRadius: '12px', padding: '24px',
                  maxWidth: '520px', width: '100%', maxHeight: '80vh',
                  overflowY: 'auto', boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
                }}
              >
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1A3C6B', margin: '0 0 8px 0' }}>
                  {modalDetalle.obligatoria && '* '}{modalDetalle.pdfTitulo}
                </h3>
                <p style={{ fontSize: '13px', color: '#374151', lineHeight: '1.6', marginBottom: '16px' }}>
                  {modalDetalle.detalle}
                </p>
                <button
                  type="button"
                  onClick={() => setModalDetalle(null)}
                  style={{ ...s.botonNav, background: '#1A3C6B', color: '#FFFFFF', width: '100%', justifyContent: 'center' }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
        <p style={s.subtitulo}>Completa los 5 pasos del formulario. El borrador se guarda automáticamente en este dispositivo.</p>

      <div style={s.progreso}>
        {PASOS.map((label, i) => {
          const n = i + 1;
          const activo = n === paso;
          return (
            <button
              key={n}
              type="button"
              onClick={() => irA(n)}
              style={{
                ...s.pasoDot,
                background: activo ? '#1A3C6B' : fondo,
                borderColor: activo ? '#1A3C6B' : borde,
                color: activo ? '#FFFFFF' : temaOscuro ? '#D1D5DB' : '#6B7280',
              }}
            >
              {n === paso ? <span style={{ fontWeight: 800 }}>{n}</span> : <span>{n}</span>}
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      <div style={{ ...s.tarjeta, background: fondo, borderColor: borde }}>
        {/* ── PASO 1 ── */}
        {paso === 1 && (
          <>
            <div style={s.tarjetaHdr}>
              <h2 style={s.tarjetaTitulo}>Datos Personales del Estudiante</h2>
              <span style={{ fontSize: '11px', color: '#6B7280' }}>Paso 1 de 5</span>
            </div>

            <div style={s.fila}>
              <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                <Campo label="RUT" requerido error={errores.rut}>
                  <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                    <input
                      type="text"
                      value={form.rut}
                      placeholder="12.345.678-9"
                      autoComplete="off"
                      onChange={(e) => setCampo('rut', formatearRUT(e.target.value.replace(/[^0-9kK]/g, '')))}
                      style={{ ...s.input, paddingRight: '36px' }}
                    />
                    <button
                      type="button"
                      aria-label="Buscar estudiante por RUT"
                      onClick={buscarPorRut}
                      style={{
                        position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', color: '#1A3C6B', cursor: 'pointer',
                        display: 'flex', padding: '4px',
                      }}
                    >
                      {buscando ? <Spinner tamaño={16} /> : <Search size={16} />}
                    </button>
                  </div>
                </Campo>
              </div>
              <div style={{ flex: '2 1 260px', minWidth: 0 }}>
                <Campo label="Nombres Estudiante" requerido error={errores.nombres}>
                  <input type="text" value={form.nombres} onChange={(e) => setCampo('nombres', e.target.value)} style={s.input} />
                </Campo>
              </div>
              <div style={{ flex: '1 1 160px', minWidth: 0 }}>
                <Campo label="Apellido Paterno" requerido error={errores.apellido_paterno}>
                  <input type="text" value={form.apellido_paterno} onChange={(e) => setCampo('apellido_paterno', e.target.value)} style={s.input} />
                </Campo>
              </div>
              <div style={{ flex: '1 1 160px', minWidth: 0 }}>
                <Campo label="Apellido Materno" requerido error={errores.apellido_materno}>
                  <input type="text" value={form.apellido_materno} onChange={(e) => setCampo('apellido_materno', e.target.value)} style={s.input} />
                </Campo>
              </div>
            </div>

            <div style={s.fila}>
              <div style={{ flex: '3 1 280px', minWidth: 0 }}>
                <Campo label="Dirección" requerido error={errores.direccion}>
                  <input type="text" value={form.direccion} onChange={(e) => setCampo('direccion', e.target.value)} style={s.input} />
                </Campo>
              </div>
              <div style={{ flex: '1 1 150px', minWidth: 0 }}>
                <Campo label="Región">
                  <select value={form.region} onChange={(e) => cambiarRegionEstudiante(e.target.value)} style={s.select}>
                    <option value="">Selecciona</option>
                    {REGIONES_DE_CHILE.map((r) => <option key={r.region} value={r.region}>{r.region}</option>)}
                  </select>
                </Campo>
              </div>
              <div style={{ flex: '1 1 150px', minWidth: 0 }}>
                <Campo label="Comuna" requerido error={errores.comuna}>
                  <select value={form.comuna} onChange={(e) => setCampo('comuna', e.target.value)} style={s.select}>
                    <option value="">Selecciona</option>
                    {comunasDeRegion(form.region).map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Campo>
              </div>
              <div style={{ flex: '1 1 150px', minWidth: 0 }}>
                <Campo label="Nacionalidad">
                  <select value={form.nacionalidad} onChange={(e) => setCampo('nacionalidad', e.target.value)} style={s.select}>
                    <option value="">Selecciona</option>
                    {PAISES_SUDAMERICA.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </Campo>
              </div>
              <div style={{ flex: '0 0 170px', minWidth: 0 }}>
                <Campo label="Fecha de Nacimiento" requerido error={errores.fecha_nacimiento}>
                  <input type="date" value={form.fecha_nacimiento} onChange={(e) => setCampo('fecha_nacimiento', e.target.value)} style={s.input} />
                </Campo>
              </div>
            </div>

            <div style={s.fila}>
              <div style={{ flex: '1 1 150px', minWidth: 0 }}>
                <Campo label="N° de Móvil" error={errores.movil}>
                  <input type="tel" value={form.movil} onChange={(e) => setCampo('movil', e.target.value.replace(/\D/g, ''))} placeholder="912345678" style={s.input} />
                </Campo>
              </div>
              <div style={{ flex: '1 1 150px', minWidth: 0 }}>
                <Campo label="N° Fijo de Teléfono" error={errores.fijo}>
                  <input type="tel" value={form.fijo} onChange={(e) => setCampo('fijo', e.target.value.replace(/\D/g, ''))} style={s.input} />
                </Campo>
              </div>
              <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                <Campo label="Correo Personal" error={errores.correo_personal}>
                  <input type="email" value={form.correo_personal} onChange={(e) => setCampo('correo_personal', e.target.value)} style={s.input} />
                </Campo>
              </div>
              <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                <Campo label="Correo Institucional" error={errores.correo_institucional}>
                  <input type="email" value={form.correo_institucional} onChange={(e) => setCampo('correo_institucional', e.target.value)} style={s.input} />
                </Campo>
              </div>
            </div>

            <div style={s.fila}>
              <div style={{ flex: '1 1 160px', minWidth: 0 }}>
                <Campo label="Nivel" requerido error={errores.nivel}>
                  <select value={form.nivel} onChange={(e) => cambiarNivel(e.target.value)} style={s.input}>
                    <option value="">Selecciona nivel</option>
                    {NIVELES.map((n) => (
                      <option key={n.valor} value={n.valor}>{n.etiqueta}</option>
                    ))}
                  </select>
                </Campo>
              </div>
              <div style={{ flex: '1 1 180px', minWidth: 0 }}>
                <Campo label="Curso que ha Repetido">
                  <select value={form.curso_repetido} onChange={(e) => setCampo('curso_repetido', e.target.value)} style={s.input}>
                    <option value="">Ninguno</option>
                    {CURSOS_REPETIDOS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </Campo>
              </div>
              <div style={{ flex: '1 1 140px', minWidth: 0 }}>
                <Campo label="Edad al 30 de Marzo">
                  <input type="text" value={edad30Marzo} readOnly style={{ ...s.input, background: '#F3F4F6', color: '#6B7280' }} />
                </Campo>
              </div>
              <div style={{ flex: '1 1 180px', minWidth: 0 }}>
                <Campo label="Procedencia Escolar" requerido error={errores.procedencia_escolar}>
                  <input type="text" value={form.procedencia_escolar} onChange={(e) => setCampo('procedencia_escolar', e.target.value)} style={s.input} />
                </Campo>
              </div>
            </div>
          </>
        )}

        {/* ── PASO 2 ── */}
        {paso === 2 && (
          <>
            <div style={s.tarjetaHdr}>
              <h2 style={s.tarjetaTitulo}>Datos Familiares del Estudiante</h2>
              <span style={{ fontSize: '11px', color: '#6B7280' }}>Paso 2 de 5</span>
            </div>

            <div style={s.fila}>
              <div style={{ flex: '1 1 140px', minWidth: 0 }}>
                <Campo label="Apoderado" requerido error={errores.tipo_apoderado}>
                  <select value={form.tipo_apoderado} onChange={(e) => setCampo('tipo_apoderado', e.target.value)} style={s.select}>
                    <option value="">Selecciona</option>
                    <option value="Titular">Titular {titularCompleto ? '✓' : '⚠'}</option>
                    <option value="Suplente">Suplente {suplenteCompleto ? '✓' : '⚠'}</option>
                  </select>
                </Campo>
              </div>
              <div style={{ flex: '1 1 150px', minWidth: 0 }}>
                <Campo label="Vínculo" requerido error={errores[`${esSuplente ? 'suplente' : 'titular'}_vinculo`]}>
                  <select
                    ref={vinculoRef}
                    value={apoderado.vinculo}
                    onChange={(e) => setApod('vinculo', e.target.value)}
                    disabled={!form.tipo_apoderado}
                    style={s.select}
                  >
                    <option value="">Selecciona</option>
                    {VINCULOS.map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </Campo>
              </div>
              <div style={{ flex: '3 1 400px', minWidth: 0 }}>
                <Campo label={`Estudiante vive con`} requerido error={errores.vive_con}>
                  <div style={s.contador}>
                    <span style={{ fontWeight: 800, color: '#1A3C6B' }}>{totalViveCon}</span>
                    <span style={{ fontSize: '12px', color: '#6B7280' }}>personas</span>
                    <button
                      type="button"
                      onClick={resetViveCon}
                      title="Reiniciar contadores"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: '8px',
                        background: 'none', border: 'none', color: '#1A3C6B', cursor: 'pointer',
                        fontSize: '12px', padding: '2px 6px', borderRadius: '4px',
                      }}
                    >
                      <RotateCcw size={12} /> Reiniciar
                    </button>
                  </div>
                  <div style={{ ...s.lista, marginTop: '6px' }}>
                    {VIVE_CON.map((item) => {
                      const n = form.vive_con[item.valor] || 0;
                      const marcado = n > 0;
                      return (
                        <label
                          key={item.valor}
                          onClick={(e) => {
                            e.preventDefault();
                            if (item.contador) incrementarViveCon(item);
                            else toggleViveConSimple(item);
                          }}
                          onDoubleClick={(e) => {
                            e.preventDefault();
                            resetItemViveCon(item);
                          }}
                          title={item.contador ? 'Clic: sumar · Doble clic: quitar' : 'Clic: marcar/desmarcar'}
                          style={{
                            ...s.itemChk,
                            background: marcado ? '#EFF6FF' : '#FFFFFF',
                            borderColor: marcado ? '#1A3C6B' : '#E5E7EB',
                          }}
                        >
                          <input type="checkbox" checked={marcado} readOnly style={{ pointerEvents: 'none' }} />
                          <span>{item.etiqueta}</span>
                          {item.contador && n > 0 && (
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#1A3C6B' }}>(x{n})</span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </Campo>
              </div>
            </div>

            {titularCompleto && suplenteCompleto ? (
              <p style={{ fontSize: '12px', color: '#047857', margin: '0 0 12px 0', fontWeight: 600 }}>
                ✓ Apoderado Titular y Suplente completos.
              </p>
            ) : (
              <p style={{ ...s.error, margin: '0 0 12px 0' }}>
                {!titularCompleto && 'Falta completar: Apoderado/a Titular. '}
                {!suplenteCompleto && 'Falta completar: Apoderado/a Suplente.'}
              </p>
            )}

            {!form.tipo_apoderado ? (
              <p style={{ ...s.subtitulo, fontSize: '13px', margin: '8px 0 0 0' }}>
                Selecciona Apoderado Titular o Suplente para completar sus datos.
              </p>
            ) : (
              <>
                {form.tipo_apoderado === 'Titular' && !suplenteCompleto && (
                  <div style={{
                    background: '#FEF3C7', border: '1px solid #F59E0B', color: '#92400E',
                    borderRadius: '8px', padding: '10px 14px', fontSize: '13px', fontWeight: 600,
                    margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: '8px',
                  }}>
                    <span>⚠</span> Recuerda completar el Apoderado/a Suplente antes de enviar la matrícula.
                  </div>
                )}
                <div style={{
                  ...s.subtitulo,
                  margin: '8px 0 14px 0',
                  fontSize: '16px',
                  fontWeight: 700,
                  color: (esSuplente ? suplenteCompleto : titularCompleto) ? '#374151' : '#DC2626',
                }}>
                  Apoderado/a {esSuplente ? 'Suplente' : 'Titular'}
                  {(esSuplente ? suplenteCompleto : titularCompleto) ? ' ✓' : ' — falta completar'}
                </div>

                <div style={s.fila}>
                  <div style={{ flex: '1 1 170px', minWidth: 0 }}>
                    <Campo label={`RUT Apoderado ${esSuplente ? 'Suplente' : 'Titular'}`} requerido error={errores[`${esSuplente ? 'suplente' : 'titular'}_rut`]}>
                      <input
                        type="text"
                        value={apoderado.rut}
                        placeholder="12.345.678-9"
                        onChange={(e) => setApod('rut', formatearRUT(e.target.value.replace(/[^0-9kK]/g, '')))}
                        style={s.input}
                      />
                    </Campo>
                  </div>
                  <div style={{ flex: '2 1 220px', minWidth: 0 }}>
                    <Campo label={`Nombres ${esSuplente ? 'Suplente' : 'Titular'}`} requerido error={errores[`${esSuplente ? 'suplente' : 'titular'}_nombres`]}>
                      <input type="text" value={apoderado.nombres} onChange={(e) => setApod('nombres', e.target.value)} style={s.input} />
                    </Campo>
                  </div>
                  <div style={{ flex: '2 1 200px', minWidth: 0 }}>
                    <Campo label={`Apellido Paterno ${esSuplente ? 'Suplente' : 'Titular'}`} requerido error={errores[`${esSuplente ? 'suplente' : 'titular'}_apellido_paterno`]}>
                      <input type="text" value={apoderado.apellido_paterno} onChange={(e) => setApod('apellido_paterno', e.target.value)} style={s.input} />
                    </Campo>
                  </div>
                  <div style={{ flex: '2 1 200px', minWidth: 0 }}>
                    <Campo label={`Apellido Materno ${esSuplente ? 'Suplente' : 'Titular'}`} requerido error={errores[`${esSuplente ? 'suplente' : 'titular'}_apellido_materno`]}>
                      <input type="text" value={apoderado.apellido_materno} onChange={(e) => setApod('apellido_materno', e.target.value)} style={s.input} />
                    </Campo>
                  </div>
                </div>

                <div style={s.fila}>
                  <div style={{ flex: '4 1 300px', minWidth: 0 }}>
                    <Campo label={`Dirección ${esSuplente ? 'Suplente' : 'Titular'}`} requerido error={errores[`${esSuplente ? 'suplente' : 'titular'}_direccion`]}>
                      <input type="text" value={apoderado.direccion} onChange={(e) => setApod('direccion', e.target.value)} style={s.input} />
                    </Campo>
                  </div>
                  <div style={{ flex: '1 1 140px', minWidth: 0 }}>
                    <Campo label="Región">
                      <select value={apoderado.region} onChange={(e) => cambiarRegionApoderado(e.target.value)} style={s.select}>
                        <option value="">Selecciona</option>
                        {REGIONES_DE_CHILE.map((r) => <option key={r.region} value={r.region}>{r.region}</option>)}
                      </select>
                    </Campo>
                  </div>
                  <div style={{ flex: '1 1 140px', minWidth: 0 }}>
                    <Campo label="Comuna" requerido error={errores[`${esSuplente ? 'suplente' : 'titular'}_comuna`]}>
                      <select value={apoderado.comuna} onChange={(e) => setApod('comuna', e.target.value)} style={s.select}>
                        <option value="">Selecciona</option>
                        {comunasDeRegion(apoderado.region).map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </Campo>
                  </div>
                  {!esSuplente && (
                    <div style={{ flex: '1 1 160px', minWidth: 0 }}>
                      <Campo label="Ocupación" requerido error={errores.titular_ocupacion}>
                        <select value={apoderado.ocupacion} onChange={(e) => setApod('ocupacion', e.target.value)} style={s.select}>
                          <option value="">Selecciona</option>
                          {OCUPACIONES.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </Campo>
                    </div>
                  )}
                </div>

                <div style={s.fila}>
                  {!esSuplente && (
                    <>
                      <div style={{ flex: '1 1 260px', minWidth: 0 }}>
                        <Campo label="Nivel Educacional Enseñanza" requerido error={errores.titular_nivel_educacional}>
                          <select value={apoderado.nivel_educacional} onChange={(e) => setApod('nivel_educacional', e.target.value)} style={s.select}>
                            <option value="">Selecciona</option>
                            {NIVELES_EDUCACIONALES.map((n) => <option key={n} value={n}>{n}</option>)}
                          </select>
                        </Campo>
                      </div>
                      <div style={{ flex: '1 1 180px', minWidth: 0 }}>
                        <Campo label="Ingreso Mensual Promedio">
                          <input type="text" inputMode="numeric" value={apoderado.ingreso_mensual} onChange={(e) => setApod('ingreso_mensual', e.target.value.replace(/[^0-9.]/g, ''))} style={s.input} />
                        </Campo>
                      </div>
                    </>
                  )}
                  <div style={{ flex: '1 1 180px', minWidth: 0 }}>
                    <CampoTelefono label="Teléfono Trabajo" error={errores[`${pref}_tel_0`]} telefono={apoderado.tel_trabajo} onChange={(t) => setApod('tel_trabajo', t)} />
                  </div>
                  {esSuplente && (
                    <>
                      <div style={{ flex: '1 1 180px', minWidth: 0 }}>
                        <CampoTelefono label="Teléfono Fijo de Casa" error={errores[`${pref}_tel_1`]} telefono={apoderado.tel_casa} onChange={(t) => setApod('tel_casa', t)} />
                      </div>
                      <div style={{ flex: '1 1 180px', minWidth: 0 }}>
                        <CampoTelefono label="Teléfono Móvil" error={errores[`${pref}_tel_2`]} telefono={apoderado.tel_movil} onChange={(t) => setApod('tel_movil', t)} />
                      </div>
                    </>
                  )}
                </div>

                {esSuplente ? (
                  <div style={s.fila}>
                    <div style={{ flex: '0 1 320px', minWidth: 0 }}>
                      <Campo label="Correo Electrónico" error={errores[`${pref}_correo`]}>
                        <input type="email" value={apoderado.correo} onChange={(e) => setApod('correo', e.target.value)} style={s.input} />
                      </Campo>
                    </div>
                  </div>
                ) : (
                  <div style={s.fila}>
                    <div style={{ flex: '1 1 180px', minWidth: 0 }}>
                      <CampoTelefono label="Teléfono Fijo de Casa" error={errores[`${pref}_tel_1`]} telefono={apoderado.tel_casa} onChange={(t) => setApod('tel_casa', t)} />
                    </div>
                    <div style={{ flex: '1 1 180px', minWidth: 0 }}>
                      <CampoTelefono label="Teléfono Móvil" error={errores[`${pref}_tel_2`]} telefono={apoderado.tel_movil} onChange={(t) => setApod('tel_movil', t)} />
                    </div>
                    <div style={{ flex: '1 1 240px', minWidth: 0 }}>
                      <Campo label="Correo Electrónico" error={errores[`${pref}_correo`]}>
                        <input type="email" value={apoderado.correo} onChange={(e) => setApod('correo', e.target.value)} style={s.input} />
                      </Campo>
                    </div>
                  </div>
                )}

                {errores[`${esSuplente ? 'suplente' : 'titular'}_telefonos`] && (
                  <p style={{ ...s.error, marginTop: '4px' }}>{errores[`${esSuplente ? 'suplente' : 'titular'}_telefonos`]}</p>
                )}

                <p style={{ ...s.subtitulo, fontSize: '12px', margin: '6px 0 0 0' }}>
                  La casilla activa es para avisar al teléfono de emergencia.
                </p>
              </>
            )}
          </>
        )}

        {/* ── PASO 3 ── */}
        {paso === 3 && (
          <>
            <div style={s.tarjetaHdr}>
              <h2 style={s.tarjetaTitulo}>Datos Sociales del Estudiante</h2>
              <span style={{ fontSize: '11px', color: '#6B7280' }}>Paso 3 de 5</span>
            </div>

            <div style={s.fila}>
              <div style={{ flex: '1 1 380px', minWidth: 0 }}>
                <Campo label="Becas y Beneficios" requerido error={errores.becas}>
                  <div style={s.lista}>
                    {BECAS.map((opc) => (
                      <label key={opc.valor} style={s.itemChk}>
                        <input
                          type="checkbox"
                          checked={form.becas.includes(opc.valor)}
                          onChange={() => toggleLista('becas', opc.valor)}
                        />
                        <span style={{ whiteSpace: 'nowrap' }}>{opc.etiqueta}</span>
                        {opc.detalle && (
                          <input
                            type="text"
                            value={form.beca_etnia}
                            onChange={(e) => setCampo('beca_etnia', e.target.value)}
                            placeholder="valor"
                            style={{ ...s.input, width: '140px', padding: '3px 6px', fontSize: '12px', marginLeft: 'auto' }}
                          />
                        )}
                      </label>
                    ))}
                  </div>
                </Campo>
              </div>
            </div>

            <div style={s.fila}>
              <div style={{ flex: '1 1 380px', minWidth: 0 }}>
                <Campo label="Programa de Salud (JUNAEB)" requerido error={errores.programa_salud}>
                  <div style={s.lista}>
                    {PROGRAMA_SALUD.map((opc) => (
                      <label key={opc.valor} style={s.itemChk}>
                        <input
                          type="checkbox"
                          checked={form.programa_salud.includes(opc.valor)}
                          onChange={() => toggleLista('programa_salud', opc.valor)}
                        />
                        <span>{opc.etiqueta}</span>
                      </label>
                    ))}
                  </div>
                </Campo>
              </div>
            </div>

            <div style={s.fila}>
              <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                <Campo label="% Registro Social de Hogares">
                  <select value={form.porcentaje_rsh} onChange={(e) => setCampo('porcentaje_rsh', e.target.value)} style={s.select}>
                    <option value="">Selecciona</option>
                    <option value="40">40%</option>
                    <option value="50">50%</option>
                    <option value="60">60%</option>
                    <option value="70">70%</option>
                    <option value="80">80%</option>
                    <option value="90">90%</option>
                  </select>
                </Campo>
              </div>
              <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                <Campo label="Subsidio Único Familiar (SUF)">
                  <input type="text" value={form.suf} onChange={(e) => setCampo('suf', e.target.value)} style={s.input} />
                </Campo>
              </div>
            </div>
          </>
        )}

        {/* ── PASO 4 ── */}
        {paso === 4 && (
          <>
            <div style={s.tarjetaHdr}>
              <h2 style={s.tarjetaTitulo}>Datos de Salud del Estudiante</h2>
              <span style={{ fontSize: '11px', color: '#6B7280' }}>Paso 4 de 5</span>
            </div>

            <div style={s.fila}>
              <div style={{ flex: '1 1 420px', minWidth: 0 }}>
                <Campo label="Características del Estudiante">
                  <div style={s.lista}>
                    {CARACTERISTICAS.map((opc) => {
                      const marcado = form.caracteristicas.includes(opc.valor);
                      return (
                        <label key={opc.valor} style={s.itemChk}>
                          <input
                            type="checkbox"
                            checked={marcado}
                            onChange={() => toggleLista('caracteristicas', opc.valor)}
                          />
                          <span>{opc.etiqueta}</span>
                          {opc.detalle && marcado && (
                            <input
                              type="text"
                              value={form.caracteristicas_detalle[opc.valor] || ''}
                              onChange={(e) =>
                                setCampo('caracteristicas_detalle', {
                                  ...form.caracteristicas_detalle,
                                  [opc.valor]: e.target.value,
                                })
                              }
                              placeholder="valor"
                              style={{ ...s.input, width: '90px', padding: '3px 6px', fontSize: '12px' }}
                            />
                          )}
                          {opc.valor === 'Estatura, Altura' && <span style={{ fontSize: '11px', color: '#6B7280' }}>cm</span>}
                        </label>
                      );
                    })}
                  </div>
                </Campo>
              </div>
            </div>

            <div style={s.fila}>
              <div style={{ flex: '1 1 420px', minWidth: 0 }}>
                <Campo label="Enfermedades Crónicas">
                  <div style={s.lista}>
                    {ENFERMEDADES.map((opc) => {
                      const marcado = form.enfermedades.includes(opc.valor);
                      return (
                        <label key={opc.valor} style={s.itemChk}>
                          <input
                            type="checkbox"
                            checked={marcado}
                            onChange={() => toggleLista('enfermedades', opc.valor)}
                          />
                          <span>{opc.etiqueta}</span>
                          {opc.detalle && marcado && (
                            <input
                              type="text"
                              value={form.enfermedades_detalle[opc.valor] || ''}
                              onChange={(e) =>
                                setCampo('enfermedades_detalle', {
                                  ...form.enfermedades_detalle,
                                  [opc.valor]: e.target.value,
                                })
                              }
                              placeholder="valor"
                              style={{ ...s.input, width: '90px', padding: '3px 6px', fontSize: '12px' }}
                            />
                          )}
                        </label>
                      );
                    })}
                  </div>
                </Campo>
              </div>
            </div>
          </>
        )}

        {/* ── PASO 5 ── */}
        {paso === 5 && (
          <>
            <div style={s.tarjetaHdr}>
              <h2 style={s.tarjetaTitulo}>Conectividad y Datos Académicos</h2>
              <span style={{ fontSize: '11px', color: '#6B7280' }}>Paso 5 de 5</span>
            </div>

            <div style={s.fila}>
              <div style={{ flex: '1 1 420px', minWidth: 0 }}>
                <Campo label="Conectividad">
                  <div style={s.lista}>
                    {CONECTIVIDAD.map((opc) => (
                      <label key={opc.valor} style={s.itemChk}>
                        <input
                          type="checkbox"
                          checked={form.conectividad.includes(opc.valor)}
                          onChange={() => toggleLista('conectividad', opc.valor)}
                        />
                        <span>{opc.etiqueta}</span>
                      </label>
                    ))}
                  </div>
                </Campo>
              </div>
            </div>

            <div style={{ ...s.subtitulo, margin: '8px 0 14px 0', fontSize: '14px', fontWeight: 700, color: '#374151' }}>
              Solo Estudiantes de 1° y 2° Medio
            </div>

            <div style={s.fila}>
              <div style={{ flex: '1 1 420px', minWidth: 0 }}>
                <Campo label="Electivos">
                  <div style={{ ...s.lista, opacity: soloNivel12 ? 1 : 0.55 }}>
                    {ELECTIVOS.map((opc) => (
                      <label
                        key={opc.valor}
                        style={{ ...s.itemChk, ...(soloNivel12 ? {} : { cursor: 'not-allowed', background: '#F3F4F6' }) }}
                        onClick={() => {
                          if (!soloNivel12) {
                            toast.warning('Esta sección solo se habilita para estudiantes de 1° o 2° Medio.');
                          }
                        }}
                      >
                        <input
                          type="checkbox"
                          disabled={!soloNivel12}
                          checked={form.electivos_1_2_medio.includes(opc.valor)}
                          onChange={() => toggleLista('electivos_1_2_medio', opc.valor)}
                        />
                        <span>{opc.etiqueta}</span>
                      </label>
                    ))}
                  </div>
                </Campo>
              </div>
            </div>

            <div style={s.fila}>
              <div style={{ flex: '1 1 420px', minWidth: 0 }}>
                <Campo label="Apoyo en el Hogar">
                  <div style={s.lista}>
                    {APOYO_HOGAR.map((opc) => (
                      <label key={opc.valor} style={s.itemChk}>
                        <input
                          type="checkbox"
                          checked={form.apoyo_hogar.includes(opc.valor)}
                          onChange={() => toggleLista('apoyo_hogar', opc.valor)}
                        />
                        <span>{opc.etiqueta}</span>
                      </label>
                    ))}
                  </div>
                </Campo>
              </div>
            </div>
          </>
        )}

        <div style={s.nav}>
          <button
            type="button"
            onClick={() => irA(Math.max(1, paso - 1))}
            disabled={paso === 1}
            style={{ ...s.botonNav, background: '#F3F4F6', color: '#374151', opacity: paso === 1 ? 0.5 : 1, cursor: paso === 1 ? 'not-allowed' : 'pointer' }}
          >
            <ChevronLeft size={16} /> Anterior
          </button>

          {paso < 5 ? (
            <button
              type="button"
              onClick={() => irA(paso + 1)}
              style={{ ...s.botonNav, background: '#1A3C6B', color: '#FFFFFF' }}
            >
              Siguiente <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={finalizar}
              disabled={enviando}
              style={{ ...s.botonNav, background: '#10B981', color: '#FFFFFF', opacity: enviando ? 0.6 : 1, cursor: enviando ? 'not-allowed' : 'pointer' }}
            >
              {enviando ? <Spinner tamaño={16} /> : <Send size={16} />}
              {enviando ? 'Guardando...' : 'Finalizar y Guardar'}
            </button>
          )}
        </div>
      </div>

      <p style={{ ...s.subtitulo, textAlign: 'center', marginTop: '16px' }}>
        <Check size={12} /> Borrador guardado automáticamente. Todos los campos marcados con * son obligatorios.
      </p>
      </>)}
    </div>
  );
}
