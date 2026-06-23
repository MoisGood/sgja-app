# SGJA — Documento Consolidado

> **Sistema de Gestión de Justificaciones de Ausencias y Biblioteca**
> BackUp · Última actualización: 22 Jun 2026

---

## Índice

1. [Información General](#1-información-general)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Repositorio Git](#3-repositorio-git)
4. [Onboarding para Desarrolladores](#4-onboarding-para-desarrolladores)
5. [Estado Actual del Proyecto](#5-estado-actual-del-proyecto)
6. [Trabajo Realizado (Sesión Actual)](#6-trabajo-realizado-sesión-actual)
7. [Módulo Académico — Análisis Completo](#7-módulo-académico--análisis-completo)
8. [Plan de Trabajo — Fechas Push](#8-plan-de-trabajo--fechas-push)
9. [Decisiones Clave](#9-decisiones-clave)
10. [Infraestructura](#10-infraestructura)
11. [Archivos Relevantes](#11-archivos-relevantes)
12. [Pendientes por Definir](#12-pendientes-por-definir)
13. [Próximos Pasos](#13-próximos-pasos)

---

## 1. Información General

| Campo | Valor |
|-------|-------|
| **Nombre del proyecto** | SGJA |
| **Nombre completo** | Sistema de Gestión de Justificaciones de Ausencias y Biblioteca |
| **Propósito** | Plataforma educativa para la educación pública chilena: administrativo (tickets, equipos, mapa) + académico (aprendizaje autodirigido, evaluación QR, diagnóstico adaptativo) |
| **Público objetivo** | Establecimientos educacionales chilenos (SLEP, municipales, particulares subvencionados) |
| **Paradigma central** | Aprendizaje autodirigido con orquestación digital — el docente pasa a ser monitor, el sistema es el motor pedagógico |
| **Diferenciador** | Offline-first (100% funciona sin internet) — a diferencia de Netcore/Eduplan que requieren conexión permanente |
| **Estado** | En desarrollo activo — módulos administrativos funcionales, módulo académico en planificación |
| **Metodología** | Push-based: fechas límite donde el sistema debe estar listo para mostrar a usuarios reales |

---

## 2. Stack Tecnológico

| Tecnología | Versión | Uso |
|------------|---------|-----|
| **React** | ^19.2.4 | UI / Componentes |
| **Vite** | ^8.0.0 | Bundler / Dev server |
| **TypeScript** | ~5.9.3 | Lenguaje |
| **Tailwind CSS** | ^4.2.2 | Estilos |
| **Supabase** | ^2.105.4 | Backend: Auth, DB, Storage, Edge Functions |
| **React Router** | ^7.13.1 | Enrutamiento |
| **Framer Motion** | ^12.40.0 | Animaciones |
| **Vite PWA Plugin** | ^1.3.0 | Service Worker / PWA |
| **idb** | ^8.0.3 | IndexedDB (offline-first) |
| **zxing-wasm** | ^3.1.0 | QR / DataMatrix (wasm) |
| **html5-qrcode** | ^2.3.8 | QR vía cámara (fallback) |
| **qrcode** | ^1.5.4 | Generación de QR |
| **sonner** | ^2.0.7 | Toasts / notificaciones |
| **swiper** | ^12.2.0 | Slider táctil (mobile mapa) |
| **lucide-react** | ^0.577.0 | Iconos |
| **nodemailer** | ^8.0.7 | Envío de correos (Edge Function) |
| **Vitest** | ^3.2.6 | Tests unitarios |

### Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia servidor de desarrollo |
| `npm run build` | TypeScript check + build Vercel |
| `npm run lint` | ESLint |
| `npm run test` | Vitest tests |
| `npm run doctor` | React Doctor (calidad componentes) |

---

## 3. Repositorio Git

- **URL remota:** `https://github.com/MoisGood/sgja-app.git`
- **Rama principal:** `main` (por defecto)
- **Git local:** `C:\Program Files\Git\bin\git.exe` (no está en PATH — ejecutar con ruta completa si es necesario)
- **Últimos commits relevantes:**

```
fc5812f fix: TypeScript errors en Equipos.tsx (tipo_equipo undefined, dragRef null en callback)
2c13c3b plano_edificio.json: renombra Secret->Secretaría, Dir->Dirección, Inspect.->Inspectoría
29a5bef feat: equipos filters/pagination, user management establishment, map sync fix
b68dc65 feat: scripts SQL, documentacion, analisis python
0e0c422 feat: migrations 015-024
```

### .gitignore

```
node_modules/
dist/
.wrangler/
supabase/.temp/
temp/
*.zip
.DS_Store
*.log
.env
.env.local
```

---

## 4. Onboarding para Desarrolladores

### Requisitos

- Node.js >= 18
- npm
- Git
- Cuenta Supabase (o acceso al proyecto existente)
- (Opcional) Wrangler CLI para Cloudflare Workers

### Pasos

```powershell
# 1. Clonar
git clone https://github.com/MoisGood/sgja-app.git
cd sgja-app

# 2. Instalar dependencias
npm install

# 3. Crear .env.local (pedir credenciales al líder técnico)
# VITE_SUPABASE_URL=https://iyxubvtfhcmlivivdfpt.supabase.co
# VITE_SUPABASE_ANON_KEY=<entregada por separado>
# VITE_APP_URL=http://localhost:5173

# 4. (Opcional) Supabase local
npx supabase start
npx supabase migration up

# 5. Iniciar desarrollo
npm run dev
```

### Credenciales y secretos

- `.env` y `.env.local` están en `.gitignore` — **nunca se commitean**
- Contienen: GMAIL_USER, GMAIL_APP_PASSWORD, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
- Compartir por canal seguro (no por git)

### Documentación existente

- `START_HERE.txt` — **OBSOLETO** (habla de Firebase Custom Claims, el proyecto migró a Supabase)
- `analisis/README.md` — Análisis completo del módulo académico
- `analisis/plan-trabajo.md` — Plan de trabajo con fechas push
- `analisis/modulo-academico.html` — Página HTML interactiva con ambos análisis
- `docs/cloudflare-worker-mapa.md` — Plan para migrar mapa a Cloudflare Workers + KV

---

## 5. Estado Actual del Proyecto

### ✅ Completado — Módulos Administrativos

| Módulo | Estado | Descripción |
|--------|--------|-------------|
| **Sistema de Tickets** | ✅ Producción | CRUD, estados, prioridades, asignación |
| **Equipos / Dispositivos** | ✅ Producción | CRUD con barcode/DataMatrix scanner (zxing-wasm), filtros, paginación, toggle inventariable |
| **Mapa de pisos** | ✅ Producción | Desktop: `MapaPiso.tsx` (DB `lugares`). Mobile: `MobileGrid.tsx` (`plano_edificio.json`). Editor visual de planos. |
| **Usuarios / Roles** | ✅ Producción | Auth Supabase, roles personalizados, mantenedor de roles |
| **Establecimientos** | ✅ Producción | CRUD, logo upload, configuración |
| **Sincronización mapa** | ✅ Producción | `SyncMapa.tsx` — sincroniza JSON ↔ DB |
| **Correos** | ⚠️ Parcial | Edge Function `/api/send-email` no existe aún en Supabase → error JSON parse manejado gracefulmente |
| **Custom Claims** | ⛔ Bloqueado | `customClaimsService.ts` — ambos funciones son stubs ("Feature not yet implemented") |
| **Mantenedor Roles** | ⛔ Bloqueado | Verificación "rol en uso" aún TODO |
| **PWA** | ✅ Configurado | Service Worker con Workbox, auto-update, offline-capable |

### 🔄 En Progreso

| Módulo | Estado | Descripción |
|--------|--------|-------------|
| **Módulo Académico** | 📋 Planificación | Análisis completo, plan de trabajo, HTML interactivo. A la espera de respuestas del usuario para comenzar codificación. |

### ⚠️ Issues Conocidos

| Issue | Causa | Estado |
|-------|-------|--------|
| PWA sirve assets stale post-redeploy | Service worker cachea | Workaround: unregister + clear site data |
| Dos fuentes de verdad para mapa | DB `lugares` + `plano_edificio.json` | Nombres mantenidos en sync manualmente |
| Edge Function `/api/send-email` no existe | No creada en Supabase | Error manejado gracefulmente |
| `customClaimsService.ts` son stubs | No implementado | Retornan "Feature not yet implemented" |
| `git` no está en PATH | Instalado en `C:\Program Files\Git\bin\git.exe` | Usar ruta completa |

---

## 6. Trabajo Realizado (Sesión Actual)

### 6.1 Fix: Tres nombres de mapa corregidos

**Archivo:** `public/plano_edificio.json`
**Commit:** `2c13c3b`

Corrección de tres nombres en el JSON del plano:
- `"Secret"` → `"Secretaría"`
- `"Dir"` → `"Dirección"`
- `"Inspect."` → `"Inspectoría"`

### 6.2 Fix: TypeScript errors en Equipos.tsx

**Archivo:** `src/pages/Equipos.tsx`
**Commit:** `fc5812f`

- Null checks en `dragRef.current`
- Type narrowing en `tipo_equipo`
- Build ahora pasa sin errores

### 6.3 Análisis de PDF "Visión de Evolución de la Educación Pública Chilena"

**Archivo:** `analisis/Visión de Evolución de la Educación Pública Chilena.pdf`

Documento de 6 páginas que describe una visión institucional para la educación chilena. Coincide casi perfectamente con nuestro modelo:

| PDF dice | Nosotros ya lo tenemos |
|----------|------------------------|
| Monitor (no profe tradicional) | ✅ Monitor/Guía en README.md |
| Aprendizaje autónomo supervisado | ✅ Salas de aprendizaje + rutas personalizadas |
| Evaluación de competencias reales | ✅ Desempeño por sala, diagnóstico adaptativo |
| Retroalimentación inmediata | ✅ QR corrección automática, IA en tiempo real |
| Continuidad si profe ausente | ✅ Sistema funciona sin docente, monitor orquesta |
| Etapas 1→5 (infraestructura → transformación) | ✅ Coincide con nuestro roadmap Q3 2026→2028 |

**Aportes del PDF que no teníamos tan explícitos:**
1. **Heurísticas > IA generativa** — Usar árboles de decisión, secuencias didácticas; no depender de modelos generativos
2. **Medir habilidades blandas** — Persistencia, autonomía, colaboración
3. **"Repetir explicaciones, cambiar estrategias"** — El sistema debe iterar si no aprende
4. **Caso de uso: profe ausente** — Qué pasa si el profe se fue a capacitación y no hay reemplazo

### 6.4 Fix: HTML del Plan de Trabajo no visible

**Archivo:** `analisis/modulo-academico.html`

Se reemplazó el sistema de tabs JavaScript por navegación con anclas HTML puras (#aprendizaje, #plan). Ambos contenidos son ahora visibles en la misma página. Se agregó re-renderizado de Mermaid al cambiar de sección.

### 6.5 MD2 creado

Se creó `MD2/` con este documento consolidado.

### 6.6 Onboarding documentado

Se identificó la URL del repo git y se documentaron los pasos para que otro desarrollador pueda trabajar en el proyecto.

---

## 7. Módulo Académico — Análisis Completo

### 7.1 Paradigma

El docente tradicional es reemplazado por un **Monitor** (persona multifuncional) que orquesta el sistema y los estudiantes. El departamento **P.I.E.** se enfoca exclusivamente en quienes necesitan apoyo profundo. El **sistema** es el motor pedagógico: diagnostica, recomienda, evalúa y orquesta las estaciones de aprendizaje.

### 7.2 Roles Rediseñados

| Rol tradicional | Nuevo rol | Función |
|----------------|-----------|---------|
| Docente | Monitor / Guía | Orquesta salas, resuelve dudas, ve dashboard |
| Jefe UTP | Diseñador curricular | Define objetivos, configura estaciones, analiza métricas |
| PIE | Intervención especializada | Recibe alertas del sistema, trabaja con estudiantes en riesgo |
| Estudiante | Sujeto activo | Elige ruta, avanza a su ritmo, colabora, investiga |

### 7.3 Referentes Conceptuales

| Referente | Principio |
|-----------|-----------|
| **SOLE (Sugata Mitra)** | Niños aprenden solos con computadora si el entorno es estimulante |
| **Videojuegos** | Tutorial interactivo, dificultad adaptativa, feedback inmediato |
| **Salas de aprendizaje** | Distintos espacios con distintos estímulos |

### 7.4 Principios de Diseño

1. **Offline-first**: PWA + IndexedDB. 100% funciona sin internet.
2. **QR como puente**: Cada estudiante tiene código único. Actividades lo usan para trazabilidad.
3. **Estudiante como eje**: Todo gira en torno al estudiante y su ritmo.
4. **IA como orquestadora**: Detecta patrones, sugiere cambios, alerta.
5. **Salas de aprendizaje**: Espacio físico dividido en estaciones con distintos estímulos.
6. **Integración Moodle (futuro)**: Moodle es repositorio, sistema es cerebro pedagógico.

### 7.5 Salas de Aprendizaje

| Sala | Estímulo | Actividad | Tecnología |
|------|----------|-----------|------------|
| **Cognitiva** | Individual | Diagnóstico adaptativo, ejercicios progresivos | Pantalla táctil, lápiz óptico |
| **Audiovisual** | Grupal | Video interactivo, simulación, VR (futuro) | Proyector, audífonos, VR |
| **Colaborativa** | Grupal | Problemas en equipo, debates, proyectos | Mesa táctil, pizarra digital |
| **Investigativa** | Individual/Grupal | Búsqueda guiada, experimentos, análisis | Navegador controlado, laboratorio físico |
| **Evaluación** | Individual | Prueba impresa con QR, captura, corrección automática | Impresión QR + cámara |

### 7.6 Fase 1 — Registro de Desempeño (Q3 2026)

**Objetivo:** Reemplazar el libro de clases físico. El monitor registra desempeño en cada sala.

**Componentes:**
- CRUD de actividades (nombre, fecha, ponderación, sala, asignatura)
- Registro de desempeño (nota 1.0–7.0 por estudiante por actividad)
- Cálculo de promedios ponderados por asignatura y periodo
- Reportes: dashboard con distribución, tendencia, alertas bajo rendimiento
- Alertas PIE: si un estudiante mantiene promedio < 4.0 en 2+ actividades consecutivas

**Tablas base:**
```sql
asignaturas (id, nombre, nivel, horas_semanales, activo)
periodos (id, nombre, fecha_inicio, fecha_fin, activo)
salas_aprendizaje (id, nombre, tipo, capacidad, activo)
-- tipo: cognitiva, audiovisual, colaborativa, investigativa, evaluacion
actividades (id, id_asignatura, id_periodo, id_sala, nombre, ponderacion, fecha, activo)
desempeno (id, id_actividad, id_estudiante, nota, observaciones, created_at, activo)
promedios (id, id_estudiante, id_asignatura, id_periodo, promedio_final, estado, activo)
```

### 7.7 Fase 2 — Evaluación con QR (Q4 2026)

**Objetivo:** El monitor genera prueba formal, la imprime con QR único por estudiante, captura con móvil y el sistema corrige automáticamente.

**Flujo:**
1. Monitor crea prueba desde plantilla
2. Define preguntas con alternativas
3. Sistema genera PDF por estudiante con QR único
4. Imprime y aplica en Sala de Evaluación
5. Estudiante marca círculos en papel
6. Monitor captura hojas con cámara del móvil
7. QR identifica estudiante + prueba
8. Detección de círculos → respuestas
9. Corrección automática contra plantilla
10. Nota se registra en desempeño
11. IA sugiere siguiente sala según resultados

**Algoritmo de detección de círculos:**
1. Capturar imagen → canvas 2D
2. Escala de grises
3. Umbral adaptativo (binarización)
4. Detección de contornos (Canny)
5. Filtrar: relación aspecto 0.8-1.2, radio > 8px, densidad píxeles oscuros > umbral
6. Mapa de respuestas → [A, B, C, D, E] → [0, 1, 0, 0, 0]
7. Comparar con plantilla → puntaje → nota

**Tablas adicionales:**
```sql
preguntas (id, id_asignatura, tipo, enunciado, alternativas_json, respuesta_correcta, dificultad, activo)
pruebas (id, id_actividad, instrucciones, preguntas_ids, created_at, activo)
pruebas_estudiante (id, id_prueba, id_estudiante, qr_hash, pdf_url, estado, created_at)
respuestas (id, id_prueba_estudiante, id_pregunta, alternativa_marcada, correcta, created_at)
resultados_prueba (id_prueba, id_estudiante, puntaje_total, nota)
```

### 7.8 Fase 3 — Diagnóstico Adaptativo + Rutas Personalizadas (Q1 2027)

**Objetivo:** Plataforma que diagnostica al estudiante, asigna salas según perfil, recomienda contenido y mide progreso.

**Algoritmo adaptativo:**
1. Banco de preguntas etiquetadas por: eje temático, habilidad (conocer, aplicar, analizar, evaluar, crear), dificultad (1-5), sala recomendada si falla
2. Comienza con dificultad media (3)
3. Por cada respuesta: correcta → +1 dificultad, incorrecta → -1 dificultad
4. Tras 15-20 preguntas estima: nivel por eje, nivel por habilidad, sala prioritaria
5. Sistema asigna siguiente sala automáticamente
6. Monitor confirma o ajusta

**Tablas adicionales:**
```sql
perfiles_aprendizaje (id, id_estudiante, id_asignatura, nivel_general, ejes_json, habilidades_json, sala_recomendada, ultima_actualizacion)
rutas_aprendizaje (id, id_estudiante, id_asignatura, salas_json, progreso, estado, activo)
sesiones_sala (id, id_estudiante, id_sala, id_actividad, hora_entrada, hora_salida, metricas_json, activo)
contenido (id, id_asignatura, titulo, tipo, url, nivel_dificultad, sala_origen, activo)
progreso_contenido (id, id_estudiante, id_contenido, estado, intentos, puntaje_post, created_at)
```

### 7.9 Integración con IA (Prompt de análisis)

```json
{
  "context": "Resultados de 30 estudiantes en Sala Cognitiva",
  "data": {
    "preguntas": [
      { "id": 1, "eje": "numeros", "habilidad": "aplicar", "aciertos": 22, "total": 30 },
      { "id": 2, "eje": "algebra", "habilidad": "analizar", "aciertos": 8, "total": 30 }
    ],
    "estudiantes_riesgo": ["id_5", "id_12"],
    "rutas_actuales": { ... }
  },
  "instruccion": "Analiza y genera: 1) Resumen de la sesión 2) 3 estudiantes que deberían cambiar de sala 3) Alertas para PIE 4) Sugerencia de contenido para cada sala"
}
```

### 7.10 Fase 4 — Sala Inteligente (Visión Artificial) — 2028

| Componente | Descripción | Tecnología |
|------------|-------------|------------|
| **Asistencia facial** | Cámara detecta rostros al entrar | TensorFlow.js |
| **Monitoreo de atención** | Detecta si estudiante está enfocado o distraído | TensorFlow.js |
| **Reconocimiento de gestos** | Estudiante levanta la mano → alerta | TensorFlow.js |
| **Test interactivo táctil** | Arrastre, dibujo, gestos | Canvas + Touch |
| **Habilidades blandas** | Participación, turnos, comunicación | Métricas de interacción |

**Flujo aula del futuro:**
1. Entrada → Cámara detecta estudiantes → Registro automático
2. Instrucción → Sistema reproduce contenido según ruta
3. Monitoreo → IA detecta desconexión → Alerta al monitor
4. Interacción → Estudiante responde en pantalla táctil
5. Síntesis → Sistema genera reporte por habilidad
6. Cierre → Recomienda siguiente sala según desempeño

### 7.11 Integración con Moodle

```
Sistema (orquestador offline-first) ◄──API──► Moodle LMS (repositorio)
```

| Dato | Origen | Destino | Frecuencia |
|------|--------|---------|------------|
| Desempeño | Sistema | Moodle | Diario |
| Estudiantes | Moodle | Sistema | Semestral |
| Contenido | Moodle | Sistema (caché offline) | Al conectarse |
| Diagnósticos | Sistema | Moodle | Después del test |
| Alertas PIE | Sistema | Moodle (campo) | Tiempo real |

### 7.12 Roadmap

```
Q2 2026 ──── Módulos base (tickets, equipos, mapa) ✅
                 ↓
Q3 2026 ──── Registro de desempeño por sala (básico) + Blog interno
                 ↓
Q4 2026 ──── Evaluación digital con QR + corrección automática
                 ↓
Q1 2027 ──── Diagnóstico adaptativo + rutas personalizadas + alertas PIE
                 ↓
Q2 2027 ──── Integración Moodle
                 ↓
Q3 2027 ──── Piloto en establecimiento real
                 ↓
2028     ──── Sala inteligente con visión artificial
```

### 7.13 Riesgos y Mitigaciones

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Monitores no adoptan el sistema | Alto | Capacitación gradual, interfaz simple, modo offline |
| Internet inestable | Alto | PWA + IndexedDB + SQLite futuro |
| Resistencia al cambio | Medio | Mostrar reducción de carga administrativa |
| Privacidad de datos (Ley 21.719) | Alto | Datos cifrados, logs de acceso, roles |
| Dependencia de una persona | Medio | Documentación, código modular, formación de segundo monitor |
| Integración Moodle frágil | Medio | API versionada, fallback manual, logs |

### 7.14 Notas de Implementación

1. **Estructura de archivos:** Módulos académicos en `src/pages/academico/` con componentes y servicios propios.
2. **Tecnologías futuras:** OpenCV.js (detección de círculos), TensorFlow.js (visión), Web Speech API, jsPDF.
3. **Offline-first:** Toda la lógica académica funciona sin conexión. Sincronización diferida.
4. **QR:** El sistema actual ya tiene zxing-wasm. Se reutiliza para identificación y evaluaciones.
5. **Salas como eje:** La tabla `salas_aprendizaje` es central.

---

## 8. Plan de Trabajo — Fechas Push

### 8.1 Workflow por Feature

```
Análisis + Docs → Diseño → Código + Commit → Pruebas → Documentación → Blog post + Difusión
```

Cada feature pasa por:
1. README.md con análisis y decisión
2. Commit con código
3. Post en blog interno explicando el cambio
4. Difusión en RRSS internas (WhatsApp, grupos)

### 8.2 Fechas Push

| Hito | Fecha | Qué debe estar listo |
|------|-------|---------------------|
| **Push 1** — Registro de Desempeño | Q3 2026 | CRUD actividades + notas + promedios + dashboard básico + alertas PIE |
| **Push 2** — Blog Interno | Q3 2026 | Blog funcional + primer post explicando el sistema + botón WhatsApp |
| **Push 3** — Evaluación QR | Q4 2026 | Generación de prueba, QR por estudiante, captura móvil, corrección automática |
| **Push 4** — Diagnóstico Adaptativo | Q1 2027 | Test adaptativo + rutas personalizadas + alertas PIE automáticas |
| **Push 5** — Piloto EE Real | Q3 2027 | Todo el módulo académico funcionando en establecimiento real |

### 8.3 Estrategia de Contenido (Blog)

| Elemento | Descripción |
|----------|-------------|
| **Ubicación** | Ruta `/blog` dentro de la app |
| **Visibilidad** | Solo usuarios autenticados |
| **Contenido inicial** | Posts explicando cada módulo nuevo |
| **Generación** | IA genera borrador al terminar cada feature (lee diff commit + análisis) |
| **Difusión** | Botón compartir WhatsApp con mensaje predefinido |
| **Frecuencia** | 1 post por feature + 1 semanal de tips/tutoriales |

### 8.4 Flujo de Contenido Automatizado

1. Terminas feature → haces commit
2. Ejecutas script que:
   - Lee el diff del commit
   - Lee el análisis en `analisis/README.md`
   - Genera borrador de post para el blog
3. Revisas, ajustas, publicas
4. El post se difunde a grupos de WhatsApp/RRSS

### 8.5 Estrategia de Adopción

```
Blog post: problema conocido
  → "¿Cuántas horas pierdes corrigiendo?"
  → Muestra solución: sistema + QR
  → Ofrece alivio inmediato
  → Usuario prueba una vez
  → ¿Resolvió el problema?
    → Sí: Uso recurrente → Dependencia del sistema → Siguiente módulo
    → No: Ajuste + nuevo post
```

> No vendes el sistema. Vendes **menos carga administrativa**. Lo académico entra después, cuando confíen.

---

## 9. Decisiones Clave

### 9.1 Paradigma

- ✅ El docente tradicional → **Monitor** que orquesta, no enseña
- ✅ Las calificaciones → **Seguimiento de desempeño** por sala
- ✅ Los cursos → **Salas de aprendizaje** (el estudiante rota)
- ✅ El PIE recibe **alertas automáticas**
- ✅ El sistema evoluciona de administrativo (tickets, equipos, mapa) → **académico**

### 9.2 Offline-first

- ✅ Core differentiator vs Netcore/Eduplan (requieren internet)
- ✅ PWA + IndexedDB. SQLite considerado para futuro.
- ✅ 100% de features deben funcionar sin conexión

### 9.3 QR como puente

- ✅ Cada estudiante tiene código único
- ✅ Pruebas impresas incluyen QR para identificación y corrección automática
- ✅ `zxing-wasm` ya integrado para QR/DataMatrix

### 9.4 Herramientas de Desarrollo

| Aspecto | opencode | Claude Code |
|---------|----------|-------------|
| **Costo** | Gratuito (open source) | $20/mes Pro |
| **Calidad** | Depende del modelo | Claude Sonnet excelente |
| **Recomendación** | ✅ Elegido por economía | Opcional para tareas complejas |

### 9.5 Mapa

- ✅ `plano_edificio.json` es la fuente de verdad estática para mobile
- ✅ Ediciones manuales + redeploy para cambios de nombre
- 🔄 Cloudflare Worker + KV considerado si la frecuencia de cambios aumenta

### 9.6 Estrategia de Contenido

- ✅ Blog interno en `/blog`, autenticado
- ✅ IA genera borradores desde diff + análisis
- ✅ Usuario revisa antes de publicar
- ✅ Botón compartir WhatsApp

---

## 10. Infraestructura

### 10.1 Vercel (Hosting)

- **URL producción:** (relacionada a sgja-ii0atyz5d...vercel.app)
- **Build command:** `npm run build && npx vercel deploy --prod`
- **PWA:** Configurado con workbox, skipWaiting, clientsClaim

### 10.2 Supabase (Backend)

- **URL:** `https://iyxubvtfhcmlivivdfpt.supabase.co`
- **Auth:** Manejo de usuarios, sesiones, roles
- **Base de datos:** PostgreSQL con 26 migraciones SQL
- **Storage:** Buckets para logos, evidencias
- **Edge Functions:** Algunas planeadas (send-email), no todas implementadas
- **Schema SQL:** En `supabase/schema.sql` (solo header) + `supabase/migrations/` (26 archivos)

### 10.3 Cloudflare Workers (Futuro)

- **Propósito:** Hosting del `plano_edificio.json` para ediciones sin redeploy
- **Stack:** Worker + KV
- **Auth:** Bearer token para escritura
- **Documentación:** `docs/cloudflare-worker-mapa.md`

### 10.4 Estructura de Archivos Clave (src/)

```
src/
├── components/
│   ├── MapaPiso.tsx       — Mapa desktop (lee DB lugares)
│   ├── MobileGrid.tsx     — Mapa mobile (lee plano_edificio.json)
│   ├── SyncMapa.tsx       — Sincronización JSON ↔ DB
│   └── ...
├── pages/
│   ├── Equipos.tsx        — CRUD equipos con barcode scanner
│   ├── Tecnico.tsx        — Panel técnico con tabs (incluye SyncMapa)
│   └── academico/         — (futuro) Módulos académicos
├── services/
│   ├── emailService.ts    — Envío de correos
│   ├── barcodeDecoder.ts  — Decodificación QR/DataMatrix
│   └── customClaimsService.ts — (stub) "Not yet implemented"
├── hooks/
│   └── useCustomClaims.ts — (legacy Firebase)
└── ...
```

---

## 11. Archivos Relevantes

| Archivo | Descripción |
|---------|-------------|
| `analisis/README.md` | Análisis completo del módulo académico (384 líneas) |
| `analisis/plan-trabajo.md` | Plan de trabajo con fechas push, workflow, decisiones (101 líneas) |
| `analisis/modulo-academico.html` | Página HTML interactiva con Tailwind, Mermaid, Chart.js (ambos contenidos) |
| `analisis/Visión de Evolución de la Educación Pública Chilena.pdf` | PDF institucional analizado (6 páginas) |
| `docs/cloudflare-worker-mapa.md` | Plan para migrar mapa a Cloudflare Worker + KV (148 líneas) |
| `public/plano_edificio.json` | Mapa mobile fuente de verdad (3 nombres corregidos) |
| `src/pages/Equipos.tsx` | CRUD equipos con scanner (fix TS errors aplicado) |
| `src/services/customClaimsService.ts` | Stub — "Feature not yet implemented" |
| `START_HERE.txt` | ⚠️ OBSOLETO — habla de Firebase, no actualizado a Supabase |
| `package.json` | Dependencias y scripts |
| `vite.config.ts` | Config Vite + PWA + middleware save-plano |
| `tsconfig.app.json` | TypeScript config para src/ |
| `supabase/migrations/` | 26 migraciones SQL de base de datos |
| `supabase/data/` | Datos de prueba (seed data) para desarrollo local |

---

## 12. Pendientes por Definir

El usuario debe responder estas preguntas antes de comenzar la codificación del módulo académico:

### 12.1 Registro de Desempeño

- **¿Online u offline-first desde el inicio?** ¿PWA + IndexedDB desde el día 1, o arrancamos online y agregamos offline después?
- **¿Planilla o uno por uno?** ¿El monitor ve a todos los estudiantes y llena notas en lote, o ingresa estudiante por estudiante?

### 12.2 Blog

- **¿Comentarios habilitados?** ¿Solo lectura o los usuarios pueden comentar?
- **¿Revisión de borradores?** ¿Tú revisas el borrador que genera la IA, o publicas directo?

### 12.3 Fechas Push

- ¿Confirmas o ajustas las fechas tentativas?
  - Push 1 + 2: Q3 2026 (desempeño + blog)
  - Push 3: Q4 2026 (QR evaluación)
  - Push 4: Q1 2027 (diagnóstico adaptativo)
  - Push 5: Q3 2027 (piloto real)

### 12.4 Leyes a Investigar (futuro)

- **Ley 21.719** — Protección de Datos Personales
- **LGE 20.370** — Ley General de Educación
- **Reglamento de Calificaciones** — Escala 1.0–7.0, ponderaciones
- **Normativa SLEP** — Compras, licitaciones, integración sistemas oficiales

---

## 13. Próximos Pasos

### Inmediatos

1. ✅ El usuario responde preguntas pendientes (online/offline, planilla/individual, blog comentarios, revisión IA)
2. 🔲 Diseñar y crear tablas `salas_aprendizaje` + `desempeno` + `actividades` y RPCs
3. 🔲 Construir CRUD básico de actividades y registro de desempeño
4. 🔲 Construir ruta `/blog` con primer post y botón WhatsApp

### Corto Plazo (Q3 2026)

5. 🔲 Dashboard básico del monitor con distribución y tendencias
6. 🔲 Alertas PIE para estudiantes con bajo rendimiento sostenido
7. 🔲 Script de generación automatizada de blog posts

### Mediano Plazo (Q4 2026)

8. 🔲 Generación de pruebas con QR
9. 🔲 Captura móvil y corrección automática
10. 🔲 Algoritmo de detección de círculos

### Largo Plazo (Q1 2027 →)

11. 🔲 Test diagnóstico adaptativo
12. 🔲 Rutas personalizadas por estudiante
13. 🔲 Alertas PIE automáticas con IA
14. 🔲 Integración Moodle
15. 🔲 Piloto en establecimiento real

---
*Documento generado el 22 Jun 2026. Próxima actualización al completar el próximo hito.*
