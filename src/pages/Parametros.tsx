// ============================================================
// SGJA – Parámetros del Sistema
// src/pages/Parametros.tsx
// ============================================================

import { useState, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import { obtenerParametrosDelEstablecimiento, actualizarParametros, crearParametros } from '../services/database';
import type { Parametros as ParametrosType } from '../services/database';
import MantenimientoConfig from './MantenimientoConfig';
import MantenedorSistema from './MantenedorSistema';

interface Props {
  idEstablecimiento: string;
}

export default function Parametros({ idEstablecimiento }: Props) {
  const { temaOscuro, setTemaOscuro } = useTheme(); // Usar contexto global
  const [parametros, setParametros] = useState<ParametrosType | null>(null);
  const [tiempoInactividad, setTiempoInactividad] = useState(30);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);
  const [tabActivo, setTabActivo] = useState<'tiempo' | 'tema' | 'mantenimiento' | 'sistema'>('tiempo');

  useEffect(() => {
    cargarParametros();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idEstablecimiento]);

  const cargarParametros = async () => {
    try {
      setCargando(true);
      const datos = await obtenerParametrosDelEstablecimiento(idEstablecimiento);
      
      if (datos) {
        setParametros(datos);
        setTiempoInactividad(datos.tiempo_inactividad_minutos);
      } else {
        // Crear parámetros por defecto si no existen
        const nuevos = await crearParametros(idEstablecimiento, 30);
        setParametros(nuevos);
        setTiempoInactividad(nuevos.tiempo_inactividad_minutos);
      }
      setError(null);
    } catch (err) {
      setError(`Error al cargar parámetros: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setCargando(false);
    }
  };

  const handleGuardar = async () => {
    if (tiempoInactividad < 1 || tiempoInactividad > 480) {
      setError('El tiempo debe ser entre 1 y 480 minutos (8 horas)');
      return;
    }

    try {
      setGuardando(true);
      setError(null);
      await actualizarParametros(idEstablecimiento, tiempoInactividad);
      setExito(true);
      setTimeout(() => setExito(false), 3000);
    } catch (err) {
      setError(`Error al guardar parámetros: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <p style={{ color: '#666' }}>Cargando parámetros...</p>
      </div>
    );
  }

  const estilo = {
    contenedor: {
      padding: '2rem',
    },
    maxWidth: {
      maxWidth: '700px',
      margin: '0 auto',
    },
    encabezado: {
      marginBottom: '2rem',
    },
    titulo: {
      margin: '0 0 0.5rem 0',
      fontSize: '1.875rem',
      color: temaOscuro ? '#f3f4f6' : '#1f2937',
    },
    subtitulo: {
      margin: 0,
      color: temaOscuro ? '#9ca3af' : '#6b7280',
      fontSize: '0.875rem',
    },
    alerta: {
      padding: '1rem',
      marginBottom: '1rem',
      borderRadius: '0.375rem',
      fontSize: '0.875rem',
    },
    alertaError: {
      background: temaOscuro ? '#7f1d1d' : '#fee2e2',
      border: `1px solid ${temaOscuro ? '#dc2626' : '#fecaca'}`,
      color: temaOscuro ? '#fca5a5' : '#991b1b',
    },
    alertaExito: {
      background: temaOscuro ? '#064e3b' : '#dcfce7',
      border: `1px solid ${temaOscuro ? '#10b981' : '#bbf7d0'}`,
      color: temaOscuro ? '#86efac' : '#166534',
    },
    tabs: {
      display: 'flex',
      gap: '0.5rem',
      marginBottom: '1.5rem',
      borderBottom: `2px solid ${temaOscuro ? '#374151' : '#e5e7eb'}`,
    },
    tab: (activo: boolean) => ({
      padding: '0.75rem 1.5rem',
      background: 'transparent',
      border: 'none',
      borderBottom: activo ? `3px solid #3b82f6` : 'none',
      color: activo ? '#3b82f6' : temaOscuro ? '#9ca3af' : '#6b7280',
      fontSize: '0.875rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
    }),
    card: {
      padding: '1.5rem',
      background: temaOscuro ? '#1f2937' : 'white',
      border: `1px solid ${temaOscuro ? '#374151' : '#e5e7eb'}`,
      borderRadius: '0.5rem',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      marginBottom: '1.5rem',
    },
    label: {
      display: 'block',
      marginBottom: '0.5rem',
      fontSize: '0.875rem',
      fontWeight: '500',
      color: temaOscuro ? '#e5e7eb' : '#374151',
    },
    input: {
      flex: 1,
      padding: '0.5rem 0.75rem',
      fontSize: '1rem',
      border: `1px solid ${temaOscuro ? '#4b5563' : '#d1d5db'}`,
      borderRadius: '0.375rem',
      fontFamily: 'inherit',
      background: temaOscuro ? '#111827' : 'white',
      color: temaOscuro ? '#f3f4f6' : '#1f2937',
    },
    infoBox: {
      padding: '1rem',
      background: temaOscuro ? '#111827' : '#f3f4f6',
      borderRadius: '0.375rem',
      marginBottom: '1.5rem',
      fontSize: '0.875rem',
      color: temaOscuro ? '#e5e7eb' : '#374151',
    },
    botonPrimario: {
      padding: '0.75rem 1.5rem',
      background: '#3b82f6',
      color: 'white',
      border: 'none',
      borderRadius: '0.375rem',
      fontSize: '0.875rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    botonSecundario: {
      padding: '0.75rem 1.5rem',
      background: temaOscuro ? '#374151' : '#e5e7eb',
      color: temaOscuro ? '#f3f4f6' : '#374151',
      border: 'none',
      borderRadius: '0.375rem',
      fontSize: '0.875rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    toggleSwitch: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      padding: '1rem',
      background: temaOscuro ? '#111827' : '#f9fafb',
      borderRadius: '0.375rem',
      marginBottom: '1rem',
    },
    toggleLabel: {
      fontSize: '0.875rem',
      fontWeight: '500',
      color: temaOscuro ? '#e5e7eb' : '#374151',
    },
  };

  return (
    <div style={estilo.contenedor}>
      <div style={estilo.maxWidth}>
        {/* Encabezado */}
        <div style={estilo.encabezado}>
          <h1 style={estilo.titulo}>⚙️ Parámetros del Sistema</h1>
          <p style={estilo.subtitulo}>
            Configura los parámetros globales del establecimiento
          </p>
        </div>

        {/* Alertas */}
        {error && (
          <div style={{ ...estilo.alerta, ...estilo.alertaError }}>
            ⚠️ {error}
          </div>
        )}

        {exito && (
          <div style={{ ...estilo.alerta, ...estilo.alertaExito }}>
            ✅ Parámetros guardados exitosamente
          </div>
        )}

        {/* Tabs */}
        <div style={estilo.tabs}>
          <button type="button" 
            onClick={() => setTabActivo('tiempo')}
            style={estilo.tab(tabActivo === 'tiempo')}
            title="Tiempo de Inactividad"
          >
            <span>🕐</span>
          </button>
          <button type="button" 
            onClick={() => setTabActivo('tema')}
            style={estilo.tab(tabActivo === 'tema')}
            title="Tema"
          >
            <span>☀️</span>
          </button>
          <button type="button" 
            onClick={() => setTabActivo('mantenimiento')}
            style={estilo.tab(tabActivo === 'mantenimiento')}
            title="Mantenimiento"
          >
            <span>🔧</span>
          </button>
          <button type="button" 
            onClick={() => setTabActivo('sistema')}
            style={estilo.tab(tabActivo === 'sistema')}
            title="Datos del Sistema"
          >
            <span>⚙️</span>
          </button>
        </div>

        {/* Tab Tiempo */}
        {tabActivo === 'tiempo' && (
          <div style={estilo.card}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: temaOscuro ? '#f3f4f6' : '#1f2937', fontWeight: '600' }}>
                ⏱️ Tiempo de Inactividad
              </h2>
              <p style={{ margin: 0, color: temaOscuro ? '#9ca3af' : '#6b7280', fontSize: '0.875rem' }}>
                Configura el tiempo máximo de inactividad antes de cerrar automáticamente la sesión
              </p>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={estilo.label}>Minutos de inactividad</label>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <input
                  type="number"
                  min="1"
                  max="480"
                  value={tiempoInactividad}
                  onChange={(e) => setTiempoInactividad(parseInt(e.target.value) || 30)}
                  style={estilo.input}
                />
                <span style={{ color: temaOscuro ? '#9ca3af' : '#6b7280', fontSize: '0.875rem', minWidth: '80px' }}>
                  {Math.floor(tiempoInactividad / 60)}h {tiempoInactividad % 60}m
                </span>
              </div>
              <p style={{ margin: '0.5rem 0 0 0', color: temaOscuro ? '#6b7280' : '#9ca3af', fontSize: '0.75rem' }}>
                Rango válido: 1 a 480 minutos (máximo 8 horas)
              </p>
            </div>

            {/* Información adicional */}
            <div style={estilo.infoBox}>
              <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600' }}>
                <strong>Comportamiento actual:</strong>
              </p>
              <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
                <li>Cuando un usuario no realiza actividad durante {tiempoInactividad} minutos</li>
                <li>Se cierra automáticamente su sesión</li>
                <li>Deberá ingresar sus credenciales nuevamente</li>
              </ul>
            </div>

            {/* Botones */}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="button" 
                onClick={handleGuardar}
                disabled={guardando}
                style={{
                  ...estilo.botonPrimario,
                  flex: 1,
                  opacity: guardando ? 0.6 : 1,
                  cursor: guardando ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={(e) => {
                  if (!guardando) (e.currentTarget as HTMLButtonElement).style.background = '#2563eb';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = '#3b82f6';
                }}
              >
                {guardando ? '💾 Guardando...' : '💾 Guardar Cambios'}
              </button>
              <button type="button" 
                onClick={() => {
                  if (parametros) {
                    setTiempoInactividad(parametros.tiempo_inactividad_minutos);
                    setError(null);
                    setExito(false);
                  }
                }}
                style={estilo.botonSecundario}
                onMouseEnter={(e) => {
                  const bg = temaOscuro ? '#4b5563' : '#d1d5db';
                  (e.currentTarget as HTMLButtonElement).style.background = bg;
                }}
                onMouseLeave={(e) => {
                  const bg = temaOscuro ? '#374151' : '#e5e7eb';
                  (e.currentTarget as HTMLButtonElement).style.background = bg;
                }}
              >
                ↩️ Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Tab Tema */}
        {tabActivo === 'tema' && (
          <div style={estilo.card}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: temaOscuro ? '#f3f4f6' : '#1f2937', fontWeight: '600' }}>
                🎨 Modo de Tema
              </h2>
              <p style={{ margin: 0, color: temaOscuro ? '#9ca3af' : '#6b7280', fontSize: '0.875rem' }}>
                Elige entre modo claro u oscuro para una mejor experiencia visual
              </p>
            </div>

            {/* Opción Modo Claro */}
            <div style={estilo.toggleSwitch}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: '0 0 0.25rem 0', fontWeight: '600', color: temaOscuro ? '#f3f4f6' : '#1f2937' }}>
                  ☀️ Modo Claro
                </p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: temaOscuro ? '#9ca3af' : '#6b7280' }}>
                  Tema claro para reducir fatiga visual en ambientes luminosos
                </p>
              </div>
              <button type="button" 
                onClick={() => setTemaOscuro(false)}
                style={{
                  padding: '0.5rem 1rem',
                  background: !temaOscuro ? '#3b82f6' : temaOscuro ? '#374151' : '#e5e7eb',
                  color: !temaOscuro ? 'white' : temaOscuro ? '#f3f4f6' : '#374151',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (temaOscuro) {
                    (e.currentTarget as HTMLButtonElement).style.background = '#4b5563';
                  }
                }}
                onMouseLeave={(e) => {
                  if (temaOscuro) {
                    (e.currentTarget as HTMLButtonElement).style.background = '#374151';
                  }
                }}
              >
                {!temaOscuro ? '✓ Activo' : 'Activar'}
              </button>
            </div>

            {/* Opción Modo Oscuro */}
            <div style={estilo.toggleSwitch}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: '0 0 0.25rem 0', fontWeight: '600', color: temaOscuro ? '#f3f4f6' : '#1f2937' }}>
                  🌙 Modo Oscuro
                </p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: temaOscuro ? '#9ca3af' : '#6b7280' }}>
                  Tema oscuro para reducir el brillo en ambientes oscuros
                </p>
              </div>
              <button type="button" 
                onClick={() => setTemaOscuro(true)}
                style={{
                  padding: '0.5rem 1rem',
                  background: temaOscuro ? '#3b82f6' : '#e5e7eb',
                  color: temaOscuro ? 'white' : '#374151',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (!temaOscuro) {
                    (e.currentTarget as HTMLButtonElement).style.background = '#d1d5db';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!temaOscuro) {
                    (e.currentTarget as HTMLButtonElement).style.background = '#e5e7eb';
                  }
                }}
              >
                {temaOscuro ? '✓ Activo' : 'Activar'}
              </button>
            </div>

            {/* Información */}
            <div style={estilo.infoBox}>
              <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600' }}>
                💡 Información:
              </p>
              <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
                <li>Tu preferencia se guardará automáticamente</li>
                <li>El tema se aplicará a todas tus futuras sesiones</li>
                <li>Puedes cambiar el tema en cualquier momento</li>
              </ul>
            </div>
          </div>
        )}

        {/* Tab Mantenimiento */}
        {tabActivo === 'mantenimiento' && (
          <MantenimientoConfig idEstablecimiento={idEstablecimiento} />
        )}

        {/* Tab Datos del Sistema */}
        {tabActivo === 'sistema' && (
          <MantenedorSistema />
        )}

        {/* Información de debug */}
        {parametros && (
          <div
            style={{
              padding: '1rem',
              background: temaOscuro ? '#111827' : '#f0f9ff',
              border: `1px solid ${temaOscuro ? '#374151' : '#bfdbfe'}`,
              borderRadius: '0.375rem',
              fontSize: '0.75rem',
              color: temaOscuro ? '#60a5fa' : '#1e40af',
              fontFamily: 'monospace',
            }}
          >
            <p style={{ margin: '0 0 0.5rem 0' }}>ID Parámetros: {parametros.id_parametros}</p>
            <p style={{ margin: 0 }}>Establecimiento: {parametros.id_establecimiento}</p>
          </div>
        )}
      </div>
    </div>
  );
}
