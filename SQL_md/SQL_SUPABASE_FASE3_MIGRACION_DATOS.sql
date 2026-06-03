-- ============================================================================
-- FASE 3: MIGRACIÓN DE DATOS - FIRESTORE → SUPABASE
-- Scripts SQL para importar datos exportados desde Firestore
-- ============================================================================

-- ============================================================================
-- PASO 1: PREPARAR BASE DE DATOS PARA IMPORTACIÓN
-- ============================================================================

-- Deshabilitar RLS temporalmente para importación (más rápido)
ALTER TABLE establecimientos DISABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE estudiantes DISABLE ROW LEVEL SECURITY;
ALTER TABLE solicitudes DISABLE ROW LEVEL SECURITY;
ALTER TABLE bloques_horarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE motivos_justificacion DISABLE ROW LEVEL SECURITY;
ALTER TABLE cursos DISABLE ROW LEVEL SECURITY;
ALTER TABLE funcionarios DISABLE ROW LEVEL SECURITY;

-- Deshabilitar triggers temporalmente
ALTER TABLE usuarios DISABLE TRIGGER all;
ALTER TABLE estudiantes DISABLE TRIGGER all;
ALTER TABLE solicitudes DISABLE TRIGGER all;
ALTER TABLE funcionarios DISABLE TRIGGER all;

-- ============================================================================
-- PASO 2: LIMPIAR DATOS EXISTENTES (SI EXISTEN)
-- ============================================================================

-- ADVERTENCIA: Esto eliminará todos los datos existentes
-- Si quieres mantener datos, comenta estas líneas

-- DELETE FROM solicitudes;
-- DELETE FROM estudiantes;
-- DELETE FROM usuarios;
-- DELETE FROM cursos;
-- DELETE FROM bloques_horarios;
-- DELETE FROM funcionarios;
-- DELETE FROM motivos_justificacion;
-- DELETE FROM establecimientos;

-- ============================================================================
-- PASO 3: IMPORTAR ESTABLECIMIENTOS
-- ============================================================================

-- Opción A: Si tienes datos en CSV (vía Supabase UI)
-- File → CSV → establecimientos → Importar

-- Opción B: SQL directo (ejemplo)
INSERT INTO establecimientos (id, nombre, codigo, region, activo, creado_en)
SELECT 
  gen_random_uuid(),
  'Liceo Municipal',
  'LIC001',
  'Región Metropolitana',
  true,
  now()
WHERE NOT EXISTS (SELECT 1 FROM establecimientos WHERE codigo = 'LIC001')
ON CONFLICT (codigo) DO NOTHING;

-- ============================================================================
-- PASO 4: IMPORTAR USUARIOS (PROFESORES, INSPECTORES, ADMINS)
-- ============================================================================

-- IMPORTANTE: Los UIDs deben venir de Supabase Auth
-- 1. Crear usuarios en Supabase Auth (UI o API)
-- 2. Copiar sus UIDs
-- 3. Usar este script para asociarlos a la tabla usuarios

INSERT INTO usuarios (uid, email, nombre_completo, rol, id_establecimiento, activo, creado_en)
VALUES
  ('uid-profesor-1', 'profesor@escuela.cl', 'Juan Pérez Profesor', 'PROFESOR', 
   (SELECT id FROM establecimientos WHERE codigo = 'LIC001' LIMIT 1), true, now()),
  ('uid-inspector-1', 'inspector@escuela.cl', 'María García Inspector', 'INSPECTOR',
   (SELECT id FROM establecimientos WHERE codigo = 'LIC001' LIMIT 1), true, now()),
  ('uid-admin-1', 'admin@escuela.cl', 'Carlos López Admin', 'ADMIN',
   (SELECT id FROM establecimientos WHERE codigo = 'LIC001' LIMIT 1), true, now())
ON CONFLICT (uid) DO NOTHING;

-- ============================================================================
-- PASO 5: IMPORTAR BLOQUES HORARIOS
-- ============================================================================

