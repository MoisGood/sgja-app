import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '.env.local') });

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ REACT_APP_SUPABASE_URL o REACT_APP_SUPABASE_ANON_KEY no configurados');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function executeSQL() {
  try {
    console.log('📋 Leyendo archivo SQL...');
    const sqlFile = path.join(__dirname, 'CREATE_TABLE_INJUSTIFICADOS.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf-8');
    
    console.log('🔄 Ejecutando CREATE TABLE injustificados...');
    
    // Ejecutar SQL directamente
    const { data, error } = await supabase.rpc('execute_sql', { 
      sql_content: sqlContent 
    });
    
    if (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
    
    console.log('✅ Tabla injustificados creada exitosamente');
    console.log('📊 Resultado:', data);
    
  } catch (err) {
    console.error('❌ Error al ejecutar SQL:', err.message);
    process.exit(1);
  }
}

executeSQL();
