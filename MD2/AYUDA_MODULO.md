# SGJA — Módulo de Ayuda

**Documento de diseño y lógica del sistema de autoayuda.**  
Este documento describe la arquitectura ideal del módulo, sin código. Sirve como especificación para implementar limpiamente.

---

## 1. Objetivo

Sistema de autoayuda contextual para reducir la carga de soporte a los roles **Profesor, Inspector y Estudiante**.  
El rol **Admin** gestiona el contenido de ayuda + logs de errores.

---

## 2. Contenido por Rol

| Sección | ADMIN | PROFESOR | INSPECTOR | ESTUDIANTE |
|---------|:-----:|:--------:|:---------:|:----------:|
| FAQ (preguntas frecuentes) | ✅ Ve todo + gestiona | ✅ Filtrado por su rol | ✅ Filtrado por su rol | ✅ Básico |
| Tutoriales guiados | ❌ Solo previsualizar | ✅ | ✅ | ❌ |
| Logs de errores del sistema | ✅ Tabla con filtros | ❌ | ❌ | ❌ |
| Gestión de contenido FAQ/Tutoriales | ✅ CRUD completo | ❌ | ❌ | ❌ |

- Cada FAQ y cada Tutorial tiene un campo `rol TEXT[]` que define qué roles lo ven.
- ADMIN ve todo + panel de gestión + logs.
- PROFESOR/INSPECTOR ven contenido asignado a su rol + tutoriales guiados.
- ESTUDIANTE solo ve FAQ básico.

---

## 3. Tablas en Supabase

Se requieren 5 tablas. Crear desde el SQL Editor.

### 3.1 ayuda_faq (Preguntas Frecuentes)

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID PK | Autogenerado |
| rol | TEXT[] | Roles que ven esta pregunta |
| modulo | TEXT | Módulo funcional (justificaciones, equipos, etc.) |
| categoria | TEXT | Agrupación visual (General, Registro, etc.) |
| titulo | TEXT | Pregunta |
| contenido | TEXT | Respuesta en texto plano |
| orden | INTEGER | Orden de aparición |
| activo | BOOLEAN | true = visible |
| creado_en / actualizado_en | TIMESTAMPTZ | Auditoría |

Índices: `(rol, modulo, activo)`, `(categoria, activo)`

### 3.2 ayuda_tutoriales (Definición de Tutoriales)

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID PK | Autogenerado |
| rol | TEXT[] | Roles objetivo |
| modulo | TEXT | Módulo funcional |
| titulo | TEXT | Nombre del tutorial |
| descripcion | TEXT | Resumen |
| activo | BOOLEAN | true = disponible |

### 3.3 ayuda_tutorial_pasos (Pasos de Tutorial)

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID PK | Autogenerado |
| tutorial_id | UUID FK → ayuda_tutoriales | Tutorial padre |
| paso_numero | INTEGER | Orden (1, 2, 3…) |
| instruccion | TEXT | Texto que ve el usuario ("Haz clic en Guardar") |
| elemento_selector | JSONB | `{"tipo":"css", "valor":"button#guardar"}` |
| tipo_resaltado | TEXT | `dimmed_overlay` (oscurecer todo menos el elemento) |
| activo | BOOLEAN | true = paso activo |

`UNIQUE(tutorial_id, paso_numero)`

### 3.4 ayuda_progreso_tutorial (Progreso por Usuario)

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID PK | Autogenerado |
| usuario_id | UUID | UID del usuario (de auth) |
| tutorial_id | UUID FK → ayuda_tutoriales | Tutorial |
| pasos_completados | INTEGER[] | [1, 2, 3] |
| completado | BOOLEAN | true = todos los pasos hechos |
| ultima_actualizacion | TIMESTAMPTZ | Último cambio |

`UNIQUE(usuario_id, tutorial_id)`

### 3.5 ayuda_logs_errores (Logs)

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID PK | Autogenerado |
| usuario_id | UUID | Quién reportó (nullable) |
| tipo_error | TEXT | `sistema`, `equipo`, `internet`, `usuario` |
| titulo | TEXT | Resumen |
| descripcion | TEXT | Detalle |
| contexto | JSONB | URL, user agent, etc. |
| resuelto | BOOLEAN | false por defecto |
| creado_en | TIMESTAMPTZ | Fecha del error |

### SQL de creación

