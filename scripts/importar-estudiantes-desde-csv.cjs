/**
 * Importar estudiantes desde CSV a Supabase
 * Uso: node scripts/importar-estudiantes-desde-csv.cjs
 *
 * El CSV debe tener las columnas: rut, nombre_completo, curso, anno_ingreso, email
 * (email es opcional)
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const CSV_PATH = path.join(__dirname, 'template_importar_estudiantes.csv');

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

function parseCSV(content) {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const row = {};
    headers.forEach((h, i) => { row[h] = values[i] || null; });
    return row;
  });
}

async function main() {
  console.log('=== Importar Estudiantes desde CSV ===\n');

  // 1. Leer CSV
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`❌ No se encuentra el archivo CSV: ${CSV_PATH}`);
    console.log('Crea un CSV con las columnas: rut, nombre_completo, curso, anno_ingreso, email');
    process.exit(1);
  }

  const csvContent = fs.readFileSync(CSV_PATH, 'utf8');
  const estudiantes = parseCSV(csvContent);

  if (estudiantes.length === 0) {
    console.error('❌ El CSV está vacío o solo tiene encabezados');
    process.exit(1);
  }

  console.log(`📄 Se encontraron ${estudiantes.length} estudiantes en el CSV\n`);

  // 2. Obtener primer apoderado como referencia (opcional)
  const { data: apoderados } = await supabase
    .from('usuarios')
    .select('uid, nombre, id_establecimiento')
    .eq('rol', 'APODERADO')
    .eq('activo', true)
    .limit(1);

  const apoderado = apoderados && apoderados.length > 0 ? apoderados[0] : null;
  if (apoderado) {
    console.log(`👤 Apoderado de referencia: ${apoderado.nombre} (establecimiento: ${apoderado.id_establecimiento})`);
  } else {
    console.log('⚠️ No se encontró apoderado. Los estudiantes se crearán sin id_apoderado.');
  }

  // 3. Confirmar
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const confirm = await new Promise(resolve => {
    rl.question('\n¿Importar estos estudiantes? (s/N): ', answer => {
      rl.close();
      resolve(answer.toLowerCase() === 's');
    });
  });

  if (!confirm) {
    console.log('❌ Importación cancelada');
    process.exit(0);
  }

  // 4. Importar
  const ahora = new Date().toISOString();
  let creados = 0;
  let duplicados = 0;
  let errores = 0;

  for (const est of estudiantes) {
    const record = {
      id_establecimiento: apoderado ? apoderado.id_establecimiento : null,
      rut: est.rut,
      nombre_completo: est.nombre_completo,
      curso: est.curso,
      anno_ingreso: est.anno_ingreso ? parseInt(est.anno_ingreso) : null,
      email: est.email || null,
      activo: true,
      creado_en: ahora,
      actualizado_en: ahora,
    };

    if (apoderado) record.id_apoderado = apoderado.uid;

    const { error } = await supabase.from('estudiantes').insert(record);

    if (error) {
      if (error.code === '23505') {
        console.log(`   ⚠️ ${est.nombre_completo} ya existe (RUT duplicado)`);
        duplicados++;
      } else {
        console.error(`   ❌ ${est.nombre_completo}: ${error.message}`);
        errores++;
      }
    } else {
      console.log(`   ✅ ${est.nombre_completo} (${est.curso})`);
      creados++;
    }
  }

  console.log(`\n📊 Resumen: ${creados} creados, ${duplicados} duplicados, ${errores} errores`);
}

main().catch(err => { console.error('Error:', err); process.exit(1); });
