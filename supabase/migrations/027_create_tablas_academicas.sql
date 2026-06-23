-- ============================================================
-- SGJA – Migration 027: Academic Module Tables (Phase 1)
-- salas_aprendizaje, asignaturas, periodos, actividades,
-- desempeno, promedios
-- ============================================================

-- 1. SALAS DE APRENDIZAJE
CREATE TABLE IF NOT EXISTS salas_aprendizaje (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      TEXT NOT NULL,
  tipo        TEXT NOT NULL CHECK (tipo IN (
    'cognitiva', 'audiovisual', 'colaborativa',
    'investigativa', 'practica', 'evaluacion'
  )),
  capacidad   INTEGER NOT NULL DEFAULT 30,
  activo      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. ASIGNATURAS
CREATE TABLE IF NOT EXISTS asignaturas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre          TEXT NOT NULL,
  nivel           TEXT NOT NULL DEFAULT '',
  horas_semanales INTEGER NOT NULL DEFAULT 0,
  activo          BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. PERIODOS (semestres/trimestres)
CREATE TABLE IF NOT EXISTS periodos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre       TEXT NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin    DATE NOT NULL,
  activo       BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. ACTIVIDADES (evaluaciones/tareas)
CREATE TABLE IF NOT EXISTS actividades (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_asignatura UUID NOT NULL REFERENCES asignaturas(id),
  id_periodo    UUID NOT NULL REFERENCES periodos(id),
  id_sala       UUID REFERENCES salas_aprendizaje(id),
  nombre        TEXT NOT NULL,
  descripcion   TEXT NOT NULL DEFAULT '',
  ponderacion   REAL NOT NULL DEFAULT 1.0 CHECK (ponderacion > 0),
  fecha         DATE NOT NULL,
  activo        BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. DESEMPEÑO (notas por estudiante por actividad)
CREATE TABLE IF NOT EXISTS desempeno (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_actividad  UUID NOT NULL REFERENCES actividades(id),
  id_estudiante UUID NOT NULL,
  nota          REAL CHECK (nota >= 1.0 AND nota <= 7.0),
  observaciones TEXT NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  activo        BOOLEAN NOT NULL DEFAULT true
);

-- 6. PROMEDIOS (cálculo por estudiante/asignatura/periodo)
CREATE TABLE IF NOT EXISTS promedios (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_estudiante   UUID NOT NULL,
  id_asignatura   UUID NOT NULL REFERENCES asignaturas(id),
  id_periodo      UUID NOT NULL REFERENCES periodos(id),
  promedio_final  REAL NOT NULL DEFAULT 0.0,
  estado          TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'riesgo', 'reprobado')),
  activo          BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (id_estudiante, id_asignatura, id_periodo)
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_actividades_asignatura ON actividades(id_asignatura);
CREATE INDEX IF NOT EXISTS idx_actividades_periodo   ON actividades(id_periodo);
CREATE INDEX IF NOT EXISTS idx_actividades_sala      ON actividades(id_sala);
CREATE INDEX IF NOT EXISTS idx_actividades_fecha     ON actividades(fecha);
CREATE INDEX IF NOT EXISTS idx_desempeno_actividad   ON desempeno(id_actividad);
CREATE INDEX IF NOT EXISTS idx_desempeno_estudiante  ON desempeno(id_estudiante);
CREATE INDEX IF NOT EXISTS idx_promedios_estudiante  ON promedios(id_estudiante);
CREATE INDEX IF NOT EXISTS idx_promedios_asignatura  ON promedios(id_asignatura);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE salas_aprendizaje ENABLE ROW LEVEL SECURITY;
ALTER TABLE asignaturas       ENABLE ROW LEVEL SECURITY;
ALTER TABLE periodos          ENABLE ROW LEVEL SECURITY;
ALTER TABLE actividades       ENABLE ROW LEVEL SECURITY;
ALTER TABLE desempeno         ENABLE ROW LEVEL SECURITY;
ALTER TABLE promedios         ENABLE ROW LEVEL SECURITY;

-- Políticas: todos los usuarios autenticados pueden leer
CREATE POLICY "lectura_salas_aprendizaje"  ON salas_aprendizaje FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "lectura_asignaturas"        ON asignaturas       FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "lectura_periodos"           ON periodos          FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "lectura_actividades"        ON actividades       FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "lectura_desempeno"          ON desempeno         FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "lectura_promedios"          ON promedios         FOR SELECT USING (auth.role() = 'authenticated');

-- Inserción/edición solo para ADMIN e INSPECTOR (según custom claim)
CREATE POLICY "escritura_admin" ON salas_aprendizaje
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND COALESCE(auth.jwt() ->> 'role', '') IN ('ADMIN', 'INSPECTOR'));
CREATE POLICY "escritura_admin" ON asignaturas
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND COALESCE(auth.jwt() ->> 'role', '') IN ('ADMIN', 'INSPECTOR'));
CREATE POLICY "escritura_admin" ON periodos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND COALESCE(auth.jwt() ->> 'role', '') IN ('ADMIN', 'INSPECTOR'));
CREATE POLICY "escritura_admin" ON actividades
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "escritura_admin" ON desempeno
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "escritura_admin" ON promedios
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
