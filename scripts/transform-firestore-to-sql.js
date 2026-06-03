// SCRIPT: Transformar datos Firestore JSON → SQL para Supabase PostgreSQL
// Uso: node scripts/transform-firestore-to-sql.js
// Requiere: que exista scripts/firebase-export.json

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔄 Iniciando transformación JSON → SQL...\n');

// Cargar datos exportados de Firestore
const exportPath = path.join(__dirname, 'firebase-export.json');

if (!fs.existsSync(exportPath)) {
  console.error('❌ Error: No existe firebase-export.json');
  process.exit(1);
}

const rawData = JSON.parse(fs.readFileSync(exportPath, 'utf8'));

// MAPEO DE IDs: Firestore → UUID
const idMapping = {};

/**
 * Convierte Firestore ID a UUID válido usando MD5
 */
function firestoreIdToUUID(firestoreId) {
  if (!firestoreId) return null;
  
  // Si ya está mapeado, retornar el UUID existente
  if (idMapping[firestoreId]) return idMapping[firestoreId];
  
  // Generar UUID basado en hash MD5
  const hash = crypto.createHash('md5').update(firestoreId).digest('hex');
  const uuid = `${hash.substring(0, 8)}-${hash.substring(8, 12)}-5${hash.substring(13, 16)}-a${hash.substring(17, 20)}-${hash.substring(20, 32)}`;
  
  idMapping[firestoreId] = uuid;
  return uuid;
}

/**
 * Resuelve referencias a UUIDs
 */
function resolveRef(firestoreId) {
  if (!firestoreId) return 'NULL';
  const uuid = firestoreIdToUUID(firestoreId);
  return `'${uuid}'`;
}

/**
 * Convierte timestamps de Firestore
 */
function transformTimestamp(timestamp) {
  if (!timestamp) return 'NULL';
  
  if (typeof timestamp === 'object' && timestamp.seconds) {
    const date = new Date(timestamp.seconds * 1000);
    return `'${date.toISOString()}'`;
  }
  
  if (typeof timestamp === 'string') {
    return `'${timestamp}'`;
  }
  
  return 'NULL';
}

/**
 * Escapa SQL
 */
function escapeSQL(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
  return 'NULL';
}

// TRANSFORMAR COLECCIONES
const sqlStatements = [];

console.log('🔄 Transformando colecciones...\n');

// 1. ESTABLECIMIENTOS (primero, para referencias)
console.log('📝 establecimientos...');
if (rawData.establecimientos && rawData.establecimientos.length > 0) {
  rawData.establecimientos.forEach((est, idx) => {
    const uuid = firestoreIdToUUID(est.id);
    // Generar código si no existe
    const codigo = est.codigo || `EST-${String(idx + 1).padStart(3, '0')}`;
    const sql = `INSERT INTO establecimientos (id, nombre, codigo, region, activo, creado_en)
VALUES ('${uuid}', ${escapeSQL(est.nombre)}, ${escapeSQL(codigo)}, ${escapeSQL(est.region)}, ${est.activo !== false ? 'true' : 'false'}, ${transformTimestamp(est.creado_en)}) ON CONFLICT (id) DO NOTHING;`;
    sqlStatements.push(sql);
  });
  console.log(`   ✅ ${rawData.establecimientos.length} registros\n`);
}

// 2. USUARIOS
console.log('📝 usuarios...');
if (rawData.usuarios && rawData.usuarios.length > 0) {
  rawData.usuarios.forEach(user => {
    const uuid = firestoreIdToUUID(user.id);
    // Generar uid si no existe (basado en el ID de Firestore)
    const uid = user.uid || firestoreIdToUUID(user.id);
    const sql = `INSERT INTO usuarios (id, uid, email, nombre_completo, rol, id_establecimiento, activo, creado_en, actualizado_en)
VALUES ('${uuid}', ${escapeSQL(uid)}, ${escapeSQL(user.email)}, ${escapeSQL(user.nombre_completo)}, ${escapeSQL(user.rol || 'PROFESOR')}, ${user.id_establecimiento ? resolveRef(user.id_establecimiento) : 'NULL'}, ${user.activo !== false ? 'true' : 'false'}, ${transformTimestamp(user.creado_en)}, ${transformTimestamp(user.actualizado_en)}) ON CONFLICT (id) DO NOTHING;`;
    sqlStatements.push(sql);
  });
  console.log(`   ✅ ${rawData.usuarios.length} registros\n`);
}

