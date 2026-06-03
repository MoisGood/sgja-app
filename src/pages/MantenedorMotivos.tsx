// ============================================================
// SGJA – Mantenedor de Motivos
// src/pages/MantenedorMotivos.tsx
// ============================================================

import { useState, useEffect, useRef } from 'react';
import {
  obtenerMotivosDelEstablecimiento,
  crearMotivoJustificacion,
  actualizarMotivoJustificacion,
  eliminarMotivoJustificacion,
} from '../services/database';
import type { MotivoJustificacion, TipoRegistro } from '../types';
import '../styles/universal.css';

interface Props {
  idEstablecimiento: string;
}

interface FormMotivo {
  descripcion: string;
  activo: boolean;
  tipo_registro: TipoRegistro;
}

// Función para generar código automático desde la descripción
const generarCodigo = (descripcion: string): string => {
  return descripcion
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '') // Remover caracteres especiales
    .substring(0, 20) // Limitar a 20 caracteres
    || 'MOT';
};

// Función para obtener etiqueta del tipo de registro
const getEtiquetaTipo = (tipo: TipoRegistro | undefined): string | null => {
  const labels: Record<TipoRegistro, string> = {
    'ATRASO': '🕐 Atraso',
    'INASISTENCIA': '❌ Inasistencia',
  };
  return labels[tipo!] || null;
};

// Función para obtener color del tipo de registro
const getColorTipo = (tipo: TipoRegistro | undefined): { bg: string; text: string } | null => {
  const colores: Record<TipoRegistro, { bg: string; text: string }> = {
    'ATRASO': { bg: '#dbeafe', text: '#0c4a6e' },
    'INASISTENCIA': { bg: '#fee2e2', text: '#7f1d1d' },
  };
  return colores[tipo!] || null;
};

