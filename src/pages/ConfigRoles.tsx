import { useState, useEffect, useCallback } from 'react';
import { obtenerReglas, guardarRegla } from '../services/library';
import type { LibraryRule } from '../types';

interface Props { idEstablecimiento: string }

const ROLES = ['ESTUDIANTE', 'PROFESOR', 'INSPECTOR', 'BIBLIOTECARIO'];

const DEFAULT_RULES = {
  dias_prestamo: 7,
  max_renovaciones: 2,
  max_prestamos_simultaneos: 3,
  multa_diaria: 0,
};

type Campo = keyof typeof DEFAULT_RULES;
type ReglaKey = string;

export default function ConfigRoles({ idEstablecimiento }: Props) {
  const [reglas, setReglas] = useState<Record<ReglaKey, LibraryRule>>({});
  const [editando, setEditando] = useState(false);
  const [valores, setValores] = useState<Record<ReglaKey, LibraryRule>>({});
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    const data = await obtenerReglas(idEstablecimiento);
    const map: Record<ReglaKey, LibraryRule> = {};
    for (const r of data) map[r.rol] = r;
    setReglas(map);
    setCargando(false);
  }, [idEstablecimiento]);

  useEffect(() => { cargar(); }, [cargar]);

  const iniciarEdicion = () => {
    const nuevos: Record<ReglaKey, LibraryRule> = {};
    for (const rol of ROLES) {
      nuevos[rol] = reglas[rol] || { ...DEFAULT_RULES, rol, id_establecimiento: idEstablecimiento, id: '', activo: true } as any;
    }
    setValores(nuevos);
    setEditando(true);
    setError(null);
  };

  const actualizarValor = (rol: string, campo: Campo, valor: number) => {
    setValores(prev => ({
      ...prev,
      [rol]: { ...prev[rol], [campo]: valor },
    }));
  };

  const limpiar = () => {
    const limpios: Record<ReglaKey, LibraryRule> = {};
    for (const rol of ROLES) {
      limpios[rol] = { ...DEFAULT_RULES, rol, id_establecimiento: idEstablecimiento, id: '', activo: true } as any;
    }
    setValores(limpios);
  };

  const guardar = async () => {
    setGuardando(true);
    setError(null);
    const results = await Promise.all(ROLES.map(async (rol) => {
      const v = valores[rol];
      if (!v) return null;
      const res = await guardarRegla(idEstablecimiento, rol, {
        dias_prestamo: v.dias_prestamo,
        max_renovaciones: v.max_renovaciones,
        max_prestamos_simultaneos: v.max_prestamos_simultaneos,
        multa_diaria: v.multa_diaria,
      });
      return { rol, res };
    }));
    const errorResult = results.find(r => r && r.res.error);
    if (errorResult) {
      setError(`Error en ${errorResult.rol}: ${errorResult.res.error}`);
      setGuardando(false);
      return;
    }
    setExito('Reglas guardadas');
    setTimeout(() => setExito(null), 3000);
    setEditando(false);
    setGuardando(false);
    cargar();
  };

  const CAMPO_LABEL: Record<Campo, string> = {
    dias_prestamo: 'Días préstamo',
    max_renovaciones: 'Máx. renovaciones',
    max_prestamos_simultaneos: 'Máx. simultáneos',
    multa_diaria: 'Multa diaria ($)',
  };

  const CAMPOS = Object.keys(CAMPO_LABEL) as Campo[];

  return (
    <div>
      {error && <p style={{ color: '#DC2626', fontSize: '14px', marginBottom: '12px', padding: '8px 12px', background: '#FEF2F2', borderRadius: '6px' }}>{error}</p>}
      {exito && <p style={{ color: '#10B981', fontSize: '14px', marginBottom: '12px', padding: '8px 12px', background: '#F0FDF4', borderRadius: '6px' }}>{exito}</p>}

      {cargando ? <p style={{ color: '#6B7280' }}>Cargando…</p> : (
        <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflowX: 'auto' }}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            {!editando ? (
              <button type="button" onClick={iniciarEdicion} style={{ padding: '10px 20px', background: '#3B82F6', color: '#FFFFFF', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                ✎ Editar reglas
              </button>
            ) : (
              <>
                <button type="button" onClick={guardar} disabled={guardando} style={{ padding: '10px 20px', background: '#10B981', color: '#FFFFFF', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', opacity: guardando ? 0.6 : 1 }}>
                  {guardando ? '⏳' : '💾'} Guardar
                </button>
                <button type="button" onClick={limpiar} style={{ padding: '10px 20px', background: '#F59E0B', color: '#FFFFFF', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🗑️ Por defecto
                </button>
                <button type="button" onClick={() => setEditando(false)} style={{ padding: '10px 20px', background: '#6B7280', color: '#FFFFFF', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
                  ✕ Cancelar
                </button>
              </>
            )}
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #E5E7EB' }}>
                <th style={{ textAlign: 'left', padding: '12px', color: '#6B7280', fontWeight: 600 }}>Regla</th>
                {ROLES.map(rol => (
                  <th key={rol} style={{ textAlign: 'center', padding: '12px', color: '#1A3C6B', fontWeight: 700 }}>{rol}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CAMPOS.map((campo, idx) => {
                const src = editando ? valores : reglas;
                return (
                  <tr key={campo} style={{ borderBottom: '1px solid #F3F4F6', backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB' }}>
                    <td style={{ padding: '12px', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>{CAMPO_LABEL[campo]}</td>
                    {ROLES.map(rol => {
                      const val = src[rol]?.[campo] ?? DEFAULT_RULES[campo];
                      return (
                        <td key={rol} style={{ textAlign: 'center', padding: '8px' }}>
                          {editando ? (
                            campo === 'multa_diaria' ? (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                <span style={{ color: '#6B7280' }}>$</span>
                                <input
                                  type="number"
                                  value={val}
                                  onChange={e => actualizarValor(rol, campo, parseFloat(e.target.value) || 0)}
                                  style={{ width: '80px', padding: '6px 8px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '14px', textAlign: 'center' }}
                                />
                              </div>
                            ) : (
                              <input
                                type="number"
                                value={val}
                                onChange={e => actualizarValor(rol, campo, parseInt(e.target.value) || 0)}
                                style={{ width: '70px', padding: '6px 8px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '14px', textAlign: 'center' }}
                              />
                            )
                          ) : (
                            <span style={{ fontWeight: 600, color: '#111827' }}>
                              {campo === 'multa_diaria' ? `$${val}` : val}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