// 3. ESTUDIANTES
console.log('📝 estudiantes...');
if (rawData.estudiantes && rawData.estudiantes.length > 0) {
  rawData.estudiantes.forEach((est, idx) => {
    const uuid = firestoreIdToUUID(est.id);
    // Generar id_estudiante si no existe (usar Firestore ID o generar uno)
    const idEstudiante = est.id_estudiante || est.id || `EST-STU-${String(idx + 1).padStart(5, '0')}`;
    const sql = `INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id, creado_en, actualizado_en)
VALUES ('${uuid}', ${escapeSQL(idEstudiante)}, ${escapeSQL(est.nombre_completo)}, ${escapeSQL(est.email)}, ${escapeSQL(est.curso)}, ${est.id_establecimiento ? resolveRef(est.id_establecimiento) : 'NULL'}, ${est.activo !== false ? 'true' : 'false'}, ${est.apoderado_id ? resolveRef(est.apoderado_id) : 'NULL'}, ${transformTimestamp(est.creado_en)}, ${transformTimestamp(est.actualizado_en)}) ON CONFLICT (id) DO NOTHING;`;
    sqlStatements.push(sql);
  });
  console.log(`   ✅ ${rawData.estudiantes.length} registros\n`);
}

// 4. SOLICITUDES
console.log('📝 solicitudes...');
if (rawData.solicitudes && rawData.solicitudes.length > 0) {
  rawData.solicitudes.forEach(sol => {
    const uuid = firestoreIdToUUID(sol.id);
    const sql = `INSERT INTO solicitudes (id, id_solicitud, id_estudiante, id_profesor, id_profesor_nombre, tipo, estado, fecha, hora, id_bloque, curso, id_establecimiento, motivo_codigo, motivo_descripcion, observaciones, respaldo_recibido, creado_en, actualizado_en)
VALUES ('${uuid}', ${escapeSQL(sol.id_solicitud)}, ${escapeSQL(sol.id_estudiante)}, ${sol.id_profesor ? resolveRef(sol.id_profesor) : 'NULL'}, ${escapeSQL(sol.id_profesor_nombre)}, ${escapeSQL(sol.tipo)}, ${escapeSQL(sol.estado)}, ${sol.fecha ? escapeSQL(sol.fecha) : 'NULL'}, ${escapeSQL(sol.hora)}, ${escapeSQL(sol.id_bloque)}, ${escapeSQL(sol.curso)}, ${sol.id_establecimiento ? resolveRef(sol.id_establecimiento) : 'NULL'}, ${escapeSQL(sol.motivo_codigo)}, ${escapeSQL(sol.motivo_descripcion)}, ${escapeSQL(sol.observaciones)}, ${sol.respaldo_recibido ? 'true' : 'false'}, ${transformTimestamp(sol.creado_en)}, ${transformTimestamp(sol.actualizado_en)}) ON CONFLICT (id) DO NOTHING;`;
    sqlStatements.push(sql);
  });
  console.log(`   ✅ ${rawData.solicitudes.length} registros\n`);
}

