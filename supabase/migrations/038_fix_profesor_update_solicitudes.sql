-- ============================================================
-- AGIL – Fix: Permitir a PROFESOR actualizar sus propios pases
-- ============================================================

CREATE POLICY "solicitudes_update_profesor" ON public.solicitudes
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.usuarios WHERE uid = auth.uid()::text AND rol = 'PROFESOR')
    AND id_profesor IN (
      SELECT id FROM public.usuarios WHERE uid = auth.uid()::text
    )
  );

DO $$ BEGIN
  RAISE NOTICE 'Migración 038 completada: PROFESOR ahora puede UPDATE sus propias solicitudes';
END $$;
