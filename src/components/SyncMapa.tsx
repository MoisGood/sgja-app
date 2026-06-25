import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { showSuccess, showError } from '../utils/errorHandler';
import { Loader, CheckCircle, PlusCircle, AlertTriangle, Search, X, Link } from 'lucide-react';

interface SalaData {
  left: number; top: number; width: number; height: number;
  text: string; zone: string; color: string | null;
}

interface LugarDB {
  id: string; nombre: string; zona: string; piso: number; activo: boolean;
}

type Planos = Record<string, SalaData[]>;

interface Props {
  idEstablecimiento: string;
}

function pisoKeyToInt(key: string): number {
  const m = key.match(/(\d+)/);
  if (m) return parseInt(m[1], 10);
  const k = key.toLowerCase();
  if (k.includes('subte') || k.includes('sotano') || k.includes('bajo') || k.includes('sub')) return 0;
  if (k.includes('pb') || k.includes('planta')) return 0;
  return 0;
}

export default function SyncMapa({ idEstablecimiento }: Props) {
  const [cargando, setCargando] = useState(true);
  const [sinDB, setSinDB] = useState<{ sala: SalaData; piso: string; pisoNum: number }[]>([]);
  const [soloDB, setSoloDB] = useState<LugarDB[]>([]);
  const [synced, setSynced] = useState<{ sala: SalaData; lugar: LugarDB }[]>([]);
  const [creando, setCreando] = useState<Set<string>>(new Set());
  const [buscando, setBuscando] = useState<string | null>(null);
  const [resultados, setResultados] = useState<LugarDB[]>([]);
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState<'sinDB' | 'soloDB' | null>(null);


  useEffect(() => {
    if (!idEstablecimiento) return;
    setCargando(true);

    Promise.all([
      fetch('/plano_edificio.json').then(r => r.ok ? r.json() : Promise.reject('No hay plano')),
      supabase.from('lugares').select('id,nombre,zona,piso,activo').eq('id_establecimiento', idEstablecimiento).eq('activo', true),
    ]).then(([jsonData, { data: dbData }]) => {
      const planos = Array.isArray(jsonData) ? { 'Piso 1': jsonData } : jsonData as Planos;
      const dbList = (dbData || []) as LugarDB[];
      const dbMap = new Map(dbList.map(l => [l.nombre.toLowerCase().trim(), l]));

      const noMatch: { sala: SalaData; piso: string; pisoNum: number }[] = [];
      const matched: { sala: SalaData; lugar: LugarDB }[] = [];

      const enJSON = new Set<string>();

      for (const [pisoKey, salas] of Object.entries(planos)) {
        const pisoNum = pisoKeyToInt(pisoKey);
        for (const sala of salas) {
          const key = sala.text.toLowerCase().trim();
          enJSON.add(key);
          if (dbMap.has(key)) matched.push({ sala, lugar: dbMap.get(key)! });
          else noMatch.push({ sala, piso: pisoKey, pisoNum });
        }
      }

      const soloEnDB = dbList.filter(l => !enJSON.has(l.nombre.toLowerCase().trim()));

      setSinDB(noMatch);
      setSoloDB(soloEnDB);
      setSynced(matched);
      setCargando(false);
    }).catch(() => setCargando(false));
  }, [idEstablecimiento]);

  async function crearLugar(sala: SalaData, pisoNum: number) {
    const key = sala.text.toLowerCase().trim();
    if (creando.has(key)) return;
    setCreando(prev => new Set(prev).add(key));
    try {
      const { error } = await supabase.from('lugares').insert({
        id_establecimiento: idEstablecimiento,
        nombre: sala.text.trim(),
        zona: sala.zone || 'otro',
        piso: pisoNum,
        activo: true,
        left_pos: 0, top_pos: 0, width: 140, height: 105,
      });
      if (error) { showError(error.message); return; }
      showSuccess(`"${sala.text}" creado en la tabla lugares`);
      setSinDB(prev => prev.filter(p => p.sala.text.toLowerCase().trim() !== key));
    } catch { showError('Error al crear lugar'); }
    finally { setCreando(prev => { const n = new Set(prev); n.delete(key); return n; }); }
  }

  async function buscarLugar(nombre: string) {
    setBuscando(nombre);
    setQuery(nombre);
    const { data } = await supabase
      .from('lugares').select('id,nombre,zona,piso,activo')
      .eq('id_establecimiento', idEstablecimiento).eq('activo', true);
    setResultados((data || []).filter(l => l.nombre.toLowerCase().trim() !== nombre.toLowerCase().trim()));
  }

  async function vincular(sala: SalaData, lugar: LugarDB) {
    showSuccess(`"${sala.text}" vinculado a "${lugar.nombre}"`);
    setSinDB(prev => prev.filter(p => p.sala.text.toLowerCase().trim() !== sala.text.toLowerCase().trim()));
    setResultados([]);
    setBuscando(null);
  }

  if (cargando) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
      <Loader className="animate-spin" size={24} />
    </div>
  );

  const cardStyle: React.CSSProperties = {
    background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
    padding: 16, marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>
        Esta herramienta compara las salas dibujadas en el <strong>plano (JSON)</strong> con los registros de la
        tabla <strong>lugares (base de datos)</strong>. El objetivo es que cada sala del plano tenga su
        correspondiente lugar en la base de datos, así al tocar una sala en el mapa móvil se pueda usar
        su <strong>ID</strong> para crear tickets.
      </p>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ ...cardStyle, flex: 1, minWidth: 130, textAlign: 'center', padding: '16px 12px', cursor: 'default' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#22c55e' }}>{synced.length}</div>
          <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>Sincronizados</div>
        </div>
        <div onClick={() => sinDB.length > 0 && setModal('sinDB')} style={{
          ...cardStyle, flex: 1, minWidth: 130, textAlign: 'center', padding: '16px 12px',
          cursor: sinDB.length > 0 ? 'pointer' : 'default', transition: 'box-shadow .15s',
        }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: sinDB.length ? '#d97706' : '#22c55e' }}>{sinDB.length}</div>
          <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>En mapa, sin DB</div>
        </div>
        <div onClick={() => soloDB.length > 0 && setModal('soloDB')} style={{
          ...cardStyle, flex: 1, minWidth: 130, textAlign: 'center', padding: '16px 12px',
          cursor: soloDB.length > 0 ? 'pointer' : 'default', transition: 'box-shadow .15s',
        }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: soloDB.length ? '#3b82f6' : '#22c55e' }}>{soloDB.length}</div>
          <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>En DB, sin mapa</div>
        </div>
      </div>

      {/* Sección 1: En mapa, sin DB */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#1f2937', display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertTriangle size={16} color="#d97706" /> Salas del plano sin lugar en base de datos
          </h3>
          {sinDB.length > 0 && (
            <button onClick={async () => { for (const item of sinDB) await crearLugar(item.sala, item.pisoNum); }}
              style={{
                padding: '6px 16px', borderRadius: 6, border: 'none',
                background: '#059669', color: '#fff', fontSize: 12,
                fontWeight: 600, cursor: 'pointer',
              }}>
              Crear todos ({sinDB.length})
            </button>
          )}
        </div>
        <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 12px 0' }}>
          Estas salas existen en el plano (mapa móvil) pero no tienen un registro en la tabla <em>lugares</em>.
          Crearlas en DB hará que aparezcan también en el mapa desktop y se pueda generar tickets con su ID.
        </p>
        {sinDB.length === 0 ? (
          <p style={{ color: '#22c55e', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
            <CheckCircle size={14} /> Todas las salas del plano tienen su lugar en DB
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {sinDB.map((item, i) => (
              <div key={i}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 10px', borderRadius: 8,
                  background: '#fefce8', border: '1px solid #fde68a',
                }}>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: '#1f2937' }}>{item.sala.text}</span>
                  <span style={{
                    padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600,
                    background: '#e5e7eb', color: '#374151', whiteSpace: 'nowrap',
                  }}>{item.piso}</span>
                  <button onClick={() => crearLugar(item.sala, item.pisoNum)} disabled={creando.has(item.sala.text.toLowerCase().trim())}
                    style={{
                      padding: '6px 14px', borderRadius: 6, border: 'none',
                      background: creando.has(item.sala.text.toLowerCase().trim()) ? '#94a3b8' : '#2563eb',
                      color: '#fff', fontSize: 12, fontWeight: 600,
                      cursor: creando.has(item.sala.text.toLowerCase().trim()) ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                    {creando.has(item.sala.text.toLowerCase().trim()) ? <Loader size={12} className="animate-spin" /> : <PlusCircle size={12} />}
                    Crear en DB
                  </button>
                  <button onClick={() => buscarLugar(item.sala.text)}
                    style={{
                      padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db',
                      background: '#fff', color: '#374151', fontSize: 12,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                    <Search size={12} /> Buscar
                  </button>
                </div>
                {/* Search results inline */}
                {buscando === item.sala.text && (
                  <div style={{ marginTop: 6, padding: '8px 12px', background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                      <input value={query} onChange={e => setQuery(e.target.value)}
                        placeholder="Buscar lugar en DB..."
                        style={{
                          flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db',
                          fontSize: 12, outline: 'none',
                        }} />
                      <button onClick={() => setBuscando(null)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                        <X size={14} />
                      </button>
                    </div>
                    {resultados.filter(l => query ? l.nombre.toLowerCase().includes(query.toLowerCase()) : true).map(l => (
                      <div key={l.id} style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px',
                        borderBottom: '1px solid #e5e7eb', fontSize: 12,
                      }}>
                        <span style={{ flex: 1 }}>{l.nombre} <span style={{ color: '#9ca3af' }}>(Piso {l.piso})</span></span>
                        <button onClick={() => vincular(item.sala, l)}
                          style={{
                            padding: '4px 10px', borderRadius: 4, border: 'none',
                            background: '#7c3aed', color: '#fff', fontSize: 11,
                            fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                          }}>
                          <Link size={10} /> Vincular
                        </button>
                      </div>
                    ))}
                    {resultados.length === 0 && <p style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center', margin: 8 }}>Sin resultados</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sección 2: En DB, sin mapa */}
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: 15, fontWeight: 600, color: '#1f2937', display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertTriangle size={16} color="#3b82f6" /> Lugares en DB sin sala en el plano
        </h3>
        <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 12px 0' }}>
          Estos lugares existen en la base de datos pero no están dibujados en el plano (JSON). Para usarlos en el mapa móvil, deberías agregarlos en el editor de plano.
        </p>
        {soloDB.length === 0 ? (
          <p style={{ color: '#22c55e', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
            <CheckCircle size={14} /> Todos los lugares en DB están dibujados en el plano
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {soloDB.map(lugar => (
              <div key={lugar.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px', borderRadius: 8,
                background: '#eff6ff', border: '1px solid #bfdbfe',
              }}>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: '#1f2937' }}>{lugar.nombre}</span>
                <span style={{
                  padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600,
                  background: '#e5e7eb', color: '#374151', whiteSpace: 'nowrap',
                }}>Piso {lugar.piso}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sección 3: Sincronizados */}
      {synced.length > 0 && (
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: 15, fontWeight: 600, color: '#1f2937', display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle size={16} color="#22c55e" /> Sincronizados ({synced.length})
          </h3>
          <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 12px 0' }}>
            Estas salas existen en el plano y también en DB. Coinciden por nombre exacto.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {synced.map((item, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px',
                fontSize: 13, color: '#374151',
              }}>
                <CheckCircle size={14} color="#22c55e" />
                <span>{item.sala.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <>
          <div onClick={() => setModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 999 }} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', translate: '-50% -50%',
            zIndex: 1000, background: '#fff', borderRadius: 12, padding: 24,
            width: '90%', maxWidth: 480, maxHeight: '80vh', overflow: 'auto',
            boxShadow: '0 10px 40px rgba(0,0,0,.2)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#1f2937', display: 'flex', alignItems: 'center', gap: 6 }}>
                {modal === 'sinDB' ? <><AlertTriangle size={16} color="#d97706" /> Salas del plano sin DB ({sinDB.length})</> : <><AlertTriangle size={16} color="#3b82f6" /> Lugares en DB sin mapa ({soloDB.length})</>}
              </h3>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 4 }}><X size={18} /></button>
            </div>
            {modal === 'sinDB' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {sinDB.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: '#fefce8', borderRadius: 8, fontSize: 13 }}>
                    <span style={{ flex: 1, fontWeight: 500 }}>{item.sala.text}</span>
                    <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600, background: '#e5e7eb', color: '#374151' }}>{item.piso}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {soloDB.map(lugar => (
                  <div key={lugar.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: '#eff6ff', borderRadius: 8, fontSize: 13 }}>
                    <span style={{ flex: 1, fontWeight: 500 }}>{lugar.nombre}</span>
                    <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600, background: '#e5e7eb', color: '#374151' }}>Piso {lugar.piso}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
