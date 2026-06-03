import admin from 'firebase-admin';
import * as fs from 'fs';

// ============================================================
// Script para crear motivos de justificación
// ============================================================

const serviceAccount = JSON.parse(
  fs.readFileSync('./serviceAccountKey.json', 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

const db = admin.firestore();

async function seedMotivos() {
  try {
    console.log('🌱 Buscando establecimiento del usuario...');

    // Buscar el usuario soportetipresente@gmail.com
    const usuariosSnapshot = await db
      .collection('usuarios')
      .where('email', '==', 'soportetipresente@gmail.com')
      .limit(1)
      .get();

    if (usuariosSnapshot.empty) {
      console.error('❌ Usuario no encontrado: soportetipresente@gmail.com');
      process.exit(1);
    }

    const usuario = usuariosSnapshot.docs[0].data();
    const idEstablecimiento = usuario.id_establecimiento;
    console.log('✅ Establecimiento encontrado:', idEstablecimiento);

    // Limpiar motivos anteriores
    console.log('🗑️ Limpiando motivos anteriores...');
    const motivosSnapshot = await db
      .collection('motivos_justificacion')
      .where('id_establecimiento', '==', idEstablecimiento)
      .get();

    for (const doc of motivosSnapshot.docs) {
      await doc.ref.delete();
    }

    console.log('✅ Motivos limpiados');

    // ────────────────────────────────────────────────────────────
    // Crear motivos de justificación
    // ────────────────────────────────────────────────────────────
    const motivos = [
      {
        id_motivo: 'mot001',
        id_establecimiento: idEstablecimiento,
        descripcion: 'Enfermedad',
        requiere_respaldo: true,
        orden: 1,
        activo: true,
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
      },
      {
        id_motivo: 'mot002',
        id_establecimiento: idEstablecimiento,
        descripcion: 'Cita médica',
        requiere_respaldo: true,
        orden: 2,
        activo: true,
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
      },
      {
        id_motivo: 'mot003',
        id_establecimiento: idEstablecimiento,
        descripcion: 'Asunto familiar',
        requiere_respaldo: false,
        orden: 3,
        activo: true,
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
      },
      {
        id_motivo: 'mot004',
        id_establecimiento: idEstablecimiento,
        descripcion: 'Trámite administrativo',
        requiere_respaldo: false,
        orden: 4,
        activo: true,
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
      },
    ];

    for (const motivo of motivos) {
      await db.collection('motivos_justificacion').doc(motivo.id_motivo).set(motivo);
      console.log('✅ Motivo creado:', motivo.descripcion);
    }

    console.log('\n✨ Seed de motivos completado exitosamente!');
    console.log('📊 Motivos creados para establecimiento:', idEstablecimiento);
    console.log('   - Enfermedad');
    console.log('   - Cita médica');
    console.log('   - Asunto familiar');
    console.log('   - Trámite administrativo');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error en seed:', error);
    process.exit(1);
  }
}

seedMotivos();
