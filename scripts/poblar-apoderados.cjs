/**
 * Script para crear apoderado de prueba y asignar estudiantes
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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

if (!SUPABASE_URL) {
  console.error('Error: VITE_SUPABASE_URL no encontrada en .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  console.log('🔍 Buscando establecimiento...');
  
  const { data: establecimientos, error: errorEstab } = await supabase
    .from('establecimientos')
    .select('id, nombre')
    .eq('activo', true)
    .limit(1);

  if (errorEstab || !establecimientos || establecimientos.length === 0) {
    console.error('Error: No se encontró establecimiento activo');
    process.exit(1);
  }

  const estab = establecimientos[0];
  console.log(`✅ Establecimiento: ${estab.nombre} (${estab.id})`);

  console.log('\n🔍 Buscando apoderados existentes...');
  
  const { data: apoderados, error: errorApoderados } = await supabase
    .from('usuarios')
    .select('id, uid, email, nombre, id_establecimiento')
    .eq('rol', 'APODERADO')
    .eq('activo', true);

  if (errorApoderados) {
    console.error('Error al obtener apoderados:', errorApoderados);
    process.exit(1);
  }

  let apoderadoUid;

  if (apoderados && apoderados.length > 0) {
    apoderadoUid = apoderados[0].uid;
    console.log(`✅ Usando apoderado existente: ${apoderados[0].nombre} (${apoderados[0].email})`);
  } else {
    console.log('⚠️ No hay apoderados. Creando uno de prueba...');
    
    const testUid = crypto.randomUUID();
    const testEmail = 'apoderado.prueba@sgja.cl';
    const testNombre = 'Apoderado Prueba';

    const { error: insertError } = await supabase
      .from('usuarios')
      .insert({
        uid: testUid,
        email: testEmail,
        nombre: testNombre,
        rol: 'APODERADO',
        id_establecimiento: estab.id,
        activo: true,
        creado_en: new Date().toISOString(),
        actualizado_en: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Error al crear apoderado:', insertError);
      process.exit(1);
    }

    apoderadoUid = testUid;
    console.log(`✅ Apoderado creado: ${testNombre} (${testEmail})`);
    console.log(`   UID: ${testUid}`);
  }

  console.log('\n🔍 Buscando estudiantes sin apoderado...');
  
  const { data: estudiantes, error: errorEstudiantes } = await supabase
    .from('estudiantes')
    .select('id_estudiante, nombre_completo, curso')
    .eq('id_establecimiento', estab.id)
    .eq('activo', true)
    .is('id_apoderado', null)
    .limit(3);

  if (errorEstudiantes) {
    console.error('Error al obtener estudiantes:', errorEstudiantes);
    process.exit(1);
  }

  if (!estudiantes || estudiantes.length === 0) {
    console.log('⚠️ No hay estudiantes sin apoderado para asignar');
    
    console.log('\n🔍 Asignando estudiantes que ya tienen apoderado para verificar...');
    const { data: estudiantesConApoderado } = await supabase
      .from('estudiantes')
      .select('id_estudiante, nombre_completo, curso, id_apoderado')
      .eq('id_establecimiento', estab.id)
      .eq('activo', true)
      .not('id_apoderado', 'is', null)
      .limit(2);

    if (estudiantesConApoderado && estudiantesConApoderado.length > 0) {
      for (const est of estudiantesConApoderado) {
        console.log(`   ${est.nombre_completo} (${est.curso}) → id_apoderado: ${est.id_apoderado}`);
      }
    } else {
      console.log('   No hay estudiantes con apoderado asignado');
    }
    
    process.exit(0);
  }

  console.log(`✅ Encontrados ${estudiantes.length} estudiantes sin apoderado`);
  console.log('\n📝 Asignando apoderado...');

  for (const estudiante of estudiantes) {
    const { error: updateError } = await supabase
      .from('estudiantes')
      .update({ id_apoderado: apoderadoUid })
      .eq('id_estudiante', estudiante.id_estudiante);

    if (updateError) {
      console.error(`   ❌ Error al actualizar ${estudiante.nombre_completo}: ${updateError.message}`);
    } else {
      console.log(`   ✅ ${estudiante.nombre_completo} (${estudiante.curso}) → Apoderado`);
    }
  }

  console.log('\n✅ Proceso completado');
  console.log('\n📋 Resumen:');
  console.log(`   Apoderado UID: ${apoderadoUid}`);
  console.log(`   Estudiantes asignados: ${estudiantes.length}`);
}

main();
