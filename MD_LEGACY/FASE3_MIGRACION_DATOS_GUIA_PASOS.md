# FASE 3: MIGRACIÓN DE DATOS - GUÍA PASO A PASO

**Objetivo**: Exportar datos de Firestore → Supabase PostgreSQL

---

## RESUMEN DE PASOS

```
1️⃣ Exportar datos de Firestore (firebase-export.json)
2️⃣ Verificar datos exportados
3️⃣ Transformar formato JSON → SQL
4️⃣ Importar datos a Supabase
5️⃣ Validar integridad
6️⃣ Crear índices para performance
```

**Tiempo estimado:** 2-3 horas (depende de volumen de datos)

---

## PASO 1: EXPORTAR DATOS DE FIRESTORE

### 1.1 Verificar qué colecciones tienes

En Firestore Console:
```
1. Abre https://console.firebase.google.com
2. Selecciona "SGJA-Production" (tu proyecto)
3. Baja a Firestore Database → Database
4. Mira colecciones en left sidebar:
   ├─ usuarios
   ├─ estudiantes
   ├─ solicitudes
   ├─ bloques_horarios
   ├─ funcionarios
   └─ ...
```

**Anota qué colecciones tienes con datos.**

### 1.2 Exportar con Firebase Admin SDK (Recomendado - Automatizado)

Crear script Node.js para exportar:

**Archivo:** `scripts/export-firestore.js`

```javascript
// Requires: npm install firebase-admin

const admin = require('firebase-admin');
const fs = require('fs');

// Inicializar Firebase Admin
const serviceAccount = require('../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function exportCollection(collectionName) {
  const snapshot = await db.collection(collectionName).get();
  const data = [];
  
  snapshot.forEach(doc => {
    data.push({
      id: doc.id,
      ...doc.data()
    });
  });
  
  return data;
}

async function exportAllData() {
  const collections = [
    'usuarios',
    'estudiantes', 
    'solicitudes',
    'bloques_horarios',
    'motivos_justificacion',
    'establecimientos',
    'cursos',
    'funcionarios',
    'paginas',
    'permisos'
  ];

  const allData = {};
  
  for (const collectionName of collections) {
    console.log(`📥 Exportando ${collectionName}...`);
    try {
      allData[collectionName] = await exportCollection(collectionName);
      console.log(`✅ ${collectionName}: ${allData[collectionName].length} documentos`);
    } catch (error) {
      console.log(`⚠️ ${collectionName}: Colección no encontrada (ok si no existe todavía)`);
    }
  }
  
  // Guardar a archivo
  fs.writeFileSync(
    'scripts/firebase-export.json',
    JSON.stringify(allData, null, 2)
  );
  
  console.log('\n✅ Exportación completada: scripts/firebase-export.json');
  console.log('\nResumen:');
  Object.entries(allData).forEach(([col, docs]) => {
    console.log(`  ${col}: ${docs.length} registros`);
  });
}

exportAllData().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
```

**Ejecutar:**
```bash
cd c:\Users\Usuario\Desktop\Archivos\proyecto\Modulos-justificaciones\SGJA
node scripts/export-firestore.js
```

**Resultado esperado:**
```
✅ usuarios: 5 documentos
✅ estudiantes: 150 documentos
✅ solicitudes: 800 documentos
✅ bloques_horarios: 8 documentos
✅ funcionarios: 25 documentos
...
✅ Exportación completada: scripts/firebase-export.json
```

---

## PASO 2: VERIFICAR DATOS EXPORTADOS

### 2.1 Revisar archivo generado

```bash
# Ver tamaño del archivo
ls -lh scripts/firebase-export.json

# Ver primeros registros de usuarios
jq '.usuarios[0:2]' scripts/firebase-export.json
```

### 2.2 Contar registros por colección

```bash
# Ver resumen
jq 'to_entries | map({collection: .key, count: (.value | length)})' scripts/firebase-export.json
```

**Ejemplo de salida:**
```json
[
  { "collection": "usuarios", "count": 5 },
  { "collection": "estudiantes", "count": 150 },
  { "collection": "solicitudes", "count": 800 },
  { "collection": "bloques_horarios", "count": 8 },
  { "collection": "funcionarios", "count": 25 }
]
```

---

## PASO 3: TRANSFORMAR FORMATO JSON → SQL

Firebase guarda fechas como objetos especiales `Timestamp`. PostgreSQL espera ISO dates.

### 3.1 Crear script de transformación

