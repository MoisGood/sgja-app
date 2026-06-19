-- ═══════════════════════════════════════════════════
-- CORRECCIÓN RLS - SGJA
-- Copiar y pegar en Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════

-- 0a. Helper SECURITY DEFINER: establecimiento del usuario logueado (evita recursión RLS)
CREATE OR REPLACE FUNCTION public.mi_id_establecimiento()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id_establecimiento FROM public.usuarios
  WHERE id = auth.uid() OR email = auth.email()
  LIMIT 1;
$$;

-- 0b. Helper SECURITY DEFINER: verificar si el uid ya existe en usuarios
CREATE OR REPLACE FUNCTION public.usuario_existe_por_uid(uid_buscar text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.usuarios WHERE uid = uid_buscar);
$$;

-- 1. ELIMINAR anon_update_lugares (hueco crítico)
DROP POLICY IF EXISTS anon_update_lugares ON public.lugares;

-- 2. ELIMINAR políticas {authenticated} con true en config_sistema
DROP POLICY IF EXISTS config_sistema_select ON public.config_sistema;
DROP POLICY IF EXISTS config_sistema_insert ON public.config_sistema;
DROP POLICY IF EXISTS config_sistema_update ON public.config_sistema;
DROP POLICY IF EXISTS config_sistema_delete ON public.config_sistema;

-- 3. usuarios_select: filtrar por establecimiento del usuario logueado
DROP POLICY IF EXISTS usuarios_select ON public.usuarios;
CREATE POLICY usuarios_select ON public.usuarios
  FOR SELECT
  TO public
  USING (
    auth.role() = 'authenticated'::text
    AND (
      es_admin()
      OR
      usuarios.id_establecimiento = public.mi_id_establecimiento()
    )
  );

-- 4. usuarios_insert: permitir registro pero bloquear duplicados
DROP POLICY IF EXISTS usuarios_insert_authenticated ON public.usuarios;
CREATE POLICY usuarios_insert_authenticated ON public.usuarios
  FOR INSERT
  TO public
  WITH CHECK (
    auth.role() = 'authenticated'::text
    AND NOT public.usuario_existe_por_uid(auth.uid()::text)
  );