INSERT INTO bloques_horarios (id_bloque, nombre_bloque, hora_inicio, hora_fin, orden, id_establecimiento, activo, creado_en)
SELECT
  'BLOQUE-' || seq,
  'Bloque ' || seq,
  ('08:' || (seq*15 % 60))::TIME,  -- Ejemplo: 8:00, 8:15, 8:30...
  ('08:' || ((seq*15 + 45) % 60))::TIME,
  seq,
  (SELECT id FROM establecimientos WHERE codigo = 'LIC001' LIMIT 1),
  true,
  now()
FROM (SELECT generate_series(1, 8) as seq) s
WHERE NOT EXISTS (SELECT 1 FROM bloques_horarios WHERE id_bloque LIKE 'BLOQUE-%')
ON CONFLICT (id_bloque) DO NOTHING;

-- ============================================================================
-- PASO 6: IMPORTAR MOTIVOS DE JUSTIFICACIÓN
-- ============================================================================

INSERT INTO motivos_justificacion (codigo, descripcion, requiere_respaldo, activo, creado_en)
VALUES
  ('MED', 'Control médico', true, true, now()),
  ('FAM', 'Razones familiares', true, true, now()),
  ('ENF', 'Enfermedad', true, true, now()),
  ('DEN', 'Dentista', true, true, now()),
  ('OTR', 'Otros motivos', false, true, now())
ON CONFLICT (codigo) DO NOTHING;

-- ============================================================================
-- PASO 7: IMPORTAR ESTUDIANTES
-- ============================================================================

-- Desde Firestore, exportar como JSON y luego insertar
-- Ejemplo de estructura:
INSERT INTO estudiantes (id_estudiante, nombre_completo, email, curso, id_establecimiento, apoderado_id, activo, creado_en)
VALUES
  ('RUT-1', 'Pedro García Pérez', 'pedro@escuela.cl', '4°A',
   (SELECT id FROM establecimientos WHERE codigo = 'LIC001' LIMIT 1), NULL, true, now()),
  ('RUT-2', 'Ana Rodríguez López', 'ana@escuela.cl', '4°A',
   (SELECT id FROM establecimientos WHERE codigo = 'LIC001' LIMIT 1), NULL, true, now())
ON CONFLICT (id_estudiante) DO NOTHING;

-- ============================================================================
-- PASO 8: IMPORTAR SOLICITUDES (JUSTIFICATIVOS/AUSENCIAS)
-- ============================================================================

-- Ejemplo de migración de datos históricos
INSERT INTO solicitudes (
  id_solicitud, id_estudiante, id_profesor, tipo, estado, fecha,
  hora, id_bloque, curso, id_establecimiento, motivo_codigo,
  respaldo_recibido, creado_en, actualizado_en
)
VALUES
  ('SOL-2025-001', 'RUT-1', (SELECT id FROM usuarios WHERE rol = 'PROFESOR' LIMIT 1),
   'AUSENCIA', 'JUSTIFICADA', '2025-04-10', '08:00', 'BLOQUE-1', '4°A',
   (SELECT id FROM establecimientos WHERE codigo = 'LIC001' LIMIT 1), 'MED', true, now(), now())
ON CONFLICT (id_solicitud) DO NOTHING;

-- ============================================================================
-- PASO 9: IMPORTAR FUNCIONARIOS
-- ============================================================================

INSERT INTO funcionarios (
  rut, rut_formateado, nombre_completo, domicilio, comuna,
  celular, correo_personal, correo_institucional
)
VALUES
  ('12345678-9', '12.345.678-9', 'José Martínez García', 'Calle Principal 123',
   'Santiago', '+56912345678', 'jose.personal@email.com', 'jose@escuela.cl')
ON CONFLICT (rut) DO NOTHING;

-- ============================================================================
-- PASO 10: IMPORTAR CURSOS
-- ============================================================================

INSERT INTO cursos (codigo, nombre, nivel, id_establecimiento, profesor_jefe_id, activo, creado_en)
VALUES
  ('CURSO-4A', 'Cuarto A', '4', (SELECT id FROM establecimientos WHERE codigo = 'LIC001' LIMIT 1),
   (SELECT id FROM usuarios WHERE rol = 'PROFESOR' LIMIT 1), true, now())
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PASO 11: IMPORTAR VÍA CSV (MÉTODO ALTERNATIVO - DESDE UI)
-- ============================================================================

