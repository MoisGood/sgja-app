# Ley 21.719 — Diagnóstico de Cumplimiento y Plan de Implementación

> **Sistema:** SGJA / AGIL — Intranet del Liceo Andalién Sur (Concepción)
> **Tema:** Protección de Datos Personales según Ley 21.719 (Chile)
> **Estado:** Diagnóstico realizado · Implementación en fases (pendiente)
> **Fecha de diagnóstico:** 2026-08-07

---

## Índice

1. [Contexto y objetivo](#1-contexto-y-objetivo)
2. [Marco legal (resumen)](#2-marco-legal-resumen)
3. [Clasificación de datos que maneja el sistema](#3-clasificación-de-datos-que-maneja-el-sistema)
4. [Estado actual del sistema (evidencia)](#4-estado-actual-del-sistema-evidencia)
5. [Brechas detectadas vs. la ley](#5-brechas-detectadas-vs-la-ley)
6. [Plan de implementación paso a paso](#6-plan-de-implementación-paso-a-paso)
7. [Proveedores y transferencia internacional](#7-proveedores-y-transferencia-internacional)
8. [Hallazgos de seguridad adicionales](#8-hallazgos-de-seguridad-adicionales)
9. [Cómo retomar el trabajo](#9-cómo-retomar-el-trabajo)
10. [Referencias cruzadas](#10-referencias-cruzadas)

---

## 1. Contexto y objetivo

El sistema es una intranet escolar con autenticación por Google (Gmail institucional),
base de datos Supabase, frontend React/Vite. Maneja datos personales de estudiantes
(menores de edad), apoderados y funcionarios del liceo.

**Objetivo del proyecto:** llevar el sistema a cumplimiento de la **Ley 21.719**
(Ley Marco de Protección de Datos Personales de Chile), implementando:

1. Documentación de diagnóstico y checklist de lo existente (este documento + pauta).
2. Página de consentimiento informado para cada usuario que ingresa o ingresará al sistema.
3. Mejoras de acceso para los roles **estudiante** y **apoderado**.
4. Consentimiento diferenciado por tramo de edad: **menores de 14**, **14 a 18**, **+18**.
5. Exportación a **PDF** del consentimiento para que el apoderado lo firme,
   el liceo lo timbre y lo archive.
6. Registro en el sistema de que el apoderado **entregó el consentimiento firmado**.
7. Todos los cambios necesarios (datos, RLS, UI, auditoría, política de privacidad, ARCO).

---

## 2. Marco legal (resumen)

### 2.1 Consentimiento por tramo de edad

| Grupo | Edad | Quién consiente |
|---|---|---|
| Niños/as | < 14 años | **Solo el apoderado/tutor**. El menor NO puede consentir. El sistema debe hacer esfuerzos razonables para verificar que quien completa es el adulto. |
| Adolescentes | 14 a 17 años | Para **datos comunes**: autonomía progresiva, el adolescente puede consentir bajo el interés superior del niño. Para **datos sensibles** (si se agregan): consentimiento del apoderado. |
| Adultos | 18+ años | Consentimiento directo del titular. |

### 2.2 Requisitos del consentimiento (Art. 12)

- Libre, informado, específico e **inequívoco**.
- **Casillas desmarcadas por defecto** (nunca pre-marcadas).
- **Una casilla por finalidad** (no mezclar todo en un solo checkbox).
- Texto claro y breve, sin jerga legal innecesaria.
- Enlace a la Política de Privacidad completa.
- Indicar cómo revocar el consentimiento.

### 2.3 Derechos ARCO+

Acceso, rectificación, cancelación, oposición (+ portabilidad e información).
Debe existir canal de contacto para ejercerlos.

### 2.4 Excepciones al consentimiento

| Excepción | Aplicación al sistema |
|---|---|
| Obligación legal | Datos exigidos por normativa educacional |
| Ejecución de contrato | Datos necesarios para prestar el servicio educativo |
| Interés vital | Emergencias médicas |
| Interés legítimo | Fines administrativos internos (con precaución) |

> Aunque existan bases legales, se recomienda obtener consentimiento: demuestra
> transparencia, cumple el principio de información y protege al liceo ante reclamos.

---

## 3. Clasificación de datos que maneja el sistema

Clasificación **corregida** respecto del análisis inicial (el sistema trata más
datos de los listados originalmente).

### 3.1 Datos personales comunes

| Categoría | Datos | Tablas / archivos |
|---|---|---|
| Identificación | RUT/RUN, nombres, apellidos, fecha de nacimiento, edad | `funcionarios` (`SQL_md/SQL_SUPABASE_CREAR_TABLAS.sql:117-141`), `estudiantes` (rut vía `src/services/estudiantes.service.ts:102`), `datospersonalesusuarios` (`src/services/registro.service.ts:16-30`) |
| Contacto | domicilio, comuna, ciudad, correos, teléfono | `funcionarios`, `datospersonalesusuarios` |
| Emergencia | nombre contacto, teléfono, parentesco | `funcionarios` (`scripts/sql/crear-funcionarios.sql:19-21`), `datospersonalesusuarios` |
| Laboral/educacional | título, universidad, horas contrato, curso | `funcionarios`, `estudiantes` |
| Autenticación | correo Gmail (login), foto de perfil | `usuarios` (email, nombre, foto desde metadata de Google) |

### 3.2 Datos adicionales detectados (no contemplados en el análisis inicial)

| Dato | Dónde | Observación |
|---|---|---|
| **Sexo** | `public/formulario.html:365-372` (accidente escolar) | Datos de salud/contexto del menor |
| **Año de nacimiento / edad** | `public/formulario.html:380-388` | Menores de edad |
| **Domicilio completo** (calle, número, población, comuna, ciudad) | `public/formulario.html:401-422` | |
| **Testigos con RUT** | `public/formulario.html:502-519` | Terceros |
| Documentos subidos | `funcionario_documentos` (`scripts/sql/crear-funcionarios.sql:30-37`) | URL pública en bucket |
| Respaldo de eliminados | `usuarios_eliminados` (`supabase/migrations/009_create_usuarios_eliminados.sql:1-13`) | JSONB con datos completos |

### 3.3 Datos sensibles (por ahora NO se tratan)

No hay salud, datos biométricos, opiniones políticas, credo, orientación sexual, etc.
El **sexo + edad en el formulario de accidente** es el único dato que debe revisarse
con cuidado: la ley trata los datos de salud/contexto de menores con protección reforzada.

---

## 4. Estado actual del sistema (evidencia)

### 4.1 Flujo de autenticación (Etapas 1 y 2 ya implementadas)

- **Etapa 1 — Login Gmail:** `src/pages/Login.tsx:81-82` y `src/services/supabaseAuth.ts:37-38`
  (`signInWithOAuth({ provider: 'google', ... })`). Whitelist de dominios vía RPC
  `verificar_acceso_externo` (`SQL_md/016_dominios_externos.sql`).
- **Datos guardados del usuario de Google:** email, nombre y foto de perfil
  (`src/services/supabaseAuth.ts:119-170`).
- **Etapa 2 — Admin agrega usuario:** roles ADMIN, INSPECTOR, PROFESOR, ESTUDIANTE,
  APODERADO (`SQL_md/SQL_SUPABASE_CREAR_TABLAS.sql:21-34`, `src/types/index.ts:12`).

### 4.2 Etapa 3 — Formularios de datos personales (SIN consentimiento)

| Formulario | Archivo | Consentimiento |
|---|---|---|
| Registro inicial (solicitud) | `src/components/FormularioRegistroInicial.tsx:69-87` | **NO** |
| Completar perfil | `src/components/FormularioDatosPersonales.tsx:39-56,126-162,193-195` | **NO** |
| Modal admin datos personales | `src/components/DatosPersonalesModal.tsx:180-238` | **NO** |
| Mantenedor funcionarios | `src/pages/MantenedorFuncionarios.tsx:33-54` | **NO** |
| Mantenedor estudiantes | `src/pages/MantenedorEstudiantes.tsx:66-75,996-1001` | **NO** |
| Accidente escolar | `src/pages/RegistrarAccidente.tsx:121-146` + `public/formulario.html` | **NO** |

> **No existe ninguna casilla de consentimiento/privacidad en el sistema.**
> Los únicos checkboxes existentes son funcionales (filtros, columnas, suspensiones).

### 4.3 Política de privacidad

- **NO EXISTE.** Sin ruta (`src/router.tsx:10-19`, solo `/login` y `*`), sin archivo.
- La Ley 21.719 está catalogada como **pendiente** en:
  - `analisis/README.md:372` — riesgo "Privacidad de datos (Ley 21.719) | Alto".
  - `analisis/modulo-academico.html:1383` — "Estado: Pendiente".
  - `MD2/INDEX.md:657` — "Leyes a Investigar (futuro)".

### 4.4 Menores de edad y apoderados

- Rol APODERADO existe (`src/types/index.ts:12`).
- Relación `estudiantes.id_apoderado` (`src/types/index.ts:86`,
  `src/services/estudiantes.service.ts:82-98`).
- Apoderados exentos de completar su formulario de datos personales
  (`src/hooks/useUsuarioLogueado.ts:129`).
- **NO hay:** validación de edad del estudiante, verificación de que quien
  completa por un menor es el apoderado, ni registro de consentimiento.

### 4.5 Auditoría y registros

- `monitoreo_logs` / `monitoreo_correos`: log operativo de acciones/correos
  (`src/services/monitoreoService.ts:4-52`). No se llama sistemáticamente en
  operaciones sobre datos personales.
- `usuarios_eliminados` + RPC `eliminar_usuario_permanente`
  (`supabase/migrations/011_security_definer_functions.sql:30-87`).
- **NO hay:** `consent_log`, log de accesos, `updated_by`, log de intentos fallidos.

### 4.6 RLS (Seguridad de datos)

- RLS habilitado masivamente (`supabase/migrations/012_rls_policies_core_tables.sql:32-55`).
- **Riesgo:** `usuarios_select` permite a **todo autenticado** leer `usuarios`
  (línea 113) y `datospersonales_select_all` permite a **todo autenticado** leer
  `datospersonalesusuarios` (líneas 383-384). Escritura solo admin (386-392).
- **Contradicción:** si la escritura en `datospersonalesusuarios` es solo admin,
  el upsert del propio perfil (`src/repositories/impl/SupabaseUsuarioRepository.ts:42-52`)
  fallaría para no-admin. `SQL_md/FIX_RLS_COMPLETO.sql:17-25` propone políticas
  `datospersonales_self_*` (auto-lectura/auto-escritura con `auth.uid()::text = uid::text`).
  → **Verificar en el dashboard de Supabase qué políticas están realmente activas.**
- `018_fix_seguridad.sql` eliminó `execute_sql` (vulnerabilidad de ejecución
  arbitraria de SQL) y restringió tablas sensibles.

---

## 5. Brechas detectadas vs. la ley

| # | Requisito legal | Estado actual | Severidad |
|---|---|---|---|
| 1 | Consentimiento informado por finalidad | **No existe** checkbox ni texto | Crítica |
| 2 | Política de privacidad accesible | **No existe** | Crítica |
| 3 | Consentimiento de apoderado para menores < 14 | **No implementado** | Crítica |
| 4 | Verificación de que el apoderado completa el formulario | **No implementada** | Alta |
| 5 | Registro de consentimientos (quién, cuándo, qué) | **No existe** tabla | Alta |
| 6 | Acceso diferenciado estudiante/apoderado (RLS) | **Deficiente** (lectura amplia) | Alta |
| 7 | Canal de contacto ARCO+ | **No existe** | Media |
| 8 | Información sobre transferencia internacional | **No documentada** | Media |
| 9 | Indicación de cómo revocar el consentimiento | **No existe** | Media |
| 10 | Duración del tratamiento y eliminación | **Parcial** (solo respaldo de eliminados) | Media |
| 11 | Cláusulas con proveedores (Google, Supabase) | **No documentadas** | Media |
| 12 | Auditoría de accesos/modificaciones | **Insuficiente** | Media |

---

## 6. Plan de implementación paso a paso

Cada fase termina con un entregable verificable. Marcar en `PAUTA_CONSENTIMIENTO_LEY_21719.md`.

### Fase 0 — Documentación (ESTA FASE, lista)

- [x] `docs/LEY_21719_CUMPLIMIENTO.md` (este documento).
- [x] `docs/PAUTA_CONSENTIMIENTO_LEY_21719.md` (checklist de trabajo).

### Fase 1 — Base de datos: datos, RLS y tabla de consentimientos

**Objetivo:** corregir el acceso amplio y crear la tabla donde se guardará el consentimiento.

1. Agregar al repo el DDL real de `datospersonalesusuarios` (hoy solo está
   referenciada en código/RLS; no existe `CREATE TABLE` versionado).
2. **Corregir RLS:**
   - `usuarios`: quitar `usuarios_select` para todo autenticado →
     `self` + admin + roles con necesidad legítima.
   - `datospersonalesusuarios`: aplicar políticas `self` (leer/actualizar propios)
     + admin; eliminar `datospersonales_select_all`.
   - `solicitudes`: restringir lectura a admin y al propio usuario.
   - Verificar en Supabase el estado real y dejar la migración aplicada.
3. **Crear tabla `consentimientos_ley21719`** (propuesta):

```sql
CREATE TABLE IF NOT EXISTS consentimientos_ley21719 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uid UUID REFERENCES auth.users(id),
  email TEXT NOT NULL,
  rol TEXT NOT NULL,                       -- ESTUDIANTE | APODERADO | FUNCIONARIO...
  tramo_edad TEXT NOT NULL,                -- MENOR_14 | ADOLESCENTE_14_17 | ADULTO_18
  finalidades JSONB NOT NULL,              -- [{codigo, aceptada, fecha}]
  version_consentimiento TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'PENDIENTE',-- PENDIENTE | FIRMADO_DIGITAL | FIRMADO_PAPEL
  -- Menores < 14: quién consiente
  apoderado_nombre TEXT,
  apoderado_rut TEXT,
  declaracion_apoderado BOOLEAN DEFAULT false,
  -- Registro de la entrega física (papel timbrado y archivado)
  fecha_entrega_papel DATE,
  pdf_firmado_url TEXT,                    -- escaneo del papel firmado/timbrado (Storage)
  timbrado BOOLEAN DEFAULT false,
  archivado_por TEXT,
  -- Evidencia digital
  fecha_consentimiento TIMESTAMPTZ,
  ip TEXT,
  user_agent TEXT,
  creado_en TIMESTAMPTZ DEFAULT now(),
  actualizado_en TIMESTAMPTZ DEFAULT now()
);
```

4. Definir **RLS** de `consentimientos_ley21719`:
   - Usuario puede leer su propio consentimiento.
   - Admin puede leer/timbrar/archivar todos.
   - Insert: usuario mismo (o apoderado por su/s menor/es).

### Fase 2 — Mejoras de acceso: roles ESTUDIANTE y APODERADO

1. **Estudiantes:**
   - Agregar `fecha_nacimiento` (o derivar edad por RUT) a `estudiantes` para
     clasificar tramos de edad y consentimiento.
   - RLS: el estudiante lee/actualiza **solo su propia ficha**; el apoderado
     lee/actualiza las fichas de **sus estudiantes** (`estudiantes.id_apoderado`).
2. **Apoderados:**
   - Validar relación apoderado ↔ estudiante(s). Permitir que un apoderado
     tenga varios estudiantes.
   - Flujo de completar formulario por apoderado con verificación:
     - Ingresar **RUN del apoderado** (validar formato y coincidencia).
     - Declaración expresa: *"Declaro que soy el/la apoderado/a legal del
       estudiante [nombre] y otorgo mi consentimiento para el tratamiento de
       sus datos personales."*
     - Registrar fecha/hora/IP de quién consintió.
   - RLS: apoderado solo sobre sus menores; admin todo.

### Fase 3 — Página de consentimiento (UI)

1. Nueva ruta `/consentimiento` (hash) que intercepte al usuario al primer
   ingreso o cuando no exista consentimiento vigente (o cambie la versión).
2. Texto de consentimiento **según tramo de edad** (ver pauta, sección D):
   - **MENOR_14:** el formulario lo completa el apoderado (verificación RUN +
     declaración). El menor NO consiente.
   - **ADOLESCENTE_14_17:** consiente el adolescente (datos comunes). Si en el
     futuro se agregan datos sensibles → consentimiento del apoderado.
   - **ADULTO_18:** consiente el propio funcionario.
3. Checkboxes **desmarcados por defecto**, **una por finalidad**:
   - Finalidad A: gestión administrativa del sistema educativo.
   - Finalidad B: comunicación institucional.
   - Finalidad C: atención de emergencias (comunicación al contacto registrado).
4. Botones:
   - "Aceptar y continuar" (guarda en `consentimientos_ley21719` estado FIRMADO_DIGITAL).
   - "Descargar PDF para firmar" (ver Fase 4).
   - "Rechazar": bloquea funcionalidad según base legal (registrar rechazo).
5. Enlace a Política de Privacidad + indicación de cómo revocar.

### Fase 4 — Exportar PDF del consentimiento

1. Usar **pdf-lib** (ya es dependencia, `package.json`).
2. Generar PDF con: texto del consentimiento, datos del titular, tramo de edad,
   casillas de finalidades, **campo de firma** y **campo de timbre del liceo**,
   fecha. Reutilizar el patrón de `src/services/pdf.service.ts:7-46`.
3. Flujo físico:
   - Apoderado descarga PDF → firma → **liceo timbra y archiva**.
4. UI en el sistema (admin): botón "**Marcar consentimiento firmado entregado**"
   → setea `estado = FIRMADO_PAPEL`, `fecha_entrega_papel = hoy`, permite subir
   el escaneo a un bucket privado (`pdf_firmado_url`) y marcar `timbrado`.
5. El sistema muestra el estado: PENDIENTE / FIRMADO_DIGITAL / FIRMADO_PAPEL.

### Fase 5 — Política de privacidad y derechos ARCO+

1. Página `/privacidad` con la política completa (responsable, datos, finalidades,
   base legal, duración, transferencias, derechos ARCO+, contacto).
2. Canal de contacto ARCO (correo institucional, p.ej. el ya usado por SMTP).
3. Enlaces a la política desde el login y desde todos los formularios de datos.

### Fase 6 — Auditoría y trazabilidad

1. Agregar `updated_by` a las tablas de datos personales o un log de
   modificación (quién, cuándo, qué campo).
2. Registrar sistemáticamente acciones sobre datos personales en `monitoreo_logs`.
3. Log de accesos a fichas de estudiantes por parte de funcionarios.

### Fase 7 — Verificación final

1. Re-correr el checklist completo de `PAUTA_CONSENTIMIENTO_LEY_21719.md`.
2. Probar flujos: menor <14 (apoderado), adolescente 14-17, adulto, firma digital,
   entrega papel, rechazo, ARCO.
3. Verificar RLS en Supabase con distintas cuentas (estudiante, apoderado, admin).

---

## 7. Proveedores y transferencia internacional

| Proveedor | Uso | Datos que maneja |
|---|---|---|
| Supabase (`iyxubvtfhcmlivivdfpt`) | BD, Auth, Storage | Todos los datos. Región por verificar en dashboard (default suele ser EE.UU.) |
| Google | OAuth login + Gmail SMTP (`api/send-email.js:21-27`, `server.cjs:52-56`) | Correos, nombre, foto; correos salientes con datos de estudiantes |
| Vercel | Hosting frontend (`vercel.json`) | — |
| Cloudflare | Pages + worker sesiones (`wrangler.toml`, `ws-sesiones/`) | Sesiones en línea |
| IndexedDB | Caché offline local (`idb`) | Copia local de datos |

**Pendiente documentar:**
- Contrato/cláusulas con proveedores que garanticen protección adecuada.
- Informar a los usuarios de la transferencia internacional en la política de privacidad.
- Referenciar el Acuerdo de Procesamiento de Datos de Google Workspace for Education
  y el DPA de Supabase.

---

## 8. Hallazgos de seguridad adicionales

1. **RLS amplio:** lectura de `usuarios` y `datospersonalesusuarios` para todo
   autenticado según `012_rls_policies_core_tables.sql:113,383`. Confirmar estado
   real en producción (contradicción con `SQL_md/FIX_RLS_COMPLETO.sql`).
2. **Datos personales reales versionados** en scripts:
   `python/insertar_solicitudes.sql`, `python/crear_usuarios_desde_csv.sql`,
   `scripts/firebase-to-supabase.sql:431`, `python/colaboradores.html`.
   → Riesgo de divulgación en git. Revisar si deben borrarse o rotarse.
3. **Bucket público** de `funcionario_documentos` (`funcionarioDocumentos.ts:25-33`)
   → considerar bucket privado + URL firmada para documentos personales.
4. `.env` con credenciales SMTP del liceo (`intranet.lnconcepcion@andaliensur.cl`).

---

## 9. Cómo retomar el trabajo

1. Abrir este documento y la pauta.
2. Confirmar en Supabase el estado real de RLS y región (Fase 1, punto 2).
3. Ejecutar las fases en orden. Cada fase tiene entregable verificable.
4. Actualizar la pauta marcando lo completado con fecha.

---

## 10. Referencias cruzadas

- **Pauta de trabajo / checklist:** `docs/PAUTA_CONSENTIMIENTO_LEY_21719.md`
- **Análisis previo (riesgo Ley 21.719):** `analisis/README.md:372`
- **RLS core:** `supabase/migrations/012_rls_policies_core_tables.sql`
- **Fix RLS propuesto:** `SQL_md/FIX_RLS_COMPLETO.sql`
- **Tablas:** `SQL_md/SQL_SUPABASE_CREAR_TABLAS.sql`
- **Login:** `src/pages/Login.tsx`, `src/services/supabaseAuth.ts`
- **Formularios:** `src/components/FormularioDatosPersonales.tsx`, `src/pages/MantenedorFuncionarios.tsx`, `src/pages/MantenedorEstudiantes.tsx`
- **PDF existente:** `src/services/pdf.service.ts`
- **Logs:** `src/services/monitoreoService.ts`
