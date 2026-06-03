-- ========================================================================
-- CREATE TABLE injustificados
-- Almacena registros de inasistencias injustificadas de estudiantes
-- Fecha: 2026-04-25
-- ========================================================================

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS injustificados (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    id_solicitud TEXT NOT NULL UNIQUE,
    id_estudiante TEXT NOT NULL,
    id_profesor UUID NOT NULL,
    curso TEXT NOT NULL,
    id_bloque TEXT NOT NULL,
    id_establecimiento UUID NOT NULL,
    estado TEXT NOT NULL CHECK (estado IN ('Injustificada', 'Pendiente')),
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    bloques_afectados INTEGER NOT NULL CHECK (bloques_afectados > 0),
    tipo TEXT NOT NULL CHECK (tipo IN ('INASISTENCIA', 'ATRASO', 'RETIRO')),
    respaldo_recibido BOOLEAN DEFAULT false,
    activo BOOLEAN DEFAULT true,
    
    -- Foreign Keys
    CONSTRAINT fk_injustificados_estudiantes 
        FOREIGN KEY (id_estudiante) REFERENCES estudiantes(id_estudiante) ON DELETE RESTRICT,
    CONSTRAINT fk_injustificados_profesores 
        FOREIGN KEY (id_profesor) REFERENCES usuarios(id) ON DELETE RESTRICT,
    CONSTRAINT fk_injustificados_cursos 
        FOREIGN KEY (curso) REFERENCES cursos(codigo) ON DELETE RESTRICT,
    CONSTRAINT fk_injustificados_bloques 
        FOREIGN KEY (id_bloque) REFERENCES bloques_horarios(id_bloque) ON DELETE RESTRICT,
    CONSTRAINT fk_injustificados_establecimientos 
        FOREIGN KEY (id_establecimiento) REFERENCES establecimientos(id) ON DELETE RESTRICT
);

-- Crear índices para optimizar búsquedas
CREATE INDEX idx_injustificados_estudiante ON injustificados(id_estudiante);
CREATE INDEX idx_injustificados_profesor ON injustificados(id_profesor);
CREATE INDEX idx_injustificados_curso ON injustificados(curso);
CREATE INDEX idx_injustificados_fecha ON injustificados(fecha);
CREATE INDEX idx_injustificados_establecimiento ON injustificados(id_establecimiento);

-- ========================================================================
-- RLS (Row Level Security) - Deshabilitado temporalmente para import
-- ========================================================================
-- ALTER TABLE injustificados ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY injustificados_select ON injustificados
--   FOR SELECT USING (
--     auth.uid()::text = (SELECT uid FROM usuarios WHERE id = id_profesor)
--     OR EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid()::uuid AND rol IN ('ADMIN', 'INSPECTOR'))
--   );

-- CREATE POLICY injustificados_insert ON injustificados
--   FOR INSERT WITH CHECK (
--     EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid()::uuid AND rol IN ('ADMIN', 'PROFESOR'))
--   );

COMMIT;

-- ========================================================================
-- VALIDACIÓN
-- ========================================================================
SELECT table_name FROM information_schema.tables WHERE table_name = 'injustificados';
