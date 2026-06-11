-- ============================================================
-- Insertar colaboradores que no existen en funcionarios
-- Generado desde colaboradores_seleccionados.csv
-- Ejecutar en SQL Editor de Supabase Dashboard
-- ============================================================

CREATE OR REPLACE FUNCTION public.importar_colaborador(
  p_rut text,
  p_rut_formateado text,
  p_nombre_completo text,
  p_correo_institucional text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existente record;
BEGIN
  SELECT rut, correo_institucional INTO v_existente
  FROM funcionarios
  WHERE rut = p_rut OR correo_institucional = p_correo_institucional
  LIMIT 1;

  IF v_existente IS NOT NULL THEN
    UPDATE funcionarios
    SET nombre_completo = p_nombre_completo,
        correo_institucional = p_correo_institucional,
        actualizado_en = NOW()
    WHERE rut = v_existente.rut;
    RETURN jsonb_build_object('accion', 'actualizado', 'rut', v_existente.rut);
  ELSE
    INSERT INTO funcionarios (
      rut, rut_formateado, nombre_completo,
      domicilio, comuna, celular,
      correo_personal, correo_institucional,
      tipo_funcionario, tipo_contrato,
      vigente, creado_en, actualizado_en
    ) VALUES (
      p_rut, p_rut_formateado, p_nombre_completo,
      'S/D', 'S/D', 'S/D',
      p_correo_institucional, p_correo_institucional,
      'otro', 'plazo_fijo',
      true, NOW(), NOW()
    );
    RETURN jsonb_build_object('accion', 'insertado', 'rut', p_rut);
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.importar_colaborador TO authenticated;

-- ============================================================
-- Insertar cada colaborador
-- ============================================================

SELECT public.importar_colaborador('6468574-0', '6468574-0', 'SANCHEZ MERINO LUIS ALEJO', 'luis.sanchezm@andaliensur.cl'); -- 6468574-0
SELECT public.importar_colaborador('6476558-2', '6476558-2', 'PINO VALENZUELA CARLOS RENE', 'carlos.pinov@andaliensur.cl'); -- 6476558-2
SELECT public.importar_colaborador('7330667-1', '7330667-1', 'JIMÉNEZ RAMÍREZ ALICIA EUGENIA', 'alicia.jimenezr@andaliensur.cl'); -- 7330667-1
SELECT public.importar_colaborador('7457465-3', '7457465-3', 'VELOSO FREDES OSCAR ARMANDO', 'oscar.velosof@andaliensur.cl'); -- 7457465-3
SELECT public.importar_colaborador('7703303-3', '7703303-3', 'URIBE URIBE LUIS ANTONIO', 'luis.uribe@andaliensur.cl'); -- 7703303-3
SELECT public.importar_colaborador('7707660-3', '7707660-3', 'ARAVENA ORMEÑO BERNARDO DEL TRÁNSITO', 'bernardo.aravena@andaliensur.cl'); -- 7707660-3
SELECT public.importar_colaborador('7874741-2', '7874741-2', 'ZAPATA AEDO ISABEL MAGALY', 'isabel.zapataa@andaliensur.cl'); -- 7874741-2
SELECT public.importar_colaborador('8209213-7', '8209213-7', 'CAUTIVO BALTIERRA ELENA DEL CARMEN', 'elena.cautivo@andaliensur.cl'); -- 8209213-7
SELECT public.importar_colaborador('8232443-7', '8232443-7', 'ARIAS FRIZ BERNARDA SONIA', 'bernarda.ariasf@andaliensur.cl'); -- 8232443-7
SELECT public.importar_colaborador('8419936-2', '8419936-2', 'JUAREZ VALLADARES MYRNA LORENA', 'myrna.juarez@andaliensur.cl'); -- 8419936-2
SELECT public.importar_colaborador('8742278-K', '8742278-K', 'BURGOS HERNANDEZ ADRIANA FRANCISCA', 'adriana.burgos@andaliensur.cl'); -- 8742278-K
SELECT public.importar_colaborador('8815081-3', '8815081-3', 'RAMIREZ QUINTEROS INES TERESA', 'ines.ramirez@andaliensur.cl'); -- 8815081-3
SELECT public.importar_colaborador('8874969-3', '8874969-3', 'CISTERNAS RIFFO MARTA ELENA', 'marta.cisternas@andaliensur.cl'); -- 8874969-3
SELECT public.importar_colaborador('8885852-2', '8885852-2', 'SOTO BANAREZ NILSA', 'nilsa.sotob@andaliensur.cl'); -- 8885852-2
SELECT public.importar_colaborador('8915430-8', '8915430-8', 'VIDAL ROMERO FRANCISCA', 'francisca.vidal@andaliensur.cl'); -- 8915430-8
SELECT public.importar_colaborador('9045521-4', '9045521-4', 'FIGUEROA GUTIERREZ MIGUEL ANGEL', 'miguel.figueroa@andaliensur.cl'); -- 9045521-4
SELECT public.importar_colaborador('9055626-6', '9055626-6', 'VALLEJOS AVILA PILAR CARMEN', 'pilar.vallejos@andaliensur.cl'); -- 9055626-6
SELECT public.importar_colaborador('9209703-K', '9209703-K', 'JARA ARANCIBIA PATRICIA ROXANA', 'patricia.jara@andaliensur.cl'); -- 9209703-K
SELECT public.importar_colaborador('9273690-3', '9273690-3', 'GALLEGOS HOTT ELBA PATRICIA', 'elba.gallegos@andaliensur.cl'); -- 9273690-3
SELECT public.importar_colaborador('9420823-8', '9420823-8', 'DEL VALLE CARRASCO MARIA CECILIA', 'maria.delvalle@andaliensur.cl'); -- 9420823-8
SELECT public.importar_colaborador('9425988-6', '9425988-6', 'GAVILAN SANHUEZA JESSICA ADELA', 'jessica.gavilans@andaliensur.cl'); -- 9425988-6
SELECT public.importar_colaborador('9441871-2', '9441871-2', 'VASQUEZ SANTIBANEZ MARIA ELENA', 'maria.vasquezs@andaliensur.cl'); -- 9441871-2
SELECT public.importar_colaborador('9451581-5', '9451581-5', 'PIÑEIRO JELDRES CLAUDINA ISABEL', 'claudina.pineiro@andaliensur.cl'); -- 9451581-5
SELECT public.importar_colaborador('9459793-5', '9459793-5', 'HERMOSILLA SOLIS SOFIA ANGELICA', 'sofia.hermosillas@andaliensur.cl'); -- 9459793-5
SELECT public.importar_colaborador('9531260-8', '9531260-8', 'CARRILLO RIVAS MARITZA IVON', 'maritza.carrillor@andaliensur.cl'); -- 9531260-8
SELECT public.importar_colaborador('9822943-4', '9822943-4', 'NAVARRETE ARAYA MARIA ISABEL', 'maria.navarretea@andaliensur.cl'); -- 9822943-4
SELECT public.importar_colaborador('9945178-5', '9945178-5', 'VILLAGRAN MOLINA JESSICA DEL CARMEN', 'jessica.villagranm@andaliensur.cl'); -- 9945178-5
SELECT public.importar_colaborador('10013370-9', '10013370-9', 'RIVEROS PEREZ SANDRA PAMELA', 'sandra.riverosp@andaliensur.cl'); -- 10013370-9
SELECT public.importar_colaborador('10308656-6', '10308656-6', 'PEREZ LIENCURA FRANCISCA BEATRIZ', 'francisca.perez@andaliensur.cl'); -- 10308656-6
SELECT public.importar_colaborador('10316047-2', '10316047-2', 'LAGOS VIVANCO SUSANA JACQUELINE', 'susana.lagosv@andaliensur.cl'); -- 10316047-2
SELECT public.importar_colaborador('10332658-3', '10332658-3', 'PEDRERO PALMA PATRICIA XIMENA', 'patricia.pedrero@andaliensur.cl'); -- 10332658-3
SELECT public.importar_colaborador('10717936-4', '10717936-4', 'ALBORNOZ NUÑEZ MARIA GABRIELA', 'maria.albornoz@andaliensur.cl'); -- 10717936-4
SELECT public.importar_colaborador('10950365-7', '10950365-7', 'FUENTES GARRIDO MARTA EMILIA', 'marta.fuentesg@andaliensur.cl'); -- 10950365-7
SELECT public.importar_colaborador('11290932-K', '11290932-K', 'GALLARDO ZAPATA IRENE INGRID', 'irene.gallardoz@andaliensur.cl'); -- 11290932-K
SELECT public.importar_colaborador('11729321-1', '11729321-1', 'CONTRERAS CERON MARIO ALEXIS', 'mario.contreras@andaliensur.cl'); -- 11729321-1
SELECT public.importar_colaborador('11959953-9', '11959953-9', 'MENDOZA TORRES MARIA ISABEL', 'maria.mendozat@andaliensur.cl'); -- 11959953-9
SELECT public.importar_colaborador('12020242-1', '12020242-1', 'PALMA TAPIA CARMEN CAROL', 'carmen.palmat@andaliensur.cl'); -- 12020242-1
SELECT public.importar_colaborador('12300104-4', '12300104-4', 'PAREDES MONARES ALEX EDUARD', 'alex.paredesm@andaliensur.cl'); -- 12300104-4
SELECT public.importar_colaborador('12919306-9', '12919306-9', 'BELMAR BUSTOS JESSICA ANDREA', 'jessica.belmar@andaliensur.cl'); -- 12919306-9
SELECT public.importar_colaborador('12971254-6', '12971254-6', 'CAMAÑO CISTERNA ROSSY PAMELA', 'rossy.camano@andaliensur.cl'); -- 12971254-6
SELECT public.importar_colaborador('12975610-1', '12975610-1', 'TRONCOSO MONSALVE NERCISA DE LAS MERCEDES', 'mercedes.troncosom@andaliensur.cl'); -- 12975610-1
SELECT public.importar_colaborador('13105347-9', '13105347-9', 'ESTRADA OBREQUE CRISTIAN RODRIGO', 'cristian.estrada@andaliensur.cl'); -- 13105347-9
SELECT public.importar_colaborador('13312214-1', '13312214-1', 'AGUILAR SAEZ YOHANA ESTELA', 'yohana.aguilar@andaliensur.cl'); -- 13312214-1
SELECT public.importar_colaborador('13954855-8', '13954855-8', 'FIGUEROA SANHUEZA ALFONSO DAVID', 'alfonso.figueroa@andaliensur.cl'); -- 13954855-8
SELECT public.importar_colaborador('14030301-1', '14030301-1', 'ORTEGA BERTIN ISABEL ANDREA', 'isabel.ortega@andaliensur.cl'); -- 14030301-1
SELECT public.importar_colaborador('14280179-5', '14280179-5', 'MANRIQUEZ GARAY ANA ANGELICA', 'ana.manriquezg@andaliensur.cl'); -- 14280179-5
SELECT public.importar_colaborador('15222624-1', '15222624-1', 'HERNANDEZ CONTRERAS ROMMY VALENTINA', 'rommy.hernandezc@andaliensur.cl'); -- 15222624-1
SELECT public.importar_colaborador('15223858-4', '15223858-4', 'VIVEROS ITURRIA KAREN ANDREA', 'karen.viverosi@andaliensur.cl'); -- 15223858-4
SELECT public.importar_colaborador('15551133-8', '15551133-8', 'FAJARDO BERNAL MARIA FERNANDA', 'fernanda.fajardo@andaliensur.cl'); -- 15551133-8
SELECT public.importar_colaborador('15617229-4', '15617229-4', 'SAN MARTIN ESPINOZA PAMELA', 'pamela.sanmartin@andaliensur.cl'); -- 15617229-4
SELECT public.importar_colaborador('15659249-8', '15659249-8', 'REYES VELÁSQUEZ NATALIA GUISELA', 'natalia.reyes@andaliensur.cl'); -- 15659249-8
SELECT public.importar_colaborador('15671518-2', '15671518-2', 'MOYA DIAZ WENDY ELIZABETH', 'wendy.moya@andaliensur.cl'); -- 15671518-2
SELECT public.importar_colaborador('15684482-9', '15684482-9', 'ZEPEDA REBOLLEDO MOISES SEBASTIAN', 'moises.zepedar@andaliensur.cl'); -- 15684482-9
SELECT public.importar_colaborador('15945642-0', '15945642-0', 'GODOY CHANQUEO JOAN NATHALIE', 'joan.godoy@andaliensur.cl'); -- 15945642-0
SELECT public.importar_colaborador('16154002-1', '16154002-1', 'ARRAU VALENZUELA ELVIRA ROSARIO', 'elvira.arrau@andaliensur.cl'); -- 16154002-1
SELECT public.importar_colaborador('16167809-0', '16167809-0', 'SILVA OSORES FLOR CRISTINA', 'flor.silva@andaliensur.cl'); -- 16167809-0
SELECT public.importar_colaborador('16404511-0', '16404511-0', 'ROA ALARCON SUSANA ANDREA', 'susana.roa.a@andaliensur.cl'); -- 16404511-0
SELECT public.importar_colaborador('16807993-1', '16807993-1', 'SAEZ RIVERA YASNA VERONICA', 'yasna.saez@andaliensur.cl'); -- 16807993-1
SELECT public.importar_colaborador('17320802-2', '17320802-2', 'OPORTUS CUEVAS ANA PAULINA', 'ana.oportus@andaliensur.cl'); -- 17320802-2
SELECT public.importar_colaborador('17349749-0', '17349749-0', 'LAGOS RIFFO VIVIANA BELEN', 'viviana.lagos@andaliensur.cl'); -- 17349749-0
SELECT public.importar_colaborador('17571181-3', '17571181-3', 'FERNANDEZ HORMAZABAL HERNAN BENITO', 'hernan.fernandezh@andaliensur.cl'); -- 17571181-3
SELECT public.importar_colaborador('17573711-1', '17573711-1', 'CORDOVA ACOSTA VALESKA MARIA', 'valeska.cordova@andaliensur.cl'); -- 17573711-1
SELECT public.importar_colaborador('17574529-7', '17574529-7', 'SEPULVEDA QUIJADA CAMILA CONSTANZA', 'camila.sepulvedaq@andaliensur.cl'); -- 17574529-7
SELECT public.importar_colaborador('17614158-1', '17614158-1', 'OROZCO VILUGRÓN VICTOR IGNACIO', 'victor.orozco@andaliensur.cl'); -- 17614158-1
SELECT public.importar_colaborador('17841707-K', '17841707-K', 'DEDIAZY CARTES MICHEL ALEXANDRA', 'michel.dediazy@andaliensur.cl'); -- 17841707-K
SELECT public.importar_colaborador('17900874-2', '17900874-2', 'INOSTROZA ACUÑA BARBARA BELEN', 'barbara.inostroza@andaliensur.cl'); -- 17900874-2
SELECT public.importar_colaborador('18197364-1', '18197364-1', 'JARA RUIZ BASTHIAN ABELARDO', 'basthian.jara@andaliensur.cl'); -- 18197364-1
SELECT public.importar_colaborador('18808535-0', '18808535-0', 'VASQUEZ NORIEGA CAMILA FERNANDA', 'camila.vasquez@andaliensur.cl'); -- 18808535-0
SELECT public.importar_colaborador('18845952-8', '18845952-8', 'VALLEJOS RIQUELME VICTOR MANUEL', 'victor.vallejos@andaliensur.cl'); -- 18845952-8
SELECT public.importar_colaborador('18978726-K', '18978726-K', 'CASTILLO PRADENA MATIAS EXEQUIEL', 'matias.castillo@andaliensur.cl'); -- 18978726-K
SELECT public.importar_colaborador('19109580-4', '19109580-4', 'POBLETE CASTILLO VICTORIA SCARLETT', 'victoria.poblete@andaliensur.cl'); -- 19109580-4
SELECT public.importar_colaborador('19599559-1', '19599559-1', 'JOFRÉ MENDOZA VICTORIA BELÉN', 'victoria.jofre@andaliensur.cl'); -- 19599559-1
SELECT public.importar_colaborador('19686066-5', '19686066-5', 'VEGA OJEDA BENJAMIN MATIAS', 'benjamin.vega@andaliensur.cl'); -- 19686066-5

-- Total: 73 registros