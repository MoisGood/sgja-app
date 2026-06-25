-- ═══════════════════════════════════════════════════
-- AUDITORÍA RLS - SGJA
-- Copiar y pegar en Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════

-- 1. TABLAS CON RLS ACTIVADA
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = true
ORDER BY tablename;

-- 2. TABLAS SIN RLS (⚠️ RIESGO - sin protección)
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false
ORDER BY tablename;

-- 3. TODAS LAS POLÍTICAS EXISTENTES (completo)
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual AS "USING (row-level)",
    with_check AS "WITH CHECK (insert/update)"
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 4. POLÍTICAS DEMASIADO PERMISIVAS
-- Busca USING que sean solo 'true' (permite todo)
SELECT
    schemaname,
    tablename,
    policyname,
    cmd,
    qual AS "USING"
FROM pg_policies
WHERE schemaname = 'public'
  AND qual IS NOT NULL
  AND (
    qual::text IN ('true', '(true)')
    OR qual::text LIKE '%true%'
  )
ORDER BY tablename, policyname;

-- 5. POLÍTICAS SIN WITH CHECK (insert/update sin validación)
SELECT
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND cmd IN ('INSERT', 'UPDATE')
  AND with_check IS NULL
ORDER BY tablename, policyname;

-- 6. POLÍTICAS QUE USAN auth.uid() vs auth.jwt()
-- auth.uid() extrae del JWT - revisar si está presente
SELECT
    schemaname,
    tablename,
    policyname,
    cmd,
    qual AS "USING"
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    qual::text LIKE '%auth.uid()%'
    OR with_check::text LIKE '%auth.uid()%'
  )
ORDER BY tablename, policyname;

-- 7. RESUMEN POR TABLA
SELECT
    tablename,
    count(*) AS total_policies,
    count(*) FILTER (WHERE cmd = 'SELECT') AS select_policies,
    count(*) FILTER (WHERE cmd = 'INSERT') AS insert_policies,
    count(*) FILTER (WHERE cmd = 'UPDATE') AS update_policies,
    count(*) FILTER (WHERE cmd = 'DELETE') AS delete_policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
