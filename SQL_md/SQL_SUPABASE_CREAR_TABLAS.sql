-- ============================================================================
-- SCRIPT COMPLETO: CREAR TODAS LAS TABLAS EN SUPABASE
-- Ejecutar de una sola vez en SQL Editor de Supabase
-- ============================================================================

-- PASO 1: CREAR TABLA ESTABLECIMIENTOS (sin dependencias)
-- ============================================================================
CREATE TABLE IF NOT EXISTS establecimientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  codigo TEXT UNIQUE NOT NULL,
  region TEXT,
  activo BOOLEAN DEFAULT true,
  creado_en TIMESTAMP DEFAULT now(),
  CONSTRAINT nombre_no_vacio CHECK (nombre <> ''),
  CONSTRAINT codigo_no_vacio CHECK (codigo <> '')
);

-- PASO 2: CREAR TABLA USUARIOS
-- ============================================================================
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uid TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  nombre_completo TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'PROFESOR',
  id_establecimiento UUID REFERENCES establecimientos(id) ON DELETE SET NULL,
  activo BOOLEAN DEFAULT true,
  creado_en TIMESTAMP DEFAULT now(),
  actualizado_en TIMESTAMP DEFAULT now(),
  CONSTRAINT rol_valido CHECK (rol IN ('ADMIN', 'INSPECTOR', 'PROFESOR', 'ESTUDIANTE', 'APODERADO')),
  CONSTRAINT email_no_vacio CHECK (email <> ''),
  CONSTRAINT nombre_no_vacio CHECK (nombre_completo <> '')
);

-- PASO 3: CREAR TABLA ESTUDIANTES
-- ============================================================================
CREATE TABLE IF NOT EXISTS estudiantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_estudiante TEXT UNIQUE NOT NULL,
  nombre_completo TEXT NOT NULL,
  email TEXT,
  curso TEXT NOT NULL,
  id_establecimiento UUID REFERENCES establecimientos(id) ON DELETE SET NULL,
  apoderado_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  activo BOOLEAN DEFAULT true,
  creado_en TIMESTAMP DEFAULT now(),
  actualizado_en TIMESTAMP DEFAULT now(),
  CONSTRAINT nombre_no_vacio CHECK (nombre_completo <> ''),
  CONSTRAINT curso_no_vacio CHECK (curso <> ''),
  CONSTRAINT id_estudiante_no_vacio CHECK (id_estudiante <> '')
);

-- PASO 4: CREAR TABLA BLOQUES_HORARIOS
-- ============================================================================
CREATE TABLE IF NOT EXISTS bloques_horarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_bloque TEXT UNIQUE NOT NULL,
  nombre_bloque TEXT NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  orden INTEGER NOT NULL,
  id_establecimiento UUID REFERENCES establecimientos(id) ON DELETE CASCADE,
  activo BOOLEAN DEFAULT true,
  creado_en TIMESTAMP DEFAULT now(),
  CONSTRAINT nombre_no_vacio CHECK (nombre_bloque <> ''),
  CONSTRAINT id_bloque_no_vacio CHECK (id_bloque <> ''),
  CONSTRAINT orden_positivo CHECK (orden > 0)
);

-- PASO 5: CREAR TABLA MOTIVOS_JUSTIFICACION
-- ============================================================================
CREATE TABLE IF NOT EXISTS motivos_justificacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT UNIQUE NOT NULL,
  descripcion TEXT NOT NULL,
  requiere_respaldo BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,
  creado_en TIMESTAMP DEFAULT now(),
  CONSTRAINT codigo_no_vacio CHECK (codigo <> ''),
  CONSTRAINT descripcion_no_vacio CHECK (descripcion <> '')
);

-- PASO 6: CREAR TABLA SOLICITUDES
-- ============================================================================
CREATE TABLE IF NOT EXISTS solicitudes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_solicitud TEXT UNIQUE NOT NULL,
  id_estudiante TEXT NOT NULL,
  id_profesor UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  id_profesor_nombre TEXT,
  tipo TEXT NOT NULL DEFAULT 'AUSENCIA',
  estado TEXT NOT NULL DEFAULT 'PENDIENTE',
  fecha DATE NOT NULL,
  hora TEXT,
  id_bloque TEXT,
  curso TEXT,
  id_establecimiento UUID REFERENCES establecimientos(id) ON DELETE SET NULL,
  motivo_codigo TEXT,
  motivo_descripcion TEXT,
  observaciones TEXT,
  id_inspector_justificador UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  respaldo_recibido BOOLEAN DEFAULT false,
  tipo_respaldo TEXT,
  id_token_qr TEXT,
  bloques_afectados INTEGER DEFAULT 1,
  creado_en TIMESTAMP DEFAULT now(),
  actualizado_en TIMESTAMP DEFAULT now(),
  CONSTRAINT tipo_valido CHECK (tipo IN ('AUSENCIA', 'ATRASO', 'INASISTENCIA', 'JUSTIFICADA')),
  CONSTRAINT estado_valido CHECK (estado IN ('PENDIENTE', 'JUSTIFICADA', 'INJUSTIFICADA', 'RECHAZADA')),
  CONSTRAINT id_solicitud_no_vacio CHECK (id_solicitud <> ''),
  CONSTRAINT bloques_positivos CHECK (bloques_afectados > 0)
);

