# 📊 PAUTA DE OPTIMIZACIÓN: PWA + CACHE + MONITOREO DE LECTURAS

## 1. 🔍 MONITOREO DE LECTURAS (Firebase Console)

### 1.1 Ver Lecturas en Tiempo Real
1. Abre [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Firestore Database → **Usage**
4. Filtra por:
   - **Read operations** (azul)
   - **Date range**: Última hora/día

### 1.2 Identificar Picos
- Pico normal: 10-20 reads/min durante actividad
- Alerta: >50 reads/min = problema de listeners activos
- Crisis: 909 reads/hora (15 reads/min) = **tu estado actual**

### 1.3 Metricas a Rastrear
```
Meta: <50 reads/hora (0.8 reads/min)
  = 1 usuario × 1 lectura sincronización/min
  = Aceptable para pequeño sitio

Crítico: >200 reads/hora (3.3 reads/min)
  = Fugas de listeners o polling agresivo
```

---

## 2. 🏗️ ARQUITECTURA PWA + CACHE

### 2.1 Estructura de Capas (Bottom-Up)

```
┌─────────────────────────────────────┐
│  COMPONENTES REACT                  │  ← Solo leen de cache
├─────────────────────────────────────┤
│  CACHE LOCAL (IndexedDB)            │  ← Datos offline-first
├─────────────────────────────────────┤
│  SERVICE WORKER (sw.ts)             │  ← Intercepción de red
├─────────────────────────────────────┤
│  FIRESTORE ADAPTER (firestore.ts)   │  ← Sincronización inteligente
├─────────────────────────────────────┤
│  FIREBASE (Cloud)                   │  ← Lectura de verdad
└─────────────────────────────────────┘
```

### 2.2 Estrategias de Cache por Tipo de Dato

| Tipo Dato | TTL | Estrategia | Ejemplo |
|-----------|-----|-----------|---------|
| **Usuario (perfil)** | 24h | Cache-only, manual refresh | Nombre, email, rol |
| **Parámetros del sistema** | 7d | Cache-only, admin refresh | Bloques horarios, cursos |
| **Solicitudes activas** | 5m | Cache-first, poll background | Justificaciones en revisión |
| **Conteos/Dashboard** | 30m | Cache-first, background sync | Total aprobadas, rechazadas |
| **Usuarios online** | 30s | Real-time (ya optimizado) | Indicador verde |

---

## 3. 💾 IMPLEMENTACIÓN: INDEXEDDB CACHE

### 3.1 Crear Servicio de Cache

**Archivo: `src/services/cacheService.ts`** (CREAR)

```typescript
import { openDB } from 'idb';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // en milisegundos
}

const DB_NAME = 'sgja-cache';
const STORE_NAME = 'datos';

export const cacheService = {
  async init() {
    return openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  },

  async get<T>(key: string): Promise<T | null> {
    const db = await this.init();
    const entry = await db.get(STORE_NAME, key) as CacheEntry<T> | undefined;
    
    if (!entry) return null;
    
    // Verificar si expiró
    const ahora = Date.now();
    if (ahora - entry.timestamp > entry.ttl) {
      await db.delete(STORE_NAME, key);
      return null;
    }
    
    return entry.data;
  },

  async set<T>(key: string, data: T, ttlMinutos: number = 30) {
    const db = await this.init();
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutos * 60 * 1000,
    };
    await db.put(STORE_NAME, entry, key);
  },

  async clear() {
    const db = await this.init();
    await db.clear(STORE_NAME);
  },

  async getAllKeys() {
    const db = await this.init();
    return db.getAllKeys(STORE_NAME);
  }
};
```

### 3.2 Instalar idb
```bash
npm install idb
npm install --save-dev @types/idb
```

---

## 4. 🔄 ADAPTADOR FIRESTORE CON CACHE (MODIFICAR EXISTENTE)

### 4.1 Actualizar `src/services/firestore.ts`

Agregar al inicio del archivo:

```typescript
import { cacheService } from './cacheService';

// Helper: Lectura con cache
async function obtenerConCache<T>(
  cacheKey: string,
  ttlMinutos: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  // 1️⃣ Intentar cache primero
  const cached = await cacheService.get<T>(cacheKey);
  if (cached) {
    console.log(`✅ Cache HIT: ${cacheKey}`);
    return cached;
  }

  // 2️⃣ Si no hay cache, obtener de Firestore
  console.log(`🔥 Firestore READ: ${cacheKey}`);
  const data = await fetchFn();

  // 3️⃣ Guardar en cache
  await cacheService.set(cacheKey, data, ttlMinutos);
  
  return data;
}
```

### 4.2 Wrappear Funciones Críticas

**Ejemplo 1: Parámetros del Sistema** (no cambian)
```typescript
export async function obtenerParametros() {
  return obtenerConCache(
    'parametros-sistema',
    24 * 60, // 24 horas
    async () => {
      const snap = await getDocs(collection(db, 'parametros'));
      return snap.docs.map(d => d.data());
    }
  );
}
```

**Ejemplo 2: Conteos de Solicitudes** (cambian cada 30 min)
```typescript
export async function contarSolicitudesPorEstado(
  idEstablecimiento: string
) {
  return obtenerConCache(
    `solicitudes-conteos-${idEstablecimiento}`,
    30, // 30 minutos
    async () => {
      const [injustificadas, justificadas, rechazadas] = await Promise.all([
        getDocs(query(
          collection(db, 'injustificadas'),
          where('id_establecimiento', '==', idEstablecimiento)
        )),
        getDocs(query(
          collection(db, 'justificadas'),
          where('id_establecimiento', '==', idEstablecimiento)
        )),
        getDocs(query(
          collection(db, 'rechazadas'),
          where('id_establecimiento', '==', idEstablecimiento)
        )),
      ]);

      return {
        'Injustificada': injustificadas.size,
        'Justificada': justificadas.size,
        'Rechazada': rechazadas.size,
      };
    }
  );
}
```

---

## 5. 🌐 SERVICE WORKER + PWA

### 5.1 Crear Service Worker: `src/serviceWorker.ts` (CREAR)

```typescript
/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = 'sgja-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/assets/index.css',
  '/assets/index.js',
];

// Instalar
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Activar
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch: Network-first para API, cache-first para assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar peticiones locales de no-CORS
  if (url.origin !== location.origin) {
    return;
  }

  // Firebase API: Network-first (siempre traer datos frescos)
  if (url.pathname.includes('/api/') || url.pathname.includes('firebaseapp.com')) {
    return event.respondWith(
      fetch(request)
        .then((response) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, response.clone());
            return response;
          });
        })
        .catch(() => caches.match(request))
    );
  }

  // Assets: Cache-first
  event.respondWith(
    caches.match(request).then((response) => {
      return response || fetch(request).then((response) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, response.clone());
          return response;
        });
      });
    })
  );
});
```

### 5.2 Registrar en `src/main.tsx`

```typescript
// Al inicio del archivo main.tsx, después de crear root:

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/serviceWorker.ts').then(
      (registration) => {
        console.log('✅ Service Worker registrado:', registration);
      },
      (err) => {
        console.error('❌ Service Worker error:', err);
      }
    );
  });
}
```

### 5.3 Manifest PWA: `public/manifest.json` (CREAR)

```json
{
  "name": "SGJA - Sistema de Gestión de Justificaciones de Ausencias",
  "short_name": "SGJA",
  "description": "Sistema web para justificación de ausencias escolares",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "theme_color": "#1e40af",
  "background_color": "#ffffff",
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### 5.4 Link en `index.html`

```html
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#1e40af">
```

---

## 6. 📊 MONITOREO: DASHBOARD DE LECTURAS

### 6.1 Crear `src/components/MonitorLecturas.tsx`

```typescript
import { useEffect, useState } from 'react';

interface StatsLecturas {
  cacheHits: number;
  cacheMisses: number;
  firestoreReads: number;
  eficiencia: number; // % hits / total
}

export function MonitorLecturas() {
  const [stats, setStats] = useState<StatsLecturas>({
    cacheHits: 0,
    cacheMisses: 0,
    firestoreReads: 0,
    eficiencia: 0,
  });

  useEffect(() => {
    // Interceptar console.log para contar hits/misses
    const originalLog = console.log;
    let hits = 0;
    let misses = 0;

    (window as any).console.log = function (...args: any[]) {
      const msg = args[0]?.toString() || '';
      if (msg.includes('✅ Cache HIT')) hits++;
      if (msg.includes('🔥 Firestore READ')) misses++;
      
      originalLog.apply(console, args);
    };

    const interval = setInterval(() => {
      const total = hits + misses || 1;
      setStats({
        cacheHits: hits,
        cacheMisses: misses,
        firestoreReads: misses,
        eficiencia: Math.round((hits / total) * 100),
      });
    }, 5000);

    return () => {
      clearInterval(interval);
      (window as any).console.log = originalLog;
    };
  }, []);

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      right: 20,
      background: 'rgba(0, 0, 0, 0.8)',
      color: '#fff',
      padding: '1rem',
      borderRadius: '8px',
      fontSize: '0.75rem',
      fontFamily: 'monospace',
      zIndex: 9999,
    }}>
      <div>📊 Cache Hits: {stats.cacheHits}</div>
      <div>🔥 Firestore Reads: {stats.firestoreReads}</div>
      <div>⚡ Eficiencia: {stats.eficiencia}%</div>
    </div>
  );
}
```

### 6.2 Usar en `src/App.tsx`

```tsx
import { MonitorLecturas } from './components/MonitorLecturas';