**Archivo:** `scripts/transform-firestore-to-sql.js`

```javascript
const fs = require('fs');

// Cargar datos exportados
const rawData = JSON.parse(fs.readFileSync('scripts/firebase-export.json', 'utf8'));

// Funciones helper para transformación
function transformTimestamp(timestamp) {
  if (!timestamp) return 'NULL';
  
  // Firestore timestamp: {seconds: 1234567890, nanoseconds: 0}
  if (timestamp.seconds) {
    const date = new Date(timestamp.seconds * 1000);
    return `'${date.toISOString()}'`;
  }
  
  // ISO string
  if (typeof timestamp === 'string') {
    return `'${timestamp}'`;
  }
  
  return 'NULL';
}

function escapeSQL(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
  return 'NULL';
}

// Transformar colecciones
const sqlStatements = [];

// 1. USUARIOS
if (rawData.usuarios && rawData.usuarios.length > 0) {
  rawData.usuarios.forEach(user => {
    const sql = `
INSERT INTO usuarios (id, uid, email, nombre_completo, rol, id_establecimiento, activo, creado_en, actualizado_en)
VALUES (
  '${user.id}',
  ${escapeSQL(user.uid)},
  ${escapeSQL(user.email)},
  ${escapeSQL(user.nombre_completo)},
  ${escapeSQL(user.rol || 'PROFESOR')},
  ${user.id_establecimiento ? `'${user.id_establecimiento}'` : 'NULL'},
  ${user.activo !== false ? 'true' : 'false'},
  ${transformTimestamp(user.creado_en)},
  ${transformTimestamp(user.actualizado_en)}
) ON CONFLICT (id) DO NOTHING;
    `.trim();
    sqlStatements.push(sql);
  });
}

// 2. ESTUDIANTES
if (rawData.estudiantes && rawData.estudiantes.length > 0) {
  rawData.estudiantes.forEach(est => {
    const sql = `
INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id, creado_en, actualizado_en)
VALUES (
  '${est.id}',
  ${escapeSQL(est.id_estudiante)},
  ${escapeSQL(est.nombre_completo)},
  ${escapeSQL(est.email)},
  ${escapeSQL(est.curso)},
  ${est.id_establecimiento ? `'${est.id_establecimiento}'` : 'NULL'},
  ${est.activo !== false ? 'true' : 'false'},
  ${est.apoderado_id ? `'${est.apoderado_id}'` : 'NULL'},
  ${transformTimestamp(est.creado_en)},
  ${transformTimestamp(est.actualizado_en)}
) ON CONFLICT (id) DO NOTHING;
    `.trim();
    sqlStatements.push(sql);
  });
}

// 3. SOLICITUDES (Ausencias/Justificativos)
if (rawData.solicitudes && rawData.solicitudes.length > 0) {
  rawData.solicitudes.forEach(sol => {
    const sql = `
INSERT INTO solicitudes (id, id_solicitud, id_estudiante, id_profesor, id_profesor_nombre, tipo, estado, fecha, hora, id_bloque, curso, id_establecimiento, motivo_codigo, motivo_descripcion, observaciones, respaldo_recibido, creado_en, actualizado_en)
VALUES (
  '${sol.id}',
  ${escapeSQL(sol.id_solicitud)},
  ${escapeSQL(sol.id_estudiante)},
  ${sol.id_profesor ? `'${sol.id_profesor}'` : 'NULL'},
  ${escapeSQL(sol.id_profesor_nombre)},
  ${escapeSQL(sol.tipo)},
  ${escapeSQL(sol.estado)},
  ${sol.fecha ? `'${sol.fecha}'` : 'NULL'},
  ${escapeSQL(sol.hora)},
  ${escapeSQL(sol.id_bloque)},
  ${escapeSQL(sol.curso)},
  ${sol.id_establecimiento ? `'${sol.id_establecimiento}'` : 'NULL'},
  ${escapeSQL(sol.motivo_codigo)},
  ${escapeSQL(sol.motivo_descripcion)},
  ${escapeSQL(sol.observaciones)},
  ${sol.respaldo_recibido ? 'true' : 'false'},
  ${transformTimestamp(sol.creado_en)},
  ${transformTimestamp(sol.actualizado_en)}
) ON CONFLICT (id) DO NOTHING;
    `.trim();
    sqlStatements.push(sql);
  });
}

// 4. BLOQUES HORARIOS
if (rawData.bloques_horarios && rawData.bloques_horarios.length > 0) {
  rawData.bloques_horarios.forEach(bloque => {
    const sql = `
