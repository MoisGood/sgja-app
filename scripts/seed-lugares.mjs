import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = resolve(__dirname, '..', '.env.local');
  if (!existsSync(envPath)) return {};
  const content = readFileSync(envPath, 'utf-8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

const env = loadEnv();
const supabaseUrl = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const MAPAS_DIR = resolve(__dirname, '..', 'docs', 'mapas reales');
const ARCHIVOS = [
  { archivo: 'plano_edificio piso 0 .json', piso: 0 },
  { archivo: 'plano_edificio piso 1.json',   piso: 1 },
  { archivo: 'plano_edificio piso 2.json',   piso: 2 },
  { archivo: 'plano_edificio piso3.json',    piso: 3 },
];

async function getEstablecimientoId() {
  const { data, error } = await supabase
    .from('establecimientos')
    .select('id')
    .limit(1)
    .single();
  if (error) {
    console.error('❌ No se pudo obtener establecimiento:', error.message);
    return null;
  }
  return data.id;
}

async function seed() {
  const idEstablecimiento = await getEstablecimientoId();
  if (!idEstablecimiento) {
    console.log('ℹ️  No hay establecimientos en la DB. Usando ID de prueba.');
    process.exit(0);
  }

  let total = 0;

  for (const { archivo, piso } of ARCHIVOS) {
    const filePath = resolve(MAPAS_DIR, archivo);
    let raw;
    try {
      raw = readFileSync(filePath, 'utf-8');
    } catch {
      console.warn(`⚠️  No se encontró ${archivo}, saltando.`);
      continue;
    }

    const lugares = JSON.parse(raw);
    const rows = lugares.map((r) => ({
      id_establecimiento: idEstablecimiento,
      piso,
      nombre: r.text,
      zona: r.zone || 'z-other',
      left_pos: r.left,
      top_pos: r.top,
      width: r.width,
      height: r.height,
    }));

    const { error } = await supabase.from('lugares').upsert(rows, {
      onConflict: 'id_establecimiento, piso, nombre',
      ignoreDuplicates: false,
    });

    if (error) {
      console.error(`❌ Error en piso ${piso}:`, error.message);
    } else {
      console.log(`✅ Piso ${piso}: ${rows.length} lugares insertados`);
      total += rows.length;
    }
  }

  console.log(`\n🎯 Total: ${total} lugares insertados en la DB`);
}

seed().catch(console.error);