```sql
-- Copiar y pegar en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.ayuda_faq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rol TEXT[] NOT NULL,
  modulo TEXT NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'General',
  titulo TEXT NOT NULL,
  contenido TEXT NOT NULL,
  orden INTEGER NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT true,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ayuda_faq_rol_modulo ON public.ayuda_faq(rol, modulo, activo);
CREATE INDEX IF NOT EXISTS idx_ayuda_faq_categoria ON public.ayuda_faq(categoria, activo);

CREATE TABLE IF NOT EXISTS public.ayuda_tutoriales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rol TEXT[] NOT NULL,
  modulo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ayuda_tutorial_pasos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutorial_id UUID NOT NULL REFERENCES public.ayuda_tutoriales(id) ON DELETE CASCADE,
  paso_numero INTEGER NOT NULL,
  instruccion TEXT NOT NULL,
  elemento_selector JSONB,
  tipo_resaltado TEXT NOT NULL DEFAULT 'dimmed_overlay',
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tutorial_id, paso_numero)
);

CREATE TABLE IF NOT EXISTS public.ayuda_progreso_tutorial (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL,
  tutorial_id UUID NOT NULL REFERENCES public.ayuda_tutoriales(id) ON DELETE CASCADE,
  pasos_completados INTEGER[] NOT NULL DEFAULT '{}',
  completado BOOLEAN NOT NULL DEFAULT false,
  ultima_actualizacion TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(usuario_id, tutorial_id)
);
CREATE INDEX IF NOT EXISTS idx_ayuda_progreso_usuario ON public.ayuda_progreso_tutorial(usuario_id, completado);

CREATE TABLE IF NOT EXISTS public.ayuda_logs_errores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID,
  tipo_error TEXT NOT NULL CHECK (tipo_error IN ('sistema', 'equipo', 'internet', 'usuario')),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  contexto JSONB DEFAULT '{}',
  resuelto BOOLEAN NOT NULL DEFAULT false,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ayuda_logs_tipo ON public.ayuda_logs_errores(tipo_error, creado_en);
CREATE INDEX IF NOT EXISTS idx_ayuda_logs_usuario ON public.ayuda_logs_errores(usuario_id, resuelto, creado_en);
```

---

## 4. Arquitectura de Código

### 4.1 Estructura de Archivos

```
src/
├── services/
│   └── ayuda.service.ts          ← Llamadas a Supabase (FAQ, tutoriales, progreso, logs)
├── hooks/
│   └── useAyuda.ts               ← Hook que wrappea el servicio + estado reactivo
└── components/
    └── Ayuda/
        ├── index.ts              ← Barrel exports
        ├── FlotanteAyuda.tsx      ← Botón "?" flotante (bottom-right)
        ├── CentroDeAyuda.tsx      ← Modal principal con tabs según rol
        ├── FaqViewer.tsx          ← Lista de preguntas con búsqueda
        ├── FaqItem.tsx            ← Una pregunta expandible
        ├── AdminPanel.tsx         ← (Futuro) CRUD de contenido para ADMIN
        └── LogsViewer.tsx         ← (Futuro) Tabla de logs para ADMIN
```

### 4.2 Puntos de Integración

**Layout.tsx** — Solo 2 cambios:
1. Importar `<FlotanteAyuda />` y renderizarlo en el JSX (desktop y mobile)
2. Agregar un estado `ayudaAbierto` que el Sidebar pueda abrir

**Sidebar.tsx** — Solo 1 cambio:
1. Aceptar prop `onOpenHelp?: () => void`
2. En el ítem "Ayuda", llamar a `onOpenHelp` en lugar de `navigate`

**paginas.service.ts** — Solo 1 cambio:
1. Agregar `{ ruta: '/ayuda', nombre: 'Ayuda', descripcion: 'Centro de ayuda' }` al array

### 4.3 Flujo de Datos

| Acción | Origen | Destino | Frecuencia |
|--------|--------|---------|------------|
| Leer FAQ | CentroDeAyuda | Cache local → Supabase | Una vez al abrir |
| Leer tutoriales | CentroDeAyuda | Cache local → Supabase | Una vez al abrir |
| Registrar progreso | Tutorial guiado | Supabase | Por paso completado |
| Registrar error | Cualquier componente | Supabase | Bajo demanda |
| ADMIN: leer logs | AdminPanel | Supabase | Bajo demanda |
| ADMIN: CRUD contenido | AdminPanel | Supabase | Bajo demanda |

