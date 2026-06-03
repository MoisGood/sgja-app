import admin from 'firebase-admin';
import * as fs from 'fs';

// ============================================================
// Script para crear cursos
// ============================================================

const serviceAccount = JSON.parse(
  fs.readFileSync('./serviceAccountKey.json', 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

const db = admin.firestore();

async function seedCursos() {
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

    // ────────────────────────────────────────────────────────────
    // Crear cursos
    // ────────────────────────────────────────────────────────────
    const cursos = [
      {
        id_curso: 'curso_4a',
        id_establecimiento: idEstablecimiento,
        nombre: '4°A',
        nivel: '4',
        paralelo: 'A',
        activo: true,
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
      },
      {
        id_curso: 'curso_4b',
        id_establecimiento: idEstablecimiento,
        nombre: '4°B',
        nivel: '4',
        paralelo: 'B',
        activo: true,
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
      },
      {
        id_curso: 'curso_3a',
        id_establecimiento: idEstablecimiento,
        nombre: '3°A',
        nivel: '3',
        paralelo: 'A',
        activo: true,
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
      },
    ];

    for (const curso of cursos) {
      await db.collection('cursos').doc(curso.id_curso).set(curso);
      console.log('✅ Curso creado:', curso.nombre);
    }

    console.log('\n✨ Seed de cursos completado exitosamente!');
    console.log('📊 Cursos creados para establecimiento:', idEstablecimiento);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error en seed:', error);
    process.exit(1);
  }
}

seedCursos();
