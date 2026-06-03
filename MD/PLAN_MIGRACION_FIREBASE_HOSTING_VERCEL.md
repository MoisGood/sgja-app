# PLAN DE MIGRACIÓN: FIREBASE HOSTING → VERCEL

## RESUMEN EJECUTIVO
- **Tiempo estimado**: 1-2 días (más rápido que Supabase)
- **Riesgo**: Muy bajo (DNS apunta a Vercel, rollback en 5 minutos)
- **Impacto**: Mejor rendimiento, mejor integración con frontend, autoescalado
- **Costo**: Gratuito hasta 100GB ancho de banda/mes

---

## FASE 1: PREPARACIÓN (Día 1 Mañana)

### 1.1 Crear Cuenta en Vercel
```
1. Ir a https://vercel.com
2. Registrarse con GitHub (recomendado)
3. Crear organización (opcional)
4. Guardar credenciales
```

### 1.2 Conectar Repositorio GitHub

```
1. Ir a Vercel Dashboard
2. "Add new" → "Project"
3. Seleccionar repo: usuario/SGJA
4. Vercel detectará automáticamente:
   - Framework: React + Vite ✓
   - Build command: npm run build ✓
   - Output directory: dist ✓
```

### 1.3 Configurar Variables de Ambiente

**En Vercel Project Settings → Environment Variables:**

```
# Supabase (cuando esté listo)
REACT_APP_SUPABASE_URL=https://[proyecto].supabase.co
REACT_APP_SUPABASE_ANON_KEY=[key]

# Firebase Auth (durante transición)
REACT_APP_FIREBASE_API_KEY=[key]
REACT_APP_FIREBASE_AUTH_DOMAIN=[domain]
...

# Otras variables
REACT_APP_API_URL=https://api.ejemplo.com
NODE_ENV=production
```

### 1.4 Crear `vercel.json` en raíz del proyecto

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "react",
  "devCommand": "npm run dev",
  "env": {
    "REACT_APP_SUPABASE_URL": "@react_app_supabase_url",
    "REACT_APP_SUPABASE_ANON_KEY": "@react_app_supabase_anon_key"
  },
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/:path*"
    }
  ],
  "redirects": [
    {
      "source": "/viejos-links/:path*",
      "destination": "/nuevos-links/:path*",
      "permanent": true
    }
  ],
  "headers": [
    {
      "source": "/fonts/:path*",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

---

## FASE 2: OPTIMIZACIONES PARA VERCEL (Día 1 Tarde)

### 2.1 Actualizar `package.json`

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

### 2.2 Optimizar `vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsDir: 'assets',
    
    // Optimizaciones Vercel
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'supabase': ['@supabase/supabase-js'],
        }
      }
    },
    
    // Code splitting
    chunkSizeWarningLimit: 600,
    
    // Compression
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Eliminar console.log en producción
      }
    }
  },
  
  // Optimización de desarrollo
  server: {
    middlewareMode: false,
  }
})
```

### 2.3 Crear `.vercelignore` (acelera builds)

```
node_modules
.git
.gitignore
README.md
npm-debug.log
.env.local
.env.*.local
```

### 2.4 Agregar `.env.example` (sin secretos)

```
# Este archivo documenta variables necesarias
# NO incluir valores reales en este archivo

REACT_APP_SUPABASE_URL=https://[proyecto].supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_key_here
NODE_ENV=development
```

---

## FASE 3: TESTING EN VERCEL (Día 2)

### 3.1 Deploy Preview

```
1. Hacer push a rama: git push origin staging
2. Vercel crea preview automáticamente
3. URL: https://sgja-staging.vercel.app
4. Probar todas funcionalidades
5. Si OK → merge a main
```

### 3.2 Monitoreo

```
1. Vercel Dashboard → Analytics
   - Page load times
   - Real User Monitoring (RUM)
   - Core Web Vitals
   
2. Performance Budget (opcional)
   ```json
   {
     "budgets": [
       {
         "maximum": 100,
         "metric": "LCP",
         "percentile": 75
       }
     ]
   }
   ```
```

---

## FASE 4: DOMINIO PERSONALIZADO (Día 2)

### 4.1 Configurar Dominio

**Si usas dominio propio (ej: sgja.ejemplo.com):**

```
1. Vercel Dashboard → Project → Settings → Domains
2. Agregar dominio personalizado
3. Vercel proporciona registros DNS a configurar:
   - A record: 76.76.19.67
   - CNAME: cname.vercel-dns.com
   
4. Configurar en registrador de dominio (GoDaddy, Namecheap, etc)
5. Esperar propagación DNS (5-30 minutos)

Alternativa: Vercel Nameservers
   1. Copiar nameservers de Vercel
   2. Ir a registrador de dominio
   3. Cambiar nameservers
   4. Vercel gestiona todo automáticamente
```

### 4.2 Certificado SSL

```
Vercel incluye HTTPS automáticamente con Let's Encrypt
No hay que hacer nada, es automático
```

---

## FASE 5: MIGRACIÓN DE DNS (Go-Live)

### 5.1 Preparación

```
1. Hacer último build de Firebase Hosting
   firebase deploy --only hosting
   
2. Verificar que Vercel está 100% funcional
   
3. Cambiar DNS apuntando a Vercel (si dominio personalizado)
```

### 5.2 Ejecución

**Opción A: DNS Cutover (recomendado)**

```
1. Cambiar registros DNS a Vercel
   A: 76.76.19.67 (o lo que dé Vercel)
   
