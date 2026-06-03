/**
 * Script para verificar datos
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
  console.log('🔍 Establecimientos:');
  const { data: estabs } = await supabase.from('establecimientos').select('id, nombre').eq('activo', true);
  for (const e of (estabs || [])) {
    console.log(`   ${e.nombre} (${e.id})`);
    
    const { data: estudiantes } = await supabase
      .from('estudiantes')
      .select('id_estudiante, nombre_completo, curso, id_apoderado')
      .eq('id_establecimiento', e.id)
      .eq('activo', true)
      .limit(5);
    
    console.log(`   Estudiantes: ${estudiantes?.length || 0}`);
    for (const est of (estudiantes || [])) {
      console.log(`     - ${est.nombre_completo} (${est.curso}) | id_apoderado: ${est.id_apoderado || 'null'}`);
    }

    const { data: apoderados } = await supabase
      .from('usuarios')
      .select('uid, nombre, email')
      .eq('rol', 'APODERADO')
      .eq('id_establecimiento', e.id)
      .eq('activo', true);
    
    console.log(`   Apoderados: ${apoderados?.length || 0}`);
    for (const ap of (apoderados || [])) {
      console.log(`     - ${ap.nombre} (${ap.email}) | uid: ${ap.uid}`);
    }
    console.log('');
  }
}

main();
