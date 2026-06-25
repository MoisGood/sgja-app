// src/pages/PanelAyudaAdmin.tsx
// Página de administración del módulo de ayuda (solo ADMIN)

import { useState } from 'react';

type PestanaAdmin = 'faq' | 'tutoriales' | 'logs';

const PanelAyudaAdmin = () => {
  const [pestana, setPestana] = useState<PestanaAdmin>('faq');

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1A3C6B', marginBottom: '8px' }}>
        ⚙️ Gestión del Módulo de Ayuda
      </h1>
      <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>
        Configura el contenido de ayuda que verán los roles: Profesor, Inspector, Estudiante.
      </p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '2px solid #E5E7EB', marginBottom: '24px' }}>
        {[
          { key: 'faq' as const, label: 'Preguntas Frecuentes' },
          { key: 'tutoriales' as const, label: 'Tutoriales' },
          { key: 'logs' as const, label: 'Logs de errores' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setPestana(tab.key)}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: pestana === tab.key ? '#1A3C6B' : 'transparent',
              color: pestana === tab.key ? '#FFF' : '#6B7280',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* FAQ */}
      {pestana === 'faq' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#374151', margin: 0 }}>
              Preguntas Frecuentes
            </h2>
            <button style={{
              padding: '8px 16px', background: '#059669', color: '#FFF', border: 'none',
              borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '13px',
            }}>
              + Nueva pregunta
            </button>
          </div>

          <div style={{ background: '#F9FAFB', borderRadius: '8px', padding: '24px', textAlign: 'center' }}>
            <p style={{ color: '#9CA3AF', fontSize: '14px', margin: 0 }}>
              Aquí podrás crear, editar y eliminar preguntas FAQ, y asignar qué rol(es) puede ver cada una.
            </p>
            <p style={{ color: '#D1D5DB', fontSize: '13px', marginTop: '8px' }}>
              Próximamente: CRUD completo con asignación de roles.
            </p>
          </div>
        </div>
      )}

      {/* Tutoriales */}
      {pestana === 'tutoriales' && (
        <div style={{ background: '#F9FAFB', borderRadius: '8px', padding: '24px', textAlign: 'center' }}>
          <p style={{ color: '#9CA3AF', fontSize: '14px', margin: 0 }}>
            Aquí podrás crear tutoriales paso a paso con efecto de oscurecimiento, y asignarlos a los roles correspondientes.
          </p>
          <p style={{ color: '#D1D5DB', fontSize: '13px', marginTop: '8px' }}>
            Próximamente: creación de tutoriales con selectores de elementos UI.
          </p>
        </div>
      )}

      {/* Logs */}
      {pestana === 'logs' && (
        <div style={{ background: '#F9FAFB', borderRadius: '8px', padding: '24px', textAlign: 'center' }}>
          <p style={{ color: '#9CA3AF', fontSize: '14px', margin: 0 }}>
            Aquí podrás ver los errores reportados por los usuarios, filtrados por tipo y fecha.
          </p>
          <p style={{ color: '#D1D5DB', fontSize: '13px', marginTop: '8px' }}>
            Próximamente: tabla de logs con filtros.
          </p>
        </div>
      )}
    </div>
  );
};

export default PanelAyudaAdmin;