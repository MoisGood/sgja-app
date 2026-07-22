// src/pages/RegistrarAccidente.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { buscarEstudiantes, guardarAccidente, precargarEstudiantes } from '../services/accidentes.service';
import { obtenerEstablecimiento } from '../services/establecimientos.service';
import type { Estudiante, Establecimiento } from '../types';
import { Save, Search, FileText } from 'lucide-react';
import VistaPreviaPDF from '../components/VistaPreviaPDF';
import { generarPDF, pdfToBlobUrl, generarPDFDebug, type DatosPDF } from '../services/pdf.service';

interface Props { idEstablecimiento: string; }

const RegistroAccidente = ({ idEstablecimiento }: Props) => {
  const { uid } = useAuth();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const iframeLoaded = useRef(false);
  const [busqueda, setBusqueda] = useState('');
  const [sugerencias, setSugerencias] = useState<Estudiante[]>([]);
  const [mostrarSug, setMostrarSug] = useState(false);
  const [estudianteSel, setEstudianteSel] = useState<Estudiante | null>(null);
  const [establecimiento, setEstablecimiento] = useState<Pick<Establecimiento, 'nombre'> | null>(null);
  const [cargandoBusq, setCargandoBusq] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [exito, setExito] = useState('');
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

  const handleGuardar = async () => {
    if (!estudianteSel) { setError('Seleccione un estudiante'); return; }
    setGuardando(true); setError('');

    // Obtener datos del formulario en el iframe
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentDocument) { setError('Error al acceder al formulario'); setGuardando(false); return; }

    const doc = iframe.contentDocument;
    const form = doc?.querySelector('form');
    if (!form) { setError('Error al leer el formulario'); setGuardando(false); return; }

    const formData = new FormData(form);
    const datos: Record<string, string> = {};
    formData.forEach((val, key) => { datos[key] = val.toString(); });

    try {
      await guardarAccidente({
        id_establecimiento: idEstablecimiento,
        id_estudiante: estudianteSel.id_estudiante,
        id_funcionario: uid || '',
        fecha_accidente: datos['campo_6'] || datos['campo_20'] || new Date().toISOString().split('T')[0],
        hora_accidente: datos['campo_19'] || '',
        lugar_accidente: '',
        descripcion_accidente: datos['area_1'] || '',
        naturaleza_accidente: '',
        consecuencia_accidente: '',
        parte_cuerpo_afectada: '',
        tipo_lesion: '',
        primeros_auxilios: '',
        testigos: '',
        activo: true,
      });
      setExito('Guardado correctamente');
      setTimeout(() => setExito(''), 3000);
    } catch {
      setError('Error al guardar');
    }
    finally { setGuardando(false); }
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

      const esTrayecto = getVal('chk_15') === 'true' || getVal('chk_15') === 'on';
      const esEscuela = getVal('chk_16') === 'true' || getVal('chk_16') === 'on';

      // Día de la semana: primero checkbox, luego calculado desde fecha
      const diasMap: Record<string, string> = {
        chk_8: '1', chk_9: '2', chk_10: '3', chk_11: '4',
        chk_12: '5', chk_13: '6', chk_14: '7',
      };
      let diaSemana = '';
      for (const [chk, val] of Object.entries(diasMap)) {
        if (getVal(chk) === 'true' || getVal(chk) === 'on') { diaSemana = val; break; }
      }
      if (!diaSemana) {
        const fechaAcc = getVal('fecha_7') || '';
        if (fechaAcc) {
          const d = new Date(fechaAcc + 'T12:00:00');
          diaSemana = String(d.getDay() === 0 ? 7 : d.getDay());
        }
      }

      const datos: DatosPDF = {
        // Sección A
        nombreEstablecimiento: establecimiento?.nombre || getVal('nombre_establecimiento') || '',
        ciudad: getVal('ciudad') || '',
        comuna: getVal('comuna') || '',
        tipoEstablecimiento: getVal('chk_2') ? '1' : getVal('chk_3') ? '2' : '',
        curso: estudianteSel.curso || getVal('curso') || '',
        horario: getVal('horario') || '',
        fechaRegistroDia: new Date().getDate().toString(),
        fechaRegistroMes: String(new Date().getMonth() + 1),
        fechaRegistroAno: new Date().getFullYear().toString(),

        // Sección B
        apellidoPaterno: getVal('apellido_paterno') || '',
        apellidoMaterno: getVal('apellido_materno') || '',
        nombres: getVal('nombres') || '',
        sexo: getVal('chk_4') ? '2' : getVal('chk_5') ? '1' : '',
        anoNacimiento: getVal('ano_de_nacimiento') || '',
        edad: getVal('edad') || '',
        calle: getVal('calle') || '',
        numero: getVal('numero') || '',
        poblacion: getVal('poblacion') || '',
        comunaResidencia: getVal('comuna_residencia') || '',
        ciudadResidencia: getVal('ciudad_residencia') || '',
        codifCom: getVal('codif_com') || '',

        // Sección C
        hora: getVal('hora_6')?.split(':')[0] || '',
        minutos: getVal('hora_6')?.split(':')[1] || '',
        fechaAccidenteAno: (getVal('fecha_7') || '').split('-')[0] || '',
        fechaAccidenteMes: (getVal('fecha_7') || '').split('-')[1] || '',
        fechaAccidenteDia: (getVal('fecha_7') || '').split('-')[2] || '',
        diaSemana,
        accidenteTipo: esTrayecto ? '1' : esEscuela ? '2' : '',
        testigo1Nombre: getVal('nombre__apellido') || '',
        testigo1Cedula: getVal('cedula_de_identidad') || '',
        testigo2Nombre: '',
        testigo2Cedula: '',
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

  // Escuchar "Finalizar" desde el iframe → generar PDF
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.action === 'generar-pdf') {
        handleVistaPrevia();
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [estudianteSel, establecimiento]);

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

        <button onClick={handleGuardar} disabled={guardando}
          style={{
            padding: '8px 20px', background: '#1A3C6B', color: '#fff', border: 'none',
            borderRadius: '6px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap'
          }}>
          <Save size={14} /> {guardando ? 'Guardando...' : 'Guardar'}
        </button>

        {exito && <span style={{ color: '#065F46', fontSize: 12, fontWeight: 500 }}>✅ {exito}</span>}
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
