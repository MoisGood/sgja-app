// src/pages/RegistrarAccidente.tsx
import { useState, useEffect, useRef, useCallback } from 'react';

import { buscarEstudiantes, precargarEstudiantes } from '../services/accidentes.service';
import { obtenerEstablecimiento } from '../services/establecimientos.service';
import type { Estudiante, Establecimiento } from '../types';
import { Search, FileText, Trash2 } from 'lucide-react';
import VistaPreviaPDF from '../components/VistaPreviaPDF';
import { generarPDF, pdfToBlobUrl, generarPDFDebug, type DatosPDF } from '../services/pdf.service';

interface Props { idEstablecimiento: string; }

const RegistroAccidente = ({ idEstablecimiento }: Props) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const iframeLoaded = useRef(false);
  const [busqueda, setBusqueda] = useState('');
  const [sugerencias, setSugerencias] = useState<Estudiante[]>([]);
  const [mostrarSug, setMostrarSug] = useState(false);
  const [estudianteSel, setEstudianteSel] = useState<Estudiante | null>(null);
  const [establecimiento, setEstablecimiento] = useState<Pick<Establecimiento, 'nombre'> | null>(null);
  const [cargandoBusq, setCargandoBusq] = useState(false);
  const [error, setError] = useState('');
  const [mostrarPreview, setMostrarPreview] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => { precargarEstudiantes(); }, []);

  // Cargar datos del establecimiento (nombre, ciudad, comuna)
  useEffect(() => {
    if (!idEstablecimiento) return;
    obtenerEstablecimiento(idEstablecimiento)
      .then(data => {
        if (data) setEstablecimiento({ nombre: data.nombre });
      })
      .catch(() => {});
  }, [idEstablecimiento]);

  // ── Autocompletar campos del formulario en el iframe ──
  const autocompleteForm = useCallback((est: Estudiante) => {
    const iframe = iframeRef.current;
    if (!iframe?.contentDocument) return;
    const doc = iframe.contentDocument;

    const setVal = (name: string, val: string) => {
      const el = doc.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${name}"]`);
      if (el) el.value = val || '';
    };

    // Dividir nombre_completo: "ApellidoP ApellidoM Nombre1 Nombre2..."
    const partes = est.nombre_completo.trim().split(/\s+/);
    const apellidoPaterno = partes[0] || '';
    const apellidoMaterno = partes[1] || '';
    const nombres = partes.slice(2).join(' ') || partes[0] || '';

    // Sección 1 — Datos del establecimiento
    setVal('nombre_establecimiento', establecimiento?.nombre || '');
    setVal('curso', est.curso || '');

    // Sección 2 — Individualización del accidentado
    setVal('apellido_paterno', apellidoPaterno);
    setVal('apellido_materno', apellidoMaterno);
    setVal('nombres', nombres);
  }, [establecimiento]);

  const handleIframeLoad = useCallback(() => {
    iframeLoaded.current = true;
    if (estudianteSel) {
      autocompleteForm(estudianteSel);
    }
  }, [estudianteSel, autocompleteForm]);

  useEffect(() => {
    if (busqueda.length < 2) { setSugerencias([]); return; }
    const timer = setTimeout(async () => {
      setCargandoBusq(true);
      const res = await buscarEstudiantes(busqueda);
      setSugerencias(res);
      setCargandoBusq(false);
      setMostrarSug(res.length > 0);
    }, 300);
    return () => clearTimeout(timer);
  }, [busqueda]);

  const selEst = (e: Estudiante) => {
    setEstudianteSel(e);
    setBusqueda(`${e.nombre_completo} (${e.rut || ''})`);
    setMostrarSug(false);
    // Autocompletar el formulario si el iframe ya cargó
    if (iframeLoaded.current) {
      autocompleteForm(e);
    }
  };

  const handleVistaPrevia = async () => {
    if (!estudianteSel) { setError('Seleccione un estudiante primero'); return; }
    setError('');

    try {
      const iframe = iframeRef.current;
      const doc = iframe?.contentDocument;
      const form = doc?.querySelector('form');
      const fd = form ? new FormData(form) : new FormData();
      const getVal = (name: string) => fd.get(name)?.toString() || '';

      const esTrayecto = getVal('tipo_accidente') === 'TRAYECTO';
      const esEscuela = getVal('tipo_accidente') === 'ESCUELA';

      const datos: DatosPDF = {
        // Sección A
        nombreEstablecimiento: establecimiento?.nombre || getVal('nombre_establecimiento') || '',
        ciudad: getVal('ciudad') || '',
        comuna: getVal('comuna') || '',
        tipoEstablecimiento: getVal('tipo_establecimiento') === 'MUNICIPAL' ? '1' : getVal('tipo_establecimiento') === 'PARTICULAR' ? '2' : '',
        curso: estudianteSel.curso || getVal('curso') || '',
        horario: getVal('horario') || '',
        fechaRegistroDia: new Date().getDate().toString(),
        fechaRegistroMes: String(new Date().getMonth() + 1),
        fechaRegistroAno: new Date().getFullYear().toString(),

        // Sección B
        apellidoPaterno: getVal('apellido_paterno') || '',
        apellidoMaterno: getVal('apellido_materno') || '',
        nombres: getVal('nombres') || '',
        sexo: getVal('sexo') === 'M' ? '1' : getVal('sexo') === 'F' ? '2' : '',
        anoNacimiento: getVal('ano_nacimiento') || '',
        edad: getVal('edad') || '',
        calle: getVal('calle') || '',
        numero: getVal('numero') || '',
        poblacion: getVal('poblacion') || '',
        comunaResidencia: getVal('comuna_residencia') || '',
        ciudadResidencia: getVal('ciudad_residencia') || '',
        codifCom: getVal('codif_com') || '',

        // Sección C
        hora: getVal('hora')?.split(':')[0] || '',
        minutos: getVal('hora')?.split(':')[1] || '',
        fechaAccidenteAno: (getVal('fecha_accidente') || '').split('-')[0] || '',
        fechaAccidenteMes: (getVal('fecha_accidente') || '').split('-')[1] || '',
        fechaAccidenteDia: (getVal('fecha_accidente') || '').split('-')[2] || '',
        diaSemana: getVal('dia_semana') || '',
        accidenteTipo: esTrayecto ? '1' : esEscuela ? '2' : '',
        testigo1Nombre: getVal('testigo_nombre') || '',
        testigo1Cedula: getVal('testigo_rut') || '',
        testigo2Nombre: getVal('testigo_nombre_2') || '',
        testigo2Cedula: getVal('testigo_rut_2') || '',
        circunstancia: getVal('descripcion') || '',
      };

      const pdfBytes = await generarPDF(datos);
      const url = pdfToBlobUrl(pdfBytes);
      setPdfUrl(url);
      setMostrarPreview(true);
    } catch (e) {
      console.error(e);
      setError('Error al generar el PDF');
    }
  };

  const handleDebugCoords = async () => {
    try {
      const pdfBytes = await generarPDFDebug();
      const url = pdfToBlobUrl(pdfBytes);
      setPdfUrl(url);
      setMostrarPreview(true);
    } catch {
      setError('Error al generar debug');
    }
  };


  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)' }}>
      {/* Barra superior */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px',
        background: '#fff', borderBottom: '1px solid #E5E7EB', flexShrink: 0
      }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={16} style={{ position: 'absolute', left: 8, color: '#9CA3AF' }} />
            <input
              type="text" value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar estudiante por nombre o rut..."
              style={{ width: '100%', padding: '8px 12px 8px 30px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '12px', outline: 'none' }}
            />
          </div>
          {mostrarSug && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff',
              border: '1px solid #E5E7EB', borderRadius: '0 0 6px 6px', zIndex: 1000,
              maxHeight: 200, overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              {cargandoBusq ? (
                <div style={{ padding: 12, textAlign: 'center', color: '#9CA3AF', fontSize: 12 }}>Buscando...</div>
              ) : (
                sugerencias.map(est => (
                  <div key={est.id_estudiante} onClick={() => selEst(est)}
                    style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 12, borderBottom: '1px solid #F3F4F6' }}>
                    {est.nombre_completo} <span style={{ color: '#9CA3AF' }}>{est.rut}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {estudianteSel && (
          <div style={{ fontSize: 12, color: '#374151', whiteSpace: 'nowrap' }}>
            ✅ {estudianteSel.nombre_completo}
          </div>
        )}

        <button onClick={handleVistaPrevia} disabled={!estudianteSel}
          style={{
            padding: '8px 14px', background: '#FFF', color: '#1A3C6B', border: '1px solid #1A3C6B',
            borderRadius: '6px', fontSize: 12, fontWeight: 600, cursor: estudianteSel ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', opacity: estudianteSel ? 1 : 0.5
          }}>
          <FileText size={14} /> PDF
        </button>
        <span onClick={handleDebugCoords}
          style={{ fontSize: 10, color: '#9CA3AF', cursor: 'pointer', userSelect: 'none' }}
          title="Mostrar coordenadas de campos en el PDF">
          🎯
        </span>

        <button onClick={() => {
          const iframe = iframeRef.current;
          if (!iframe?.contentDocument) return;
          const form = iframe.contentDocument.querySelector('form');
          if (!form) return;
          form.reset();
          try { sessionStorage.removeItem('agil_form'); } catch(e) {}
        }}
          style={{
            padding: '8px 20px', background: '#FFF', color: '#DC2626', border: '1px solid #DC2626',
            borderRadius: '6px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap'
          }}>
          <Trash2 size={14} /> Limpiar
        </button>

        {error && <span style={{ color: '#DC2626', fontSize: 12, fontWeight: 500 }}>{error}</span>}
      </div>

      {/* Iframe con el formulario */}
      <iframe
        ref={iframeRef}
        src="/formulario.html"
        onLoad={handleIframeLoad}
        style={{ width: '100%', flex: 1, border: 'none' }}
        title="Formulario de Accidente Escolar"
      />

      {mostrarPreview && pdfUrl && (
        <VistaPreviaPDF pdfUrl={pdfUrl} cerrar={() => {
          setMostrarPreview(false);
          URL.revokeObjectURL(pdfUrl);
          setPdfUrl(null);
        }} />
      )}
    </div>
  );
};

export default RegistroAccidente;
