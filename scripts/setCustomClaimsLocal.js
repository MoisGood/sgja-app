#!/usr/bin/env node

/**
 * Script: Establecer Custom Claims Localmente
 * Ejecutar: node scripts/setCustomClaimsLocal.js
 * 
 * Este script:
 * 1. Lee todos los usuarios de Firestore
 * 2. Establece Custom Claims en Firebase Auth usando Admin SDK
 * 3. No requiere Cloud Functions ni plan Blaze
 */

const admin = require('firebase-admin');
const path = require('path');

// Inicializar Firebase Admin
const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://sgja-default-rtdb.firebaseio.com',
});

const db = admin.firestore();
const auth = admin.auth();

/**
 * Establecer Custom Claims para un usuario específico
 */
async function setCustomClaimsForUser(uid, usuarioData) {
  try {
    const customClaims = {
      rol: usuarioData.rol || null,
      id_establecimiento: usuarioData.id_establecimiento || null,
      nombre: usuarioData.nombre_completo || usuarioData.nombre || null,
      email: usuarioData.email || null,
      activo: usuarioData.activo !== false,
    };

    await auth.setCustomUserClaims(uid, customClaims);
    console.log(`✅ ${uid}`);
    console.log(`   Rol: ${customClaims.rol}`);
    console.log(`   Est: ${customClaims.id_establecimiento}`);
    console.log(`   Activo: ${customClaims.activo}\n`);

    return customClaims;
  } catch (error) {
    console.error(`❌ Error con ${uid}:`, error.message);
    throw error;
  }
}

/**
 * Establecer Custom Claims para todos los usuarios
 */
async function setAllCustomClaims() {
  console.log('\n🔄 Iniciando configuración de Custom Claims...\n');
  console.log('Esta operación es SEGURA y puede ejecutarse múltiples veces.\n');

  try {
    // Obtener todos los usuarios de Firestore
    const usuariosSnapshot = await db.collection('usuarios').get();
    
    console.log(`📊 Se encontraron ${usuariosSnapshot.docs.length} usuarios\n`);
    console.log('═══════════════════════════════════════\n');

    let sincronizados = 0;
    let errores = 0;
    const resultados = [];

    for (const doc of usuariosSnapshot.docs) {
      const uid = doc.id;
      const usuarioData = doc.data();

      try {
        const claims = await setCustomClaimsForUser(uid, usuarioData);
        sincronizados++;
        resultados.push({
          uid,
          rol: claims.rol,
          id_establecimiento: claims.id_establecimiento,
          status: 'OK'
        });
      } catch (error) {
        errores++;
        resultados.push({
          uid,
          status: 'ERROR',
          error: error.message
        });
      }
    }

    // Resumen
    console.log('═══════════════════════════════════════');
    console.log(`\n📊 RESUMEN:\n`);
    console.log(`✅ Configurados: ${sincronizados}`);
    console.log(`❌ Errores: ${errores}`);
    console.log(`📊 Total: ${usuariosSnapshot.docs.length}\n`);

    // Detalles
    console.log('📋 DETALLES:\n');
    resultados.forEach(r => {
      if (r.status === 'OK') {
        console.log(`✅ ${r.uid}`);
        console.log(`   Rol: ${r.rol || 'N/A'}`);
        console.log(`   Est: ${r.id_establecimiento || 'N/A'}`);
      } else {
        console.log(`❌ ${r.uid}`);
        console.log(`   Error: ${r.error}`);
      }
      console.log();
    });

    if (errores === 0) {
      console.log('🎉 ¡Configuración completada exitosamente!\n');
      console.log('Los Custom Claims están listos. Los usuarios obtienen');
      console.log('el nuevo token la próxima vez que inicien sesión.\n');
    } else {
      console.log('⚠️ Configuración completada con errores\n');
    }

    process.exit(errores > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  }
}

// Ejecutar
setAllCustomClaims();