INSERT INTO bloques_horarios (id, id_bloque, nombre_bloque, hora_inicio, hora_fin, orden, id_establecimiento, activo, creado_en)
VALUES (
  '${bloque.id}',
  ${escapeSQL(bloque.id_bloque)},
  ${escapeSQL(bloque.nombre_bloque)},
  ${escapeSQL(bloque.hora_inicio)},
  ${escapeSQL(bloque.hora_fin)},
  ${bloque.orden || 0},
  ${bloque.id_establecimiento ? `'${bloque.id_establecimiento}'` : 'NULL'},
  ${bloque.activo !== false ? 'true' : 'false'},
  ${transformTimestamp(bloque.creado_en)}
) ON CONFLICT (id) DO NOTHING;
    `.trim();
    sqlStatements.push(sql);
  });
}

// 5. FUNCIONARIOS (ver módulo Mantenedor)
if (rawData.funcionarios && rawData.funcionarios.length > 0) {
  rawData.funcionarios.forEach(func => {
    const sql = `
INSERT INTO funcionarios (rut, rut_formateado, nombre_completo, fecha_nacimiento, domicilio, comuna, celular, correo_personal, correo_institucional, titulo_profesional, universidad, ano_titulacion, fecha_ingreso, fecha_termino, horas_contrato, vigente, usuario_registrado_sistema, creado_en, actualizado_en)
VALUES (
  ${escapeSQL(func.rut)},
  ${escapeSQL(func.rut_formateado)},
  ${escapeSQL(func.nombre_completo)},
  ${func.fecha_nacimiento ? `'${func.fecha_nacimiento}'` : 'NULL'},
  ${escapeSQL(func.domicilio)},
  ${escapeSQL(func.comuna)},
  ${escapeSQL(func.celular)},
  ${escapeSQL(func.correo_personal)},
  ${escapeSQL(func.correo_institucional)},
  ${escapeSQL(func.titulo_profesional)},
  ${escapeSQL(func.universidad)},
  ${func.ano_titulacion || 'NULL'},
  ${func.fecha_ingreso ? `'${func.fecha_ingreso}'` : 'NULL'},
  ${func.fecha_termino ? `'${func.fecha_termino}'` : 'NULL'},
  ${func.horas_contrato || 'NULL'},
  ${func.vigente !== false ? 'true' : 'false'},
  ${func.usuario_registrado_sistema ? 'true' : 'false'},
  ${transformTimestamp(func.creado_en)},
  ${transformTimestamp(func.actualizado_en)}
) ON CONFLICT (rut) DO NOTHING;
    `.trim();
    sqlStatements.push(sql);
  });
}

// Guardar SQL
const finalSQL = `
-- AUTO-GENERADO: Migración Firestore → Supabase
-- Fecha: ${new Date().toISOString()}
-- Total de inserts: ${sqlStatements.length}

BEGIN TRANSACTION;

${sqlStatements.join('\n\n')}

COMMIT;
`.trim();

fs.writeFileSync('scripts/firebase-to-supabase.sql', finalSQL);

console.log('✅ Transformación completada');
console.log(`📊 Total de statements: ${sqlStatements.length}`);
console.log('📄 Archivo generado: scripts/firebase-to-supabase.sql');
```

**Ejecutar:**
```bash
node scripts/transform-firestore-to-sql.js
```

**Resultado:**
```
✅ Transformación completada
📊 Total de statements: 988
📄 Archivo generado: scripts/firebase-to-supabase.sql
```

---

## PASO 4: IMPORTAR DATOS A SUPABASE

### 4.1 Ir a Supabase SQL Editor

```
1. Abre Supabase Dashboard
2. Selecciona proyecto
3. SQL Editor (left sidebar)
```

### 4.2 Deshabilitar RLS durante importación (para performance)

```sql
-- TEMPORALMENTE DESABILITAR RLS
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE estudiantes DISABLE ROW LEVEL SECURITY;
ALTER TABLE solicitudes DISABLE ROW LEVEL SECURITY;
ALTER TABLE bloques_horarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE funcionarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE establecimientos DISABLE ROW LEVEL SECURITY;
```

### 4.3 Copiar el SQL generado

```
1. Abre: scripts/firebase-to-supabase.sql
2. Copy TODO el contenido
3. En Supabase SQL Editor, pega
4. Click "Execute" (▶️ azul)
```

**Espera a que termine (puede tomar 1-5 min según volumen)**