export default function MantenedorMotivos({ idEstablecimiento }: Props) {
  const [motivos, setMotivos] = useState<MotivoJustificacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [pagina, setPagina] = useState(1);
  const itemsPorPagina = 15;

  const [formData, setFormData] = useState<FormMotivo>({
    descripcion: '',
    activo: true,
    tipo_registro: 'ATRASO' as TipoRegistro,
  });

  const inputDescripcionRef = useRef<HTMLInputElement>(null);

  const cargarMotivos = async () => {
    try {
      setCargando(true);
      const data = await obtenerMotivosDelEstablecimiento(idEstablecimiento);
      setMotivos(data.sort((a, b) => a.orden - b.orden));
      setPagina(1);
    } catch (err) {
      setError('Error al cargar motivos');
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (idEstablecimiento) {
      cargarMotivos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idEstablecimiento]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.descripcion.trim()) {
      setError('La descripción es requerida');
      return;
    }

    if (!formData.tipo_registro) {
      setError('Debes seleccionar un tipo de justificación');
      return;
    }

    const codigoFinal = generarCodigo(formData.descripcion);

    try {
      setGuardando(true);

      if (editandoId) {
        // Actualizar
        await actualizarMotivoJustificacion(editandoId, {
          codigo: codigoFinal,
          descripcion: formData.descripcion,
          requiere_detalle: false,
          activo: formData.activo,
          tipo_registro: formData.tipo_registro,
        });
      } else {
        // Crear nuevo
        const nuevoMotivo: MotivoJustificacion = {
          id_motivo: `mot_${Date.now()}`,
          id_establecimiento: idEstablecimiento,
          codigo: codigoFinal,
          descripcion: formData.descripcion,
          requiere_detalle: false,
          activo: formData.activo,
          tipo_registro: formData.tipo_registro,
          orden: motivos.length,
        };
        await crearMotivoJustificacion(nuevoMotivo);
      }

      setExito(true);
      setFormData({ descripcion: '', activo: true, tipo_registro: 'ATRASO' as TipoRegistro });
      setEditandoId(null);
      await cargarMotivos();
      setTimeout(() => setExito(false), 3000);
    } catch (err) {
      setError(`Error al guardar: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setGuardando(false);
    }
  };

  const handleEditar = (motivo: MotivoJustificacion) => {
    setFormData({
      descripcion: motivo.descripcion,
      activo: motivo.activo,
      tipo_registro: (motivo.tipo_registro || 'ATRASO') as TipoRegistro,
    });
    setEditandoId(motivo.id_motivo);
    // Hacer focus en el input después de actualizar el estado
    setTimeout(() => {
      inputDescripcionRef.current?.focus();
      inputDescripcionRef.current?.select();
    }, 0);
  };

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este motivo?')) return;

    try {
      setGuardando(true);
      await eliminarMotivoJustificacion(id);
      setExito(true);
      await cargarMotivos();
      setTimeout(() => setExito(false), 3000);
    } catch (err) {
      setError(`Error al eliminar: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setGuardando(false);
    }
  };

  const handleDuplicar = async (motivo: MotivoJustificacion) => {
    try {
      setGuardando(true);
      
      // Generar código basado en tipo y número consecutivo
      const motivosDeMismoTipo = motivos.filter(m => m.tipo_registro === motivo.tipo_registro);
      const numeroConsecutivo = motivosDeMismoTipo.length + 1;
      const prefijo = motivo.tipo_registro === 'ATRASO' ? 'ATR' : 'INA';
      const codigoNuevo = `${prefijo}${numeroConsecutivo.toString().padStart(3, '0')}`;
      
      const nuevoMotivo: MotivoJustificacion = {
        ...motivo,
        id_motivo: `mot_${Date.now()}`,
        descripcion: `${motivo.descripcion} (Copia)`,
        codigo: codigoNuevo,
      };
      await crearMotivoJustificacion(nuevoMotivo);
      await cargarMotivos();
      setExito(true);
      setTimeout(() => setExito(false), 3000);
    } catch (err) {
      setError(`Error al duplicar: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setGuardando(false);
    }
  };

  const handleCancelar = () => {
    setEditandoId(null);
    setFormData({ descripcion: '', activo: true, tipo_registro: 'ATRASO' as TipoRegistro });
    setError(null);
  };

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      padding: 'clamp(1rem, 5vw, 2rem)',
      paddingTop: 'clamp(1.5rem, 8vw, 3rem)',
    },
    wrapper: {
      maxWidth: '900px',
      margin: '0 auto',
    },
    header: {
      marginBottom: '2rem',
    },
    title: {
      fontSize: 'clamp(1.875rem, 5vw, 2.25rem)',
      fontWeight: 700,
      color: '#0f172a',
      marginBottom: '0.5rem',
    },
    subtitle: {
      fontSize: '0.95rem',
      color: '#6b7280',
      fontWeight: 500,
    },
    card: {
      backgroundColor: '#fff',
      borderRadius: '0.875rem',
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      padding: 'clamp(1.25rem, 5vw, 1.75rem)',
      marginBottom: '1.75rem',
    },
    formGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '1rem',
      marginBottom: '1.5rem',
    },
    label: {
      display: 'block',
      fontSize: '0.875rem',
      fontWeight: 700,
      color: '#111827',
      marginBottom: '0.5rem',
    },
    input: {
      width: '100%',
      padding: '0.625rem 1rem',
      border: '1px solid #d1d5db',
      borderRadius: '0.5rem',
      fontSize: '0.875rem',
      color: '#111827',
      backgroundColor: '#fff',
      transition: 'all 0.2s ease',
      boxSizing: 'border-box' as const,
    },
    checkbox: {
      width: '20px',
      height: '20px',
      cursor: 'pointer',
      accentColor: '#2563eb',
    },
    checkboxLabel: {
      fontSize: '0.875rem',
      fontWeight: 600,
      color: '#111827',
      cursor: 'pointer',
    },
    checkboxContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      marginBottom: '1.5rem',
    },
    buttonContainer: {
      display: 'flex',
      gap: '0.75rem',
      paddingTop: '1rem',
      borderTop: '1px solid #e5e7eb',
    },
    buttonPrimary: {
      flex: 1,
      padding: '0.875rem 1rem',
      backgroundColor: '#2563eb',
      color: '#fff',
      fontWeight: 700,
      borderRadius: '0.5rem',
      border: 'none',
      cursor: 'pointer',
      fontSize: '0.875rem',
      transition: 'all 0.2s ease',
    },
    buttonSecondary: {
      padding: '0.875rem 1.5rem',
      backgroundColor: '#f3f4f6',
      color: '#374151',
      fontWeight: 700,
      borderRadius: '0.5rem',
      border: 'none',
      cursor: 'pointer',
      fontSize: '0.875rem',
      transition: 'all 0.2s ease',
    },
    alert: {
      padding: '1rem',
      borderRadius: '0.5rem',
      fontSize: '0.875rem',
      fontWeight: 600,
      display: 'flex',
      gap: '0.75rem',
      alignItems: 'flex-start',
      marginBottom: '1rem',
    },
    alertError: {
      backgroundColor: '#fee2e2',
      color: '#7f1d1d',
      border: '1px solid #fecaca',
    },
    alertSuccess: {
      backgroundColor: '#dcfce7',
      color: '#15803d',
      border: '1px solid #bbf7d0',
    },
    icon: {
      fontSize: '1.1rem',
      flexShrink: 0,
    },
    listHeader: {
      padding: '1.25rem',
      borderBottom: '1px solid #e5e7eb',
      backgroundColor: '#f9fafb',
    },
    listTitle: {
      fontSize: '1.1rem',
      fontWeight: 700,
      color: '#111827',
    },
    emptyState: {
      padding: '3rem 1.25rem',
      textAlign: 'center' as const,
    },
    emptyText: {
      color: '#6b7280',
      fontWeight: 500,
    },
    listItem: {
      padding: 'clamp(1rem, 3vw, 1.5rem)',
      borderBottom: '1px solid #e5e7eb',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '1rem',
      transition: 'background-color 0.2s ease',
    },
    listItemContent: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: '1rem',
      flexWrap: 'wrap' as const,
    },
    itemCode: {
      fontSize: '0.95rem',
      fontWeight: 700,
      color: '#111827',
      letterSpacing: '0.05em',
    },
    itemDescription: {
      fontSize: '0.875rem',
      color: '#6b7280',
      marginTop: '0.25rem',
    },
    badges: {
      display: 'flex',
      gap: '0.5rem',
      flexWrap: 'wrap' as const,
    },
    badge: {
      padding: '0.375rem 0.75rem',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: 700,
      whiteSpace: 'nowrap' as const,
    },
    badgeActive: {
      backgroundColor: '#dcfce7',
      color: '#15803d',
    },
    badgeInactive: {
      backgroundColor: '#fee2e2',
      color: '#7f1d1d',
    },
    actions: {
      display: 'flex',
      gap: '0.5rem',
      flexWrap: 'wrap' as const,
    },
    actionButton: {
      padding: '0.5rem 0.875rem',
      fontSize: '0.75rem',
      fontWeight: 700,
      borderRadius: '0.375rem',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      whiteSpace: 'nowrap' as const,
    },
    buttonEdit: {
      backgroundColor: '#dbeafe',
      color: '#1e40af',
    },
    buttonDelete: {
      backgroundColor: '#fee2e2',
      color: '#991b1b',
    },
    buttonDuplicate: {
      backgroundColor: '#fef3c7',
      color: '#92400e',
    },
  };

  if (cargando) {
    return (
      <div style={styles.container}>
        <div style={{ textAlign: 'center', paddingTop: '4rem' }}>
          <p style={{ fontSize: '1.125rem', color: '#6b7280', fontWeight: 600 }}>⏳ Cargando motivos...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        {/* Encabezado */}
        <div style={styles.header}>
          <h1 style={styles.title}>📋 Mantenedor de Motivos</h1>
          <p style={styles.subtitle}>Crear y editar motivos de justificación</p>
        </div>

        {/* Formulario */}
        <div style={styles.card}>
          <form onSubmit={handleSubmit}>
            <div style={styles.formGrid}>
              <div>
                <label style={styles.label}>📌 Código (Generado automáticamente)</label>
                <input
                  type="text"
                  value={generarCodigo(formData.descripcion)}
                  disabled
                  placeholder="Se genera del nombre"
                  style={{
                    ...styles.input,
                    backgroundColor: '#f3f4f6',
                    color: '#6b7280',
                    cursor: 'not-allowed',
                  }}
                />
              </div>

              <div>
                <label style={styles.label}>📝 Descripción/Nombre *</label>
                <input
                  ref={inputDescripcionRef}
                  type="text"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Ej: Enfermedad, Cita médica, etc."
                  style={styles.input}
                  onFocus={(e) => (e.target.style.borderColor = '#2563eb')}
                  onBlur={(e) => (e.target.style.borderColor = '#d1d5db')}
                />
              </div>
            </div>

            <div style={styles.formGrid}>
              <div>
                <label style={styles.label}>📂 Tipo de Justificación *</label>
                <select
                  value={formData.tipo_registro}
                  onChange={(e) => setFormData({ ...formData, tipo_registro: e.target.value as TipoRegistro })}
                  style={{
                    ...styles.input,
                    appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.75rem center',
                    paddingRight: '2.5rem',
                    cursor: 'pointer',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#2563eb')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#d1d5db')}
                >
                  <option value="ATRASO">🕐 Atraso</option>
                  <option value="INASISTENCIA">❌ Inasistencia</option>
                </select>
              </div>
            </div>

            <div style={styles.checkboxContainer}>
              <input
                type="checkbox"
                id="activo"
                checked={formData.activo}
                onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                style={styles.checkbox}
              />
              <label htmlFor="activo" style={styles.checkboxLabel}>
                ✓ Activo
              </label>
            </div>

            {error && (
              <div style={{ ...styles.alert, ...styles.alertError }}>
                <span style={styles.icon}>⚠️</span>
                <span>{error}</span>
              </div>
            )}
            {exito && (
              <div style={{ ...styles.alert, ...styles.alertSuccess }}>
                <span style={styles.icon}>✅</span>
                <span>Operación exitosa</span>
              </div>
            )}

            <div style={styles.buttonContainer}>
              <button
                type="submit"
                disabled={guardando}
                style={{
                  ...styles.buttonPrimary,
                  opacity: guardando ? 0.6 : 1,
                  cursor: guardando ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={(e) => !guardando && (e.currentTarget.style.boxShadow = '0 4px 12px rgba(37,99,235,0.3)')}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
              >
                {editandoId ? (guardando ? '⏳ Actualizando...' : '✓ Actualizar') : guardando ? '⏳ Guardando...' : '✓ Guardar'}
              </button>
              {editandoId && (
                <button
                  type="button"
                  onClick={handleCancelar}
                  style={styles.buttonSecondary}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e5e7eb')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                >
                  ✕ Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Lista de motivos */}
        <div style={{ ...styles.card, padding: 0, overflow: 'hidden' }}>
          <div style={styles.listHeader}>
            <h3 style={styles.listTitle}>📋 Motivos registrados ({motivos.length})</h3>
          </div>

          {motivos.length === 0 ? (
            <div style={styles.emptyState}>
              <p style={styles.emptyText}>📭 No hay motivos registrados</p>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid #E5E7EB', backgroundColor: '#FFF' }}>
                <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Página {pagina} de {Math.max(1, Math.ceil(motivos.length / itemsPorPagina))}</span>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <button type="button" disabled={pagina <= 1} onClick={() => setPagina(p => p - 1)} style={{
                    padding: '4px 10px', border: '1px solid #D1D5DB', borderRadius: '4px',
                    background: pagina <= 1 ? '#F3F4F6' : '#FFF', color: pagina <= 1 ? '#D1D5DB' : '#374151',
                    cursor: pagina <= 1 ? 'default' : 'pointer', fontSize: '12px'
                  }}>◀</button>
                  {Array.from({ length: Math.ceil(motivos.length / itemsPorPagina) }, (_, i) => i + 1).map(p => (
                    <button type="button" key={p} onClick={() => setPagina(p)} style={{
                      padding: '4px 10px', border: '1px solid #D1D5DB', borderRadius: '4px',
                      background: p === pagina ? '#1A3C6B' : '#FFF', color: p === pagina ? '#FFF' : '#374151',
                      cursor: 'pointer', fontSize: '12px', fontWeight: p === pagina ? 700 : 400
                    }}>{p}</button>
                  ))}
                  <button type="button" disabled={pagina >= Math.ceil(motivos.length / itemsPorPagina)} onClick={() => setPagina(p => p + 1)} style={{
                    padding: '4px 10px', border: '1px solid #D1D5DB', borderRadius: '4px',
                    background: pagina >= Math.ceil(motivos.length / itemsPorPagina) ? '#F3F4F6' : '#FFF',
                    color: pagina >= Math.ceil(motivos.length / itemsPorPagina) ? '#D1D5DB' : '#374151',
                    cursor: pagina >= Math.ceil(motivos.length / itemsPorPagina) ? 'default' : 'pointer', fontSize: '12px'
                  }}>▶</button>
                </div>
              </div>
              {motivos.slice((pagina - 1) * itemsPorPagina, pagina * itemsPorPagina).map((motivo) => {
                const color = getColorTipo(motivo.tipo_registro);
                const etiqueta = getEtiquetaTipo(motivo.tipo_registro);
                
                return (
                  <div
                    key={motivo.id_motivo}
                    style={styles.listItem}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <div style={styles.listItemContent}>
                      <div style={{ flex: 1 }}>
                        <p style={styles.itemCode}>{motivo.codigo}</p>
                        <p style={styles.itemDescription}>{motivo.descripcion}</p>
                      </div>

                      <div style={styles.badges}>
                        {color && etiqueta && (
                          <span 
                            style={{ ...styles.badge, backgroundColor: color.bg, color: color.text }}
                            title={etiqueta}
                          >
                            {etiqueta}
                          </span>
                        )}
                        {motivo.activo ? (
                          <span style={{ ...styles.badge, ...styles.badgeActive }} title="Activo">✓ </span>
                        ) : (
                          <span style={{ ...styles.badge, ...styles.badgeInactive }} title="Inactivo">✕ </span>
                        )}
                      </div>

                      <div style={styles.actions}>
                        <button type="button" 
                          onClick={() => handleEditar(motivo)}
                          style={styles.actionButton}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#bfdbfe')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#dbeafe')}
                          className="motivo-btn-edit"
                          title="Editar motivo"
                        >
                          ✎ 
                        </button>
                        <button type="button" 
                          onClick={() => handleDuplicar(motivo)}
                          style={{
                            ...styles.actionButton,
                            ...styles.buttonDuplicate,
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fcd34d')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#fef3c7')}
                          title="Duplicar motivo"
                        >
                          📋 
                        </button>
                        <button type="button" 
                          onClick={() => handleEliminar(motivo.id_motivo)}
                          style={{
                            ...styles.actionButton,
                            ...styles.buttonDelete,
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fca5a5')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#fee2e2')}
                          title="Eliminar motivo"
                        >
                          🗑 
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