### 4.4 Optimización de Llamadas

- FAQ y tutoriales se cachean en localStorage al cargar
- Solo se vuelven a consultar si pasa `> 5 minutos` desde la última carga
- Progreso y logs van directo a Supabase (son operaciones de escritura rápidas)

---

## 5. Interfaz de Usuario

### 5.1 Puntos de Acceso
1. **Botón "?" flotante** — Posición fija `bottom: 1rem; right: 1rem`, visible siempre
2. **Menú lateral** — Ítem "Ayuda" con icono, mismo comportamiento que el botón flotante

### 5.2 Centro de Ayuda (Modal)

| Rol | Pestañas visibles |
|-----|-------------------|
| ADMIN | FAQ · Tutoriales · Logs · Gestionar contenido |
| PROFESOR | FAQ · Tutoriales |
| INSPECTOR | FAQ · Tutoriales |
| ESTUDIANTE | FAQ |

Las pestañas deben deshabilitarse visualmente si no hay contenido disponible.

### 5.3 FAQ
- Búsqueda por texto (filtra en cliente)
- Cada pregunta expandible (acordeón)
- Botones "Sí / No" para marcar utilidad (feedback)
- Categorías como separadores visuales

### 5.4 Tutoriales Guiados (Futuro)
- Modal tipo "spotlight": toda la pantalla se oscurece
- Solo el elemento objetivo se ilumina (usando `elemento_selector`)
- Instrucción en la parte superior: "Paso X de Y: [texto]"
- Al hacer clic en el elemento correcto → siguiente paso
- Barra de progreso visible

### 5.5 Adaptación Móvil
- El botón flotante debe estar presente (mínimo 48×48 px)
- Los modales deben ocupar pantalla completa (no centrados)
- Tutoriales: overlays simplificados, objetivos táctiles grandes

---

## 6. Notas Técnicas

### 6.1 Estado inicial
- El Centro de Ayuda se abre con la pestaña FAQ activa
- Si no hay FAQs cargadas, muestra un mensaje amigable
- Si hay error de red, muestra el error pero no bloquea la app

### 6.2 RLS en Supabase
- FAQ, tutoriales y pasos: `SELECT` para todos (público de lectura)
- Progreso: cada usuario solo ve/escribe su propio progreso
- Logs: cualquier usuario autenticado puede insertar, ADMIN puede leer todos
- CRUD de contenido: solo ADMIN (requiere política específica)

### 6.3 Dependencias
- `lucide-react` (icono HelpCircle para el menú)
- `tailwindcss` (clases utilitarias para estilos rápidos)

---

## 7. Orden de Implementación (Sugerido)

| Paso | Qué | Archivos afectados |
|------|-----|-------------------|
| 1 | Crear tablas en Supabase | SQL Editor |
| 2 | Crear `ayuda.service.ts` | Nuevo |
| 3 | Crear `useAyuda.ts` | Nuevo |
| 4 | Crear componentes básicos (Flotante, Centro, FAQ) | Nuevos en `Ayuda/` |
| 5 | Integrar en Layout (import + JSX) | `Layout.tsx` |
| 6 | Agregar ítem en Sidebar + prop `onOpenHelp` | `Sidebar.tsx` |
| 7 | Agregar ruta `/ayuda` en paginas.service | `paginas.service.ts` |
| 8 | Probar con ADMIN | Verificar menú + modal + FAQ |
| 9 | Asignar permisos a roles (desde UI) | Asignar Accesos |
| 10 | Probar con PROFESOR/INSPECTOR/ESTUDIANTE | Verificar filtrado |
| 11 | Implementar tutoriales guiados | Nuevo componente |
| 12 | Implementar AdminPanel (CRUD + logs) | `AdminPanel.tsx`, `LogsViewer.tsx` |
| 13 | Adaptación móvil | Ajustes CSS |

---

## 8. Estado Actual del Proyecto (respecto a este módulo)

| Elemento | Estado |
|----------|--------|
| Tablas en Supabase | ✅ Creadas |
| Datos de ejemplo | ✅ Insertados |
| Código del módulo | ❌ Eliminado (se implementará limpiamente) |
| MD de diseño | ✅ Este documento |

---

*Documento generado el 24 Jun 2026.*  
*Propósito: Especificación de diseño para implementación limpia del módulo de ayuda.*