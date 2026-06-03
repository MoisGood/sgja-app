#!/usr/bin/env node

/**
 * 🔍 Script de Verificación de Conexión a Supabase
 * Uso: node verify-supabase.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://iyxubvtfhcmlivivdfpt.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_XkxWTTJrOAq0rNXbTLL0ew_4g-HcMBt';

console.log('🔍 Verificando conexión a Supabase...\n');

try {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  console.log('✅ Cliente Supabase creado correctamente');
  console.log(`   URL: ${SUPABASE_URL}`);
  console.log(`   Key: ${SUPABASE_ANON_KEY.substring(0, 20)}...`);
  
  // Intentar conectar a la tabla usuarios
  console.log('\n📋 Verificando tabla usuarios...');
  
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .limit(1);
  
  if (error) {
    if (error.code === 'PGRST102') {
      console.log('❌ La tabla "usuarios" NO EXISTE');
      console.log('   → Ejecuta el SQL de setup en Supabase SQL Editor');
    } else {
      console.log(`❌ Error: ${error.message}`);
    }
  } else {
    console.log(`✅ Tabla usuarios accesible`);
    console.log(`   Total de usuarios: ${data.length}`);
    if (data.length > 0) {
      console.log(`   Primeros usuarios:`, data.slice(0, 2));
    }
  }
  
  // Verificar tabla establecimientos
  console.log('\n📋 Verificando tabla establecimientos...');
  
  const { data: establecimientos, error: errorEst } = await supabase
    .from('establecimientos')
    .select('*');
  
  if (errorEst) {
    console.log(`❌ Error: ${errorEst.message}`);
  } else {
    console.log(`✅ Tabla establecimientos accesible`);
    console.log(`   Total de establecimientos: ${establecimientos.length}`);
    if (establecimientos.length > 0) {
      console.log(`   Establecimientos:`, establecimientos);
    } else {
      console.log('   ⚠️  No hay establecimientos registrados');
      console.log('      → Ejecuta el SQL de setup para crear uno');
    }
  }
  
  console.log('\n✅ CONEXIÓN A SUPABASE: OK\n');
  
} catch (err) {
  console.error('❌ ERROR:', err.message);
}
