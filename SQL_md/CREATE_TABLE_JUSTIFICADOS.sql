-- ========================================================================
-- CREATE TABLE justificados
-- Almacena registros de inasistencias justificadas de estudiantes
-- Similar a injustificados pero CON campos de justificación
-- Fecha: 2026-04-25
-- ========================================================================

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS justificados (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    id_solicitud TEXT NOT NULL UNIQUE,
    id_estudiante TEXT NOT NULL,
    id_profesor UUID NOT NULL,
    curso TEXT NOT NULL,
    id_bloque TEXT NOT NULL,
    id_establecimiento UUID NOT NULL,
    estado TEXT NOT NULL CHECK (estado IN ('Pendiente', 'Aprobada', 'Rechazada')),
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    bloques_afectados INTEGER NOT NULL CHECK (bloques_afectados > 0),
    tipo TEXT NOT NULL CHECK (tipo IN ('INASISTENCIA', 'ATRASO', 'RETIRO')),
    
    -- Campos específicos de justificación
    motivo_codigo TEXT NOT NULL,
    motivo_descripcion TEXT NOT NULL,
    requiere_respaldo BOOLEAN DEFAULT false,
    respaldo_recibido BOOLEAN DEFAULT false,
    observaciones TEXT,
    
    -- Campos de auditoría
    activo BOOLEAN DEFAULT true,
    
    -- Foreign Keys
    CONSTRAINT fk_justificados_estudiantes 
        FOREIGN KEY (id_estudiante) REFERENCES estudiantes(id_estudiante) ON DELETE RESTRICT,
    CONSTRAINT fk_justificados_profesores 
        FOREIGN KEY (id_profesor) REFERENCES usuarios(id) ON DELETE RESTRICT,
    CONSTRAINT fk_justificados_cursos 
        FOREIGN KEY (curso) REFERENCES cursos(codigo) ON DELETE RESTRICT,
    CONSTRAINT fk_justificados_bloques 
        FOREIGN KEY (id_bloque) REFERENCES bloques_horarios(id_bloque) ON DELETE RESTRICT,
    CONSTRAINT fk_justificados_establecimientos 
        FOREIGN KEY (id_establecimiento) REFERENCES establecimientos(id) ON DELETE RESTRICT,
    CONSTRAINT fk_justificados_motivos 
        FOREIGN KEY (motivo_codigo) REFERENCES motivos_justificacion(codigo) ON DELETE RESTRICT
);

-- Crear índices para optimizar búsquedas
CREATE INDEX idx_justificados_estudiante ON justificados(id_estudiante);
CREATE INDEX idx_justificados_profesor ON justificados(id_profesor);
CREATE INDEX idx_justificados_curso ON justificados(curso);
CREATE INDEX idx_justificados_fecha ON justificados(fecha);
CREATE INDEX idx_justificados_estado ON justificados(estado);
CREATE INDEX idx_justificados_establecimiento ON justificados(id_establecimiento);
CREATE INDEX idx_justificados_motivo ON justificados(motivo_codigo);

-- ========================================================================
-- RLS (Row Level Security) - Deshabilitado temporalmente para import
-- ========================================================================
-- ALTER TABLE justificados ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY justificados_select ON justificados
--   FOR SELECT USING (
--     auth.uid()::text = (SELECT uid FROM usuarios WHERE id = id_profesor)
--     OR EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid()::uuid AND rol IN ('ADMIN', 'INSPECTOR'))
--     OR auth.uid()::text = (SELECT uid FROM usuarios u WHERE u.id IN (
--       SELECT apoderado_id FROM estudiantes WHERE id_estudiante = id_estudiante
--     ))
--   );

-- CREATE POLICY justificados_update ON justificados
--   FOR UPDATE USING (
--     EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid()::uuid AND rol IN ('ADMIN', 'INSPECTOR'))
--   );

COMMIT;

-- ========================================================================
-- VALIDACIÓN
-- ========================================================================
SELECT table_name FROM information_schema.tables WHERE table_name = 'justificados';
