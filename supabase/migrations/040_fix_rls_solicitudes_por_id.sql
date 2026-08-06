-- ============================================================
-- AGIL – Fix: las políticas RLS de solicitudes usaban
-- usuarios.uid = auth.uid()::text, pero usuarios.uid es NULL
-- para los usuarios creados vía crearUsuario/Login (solo id).
-- Se cambian a usuarios.id = auth.uid().
-- ============================================================

DROP POLICY IF EXISTS "solicitudes_select_admin" ON public.solicitudes;
CREATE POLICY "solicitudes_select_admin" ON public.solicitudes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol = 'ADMIN')
  );

DROP POLICY IF EXISTS "solicitudes_select_paradocente_inspector" ON public.solicitudes;
CREATE POLICY "solicitudes_select_paradocente_inspector" ON public.solicitudes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol IN ('PARADOCENTE', 'INSPECTOR'))
  );

DROP POLICY IF EXISTS "solicitudes_select_profesor" ON public.solicitudes;
CREATE POLICY "solicitudes_select_profesor" ON public.solicitudes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol = 'PROFESOR')
    AND (id_profesor = auth.uid() OR id_profesor IS NULL)
  );

DROP POLICY IF EXISTS "solicitudes_select_estudiante" ON public.solicitudes;
CREATE POLICY "solicitudes_select_estudiante" ON public.solicitudes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol = 'ESTUDIANTE')
  );

DROP POLICY IF EXISTS "solicitudes_insert" ON public.solicitudes;
CREATE POLICY "solicitudes_insert" ON public.solicitudes
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol IN ('ADMIN', 'INSPECTOR', 'PARADOCENTE', 'PROFESOR'))
  );

DROP POLICY IF EXISTS "solicitudes_update_paradocente" ON public.solicitudes;
CREATE POLICY "solicitudes_update_paradocente" ON public.solicitudes
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol IN ('ADMIN', 'INSPECTOR', 'PARADOCENTE'))
  );

DROP POLICY IF EXISTS "solicitudes_update_profesor" ON public.solicitudes;
CREATE POLICY "solicitudes_update_profesor" ON public.solicitudes
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol = 'PROFESOR')
    AND id_profesor = auth.uid()
  );

DO $$ BEGIN
  RAISE NOTICE 'Migración 040 completada: políticas RLS de solicitudes usan usuarios.id';
END $$;
