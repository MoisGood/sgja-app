-- ============================================================
-- Crear usuarios directo desde colaboradores_seleccionados.csv
-- Para funcionarios que no tienen cuenta en usuarios
-- ============================================================

DO $$
DECLARE
  v_establecimiento uuid;
  v_count integer := 0;
  v_nombre text;
  v_apellidos text;
BEGIN
  SELECT id_establecimiento INTO v_establecimiento
  FROM public.usuarios WHERE rol = 'ADMIN' AND id_establecimiento IS NOT NULL LIMIT 1;

  IF v_establecimiento IS NULL THEN
    RAISE EXCEPTION 'No hay admin con establecimiento para asignar';
  END IF;

  -- 6468574-0 - SANCHEZ MERINO LUIS ALEJO
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'luis.sanchezm@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'luis.sanchezm@andaliensur.cl', 'LUIS ALEJO', 'SANCHEZ MERINO', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'luis.sanchezm@andaliensur.cl') WHERE correo_institucional = 'luis.sanchezm@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 6476558-2 - PINO VALENZUELA CARLOS RENE
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'carlos.pinov@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'carlos.pinov@andaliensur.cl', 'CARLOS RENE', 'PINO VALENZUELA', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'carlos.pinov@andaliensur.cl') WHERE correo_institucional = 'carlos.pinov@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 7330667-1 - JIMÉNEZ RAMÍREZ ALICIA EUGENIA
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'alicia.jimenezr@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'alicia.jimenezr@andaliensur.cl', 'ALICIA EUGENIA', 'JIMÉNEZ RAMÍREZ', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'alicia.jimenezr@andaliensur.cl') WHERE correo_institucional = 'alicia.jimenezr@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 7457465-3 - VELOSO FREDES OSCAR ARMANDO
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'oscar.velosof@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'oscar.velosof@andaliensur.cl', 'OSCAR ARMANDO', 'VELOSO FREDES', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'oscar.velosof@andaliensur.cl') WHERE correo_institucional = 'oscar.velosof@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 7703303-3 - URIBE URIBE LUIS ANTONIO
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'luis.uribe@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'luis.uribe@andaliensur.cl', 'LUIS ANTONIO', 'URIBE URIBE', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'luis.uribe@andaliensur.cl') WHERE correo_institucional = 'luis.uribe@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 7707660-3 - ARAVENA ORMEÑO BERNARDO DEL TRÁNSITO
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'bernardo.aravena@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'bernardo.aravena@andaliensur.cl', 'DEL TRÁNSITO', 'ARAVENA ORMEÑO BERNARDO', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'bernardo.aravena@andaliensur.cl') WHERE correo_institucional = 'bernardo.aravena@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 7874741-2 - ZAPATA AEDO ISABEL MAGALY
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'isabel.zapataa@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'isabel.zapataa@andaliensur.cl', 'ISABEL MAGALY', 'ZAPATA AEDO', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'isabel.zapataa@andaliensur.cl') WHERE correo_institucional = 'isabel.zapataa@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 8209213-7 - CAUTIVO BALTIERRA ELENA DEL CARMEN
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'elena.cautivo@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'elena.cautivo@andaliensur.cl', 'DEL CARMEN', 'CAUTIVO BALTIERRA ELENA', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'elena.cautivo@andaliensur.cl') WHERE correo_institucional = 'elena.cautivo@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 8232443-7 - ARIAS FRIZ BERNARDA SONIA
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'bernarda.ariasf@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'bernarda.ariasf@andaliensur.cl', 'BERNARDA SONIA', 'ARIAS FRIZ', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'bernarda.ariasf@andaliensur.cl') WHERE correo_institucional = 'bernarda.ariasf@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 8419936-2 - JUAREZ VALLADARES MYRNA LORENA
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'myrna.juarez@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'myrna.juarez@andaliensur.cl', 'MYRNA LORENA', 'JUAREZ VALLADARES', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'myrna.juarez@andaliensur.cl') WHERE correo_institucional = 'myrna.juarez@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 8742278-K - BURGOS HERNANDEZ ADRIANA FRANCISCA
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'adriana.burgos@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'adriana.burgos@andaliensur.cl', 'ADRIANA FRANCISCA', 'BURGOS HERNANDEZ', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'adriana.burgos@andaliensur.cl') WHERE correo_institucional = 'adriana.burgos@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 8815081-3 - RAMIREZ QUINTEROS INES TERESA
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'ines.ramirez@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'ines.ramirez@andaliensur.cl', 'INES TERESA', 'RAMIREZ QUINTEROS', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'ines.ramirez@andaliensur.cl') WHERE correo_institucional = 'ines.ramirez@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 8874969-3 - CISTERNAS RIFFO MARTA ELENA
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'marta.cisternas@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'marta.cisternas@andaliensur.cl', 'MARTA ELENA', 'CISTERNAS RIFFO', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'marta.cisternas@andaliensur.cl') WHERE correo_institucional = 'marta.cisternas@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 8885852-2 - SOTO BANAREZ NILSA
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'nilsa.sotob@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'nilsa.sotob@andaliensur.cl', 'NILSA', 'SOTO BANAREZ', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'nilsa.sotob@andaliensur.cl') WHERE correo_institucional = 'nilsa.sotob@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 8915430-8 - VIDAL ROMERO FRANCISCA
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'francisca.vidal@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'francisca.vidal@andaliensur.cl', 'FRANCISCA', 'VIDAL ROMERO', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'francisca.vidal@andaliensur.cl') WHERE correo_institucional = 'francisca.vidal@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 9045521-4 - FIGUEROA GUTIERREZ MIGUEL ANGEL
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'miguel.figueroa@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'miguel.figueroa@andaliensur.cl', 'MIGUEL ANGEL', 'FIGUEROA GUTIERREZ', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'miguel.figueroa@andaliensur.cl') WHERE correo_institucional = 'miguel.figueroa@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 9055626-6 - VALLEJOS AVILA PILAR CARMEN
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'pilar.vallejos@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'pilar.vallejos@andaliensur.cl', 'PILAR CARMEN', 'VALLEJOS AVILA', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'pilar.vallejos@andaliensur.cl') WHERE correo_institucional = 'pilar.vallejos@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 9209703-K - JARA ARANCIBIA PATRICIA ROXANA
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'patricia.jara@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'patricia.jara@andaliensur.cl', 'PATRICIA ROXANA', 'JARA ARANCIBIA', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'patricia.jara@andaliensur.cl') WHERE correo_institucional = 'patricia.jara@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 9273690-3 - GALLEGOS HOTT ELBA PATRICIA
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'elba.gallegos@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'elba.gallegos@andaliensur.cl', 'ELBA PATRICIA', 'GALLEGOS HOTT', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'elba.gallegos@andaliensur.cl') WHERE correo_institucional = 'elba.gallegos@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 9420823-8 - DEL VALLE CARRASCO MARIA CECILIA
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'maria.delvalle@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'maria.delvalle@andaliensur.cl', 'MARIA CECILIA', 'DEL VALLE CARRASCO', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'maria.delvalle@andaliensur.cl') WHERE correo_institucional = 'maria.delvalle@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 9425988-6 - GAVILAN SANHUEZA JESSICA ADELA
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'jessica.gavilans@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'jessica.gavilans@andaliensur.cl', 'JESSICA ADELA', 'GAVILAN SANHUEZA', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'jessica.gavilans@andaliensur.cl') WHERE correo_institucional = 'jessica.gavilans@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 9441871-2 - VASQUEZ SANTIBANEZ MARIA ELENA
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'maria.vasquezs@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'maria.vasquezs@andaliensur.cl', 'MARIA ELENA', 'VASQUEZ SANTIBANEZ', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'maria.vasquezs@andaliensur.cl') WHERE correo_institucional = 'maria.vasquezs@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 9451581-5 - PIÑEIRO JELDRES CLAUDINA ISABEL
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'claudina.pineiro@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'claudina.pineiro@andaliensur.cl', 'CLAUDINA ISABEL', 'PIÑEIRO JELDRES', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'claudina.pineiro@andaliensur.cl') WHERE correo_institucional = 'claudina.pineiro@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 9459793-5 - HERMOSILLA SOLIS SOFIA ANGELICA
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'sofia.hermosillas@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'sofia.hermosillas@andaliensur.cl', 'SOFIA ANGELICA', 'HERMOSILLA SOLIS', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'sofia.hermosillas@andaliensur.cl') WHERE correo_institucional = 'sofia.hermosillas@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 9531260-8 - CARRILLO RIVAS MARITZA IVON
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'maritza.carrillor@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'maritza.carrillor@andaliensur.cl', 'MARITZA IVON', 'CARRILLO RIVAS', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'maritza.carrillor@andaliensur.cl') WHERE correo_institucional = 'maritza.carrillor@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 9822943-4 - NAVARRETE ARAYA MARIA ISABEL
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'maria.navarretea@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'maria.navarretea@andaliensur.cl', 'MARIA ISABEL', 'NAVARRETE ARAYA', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'maria.navarretea@andaliensur.cl') WHERE correo_institucional = 'maria.navarretea@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 9945178-5 - VILLAGRAN MOLINA JESSICA DEL CARMEN
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'jessica.villagranm@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'jessica.villagranm@andaliensur.cl', 'DEL CARMEN', 'VILLAGRAN MOLINA JESSICA', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'jessica.villagranm@andaliensur.cl') WHERE correo_institucional = 'jessica.villagranm@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 10013370-9 - RIVEROS PEREZ SANDRA PAMELA
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'sandra.riverosp@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'sandra.riverosp@andaliensur.cl', 'SANDRA PAMELA', 'RIVEROS PEREZ', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'sandra.riverosp@andaliensur.cl') WHERE correo_institucional = 'sandra.riverosp@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 10308656-6 - PEREZ LIENCURA FRANCISCA BEATRIZ
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'francisca.perez@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'francisca.perez@andaliensur.cl', 'FRANCISCA BEATRIZ', 'PEREZ LIENCURA', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'francisca.perez@andaliensur.cl') WHERE correo_institucional = 'francisca.perez@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 10316047-2 - LAGOS VIVANCO SUSANA JACQUELINE
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'susana.lagosv@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'susana.lagosv@andaliensur.cl', 'SUSANA JACQUELINE', 'LAGOS VIVANCO', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'susana.lagosv@andaliensur.cl') WHERE correo_institucional = 'susana.lagosv@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 10332658-3 - PEDRERO PALMA PATRICIA XIMENA
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'patricia.pedrero@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'patricia.pedrero@andaliensur.cl', 'PATRICIA XIMENA', 'PEDRERO PALMA', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'patricia.pedrero@andaliensur.cl') WHERE correo_institucional = 'patricia.pedrero@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 10717936-4 - ALBORNOZ NUÑEZ MARIA GABRIELA
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'maria.albornoz@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'maria.albornoz@andaliensur.cl', 'MARIA GABRIELA', 'ALBORNOZ NUÑEZ', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'maria.albornoz@andaliensur.cl') WHERE correo_institucional = 'maria.albornoz@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 10950365-7 - FUENTES GARRIDO MARTA EMILIA
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'marta.fuentesg@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'marta.fuentesg@andaliensur.cl', 'MARTA EMILIA', 'FUENTES GARRIDO', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'marta.fuentesg@andaliensur.cl') WHERE correo_institucional = 'marta.fuentesg@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 11290932-K - GALLARDO ZAPATA IRENE INGRID
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'irene.gallardoz@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'irene.gallardoz@andaliensur.cl', 'IRENE INGRID', 'GALLARDO ZAPATA', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'irene.gallardoz@andaliensur.cl') WHERE correo_institucional = 'irene.gallardoz@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 11729321-1 - CONTRERAS CERON MARIO ALEXIS
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'mario.contreras@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'mario.contreras@andaliensur.cl', 'MARIO ALEXIS', 'CONTRERAS CERON', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'mario.contreras@andaliensur.cl') WHERE correo_institucional = 'mario.contreras@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 11959953-9 - MENDOZA TORRES MARIA ISABEL
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'maria.mendozat@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'maria.mendozat@andaliensur.cl', 'MARIA ISABEL', 'MENDOZA TORRES', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'maria.mendozat@andaliensur.cl') WHERE correo_institucional = 'maria.mendozat@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 12020242-1 - PALMA TAPIA CARMEN CAROL
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'carmen.palmat@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'carmen.palmat@andaliensur.cl', 'CARMEN CAROL', 'PALMA TAPIA', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'carmen.palmat@andaliensur.cl') WHERE correo_institucional = 'carmen.palmat@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 12300104-4 - PAREDES MONARES ALEX EDUARD
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'alex.paredesm@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'alex.paredesm@andaliensur.cl', 'ALEX EDUARD', 'PAREDES MONARES', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'alex.paredesm@andaliensur.cl') WHERE correo_institucional = 'alex.paredesm@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 12919306-9 - BELMAR BUSTOS JESSICA ANDREA
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'jessica.belmar@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'jessica.belmar@andaliensur.cl', 'JESSICA ANDREA', 'BELMAR BUSTOS', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'jessica.belmar@andaliensur.cl') WHERE correo_institucional = 'jessica.belmar@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 12971254-6 - CAMAÑO CISTERNA ROSSY PAMELA
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'rossy.camano@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'rossy.camano@andaliensur.cl', 'ROSSY PAMELA', 'CAMAÑO CISTERNA', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'rossy.camano@andaliensur.cl') WHERE correo_institucional = 'rossy.camano@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 12975610-1 - TRONCOSO MONSALVE NERCISA DE LAS MERCEDES
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'mercedes.troncosom@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'mercedes.troncosom@andaliensur.cl', 'LAS MERCEDES', 'TRONCOSO MONSALVE NERCISA DE', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'mercedes.troncosom@andaliensur.cl') WHERE correo_institucional = 'mercedes.troncosom@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 13105347-9 - ESTRADA OBREQUE CRISTIAN RODRIGO
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'cristian.estrada@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'cristian.estrada@andaliensur.cl', 'CRISTIAN RODRIGO', 'ESTRADA OBREQUE', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'cristian.estrada@andaliensur.cl') WHERE correo_institucional = 'cristian.estrada@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 13312214-1 - AGUILAR SAEZ YOHANA ESTELA
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'yohana.aguilar@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'yohana.aguilar@andaliensur.cl', 'YOHANA ESTELA', 'AGUILAR SAEZ', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'yohana.aguilar@andaliensur.cl') WHERE correo_institucional = 'yohana.aguilar@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 13954855-8 - FIGUEROA SANHUEZA ALFONSO DAVID
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'alfonso.figueroa@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'alfonso.figueroa@andaliensur.cl', 'ALFONSO DAVID', 'FIGUEROA SANHUEZA', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'alfonso.figueroa@andaliensur.cl') WHERE correo_institucional = 'alfonso.figueroa@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 14030301-1 - ORTEGA BERTIN ISABEL ANDREA
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'isabel.ortega@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'isabel.ortega@andaliensur.cl', 'ISABEL ANDREA', 'ORTEGA BERTIN', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'isabel.ortega@andaliensur.cl') WHERE correo_institucional = 'isabel.ortega@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 14280179-5 - MANRIQUEZ GARAY ANA ANGELICA
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'ana.manriquezg@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'ana.manriquezg@andaliensur.cl', 'ANA ANGELICA', 'MANRIQUEZ GARAY', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'ana.manriquezg@andaliensur.cl') WHERE correo_institucional = 'ana.manriquezg@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 15222624-1 - HERNANDEZ CONTRERAS ROMMY VALENTINA
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'rommy.hernandezc@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'rommy.hernandezc@andaliensur.cl', 'ROMMY VALENTINA', 'HERNANDEZ CONTRERAS', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'rommy.hernandezc@andaliensur.cl') WHERE correo_institucional = 'rommy.hernandezc@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 15223858-4 - VIVEROS ITURRIA KAREN ANDREA
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'karen.viverosi@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'karen.viverosi@andaliensur.cl', 'KAREN ANDREA', 'VIVEROS ITURRIA', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'karen.viverosi@andaliensur.cl') WHERE correo_institucional = 'karen.viverosi@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 15551133-8 - FAJARDO BERNAL MARIA FERNANDA
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'fernanda.fajardo@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'fernanda.fajardo@andaliensur.cl', 'MARIA FERNANDA', 'FAJARDO BERNAL', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'fernanda.fajardo@andaliensur.cl') WHERE correo_institucional = 'fernanda.fajardo@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 15617229-4 - SAN MARTIN ESPINOZA PAMELA
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'pamela.sanmartin@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'pamela.sanmartin@andaliensur.cl', 'ESPINOZA PAMELA', 'SAN MARTIN', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'pamela.sanmartin@andaliensur.cl') WHERE correo_institucional = 'pamela.sanmartin@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 15659249-8 - REYES VELÁSQUEZ NATALIA GUISELA
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'natalia.reyes@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'natalia.reyes@andaliensur.cl', 'NATALIA GUISELA', 'REYES VELÁSQUEZ', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'natalia.reyes@andaliensur.cl') WHERE correo_institucional = 'natalia.reyes@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 15671518-2 - MOYA DIAZ WENDY ELIZABETH
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'wendy.moya@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'wendy.moya@andaliensur.cl', 'WENDY ELIZABETH', 'MOYA DIAZ', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'wendy.moya@andaliensur.cl') WHERE correo_institucional = 'wendy.moya@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 15684482-9 - ZEPEDA REBOLLEDO MOISES SEBASTIAN
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'moises.zepedar@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'moises.zepedar@andaliensur.cl', 'MOISES SEBASTIAN', 'ZEPEDA REBOLLEDO', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'moises.zepedar@andaliensur.cl') WHERE correo_institucional = 'moises.zepedar@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 15945642-0 - GODOY CHANQUEO JOAN NATHALIE
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'joan.godoy@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'joan.godoy@andaliensur.cl', 'JOAN NATHALIE', 'GODOY CHANQUEO', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'joan.godoy@andaliensur.cl') WHERE correo_institucional = 'joan.godoy@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 16154002-1 - ARRAU VALENZUELA ELVIRA ROSARIO
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'elvira.arrau@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'elvira.arrau@andaliensur.cl', 'ELVIRA ROSARIO', 'ARRAU VALENZUELA', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'elvira.arrau@andaliensur.cl') WHERE correo_institucional = 'elvira.arrau@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 16167809-0 - SILVA OSORES FLOR CRISTINA
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'flor.silva@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'flor.silva@andaliensur.cl', 'FLOR CRISTINA', 'SILVA OSORES', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'flor.silva@andaliensur.cl') WHERE correo_institucional = 'flor.silva@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 16404511-0 - ROA ALARCON SUSANA ANDREA
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'susana.roa.a@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'susana.roa.a@andaliensur.cl', 'SUSANA ANDREA', 'ROA ALARCON', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'susana.roa.a@andaliensur.cl') WHERE correo_institucional = 'susana.roa.a@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 16807993-1 - SAEZ RIVERA YASNA VERONICA
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'yasna.saez@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'yasna.saez@andaliensur.cl', 'YASNA VERONICA', 'SAEZ RIVERA', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'yasna.saez@andaliensur.cl') WHERE correo_institucional = 'yasna.saez@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 17320802-2 - OPORTUS CUEVAS ANA PAULINA
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'ana.oportus@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'ana.oportus@andaliensur.cl', 'ANA PAULINA', 'OPORTUS CUEVAS', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'ana.oportus@andaliensur.cl') WHERE correo_institucional = 'ana.oportus@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 17349749-0 - LAGOS RIFFO VIVIANA BELEN
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'viviana.lagos@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'viviana.lagos@andaliensur.cl', 'VIVIANA BELEN', 'LAGOS RIFFO', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'viviana.lagos@andaliensur.cl') WHERE correo_institucional = 'viviana.lagos@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 17571181-3 - FERNANDEZ HORMAZABAL HERNAN BENITO
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'hernan.fernandezh@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'hernan.fernandezh@andaliensur.cl', 'HERNAN BENITO', 'FERNANDEZ HORMAZABAL', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'hernan.fernandezh@andaliensur.cl') WHERE correo_institucional = 'hernan.fernandezh@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 17573711-1 - CORDOVA ACOSTA VALESKA MARIA
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'valeska.cordova@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'valeska.cordova@andaliensur.cl', 'VALESKA MARIA', 'CORDOVA ACOSTA', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'valeska.cordova@andaliensur.cl') WHERE correo_institucional = 'valeska.cordova@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 17574529-7 - SEPULVEDA QUIJADA CAMILA CONSTANZA
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'camila.sepulvedaq@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'camila.sepulvedaq@andaliensur.cl', 'CAMILA CONSTANZA', 'SEPULVEDA QUIJADA', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'camila.sepulvedaq@andaliensur.cl') WHERE correo_institucional = 'camila.sepulvedaq@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 17614158-1 - OROZCO VILUGRÓN VICTOR IGNACIO
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'victor.orozco@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'victor.orozco@andaliensur.cl', 'VICTOR IGNACIO', 'OROZCO VILUGRÓN', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'victor.orozco@andaliensur.cl') WHERE correo_institucional = 'victor.orozco@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 17841707-K - DEDIAZY CARTES MICHEL ALEXANDRA
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'michel.dediazy@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'michel.dediazy@andaliensur.cl', 'MICHEL ALEXANDRA', 'DEDIAZY CARTES', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'michel.dediazy@andaliensur.cl') WHERE correo_institucional = 'michel.dediazy@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 17900874-2 - INOSTROZA ACUÑA BARBARA BELEN
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'barbara.inostroza@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'barbara.inostroza@andaliensur.cl', 'BARBARA BELEN', 'INOSTROZA ACUÑA', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'barbara.inostroza@andaliensur.cl') WHERE correo_institucional = 'barbara.inostroza@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 18197364-1 - JARA RUIZ BASTHIAN ABELARDO
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'basthian.jara@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'basthian.jara@andaliensur.cl', 'BASTHIAN ABELARDO', 'JARA RUIZ', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'basthian.jara@andaliensur.cl') WHERE correo_institucional = 'basthian.jara@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 18808535-0 - VASQUEZ NORIEGA CAMILA FERNANDA
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'camila.vasquez@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'camila.vasquez@andaliensur.cl', 'CAMILA FERNANDA', 'VASQUEZ NORIEGA', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'camila.vasquez@andaliensur.cl') WHERE correo_institucional = 'camila.vasquez@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 18845952-8 - VALLEJOS RIQUELME VICTOR MANUEL
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'victor.vallejos@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'victor.vallejos@andaliensur.cl', 'VICTOR MANUEL', 'VALLEJOS RIQUELME', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'victor.vallejos@andaliensur.cl') WHERE correo_institucional = 'victor.vallejos@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 18978726-K - CASTILLO PRADENA MATIAS EXEQUIEL
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'matias.castillo@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'matias.castillo@andaliensur.cl', 'MATIAS EXEQUIEL', 'CASTILLO PRADENA', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'matias.castillo@andaliensur.cl') WHERE correo_institucional = 'matias.castillo@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 19109580-4 - POBLETE CASTILLO VICTORIA SCARLETT
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'victoria.poblete@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'victoria.poblete@andaliensur.cl', 'VICTORIA SCARLETT', 'POBLETE CASTILLO', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'victoria.poblete@andaliensur.cl') WHERE correo_institucional = 'victoria.poblete@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 19599559-1 - JOFRÉ MENDOZA VICTORIA BELÉN
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'victoria.jofre@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'victoria.jofre@andaliensur.cl', 'VICTORIA BELÉN', 'JOFRÉ MENDOZA', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'victoria.jofre@andaliensur.cl') WHERE correo_institucional = 'victoria.jofre@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  -- 19686066-5 - VEGA OJEDA BENJAMIN MATIAS
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'benjamin.vega@andaliensur.cl') THEN
    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)
    VALUES (gen_random_uuid()::text, 'benjamin.vega@andaliensur.cl', 'BENJAMIN MATIAS', 'VEGA OJEDA', 'PROFESOR', v_establecimiento, true);
    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = 'benjamin.vega@andaliensur.cl') WHERE correo_institucional = 'benjamin.vega@andaliensur.cl';
    v_count := v_count + 1;
  END IF;

  RAISE NOTICE 'Usuarios creados: %', v_count;
END $$;

-- Verificar
SELECT COUNT(*) AS total FROM public.usuarios WHERE email LIKE '%andaliensur.cl';