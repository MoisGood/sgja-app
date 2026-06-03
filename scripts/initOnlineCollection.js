#!/usr/bin/env node

// ============================================================
// SGJA – Script para inicializar colección online
// scripts/initOnlineCollection.js
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

    // Crear documento de ejemplo
    const docRef = db.collection('online').doc('admin-default');
    
    await docRef.set({
      id_usuario: 'admin-default',
      nombre_usuario: 'Administrador',
      email_usuario: 'admin@example.com',
      rol_usuario: 'ADMIN',
      estado: 'desconectado',
      timestamp_inicio: admin.firestore.FieldValue.serverTimestamp(),
      timestamp_fin: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log('✅ Colección "online" inicializada exitosamente');
    console.log('📋 Documento de ejemplo creado: admin-default');

    // Eliminar el documento de ejemplo (es solo para crear la colección)
    await docRef.delete();
    console.log('🗑️  Documento de ejemplo eliminado');

    console.log('\n✨ ¡La colección "online" está lista para usar!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al inicializar colección:', error);
    process.exit(1);
  }
}

initOnlineCollection();