// 5. BLOQUES HORARIOS
console.log('📝 bloques_horarios...');
if (rawData.bloques_horarios && rawData.bloques_horarios.length > 0) {
  rawData.bloques_horarios.forEach(bloque => {
    const uuid = firestoreIdToUUID(bloque.id);
    const sql = `INSERT INTO bloques_horarios (id, id_bloque, nombre_bloque, hora_inicio, hora_fin, orden, id_establecimiento, activo, creado_en)
VALUES ('${uuid}', ${escapeSQL(bloque.id_bloque)}, ${escapeSQL(bloque.nombre_bloque)}, ${escapeSQL(bloque.hora_inicio)}, ${escapeSQL(bloque.hora_fin)}, ${bloque.orden || 0}, ${bloque.id_establecimiento ? resolveRef(bloque.id_establecimiento) : 'NULL'}, ${bloque.activo !== false ? 'true' : 'false'}, ${transformTimestamp(bloque.creado_en)}) ON CONFLICT (id) DO NOTHING;`;
    sqlStatements.push(sql);
  });
  console.log(`   ✅ ${rawData.bloques_horarios.length} registros\n`);
}

// 6. CURSOS
console.log('📝 cursos...');
if (rawData.cursos && rawData.cursos.length > 0) {
  rawData.cursos.forEach(curso => {
    const uuid = firestoreIdToUUID(curso.id);
    const sql = `INSERT INTO cursos (id, nombre, grado, nombre_corto, id_establecimiento, activo, creado_en)
VALUES ('${uuid}', ${escapeSQL(curso.nombre)}, ${escapeSQL(curso.grado)}, ${escapeSQL(curso.nombre_corto)}, ${curso.id_establecimiento ? resolveRef(curso.id_establecimiento) : 'NULL'}, ${curso.activo !== false ? 'true' : 'false'}, ${transformTimestamp(curso.creado_en)}) ON CONFLICT (id) DO NOTHING;`;
    sqlStatements.push(sql);
  });
  console.log(`   ✅ ${rawData.cursos.length} registros\n`);
}

// 7. FUNCIONARIOS
console.log('📝 funcionarios...');
if (rawData.funcionarios && rawData.funcionarios.length > 0) {
  rawData.funcionarios.forEach(func => {
    const sql = `INSERT INTO funcionarios (rut, rut_formateado, nombre_completo, fecha_nacimiento, domicilio, comuna, celular, correo_personal, correo_institucional, titulo_profesional, universidad, ano_titulacion, fecha_ingreso, fecha_termino, horas_contrato, vigente, usuario_registrado_sistema, creado_en, actualizado_en)
VALUES (${escapeSQL(func.rut)}, ${escapeSQL(func.rut_formateado)}, ${escapeSQL(func.nombre_completo)}, ${func.fecha_nacimiento ? escapeSQL(func.fecha_nacimiento) : 'NULL'}, ${escapeSQL(func.domicilio)}, ${escapeSQL(func.comuna)}, ${escapeSQL(func.celular)}, ${escapeSQL(func.correo_personal)}, ${escapeSQL(func.correo_institucional)}, ${escapeSQL(func.titulo_profesional)}, ${escapeSQL(func.universidad)}, ${func.ano_titulacion || 'NULL'}, ${func.fecha_ingreso ? escapeSQL(func.fecha_ingreso) : 'NULL'}, ${func.fecha_termino ? escapeSQL(func.fecha_termino) : 'NULL'}, ${func.horas_contrato || 'NULL'}, ${func.vigente !== false ? 'true' : 'false'}, ${func.usuario_registrado_sistema ? 'true' : 'false'}, ${transformTimestamp(func.creado_en)}, ${transformTimestamp(func.actualizado_en)}) ON CONFLICT (rut) DO NOTHING;`;
    sqlStatements.push(sql);
  });
  console.log(`   ✅ ${rawData.funcionarios.length} registros\n`);
}

// 8. MOTIVOS JUSTIFICACIÓN
console.log('📝 motivos_justificacion...');
if (rawData.motivos_justificacion && rawData.motivos_justificacion.length > 0) {
  rawData.motivos_justificacion.forEach(motivo => {
    const uuid = firestoreIdToUUID(motivo.id);
    const sql = `INSERT INTO motivos_justificacion (id, codigo, descripcion, activo, creado_en)
VALUES ('${uuid}', ${escapeSQL(motivo.codigo)}, ${escapeSQL(motivo.descripcion)}, ${motivo.activo !== false ? 'true' : 'false'}, ${transformTimestamp(motivo.creado_en)}) ON CONFLICT (id) DO NOTHING;`;
    sqlStatements.push(sql);
  });
  console.log(`   ✅ ${rawData.motivos_justificacion.length} registros\n`);
}

