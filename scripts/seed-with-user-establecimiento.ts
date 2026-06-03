import admin from 'firebase-admin';
import * as fs from 'fs';

// ============================================================
// Script para crear seed data con el establecimiento del usuario actual
// ============================================================

const serviceAccount = JSON.parse(
  fs.readFileSync('./serviceAccountKey.json', 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

const db = admin.firestore();

async function seedSolicitudesWithCorrectEstablecimiento() {
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

    // Limpiar colecciones anteriores
    console.log('🗑️ Limpiando colecciones anteriores...');
    const injustSnapshot = await db.collection('injustificadas').get();
    for (const doc of injustSnapshot.docs) {
      await doc.ref.delete();
    }

    const justSnapshot = await db.collection('justificadas').get();
    for (const doc of justSnapshot.docs) {
      await doc.ref.delete();
    }

    console.log('✅ Colecciones limpiadas');

    // Obtener fecha de hoy en formato YYYY-MM-DD
    const hoy = new Date().toISOString().split('T')[0];
    console.log('📅 Fecha actual:', hoy);

    // ────────────────────────────────────────────────────────────
    // CREAR ESTUDIANTES DE PRUEBA
    // ────────────────────────────────────────────────────────────
    console.log('👥 Creando estudiantes de prueba...');
    
    const estudiante1 = {
      id_estudiante: 'est001',
      id_establecimiento: idEstablecimiento,
      rut: '25123456-1',
      nombre_completo: 'Juan García López',
      curso: '4°A',
      email: 'juan.garcia@school.cl',
      telefono: '+56912345678',
      estado: 'ACTIVO',
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    };

    await db.collection('estudiantes').doc('est001').set(estudiante1);
    console.log('✅ Estudiante 1 creado:', estudiante1.nombre_completo);

    const estudiante2 = {
      id_estudiante: 'est002',
      id_establecimiento: idEstablecimiento,
      rut: '25234567-2',
      nombre_completo: 'María Rodríguez Pérez',
      curso: '4°A',
      email: 'maria.rodriguez@school.cl',
      telefono: '+56912345679',
      estado: 'ACTIVO',
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    };

    await db.collection('estudiantes').doc('est002').set(estudiante2);
    console.log('✅ Estudiante 2 creado:', estudiante2.nombre_completo);

    // ────────────────────────────────────────────────────────────
    // COLECCIÓN: injustificadas
    // ────────────────────────────────────────────────────────────
    const injustificada = {
      id_solicitud: 'sol_injust_001',
      id_establecimiento: idEstablecimiento,
      id_estudiante: 'est001',
      id_profesor: 'prof001',
      tipo: 'ATRASO',
      fecha: hoy,
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
    // COLECCIÓN: justificadas
    // ────────────────────────────────────────────────────────────
    const justificada = {
      id_solicitud: 'sol_just_001',
      id_establecimiento: idEstablecimiento,
      id_estudiante: 'est002',
      id_profesor: 'prof001',
      tipo: 'INASISTENCIA',
      fecha: hoy,
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
    console.log('📊 Datos creados para establecimiento:', idEstablecimiento);
    console.log('   - injustificadas (1 registro) - Fecha:', hoy);
    console.log('   - justificadas (1 registro) - Fecha:', hoy);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error en seed:', error);
    process.exit(1);
  }
}

seedSolicitudesWithCorrectEstablecimiento();
