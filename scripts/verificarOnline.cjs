#!/usr/bin/env node

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Cargar credenciales de Firebase
const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));

// Inicializar Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function verificarColeccion() {
  try {
    console.log('🔍 Verificando colección "online"...\n');

    // Obtener todos los documentos
    const snapshot = await db.collection('online').get();

    console.log(`📊 Total de documentos encontrados: ${snapshot.size}\n`);

    if (snapshot.empty) {
      console.log('⚠️  La colección está vacía o no existe');
      console.log('Creando documentos de ejemplo...\n');

      // Crear documentos de ejemplo
      const ahora = admin.firestore.Timestamp.now();
      const hace1Hora = new admin.firestore.Timestamp(ahora.seconds - 3600, 0);

      const ejemplos = [
        {
          id: 'user-admin-001',
          data: {
            id_usuario: 'user-admin-001',
            nombre_usuario: 'Administrador Sistema',
            email_usuario: 'admin@sgja.cl',
            rol_usuario: 'ADMIN',
            estado: 'conectado',
            timestamp_inicio: ahora,
            timestamp_fin: null,
          }
        },
        {
          id: 'user-insp-001',
          data: {
            id_usuario: 'user-insp-001',
            nombre_usuario: 'Inspector Ejemplo',
            email_usuario: 'inspector@sgja.cl',
            rol_usuario: 'INSPECTOR',
            estado: 'desconectado',
            timestamp_inicio: hace1Hora,
            timestamp_fin: ahora,
          }
        },
        {
          id: 'user-prof-001',
          data: {
            id_usuario: 'user-prof-001',
            nombre_usuario: 'Profesor Ejemplo',
            email_usuario: 'profesor@sgja.cl',
            rol_usuario: 'PROFESOR',
            estado: 'conectado',
            timestamp_inicio: ahora,
            timestamp_fin: null,
          }
        }
      ];

      for (const doc of ejemplos) {
        await db.collection('online').doc(doc.id).set(doc.data);
        console.log(`✅ Creado: ${doc.id}`);
      }
      console.log('\n✨ Documentos de ejemplo creados exitosamente');
    } else {
      console.log('✅ Documentos encontrados:\n');
      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`📄 ID: ${doc.id}`);
        console.log(`   Usuario: ${data.nombre_usuario}`);
        console.log(`   Email: ${data.email_usuario}`);
        console.log(`   Estado: ${data.estado}`);
        console.log(`   timestamp_inicio: ${data.timestamp_inicio ? data.timestamp_inicio.toDate().toISOString() : 'null'}`);
        console.log(`   timestamp_fin: ${data.timestamp_fin ? data.timestamp_fin.toDate().toISOString() : 'null'}`);
        console.log('');
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verificarColeccion();
