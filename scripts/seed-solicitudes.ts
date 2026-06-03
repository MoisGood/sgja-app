import admin from 'firebase-admin';
import * as fs from 'fs';

// ============================================================
// SGJA – Script de Solicitudes (Injustificadas y Justificadas)
// scripts/seed-solicitudes.ts
// ============================================================

const serviceAccount = JSON.parse(
  fs.readFileSync('./serviceAccountKey.json', 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

const db = admin.firestore();

async function seedSolicitudes() {
  try {
    console.log('🌱 Iniciando seed de solicitudes...');

    // ────────────────────────────────────────────────────────────
    // COLECCIÓN: injustificadas (1 registro de ejemplo)
    // ────────────────────────────────────────────────────────────
    const injustificada = {
      id_solicitud: 'sol_injust_001',
      id_establecimiento: 'est001',
      id_estudiante: 'est001',
      id_profesor: 'prof001',
      tipo: 'ATRASO',
      fecha: '2026-03-24',
      hora: '08:30',
      estado: 'Injustificada',
      motivo_codigo: null,
      motivo_descripcion: null,
      observaciones: null,
      respaldo_recibido: false,
      tipo_respaldo: null,
      id_token_qr: null,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    };

    await db.collection('injustificadas').doc('sol_injust_001').set(injustificada);
    console.log('✅ Registro injustificado creado:', injustificada.id_solicitud);

    // ────────────────────────────────────────────────────────────
    // COLECCIÓN: justificadas (1 registro de ejemplo)
    // ────────────────────────────────────────────────────────────
    const justificada = {
      id_solicitud: 'sol_just_001',
      id_establecimiento: 'est001',
      id_estudiante: 'est002',
      id_profesor: 'prof001',
      tipo: 'INASISTENCIA',
      fecha: '2026-03-23',
      hora: '09:00',
      estado: 'Justificada',
      motivo_codigo: 'mot001',
      motivo_descripcion: 'Enfermedad',
      observaciones: 'Estudiante presentó certificado médico',
      respaldo_recibido: true,
      tipo_respaldo: 'CERTIFICADO_MEDICO',
      id_token_qr: null,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    };

    await db.collection('justificadas').doc('sol_just_001').set(justificada);
    console.log('✅ Registro justificado creado:', justificada.id_solicitud);

    console.log('\n✨ Seed completado exitosamente!');
    console.log('📊 Colecciones creadas:');
    console.log('   - injustificadas (1 registro)');
    console.log('   - justificadas (1 registro)');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error en seed:', error);
    process.exit(1);
  }
}

seedSolicitudes();
