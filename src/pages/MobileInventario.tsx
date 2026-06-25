import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTheme } from '../hooks/useTheme';
import styles from '../styles/mobile-inventario.module.css';

interface Props { idEstablecimiento: string }

interface Equipo {
  id: string;
  nombre: string;
  marca: string;
  modelo: string;
  tipo_equipo: string;
  numero_serie: string;
  estado: string;
  lugar_nombre?: string;
  foto_url?: string;
}

interface Categoria {
  key: string;
  label: string;
  match: string[];
}

const CATEGORIES: Categoria[] = [
  { key: 'TODOS', label: 'Todo', match: [] },
  { key: 'PC', label: 'Computador AIO', match: ['PC', 'AIO', 'COMPUTADOR', 'DESKTOP'] },
  { key: 'NOTEBOOK', label: 'Notebook', match: ['NOTEBOOK', 'LAPTOP', 'PORTATIL'] },
  { key: 'PRINTERS', label: 'Impresora', match: ['PRINTER', 'IMPRESORA', 'IMPRESOR'] },
  { key: 'PROYECTORES', label: 'Proyector', match: ['PROYECTOR'] },
  { key: 'REDES', label: 'Redes', match: ['WIFI', 'RED', 'INTERNET', 'CABLE', 'ROUTER', 'SWITCH', 'ACCESS POINT', 'AP'] },
];

const STATUS_CONFIG: Record<string, { className: string; label: string }> = {
  Operativo: { className: styles.badgeAvailable, label: 'Operativo' },
  'Con Fallas': { className: styles.badgeMaintenance, label: 'Con Fallas' },
  'En Reparación': { className: styles.badgeRepair, label: 'En Reparac.' },
  Baja: { className: styles.badgeInactive, label: 'Inactivo' },
};

const DEFAULT_STATUS = { className: styles.badgeInactive, label: 'Unknown' };

function getStatusIcon(estado: string): string {
  switch (estado) {
    case 'Operativo': return 'check_circle';
    case 'Con Fallas': return 'warning';
    case 'En Reparación': return 'build';
    case 'Baja': return 'cancel';
    default: return 'help';
  }
}

function getCategoryIcon(cat: string): string {
  switch (cat) {
    case 'PC': return 'desktop_windows';
    case 'NOTEBOOK': return 'laptop';
    case 'PRINTERS': return 'print';
    case 'PROYECTORES': return 'videocam';
    case 'REDES': return 'router';
    default: return 'devices';
  }
}

