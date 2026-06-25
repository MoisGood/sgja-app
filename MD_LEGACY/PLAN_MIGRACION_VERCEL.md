# PLAN DE MIGRACIÓN: FIREBASE HOSTING → VERCEL

**Fecha de inicio:** 16 de abril de 2026  
**Estado:** Planificación  
**Objetivo:** Reemplazar Firebase Hosting con Vercel para mejores cuotas y performance

---

## 📋 ÍNDICE

1. [Análisis de Configuración Actual](#análisis-de-configuración-actual)
2. [Comparativa Firebase Hosting vs Vercel](#comparativa-firebase-hosting-vs-vercel)
3. [Tareas Previas](#tareas-previas)
4. [Fase 1: Configuración Vercel](#fase-1-configuración-vercel)
5. [Fase 2: Cambios en Código](#fase-2-cambios-en-código)
6. [Fase 3: Testing](#fase-3-testing)
7. [Fase 4: Cutover y Cambio DNS](#fase-4-cutover-y-cambio-dns)

---

## 🔍 ANÁLISIS DE CONFIGURACIÓN ACTUAL

### Firebase Hosting Actual:
```
Proyecto: sgj20161
URL: https://sgj20161.web.app
Domain: También disponible sgj20161.firebaseapp.com

Archivos de configuración:
├── firebase.json (config Firebase)
├── firestore.rules (reglas RLS Firestore)
├── firestore.indexes.json (índices)
├── .firebaserc (proyecto asociado)
└── dist/ (build de Vite)

Build:
├── npm run build (Vite)
├── Salida: dist/
├── Deploy: firebase deploy --only hosting
```

### Configuración Vite Actual (`vite.config.ts`):
```typescript
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser'
  }
});
```

---

## ⚖️ COMPARATIVA FIREBASE HOSTING vs VERCEL

| Aspecto | Firebase Hosting | Vercel | Ventaja |
|---|---|---|---|
| **Builds/mes** | Ilimitados | 6,000 (plan Hobby) | ✅ Vercel |
| **Bandwidth/mes** | 10 GB gratis | 100 GB gratis | ✅ Vercel |
| **Costo overquota** | $0.18/GB | $0.15/GB | ✅ Vercel (ligeramente) |
| **Serverless Functions** | No | Sí | ✅ Vercel |
| **Edge Functions** | No | Sí | ✅ Vercel |
| **Análitics** | Básico | Detallado | ✅ Vercel |
| **Preview Deployments** | Limitados | Sí (ilimitados) | ✅ Vercel |
| **Git Integration** | Manual (CI/CD) | Automático | ✅ Vercel |
| **SSL/TLS** | Automático | Automático | = Igual |
| **CDN Global** | Sí | Sí | = Igual |
| **Rollback** | Manual | 1-click | ✅ Vercel |

**Conclusión:** Vercel es más flexible y económica para este proyecto.

---

## ✅ TAREAS PREVIAS

- [ ] Crear cuenta en Vercel
- [ ] Conectar repositorio Git (GitHub/GitLab/Bitbucket)
- [ ] Configurar variables de entorno
- [ ] Crear dominio personalizado (opcional)
- [ ] Preparar rollback plan para Firebase

---

## 🔧 FASE 1: CONFIGURACIÓN VERCEL

### Paso 1.1: Crear Proyecto en Vercel

1. Ir a https://vercel.com/new
2. Conectar repositorio Git del proyecto
3. Seleccionar framework: **React**
4. Vercel detectará automáticamente:
   - Build command: `npm run build`
   - Output directory: `dist`
5. Configurar variables de entorno (próximo paso)

### Paso 1.2: Configurar Variables de Entorno

En Vercel dashboard, ir a **Settings → Environment Variables**:

```env
# Supabase (después de migrar)
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Keepass si se usa
VITE_KEEPASS_URL=...

# Analytics (opcional)
VITE_ANALYTICS_ID=...

# API endpoints
VITE_API_URL=https://api.tudominio.com
```

**Importante:** Marcar como "Encrypted" los valores sensibles.

### Paso 1.3: Crear `vercel.json`

En raíz del proyecto, crear archivo `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "env": {
    "VITE_SUPABASE_URL": "@supabase_url",
    "VITE_SUPABASE_ANON_KEY": "@supabase_anon_key"
  },
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/public/(.*)",
      "headers": [
        {
          "key": "cache-control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### Paso 1.4: Actualizar `package.json`

Verificar que los scripts estén correctos:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives"
  }
}
```

### Paso 1.5: Primer Deploy

```bash
# Git push dispara build automático en Vercel
git add .
git commit -m "Configuración para Vercel"
git push origin main

# Vercel detecta cambios y comienza build
# Ver progreso en https://vercel.com/dashboard
```

---

## 💻 FASE 2: CAMBIOS EN CÓDIGO

### Paso 2.1: Actualizar `vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})
```

### Paso 2.2: Crear `_redirects` (para Vercel)

En `public/_redirects`:

```
# Redirect SPA routes
/*  /index.html  200
```

O en `vercel.json` (ya incluido en Paso 1.3).

### Paso 2.3: Actualizar `public/index.html`

Verificar meta tags y base URL:

```html
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="SGJA - Sistema de Gestión de Justificaciones" />
    <title>SGJA</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### Paso 2.4: Variables de Entorno en Build

Vercel las inyecta automáticamente si están prefijadas con `VITE_`.

En `src/lib/supabase.ts`:

```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Faltan variables de environment Supabase')
}

export const supabase = createClient(supabaseUrl, supabaseKey)
```

### Paso 2.5: Actualizar `.env.local` para desarrollo

```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJ...testing...
```

---

## 🧪 FASE 3: TESTING

### Paso 3.1: Testing Local

```bash
# Instalar dependencias
npm install

# Build local
npm run build

# Verificar dist/
ls -la dist/

# Servir localmente (simular Vercel)
npm run preview

# Visitar http://localhost:4173
```

### Paso 3.2: Testing Preview en Vercel

1. Hacer commit y push a rama develop
2. Vercel crea preview deployment automáticamente
3. URL: `https://sgja-staging.vercel.app` (nombrada automáticamente)
4. **Checklist:**
   - [ ] Página carga sin errores
   - [ ] Login funciona
   - [ ] Dashboard carga datos
   - [ ] Navegación funciona
   - [ ] Formularios funcionan
   - [ ] Cache se llena correctamente

### Paso 3.3: Testing Performance

```bash
# Usar Lighthouse en Chrome DevTools
# O Web Vitals: https://web.dev/vitals/

# Métricas esperadas:
# - LCP (Largest Contentful Paint): < 2.5s
# - FID (First Input Delay): < 100ms
# - CLS (Cumulative Layout Shift): < 0.1
```

### Paso 3.4: Monitoreo de Errores

Vercel integración con Sentry (opcional):

```bash
npm install @sentry/react @sentry/tracing
```

Configurar en `src/main.tsx`:

```typescript
import * as Sentry from "@sentry/react"

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  tracesSampleRate: 1.0,
})
```

---

## 🚀 FASE 4: CUTOVER Y CAMBIO DNS

### Paso 4.1: Preparar Rollback

```bash
# Guardar URL actual Firebase
OLD_URL=https://sgj20161.web.app

# Tener disponible si falla Vercel
VERCEL_URL=https://sgja.vercel.app
```

### Paso 4.2: Cambio de Dominio Personalizado (opcional)

Si tiene dominio (`miescuela.cl`):

1. En Vercel dashboard → Project Settings → Domains
2. Agregar dominio personalizado
3. Copiar registros DNS:
   ```
   ALIAS: example.vercel.app
   ```
4. En registrador de dominio, actualizar DNS

### Paso 4.3: Cambio en Producción

**Timeline:**
- **T-0:** Confirmar todo en staging
- **T-0:** Notificar usuarios (banner): "Cambio de servidor en X minutos"
- **T-5:** Deploy a main branch si no está
- **T-10:** Verificar Vercel deployment activo
- **T-15:** Cambiar DNS o URL en aplicación
- **T-20:** Monitoreo intensivo

### Paso 4.4: Cambiar URL en Aplicación

Si usa dominio personalizado:

```bash
# En código, actualizar URLs base
VITE_APP_URL=https://miescuela.cl
```

O si deja sgja.vercel.app por ahora:

```bash
VITE_APP_URL=https://sgja.vercel.app
```

### Paso 4.5: Verificación Post-Deploy

**Checklist (primeros 30 min):**
- [ ] Dashboard carga (sin errores 500)
- [ ] Login funciona
- [ ] Estudiantes cargan
- [ ] Ausencias se pueden registrar
- [ ] Vercel logs sin errores
- [ ] Performance similar a Firebase

### Paso 4.6: Monitoreo 24h

- Avisos por error (Sentry)
- Monitoreo uptime (Pingdom/Uptime Robot)
- Logs de Vercel por warnings

### Paso 4.7: Limpieza

Una vez confirmado que todo funciona (24-48h):

- Desactivar Firebase Hosting
- Archivar proyecto Firebase
- Guardar backup final Firestore
- Actualizar documentación

---

## 📝 COMPARATIVA URLS

| Fase | URL | Estado |
|---|---|---|
| Actual (Firebase) | https://sgj20161.web.app | ✅ Vivo |
| Preview (Vercel) | https://sgja-git-main.vercel.app | 🔄 Testing |
| Production (Vercel) | https://sgja.vercel.app | ⏳ Después cutover |
| Custom Domain | https://miescuela.cl | ☐ Opcional |

---

## ⏱️ TIMELINE ESTIMADO

| Fase | Duración | Día |
|---|---|---|
| 1. Configuración Vercel | 1-2 horas | Día 1 |
| 2. Cambios código | 1-2 horas | Día 1 |
| 3. Testing | 2-3 horas | Día 2 |
| 4. Cutover | 1-2 horas | Día 3 |
| **TOTAL** | **5-9 horas** | |

---

## ⚠️ RIESGOS Y MITIGACIÓN

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| Build falla en Vercel | Baja | Testing preview exhaustivo |
| DNS propaga lentamente | Media | Cambiar gradualmente por IP |
| Errores en producción | Baja | Sentry + Monitoreo 24h |
| Usuarios pierden conexión | Muy Baja | CDN global minimiza |
| Rollback necesario | Baja | Volver a Firebase URL en 5 min |

---

## 🔗 INTEGRACIÓN CON MIGRACIÓN SUPABASE

Al migrar simultáneamente Firebase → Supabase + Hosting → Vercel:

```
Timeline Combinado:
├─ Día 1: Configurar Supabase + Vercel en paralelo
├─ Día 2: Migrar datos + Cambios código (Supabase + Vercel)
├─ Día 3: Testing exhaustivo (con Supabase + Vercel)
├─ Día 4: Cutover simultáneo ambas plataformas
└─ Día 5: Monitoreo post-migración 24h
```

**Ventajas:**
- Un único punto de cambio crítico
- Todos los servicios nuevos simultáneamente
- Si falla, rollback completo a Firebase

---

## ✅ DEPENDENCIAS

- ✅ Cuenta Vercel creada
- ✅ Repositorio Git conectado
- ✅ Credenciales Supabase configuradas
- ✅ Node.js 18+
- ✅ Dominio (opcional pero recomendado)

---

## 📚 RECURSOS

- Vercel Docs: https://vercel.com/docs
- Vite Deployment: https://vitejs.dev/guide/static-deploy.html#vercel
- Vercel Environment Variables: https://vercel.com/docs/concepts/projects/environment-variables
- Web Vitals: https://web.dev/vitals/

---

**PRÓXIMO PASO:** 
1. ✅ Paso 2 completado: Plan Supabase
2. ✅ Paso 3 completado: Plan Vercel
3. ⏳ Paso 4: Confirmar y comenzar Fase 1 de cualquiera de los planes
