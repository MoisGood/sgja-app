/**
 * Script para insertar datos de prueba en la colección de Funcionarios
 * Ejecutar: npx ts-node scripts/seed_funcionarios.ts
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as serviceAccount from '../serviceAccountKey.json';

const app = initializeApp({
  credential: cert(serviceAccount as Record<string, unknown>),
});

const db = getFirestore(app);

async function seedFuncionarios() {
  try {
    console.log('🌱 Iniciando seed de funcionarios...');

    // Datos de prueba - Macarena Rocio Zuñiga Reynero
    const funcionarios = [
      {
        rut: '198141127', // Sin puntos ni guión
        rut_formateado: '19.814.112-7',
        nombre_completo: 'Macarena Rocio Zuñiga Reynero',
        fecha_nacimiento: '1998-01-03',
        domicilio: 'Avenida Los Presidentes 1336, Concepción',
        celular: '945433069',
        titulo_profesional: 'Terapeuta Ocupacional',
        universidad: 'Universidad Andres Bello',
        ano_titulacion: 2022,
        fecha_ingreso: '2026-04-08',
        horas_contrato: 19,
        activo: true,
        creado_en: new Date(),
        actualizado_en: new Date(),
      },
      {
        rut: '123456789',
        rut_formateado: '12.345.678-9',
        nombre_completo: 'Juan Pedro García López',
        fecha_nacimiento: '1990-05-15',
        domicilio: 'Calle Principal 123, Santiago',
        celular: '912345678',
        titulo_profesional: 'Ingeniero en Sistemas',
        universidad: 'Universidad de Chile',
        ano_titulacion: 2015,
        fecha_ingreso: '2020-01-10',
        horas_contrato: 40,
        activo: true,
        creado_en: new Date(),
        actualizado_en: new Date(),
      },
      {
        rut: '987654321',
        rut_formateado: '98.765.432-1',
        nombre_completo: 'María José Rodríguez Silva',
        fecha_nacimiento: '1988-11-22',
        domicilio: 'Paseo Los Andes 456, Valparaíso',
        celular: '987654321',
        titulo_profesional: 'Psicóloga Educacional',
        universidad: 'Pontificia Universidad Católica',
        ano_titulacion: 2012,
        fecha_ingreso: '2018-03-01',
        horas_contrato: 30,
        activo: true,
        creado_en: new Date(),
        actualizado_en: new Date(),
      },
    ];

    // Insertar cada funcionario
    for (const func of funcionarios) {
      await db.collection('funcionarios').doc(func.rut).set(func);
      console.log(`✅ Insertado: ${func.nombre_completo} (${func.rut_formateado})`);
    }

    console.log('\n🎉 Seed completado exitosamente!');
    console.log(`📊 Total funcionarios insertados: ${funcionarios.length}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante seed:', error);
    process.exit(1);
  }
}

seedFuncionarios();
