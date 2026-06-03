// ============================================================
// Script para crear usuario de prueba en Supabase
// scripts/createTestUser.ts
// ============================================================

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Faltan variables de entorno: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function createTestUser() {
  try {
    console.log('🔐 Creando usuario de prueba...');

    // Email de prueba
    const testEmail = 'profesor1@andaliensur.cl';
    const testPassword = 'Test@12345';
    const establecimientoId = '18f3ec96-f15f-4787-a3ac-3c10f1cee55f';

    // Crear usuario en Supabase Auth
    console.log(`📧 Registrando usuario: ${testEmail}`);
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        full_name: 'Profesor Test',
      },
    });

    if (authError) {
      console.error('❌ Error en Auth:', authError.message);
      // Si el error es que el usuario ya existe, continuamos
      if (!authError.message.includes('already registered')) {
        process.exit(1);
      }
      console.log('⚠️ Usuario ya existe en Auth, buscando en usuarios...');
    }

    const userId = authData?.user?.id || '';
    console.log(`✅ Usuario Auth creado: ${userId}`);

    if (userId) {
      // Crear registro en tabla usuarios
      console.log('📝 Insertando en tabla usuarios...');
      const { error: insertError } = await supabase
        .from('usuarios')
        .insert([
          {
            id: userId,
            email: testEmail,
            nombre_completo: 'Profesor Test',
            rol: 'PROFESOR',
            id_establecimiento: establecimientoId,
            activo: true,
            creado_en: new Date().toISOString(),
          },
        ]);

      if (insertError) {
        console.error('❌ Error al insertar en usuarios:', insertError.message);
        // Si el error es que ya existe, está bien
        if (!insertError.message.includes('duplicate')) {
          process.exit(1);
        }
      }

      console.log('✅ Usuario insertado en tabla usuarios');
    }

    console.log('\n✅ Usuario de prueba listo:');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Password: ${testPassword}`);
    console.log(`   Rol: PROFESOR`);
    console.log(`   Estado: Activo`);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createTestUser();
