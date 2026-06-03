// ============================================================
// SGJA – Mantenedor de Roles Personalizados (Página)
// src/pages/MantenedorRolesPage.tsx
// ============================================================

import { MantenedorRoles } from '../components/MantenedorRoles';

interface Props {
  idEstablecimiento: string;
}

export default function MantenedorRolesPage({ idEstablecimiento }: Props) {
  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 600, color: '#111827' }}>
          👥 Mantenedor de Roles
        </h1>
        <p style={{ margin: '0.5rem 0 0 0', color: '#6b7280', fontSize: '1rem' }}>
          Crea y gestiona roles personalizados para tu establecimiento
        </p>
      </div>

      <MantenedorRoles idEstablecimiento={idEstablecimiento} />
    </div>
  );
}
