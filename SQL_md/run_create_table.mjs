import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '.env.local') });

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ REACT_APP_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no configurados');
  console.error('Por favor, añade SUPABASE_SERVICE_ROLE_KEY a .env.local');
  process.exit(1);
}

async function executeSQL() {
  try {
    console.log('📋 Leyendo archivo SQL...');
    const sqlFile = path.join(__dirname, 'CREATE_TABLE_INJUSTIFICADOS.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf-8');
    
    console.log('🔄 Conectando a Supabase PostgreSQL...');
    
    // Usar endpoint REST de Supabase para ejecutar SQL
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/execute_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY
      },
      body: JSON.stringify({ sql_content: sqlContent })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Error HTTP:', response.status);
      console.error(error);
      process.exit(1);
    }

    const result = await response.json();
    console.log('✅ Tabla injustificados creada exitosamente');
    console.log('📊 Resultado:', result);
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.log('\n⚠️  Si no tienes SUPABASE_SERVICE_ROLE_KEY, copia el contenido de CREATE_TABLE_INJUSTIFICADOS.sql');
    console.log('   directamente en el SQL Editor de Supabase: https://supabase.com/dashboard');
  }
}

executeSQL();
