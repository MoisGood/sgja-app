import { useState, useEffect, useMemo } from 'react';
import { obtenerPrestamosActivos, prestarLibro, devolverLibro, renovarPrestamo, buscarLibros, obtenerLibroConCopias, buscarEstudiantes, obtenerReglas, calcularFechaVencimiento, obtenerHistorialPrestamos, obtenerFestivos, obtenerCantidadCopias } from '../services/library';
import { obtenerJustificaciones } from '../services/database';
import { enviarCorreo, generarHtmlNotificacion } from '../services/emailService';
import { logCorreo } from '../services/monitoreoService';
import { supabase } from '../lib/supabase';
import Modal from '../components/Common/Modal';
import Button from '../components/Common/Button';
import type { BookCopy } from '../types';

interface Props { idEstablecimiento: string; usuarioId: string }

export default function Circulacion({ idEstablecimiento, usuarioId }: Props) {
  console.log('CIRCULACION_MOUNTED_2026');
  const [prestamos, setPrestamos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [diasPrestamo, setDiasPrestamo] = useState(7);

  // Book search
  const [busqLibro, setBusqLibro] = useState('');
  const [resultLibros, setResultLibros] = useState<any[]>([]);
  const [libroSel, setLibroSel] = useState<any>(null);
  const [copiasLibro, setCopiasLibro] = useState<BookCopy[]>([]);
  const [disponibles, setDisponibles] = useState(0);

  // Book list modal
  const [abrirListaLibros, setAbrirListaLibros] = useState(false);
  const [todosLibros, setTodosLibros] = useState<any[]>([]);
  const [pagLibros, setPagLibros] = useState(1);
  const porPag = 10;
  const totalPagLib = Math.ceil(todosLibros.length / porPag);
  const librosPag = todosLibros.slice((pagLibros - 1) * porPag, pagLibros * porPag);

  // Student search
  const [busqEst, setBusqEst] = useState('');
  const [resultEst, setResultEst] = useState<any[]>([]);
  const [studentSel, setStudentSel] = useState<any>(null);
  const [historialEst, setHistorialEst] = useState<any[]>([]);
  const [prestamosActivosEst, setPrestamosActivosEst] = useState<any[]>([]);
  const [tieneVencido, setTieneVencido] = useState(false);

  // Loan days
  const [diasSel, setDiasSel] = useState(0);
  const [maxSimultaneos, setMaxSimultaneos] = useState(3);
  const [justificaciones, setJustificaciones] = useState<any[]>([]);
  const [maxRenovaciones, setMaxRenovaciones] = useState(2);
  const [fechaInput, setFechaInput] = useState('');

  const [modalFechaError, setModalFechaError] = useState('');
  const [modalLimite, setModalLimite] = useState(false);
  const [modalConfirmar, setModalConfirmar] = useState(false);
  const [selectedLoans, setSelectedLoans] = useState<Set<string>>(new Set());
  const [modalRenovar, setModalRenovar] = useState<{ loanId: string; loan: any } | null>(null);
  const [modalConfirmarAviso, setModalConfirmarAviso] = useState(false);
  const [resultadosAviso, setResultadosAviso] = useState<Record<string, { nombre: string; email: string; status: 'pendiente' | 'enviando' | 'ok' | 'error'; error?: string }>>({});
  const [enviandoAvisoModal, setEnviandoAvisoModal] = useState(false);
  const [avisoEnviado, setAvisoEnviado] = useState(false);
  const [modalEstudiante, setModalEstudiante] = useState<any>(null);
  const [estudianteInfo, setEstudianteInfo] = useState<Record<string, { nombre: string; curso: string; rut: string; email: string }>>({});

  const cambiarFecha = async (val: string) => {
    if (!val) return;
    const selected = new Date(val + 'T12:00:00');
    const dia = selected.getDay();
    const options = { day: 'numeric', month: 'long', year: 'numeric' } as const;
    if (dia === 0 || dia === 6) {
      setModalFechaError(`El día ${selected.toLocaleDateString('es-CL', options)} es fin de semana y no es hábil`);
      return;
    }
    const festivos = await obtenerFestivos(idEstablecimiento);
    const festivo = festivos.find((f: any) => {
      const fd = new Date(f.fecha + 'T12:00:00');
      if (f.anual) return fd.getMonth() === selected.getMonth() && fd.getDate() === selected.getDate();
      return fd.toDateString() === selected.toDateString();
    });
    if (festivo) {
      setModalFechaError(`El día ${selected.toLocaleDateString('es-CL', options)} es día no hábil (${festivo.descripcion})`);
      return;
    }
    setFechaInput(val);
  };

  useEffect(() => {
    (async () => {
      if (diasSel === 0) {
        setFechaInput(new Date().toISOString().split('T')[0]);
      } else {
        const d = await calcularFechaVencimiento(new Date(), diasSel, idEstablecimiento);
        setFechaInput(d.toISOString().split('T')[0]);
      }
    })();
  }, [diasSel, idEstablecimiento]);

  // Modal
  const [modalCondicion, setModalCondicion] = useState<{ loanId: string; copyId: string; loan: any } | null>(null);
  const [condicionSel, setCondicionSel] = useState('dentro-fecha');
  const [fineAmount, setFineAmount] = useState(0);
  const [justificacionSel, setJustificacionSel] = useState('');
  const [suspender, setSuspender] = useState(false);
  const [suspensionDias, setSuspensionDias] = useState(1);
  const [pagPrestamos, setPagPrestamos] = useState(1);
  const [porPagPrest, setPorPagPrest] = useState(10);
  const [filtroEstadoPrest, setFiltroEstadoPrest] = useState('');
  const [filtroVencDesde, setFiltroVencDesde] = useState('');
  const [filtroVencHasta, setFiltroVencHasta] = useState('');

  const prestamosFiltrados = useMemo(() => {
    let r = prestamos;
    if (filtroEstadoPrest === 'activo') r = r.filter((p: any) => new Date(p.due_date) >= new Date());
    else if (filtroEstadoPrest === 'pendiente') r = r.filter((p: any) => new Date(p.due_date) < new Date());
    if (filtroVencDesde) r = r.filter((p: any) => new Date(p.due_date) >= new Date(filtroVencDesde + 'T00:00:00'));
    if (filtroVencHasta) r = r.filter((p: any) => new Date(p.due_date) <= new Date(filtroVencHasta + 'T23:59:59'));
    return r;
  }, [prestamos, filtroEstadoPrest, filtroVencDesde, filtroVencHasta]);

  const totalPagPrest = Math.ceil(prestamosFiltrados.length / porPagPrest);
  const prestamosPag = prestamosFiltrados.slice((pagPrestamos - 1) * porPagPrest, pagPrestamos * porPagPrest);

  const cargar = async () => {
    setCargando(true);
    const data = await obtenerPrestamosActivos(idEstablecimiento);
    setPrestamos(data);
    // Fetch student info for all unique student_ids
    const ids = [...new Set(data.map((p: any) => p.student_id))];
    if (ids.length > 0) {
      const { data: estudiantes } = await supabase.from('estudiantes').select('id_estudiante,nombre_completo,curso,email,rut').in('id_estudiante', ids);
      if (estudiantes) {
        const map: Record<string, { nombre: string; curso: string; rut: string; email: string }> = {};
        for (const e of estudiantes) {
          map[e.id_estudiante] = { nombre: e.nombre_completo || e.id_estudiante, curso: e.curso || '—', rut: e.rut || '—', email: e.email || '—' };
        }
        setEstudianteInfo(map);
      }
    }
    setCargando(false);
  };

  useEffect(() => {
    cargar();
    obtenerReglas(idEstablecimiento).then(reglas => {
      const regla = reglas.find(r => r.rol === 'ESTUDIANTE');
      if (regla) { setDiasPrestamo(regla.dias_prestamo); setDiasSel(regla.dias_prestamo); setMaxSimultaneos(regla.max_prestamos_simultaneos); setMaxRenovaciones(regla.max_renovaciones); }
    });
}, [idEstablecimiento]);

  // Book autocomplete
  useEffect(() => {
    if (!busqLibro.trim()) { setResultLibros([]); return; }
    const delay = setTimeout(async () => {
      const res = await buscarLibros(idEstablecimiento, busqLibro);
      setResultLibros(res);
    }, 300);
    return () => clearTimeout(delay);
  }, [busqLibro, idEstablecimiento]);

  // Student autocomplete
  useEffect(() => {
    if (!busqEst.trim() || studentSel) { setResultEst([]); return; }
    const delay = setTimeout(async () => {
      const res = await buscarEstudiantes(idEstablecimiento, busqEst.trim());
      setResultEst(res);
    }, 300);
    return () => clearTimeout(delay);
  }, [busqEst, idEstablecimiento, studentSel]);

  const seleccionarLibro = async (bookId: string): Promise<boolean> => {
    const res = await obtenerLibroConCopias(bookId);
    if (!res.book) { setError('Libro no encontrado'); return false; }
    const disponiblesCount = res.copies.filter(c => c.estado === 'disponible').length;
    if (disponiblesCount === 0) { setError('No hay ejemplares disponibles de este libro'); return false; }
    setLibroSel(res.book);
    setCopiasLibro(res.copies);
    setDisponibles(disponiblesCount);
    setBusqLibro(res.book.titulo);
    return true;
  };

  const seleccionarEstudiante = async (est: any) => {
    setStudentSel(est);
    setResultEst([]);
    setBusqEst('');

    // Load student's loan history and active loans
    const historial = await obtenerHistorialPrestamos(idEstablecimiento);
    const delEst = historial.filter((h: any) => h.student_id === est.id_estudiante);
    setHistorialEst(delEst.slice(0, 5));

    const activos = prestamos.filter(p => p.student_id === est.id_estudiante && (p.status === 'Activo' || p.status === 'atrasado'));
    setPrestamosActivosEst(activos);
    setTieneVencido(activos.some((p: any) => new Date(p.due_date) < new Date()));
  };

  const handlePrestar = async () => {
    if (!libroSel || !studentSel) { setError('Selecciona un libro y un estudiante'); return; }
    if (tieneVencido) { setError('El estudiante tiene préstamos vencidos'); return; }
    if (prestamosActivosEst.length >= maxSimultaneos) { setModalLimite(true); return; }

    const disp = copiasLibro.find(c => c.estado === 'disponible');
    if (!disp) { setError('No hay ejemplares disponibles'); return; }

    const due = diasSel > 0 ? await calcularFechaVencimiento(new Date(), diasSel, idEstablecimiento) : new Date();
    setError(null);
    const res = await prestarLibro(disp.id, studentSel.id_estudiante, due.toISOString(), usuarioId, idEstablecimiento);
    if (res.error) { setError(res.error); return; }
    setExito('Préstamo registrado');
    setTimeout(() => setExito(null), 3000);
    limpiar();
    cargar();
  };

  const limpiar = () => {
    setLibroSel(null); setCopiasLibro([]); setDisponibles(0);
    setStudentSel(null); setHistorialEst([]); setPrestamosActivosEst([]); setTieneVencido(false);
    setBusqLibro(''); setBusqEst(''); setResultLibros([]); setResultEst([]);
  };

  const handleDevolver = async (loanId: string, copyId: string, condicion?: string, fineAmount?: number, suspensionDays?: number, justificationId?: string) => {
    const res = await devolverLibro(loanId, copyId, usuarioId, condicion, fineAmount, suspensionDays, justificationId);
    if (res.error) { setError(res.error); return; }
    const msgs: Record<string, string> = { 'dentro-fecha': 'Devuelto dentro de la fecha', bueno: 'Devuelto en buen estado', danado: 'Devuelto con daños', perdido: 'Marcado como perdido' };
    let msg = msgs[condicion || 'dentro-fecha'] || 'Devolución registrada';
    if (fineAmount) msg += `. Multa: $${fineAmount}`;
    if (suspensionDays) msg += `. Suspendido ${suspensionDays} días`;
    setExito(msg);
    setTimeout(() => setExito(null), 3000);
    cargar();
  };

  const handleRenovar = async (loanId: string, newDueDate?: string) => {
    if (!newDueDate) {
      const due = await calcularFechaVencimiento(new Date(), diasPrestamo, idEstablecimiento);
      newDueDate = due.toISOString();
    }
    const res = await renovarPrestamo(loanId, newDueDate);
    if (res.error) { setError(res.error); return; }
    setExito(`Préstamo renovado`);
    setTimeout(() => setExito(null), 3000);
    cargar();
  };

  const toggleLoan = (id: string) => {
    setSelectedLoans(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const enviarAvisos = async () => {
    setEnviandoAvisoModal(true);
    setAvisoEnviado(false);
    const resultados: Record<string, { nombre: string; email: string; status: 'pendiente' | 'enviando' | 'ok' | 'error'; error?: string }> = {};
    for (const id of selectedLoans) {
      const loan = prestamos.find(p => p.id === id);
      if (!loan) continue;
      resultados[id] = { nombre: loan.student_id, email: '', status: 'pendiente' };
    }
    setResultadosAviso({ ...resultados });

    let cfg: any = null;
    try { cfg = JSON.parse(localStorage.getItem('sgja_email_config') || 'null'); } catch {}
    if (!cfg) {
      const { data: dbCfg } = await supabase.from('email_config').select('*').eq('id_establecimiento', idEstablecimiento).eq('activo', true).maybeSingle();
      if (dbCfg) cfg = { email: dbCfg.email, appPassword: dbCfg.app_password, displayName: dbCfg.display_name || '', port: dbCfg.port || 587, ssl: dbCfg.ssl ?? dbCfg.port === 465 };
    }

    for (const id of selectedLoans) {
      const loan = prestamos.find(p => p.id === id);
      if (!loan) continue;
      resultados[id].status = 'enviando';
      setResultadosAviso({ ...resultados });

      const { data: est } = await supabase.from('estudiantes').select('email,nombre_completo').eq('id_estudiante', loan.student_id).maybeSingle();
      const emailEst = (est as { email?: string; nombre_completo?: string } | null)?.email;
      const nombreEst = (est as { email?: string; nombre_completo?: string } | null)?.nombre_completo || loan.student_id;
      resultados[id].nombre = nombreEst;
      resultados[id].email = emailEst || '';

      if (!emailEst) {
        resultados[id].status = 'error';
        resultados[id].error = 'Sin email registrado';
        setResultadosAviso({ ...resultados });
        continue;
      }

      const { subject, html } = generarHtmlNotificacion('vencido', {
        estudiante: nombreEst,
        libro: loan.book_copies?.books?.titulo || 'Libro',
        fecha: new Date(loan.due_date).toLocaleDateString(),
      });

      const res = await enviarCorreo(emailEst, subject, html, cfg || undefined);
      resultados[id].status = res.success ? 'ok' : 'error';
      if (!res.success) resultados[id].error = res.error;
      await logCorreo('vencido', emailEst, loan.student_id, loan.book_copies?.books?.titulo || null, res.success ? 'exito' : 'falla', res.error || null, idEstablecimiento);
      setResultadosAviso({ ...resultados });
    }
    setEnviandoAvisoModal(false);
    setAvisoEnviado(true);
  };

  const inputStyle = { padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' as const };

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#1A3C6B', marginBottom: '24px' }}>Préstamos de libros</h1>

      {error && <p style={{ color: '#DC2626', fontSize: '14px', marginBottom: '12px', padding: '8px 12px', background: '#FEF2F2', borderRadius: '6px' }}>{error}</p>}
      {exito && <p style={{ color: '#10B981', fontSize: '14px', marginBottom: '12px', padding: '8px 12px', background: '#F0FDF4', borderRadius: '6px' }}>{exito}</p>}

      {/* ── NUEVO PRÉSTAMO ── */}
      <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1A3C6B', marginBottom: '16px' }}>Nuevo Préstamo</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* ── COLUMNA IZQUIERDA: LIBRO ── */}
          <div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Buscar libro por ISBN, título o autor</label>
                <div style={{ display: 'flex' }}>
                  <span style={{ padding: '10px 12px', border: '1px solid #E5E7EB', borderRight: 'none', borderRadius: '8px 0 0 8px', background: '#F3F4F6', fontSize: '16px' }}>🔍</span>
                  <input style={{ ...inputStyle, width: '100%', borderRadius: '0 8px 8px 0' }} placeholder="Escribe para buscar..." value={busqLibro} onChange={e => setBusqLibro(e.target.value)} />
                </div>
              </div>
              <button type="button" onClick={async () => {
                const data = await buscarLibros(idEstablecimiento);
                const ids = data.map((b: any) => b.id);
                const counts = await obtenerCantidadCopias(ids);
                setTodosLibros(data.map((b: any) => ({ ...b, _copias: counts[b.id] || 0 })));
                setPagLibros(1); setAbrirListaLibros(true);
              }} title="Ver todos los libros" style={{ padding: '10px 14px', background: '#3B82F6', color: '#FFFFFF', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', whiteSpace: 'nowrap', marginBottom: '0' }}>📋</button>
            </div>

            {resultLibros.map(l => (
              <button type="button" key={l.id} onClick={() => seleccionarLibro(l.id)} style={{ padding: '10px', borderBottom: '1px solid #F3F4F6', cursor: 'pointer', border: 'none', background: 'none', width: '100%', textAlign: 'left', display: 'block' }}>
                <p style={{ fontWeight: 600, fontSize: '14px', margin: 0 }}>{l.titulo}</p>
                <p style={{ fontSize: '12px', color: '#6B7280', margin: '2px 0 0 0' }}>{l.autor} {l.isbn && `| ISBN: ${l.isbn}`}</p>
              </button>
            ))}

            {libroSel && (
              <div style={{ marginTop: '12px', padding: '16px', background: '#F0FDF4', borderRadius: '8px' }}>
                <p style={{ fontWeight: 700, fontSize: '15px', color: '#1A3C6B', margin: '0 0 4px 0' }}>{libroSel.titulo}</p>
                <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 8px 0' }}>{libroSel.autor} {libroSel.isbn && `| ${libroSel.isbn}`}</p>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '13px' }}>
                  <span>📦 <strong>{copiasLibro.length}</strong> ejemplares</span>
                  <span style={{ color: disponibles > 0 ? '#10B981' : '#EF4444' }}>
                    {disponibles > 0 ? `✅ ${disponibles} disponible(s)` : '❌ Sin disponibles'}
                  </span>
                </div>
                <div style={{ marginTop: '8px', maxHeight: '120px', overflowY: 'auto', fontSize: '13px' }}>
                  {copiasLibro.map(c => (
                    <div key={c.id} style={{ padding: '4px 0', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{c.codigo_ejemplar} — Est. {c.estanteria}-{c.fila}</span>
                      <span style={{ fontWeight: 600, color: c.estado === 'disponible' ? '#10B981' : '#F59E0B' }}>{c.estado}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── COLUMNA DERECHA: ESTUDIANTE ── */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Buscar estudiante por RUT, nombre o ID</label>
            <input style={{ ...inputStyle, width: '100%' }} placeholder="Escribe para buscar..." value={busqEst} onChange={e => setBusqEst(e.target.value)} />

            {resultEst.map(r => (
              <button type="button" key={r.id_estudiante} onClick={() => seleccionarEstudiante(r)} style={{ padding: '10px', borderBottom: '1px solid #F3F4F6', cursor: 'pointer', border: 'none', background: 'none', width: '100%', textAlign: 'left', display: 'block' }}>
                <p style={{ fontWeight: 600, fontSize: '14px', margin: 0 }}>{r.nombre_completo}</p>
                <p style={{ fontSize: '12px', color: '#6B7280', margin: '2px 0 0 0' }}>{r.rut || 'Sin RUT'} · {r.curso}</p>
              </button>
            ))}

            {studentSel && (
              <div style={{ marginTop: '12px' }}>
                <div style={{ padding: '12px', background: '#DBEAFE', borderRadius: '8px' }}>
                  <p style={{ fontWeight: 700, fontSize: '15px', color: '#1A3C6B', margin: '0 0 2px 0' }}>{studentSel.nombre_completo}</p>
                  <p style={{ fontSize: '13px', color: '#6B7280', margin: '0' }}>{studentSel.rut || 'Sin RUT'} · {studentSel.curso}</p>
                </div>

                {tieneVencido && (
                  <p style={{ color: '#DC2626', fontSize: '13px', marginTop: '8px', padding: '8px', background: '#FEF2F2', borderRadius: '6px' }}>
                    ⛔ Tiene préstamos vencidos. No puede solicitar otro.
                  </p>
                )}

                {prestamosActivosEst.length > 0 && (
                  <div style={{ marginTop: '8px', padding: '10px', background: '#FEF3C7', borderRadius: '6px' }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, margin: '0 0 4px 0' }}>Préstamos activos:</p>
                    {prestamosActivosEst.map((p: any) => (
                      <p key={p.id} style={{ fontSize: '12px', color: '#92400E', margin: '2px 0' }}>
                        📚 {p.book_copies?.books?.titulo || '—'} — Vence: {new Date(p.due_date).toLocaleDateString()}
                      </p>
                    ))}
                  </div>
                )}

                {historialEst.length > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#374151', margin: '0 0 4px 0' }}>Historial reciente:</p>
                    {historialEst.map((h: any) => (
                      <p key={h.id} style={{ fontSize: '12px', color: '#6B7280', margin: '2px 0' }}>
                        {h.book_copies?.books?.titulo || '—'} — {h.status === 'Devuelto' ? `Devuelto ${new Date(h.returned_at).toLocaleDateString()}` : h.status}
                      </p>
                    ))}
                  </div>
                )}

                {/* Selector de días */}
                {libroSel && !tieneVencido && (
                  <div style={{ marginTop: '12px', padding: '12px', background: '#F9FAFB', borderRadius: '8px' }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#374151', margin: '0 0 8px 0' }}>Días de préstamo</p>
                    <input type="range" min={0} max={diasPrestamo} value={diasSel} onChange={e => setDiasSel(parseInt(e.target.value))} style={{ width: '100%' }} />
                    <div style={{ width: '100%', height: '6px', background: '#E5E7EB', borderRadius: '3px', margin: '4px 0' }}>
                      <div style={{ width: `${diasPrestamo > 0 ? (diasSel / diasPrestamo) * 100 : 0}%`, height: '100%', background: '#3B82F6', borderRadius: '3px', transition: 'width 0.2s' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6B7280', marginBottom: '8px' }}>
                      <span>0 días (mín)</span>
                      <span style={{ fontWeight: 700, color: '#1A3C6B' }}>{diasSel > 0 ? `${diasSel} día(s)` : 'Mismo día'}</span>
                      <span>{diasPrestamo} días (máx)</span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#374151', background: '#EFF6FF', padding: '6px 10px', borderRadius: '6px', alignItems: 'center', gap: '8px' }}>
                      <span>📅</span>
                      <input type="date" value={fechaInput} onChange={e => cambiarFecha(e.target.value)} style={{ flex: 2, padding: '6px 8px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '13px' }} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Botones */}
        {libroSel && studentSel && !tieneVencido && (
          <div style={{ display: 'flex', gap: '12px', marginTop: '20px', justifyContent: 'flex-end' }}>
            <Button onClick={limpiar} tipo="secundario">Cancelar</Button>
            <Button onClick={() => setModalConfirmar(true)} tipo="exito">Confirmar Préstamo</Button>
          </div>
        )}
      </div>

      {/* ── PRÉSTAMOS ACTIVOS ── */}
      <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1A3C6B', marginBottom: '16px' }}>Préstamos Activos ({prestamos.length})</h2>

      {cargando ? <p style={{ color: '#6B7280' }}>Cargando…</p> : prestamos.length === 0 ? (
        <p style={{ color: '#9CA3AF' }}>Sin préstamos activos</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#6B7280', marginBottom: '4px' }}>Estado</label>
              <select value={filtroEstadoPrest} onChange={e => { setFiltroEstadoPrest(e.target.value); setPagPrestamos(1); }} style={{ padding: '6px 10px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '13px' }}>
                <option value="">Todos</option>
                <option value="activo">Activo</option>
                <option value="pendiente">Pendiente</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#6B7280', marginBottom: '4px' }}>Vence desde</label>
              <input type="date" value={filtroVencDesde} onChange={e => { setFiltroVencDesde(e.target.value); setPagPrestamos(1); }} style={{ padding: '6px 10px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '13px' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#6B7280', marginBottom: '4px' }}>Vence hasta</label>
              <input type="date" value={filtroVencHasta} onChange={e => { setFiltroVencHasta(e.target.value); setPagPrestamos(1); }} style={{ padding: '6px 10px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '13px' }} />
            </div>
            {selectedLoans.size > 0 && (
              <button type="button" onClick={() => setModalConfirmarAviso(true)} disabled={enviandoAvisoModal} style={{ padding: '8px 16px', background: '#EF4444', color: '#FFFFFF', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '13px', whiteSpace: 'nowrap', alignSelf: 'flex-end' }}>
                {enviandoAvisoModal ? 'Enviando...' : `📧 Enviar aviso (${selectedLoans.size})`}
              </button>
            )}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
              <select value={porPagPrest} onChange={e => { setPorPagPrest(parseInt(e.target.value)); setPagPrestamos(1); }} style={{ padding: '6px 10px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '13px' }}>
                <option value={10}>10 por página</option>
                <option value={20}>20 por página</option>
                <option value={30}>30 por página</option>
              </select>
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #E5E7EB' }}>
                <th style={{ width: '40px', padding: '10px' }}></th>
                <th style={{ textAlign: 'left', padding: '10px', color: '#6B7280', fontWeight: 600 }}>Libro</th>
                <th style={{ textAlign: 'left', padding: '10px', color: '#6B7280', fontWeight: 600 }}>Vence</th>
                <th style={{ textAlign: 'left', padding: '10px', color: '#6B7280', fontWeight: 600 }}>Estudiante</th>
                <th style={{ textAlign: 'left', padding: '10px', color: '#6B7280', fontWeight: 600 }}>Curso</th>
                <th style={{ textAlign: 'left', padding: '10px', color: '#6B7280', fontWeight: 600 }}>Estado</th>
                <th style={{ padding: '10px' }}></th>
              </tr>
            </thead>
            <tbody>
              {prestamosPag.map((p: any) => {
                const vencido = new Date(p.due_date) < new Date();
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #F3F4F6', backgroundColor: vencido ? '#FEF2F2' : 'transparent', cursor: 'pointer' }} onClick={() => { const info = estudianteInfo[p.student_id]; if (info) setModalEstudiante({ student_id: p.student_id, ...info }); }}>
                    <td style={{ padding: '10px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={selectedLoans.has(p.id)} onChange={() => toggleLoan(p.id)} style={{ cursor: 'pointer', width: '16px', height: '16px' }} />
                    </td>
                    <td style={{ padding: '10px', fontWeight: 600 }}>{p.book_copies?.books?.titulo || '—'}</td>
                    <td style={{ padding: '10px', color: vencido ? '#DC2626' : '#374151', fontWeight: vencido ? 700 : 400 }}>{new Date(p.due_date).toLocaleDateString()}</td>
                    <td style={{ padding: '10px' }}>{estudianteInfo[p.student_id]?.nombre || p.student_id}</td>
                    <td style={{ padding: '10px', color: '#6B7280' }}>{estudianteInfo[p.student_id]?.curso || '—'}</td>
                    <td style={{ padding: '10px' }}>
                      <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '999px', fontSize: '12px', fontWeight: 600, color: '#FFFFFF', backgroundColor: vencido ? '#DC2626' : '#F59E0B' }}>
                        {vencido ? 'Pendiente' : p.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px' }}>
                      <div style={{ display: 'flex', gap: '8px' }} onClick={e => e.stopPropagation()}>
                        <button type="button" onClick={async () => { 
                          setCondicionSel('dentro-fecha'); setFineAmount(0); setJustificacionSel(''); setSuspender(false); setSuspensionDias(1); 
                          const j = await obtenerJustificaciones(idEstablecimiento); setJustificaciones(j);
                          setModalCondicion({ loanId: p.id, copyId: p.copy_id, loan: p }); 
                        }} style={{ padding: '6px 12px', background: '#10B981', color: '#FFFFFF', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>Devolver</button>
                        <button type="button" onClick={() => setModalRenovar({ loanId: p.id, loan: p })} style={{ padding: '6px 12px', background: '#3B82F6', color: '#FFFFFF', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>Renovar</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {totalPagPrest > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '16px 0', alignItems: 'center' }}>
              <button type="button" disabled={pagPrestamos <= 1} onClick={() => setPagPrestamos(p => p - 1)} style={{ padding: '6px 14px', background: pagPrestamos <= 1 ? '#E5E7EB' : '#1A3C6B', color: '#FFFFFF', border: 'none', borderRadius: '6px', cursor: pagPrestamos <= 1 ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '13px' }}>‹ Anterior</button>
              {Array.from({ length: totalPagPrest }, (_, i) => i + 1).map(p => (
                <button type="button" key={p} onClick={() => setPagPrestamos(p)} style={{ padding: '6px 12px', background: p === pagPrestamos ? '#1A3C6B' : '#F3F4F6', color: p === pagPrestamos ? '#FFFFFF' : '#374151', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>{p}</button>
              ))}
              <button type="button" disabled={pagPrestamos >= totalPagPrest} onClick={() => setPagPrestamos(p => p + 1)} style={{ padding: '6px 14px', background: pagPrestamos >= totalPagPrest ? '#E5E7EB' : '#1A3C6B', color: '#FFFFFF', border: 'none', borderRadius: '6px', cursor: pagPrestamos >= totalPagPrest ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '13px' }}>Siguiente ›</button>
            </div>
          )}
        </div>
      )}

      {/* Modal fecha no hábil */}
      <Modal abierto={!!modalFechaError} onCerrar={() => setModalFechaError('')} titulo="Fecha no hábil">
        <p style={{ fontSize: '15px', color: '#374151', textAlign: 'center', marginBottom: '24px' }}>{modalFechaError}</p>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Button onClick={() => setModalFechaError('')} tipo="primario">Cerrar</Button>
        </div>
      </Modal>

      {/* Modal límite préstamos */}
      <Modal abierto={modalLimite} onCerrar={() => setModalLimite(false)} titulo="Límite de préstamos alcanzado">
        <p style={{ fontSize: '15px', color: '#374151', textAlign: 'center', marginBottom: '24px' }}>
          El estudiante <strong>{studentSel?.nombre_completo}</strong> ya tiene <strong>{prestamosActivosEst.length}</strong> préstamos activos (máx. {maxSimultaneos}).
        </p>
        <p style={{ fontSize: '14px', color: '#6B7280', textAlign: 'center', marginBottom: '24px' }}>
          Debe devolver alguno antes de solicitar un nuevo préstamo.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Button onClick={() => setModalLimite(false)} tipo="primario">Cerrar</Button>
        </div>
      </Modal>

      {/* Modal lista de libros */}
      <Modal abierto={abrirListaLibros} onCerrar={() => setAbrirListaLibros(false)} titulo="Seleccionar libro" tamaño="grande">
        {todosLibros.length === 0 ? <p style={{ color: '#6B7280' }}>Cargando…</p> : (
          <div>
            {librosPag.map(l => (
              <button type="button" key={l.id} onClick={async () => { const ok = await seleccionarLibro(l.id); if (ok) setAbrirListaLibros(false); else setError('No hay ejemplares disponibles de este libro'); }} disabled={l._copias === 0} style={{ padding: '12px', borderBottom: '1px solid #F3F4F6', cursor: l._copias > 0 ? 'pointer' : 'not-allowed', opacity: l._copias > 0 ? 1 : 0.5, border: 'none', background: 'none', width: '100%', textAlign: 'left', display: 'block' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '14px', margin: 0 }}>{l.titulo}</p>
                    <p style={{ fontSize: '12px', color: '#6B7280', margin: '2px 0 0 0' }}>{l.autor} {l.isbn && `| ISBN: ${l.isbn}`} · {l.categoria}</p>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: l._copias > 0 ? '#10B981' : '#EF4444' }}>
                    {l._copias > 0 ? `${l._copias} ej.` : 'Sin copias'}
                  </span>
                </div>
              </button>
            ))}
            {totalPagLib > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '16px 0' }}>
                <button type="button" disabled={pagLibros <= 1} onClick={() => setPagLibros(p => p - 1)} style={{ padding: '6px 14px', background: pagLibros <= 1 ? '#E5E7EB' : '#1A3C6B', color: '#FFFFFF', border: 'none', borderRadius: '6px', cursor: pagLibros <= 1 ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '13px' }}>‹ Anterior</button>
                <span style={{ alignSelf: 'center', fontSize: '13px', color: '#6B7280' }}>{pagLibros} / {totalPagLib}</span>
                <button type="button" disabled={pagLibros >= totalPagLib} onClick={() => setPagLibros(p => p + 1)} style={{ padding: '6px 14px', background: pagLibros >= totalPagLib ? '#E5E7EB' : '#1A3C6B', color: '#FFFFFF', border: 'none', borderRadius: '6px', cursor: pagLibros >= totalPagLib ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '13px' }}>Siguiente ›</button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal confirmar préstamo */}
      <Modal abierto={modalConfirmar} onCerrar={() => setModalConfirmar(false)} titulo="Confirmar préstamo" tamaño="normal">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
          <div style={{ padding: '10px 14px', background: '#F0FDF4', borderRadius: '8px' }}>
            <p style={{ fontSize: '12px', color: '#6B7280', margin: '0 0 2px 0' }}>Libro</p>
            <p style={{ fontWeight: 700, margin: 0 }}>{libroSel?.titulo}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ padding: '10px 14px', background: '#DBEAFE', borderRadius: '8px' }}>
              <p style={{ fontSize: '12px', color: '#6B7280', margin: '0 0 2px 0' }}>Estudiante</p>
              <p style={{ fontWeight: 700, margin: 0 }}>{studentSel?.nombre_completo}</p>
            </div>
            <div style={{ padding: '10px 14px', background: '#DBEAFE', borderRadius: '8px' }}>
              <p style={{ fontSize: '12px', color: '#6B7280', margin: '0 0 2px 0' }}>Curso</p>
              <p style={{ fontWeight: 700, margin: 0 }}>{studentSel?.curso || '—'}</p>
            </div>
          </div>
          <div style={{ padding: '10px 14px', background: '#FEF3C7', borderRadius: '8px' }}>
            <p style={{ fontSize: '12px', color: '#6B7280', margin: '0 0 2px 0' }}>Fecha de devolución</p>
            <p style={{ fontWeight: 700, margin: 0 }}>{new Date(fechaInput + 'T12:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', marginTop: '20px', justifyContent: 'flex-end' }}>
          <Button onClick={() => setModalConfirmar(false)} tipo="secundario">Cancelar</Button>
          <Button onClick={async () => { setModalConfirmar(false); await handlePrestar(); }} tipo="exito">✓ Confirmar</Button>
        </div>
      </Modal>

      {/* Modal confirmar aviso */}
      <Modal abierto={modalConfirmarAviso} onCerrar={() => { setModalConfirmarAviso(false); setAvisoEnviado(false); setResultadosAviso({}); }} titulo="Enviar aviso de vencimiento">
        {!avisoEnviado ? (
          <>
            <p style={{ fontSize: '14px', color: '#374151', marginBottom: '16px' }}>
              Se enviará un correo a cada estudiante por los siguientes préstamos vencidos:
            </p>
            <div style={{ maxHeight: '240px', overflowY: 'auto', marginBottom: '16px' }}>
              {Array.from(selectedLoans).map(id => {
                const loan = prestamos.find(p => p.id === id);
                const r = resultadosAviso[id];
                return loan ? (
                  <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: '#FEF2F2', borderRadius: '6px', marginBottom: '6px', fontSize: '13px' }}>
                    <div style={{ flex: 1 }}>
                      <strong>{loan.book_copies?.books?.titulo || 'Libro'}</strong> — {r?.nombre || loan.student_id}
                      {r?.email && <span style={{ color: '#6B7280', marginLeft: '8px' }}>({r.email})</span>}
                      <br /><span style={{ color: '#6B7280', fontSize: '12px' }}>Vence: {new Date(loan.due_date).toLocaleDateString()}</span>
                    </div>
                    {r?.status === 'pendiente' && r?.email === undefined && null}
                    {r?.status === 'pendiente' && r?.email !== undefined && <span style={{ fontSize: '12px', color: '#6B7280' }}>Pendiente</span>}
                    {r?.status === 'enviando' && <span style={{ color: '#3B82F6', fontSize: '13px' }}>Enviando...</span>}
                    {r?.status === 'ok' && <span style={{ color: '#10B981', fontSize: '16px' }}>✓</span>}
                    {r?.status === 'error' && <span style={{ color: '#EF4444', fontSize: '13px' }} title={r.error}>✕ {r.error}</span>}
                  </div>
                ) : null;
              })}
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <Button onClick={() => { setModalConfirmarAviso(false); setAvisoEnviado(false); setResultadosAviso({}); }} tipo="secundario">Cancelar</Button>
              <Button onClick={enviarAvisos} deshabilitado={enviandoAvisoModal} tipo="peligro">
                {enviandoAvisoModal ? 'Enviando...' : '📧 Enviar aviso'}
              </Button>
            </div>
          </>
        ) : (
          <>
            <p style={{ fontSize: '14px', color: '#374151', marginBottom: '16px' }}>
              Resultado del envío:
            </p>
            <div style={{ maxHeight: '240px', overflowY: 'auto', marginBottom: '16px' }}>
              {Array.from(selectedLoans).map(id => {
                const loan = prestamos.find(p => p.id === id);
                const r = resultadosAviso[id];
                return loan ? (
                  <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: r?.status === 'ok' ? '#F0FDF4' : '#FEF2F2', borderRadius: '6px', marginBottom: '6px', fontSize: '13px' }}>
                    <div style={{ flex: 1 }}>
                      <strong>{loan.book_copies?.books?.titulo || 'Libro'}</strong> — {r?.nombre || loan.student_id}
                      {r?.email && <span style={{ color: '#6B7280', marginLeft: '8px' }}>({r.email})</span>}
                    </div>
                    {r?.status === 'ok' && <span style={{ color: '#10B981', fontSize: '13px' }}>✓ Enviado</span>}
                    {r?.status === 'error' && <span style={{ color: '#EF4444', fontSize: '13px' }}>✕ {r.error || 'Error'}</span>}
                    {r?.status === 'pendiente' && <span style={{ color: '#6B7280', fontSize: '13px' }}>— Sin intentar</span>}
                  </div>
                ) : null;
              })}
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <Button onClick={() => { setModalConfirmarAviso(false); setAvisoEnviado(false); setResultadosAviso({}); setSelectedLoans(new Set()); }} tipo="secundario">Cerrar</Button>
            </div>
          </>
        )}
      </Modal>

      {/* Modal renovar */}
      <Modal abierto={!!modalRenovar} onCerrar={() => setModalRenovar(null)} titulo="Renovar préstamo">
        {modalRenovar && (() => {
          const r = modalRenovar.loan?.renewed_count || 0;
          const m = maxRenovaciones;
          const puede = r < m;
          return (
            <div>
              <p style={{ fontSize: '14px', color: '#374151', marginBottom: '8px' }}>
                <strong>{modalRenovar.loan?.book_copies?.books?.titulo}</strong> — Vence: {modalRenovar.loan?.due_date ? new Date(modalRenovar.loan.due_date).toLocaleDateString() : ''}
              </p>
              <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '16px' }}>Renovaciones: {r} de {m}</p>
              {puede ? (
                <>
                  <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '16px' }}>¿Por cuántos días deseas renovar?</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <Button onClick={async () => { if (!modalRenovar) return; const desde = new Date(modalRenovar.loan.due_date); const d = await calcularFechaVencimiento(desde, 2, idEstablecimiento); await handleRenovar(modalRenovar.loanId, d.toISOString()); setModalRenovar(null); }} tipo="primario" anchoCompleto>+2 días</Button>
                    <Button onClick={async () => { if (!modalRenovar) return; const desde = new Date(modalRenovar.loan.due_date); const d = await calcularFechaVencimiento(desde, 4, idEstablecimiento); await handleRenovar(modalRenovar.loanId, d.toISOString()); setModalRenovar(null); }} tipo="primario" anchoCompleto>+4 días</Button>
                    <Button onClick={async () => { if (!modalRenovar) return; const desde = new Date(modalRenovar.loan.due_date); const d = await calcularFechaVencimiento(desde, 7, idEstablecimiento); await handleRenovar(modalRenovar.loanId, d.toISOString()); setModalRenovar(null); }} tipo="exito" anchoCompleto>+7 días</Button>
                  </div>
                </>
              ) : (
                <p style={{ fontSize: '14px', color: '#DC2626', textAlign: 'center', padding: '16px', background: '#FEF2F2', borderRadius: '8px' }}>
                  ⛔ Has alcanzado el máximo de {m} renovaciones permitidas para este préstamo.
                </p>
              )}
              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
                <Button onClick={() => setModalRenovar(null)} tipo="secundario">Cerrar</Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Modal condición devolución */}
      {modalCondicion && (() => {
        const vencido = new Date(modalCondicion.loan.due_date) < new Date();
        const aplicarPenalizacion = vencido || condicionSel === 'danado' || condicionSel === 'perdido';
        return (
          <Modal abierto={!!modalCondicion} onCerrar={() => setModalCondicion(null)} titulo="Devolver ejemplar" tamaño="grande">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Condición del ejemplar */}
              <div>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Estado del ejemplar</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  {['bueno', 'danado', 'perdido'].map(cond => (
                    <button type="button" key={cond} onClick={() => setCondicionSel(cond)} style={{
                      padding: '10px', borderRadius: '8px', border: condicionSel === cond ? '2px solid #1A3C6B' : '1px solid #D1D5DB',
                      background: condicionSel === cond ? '#EFF6FF' : '#FFFFFF', cursor: 'pointer', fontWeight: 600, fontSize: '13px', textAlign: 'center', transition: 'all 0.15s',
                    }}>
                      {cond === 'bueno' ? '✅ Buen estado' : cond === 'danado' ? '⚠️ Dañado' : '❌ Perdido'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Multa o Justificación */}
              <div>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Multa / Justificación</p>
                {aplicarPenalizacion ? (
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Multa ($)</label>
                      <input type="number" min="0" value={fineAmount} onChange={e => setFineAmount(parseInt(e.target.value) || 0)} style={{ ...inputStyle, width: '100%' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Justificación</label>
                      <select value={justificacionSel} onChange={e => setJustificacionSel(e.target.value)} style={{ ...inputStyle, width: '100%' }}>
                      <option value="">Seleccionar...</option>
                        {justificaciones.map(j => (
                          <option key={j.id} value={j.id}>{j.nombre}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: '13px', color: '#10B981', padding: '8px 12px', background: '#F0FDF4', borderRadius: '6px', margin: 0 }}>
                    ✅ Devuelto dentro de la fecha — no aplica multa ni suspensión.
                  </p>
                )}
              </div>

              {/* Suspensión */}
              {aplicarPenalizacion && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <input type="checkbox" id="chkSusp" checked={suspender} onChange={e => setSuspender(e.target.checked)} />
                    <label htmlFor="chkSusp" style={{ fontSize: '14px', fontWeight: 600, color: '#374151', cursor: 'pointer' }}>Suspender usuario</label>
                  </div>
                  {suspender && (
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Días de suspensión</label>
                        <input type="number" min="1" value={suspensionDias} onChange={e => setSuspensionDias(parseInt(e.target.value) || 1)} style={{ ...inputStyle, width: '80px' }} />
                      </div>
                      <span style={{ fontSize: '13px', color: '#6B7280', paddingBottom: '4px' }}>días</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px', justifyContent: 'flex-end' }}>
              <Button onClick={() => setModalCondicion(null)} tipo="secundario">Cancelar</Button>
              <Button onClick={async () => {
                if (!modalCondicion) return;
                await handleDevolver(modalCondicion.loanId, modalCondicion.copyId, condicionSel, fineAmount, suspender ? suspensionDias : undefined, justificacionSel || undefined);
                setModalCondicion(null);
              }} tipo="exito">✓ Confirmar devolución</Button>
            </div>
          </Modal>
        );
      })()}

      {/* Modal detalle estudiante */}
      <Modal abierto={!!modalEstudiante} onCerrar={() => setModalEstudiante(null)} titulo={modalEstudiante?.nombre || 'Estudiante'}>
        {modalEstudiante && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ padding: '10px 14px', background: '#F0FDF4', borderRadius: '8px' }}>
                <p style={{ fontSize: '12px', color: '#6B7280', margin: '0 0 2px 0' }}>Nombre</p>
                <p style={{ fontWeight: 700, margin: 0 }}>{modalEstudiante.nombre}</p>
              </div>
              <div style={{ padding: '10px 14px', background: '#F0FDF4', borderRadius: '8px' }}>
                <p style={{ fontSize: '12px', color: '#6B7280', margin: '0 0 2px 0' }}>RUT</p>
                <p style={{ fontWeight: 700, margin: 0 }}>{modalEstudiante.rut}</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ padding: '10px 14px', background: '#DBEAFE', borderRadius: '8px' }}>
                <p style={{ fontSize: '12px', color: '#6B7280', margin: '0 0 2px 0' }}>Curso</p>
                <p style={{ fontWeight: 700, margin: 0 }}>{modalEstudiante.curso}</p>
              </div>
              <div style={{ padding: '10px 14px', background: '#DBEAFE', borderRadius: '8px' }}>
                <p style={{ fontSize: '12px', color: '#6B7280', margin: '0 0 2px 0' }}>Email</p>
                <p style={{ fontWeight: 700, margin: 0 }}>{modalEstudiante.email}</p>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <Button onClick={() => setModalEstudiante(null)} tipo="secundario">Cerrar</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
