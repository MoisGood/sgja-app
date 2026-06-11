import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Filter, X, Loader, ClipboardList, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Props { idEstablecimiento: string }

interface HistoryItem {
  id: string; tipo_requerimiento: string; prioridad: string;
  estado: string; descripcion: string; created_at: string; lugar_nombre?: string;
}

const POR_PAGINA = 15;

export default function HistorialMovil({ idEstablecimiento }: Props) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [showFiltros, setShowFiltros] = useState(false);
  const [pagina, setPagina] = useState(1);

  const estadoParam = searchParams.get('estado');
  const prioridadParam = searchParams.get('prioridad');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [estados, setEstados] = useState<string[]>(estadoParam ? [estadoParam] : ['Pendiente', 'En Proceso']);
  const [idLugar, setIdLugar] = useState('');
  const [idUsuario, setIdUsuario] = useState('');

  const [lugares, setLugares] = useState<{ id: string; nombre: string }[]>([]);
  const [usuarios, setUsuarios] = useState<{ id: string; nombre: string }[]>([]);

  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));

  const fetchData = async (p: number, filtros?: { estados?: string[]; idLugar?: string; idUsuario?: string; desde?: string; hasta?: string; prioridad?: string }) => {
    setCargando(true);
    try {
      const f = filtros || {};
      const from = (p - 1) * POR_PAGINA;
      const to = from + POR_PAGINA - 1;

      let query = supabase
        .from('requerimientos')
        .select('id,tipo_requerimiento,descripcion,estado,prioridad,created_at,lugares(nombre)', { count: 'exact' })
        .eq('id_establecimiento', idEstablecimiento)
        .eq('activo', true)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (f.estados && f.estados.length > 0) query = query.in('estado', f.estados);
      if (f.idLugar) query = query.eq('id_lugar', f.idLugar);
      if (f.idUsuario) query = query.eq('id_tecnico_asignado', f.idUsuario);
      if (f.prioridad) query = query.eq('prioridad', f.prioridad);
      if (f.desde) query = query.gte('created_at', new Date(f.desde).toISOString());
      if (f.hasta) {
        const fin = new Date(f.hasta);
        fin.setHours(23, 59, 59, 999);
        query = query.lte('created_at', fin.toISOString());
      }

      const [reqRes, lugRes, usrRes] = await Promise.all([
        query,
        supabase.from('lugares').select('id,nombre').eq('id_establecimiento', idEstablecimiento).eq('activo', true),
        supabase.from('usuarios').select('id,nombre').eq('id_establecimiento', idEstablecimiento).eq('activo', true).order('nombre'),
      ]);

      if (lugRes.data) setLugares(lugRes.data);
      if (usrRes.data) setUsuarios(usrRes.data);
      setTotal(reqRes.count ?? 0);
      if (reqRes.data) {
        setItems((reqRes.data as any[]).map(r => ({
          id: r.id, tipo_requerimiento: r.tipo_requerimiento,
          prioridad: r.prioridad, estado: r.estado,
          descripcion: r.descripcion, created_at: r.created_at,
          lugar_nombre: (r.lugares as any[])?.[0]?.nombre,
        })));
      } else {
        setItems([]);
      }
    } catch {}
    setCargando(false);
  };

  useEffect(() => {
    if (idEstablecimiento) {
      setPagina(1);
      fetchData(1, {
        estados: estados.length > 0 ? estados : undefined,
        prioridad: prioridadParam || undefined,
      });
    }
  }, [idEstablecimiento]);

  const buscar = () => {
    setPagina(1);
    fetchData(1, {
      estados: estados.length > 0 ? estados : undefined,
      idLugar: idLugar || undefined,
      idUsuario: idUsuario || undefined,
      desde: desde || undefined,
      hasta: hasta || undefined,
    });
  };

  const toggleEstado = (e: string) => {
    setEstados(prev =>
      prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e]
    );
  };

  const limpiar = () => {
    setPagina(1);
    setDesde('');
    setHasta('');
    setEstados(['Pendiente', 'En Proceso']);
    setIdLugar('');
    setIdUsuario('');
    fetchData(1, { estados: ['Pendiente', 'En Proceso'] });
  };

  const irPagina = (p: number) => {
    if (p < 1 || p > totalPaginas) return;
    setPagina(p);
    fetchData(p, {
      estados: estados.length > 0 ? estados : undefined,
      idLugar: idLugar || undefined,
      idUsuario: idUsuario || undefined,
      desde: desde || undefined,
      hasta: hasta || undefined,
    });
  };

  const colorEstado: Record<string, string> = {
    Pendiente: '#f59e0b', 'En Proceso': '#3b82f6',
    Completada: '#22c55e', Cancelada: '#64748b',
  };
  const colorPrioridad: Record<string, string> = {
    Baja: '#6b7280', Normal: '#3b82f6', Alta: '#f59e0b', Urgente: '#dc2626',
  };

  if (cargando && items.length === 0) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}><Loader size={24} className="animate-spin" /></div>;
  }

  return (
    <div style={{ padding: '12px 12px 72px', maxWidth: 500, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1F2937', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
          <ClipboardList size={18} />
          Historial
        </h2>
        <div style={{ display: 'flex', gap: 6 }}>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowFiltros(!showFiltros)}
            style={{
              padding: '6px 12px', borderRadius: 8, border: '1px solid #D1D5DB',
              background: showFiltros ? '#1e293b' : '#fff',
              color: showFiltros ? '#f1f5f9' : '#374151',
              fontSize: 12, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
            }}
          ><Filter size={14} /> Filtros</motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={buscar}
            style={{
              padding: '6px 12px', borderRadius: 8, border: 'none',
              background: '#1e40af', color: '#fff', fontSize: 12, fontWeight: 500, cursor: 'pointer',
            }}
          >Buscar</motion.button>
        </div>
      </div>

      {showFiltros && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: '#F9FAFB', borderRadius: 10, padding: 12, marginBottom: 10, border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', gap: 8 }}
        >
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 10, color: '#6B7280', display: 'block', marginBottom: 2 }}>Desde</label>
              <input type="date" value={desde} onChange={e => setDesde(e.target.value)}
                style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 12, boxSizing: 'border-box' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 10, color: '#6B7280', display: 'block', marginBottom: 2 }}>Hasta</label>
              <input type="date" value={hasta} onChange={e => setHasta(e.target.value)}
                style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 12, boxSizing: 'border-box' }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 10, color: '#6B7280', display: 'block', marginBottom: 3 }}>Estado</label>
            <div style={{ display: 'flex', gap: 4 }}>
              {['Pendiente', 'En Proceso', 'Completada', 'Cancelada'].map(e => (
                <button key={e} onClick={() => toggleEstado(e)}
                  style={{
                    padding: '4px 10px', borderRadius: 6, border: '1px solid #D1D5DB',
                    background: estados.includes(e) ? '#1e293b' : '#fff',
                    color: estados.includes(e) ? '#f1f5f9' : '#374151',
                    fontSize: 11, fontWeight: 500, cursor: 'pointer',
                  }}
                >{e}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 10, color: '#6B7280', display: 'block', marginBottom: 2 }}>Lugar</label>
              <select value={idLugar} onChange={e => setIdLugar(e.target.value)}
                style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 12 }}>
                <option value="">Todos</option>
                {lugares.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 10, color: '#6B7280', display: 'block', marginBottom: 2 }}>Usuario</label>
              <select value={idUsuario} onChange={e => setIdUsuario(e.target.value)}
                style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 12 }}>
                <option value="">Todos</option>
                {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
              </select>
            </div>
          </div>
          <motion.button whileTap={{ scale: 0.95 }} onClick={limpiar}
            style={{
              padding: '6px', borderRadius: 6, border: '1px solid #D1D5DB',
              background: '#fff', color: '#6B7280', fontSize: 11, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            }}
          ><X size={12} /> Limpiar filtros</motion.button>
        </motion.div>
      )}

      {cargando && <div style={{ textAlign: 'center', padding: 20, color: '#9CA3AF' }}><Loader size={20} className="animate-spin" /></div>}

      {items.length === 0 && !cargando ? (
        <p style={{ color: '#9CA3AF', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>Sin resultados</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {items.map(r => (
            <motion.div key={r.id} whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (r.estado === 'Completada' || r.estado === 'Cancelada') return;
                navigate(`/ticket?ticket=${r.id}`);
              }}
              style={{
                padding: '10px 12px', background: '#fff', borderRadius: 8,
                border: '1px solid #E5E7EB', cursor: 'pointer',
                opacity: (r.estado === 'Completada' || r.estado === 'Cancelada') ? 0.6 : 1,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#1F2937' }}>{r.tipo_requerimiento}</span>
                <span style={{ fontSize: 10, color: '#9CA3AF' }}>
                  <span style={{
                    fontWeight: 600, padding: '1px 5px', borderRadius: 3,
                    background: `${colorPrioridad[r.prioridad] || '#6b7280'}18`,
                    color: colorPrioridad[r.prioridad] || '#6b7280',
                  }}>{r.prioridad}</span>
                  {' · '}
                  <span style={{
                    fontWeight: 600, padding: '1px 5px', borderRadius: 3,
                    background: `${colorEstado[r.estado] || '#6b7280'}18`,
                    color: colorEstado[r.estado] || '#6b7280',
                  }}>{r.estado}</span>
                </span>
              </div>
              {r.descripcion && (
                <div style={{ fontSize: 11, color: '#374151', lineHeight: 1.4, marginBottom: 3 }}>{r.descripcion}</div>
              )}
              <div style={{ fontSize: 10, color: '#9CA3AF', display: 'flex', justifyContent: 'space-between' }}>
                <span>{r.lugar_nombre || ''}</span>
                <span>{new Date(r.created_at).toLocaleDateString('es-CL', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {totalPaginas > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '16px 0' }}>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => irPagina(1)} disabled={pagina === 1}
            style={{ background: 'none', border: 'none', cursor: pagina === 1 ? 'default' : 'pointer', color: pagina === 1 ? '#D1D5DB' : '#374151', padding: 4 }}>
            {'<<'}
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => irPagina(pagina - 1)} disabled={pagina === 1}
            style={{ background: 'none', border: 'none', cursor: pagina === 1 ? 'default' : 'pointer', color: pagina === 1 ? '#D1D5DB' : '#374151', padding: 4, display: 'flex' }}>
            <ChevronLeft size={18} />
          </motion.button>
          <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{pagina} / {totalPaginas}</span>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => irPagina(pagina + 1)} disabled={pagina === totalPaginas}
            style={{ background: 'none', border: 'none', cursor: pagina === totalPaginas ? 'default' : 'pointer', color: pagina === totalPaginas ? '#D1D5DB' : '#374151', padding: 4, display: 'flex' }}>
            <ChevronRight size={18} />
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => irPagina(totalPaginas)} disabled={pagina === totalPaginas}
            style={{ background: 'none', border: 'none', cursor: pagina === totalPaginas ? 'default' : 'pointer', color: pagina === totalPaginas ? '#D1D5DB' : '#374151', padding: 4 }}>
            {'>>'}
          </motion.button>
        </div>
      )}
    </div>
  );
}
