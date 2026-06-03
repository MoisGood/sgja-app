import * as admin from 'firebase-admin';
import * as fs from 'fs';

// ============================================================
// SGJA – Script de Datos de Prueba
// scripts/seed.ts
// ============================================================

const serviceAccount = JSON.parse(
  fs.readFileSync('./serviceAccountKey.json', 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// ────────────────────────────────────────────────────────────
// DATOS DE PRUEBA
// ────────────────────────────────────────────────────────────

const usuariosDemo = [
  {
    uid: 'admin001',
    email: 'admin@sgja.cl',
    nombre_completo: 'Administrador Sistema',
    rol: 'ADMIN',
    id_establecimiento: 'est001',
    activo: true,
  },
  {
    uid: 'inspector001',
    email: 'inspector@sgja.cl',
    nombre_completo: 'Inspector Educacional',
    rol: 'INSPECTOR',
    id_establecimiento: 'est001',
    activo: true,
  },
  {
    uid: 'profesor001',
    email: 'profesor@sgja.cl',
    nombre_completo: 'Profesor de Matemáticas',
    rol: 'PROFESOR',
    id_establecimiento: 'est001',
    activo: true,
  },
  {
    uid: 'estudiante001',
    email: 'estudiante@sgja.cl',
    nombre_completo: 'Juan Pérez González',
    rol: 'ESTUDIANTE',
    id_establecimiento: 'est001',
    activo: true,
  },
  {
    uid: 'apoderado001',
    email: 'apoderado@sgja.cl',
    nombre_completo: 'María González López',
    rol: 'APODERADO',
    id_establecimiento: 'est001',
    activo: true,
  },
];

const estudiantesDemo = [
  {
    id: 'est001',
    nombre_completo: 'Juan Pérez González',
    rut: '20.123.456-K',
    anno_ingreso: 2024,
    curso: '1A',
    id_usuario: 'estudiante001',
    id_apoderado: 'apoderado001',
  },
  {
    id: 'est002',
    nombre_completo: 'María García López',
    rut: '20.234.567-3',
    anno_ingreso: 2024,
    curso: '1A',
    id_usuario: null,
    id_apoderado: 'apoderado001',
  },
  {
    id: 'est003',
    nombre_completo: 'Carlos Rodríguez Silva',
    rut: '20.345.678-4',
    anno_ingreso: 2024,
    curso: '1B',
    id_usuario: null,
    id_apoderado: null,
  },
  {
    id: 'est004',
    nombre_completo: 'Ana Martínez Hernández',
    rut: '20.456.789-5',
    anno_ingreso: 2024,
    curso: '1B',
    id_usuario: null,
    id_apoderado: 'apoderado002',
  },
  {
    id: 'est005',
    nombre_completo: 'Pedro López Flores',
    rut: '20.567.890-6',
    anno_ingreso: 2024,
    curso: '2A',
    id_usuario: null,
    id_apoderado: null,
  },
  {
    id: 'est006',
    nombre_completo: 'Sofia Fernández Castro',
    rut: '20.678.901-7',
    anno_ingreso: 2024,
    curso: '2A',
    id_usuario: null,
    id_apoderado: 'apoderado003',
  },
  {
    id: 'est007',
    nombre_completo: 'Diego Sánchez Ramírez',
    rut: '20.789.012-8',
    anno_ingreso: 2024,
    curso: '2B',
    id_usuario: null,
    id_apoderado: null,
  },
  {
    id: 'est008',
    nombre_completo: 'Lucia Torres Molina',
    rut: '20.890.123-9',
    anno_ingreso: 2024,
    curso: '2B',
    id_usuario: null,
    id_apoderado: 'apoderado002',
  },
  {
    id: 'est009',
    nombre_completo: 'Roberto Núñez Vega',
    rut: '20.901.234-0',
    anno_ingreso: 2024,
    curso: '3A',
    id_usuario: null,
    id_apoderado: null,
  },
  {
    id: 'est010',
    nombre_completo: 'Valeria Ortiz Gómez',
    rut: '20.012.345-1',
    anno_ingreso: 2024,
    curso: '3A',
    id_usuario: null,
    id_apoderado: 'apoderado001',
  },
];

const solicitudesDemo = [
  {
    id: 'sol001',
    id_estudiante: 'est001',
    id_profesor: 'profesor001',
    tipo: 'ATRASO',
    estado: 'Solicitada',
    fecha: new Date('2026-03-15'),
    motivo_descripcion: 'Problema de transporte',
    observaciones: 'Fue causado por tráfico en la ruta 5',
  },
  {
    id: 'sol002',
    id_estudiante: 'est002',
    id_profesor: 'profesor001',
    tipo: 'INASISTENCIA',
    estado: 'En revisión',
    fecha: new Date('2026-03-14'),
    motivo_descripcion: 'Enfermedad',
    observaciones: 'Requiere certificado médico',
  },
  {
    id: 'sol003',
    id_estudiante: 'est003',
    id_profesor: 'profesor001',
    tipo: 'ATRASO',
    estado: 'Aprobada',
    fecha: new Date('2026-03-13'),
    motivo_descripcion: 'Cita médica',
    observaciones: null,
  },
  {
    id: 'sol004',
    id_estudiante: 'est001',
    id_profesor: 'profesor001',
    tipo: 'ATRASO',
    estado: 'Rechazada',
    fecha: new Date('2026-03-12'),
    motivo_descripcion: 'Retraso personal',
    observaciones: 'No se consideró justificación válida',
  },
];

const motivosDemo = [
  { id: 'mot001', nombre: 'Enfermedad', descripcion: 'El estudiante estaba enfermo', requiere_certificado: true },
  { id: 'mot002', nombre: 'Cita Médica', descripcion: 'Cita médica agendada', requiere_certificado: true },
  { id: 'mot003', nombre: 'Problema de Transporte', descripcion: 'Problema con transporte', requiere_certificado: false },
  { id: 'mot004', nombre: 'Razones Familiares', descripcion: 'Asuntos familiares importantes', requiere_certificado: false },
];

// ────────────────────────────────────────────────────────────
// FUNCIONES DE INSERCIÓN
// ────────────────────────────────────────────────────────────

async function seedEstablecimiento() {
  try {
    await db.collection('establecimientos').doc('est001').set({
      nombre: 'Liceo Público San José',
      region: 'Valparaíso',
      ciudad: 'Valparaíso',
      direccion: 'Calle Principal 123',
      codigo_rbd: '10500001',
      tipo: 'Liceo',
      activo: true,
    });
    console.log('✅ Establecimiento creado: Liceo Público San José');
  } catch (error) {
    console.error('❌ Error al crear establecimiento:', error);
  }
}

async function seedUsuarios() {
  try {
    for (const usuario of usuariosDemo) {
      await db.collection('usuarios').doc(usuario.uid).set({
        email: usuario.email,
        nombre_completo: usuario.nombre_completo,
        rol: usuario.rol,
        id_establecimiento: usuario.id_establecimiento,
        activo: usuario.activo,
        fecha_creacion: admin.firestore.Timestamp.now(),
      });
    }
    console.log(`✅ ${usuariosDemo.length} usuarios creados`);
  } catch (error) {
    console.error('❌ Error al crear usuarios:', error);
  }
}

async function seedEstudiantes() {
  try {
    for (const estudiante of estudiantesDemo) {
      await db.collection('estudiantes').doc(estudiante.id).set({
        nombre_completo: estudiante.nombre_completo,
        rut: estudiante.rut,
        anno_ingreso: estudiante.anno_ingreso,
        curso: estudiante.curso,
        id_usuario: estudiante.id_usuario,
        id_apoderado: estudiante.id_apoderado,
        fecha_creacion: admin.firestore.Timestamp.now(),
      });
    }
    console.log(`✅ ${estudiantesDemo.length} estudiantes creados`);
  } catch (error) {
    console.error('❌ Error al crear estudiantes:', error);
  }
}

async function seedSolicitudes() {
  try {
    for (const solicitud of solicitudesDemo) {
      await db.collection('solicitudes').doc(solicitud.id).set({
        id_estudiante: solicitud.id_estudiante,
        id_profesor: solicitud.id_profesor,
        tipo: solicitud.tipo,
        estado: solicitud.estado,
        fecha: admin.firestore.Timestamp.fromDate(solicitud.fecha),
        motivo_descripcion: solicitud.motivo_descripcion,
        observaciones: solicitud.observaciones,
        fecha_creacion: admin.firestore.Timestamp.now(),
      });
    }
    console.log(`✅ ${solicitudesDemo.length} solicitudes creadas`);
  } catch (error) {
    console.error('❌ Error al crear solicitudes:', error);
  }
}

async function seedMotivos() {
  try {
    for (const motivo of motivosDemo) {
      await db.collection('motivos_justificacion').doc(motivo.id).set({
        nombre: motivo.nombre,
        descripcion: motivo.descripcion,
        requiere_certificado: motivo.requiere_certificado,
        activo: true,
      });
    }
    console.log(`✅ ${motivosDemo.length} motivos de justificación creados`);
  } catch (error) {
    console.error('❌ Error al crear motivos:', error);
  }
}

// ────────────────────────────────────────────────────────────
// EJECUTAR SEED
// ────────────────────────────────────────────────────────────

async function runSeed() {
  console.log('🌱 Iniciando seed de datos de prueba...\n');

  try {
    await seedEstablecimiento();
    await seedUsuarios();
    await seedEstudiantes();
    await seedSolicitudes();
    await seedMotivos();

    console.log('\n✅ ¡Seed completado exitosamente!');
    console.log('\n📊 Datos agregados:');
    console.log(`   • 1 establecimiento`);
    console.log(`   • ${usuariosDemo.length} usuarios`);
    console.log(`   • ${estudiantesDemo.length} estudiantes`);
    console.log(`   • ${solicitudesDemo.length} solicitudes`);
    console.log(`   • ${motivosDemo.length} motivos`);
    console.log('\n📝 Credenciales de prueba:');
    console.log('   Admin:     admin@sgja.cl');
    console.log('   Inspector: inspector@sgja.cl');
    console.log('   Profesor:  profesor@sgja.cl');
    console.log('   Estudiante: estudiante@sgja.cl');
    console.log('   Apoderado: apoderado@sgja.cl');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error general durante seed:', error);
    process.exit(1);
  }
}

runSeed();