/*

PASOS EN SUPABASE UI:

1. Ir a Database → Table Editor
2. Seleccionar tabla destino (ej: usuarios)
3. Click en "📥 Import data"
4. Seleccionar archivo CSV
5. Mapear columnas correctamente
6. Click "Import"

IMPORTANTE:
- El archivo CSV debe tener headers
- Las columnas UUID deben estar vacías (se generan automáticamente)
- Las fechas deben estar en formato ISO (YYYY-MM-DD)
- Los booleanos deben ser true/false o 0/1

EJEMPLO CSV (establecimientos.csv):
```
nombre,codigo,region,activo
Liceo Municipal,LIC001,Región Metropolitana,true
Colegio Privado,COL001,Valparaíso,true
```

*/

-- ============================================================================
-- PASO 12: VALIDAR INTEGRIDAD DE DATOS
-- ============================================================================

-- QUERY 1: Contar registros por tabla
SELECT 
  'establecimientos' as tabla, COUNT(*) as cantidad FROM establecimientos
UNION ALL
SELECT 'usuarios', COUNT(*) FROM usuarios
UNION ALL
SELECT 'estudiantes', COUNT(*) FROM estudiantes
UNION ALL
SELECT 'solicitudes', COUNT(*) FROM solicitudes
UNION ALL
SELECT 'bloques_horarios', COUNT(*) FROM bloques_horarios
UNION ALL
SELECT 'funcionarios', COUNT(*) FROM funcionarios
UNION ALL
SELECT 'cursos', COUNT(*) FROM cursos;

-- ============================================================================
-- PASO 13: VERIFICAR INTEGRIDAD REFERENCIAL
-- ============================================================================

-- Estudiantes sin establecimiento
SELECT * FROM estudiantes WHERE id_establecimiento IS NULL;

-- Solicitudes sin establecimiento
SELECT * FROM solicitudes WHERE id_establecimiento IS NULL;

-- Usuarios sin establecimiento
SELECT * FROM usuarios WHERE id_establecimiento IS NULL AND rol != 'ADMIN';

-- Solicitudes con profesor no válido
SELECT * FROM solicitudes WHERE id_profesor IS NULL;

-- ============================================================================
-- PASO 14: BUSCAR DUPLICADOS
-- ============================================================================

-- Verificar emails duplicados
SELECT email, COUNT(*) as cantidad
FROM usuarios
GROUP BY email
HAVING COUNT(*) > 1;

-- Verificar estudiantes duplicados
SELECT id_estudiante, COUNT(*) as cantidad
FROM estudiantes
GROUP BY id_estudiante
HAVING COUNT(*) > 1;

-- Verificar RUTs duplicados en funcionarios
SELECT rut, COUNT(*) as cantidad
FROM funcionarios
GROUP BY rut
HAVING COUNT(*) > 1;

-- ============================================================================
-- PASO 15: LIMPIAR DATOS DUPLICADOS (SI EXISTEN)
-- ============================================================================

/*
-- ADVERTENCIA: Ejecutar solo si hay duplicados confirmados

-- Opción: Mantener primer registro, eliminar duplicados
DELETE FROM usuarios
WHERE id NOT IN (
  SELECT MIN(id)
  FROM usuarios
  GROUP BY email
);

-- Opción: Revisar manualmente antes de eliminar
SELECT * FROM usuarios WHERE email IN (
  SELECT email FROM usuarios GROUP BY email HAVING COUNT(*) > 1
);

*/

-- ============================================================================
-- PASO 16: ACTUALIZAR SECUENCIAS DE AUTO-INCREMENT
-- ============================================================================

-- Las UUID se generan automáticamente, pero si usas IDs numéricos:
-- SELECT setval('secuencia_tabla', (SELECT MAX(id) FROM tabla));

-- ============================================================================
-- PASO 17: RE-HABILITAR RLS Y TRIGGERS
-- ============================================================================

-- Habilitar triggers nuevamente
ALTER TABLE usuarios ENABLE TRIGGER all;
ALTER TABLE estudiantes ENABLE TRIGGER all;
ALTER TABLE solicitudes ENABLE TRIGGER all;
ALTER TABLE funcionarios ENABLE TRIGGER all;

