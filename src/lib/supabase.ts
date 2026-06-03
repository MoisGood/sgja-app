// ============================================================
// Supabase Client Configuration
// src/lib/supabase.ts
// ============================================================

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY no están configuradas en .env.local'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Exportar tipos de Supabase
export type { User } from '@supabase/supabase-js';