2. Esperar propagación (5-30 minutos)
   
3. Verificar: dig sgja.ejemplo.com
   - Debe resolver a IP de Vercel
   
4. Tráfico automáticamente va a Vercel
```

**Opción B: Gradual (si necesitas rollback fácil)**

```
1. Mantener Firebase + agregar Vercel en DNS secundario
2. Cambiar porcentaje de tráfico a Vercel:
   75% → Vercel / 25% → Firebase (día 1)
   90% → Vercel / 10% → Firebase (día 2)
   100% → Vercel (día 3)
3. Si problemas: volver a 100% Firebase
```

### 5.3 Post-cutover

```
1. Monitorear en las primeras 2 horas:
   - Errores en Vercel
   - Latencia de API
   - Disponibilidad

2. Si todo OK: Deshabilitar Firebase Hosting (opcional)
   firebase hosting:disable

3. Mantener respaldo de Firebase por 1 semana
```

---

## FASE 6: MAPEO DE RUTAS / REWRITES

### 6.1 En `vercel.json` (según necesidad)

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "redirects": [
    {
      "source": "/old-page",
      "destination": "/new-page",
      "permanent": true
    },
    {
      "source": "/viejo-dashboard",
      "destination": "/dashboard",
      "permanent": true
    }
  ],
  "headers": [
    {
      "source": "/api/:path*",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=60, s-maxage=3600"
        }
      ]
    },
    {
      "source": "/images/:path*",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

---

## FASE 7: CI/CD Y DEPLOYMENTS AUTOMÁTICOS

### 7.1 Configurar GitHub Actions (opcional)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches:
      - main
      - staging

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: vercel/action@master
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          production: true
```

### 7.2 Workflows Automáticos

```
- main branch → producción ✓
- staging branch → preview ✓
- Pull requests → preview previamente
- Rollback: git revert + push
```

---

## FASE 8: MONITOREO EN PRODUCCIÓN

### 8.1 Vercel Analytics

```
1. Dashboard → Analytics
2. Monitorear:
   - First Contentful Paint (FCP)
   - Largest Contentful Paint (LCP)
   - Cumulative Layout Shift (CLS)
   - Time to Interactive (TTI)
```

### 8.2 Error Tracking (Integración)

```javascript
// Sentry (opcional, para errores frontend)
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://[id]@[subdomain].sentry.io/[project]",
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

### 8.3 Logs

```
- Vercel → Deployments → Logs
- Firebase → Console (durante transición)
- Navegador → DevTools Console
```

---

## COMPARATIVA: FIREBASE HOSTING vs VERCEL

| Aspecto | Firebase Hosting | Vercel |
|---|---|---|
| **Precio** | $0-6/mes (gratuito hasta 10GB) | $0-100/mes (gratuito hasta 100GB) |
| **Performance** | Bueno (CDN global) | Excelente (Edge Functions) |
| **Escalabilidad** | Manual | Automática |
| **Cold Start** | <100ms | <50ms |
| **Integración Git** | Básica | Excelente |
| **Branches preview** | Manual | Automáticas |
| **CI/CD** | Basic | Avanzado |
| **Serverless** | Cloud Functions | Functions/Edge |
| **Base de datos** | No incluye | Integrable con terceros |

---

## CHECKLIST PRE-MIGRACIÓN

- [ ] Cuenta Vercel creada
- [ ] Repo conectado
- [ ] Variables de ambiente configuradas
- [ ] `vercel.json` creado
- [ ] `package.json` actualizado
- [ ] Build local verificado: `npm run build`
- [ ] Preview en Vercel funcionando
- [ ] Dominio apuntando a Vercel (si aplica)
- [ ] SSL certificado validado
- [ ] Redirects/Rewrites configurados
- [ ] Analytics habilitado
- [ ] Error tracking configurado (Sentry)
- [ ] Load tests realizados
- [ ] Rollback plan documentado

---

## TIMELINE RECOMENDADO

```
Lunes:   Preparación + Configuración Vercel
Martes:  Testing en preview + DNS cutover
Miércoles: Monitoreo + Ajustes
Jueves:  Optimizaciones finales
Viernes: Documentación + Knowledge transfer
```

---

## ROLLBACK (Si falla)

```
1. Cambiar DNS de vuelta a Firebase Hosting (5 minutos)
   O cambiar tráfico a Firebase en DNS round-robin
   
2. Verificar https://sgja.ejemplo.com resuelve a Firebase
   dig sgja.ejemplo.com
   
3. Si API también cambió (Supabase): 
   - .env → apuntar a Firebase
   - npm run build
   - firebase deploy --only hosting
   
4. Tráfico vuelve a Firebase en <5 minutos
```

---

## POST-MIGRACIÓN (WEEK 2)

- [ ] Documentar lecciones aprendidas
- [ ] Optimizar queries lentas
- [ ] Implementar caché mejorado
- [ ] Feedback de usuarios
- [ ] Atenuar alertas falsas
- [ ] Establecer runbooks para issues comunes
- [ ] Training a equipo de support

---

## CONTACTOS Y RECURSOS

**Vercel:**
- Docs: https://vercel.com/docs
- Support: support@vercel.com

**Firebase:**
- Docs: https://firebase.google.com
- Para respaldo: se mantiene activo 1 semana post-migración

