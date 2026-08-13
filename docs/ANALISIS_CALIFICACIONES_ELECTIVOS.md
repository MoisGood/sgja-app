# Análisis: Ingreso de Calificaciones y Electivos (3° y 4° Medio)

> **Sistema:** SGJA / AGIL — Intranet del Liceo Andalién Sur (Concepción)
> **Alcance:** Módulo de calificaciones/notas + sistema de electivos de la Formación Diferenciada
> **Estado:** Análisis (sin implementación)
> **Fecha:** 2026-08-07

---

## Índice

1. [Contexto y objetivo](#1-contexto-y-objetivo)
2. [Marco normativo](#2-marco-normativo)
3. [Estado actual del sistema y brechas](#3-estado-actual-del-sistema-y-brechas)
4. [Modelo de datos propuesto](#4-modelo-de-datos-propuesto)
5. [Reglas de negocio del ingreso de calificaciones](#5-reglas-de-negocio-del-ingreso-de-calificaciones)
6. [Cálculo de promedios](#6-cálculo-de-promedios)
7. [Electivos: marco Mineduc y modelo](#7-electivos-marco-mineduc-y-modelo)
8. [Flujo de electividad](#8-flujo-de-electividad)
9. [Vistas por rol](#9-vistas-por-rol)
10. [Puntos de análisis que faltan por contemplar](#10-puntos-de-análisis-que-faltan-por-contemplar)
11. [Riesgos y pendientes](#11-riesgos-y-pendientes)
12. [Plan de implementación por fases](#12-plan-de-implementación-por-fases)
13. [Referencias](#13-referencias)

---

## 1. Contexto y objetivo

Diseñar el módulo de **ingreso de calificaciones** y el sistema de **electivos** para
3° y 4° medio, alineados con la normativa chilena (Decreto 67/2018 y las Bases
Curriculares de 3° y 4° medio, Decreto 193/2019 y Decreto 876/2019).

El módulo debe cubrir:

- Asignaturas (con sus contenidos/objetivos de aprendizaje).
- Año escolar y períodos (semestres/trimestres).
- Ponderaciones y promedios (parcial, semestral, anual).
- Curso ↔ asignatura (qué asignaturas tiene cada curso).
- Asignatura ↔ docente (quién la dicta y en qué curso).
- Docentes de reemplazo (cobertura).
- Horas de cada docente (lectivas y no lectivas).
- Electivos: elección en 2° medio para 3° y 4°, cupos, cambios antes/durante.
- Vistas por rol: **estudiante**, **por curso**, **por docente** (las principales),
  y apoderados, UTP/inspectora, dirección (equivalentes a las anteriores con permisos).

---

## 2. Marco normativo

### 2.1 Decreto 67/2018 — Evaluación, calificación y promoción

| Regla | Detalle |
|---|---|
| Escala | 1.0 a 7.0, con un decimal. **4.0 = mínima de aprobación** (60% de logro). |
| Períodos | 2 semestres con **misma ponderación**: 50% c/u para el promedio final anual. |
| Ponderaciones | Definidas por el docente, coherentes con la planificación, acordadas con Jefe UTP y comunicadas con anticipación. |
| Evaluación final | Si existe, su ponderación **no puede superar 30%**. |
| Notas mínimas | La cantidad mínima de calificaciones por asignatura debe estar definida en el reglamento interno (en la práctica se vincula a las horas). |
| Redondeo | Las notas parciales, promedios semestrales y promedios finales de asignatura **se aproximan a la décima** cuando la centésima ≥ 5. El **promedio general no se aproxima**. |
| Asignaturas que no inciden | **Religión, Consejo de Curso y Orientación** no inciden en el promedio final ni en la promoción. |
| Promoción por logros | Promueven: (a) aprobar todas las asignaturas; (b) 1 reprobada con promedio final anual ≥ 4.5; (c) 2 reprobadas con promedio final anual ≥ 5.0. |
| Promoción por asistencia | Requisito: **≥ 85% de asistencia** (salvo reglamento interno para casos especiales). |
| Acta | El Acta de Registro de Calificaciones y Promoción se genera en **SIGE** y la firma el director. |
| Registro | Las notas deben escribirse en el libro de clases y plataforma **hasta 2 semanas después** de la evaluación. |
| Eximición | No se puede eximir de ninguna asignatura del plan de estudio. |
| Situaciones especiales | Ingreso tardío, ausencias prolongadas, suspensiones de clases, embarazo, servicio militar, certámenes nacionales, etc. → reglamento interno. |

### 2.2 SIGE (Sistema de Información General de Estudiantes)

- Plataforma oficial del MINEDUC para: matrícula, asistencia, **rendimiento (notas)**,
  actas de calificación y situación final, idoneidad docente.
- Los establecimientos suben las notas (manual o archivos de texto `.txt`) con
  nomenclatura oficial (código de asignatura MINEDUC + decreto + plan).
- **Implicación:** el módulo interno debe poder **exportar calificaciones y situación
  final al formato SIGE** (perfil UTP).

### 2.3 Electividad en 3° y 4° medio (Bases Curriculares 2019)

| Regla | Detalle |
|---|---|
| Plan común | Plan Común de Formación General (todas las asignaturas obligatorias). |
| Plan común electivo | 2 h semanales: elegir **Religión** o Artes / Historia-Geografía-Cs. Sociales / Ed. Física y Salud. Se comunica a apoderados en matrícula. |
| Formación Diferenciada | Humanístico-Científica (18 h), Técnico-Profesional (22 h), Artística (21 h). |
| Electivos HC | El estudiante elige **3 asignaturas de profundización por nivel**, **6 h semanales** cada una. |
| Oferta mínima | El establecimiento debe ofrecer **mínimo 6 asignaturas** de un total de 27 posibles, en **cada nivel** (3° y 4°). |
| Áreas | La oferta debe cubrir **al menos 2 de 3 áreas**: A (Lenguaje, Filosofía, Historia, Geografía, Cs. Sociales), B (Matemática y Cs. Naturales), C (Artes, Ed. Física y Salud). |
| Cupos | **Mínimo 10 y máximo 30 estudiantes por asignatura electiva.** |
| Preferencias | El estudiante ordena sus preferencias del **1 al 6** (o N según oferta). |
| Criterios de asignación (prioridad) | 1. Primera y segunda preferencia. 2. Intenciones de estudio en Educación Superior. 3. Resultados de pruebas vocacionales. 4. Rendimiento académico o asistencia. 5. Opinión de docentes. |
| Protocolo | El establecimiento debe tener un **protocolo de electividad** que explicite cupos máximos/mínimos, criterios, y derechos/deberes de los estudiantes. |
| Proceso | Proceso informado de elección: carta de elección/postulación + documento explicativo. |

> El sistema de electividad que describe el usuario (estudiantes de 2° medio eligen
> para 3° y 4°; electivos formados por alumnos de **diferentes cursos del mismo
> nivel**; cambios antes y durante; cupos por electivo) **coincide con la normativa**.
> Nota: la normativa permite ofrecer las electivas a estudiantes de distintos
> paralelos (3A+3B+3C) mezclados en un mismo grupo electivo.

---

## 3. Estado actual del sistema y brechas

### 3.1 Lo que ya existe (verificado en código)

| Componente | Estado | Archivo |
|---|---|---|
| Tabla `asignaturas` | Existe (id, nombre, nivel, horas_semanales, activo) | `supabase/migrations/027_create_tablas_academicas.sql:22-30` |
| Tabla `periodos` | Existe (nombre, fecha_inicio, fecha_fin) | `027:33-41` |
| Tabla `actividades` | Existe (asignatura, periodo, sala, ponderacion, fecha) | `027:44-56` |
| Tabla `desempeno` | Existe (actividad, estudiante, nota 1.0-7.0) | `027:59-67` |
| Tabla `promedios` | Existe (estudiante, asignatura, periodo, promedio_final, estado) | `027:70-81` |
| Tabla `cursos` | Existe (codigo, nombre, nivel, id_establecimiento) | `SQL_md/SQL_CURSOS_MEJOR.sql:4` |
| Tabla `funcionarios` | Existe (rut, asignatura TEXT, horas_contrato, tipo_funcionario) | `scripts/sql/crear-funcionarios.sql:1-28` |
| Tabla `bloques_horarios` | Existe (9 bloques, con tipo clase/recreo/almuerzo) | `SQL_md/SQL_BLOQUES_HORARIOS.sql`, `037_add_tipo_bloques_horarios.sql` |
| Lógica de promedios | `sumaPonderada`/`totalPeso`, estado riesgo < 4.0 | `src/services/performanceService.ts:134-143` |
| Catálogo asignaturas | Servicio CRUD | `src/services/academico/catalogo.service.ts:83` |
| Módulo académico | Plan pedagógico (salas de aprendizaje) | `analisis/README.md`, `027` |

### 3.2 Brechas principales

| Necesidad | Estado actual | Brecha |
|---|---|---|
| Año escolar como entidad | No existe (`periodos` sueltos) | Sin historial por año; las notas no tienen año escolar explícito |
| Contenido por asignatura | No existe | No hay objetivos de aprendizaje/contenidos/unidades |
| Curso ↔ asignatura | No existe | No hay qué asignaturas tiene cada curso |
| Docente ↔ asignatura ↔ curso | `funcionarios.asignatura` es TEXT libre | Sin FK; un docente no está formalmente ligado a curso+asignatura |
| Estudiante ↔ curso | `estudiantes.curso` es TEXT | Sin FK a `cursos`; sin matrícula por año |
| Docentes de reemplazo | Solo enum + fechas | Sin tabla ni flujo |
| Horas por docente | `horas_contrato` (total) | Sin desglose lectivas/no lectivas |
| Electivos | No existe nada | Diseño desde cero |
| UI de ingreso de notas | No existe | `src/pages/academico/` no existe |
| RLS de notas | Inserción de `desempeno` para cualquier autenticado (`027:120-125`) | **Riesgo**: cualquier usuario podría ingresar notas; falta restricción por rol (docente = su asignatura) |
| Rol UTP/DIRECCIÓN | No existen en enum de roles (`src/types/index.ts:6-13`) | UTP solo conceptual (`analisis/README.md:20`) |

---

## 4. Modelo de datos propuesto

### 4.1 Año escolar y períodos

```sql
CREATE TABLE anios_escolares (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anio        INTEGER NOT NULL UNIQUE,          -- 2026
  estado      TEXT NOT NULL DEFAULT 'abierto' CHECK (estado IN ('abierto','cerrado')),
  fecha_inicio DATE,
  fecha_fin    DATE,
  activo      BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE periodos (  -- ampliar la existente
  id_anio     UUID REFERENCES anios_escolares(id),
  tipo        TEXT CHECK (tipo IN ('semestre','trimestre')),  -- default semestre
  numero      INTEGER,  -- 1 o 2
  ...
);
```

- Toda calificación queda ligada a un **año escolar** (permite consultas históricas).
- Se valida que el período de ingreso pertenezca al año en curso.

### 4.2 Asignaturas y contenidos

```sql
CREATE TABLE asignaturas (  -- ampliar
  id              UUID PRIMARY KEY,
  nombre          TEXT NOT NULL,
  nivel           TEXT,              -- '3M','4M' o rango
  tipo            TEXT CHECK (tipo IN ('plan_comun','plan_comun_electivo','diferenciada_hc','diferenciada_tp','diferenciada_art')),
  area            TEXT CHECK (area IN ('A','B','C','N/A')),  -- para electivos
  codigo_mineduc  TEXT,              -- para exportar a SIGE
  horas_semanales INTEGER,
  activo          BOOLEAN DEFAULT true
);

CREATE TABLE unidades_aprendizaje (   -- "contenido" de cada asignatura
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_asignatura   UUID NOT NULL REFERENCES asignaturas(id),
  nombre          TEXT NOT NULL,       -- 'Unidad 1: Números'
  orden           INTEGER NOT NULL,
  objetivos       TEXT[] DEFAULT '{}', -- Objetivos de Aprendizaje (OA)
  activo          BOOLEAN DEFAULT true
);
```

> "Cada asignatura tiene un contenido" → se materializa como **unidades de aprendizaje**
> (o directamente OA del currículum). Las actividades/evaluaciones se cuelgan de una unidad.

### 4.3 Curso ↔ asignatura

```sql
CREATE TABLE curso_asignatura (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_curso        UUID NOT NULL REFERENCES cursos(id),
  id_asignatura   UUID NOT NULL REFERENCES asignaturas(id),
  id_anio         UUID NOT NULL REFERENCES anios_escolares(id),
  horas_semanales INTEGER NOT NULL,
  UNIQUE (id_curso, id_asignatura, id_anio)
);
```

### 4.4 Docente ↔ asignatura ↔ curso

```sql
CREATE TABLE docente_asignatura_curso (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_funcionario  UUID NOT NULL REFERENCES funcionarios(id),  -- o rut
  id_curso        UUID NOT NULL REFERENCES cursos(id),
  id_asignatura   UUID NOT NULL REFERENCES asignaturas(id),
  id_anio         UUID NOT NULL REFERENCES anios_escolares(id),
  rol             TEXT NOT NULL DEFAULT 'titular' CHECK (rol IN ('titular','reemplazo')),
  horas_semanales INTEGER NOT NULL,
  fecha_inicio    DATE,
  fecha_fin       DATE,   -- para reemplazos
  UNIQUE (id_funcionario, id_curso, id_asignatura, id_anio)
);
```

### 4.5 Docentes de reemplazo

```sql
CREATE TABLE reemplazos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_funcionario_reemplazante UUID REFERENCES funcionarios(id),
  id_funcionario_titular     UUID REFERENCES funcionarios(id),   -- opcional
  id_curso_asignatura        UUID REFERENCES docente_asignatura_curso(id),
  fecha_inicio    DATE NOT NULL,
  fecha_fin       DATE,
  motivo          TEXT,
  estado          TEXT DEFAULT 'activo' CHECK (estado IN ('activo','finalizado')),
  notas_ingresadas_por UUID,   -- quién ingresa notas durante el reemplazo
  creado_por      UUID,
  creado_en       TIMESTAMPTZ DEFAULT now()
);
```

- Durante un reemplazo, el reemplazante ingresa notas de la asignatura/curso cubierto.
- Al terminar el reemplazo, la responsabilidad vuelve al titular (auditoría quién ingresó qué).

### 4.6 Horas de cada docente

```sql
CREATE TABLE cargas_docentes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_funcionario  UUID NOT NULL REFERENCES funcionarios(id),
  id_anio         UUID NOT NULL REFERENCES anios_escolares(id),
  horas_lectivas  INTEGER NOT NULL DEFAULT 0,
  horas_no_lectivas INTEGER NOT NULL DEFAULT 0,
  total_horas     INTEGER GENERATED ALWAYS AS (horas_lectivas + horas_no_lectivas) STORED,
  UNIQUE (id_funcionario, id_anio)
);
```

> La proporción lectivas/no lectivas se rige por el nivel educativo (ej. básica 70/30,
> media 65/35) según la normativa de jornada docente. Validar el valor exacto con el
> reglamento interno y la dotación vigente del establecimiento.

### 4.7 Calificaciones (ampliar la existente)

```sql
CREATE TABLE evaluaciones (   -- renombra/amplía "actividades"
  id              UUID PRIMARY KEY,
  id_curso_asignatura UUID REFERENCES curso_asignatura(id),
  id_unidad       UUID REFERENCES unidades_aprendizaje(id),
  id_periodo      UUID REFERENCES periodos(id),
  nombre          TEXT NOT NULL,
  tipo            TEXT CHECK (tipo IN ('sumativa','formativa','coef1','coef2','evaluacion_final')),
  ponderacion     REAL NOT NULL,          -- % dentro del semestre
  fecha           DATE NOT NULL,
  fecha_max_ingreso DATE,                 -- 2 semanas después (Decreto 67)
  estado          TEXT DEFAULT 'abierta' CHECK (estado IN ('abierta','cerrada','corregida')),
  creado_por      UUID
);

CREATE TABLE notas (  -- renombra/amplía "desempeno"
  id              UUID PRIMARY KEY,
  id_evaluacion   UUID REFERENCES evaluaciones(id),
  id_estudiante   UUID NOT NULL REFERENCES estudiantes(id),
  nota            REAL CHECK (nota >= 1.0 AND nota <= 7.0),
  observaciones   TEXT DEFAULT '',
  fecha_ingreso   TIMESTAMPTZ DEFAULT now(),
  ingresada_por   UUID,          -- auditoría
  editada_por     UUID,
  editada_en      TIMESTAMPTZ,
  UNIQUE (id_evaluacion, id_estudiante)
);
```

> La tabla `promedios` existente se conserva, agregando `id_anio` y `tipo`
> (`parcial`, `semestral`, `anual`). `UNIQUE (id_estudiante, id_asignatura, id_periodo)`
> ya impide duplicados.

---

## 5. Reglas de negocio del ingreso de calificaciones

1. **Rango válido:** 1.0 a 7.0 (un decimal). Rechazar fuera de rango.
2. **Plazo de ingreso:** máximo **2 semanas** tras la evaluación (aviso si se excede).
3. **Ponderación por evaluación:** el docente define la ponderación de cada evaluación
   dentro del semestre; la suma de ponderaciones de un curso/periodo debe validarse
   (permite eximir del 100% si existe evaluación final, con tope **30%**).
4. **Promedio parcial:** ponderado por las evaluaciones del período.
5. **Promedio semestral:** = promedio ponderado del período (o coef1/coef2 si el
   establecimiento los usa).
6. **Promedio final anual de asignatura:** 50% semestre 1 + 50% semestre 2
   (salvo reglamento interno distinto, siempre coherente con la planificación).
7. **Promedio general:** promedio de todos los promedios finales de asignatura
   (sin aproximación). Excluye Religión, Consejo de Curso y Orientación.
8. **Redondeo:** a la décima siguiente cuando la centésima ≥ 5 (parciales, semestrales
   y finales de asignatura). El promedio general no se redondea.
9. **Estado por asignatura:** `activo` (≥ 4.0), `riesgo` (3.5-3.9), `reprobado` (< 4.0).
10. **Cálculo de situación final (Decreto 67):**
    - Promueve si aprobó todas.
    - Con 1 reprobada: promedio final anual ≥ 4.5.
    - Con 2 reprobadas: promedio final anual ≥ 5.0.
    - Requisito de asistencia ≥ 85%.
11. **Trazabilidad:** registrar quién ingresó/editó cada nota y cuándo (auditoría).
12. **Exportación SIGE:** generar archivo `.txt` con nomenclatura oficial por curso y
    año (código de asignatura MINEDUC, decreto, plan), para carga por UTP.

---

## 6. Cálculo de promedios

Pseudocódigo (coherente con `performanceService.ts:134-143` ya existente):

```
promedio_periodo(asignatura, estudiante, periodo):
  evals = evaluaciones del periodo de la asignatura
  suma = Σ(nota_i * ponderacion_i)
  pesos = Σ(ponderacion_i)
  return redondear_decima(suma / pesos)

promedio_final_asignatura(estudiante, asignatura, anio):
  s1 = promedio_periodo(..., periodo=1)
  s2 = promedio_periodo(..., periodo=2)
  return redondear_decima(s1*0.5 + s2*0.5)

promedio_general(estudiante, anio):
  asignaturas = plan de estudio del curso (excluye Religión, Consejo, Orientación)
  return Σ(promedio_final_asignatura) / cantidad   // SIN redondear

situacion_final(estudiante, anio):
  rep = asignaturas con promedio_final < 4.0
  if rep == 0: PROMOVIDO
  if rep == 1 and promedio_general >= 4.5: PROMOVIDO
  if rep == 2 and promedio_general >= 5.0: PROMOVIDO
  else: REPROBADO
  // además: asistencia < 85% → analizar según reglamento interno
```

---

## 7. Electivos: marco Mineduc y modelo

### 7.1 Qué dice la normativa (resumen aplicable)

- Los estudiantes **eligen en 2° medio** las asignaturas de profundización que cursarán
  en **3° y 4° medio** (3 asignaturas de 6 h c/u por nivel).
- El establecimiento ofrece **mínimo 6 asignaturas por nivel** cubriendo **≥ 2 áreas**
  (A: Lenguaje/Filosofía/Historia/Geografía/Cs. Sociales; B: Matemática/Ciencias;
  C: Artes/Ed. Física).
- **Cupos: mínimo 10 y máximo 30** por asignatura electiva.
- El estudiante **ordena preferencias** (1 a 6).
- Asignación con criterios priorizados (ver tabla 2.3).
- **Se pueden cambiar** antes del inicio y, con protocolo, durante el periodo
  (el usuario lo pide explícitamente: "pueden cambiar antes y durante").
- Los electivos se forman con estudiantes de **diferentes cursos del mismo nivel**
  (p. ej. 3A+3B+3C se mezclan).

### 7.2 Modelo de datos propuesto

```sql
CREATE TABLE oferta_electivos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_anio         UUID REFERENCES anios_escolares(id),
  id_asignatura   UUID REFERENCES asignaturas(id),
  nivel           TEXT NOT NULL,           -- '3M' o '4M'
  cupo_min        INTEGER NOT NULL DEFAULT 10,
  cupo_max        INTEGER NOT NULL DEFAULT 30,
  cupos_usados    INTEGER NOT NULL DEFAULT 0,
  estado          TEXT DEFAULT 'preoferta' CHECK (estado IN ('preoferta','eleccion','abierta','cerrada','cancelada')),
  horario_bloques TEXT[] DEFAULT '{}',      -- bloques en que se dicta
  creado_por      UUID
);

CREATE TABLE postulaciones_electivos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_estudiante   UUID REFERENCES estudiantes(id),
  id_anio         UUID REFERENCES anios_escolares(id),
  nivel           TEXT NOT NULL,           -- '3M' o '4M'
  preferencias    JSONB NOT NULL,          -- [{asignatura_id, orden:1..6}]
  estado          TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente','asignado','en_espera','rechazado','retirado','cambio_pendiente')),
  creado_por      UUID,
  creado_en       TIMESTAMPTZ DEFAULT now(),
  UNIQUE (id_estudiante, id_anio, nivel)
);

CREATE TABLE asignaciones_electivos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_estudiante   UUID REFERENCES estudiantes(id),
  id_oferta       UUID REFERENCES oferta_electivos(id),
  preferencia_orden INTEGER,
  asignado_por    UUID,
  fecha_asignacion TIMESTAMPTZ DEFAULT now(),
  estado          TEXT DEFAULT 'activo' CHECK (estado IN ('activo','retirado','cambiado')),
  historial       JSONB DEFAULT '[]',      -- trazabilidad de cambios
  UNIQUE (id_estudiante, id_oferta)
);
```

### 7.3 Reglas de negocio de electivos

1. **Elegibilidad:** solo estudiantes de 2° medio (nivel 2) postulan para 3° y 4°.
2. **Cantidad:** debe quedar asignado a **3 electivos por nivel**.
3. **Cupos:** no asignar si `cupos_usados >= cupo_max`; no abrir electivo si no se
   llega al `cupo_min` (10) → se reasigna según criterios.
4. **Preferencias:** el orden 1 a N define la prioridad.
5. **Criterios de desempate:** en orden: 1ª-2ª preferencia, intenciones de estudio
   superior, pruebas vocacionales, rendimiento/asistencia, opinión de docentes.
   (Cada liceo puede personalizar este orden en el protocolo.)
6. **Cambios antes del inicio:** libre dentro del período de elección.
7. **Cambios durante el año:** requieren protocolo (cupo disponible, justificación,
   aprobación UTP) y quedan en el historial.
8. **Grupos mixtos:** el electivo reúne estudiantes de distintos paralelos del mismo
   nivel → la asistencia/notas del electivo se registran contra el grupo electivo,
   no contra el curso de origen.
9. **Notas de electivos:** cada electivo es una asignatura más dentro del plan; sus
   promedios entran al promedio final anual del estudiante (Formación Diferenciada).

---

## 8. Flujo de electividad

```
1. UTP define OFERTA (preoferta)
   - consulta intereses de estudiantes (encuesta)
   - publica ≥ 6 asignaturas, ≥ 2 áreas, con cupos
   ↓
2. ESTUDIANTE de 2° medio postula
   - ordena preferencias 1..6 (formulario)
   - apoderado puede confirmar/vigilar
   ↓
3. ASIGNACIÓN AUTOMÁTICA (motor de cupos)
   - asigna por preferencia, respetando cupo_max y cupo_min
   - desempate según criterios del protocolo
   - lista de espera si no queda cupo
   ↓
4. UTP valida y publica resultados (3° y 4°)
   - estudiantes ven su asignación
   - período de CAMBIOS antes del inicio
   ↓
5. DURANTE EL AÑO
   - profesor del electivo registra notas del grupo mixto
   - cambios puntuales con protocolo (cupo + aprobación UTP)
   - cupos_usados se actualizan en tiempo real
   ↓
6. CIERRE
   - promedios de electivos entran al promedio anual
   - exportación a SIGE (si aplica)
```

---

## 9. Vistas por rol

### 9.1 Vista estudiante (única y prioritaria)

- Mis asignaturas (plan común + electivos de 3°/4°).
- Por cada asignatura: unidades/contenidos, evaluaciones y notas, ponderación.
- Promedios: parcial, semestral, final; promedio general.
- Estado por asignatura (activo/riesgo/reprobado) con **alerta** cuando < 4.0.
- Electivos: oferta, estado de postulación (asignado/en espera), cupos.
- Histórico por año escolar.

### 9.2 Vista por curso (única y prioritaria)

- Matrícula del curso (paralelo + electivos separados).
- Grilla notas: filas = estudiantes, columnas = evaluaciones (o asignaturas).
- Promedios por estudiante y por asignatura.
- Situación final estimada por estudiante (semáforo).
- Distribución de notas (promedio del curso, % aprobados/riesgo/reprobados).
- Asistencia asociada (para promoción).

### 9.3 Vista por docente (única y prioritaria)

- "Mis cursos / mis asignaturas" del año (vía `docente_asignatura_curso`).
- Ingreso de notas por evaluación (masivo por fila/columna o por estudiante).
- Alertas: evaluación sin notas, fecha_max_ingreso vencida, ponderaciones mal sumadas.
- Sus reemplazos: cursos que cubre, período de cobertura.
- Mis horas lectivas/no lectivas; carga del año.

### 9.4 Vista apoderados

- Igual a la del estudiante, **solo de sus estudiantes** (vía `estudiantes.id_apoderado`).
- Puede ver notas, promedios, situación, y electivos/postulación de sus pupilos.
- Confirmación de la postulación a electivos (opcional según protocolo).

### 9.5 Vista UTP / Inspectora

- Igual a "por curso" pero transversal (todos los cursos/niveles).
- UTP: configurar plan de estudio, ponderaciones, evaluaciones, **exportar SIGE**,
  gestionar electivos (oferta, cupos, asignación, cambios, listas de espera).
- Inspectora: asistencia, alertas de riesgo/reprobados, seguimiento por curso.

### 9.6 Vista Dirección

- Igual a "por curso" transversal + reportes consolidados por nivel/asignatura.
- Indicadores: % de promoción estimada, asignaturas críticas, situación final.
- Firma/aprobación de actas (físico o digital) previo a SIGE.

> **Principio de implementación:** construir 3 vistas núcleo (estudiante, curso,
> docente) y reutilizarlas con distintos permisos/selectores para apoderados,
> UTP/inspectora y dirección. Evitar duplicar pantallas.

---

## 10. Puntos de análisis que faltan por contemplar

El usuario pidió "otros puntos que puedas analizar y no logro alcanzar". Lista ampliada:

1. **Asistencia como condición de promoción (85%)** — las notas no bastan; hay que
   cruzar con el módulo de justificaciones existente.
2. **Histórico por año escolar** — sin entidad `anios_escolares`, no hay historial ni
   certificados de años anteriores.
3. **Trazabilidad/auditoría de notas** — quién ingresó/editó, cuándo; bloqueo de
   edición cuando una evaluación está cerrada o el período cerrado.
4. **Exportación SIGE (.txt)** — formato oficial (código asignatura + decreto + plan);
   las actas finales se generan en SIGE.
5. **Notas que no inciden** (Religión, Consejo de Curso, Orientación) — excluir del
   promedio general y de la promoción.
6. **Evaluación final con tope 30%** — si el liceo usa coef1/coef2 o evaluación final,
   el modelo debe validar el tope.
7. **Reemplazos de docentes** — quién ingresa notas durante la ausencia; transición
   limpia de responsabilidad; cobertura de horas.
8. **Horas lectivas/no lectivas** — cargas docentes; permite detectar sobrecarga y
   justificar dotación (además de las horas de contrato actuales).
9. **Grupos mixtos de electivos** — las notas del electivo no pertenecen al curso de
   origen; el modelo debe separar "curso de origen" vs "grupo electivo".
10. **Listas de espera y reasignación** — al liberarse un cupo, el motor debe
    reasignar automáticamente por preferencia.
11. **Cambios de electivo durante el año con historial** — trazabilidad de retiros,
    cambios y motivos (respaldo ante reclamos).
12. **Alumnos sin electivo (cupo insuficiente)** — caso límite: qué pasa si no queda
    cupo ni en lista de espera al cierre (protocolo UTP).
13. **Cierre de períodos (bloqueo)** — al cerrar un semestre, se congelan promedios y
    notas; solo reapertura con permisos especiales.
14. **RLS de notas por rol** — actualmente cualquier autenticado puede insertar en
    `desempeno` (`027:120-125`); debe restringirse a: docente de la asignatura,
    admin/UTP, estudiante solo lectura propia, apoderado solo de sus pupilos.
15. **Fechas de evaluaciones y calendario** — cruzar con bloques horarios para evitar
    choques de evaluaciones y coordinar el calendario mensual de evaluaciones.
16. **Movilidad de estudiantes (cambio de curso a mitad de año)** — histórico de
    notas por curso/año; el estudiante conserva sus notas.
17. **Estudiantes con Ingreso Tardío / ausencias prolongadas** — casos especiales del
    Decreto 67 que requieren reglas de evaluación diferenciada.

---

## 11. Riesgos y pendientes

- **RLS inseguro en `actividades/desempeno/promedios`** (`027:120-125`): cualquier
  autenticado puede insertar. Riesgo crítico para un módulo de notas.
- **Curso/estudiante sin FK** (`estudiantes.curso` TEXT): bloquea "por curso" y
  matrícula histórica.
- **Asignatura del docente en TEXT libre**: bloquea "asignatura asignada al docente".
- **Rol UTP/Dirección no existe** en `src/types/index.ts:6-13` → agregarlos al enum y
  a los permisos.
- **Multi-tenant incompleto** (`asignaturas` sin `id_establecimiento`) — solo aplica
  si el liceo tiene más de un establecimiento.
- **Validación de la proporción de horas lectivas/no lectivas** con la normativa
  vigente y el reglamento interno.
- **Electivos**: definir protocolo de electividad del liceo (cupos, criterios de
  desempate, plazos de cambios) antes de implementar el motor.

---

## 12. Plan de implementación por fases

### Fase A — Base de datos (fundacional)
- [ ] Crear `anios_escolares` y ligar `periodos` al año.
- [ ] Ampliar `asignaturas` (tipo, area, codigo_mineduc) + crear `unidades_aprendizaje`.
- [ ] Crear `curso_asignatura` y `docente_asignatura_curso`.
- [ ] Crear `reemplazos` y `cargas_docentes`.
- [ ] Migrar `actividades`→`evaluaciones` y `desempeno`→`notas` (o ampliarlas) con FK y auditoría.
- [ ] Agregar FK `estudiantes.id_curso` y migrar datos TEXT → UUID (o tabla `matricula_anual`).
- [ ] Corregir RLS: docente de su asignatura, UTP/admin, estudiante propio, apoderado de sus pupilos.

### Fase B — Catálogos y config (UTP)
- [ ] Mantenedor de asignaturas con contenidos/unidades.
- [ ] Configurar plan de estudio por curso y año (`curso_asignatura`).
- [ ] Asignar docentes a curso+asignatura; gestionar reemplazos.
- [ ] Cargas docentes (lectivas/no lectivas).
- [ ] Definir ponderaciones por período/evaluación.

### Fase C — Vistas núcleo
- [ ] Vista **estudiante** (notas, promedios, estado, alertas, electivos).
- [ ] Vista **por curso** (grilla de notas, situación final, distribución).
- [ ] Vista **docente** (ingreso de notas, alertas, reemplazos, carga horaria).
- [ ] Reutilizar las 3 vistas para apoderados, UTP/inspectora y dirección (permisos).

### Fase D — Electivos
- [ ] Encuesta de intereses → oferta (≥ 6 asignaturas, ≥ 2 áreas, cupos).
- [ ] Postulación (preferencias 1..N) para estudiantes de 2° medio.
- [ ] Motor de asignación con cupos y criterios de desempate + lista de espera.
- [ ] Resultados, período de cambios antes del inicio.
- [ ] Cambios durante el año con protocolo e historial.
- [ ] Grupos mixtos: notas del electivo al grupo electivo.

### Fase E — Cierre e integración
- [ ] Cierre de períodos (congelar) y cálculo de situación final (Decreto 67).
- [ ] Reportes por rol (promoción estimada, asignaturas críticas).
- [ ] Exportación SIGE (.txt) y generación de actas.
- [ ] Certificados/historial por año escolar.

---

## 13. Referencias

- Decreto 67/2018 (Evaluación, Calificación y Promoción) — ayudamineduc.cl
- Decreto 193/2019 (Bases curriculares 3° y 4° medio) y Decreto 876/2019 (Planes de estudio).
- Manual de implementación Plan de Estudios Mineduc para 3° y 4° medio (UCE, 2020).
- SIGE — Manuales MINEDUC (sige_proceso_actas.html) y Ayuda WebClass (exportación .txt).
- Código actual: `supabase/migrations/027_create_tablas_academicas.sql`,
  `src/services/performanceService.ts`, `src/services/academico/catalogo.service.ts`,
  `SQL_md/SQL_BLOQUES_HORARIOS.sql`, `src/types/index.ts`.