### 4.4 Re-habilitar RLS después de importar

```sql
-- RE-HABILITAR RLS
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE estudiantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitudes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bloques_horarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE establecimientos ENABLE ROW LEVEL SECURITY;
```

---

## PASO 5: VALIDAR INTEGRIDAD DE DATOS

### 5.1 Contar registros por tabla

```sql
-- Comparar con Firestore export
SELECT 
  'usuarios' as tabla, COUNT(*) as cantidad FROM usuarios
UNION ALL
SELECT 'estudiantes', COUNT(*) FROM estudiantes
UNION ALL
SELECT 'solicitudes', COUNT(*) FROM solicitudes
UNION ALL
SELECT 'bloques_horarios', COUNT(*) FROM bloques_horarios
UNION ALL
SELECT 'funcionarios', COUNT(*) FROM funcionarios
ORDER BY tabla;
```

**Compara los números con el resumen de paso 2.**

### 5.2 Verificar integridad referencial

```sql
-- Estudiantes sin establecimiento válido
SELECT id_estudiante, nombre_completo 
FROM estudiantes 
WHERE id_establecimiento IS NOT NULL 
  AND id_establecimiento NOT IN (SELECT id FROM establecimientos);

-- Solicitudes sin estudiante existente
SELECT id_solicitud, id_estudiante 
FROM solicitudes 
WHERE id_estudiante IS NOT NULL 
  AND id_estudiante NOT IN (SELECT id_estudiante FROM estudiantes);
```

**Si hay resultados: ⚠️ Datos huérfanos (pueden necesitar limpieza)**

### 5.3 Verificar timestamps

```sql
-- Ver registros más recientes
SELECT email, creado_en, actualizado_en 
FROM usuarios 
ORDER BY creado_en DESC 
LIMIT 5;
```

---

## PASO 6: CREAR ÍNDICES PARA PERFORMANCE

```sql
-- Índices para queries rápidas
CREATE INDEX idx_estudiantes_curso ON estudiantes(curso);
CREATE INDEX idx_solicitudes_fecha ON solicitudes(fecha);
CREATE INDEX idx_solicitudes_id_estudiante ON solicitudes(id_estudiante);
CREATE INDEX idx_solicitudes_tipo ON solicitudes(tipo);
CREATE INDEX idx_bloques_orden ON bloques_horarios(orden);

-- Índices para RLS (búsqueda por establecimiento)
CREATE INDEX idx_usuarios_establecimiento ON usuarios(id_establecimiento);
CREATE INDEX idx_estudiantes_establecimiento ON estudiantes(id_establecimiento);
CREATE INDEX idx_solicitudes_establecimiento ON solicitudes(id_establecimiento);

-- Índices compuestos para queries complejas
CREATE INDEX idx_solicitudes_estudiante_fecha ON solicitudes(id_estudiante, fecha);
CREATE INDEX idx_solicitudes_bloque_tipo ON solicitudes(id_bloque, tipo);

-- Ver índices creados
SELECT * FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename;
```

---

## ✅ CHECKLIST FASE 3 COMPLETADA

```
[x] Exportar datos Firestore → JSON
[x] Verificar datos exportados
[x] Transformar JSON → SQL
[x] Importar a Supabase
[x] Validar integridad
[x] Crear índices para performance
```

---

## 🚨 TROUBLESHOOTING

### Error: "constraint violation" al importar

**Causa:** Datos duplicados o referencias inválidas

**Solución:**
```sql
-- Ver qué falla
SELECT * FROM usuarios WHERE email = 'email@duplicado.com';

-- Limpiar si es necesario (cuidado!)
DELETE FROM usuarios WHERE id = 'id-duplicado';
```

### Error: "Foreign key violation"

**Causa:** Falta un establecimiento o usuario padre

**Solución:**
```sql
-- Crear faltantes antes de importar
INSERT INTO establecimientos (id, nombre, codigo)
VALUES ('missing-id', 'Default School', 'DEFAULT');
```

### Rendimiento lento en importación

**Si el SQL tarda >10 min:**
1. Ejecutar en chunks (primero usuarios, luego estudiantes, etc.)
2. Cambiar a batch import con menos filas por batch
3. Disable triggers temporalmente (si existen)

---

## SIGUIENTE PASO

Una vez que hayas completado FASE 3:

### ✅ FASE 3 COMPLETADA
### ⏳ FASE 4: DESARROLLO (supabase.ts)

**Confirma cuando termine la importación.**

