import { useState, useEffect } from 'react';
import { obtenerAusenciasActivas } from '../services/funcionarioAusencias';
import { handleError } from '../utils/errorHandler';

interface AusenciaRow {
  id: string;
  tipo: string;
  motivo?: string | null;
  funcionarios: { nombre_completo: string } | null;
}

interface Props {
  nombre: string;
  onNavegar: (ruta: string) => void;
}

function saludo(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 18) return 'Buenas tardes';
  return 'Buenas noches';
}

export default function DashboardSecretaria({ nombre, onNavegar }: Props) {
  const [ausencias, setAusencias] = useState<AusenciaRow[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    obtenerAusenciasActivas()
      .then(data => setAusencias(data as AusenciaRow[]))
      .catch(e => handleError(e, 'Error al cargar ausencias activas'))
      .finally(() => setCargando(false));
  }, []);

  const licencias = ausencias.filter(a => a.tipo === 'licencia');
  const permisos = ausencias.filter(a => a.tipo === 'permiso_admin');
  const compensados = ausencias.filter(a => a.tipo === 'otro' && a.motivo === 'Día compensado');

  return (
    <div style={{ padding: '32px', maxWidth: '900px', margin: '0 auto' }}>
      {/* Saludo */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 600, color: '#1A3C6B', margin: '0 0 6px 0' }}>
          {saludo()}, {nombre || 'Secretaría'}
        </h1>
        <p style={{ fontSize: '15px', color: '#6B7280', margin: 0 }}>
          Panel de gestión administrativa
        </p>
      </div>

      {/* Resumen de ausencias */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1A3C6B', margin: '0 0 16px 0' }}>
          Resumen del día
        </h2>
        {cargando ? (
          <p style={{ color: '#999', fontStyle: 'italic' }}>Cargando…</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            <div style={{
              padding: '20px', borderRadius: '10px', backgroundColor: '#FFF7ED',
              border: '1px solid #FFEDD5',
            }}>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#C2410C' }}>{ausencias.length}</div>
              <div style={{ fontSize: '13px', color: '#9A3412', fontWeight: 500 }}>Total ausentes</div>
            </div>
            <div style={{
              padding: '20px', borderRadius: '10px', backgroundColor: '#FEF3C7',
              border: '1px solid #FDE68A',
            }}>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#92400E' }}>{licencias.length}</div>
              <div style={{ fontSize: '13px', color: '#78350F', fontWeight: 500 }}>Licencias médicas</div>
            </div>
            <div style={{
              padding: '20px', borderRadius: '10px', backgroundColor: '#E0F2FE',
              border: '1px solid #BAE6FD',
            }}>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#0369A1' }}>{permisos.length}</div>
              <div style={{ fontSize: '13px', color: '#075985', fontWeight: 500 }}>Permisos administrativos</div>
            </div>
            <div style={{
              padding: '20px', borderRadius: '10px', backgroundColor: '#D1FAE5',
              border: '1px solid #A7F3D0',
            }}>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#065F46' }}>{compensados.length}</div>
              <div style={{ fontSize: '13px', color: '#064E3B', fontWeight: 500 }}>Días compensados</div>
            </div>
          </div>
        )}
      </div>

      {/* Acciones rápidas */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1A3C6B', margin: '0 0 16px 0' }}>
          Acciones rápidas
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          <button type="button" onClick={() => onNavegar('/secretaria/enviar-correo')} style={estiloBotonAccion('#EFF6FF', '#1E40AF')}>
            <span style={{ fontSize: '24px' }}>✉️</span>
            <span>Enviar correo</span>
          </button>
          <button type="button" onClick={() => onNavegar('/mantenedor-funcionarios')} style={estiloBotonAccion('#F0FDF4', '#166534')}>
            <span style={{ fontSize: '24px' }}>👤</span>
            <span>Personal nuevo / Modificar</span>
          </button>
          <button type="button" onClick={() => onNavegar('/secretaria/ausentes')} style={estiloBotonAccion('#FFF7ED', '#9A3412')}>
            <span style={{ fontSize: '24px' }}>📋</span>
            <span>Registrar ausente</span>
          </button>
        </div>
      </div>

      {/* Lista de ausentes hoy */}
      {!cargando && ausencias.length > 0 && (
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1A3C6B', margin: '0 0 16px 0' }}>
            Ausentes hoy
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {ausencias.slice(0, 10).map(a => (
              <div key={a.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 16px', backgroundColor: '#F9FAFB', borderRadius: '8px',
                border: '1px solid #E5E7EB',
              }}>
                <span style={{ fontWeight: 500, color: '#1A3C6B', fontSize: '14px' }}>
                  {a.funcionarios?.nombre_completo || '—'}
                </span>
                <span style={{
                  padding: '3px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 600,
                  backgroundColor: a.tipo === 'licencia' ? '#FEF3C7' : a.tipo === 'permiso_admin' ? '#E0F2FE' : '#D1FAE5',
                  color: a.tipo === 'licencia' ? '#92400E' : a.tipo === 'permiso_admin' ? '#0369A1' : '#065F46',
                }}>
                  {a.tipo === 'licencia' ? 'Licencia' : a.tipo === 'permiso_admin' ? 'Permiso' : 'Compensado'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!cargando && ausencias.length === 0 && (
        <p style={{ color: '#999', fontStyle: 'italic', textAlign: 'center', padding: '32px' }}>
          No hay ausencias registradas hoy
        </p>
      )}
    </div>
  );
}

function estiloBotonAccion(bg: string, color: string): React.CSSProperties {
  return {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
    padding: '24px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer',
    backgroundColor: bg, color, fontWeight: 600, fontSize: '13px',
    transition: 'opacity 0.15s',
  };
}
