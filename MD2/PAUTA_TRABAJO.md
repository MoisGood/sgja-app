# Pauta de Trabajo — SGJA

## Metodologías que aplicamos

### 1. Offline-First
- **IndexedDB** (`sgja-offline`) es la fuente primaria de datos.
- **Supabase** sincroniza en segundo plano cuando hay conexión.
- Estrategia: escribir local → encolar sync → procesar cola al estar online.
- 7 object stores actuales + sync_queue + metadata.
- `putSilent()` para precachear catálogos sin encolar sync.
- Cache local (`sgja-cache`) con TTL para datos de lectura frecuente.

### 2. Principios SOLID
- **S** — Un archivo = una responsabilidad. Servicios separados por dominio.
- **O** — Servicios extensibles mediante composición, no herencia.
- **L** — Tipos consistentes; las funciones devuelven el tipo prometido.
- **I** — Interfaces específicas por módulo académico (`Actividad`, `Desempeno`, etc.).
- **D** — Servicios (como `syncEngine`) dependen de abstracciones (`offlineStore`), no de implementaciones concretas.

### 3. TypeScript Estricto
- `strict: true` en tsconfig.
- Sin `any` en código nuevo (excepciones controladas en servicios legacy).
- Interfaces exportadas desde `src/types/index.ts`.
- Tipos específicos para cada tabla SQL.
- `as unknown as Type` solo en puntos de frontera con capa offline.

### 4. React Moderno
- Functional components + hooks, sin clases.
- Estados locales con `useState`, efectos con `useEffect`.
- `useOfflineSync` hook para estado de sincronización.
- Animaciones con `framer-motion` (AnimatePresence, motion.div).
- Routing con `react-router-dom` v6.

### 5. UI Components
- **Lucide React** para iconos (sin emojis en UI primaria).
- **Tailwind CSS** para estilos rápidos en componentes nuevos.
- Inline styles en componentes existentes (migración gradual).
- Sin dependencias UI pesadas (MUI, Chakra, etc.).

### 6. Base de Datos
- Migraciones SQL secuenciales en `supabase/migrations/`.
- `CREATE TABLE IF NOT EXISTS` + índices + RLS + políticas en cada migración.
- `DO $$ ... END $$` blocks para operaciones condicionales.
- Naming: `snake_case`, prefijo `ayuda_` para módulo ayuda, `idx_` para índices.
- No usar `auth.rol()` (no existe en Supabase base). Usar `auth.uid()`, `auth.role()`, o JWT claims.

### 7. Estructura de Archivos
```
src/
├── components/     ← Componentes reutilizables
│   └── Ayuda/      ← Submódulo ayuda (FlotanteAyuda, CentroDeAyuda)
├── hooks/          ← Custom hooks (useAuth, useOfflineSync, useTheme)
├── pages/          ← Páginas/ruteables (una por vista)
├── services/       ← Lógica de negocio + acceso a datos
├── types/          ← Interfaces TypeScript (index.ts)
└── lib/            ← Configuración (supabase client, etc.)
```

### 8. Convenciones de Código
- `//` comentarios solo para contexto necesario (evitar ruido).
- Archivos nuevos sin BOM, UTF-8.
- Nombres de archivo: `PascalCase.tsx` para componentes, `camelCase.ts` para servicios.
- Un componente por archivo, export default.
- Tests junto al archivo: `__tests__/foo.test.ts`.

### 9. Decisiones Arquitectónicas Clave
- **Monitor**, no profesor, orquesta las salas de aprendizaje.
- **PIE** recibe alertas automáticas de estudiantes en riesgo.
- **QR** es puente entre papel físico y sistema digital.
- **Heurísticas/decision trees** sobre IA generativa para lógica de diagnóstico.
- **OpenCode** sobre Claude Code por economía.

### 10. Flujo de Trabajo
1. Diseñar en `MD2/` primero (documento de diseño).
2. Crear migración SQL.
3. Agregar tipos en `types/index.ts`.
4. Implementar servicio con patrón offline-first.
5. Crear/actualizar componente UI (Lucide, Tailwind/inline).
6. Test (`vitest` + `fake-indexeddb`).
7. Build (`npm run build`).
8. Deploy (`npm run build && npx vercel deploy --prod`).
