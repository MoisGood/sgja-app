#!/usr/bin/env node

// ============================================================
// SGJA – Script para inicializar colección online
// scripts/initOnlineCollection.cjs
// ============================================================

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

async function initOnlineCollection() {
  try {
    console.log('🔄 Inicializando colección "online"...');

    // Crear varios documentos de ejemplo
    const ahora = admin.firestore.Timestamp.now();
    const hace1Hora = new admin.firestore.Timestamp(ahora.seconds - 3600, 0);

    const ejemplosUsuarios = [
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

    // Crear documentos
    for (const usuario of ejemplosUsuarios) {
      await db.collection('online').doc(usuario.id).set(usuario.data);
      console.log(`✅ Documento creado: ${usuario.id} (estado: ${usuario.data.estado})`);
    }

    console.log('\n✨ ¡La colección "online" está lista con documentos de ejemplo!');
    console.log(`📊 Total de documentos creados: ${ejemplosUsuarios.length}`);
    console.log('   - 2 conectados (círculo verde)');
    console.log('   - 1 desconectado (círculo gris)');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al inicializar colección:', error);
    process.exit(1);
  }
}

initOnlineCollection();
