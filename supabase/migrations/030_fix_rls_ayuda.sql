DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ayuda_faq' AND policyname = 'Usuarios insertan FAQ') THEN
    CREATE POLICY "Usuarios insertan FAQ" ON public.ayuda_faq FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ayuda_faq' AND policyname = 'Usuarios actualizan FAQ') THEN
    CREATE POLICY "Usuarios actualizan FAQ" ON public.ayuda_faq FOR UPDATE USING (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ayuda_faq' AND policyname = 'Usuarios eliminan FAQ') THEN
    CREATE POLICY "Usuarios eliminan FAQ" ON public.ayuda_faq FOR DELETE USING (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ayuda_catalogo_errores' AND policyname = 'Usuarios insertan errores') THEN
    CREATE POLICY "Usuarios insertan errores" ON public.ayuda_catalogo_errores FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ayuda_catalogo_errores' AND policyname = 'Usuarios actualizan errores') THEN
    CREATE POLICY "Usuarios actualizan errores" ON public.ayuda_catalogo_errores FOR UPDATE USING (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ayuda_catalogo_errores' AND policyname = 'Usuarios eliminan errores') THEN
    CREATE POLICY "Usuarios eliminan errores" ON public.ayuda_catalogo_errores FOR DELETE USING (auth.role() = 'authenticated');
  END IF;
END $$;
