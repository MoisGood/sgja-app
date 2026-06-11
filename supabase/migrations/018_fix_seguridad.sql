-- ============================================================
-- FIX SEGURIDAD: Vulnerabilidades criticas
-- ============================================================

-- 1. ELIMINAR funcion execute_sql (permite ejecutar cualquier SQL)
DROP FUNCTION IF EXISTS public.execute_sql;

-- 2. AGREGAR RLS a email_config
ALTER TABLE email_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "email_config_select" ON email_config;
DROP POLICY IF EXISTS "email_config_insert" ON email_config;
DROP POLICY IF EXISTS "email_config_update" ON email_config;
DROP POLICY IF EXISTS "email_config_delete" ON email_config;

CREATE POLICY "email_config_select" ON email_config
  FOR SELECT USING (public.es_admin());
CREATE POLICY "email_config_insert" ON email_config
  FOR INSERT WITH CHECK (public.es_admin());
CREATE POLICY "email_config_update" ON email_config
  FOR UPDATE USING (public.es_admin());
CREATE POLICY "email_config_delete" ON email_config
  FOR DELETE USING (public.es_admin());

-- 3. RESTRINGIR dominios_externos solo a admin
DROP POLICY IF EXISTS "dominios_externos_select" ON dominios_externos;
DROP POLICY IF EXISTS "dominios_externos_insert" ON dominios_externos;
DROP POLICY IF EXISTS "dominios_externos_update" ON dominios_externos;
DROP POLICY IF EXISTS "dominios_externos_delete" ON dominios_externos;

CREATE POLICY "dominios_externos_select" ON dominios_externos
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "dominios_externos_insert" ON dominios_externos
  FOR INSERT WITH CHECK (public.es_admin());
CREATE POLICY "dominios_externos_update" ON dominios_externos
  FOR UPDATE USING (public.es_admin());
CREATE POLICY "dominios_externos_delete" ON dominios_externos
  FOR DELETE USING (public.es_admin());

-- 4. RESTRINGIR tokens_acceso_externo solo a admin
DROP POLICY IF EXISTS "tokens_acceso_externo_select" ON tokens_acceso_externo;
DROP POLICY IF EXISTS "tokens_acceso_externo_insert" ON tokens_acceso_externo;
DROP POLICY IF EXISTS "tokens_acceso_externo_update" ON tokens_acceso_externo;

CREATE POLICY "tokens_acceso_externo_select" ON tokens_acceso_externo
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "tokens_acceso_externo_insert" ON tokens_acceso_externo
  FOR INSERT WITH CHECK (public.es_admin());
CREATE POLICY "tokens_acceso_externo_update" ON tokens_acceso_externo
  FOR UPDATE USING (public.es_admin());

-- 5. RESTRINGIR excepciones_externas solo a admin
DROP POLICY IF EXISTS "excepciones_externas_select" ON excepciones_externas;
DROP POLICY IF EXISTS "excepciones_externas_insert" ON excepciones_externas;
DROP POLICY IF EXISTS "excepciones_externas_update" ON excepciones_externas;
DROP POLICY IF EXISTS "excepciones_externas_delete" ON excepciones_externas;

CREATE POLICY "excepciones_externas_select" ON excepciones_externas
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "excepciones_externas_insert" ON excepciones_externas
  FOR INSERT WITH CHECK (public.es_admin());
CREATE POLICY "excepciones_externas_update" ON excepciones_externas
  FOR UPDATE USING (public.es_admin());
CREATE POLICY "excepciones_externas_delete" ON excepciones_externas
  FOR DELETE USING (public.es_admin());

SELECT 'FIX SEGURIDAD APLICADO' as resultado;
