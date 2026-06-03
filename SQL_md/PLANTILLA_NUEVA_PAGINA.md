# Cómo crear una página nueva en SGJA

## Archivos que tocas (según lo que necesites)

| Archivo | ¿Cuándo? | ¿Qué pones? |
|---------|----------|-------------|
| `src/pages/MiPagina.tsx` | **Siempre** | El componente JSX |
| `src/AppContent.tsx` | **Siempre** | El `import` + case en el switch |
| `src/components/Layout.tsx` | Si la página va en el menú | Botón en el sidebar |
| `src/types/index.ts` | Si hay datos nuevos | Interface del tipo |
| `src/services/database.ts` | Si consultas Supabase | Función de fetch |
| `src/services/supabaseDB.ts` | Si usas cache | Función con `obtenerConCache` |
| `src/hooks/useXxx.ts` | **Solo si** la lógica se reusa | Fetch + estado |

---

## 1. Lo mínimo: solo page (`pages/MiPagina.tsx`)

```typescript
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Props {
  idEstablecimiento: string;
}

export default function MiPagina({ idEstablecimiento }: Props) {
  const [items, setItems] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    supabase.from('tabla').select('*')
      .eq('id_establecimiento', idEstablecimiento)
      .then(({ data }) => { setItems(data || []); setCargando(false); });
  }, [idEstablecimiento]);

  if (cargando) return <p>⏳ Cargando...</p>;

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1A3C6B' }}>📄 Título</h1>
      {items.map((i, idx) => <div key={idx}>{i.nombre}</div>)}
    </div>
  );
}
```

## 2. Con fetch a Supabase (`services/database.ts`)

Busca una función similar al final del archivo y copia el patrón:

```
export async function obtenerAlgo(idEstablecimiento: string): Promise<Tipo[]> {
  const { data, error } = await supabase
    .from('tabla')
    .select('*')
    .eq('id_establecimiento', idEstablecimiento)
    .eq('activo', true);
  if (error) throw error;
  return data || [];
}
```

## 3. Registrar la ruta (`AppContent.tsx`)

Busca el bloque `switch (rol)` dentro del archivo. Hay dos formas:

### Opción A: Usar `rutaActiva` (para páginas anidadas del ADMIN)

```typescript
// 1. Import arriba
import MiPagina from './pages/MiPagina';

// 2. Dentro de case 'ADMIN', ANTES del return del DashboardAdmin:
case 'ADMIN':
  if (rutaActiva === 'mi-pagina') {
    return <MiPagina idEstablecimiento={estab} />;
  }
  return <DashboardAdmin idEstablecimiento={estab} onNavegar={setRutaActiva} />;
```

### Opción B: Agregar un case nuevo (para dashboards por rol)

```typescript
case 'MI_ROL':
  return <MiPagina idEstablecimiento={estab} />;
```

## 4. Agregar al menú (`Layout.tsx`)

Busca el bloque del rol que corresponda y agrega un botón:

```typescript
{rol === 'ADMIN' && (
  <>
    <button onClick={() => setRutaActiva('mi-pagina')} style={{
      width: '100%', padding: '12px 16px', textAlign: 'left', cursor: 'pointer',
      border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 500,
      backgroundColor: rutaActiva === 'mi-pagina' ? '#E0E7FF' : 'transparent',
    }}>
      🚀 Mi Página
    </button>
  </>
)}
```

## 5. ¿Hook sí o hook no?

**NO uses hook si:**
- La página es única (no se repite en otro lado)
- El fetch es simple (un solo `SELECT`)
- Tienes < 50 líneas de lógica

**SÍ usa hook si:**
- El mismo fetch se necesita en 2+ páginas (ej: `useAuth`, `usePrestamos`)
- Tienes lógica compleja con varios estados que ensucia el componente
- Necesitas compartir estado entre componentes hermanos

## Ejemplo completo: Página "Técnico"

### pages/Tecnico.tsx
```typescript
import { useState, useEffect } from 'react';
import { Card } from '../components/Common';
import { supabase } from '../lib/supabase';

interface Props { idEstablecimiento: string }

export default function Tecnico({ idEstablecimiento }: Props) {
  const [items, setItems] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    supabase.from('mantenimiento_equipos').select('*')
      .eq('id_establecimiento', idEstablecimiento)
      .then(({ data }) => { setItems(data || []); setCargando(false); });
  }, [idEstablecimiento]);

  if (cargando) return <p>⏳ Cargando...</p>;

  return (
    <div style={{ padding: '24px', backgroundColor: '#F9FAFB', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1A3C6B' }}>🛠️ Técnico</h1>
      <Card padding="24px">
        {items.length === 0
          ? <p style={{ color: '#9CA3AF' }}>Sin equipos registrados.</p>
          : items.map((i, idx) => (
              <div key={idx} style={{
                padding: '16px', marginBottom: '12px', borderRadius: '8px',
                border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB',
              }}>
                <p style={{ fontWeight: 700, color: '#1A3C6B' }}>{i.nombre}</p>
                <p style={{ fontSize: '12px', color: '#6B7280' }}>{i.descripcion}</p>
              </div>
            ))
        }
      </Card>
    </div>
  );
}
```

### En AppContent.tsx
```typescript
import Tecnico from './pages/Tecnico';
// ...
case 'ADMIN':
  if (rutaActiva === 'tecnico') return <Tecnico idEstablecimiento={estab} />;
  return <DashboardAdmin ... />;
```

### En Layout.tsx
```typescript
<button onClick={() => setRutaActiva('tecnico')} style={menuItemStyle(rutaActiva === 'tecnico')}>
  🛠️ Técnico
</button>
```

---

## Resumen visual

```
1. page  ──── pages/MiPagina.tsx       (SIEMPRE)
2. route ──── AppContent.tsx            (SIEMPRE)
3. menu  ──── Layout.tsx               (si va en sidebar)
4. type  ──── types/index.ts           (si hay datos nuevos)
5. db    ──── services/database.ts     (si es consulta nueva)
6. hook  ──── hooks/useXxx.ts          (SOLO si se reusa)
```
