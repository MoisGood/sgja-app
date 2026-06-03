// SCRIPT: Exportar datos de Firestore a JSON
// Uso: node scripts/export-firestore.js
// Requiere: npm install firebase-admin

import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Inicializar Firebase Admin con credenciales
const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Función para exportar una colección completa
async function exportCollection(collectionName) {
  try {
    const snapshot = await db.collection(collectionName).get();
    const data = [];
    
    snapshot.forEach(doc => {
      data.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return data;
  } catch (error) {
    console.log(`⚠️  ${collectionName}: ${error.message}`);
    return [];
  }
}

// Función principal de exportación
async function exportAllData() {
  console.log('🔄 Iniciando exportación de Firestore...\n');
  
  // Colecciones a exportar
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
  let totalDocuments = 0;
  
  // Exportar cada colección
  for (const collectionName of collections) {
    process.stdout.write(`📥 Exportando ${collectionName}...`);
    const data = await exportCollection(collectionName);
    allData[collectionName] = data;
    totalDocuments += data.length;
    console.log(` ✅ ${data.length} documentos`);
  }
  
  // Crear directorio si no existe
  const scriptsDir = path.join(__dirname);
  if (!fs.existsSync(scriptsDir)) {
    fs.mkdirSync(scriptsDir, { recursive: true });
  }
  
  // Guardar a archivo JSON
  const outputPath = path.join(scriptsDir, 'firebase-export.json');
  fs.writeFileSync(
    outputPath,
    JSON.stringify(allData, null, 2)
  );
  
  console.log('\n✅ Exportación completada!\n');
  console.log(`📊 Estadísticas:`);
  console.log(`   Total de documentos: ${totalDocuments}`);
  console.log(`   Archivo guardado: ${outputPath}`);
  
  // Resumen por colección
  console.log('\n📋 Detalle por colección:');
  Object.entries(allData).forEach(([col, docs]) => {
    if (docs.length > 0) {
      console.log(`   ✅ ${col}: ${docs.length} registros`);
    }
  });
  
  console.log('\n🎯 Próximo paso: node scripts/transform-firestore-to-sql.js\n');
  
  process.exit(0);
}

// Ejecutar exportación
exportAllData().catch(err => {
  console.error('\n❌ Error durante exportación:', err.message);
  process.exit(1);
});
