# Cloudflare Worker — Mapas JSON

## Objetivo

Hostear `plano_edificio.json` en Cloudflare Workers + KV para poder modificar nombres y salas del mapa sin redeployar la app principal.

## Arquitectura

```
App (Vercel)              Cloudflare
   |                          |
   |-- GET /plano.json -------|--> Worker lee de KV
   |                          |     (o GET /api/mapa)
   |                          |
   |-- PUT /api/mapa ---------|--> Worker escribe a KV
        (con auth token)           (solo admin)
```

- App en Vercel ya no sirve `public/plano_edificio.json`
- App consulta el Worker (`/plano.json`) en lugar de fetch local
- Cuando toca cambiar nombres, se hace PUT al Worker (curl, interfaz web, o botón desde la app)

## Proyecto Worker

### 1. Crear Worker

```bash
npx wrangler init mapa-json-worker
cd mapa-json-worker
```

### 2. Configurar KV

```toml
# wrangler.toml
name = "mapa-json-worker"
main = "src/index.ts"
compatibility_date = "2025-01-01"

[[kv_namespaces]]
binding = "MAPAS"
id = "<tu-kv-id>"
```

### 3. Código del Worker

```ts
// src/index.ts
export interface Env {
  MAPAS: KVNamespace;
}

// Token simple para escritura (cambiar en producción)
const ADMIN_TOKEN = "token-secreto-cambiame";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const key = "plano_edificio.json";

    if (request.method === "GET") {
      if (url.pathname !== "/plano.json") {
        return new Response("Not Found", { status: 404 });
      }
      const data = await env.MAPAS.get(key, "json");
      if (!data) {
        return new Response("No hay plano", { status: 404 });
      }
      return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    if (request.method === "PUT") {
      if (url.pathname !== "/api/mapa") {
        return new Response("Not Found", { status: 404 });
      }
      const auth = request.headers.get("Authorization");
      if (auth !== `Bearer ${ADMIN_TOKEN}`) {
        return new Response("No autorizado", { status: 401 });
      }
      const body = await request.json();
      await env.MAPAS.put(key, JSON.stringify(body));
      return new Response("OK", { status: 200 });
    }

    return new Response("Method Not Allowed", { status: 405 });
  },
};
```

### 4. Poblar KV inicial

```bash
# Desde la raíz del proyecto app
npx wrangler kv:key put plano_edificio.json "$(cat public/plano_edificio.json)" --binding MAPAS
```

### 5. Desplegar

```bash
npx wrangler deploy
```

## Cambios en la app

### Eliminar `public/plano_edificio.json` de Vercel

Opcional: borrarlo del repo o dejarlo como fallback.

### `MobileGrid.tsx` — cambiar fetch

```ts
// Antes
fetch('/plano_edificio.json')

// Después
fetch('https://mapa-json-worker.<tu-subdominio>.workers.dev/plano.json')
```

### `SyncMapa.tsx` — mismo cambio

```ts
fetch('https://mapa-json-worker.<tu-subdominio>.workers.dev/plano.json')
```

## Cómo cambiar nombres

Opción A — curl:

```bash
curl -X PUT https://mapa-json-worker.<subdominio>.workers.dev/api/mapa \
  -H "Authorization: Bearer token-secreto-cambiame" \
  -H "Content-Type: application/json" \
  -d "$(cat plano_edificio_actualizado.json)"
```

Opción B — interfaz rápida (HTML inline dentro del Worker en `/admin`):

Agregar al Worker un `if (url.pathname === "/admin")` que sirva un form HTML con un textarea, carga el JSON actual, permite editarlo y enviarlo con fetch PUT.

## Consideraciones

- **Cache**: Cloudflare Workers tiene cache automático. Si haces PUT, el GET puede servir stale hasta 60s o hasta que purgues. Agregar `Cache-Control: no-cache` o versión por query param.
- **Auth**: El token va en el Worker, no filters. Para más seguridad, usar API Key rotable o Cloudflare Access.
- **Tamaño**: KV soporta hasta 25MB por valor, el JSON actual es ~8KB, sin problema.
- **Costo**: Workers tiene 100k requests/día gratis, KV 1GB almacenamiento gratis.
- **Rollback**: `wrangler rollback` o repoblar KV con versión anterior.