-- Habilitar RLS nuevamente
ALTER TABLE establecimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE estudiantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitudes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bloques_horarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE motivos_justificacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PASO 18: VERIFICACIÓN FINAL
-- ============================================================================

-- Ver resumen de datos migrados
SELECT
  'Establecimientos' as tipo,
  COUNT(*) as registros,
  MIN(creado_en) as fecha_primera,
  MAX(creado_en) as fecha_ultima
FROM establecimientos
UNION ALL
SELECT 'Usuarios', COUNT(*), MIN(creado_en), MAX(creado_en) FROM usuarios
UNION ALL
SELECT 'Estudiantes', COUNT(*), MIN(creado_en), MAX(creado_en) FROM estudiantes
UNION ALL
SELECT 'Solicitudes', COUNT(*), MIN(creado_en), MAX(creado_en) FROM solicitudes
UNION ALL
SELECT 'Bloques Horarios', COUNT(*), MIN(creado_en), MAX(creado_en) FROM bloques_horarios;

-- ============================================================================
-- PASO 19: SCRIPT DE EXPORTACIÓN DESDE FIRESTORE
-- ============================================================================

/*

USO EN NODEJS:

// Instalar: npm install firebase-admin

const admin = require('firebase-admin');
const fs = require('fs');

admin.initializeApp({
  credential: admin.credential.cert(require('./serviceAccountKey.json'))
});

const db = admin.firestore();

async function exportarColeccion(nombreColeccion) {
  const snapshot = await db.collection(nombreColeccion).get();
  const datos = [];
  
  snapshot.forEach(doc => {
    datos.push({
      id: doc.id,
      ...doc.data(),
      // Convertir timestamps
      creado_en: doc.data().creado_en?.toDate().toISOString(),
      actualizado_en: doc.data().actualizado_en?.toDate().toISOString()
    });
  });
  
  fs.writeFileSync(`${nombreColeccion}.json`, JSON.stringify(datos, null, 2));
  console.log(`${nombreColeccion}.json exportado - ${datos.length} registros`);
}

// Ejecutar para cada colección
(async () => {
  const colecciones = ['establecimientos', 'usuarios', 'estudiantes', 'solicitudes', 'bloques_horarios'];
  
  for (const col of colecciones) {
    await exportarColeccion(col);
  }
  
  process.exit(0);
})();

*/

-- ============================================================================
-- PASO 20: RESUMEN Y CHECKLIST
-- ============================================================================

/*

CHECKLIST DE MIGRACIÓN:

ANTES DE IMPORTAR:
- [ ] Backup de Firestore realizado
- [ ] Backup de Supabase realizado
- [ ] RLS deshabilitado temporalmente
- [ ] Triggers deshabilitados temporalmente
- [ ] Datos exportados desde Firestore
- [ ] Archivos CSV preparados

DURANTE IMPORTACIÓN:
- [ ] Ejecutar PASO 4: Importar establecimientos
- [ ] Ejecutar PASO 5: Importar usuarios
- [ ] Ejecutar PASO 6: Importar bloques horarios
- [ ] Ejecutar PASO 7: Importar motivos
- [ ] Ejecutar PASO 8: Importar estudiantes
- [ ] Ejecutar PASO 9: Importar solicitudes
- [ ] Ejecutar PASO 10: Importar funcionarios
- [ ] Ejecutar PASO 11: Importar cursos

VALIDACIÓN:
- [ ] PASO 12: Contar registros
- [ ] PASO 13: Verificar integridad referencial
- [ ] PASO 14: Buscar duplicados
- [ ] PASO 15: Limpiar duplicados (si existen)

FINALIZAR:
- [ ] PASO 17: Re-habilitar RLS
- [ ] PASO 17: Re-habilitar triggers
- [ ] PASO 18: Verificación final

TESTING:
- [ ] Conectarse como PROFESOR: ver datos
- [ ] Conectarse como APODERADO: ver solo sus hijos
- [ ] Conectarse como INSPECTOR: ver solicitudes
- [ ] Conectarse como ADMIN: ver todo
- [ ] Verificar permisos RLS funcionan

*/

-- ============================================================================
-- FIN - FASE 3: MIGRACIÓN DE DATOS
-- ============================================================================
