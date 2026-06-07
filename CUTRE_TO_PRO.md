# De Cutre a Pro — Plan de mejora

Priorizado por **facilidad de implementación** (no por impacto).  
Cada item resuelve un problema concreto de los diagnosticados.

---

## 1. Errores silenciosos — catch blocks fantasma

**Qué está mal hoy:** Muchos `try/catch` hacen `console.log(error)` o simplemente `catch (e) {}`. El usuario nunca se entera de fallos silenciosos.

**Qué hay que hacer:**
- Reemplazar `console.log(error)` con `toast.error(mensaje)` o `console.error(error)` donde tenga sentido
- En operaciones críticas (login, guardar datos, eliminar) usar un helper `handleError(error, mensajeParaUsuario)`
- Eliminar catch blocks vacíos

**Archivos clave:** `database.ts`, `useAuth.ts`, componentes que llaman servicios

**Dificultad:** ⭐ Muy fácil — mecánico y repetitivo

**✅ COMPLETADO** — Se reemplazaron ~50 `console.error` con `handleError()`, se instaló `sonner`, se agregó `<Toaster />` en `App.tsx`. Quedan algunos `console.log` en componentes menores que no afectan la experiencia de usuario.

---

## 2. UI inconsistente — primer barrido visual

**Qué está mal hoy:** Mezcla de Bootstrap, estilos inline, colores arbitrarios, paddings dispares.

**Qué hay que hacer:**
- Quitar estilos inline obvios (`style={{...}}`) y reemplazar con clases existentes
- Unificar colores de botones: primario = azul, éxito = verde, peligro = rojo, etc.
- Revisar paddings/márgenes para que sean consistentes entre páginas
- NO refactorizar componentes, solo limpieza cosmética

**Dificultad:** ⭐⭐ Fácil — requiere ojo pero no arquitectura

---

## 3. service_role key en el bundle JS

**Qué está mal hoy:** `VITE_SUPABASE_ANON_KEY` en `.env.local` contiene la `service_role` key. Cualquiera que abra DevTools la tiene. Esa key bypassa TODAS las RLS.

**Qué hay que hacer:**
Opción más pragmática:
- Crear **funciones PostgreSQL SECURITY DEFINER** para cada operación admin que hoy usa la service_role key
- Ejemplos: `eliminar_usuario(uid)`, `aprobar_solicitud(solicitud_id)`, `reactivar_usuario(uid)`
- Llamar esas funciones vía `supabase.rpc()` desde el frontend
- Reemplazar la key en `.env.local` por la **anon key real** (rol anónimo con RLS)

**Opción alternativa** (más fácil pero menos segura): tener un backend endpoint (Vercel Function) que reciba requests autenticados y ejecute con service_role. Pero requiere deploy serverless.

**Dificultad:** ⭐⭐⭐ Medio

---

## 4. Routing artesanal → react-router

**Qué está mal hoy:** `AppContent.tsx` tiene un switch-case monstruoso para renderizar componentes según `rutaActiva`. Los links construyen `#/ruta` a mano.

**Qué hay que hacer:**
- Instalar `react-router-dom`
- Envolver App en `<HashRouter>`
- Reemplazar switch-case por `<Routes><Route path="/ruta" element={<Componente />} />...`
- Cambiar `window.location.hash` y links manuales por `<Link to="/ruta">` y `useNavigate()`
- El `?ticket=ID` se vuelve natural con `useSearchParams()`

**Dificultad:** ⭐⭐⭐⭐ Medio-alto — requiere tocar todos los componentes que navegan

---

## 5. Separación de responsabilidades

**Qué está mal hoy:** `useAuth.ts` mezcla hook (estado, efectos) con servicio (llamadas Supabase) y lógica de negocio (validaciones, transformaciones). `database.ts` es un monolito de 1000+ líneas.

**Qué hay que hacer:**
- `auth.service.ts` = login, logout, session, signUp
- `usuarios.service.ts` = CRUD usuarios, eliminar, reactivar, solicitudes
- `equipos.service.ts` = CRUD equipos, asignación
- `establecimientos.service.ts` = CRUD establecimientos + logo
- `sistema.service.ts` = config_sistema
- `useAuth.ts` se queda solo como hook (estado + efectos + llamadas a servicios)
- Cada componente importa solo el servicio que necesita

**Dificultad:** ⭐⭐⭐⭐⭐ Difícil — riesgo de romper acoplamientos existentes

---

## 6. Tests automatizados

**Qué está mal hoy:** Cero tests. Cualquier cambio se valida a ojo en producción.

**Qué hay que hacer:**
- Configurar Vitest + @testing-library/react
- Tests unitarios para servicios (auth, usuarios, equipos) — mockear Supabase
- Tests de integración para flujos críticos (login → ver dashboard, crear ticket, eliminar usuario)
- Opcional: Playwright para E2E (roles, navegación, permisos)

**Dependencia:** Idealmente después del #5 (servicios separados se testean mejor)

**Dificultad:** ⭐⭐⭐⭐⭐ Difícil

---

## Resumen visual

```
Prioridad 1  ⭐  ████████░░░░░░░░░░░░  Errores silenciosos
Prioridad 2  ⭐⭐ ████████████░░░░░░░░  UI inconsistente (barrido)
Prioridad 3  ⭐⭐⭐ ████████████████░░░░  service_role key
Prioridad 4  ⭐⭐⭐⭐ ████████████████████  Routing → react-router
Prioridad 5  ⭐⭐⭐⭐⭐ ████████████████████  Separar responsabilidades
Prioridad 6  ⭐⭐⭐⭐⭐ ████████████████████  Tests
```

> **Nota:** El orden es por **facilidad**, no por criticidad. Si fuera por riesgo/impacto, la #3 (service_role key) sería la #1.