export default function MobileInventario({ idEstablecimiento }: Props) {
  const navigate = useNavigate();
  const { temaOscuro, setTemaOscuro } = useTheme();
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('TODOS');

  useEffect(() => {
    if (!idEstablecimiento) return;
    let activo = true;

    (async () => {
      try {
        const { data, error } = await supabase
          .from('equipos')
          .select('id,nombre,marca,modelo,tipo_equipo,numero_serie,estado,id_lugar')
          .eq('id_establecimiento', idEstablecimiento)
          .order('nombre', { ascending: true });

        if (error) throw error;
        if (!activo) return;

        const equiposData = (data || []).map(e => ({
          ...e,
          lugar_nombre: '',
        })) as Equipo[];

        setEquipos(equiposData);
      } catch (e) {
        console.error('Error al cargar inventario:', e);
      }
      if (activo) setCargando(false);
    })();

    return () => { activo = false; };
  }, [idEstablecimiento]);

  const filtered = equipos.filter(eq => {
    if (categoria !== 'TODOS') {
      const tipo = eq.tipo_equipo?.toUpperCase() ?? '';
      const cat = CATEGORIES.find(c => c.key === categoria);
      const matches = cat?.match.some(m => tipo.includes(m)) ?? false;
      if (!matches) return false;
    }
    if (busqueda) {
      const q = busqueda.toLowerCase();
      const match = (eq.nombre?.toLowerCase().includes(q) ?? false) ||
        (eq.numero_serie?.toLowerCase().includes(q) ?? false) ||
        (eq.marca?.toLowerCase().includes(q) ?? false);
      if (!match) return false;
    }
    return true;
  });

  if (cargando) return (
    <div className={styles.container} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <div className={styles.loading}><Loader size={24} className="animate-spin" /></div>
    </div>
  );

  return (
    <div className={styles.container}>
      {/* TopAppBar */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 56, padding: '0 16px', position: 'sticky', top: 0,
        background: temaOscuro ? '#111827' : '#f8f9fb', zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => navigate('/tecnico/m/inicio')}
            style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 9999, border: 'none', background: 'transparent', cursor: 'pointer' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>arrow_back</span>
          </button>
          <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: temaOscuro ? '#f3f4f6' : '#191c1e' }}>Soporte TI</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button onClick={() => setTemaOscuro(!temaOscuro)}
            style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 9999, border: 'none', background: 'transparent', cursor: 'pointer' }}
            title={temaOscuro ? 'Modo claro' : 'Modo oscuro'}>
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
              {temaOscuro ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
        </div>
      </header>

      {/* Search */}
      <div className={styles.searchSection}>
        <div className={styles.searchWrapper}>
          <span className={`${styles.searchIcon} material-symbols-outlined`} style={{ fontSize: 20 }}>search</span>
          <input
            className={styles.searchInput}
            placeholder="Buscar equipo o ID..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      {/* Categories */}
      <div className={styles.categories}>
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            className={categoria === cat.key ? styles.chipActive : styles.chipInactive}
            onClick={() => setCategoria(cat.key)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Count & Sort */}
      <div className={styles.assetHeader}>
        <span className={styles.assetCount}>
          {filtered.length} Activos Encontrados
        </span>
        <button className={styles.filterBtn}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>sort</span>
          FILTRAR
        </button>
      </div>

      {/* Asset List */}
      {filtered.length === 0 ? (
        <div className={styles.empty}>
          No se encontraron activos con esos filtros
        </div>
      ) : (
        <div className={styles.assetList}>
          {filtered.slice(0, categoria === 'TODOS' ? 5 : 10).map(eq => {
            const statusCfg = STATUS_CONFIG[eq.estado] || DEFAULT_STATUS;
            return (
              <motion.div
                key={eq.id}
                className={styles.assetCard}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/tecnico/m/equipos?q=${eq.id}`)}
              >
                <div className={styles.assetImage}>
                  <span className="material-symbols-outlined" style={{ fontSize: 28, opacity: 0.5 }}>
                    {getCategoryIcon(eq.tipo_equipo?.toUpperCase() || '')}
                  </span>
                </div>
                <div className={styles.assetInfo}>
                  <div className={styles.assetTop}>
                    <div>
                      <h3 className={styles.assetName}>{eq.nombre || `${eq.marca} ${eq.modelo}`}</h3>
                      <p className={styles.assetSerial}>
                        <span className="material-symbols-outlined" style={{ fontSize: 10, verticalAlign: 'middle', marginRight: 2 }}>barcode</span>
                        SN: {eq.numero_serie || 'N/A'}
                      </p>
                    </div>
                    <span className={statusCfg.className}>
                      <span className="material-symbols-outlined" style={{ fontSize: 10, verticalAlign: 'middle', marginRight: 2 }}>
                        {getStatusIcon(eq.estado)}
                      </span>
                      {statusCfg.label}
                    </span>
                  </div>
                  <div className={styles.assetLocation}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>location_on</span>
                    <span>{eq.lugar_nombre || 'Sin ubicación'}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
          {(() => {
            const limite = categoria === 'TODOS' ? 5 : 10;
            if (filtered.length <= limite) return null;
            return (
              <motion.div
                className={styles.assetCard}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/tecnico/m/equipos')}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: 0.7 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 22 }}>arrow_forward</span>
                <span style={{ fontSize: 14, fontWeight: 500 }}>Ver más ({filtered.length - limite} más)</span>
              </motion.div>
            );
          })()}
        </div>
      )}

      {/* FAB */}
      <button className={styles.fab} onClick={() => navigate('/tecnico/m/equipos')}>
        <span className="material-symbols-outlined" style={{ fontSize: 28 }}>add</span>
      </button>
    </div>
  );
}