-- PASO 7: CREAR TABLA FUNCIONARIOS
-- ============================================================================
CREATE TABLE IF NOT EXISTS funcionarios (
  rut TEXT PRIMARY KEY,
  rut_formateado TEXT NOT NULL,
  nombre_completo TEXT NOT NULL,
  fecha_nacimiento DATE,
  domicilio TEXT NOT NULL,
  comuna TEXT NOT NULL,
  celular TEXT NOT NULL,
  correo_personal TEXT NOT NULL UNIQUE,
  correo_institucional TEXT NOT NULL UNIQUE,
  titulo_profesional TEXT,
  universidad TEXT,
  ano_titulacion INTEGER,
  fecha_ingreso DATE,
  fecha_termino DATE,
  horas_contrato INTEGER,
  vigente BOOLEAN DEFAULT true,
  usuario_registrado_sistema BOOLEAN DEFAULT false,
  creado_en TIMESTAMP DEFAULT now(),
  actualizado_en TIMESTAMP DEFAULT now(),
  CONSTRAINT rut_no_vacio CHECK (rut <> ''),
  CONSTRAINT nombre_no_vacio CHECK (nombre_completo <> ''),
  CONSTRAINT domicilio_no_vacio CHECK (domicilio <> ''),
  CONSTRAINT comuna_no_vacio CHECK (comuna <> '')
);

-- PASO 8: CREAR TABLA CURSOS
-- ============================================================================
CREATE TABLE IF NOT EXISTS cursos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL,
  nombre TEXT NOT NULL,
  nivel TEXT NOT NULL,
  id_establecimiento UUID REFERENCES establecimientos(id) ON DELETE CASCADE,
  profesor_jefe_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  activo BOOLEAN DEFAULT true,
  creado_en TIMESTAMP DEFAULT now(),
  actualizado_en TIMESTAMP DEFAULT now(),
  CONSTRAINT codigo_no_vacio CHECK (codigo <> ''),
  CONSTRAINT nombre_no_vacio CHECK (nombre <> ''),
  CONSTRAINT nivel_no_vacio CHECK (nivel <> '')
);

-- PASO 9: CREAR TABLA PERMISOS (Junction para roles y permisos)
-- ============================================================================
CREATE TABLE IF NOT EXISTS permisos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT UNIQUE NOT NULL,
  descripcion TEXT,
  activo BOOLEAN DEFAULT true,
  creado_en TIMESTAMP DEFAULT now(),
  CONSTRAINT nombre_no_vacio CHECK (nombre <> '')
);

-- PASO 10: CREAR TABLA ROL_PERMISOS (Many-to-Many)
-- ============================================================================
CREATE TABLE IF NOT EXISTS rol_permisos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rol TEXT NOT NULL,
  id_permiso UUID REFERENCES permisos(id) ON DELETE CASCADE,
  creado_en TIMESTAMP DEFAULT now(),
  CONSTRAINT rol_valido CHECK (rol IN ('ADMIN', 'INSPECTOR', 'PROFESOR', 'ESTUDIANTE', 'APODERADO')),
  UNIQUE(rol, id_permiso)
);

-- PASO 11: CREAR TABLA PAGINAS
-- ============================================================================
CREATE TABLE IF NOT EXISTS paginas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  contenido TEXT,
  slug TEXT UNIQUE NOT NULL,
  activo BOOLEAN DEFAULT true,
  creado_en TIMESTAMP DEFAULT now(),
  actualizado_en TIMESTAMP DEFAULT now(),
  CONSTRAINT titulo_no_vacio CHECK (titulo <> ''),
  CONSTRAINT slug_no_vacio CHECK (slug <> '')
);