// 9. PÁGINAS
console.log('📝 paginas...');
if (rawData.paginas && rawData.paginas.length > 0) {
  rawData.paginas.forEach(pag => {
    const uuid = firestoreIdToUUID(pag.id);
    const sql = `INSERT INTO paginas (id, titulo, contenido, slug, activo, creado_en)
VALUES ('${uuid}', ${escapeSQL(pag.titulo)}, ${escapeSQL(pag.contenido)}, ${escapeSQL(pag.slug)}, ${pag.activo !== false ? 'true' : 'false'}, ${transformTimestamp(pag.creado_en)}) ON CONFLICT (id) DO NOTHING;`;
    sqlStatements.push(sql);
  });
  console.log(`   ✅ ${rawData.paginas.length} registros\n`);
}

// 10. PERMISOS
console.log('📝 permisos...');
if (rawData.permisos && rawData.permisos.length > 0) {
  rawData.permisos.forEach(perm => {
    const uuid = firestoreIdToUUID(perm.id);
    const sql = `INSERT INTO permisos (id, id_usuario, id_establecimiento, rol, activo, creado_en)
VALUES ('${uuid}', ${perm.id_usuario ? resolveRef(perm.id_usuario) : 'NULL'}, ${perm.id_establecimiento ? resolveRef(perm.id_establecimiento) : 'NULL'}, ${escapeSQL(perm.rol)}, ${perm.activo !== false ? 'true' : 'false'}, ${transformTimestamp(perm.creado_en)}) ON CONFLICT (id) DO NOTHING;`;
    sqlStatements.push(sql);
  });
  console.log(`   ✅ ${rawData.permisos.length} registros\n`);
}

// GENERAR SQL FINAL
const finalSQL = `-- ========================================================================
-- AUTO-GENERADO: Migración Firestore → Supabase PostgreSQL (v2 - UUIDs Válidos)
-- Fecha: ${new Date().toISOString()}
-- Total de INSERT statements: ${sqlStatements.length}
-- ========================================================================

-- ⚠️  ANTES DE EJECUTAR:
-- 1. Desabilitar RLS temporalmente (mejor performance)
-- 2. Asegúrat que las tablas existen en Supabase
-- 3. Verifica que las credenciales de Supabase sean correctas

-- INICIAR TRANSACCIÓN
BEGIN TRANSACTION;

-- INSERTAR DATOS
${sqlStatements.join('\n\n')}

-- CONFIRMAR TRANSACCIÓN
COMMIT;

-- 🎯 POST-IMPORTACIÓN:
-- 1. Re-habilitar RLS
-- 2. Crear índices (ver FASE3_MIGRACION_DATOS_GUIA_PASOS.md)
-- 3. Validar integridad de datos
`;

// Guardar archivo SQL
const outputPath = path.join(__dirname, 'firebase-to-supabase.sql');
fs.writeFileSync(outputPath, finalSQL);

console.log('✅ Transformación completada!\n');
console.log(`📊 Estadísticas:`);
console.log(`   Total de INSERT statements: ${sqlStatements.length}`);
console.log(`   Tamaño del archivo SQL: ${(finalSQL.length / 1024).toFixed(2)} KB`);
console.log(`   UUIDs generados: ${Object.keys(idMapping).length}`);
console.log(`   Archivo guardado: ${outputPath}\n`);

console.log('📋 Colecciones transformadas:');
Object.entries(rawData).forEach(([col, docs]) => {
  if (docs.length > 0) {
    console.log(`   ✅ ${col}: ${docs.length} registros`);
  }
});

console.log('\n🎯 Próximo paso:');
console.log('   1. Abre Supabase Dashboard → SQL Editor');
console.log('   2. Copia TODO el contenido de: firebase-to-supabase.sql');
console.log('   3. Ejecuta el script');
console.log('\n✨ ¡Listo para importar!\n');

process.exit(0);
