import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import type { Lugar } from '../types';

interface Props {
  idEstablecimiento: string;
}

const ITEMS_POR_PAGINA = 15;
const PISOS = ['Todos', 'Subterráneo', 'Piso 1', 'Piso 2', 'Piso 3'];

export default function ConfigurarMapa({ idEstablecimiento }: Props) {
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [cargando, setCargando] = useState(true);
  const [verLista, setVerLista] = useState(false);
  const [filtroPiso, setFiltroPiso] = useState<number | null>(null);
  const [pagina, setPagina] = useState(1);

  async function load() {
    const { data } = await supabase
      .from('lugares')
      .select('*')
      .eq('id_establecimiento', idEstablecimiento)
      .order('piso')
      .order('nombre');
    if (data) setLugares(data);
    setCargando(false);
  }

  useEffect(() => {
    if (idEstablecimiento) load();
  }, [idEstablecimiento]);

  const filtrados = useMemo(() => {
    let items = lugares;
    if (filtroPiso !== null) items = items.filter(l => l.piso === filtroPiso);
    return items;
  }, [lugares, filtroPiso]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / ITEMS_POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const inicio = (paginaActual - 1) * ITEMS_POR_PAGINA;
  const paginados = filtrados.slice(inicio, inicio + ITEMS_POR_PAGINA);

  async function toggleActivo(lugar: Lugar) {
    const nuevoActivo = !lugar.activo;
    const { error } = await supabase.from('lugares').update({ activo: nuevoActivo }).eq('id', lugar.id).eq('id_establecimiento', idEstablecimiento);
    if (error) { console.error('Error toggleActivo:', error); alert('Error al guardar Activo: ' + error.message); return; }
    setLugares(prev => prev.map(l => l.id === lugar.id ? { ...l, activo: nuevoActivo } : l));
  }

  async function toggleSoporte(lugar: Lugar) {
    const nuevoSoporte = !(lugar.soporte !== false);
    const { error } = await supabase.from('lugares').update({ soporte: nuevoSoporte }).eq('id', lugar.id).eq('id_establecimiento', idEstablecimiento);
    if (error) { console.error('Error toggleSoporte:', error); alert('Error al guardar Soporte: ' + error.message); return; }
    setLugares(prev => prev.map(l => l.id === lugar.id ? { ...l, soporte: nuevoSoporte } : l));
  }

  if (cargando) return <p style={{ color: '#6b7280' }}>⏳ Cargando ubicaciones…</p>;

  return (
    <div>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 16, flexWrap: 'wrap', gap: 8,
      }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#1f2937' }}>
          Ubicaciones de lugares en mapa json
        </h3>
        <button
          onClick={() => setVerLista(!verLista)}
          style={{
            padding: '8px 16px', borderRadius: 8, border: 'none',
            background: '#2563eb', color: '#fff', fontSize: 13,
            cursor: 'pointer', fontWeight: 500,
          }}
        >
          {verLista ? 'Ocultar lista' : 'Ver lista'}
        </button>
      </div>

      {verLista && (
        <div style={{
          background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8,
          padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}>
          <div style={{
            display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12,
            flexWrap: 'wrap', background: '#f9fafb', padding: '10px 14px',
            borderRadius: 6, border: '1px solid #e5e7eb',
          }}>
            <label style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>
              Filtrar por piso:
            </label>
            <select
              value={filtroPiso === null ? 'Todos' : String(filtroPiso)}
              onChange={e => {
                const val = e.target.value;
                setFiltroPiso(val === 'Todos' ? null : Number(val));
                setPagina(1);
              }}
              style={{
                padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db',
                background: '#fff', color: '#1f2937', fontSize: 13,
              }}
            >
              {PISOS.map((p, i) => (
                <option key={i} value={i === 0 ? 'Todos' : String(i - 1)}>{p}</option>
              ))}
            </select>
            <span style={{ fontSize: 13, color: '#6b7280' }}>
              {filtrados.length} {filtrados.length === 1 ? 'ubicación' : 'ubicaciones'}
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}>
                  <th style={thS}>Nombre del lugar</th>
                  <th style={thS}>Piso</th>
                  <th style={{ ...thS, width: 70, textAlign: 'center' }}>Activo</th>
                  <th style={{ ...thS, width: 70, textAlign: 'center' }}>Soporte</th>
                </tr>
              </thead>
              <tbody>
                {paginados.map(l => (
                  <tr key={l.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={tdS}>{l.nombre}</td>
                    <td style={tdS}>{PISOS[l.piso + 1] || `Piso ${l.piso}`}</td>
                    <td style={{ ...tdS, textAlign: 'center' }}>
                      <button
                        onClick={() => toggleActivo(l)}
                        style={{
                          padding: '4px 12px', borderRadius: 6, border: 'none',
                          background: l.activo ? '#dcfce7' : '#fee2e2',
                          color: l.activo ? '#166534' : '#991b1b',
                          fontSize: 12, cursor: 'pointer', fontWeight: 500,
                        }}
                      >
                        {l.activo ? 'Sí' : 'No'}
                      </button>
                    </td>
                    <td style={{ ...tdS, textAlign: 'center' }}>
                      <button
                        onClick={() => toggleSoporte(l)}
                        style={{
                          padding: '4px 12px', borderRadius: 6, border: 'none',
                          background: l.soporte !== false ? '#dcfce7' : '#fef9c3',
                          color: l.soporte !== false ? '#166534' : '#92400e',
                          fontSize: 12, cursor: 'pointer', fontWeight: 500,
                        }}
                      >
                        {l.soporte !== false ? 'Sí' : 'No'}
                      </button>
                    </td>
                  </tr>
                ))}
                  {paginados.length === 0 && (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: 32, color: '#9ca3af' }}>Sin ubicaciones</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPaginas > 1 && (
            <div style={{
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              gap: 12, marginTop: 16, paddingTop: 12, borderTop: '1px solid #e5e7eb',
            }}>
              <button
                onClick={() => setPagina(p => Math.max(1, p - 1))}
                disabled={paginaActual <= 1}
                style={{
                  padding: '6px 14px', borderRadius: 6, border: '1px solid #d1d5db',
                  background: '#fff', color: paginaActual <= 1 ? '#9ca3af' : '#374151',
                  fontSize: 13, cursor: paginaActual <= 1 ? 'default' : 'pointer',
                }}
              >
                « Anterior
              </button>
              <span style={{ fontSize: 13, color: '#6b7280' }}>
                Pág. {paginaActual} de {totalPaginas}
              </span>
              <button
                onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                disabled={paginaActual >= totalPaginas}
                style={{
                  padding: '6px 14px', borderRadius: 6, border: '1px solid #d1d5db',
                  background: '#fff', color: paginaActual >= totalPaginas ? '#9ca3af' : '#374151',
                  fontSize: 13, cursor: paginaActual >= totalPaginas ? 'default' : 'pointer',
                }}
              >
                Siguiente »
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const thS: React.CSSProperties = {
  padding: '10px 14px', textAlign: 'left', fontWeight: 600,
  fontSize: 12, color: '#374151', borderBottom: '2px solid #e5e7eb',
};
const tdS: React.CSSProperties = {
  padding: '8px 14px', borderBottom: '1px solid #e5e7eb', color: '#1f2937',
};