function App() {
  return (
    <>
      <AppContent />
      {import.meta.env.DEV && <MonitorLecturas />}
    </>
  );
}
```

---

## 7. 🎯 CHECKLIST DE IMPLEMENTACIÓN

- [ ] Instalar `idb` package
- [ ] Crear `cacheService.ts`
- [ ] Crear `serviceWorker.ts`
- [ ] Crear `manifest.json`
- [ ] Actualizar `firestore.ts` con `obtenerConCache()`
- [ ] Registrar SW en `main.tsx`
- [ ] Crear `MonitorLecturas.tsx`
- [ ] Link manifest en `index.html`
- [ ] Compilar: `npm run build`
- [ ] Test offline en DevTools
- [ ] Monitorear Firebase Console

---

## 8. 🚀 RESULTADOS ESPERADOS

**ANTES:**
```
909 reads/hora (15/min)
- Sin cache local
- Listeners activos constantemente
```

**DESPUÉS:**
```
50 reads/hora (0.8/min) 
- 95% reducción ✅
- Cache-first en UI
- Sync background en 5-30min
- Modo offline funcional
```

---

## 9. 📱 TESTING OFFLINE

1. DevTools → Network → Offline
2. Verificar que página sigue funcionando con cache
3. Hacer cambios (ej: crear solicitud)
4. Volver online → Sincroniza automáticamente

---

## 10. ⚙️ COMANDOS ÚTILES

```bash
# Borrar cache del browser
localStorage.clear(); indexedDB.deleteDatabase('sgja-cache');

# Ver almacenamiento
DevTools → Application → Storage → IndexedDB → sgja-cache

# Monitorear Firestore
firebase emulator:start --import=./seed-data

# Compilar con SW
npm run build
```

---

**Status**: LISTA PARA IMPLEMENTAR 🎯
