import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envContent = readFileSync(resolve(__dirname, '..', '.env.local'), 'utf-8');
const env = Object.fromEntries(
  envContent.split('\n').filter(l => l.trim() && !l.startsWith('#')).map(l => {
    const i = l.indexOf('=');
    return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
  })
);

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

const sql = `
-- 1. Desvincular funcionarios del viejo admin
UPDATE public.funcionarios SET id_usuario = NULL WHERE id_usuario = '550e8400-e29b-41d4-a716-446655550101';

-- 2. Insertar el auth UID como admin (si ya existe por uid, hace update)
INSERT INTO public.usuarios (id, uid, email, nombre, apellidos, rol, activo)
VALUES ('c88e105c-b950-427c-9552-9b57e982a0fe', 'c88e105c-b950-427c-9552-9b57e982a0fe', 'soportetipresente@gmail.com', 'Emilio', 'Santana', 'ADMIN', true)
ON CONFLICT (id) DO UPDATE SET uid = EXCLUDED.uid, email = EXCLUDED.email, rol = 'ADMIN', activo = true;

-- 3. Eliminar el registro admin viejo
DELETE FROM public.usuarios WHERE id = '550e8400-e29b-41d4-a716-446655550101';
`;

console.log('Ejecutando SQL directo via REST API...');

// Execute via POST /rest/v1/rpc/ (no, this won't work for DDL)
// Use the SQL endpoint via management API
// Or fallback: just output the SQL for the user

const outPath = resolve(__dirname, 'fix_admin_final.sql');
const sqlContent = `-- ============================================================
-- Fix: Reemplazar admin ID viejo por el auth UID real
-- ============================================================

${sql}

-- 4. Modificar es_admin() para verificar por email también
CREATE OR REPLACE FUNCTION public.es_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE (id = auth.uid() OR email = (SELECT email FROM auth.users WHERE id = auth.uid()))
      AND rol = 'ADMIN' AND activo = true
  );
$$;

-- Verificar
SELECT id, email, rol FROM public.usuarios WHERE email = 'soportetipresente@gmail.com';
`;
writeFileSync(outPath, sqlContent, 'utf-8');
console.log(`Script generado: ${outPath}`);
console.log('Ejecutar en SQL Editor.');