-- ============================================================================
-- ÍNDICES PARA OPTIMIZAR QUERIES
-- ============================================================================
CREATE INDEX idx_usuarios_uid ON usuarios(uid);
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_establecimiento ON usuarios(id_establecimiento);
CREATE INDEX idx_estudiantes_establecimiento ON estudiantes(id_establecimiento);
CREATE INDEX idx_estudiantes_apoderado ON estudiantes(apoderado_id);
CREATE INDEX idx_solicitudes_estudiante ON solicitudes(id_estudiante);
CREATE INDEX idx_solicitudes_profesor ON solicitudes(id_profesor);
CREATE INDEX idx_solicitudes_estado ON solicitudes(estado);
CREATE INDEX idx_solicitudes_fecha ON solicitudes(fecha);
CREATE INDEX idx_solicitudes_establecimiento ON solicitudes(id_establecimiento);
CREATE INDEX idx_bloques_horarios_establecimiento ON bloques_horarios(id_establecimiento);
CREATE INDEX idx_cursos_establecimiento ON cursos(id_establecimiento);
CREATE INDEX idx_cursos_profesor_jefe ON cursos(profesor_jefe_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - SEGURIDAD
-- ============================================================================

-- Habilitar RLS en tablas sensibles
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE estudiantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitudes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bloques_horarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE cursos ENABLE ROW LEVEL SECURITY;

-- POLÍTICA 1: USUARIOS VEN SOLO SU ESTABLECIMIENTO
-- (Comentado porque necesita más configuración de auth.uid())
-- CREATE POLICY "usuarios_ver_por_establecimiento" ON usuarios
--   AS SELECT
--   USING (id_establecimiento = 
--     (SELECT id_establecimiento FROM usuarios WHERE uid = auth.uid()));

-- POLÍTICA 2: ESTUDIANTES VEN SOLO SUS SOLICITUDES (apoderados)
-- CREATE POLICY "estudiantes_ver_propias_solicitudes" ON solicitudes
--   AS SELECT
--   USING (id_estudiante = 
--     (SELECT id_estudiante FROM estudiantes WHERE apoderado_id = auth.uid()));

-- NOTA: Las políticas RLS se configurarán después de establecer roles en Supabase Auth

-- ============================================================================
-- FUNCIONES Y TRIGGERS
-- ============================================================================

-- FUNCIÓN: Crear usuario en tabla usuarios cuando se registra en auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.usuarios (uid, email, nombre_completo, rol)
  VALUES (NEW.id, NEW.email, NEW.email, 'PROFESOR')
  ON CONFLICT (uid) DO NOTHING;
  RETURN NEW;
END;
$$;

-- TRIGGER: Ejecutar función cuando se crea usuario en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- FUNCIÓN: Actualizar timestamp cuando se modifica un registro
CREATE OR REPLACE FUNCTION public.actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- TRIGGERS: Aplicar a todas las tablas que tienen actualizado_en
CREATE TRIGGER trigger_actualizar_usuarios BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION public.actualizar_timestamp();

CREATE TRIGGER trigger_actualizar_estudiantes BEFORE UPDATE ON estudiantes
  FOR EACH ROW EXECUTE FUNCTION public.actualizar_timestamp();

CREATE TRIGGER trigger_actualizar_solicitudes BEFORE UPDATE ON solicitudes
  FOR EACH ROW EXECUTE FUNCTION public.actualizar_timestamp();

CREATE TRIGGER trigger_actualizar_cursos BEFORE UPDATE ON cursos
  FOR EACH ROW EXECUTE FUNCTION public.actualizar_timestamp();

-- ============================================================================
-- DATOS INICIALES (OPCIONALES)
-- ============================================================================

-- Insertar establecimientos iniciales
INSERT INTO establecimientos (nombre, codigo, region) VALUES
  ('Liceo Municipal A', 'LMA-001', 'Región Metropolitana'),
  ('Colegio B', 'COL-002', 'Valparaíso'),
  ('Escuela C', 'ESC-003', 'Bío-Bío')
ON CONFLICT (codigo) DO NOTHING;

-- Insertar motivos de justificación iniciales
INSERT INTO motivos_justificacion (codigo, descripcion, requiere_respaldo) VALUES
  ('MED', 'Control médico', true),
  ('FAM', 'Razones familiares', false),
  ('OTR', 'Otros', true),
  ('ENF', 'Enfermedad', true),
  ('DEN', 'Dentista', true)
ON CONFLICT (codigo) DO NOTHING;

-- Insertar permisos iniciales
INSERT INTO permisos (nombre, descripcion) VALUES
  ('ver_estudiantes', 'Ver lista de estudiantes'),
  ('crear_solicitud', 'Crear solicitudes de ausencia'),
  ('justificar', 'Justificar ausencias'),
  ('ver_reportes', 'Ver reportes del sistema'),
  ('ver_funcionarios', 'Ver registro de funcionarios'),
  ('mantenedor_funcionarios', 'Acceder a mantenedor de funcionarios'),
  ('mantenedor_establecimientos', 'Acceder a mantenedor de establecimientos'),
  ('admin_sistema', 'Acceso total al sistema')
ON CONFLICT (nombre) DO NOTHING;

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================

-- Ejecutar estas queries para verificar que todo está bien:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public';
--
-- Si todo está bien, deberías ver:
-- establecimientos, usuarios, estudiantes, solicitudes, bloques_horarios,
-- motivos_justificacion, funcionarios, cursos, permisos, rol_permisos, paginas

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================
