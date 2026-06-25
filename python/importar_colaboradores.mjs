import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const csv = readFileSync(resolve(__dirname, 'colaboradores_seleccionados.csv'), 'utf-8');
const lines = csv.trim().split('\n').slice(1);
const rows = lines.map(line => {
  const parts = line.split(',');
  return {
    rut: parts[1],
    nombre: parts.slice(2, parts.length - 1).join(',').toUpperCase(),
    email: parts[parts.length - 1],
  };
});

console.log(`Total registros en CSV: ${rows.length}`);

const COLUMNS = 'rut, rut_formateado, nombre_completo, domicilio, comuna, celular, correo_personal, correo_institucional, tipo_funcionario, tipo_contrato, vigente, creado_en, actualizado_en';
const VALUES = `p_rut, p_rut_formateado, p_nombre_completo, 'S/D', 'S/D', 'S/D', p_correo_institucional, p_correo_institucional, 'otro', 'plazo_fijo', true, NOW(), NOW()`;

const sqlLines = [
  '-- ============================================================',
  '-- Insertar colaboradores que no existen en funcionarios',
  '-- Generado desde colaboradores_seleccionados.csv',
  '-- Ejecutar en SQL Editor de Supabase Dashboard',
  '-- ============================================================',
  '',
  'CREATE OR REPLACE FUNCTION public.importar_colaborador(',
  '  p_rut text,',
  '  p_rut_formateado text,',
  '  p_nombre_completo text,',
  '  p_correo_institucional text',
  ')',
  'RETURNS jsonb',
  'LANGUAGE plpgsql',
  'SECURITY DEFINER',
  'SET search_path = public',
  'AS $$',
  'DECLARE',
  '  v_existente record;',
  'BEGIN',
  '  SELECT rut, correo_institucional INTO v_existente',
  '  FROM funcionarios',
  '  WHERE rut = p_rut OR correo_institucional = p_correo_institucional',
  '  LIMIT 1;',
  '',
  '  IF v_existente IS NOT NULL THEN',
  '    UPDATE funcionarios',
  '    SET nombre_completo = p_nombre_completo,',
  '        correo_institucional = p_correo_institucional,',
  '        actualizado_en = NOW()',
  '    WHERE rut = v_existente.rut;',
  '    RETURN jsonb_build_object(\'accion\', \'actualizado\', \'rut\', v_existente.rut);',
  '  ELSE',
  '    INSERT INTO funcionarios (',
  '      rut, rut_formateado, nombre_completo,',
  '      domicilio, comuna, celular,',
  '      correo_personal, correo_institucional,',
  '      tipo_funcionario, tipo_contrato,',
  '      vigente, creado_en, actualizado_en',
  '    ) VALUES (',
  '      p_rut, p_rut_formateado, p_nombre_completo,',
  '      \'S/D\', \'S/D\', \'S/D\',',
  '      p_correo_institucional, p_correo_institucional,',
  '      \'otro\', \'plazo_fijo\',',
  '      true, NOW(), NOW()',
  '    );',
  '    RETURN jsonb_build_object(\'accion\', \'insertado\', \'rut\', p_rut);',
  '  END IF;',
  'END;',
  '$$;',
  '',
  'GRANT EXECUTE ON FUNCTION public.importar_colaborador TO authenticated;',
  '',
  '-- ============================================================',
  '-- Insertar cada colaborador',
  '-- ============================================================',
  '',
];

for (const r of rows) {
  const emailEscaped = r.email.replace(/'/g, "''");
  const nombreEscaped = r.nombre.replace(/'/g, "''");
  sqlLines.push(`SELECT public.importar_colaborador('${r.rut}', '${r.rut}', '${nombreEscaped}', '${emailEscaped}'); -- ${r.rut}`);
}

sqlLines.push('');
sqlLines.push(`-- Total: ${rows.length} registros`);

const outPath = resolve(__dirname, 'insertar_colaboradores.sql');
writeFileSync(outPath, sqlLines.join('\n'), 'utf-8');
console.log(`Script SQL generado: ${outPath}`);
console.log('');
console.log('Pasos:');
console.log('1. Ir a https://supabase.com/dashboard/project/iyxubvtfhcmlivivdfpt/sql/new');
console.log('2. Pegar el contenido del archivo');
console.log('3. Ejecutar');
