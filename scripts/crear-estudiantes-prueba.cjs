/**
 * Script para crear estudiantes de prueba y vincularlos al apoderado
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const SUPABASE_URL = envVars.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = envVars.VITE_SUPABASE_SERVICE_KEY || envVars.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  console.log('🔍 Buscando apoderado...');
  
  const { data: apoderados } = await supabase
    .from('usuarios')
    .select('uid, nombre, email, id_establecimiento')
    .eq('rol', 'APODERADO')
    .eq('activo', true)
    .limit(1);

  if (!apoderados || apoderados.length === 0) {
    console.error('❌ No hay apoderados. Ejecuta poblar-apoderados.cjs primero');
    process.exit(1);
  }

  const apoderado = apoderados[0];
  console.log(`✅ Apoderado: ${apoderado.nombre} (${apoderado.email})`);
  console.log(`   UID: ${apoderado.uid}`);
  console.log(`   Establecimiento: ${apoderado.id_establecimiento}`);

  const ahora = new Date().toISOString();
  const estudiantesPrueba = [
    { rut: '22.345.678-9', nombre: 'Juan', apellidos: 'Perez Lopez', curso: '1A', anno: 2024 },
    { rut: '22.456.789-0', nombre: 'Maria', apellidos: 'Gonzalez Silva', curso: '2A', anno: 2023 },
    { rut: '22.567.890-1', nombre: 'Carlos', apellidos: 'Rodriguez Torres', curso: '3A', anno: 2022 },
  ];

  console.log('\n📝 Creando estudiantes...');

  for (const est of estudiantesPrueba) {
    const { error } = await supabase.from('estudiantes').insert({
      id_establecimiento: apoderado.id_establecimiento,
      rut: est.rut,
      nombre_completo: `${est.nombre} ${est.apellidos}`,
      curso: est.curso,
      anno_ingreso: est.anno,
      id_apoderado: apoderado.uid,
      activo: true,
      creado_en: ahora,
      actualizado_en: ahora,
    });

    if (error) {
      if (error.code === '23505') {
        console.log(`   ⚠️ ${est.nombre} ${est.apellidos} ya existe (RUT duplicado)`);
      } else {
        console.error(`   ❌ Error al crear ${est.nombre}: ${error.message}`);
      }
    } else {
      console.log(`   ✅ ${est.nombre} ${est.apellidos} (${est.curso}) → id_apoderado: ${apoderado.uid}`);
    }
  }

  console.log('\n✅ Proceso completado');
}

main();
