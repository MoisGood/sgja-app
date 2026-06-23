# Next.js vs Arquitectura Actual

## Arquitectura Actual (SGJA)

| Capa | Tecnología |
|------|-----------|
| Frontend | SPA React + Vite + TypeScript |
| Backend | Supabase (BaaS) — consultas directas desde el cliente |
| Estado | `useState` / `useReducer` / `useContext` (sin librería externa) |
| Ruteo | `react-router-dom` |
| Estilos | Tailwind + CSS Modules |
| PWA | `vite-plugin-pwa` (service worker) |
| UI Mapas | Posicionamiento absoluto desde JSON |
| Despliegue | Vercel (estática) |

### Ventajas
- Simple, sin servidor propio que mantener
- PWA completa con offline
- Rápido desarrollo iterativo
- Costo cero (Vercel free + Supabase free)

### Limitaciones
- Lógica de negocio expuesta en cliente (reglas RLSU en Supabase)
- Sin SSR — SEO limitado, primer pintado más lento
- Sin API backend propio — todo depende de permisos de Supabase
- Escalabilidad limitada si crece lógica del lado servidor

---

## Next.js (App Router) — Hipotético

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js React Server Components + Client Components |
| Backend | API Routes (serverless) |
| Estado | Server State + Client State (React Context / Zustand) |
| Ruteo | File-based App Router |
| Estilos | Tailwind + CSS Modules |
| PWA | `next-pwa` o `@serwist/next` |
| BD | Supabase (desde Server Components o API Routes) |
| Despliegue | Vercel (serverless) |

### Beneficios clave
- **API Routes**: backend propio, lógica de negocio del lado servidor, no expuesta al cliente
- **Server Components**: menos JS enviado al navegador, pintado más rápido
- **SEO**: SSR/SSG para landing pages públicas
- **Layouts anidados**: routing más limpio para dashboards
- **Middleware**: redirecciones, protección de rutas, i18n
- **Image Optimization**: componente `<Image>` optimizado

### Desventajas
- Mayor complejidad de arquitectura
- Costo serverless (aunque Vercel free cubre bastante)
- Migrar PWA actual requiere rehacer service worker
- Tiempo de reescritura no trivial

---

## ¿Cuándo usar cada uno?

| Escenario | Actual (Vite + Supabase) | Next.js |
|-----------|--------------------------|---------|
| App interna, sin SEO | ✅ Ideal | ❌ Sobredimensionado |
| Landing públicas + dashboard | ❌ Limitado | ✅ Ideal |
| Lógica de negocio compleja servidor | ❌ RLSU engorroso | ✅ API Routes |
| PWA offline crítica | ✅ Ya implementado | ⚠️ Requiere configuración extra |
| Prototipado rápido | ✅ | ❌ Más overhead inicial |
| Escalar a muchos usuarios con lógica propia | ⚠️ Limitado | ✅ Flexible |

---

## Conclusión

Para **SGJA** (app interna tipo intranet, mobile-first, PWA, sin SEO): la arquitectura actual con Vite + Supabase es la correcta — simple, rápida, costo cero.

Next.js se evaluaría para un proyecto nuevo con landing públicas + dashboard, o si SGJA creciera hasta necesitar un backend propio con APIs serverless.
