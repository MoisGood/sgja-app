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

function separarNombre(nombreCompleto) {
  const partes = nombreCompleto.trim().split(/\s+/);
  const len = partes.length;
  if (len >= 4) {
    // Últimas 2 = nombres, resto = apellidos
    return [partes.slice(len - 2).join(' '), partes.slice(0, len - 2).join(' ')];
  }
  if (len === 3) {
    return [partes[2], partes.slice(0, 2).join(' ')];
  }
  if (len === 2) {
    return [partes[1], partes[0]];
  }
  return [nombreCompleto, 'S/D'];
}

const sqlLines = [
  '-- ============================================================',
  '-- Crear usuarios directo desde colaboradores_seleccionados.csv',
  '-- Para funcionarios que no tienen cuenta en usuarios',
  '-- ============================================================',
  '',
  'DO $$',
  'DECLARE',
  '  v_establecimiento uuid;',
  '  v_count integer := 0;',
  '  v_nombre text;',
  '  v_apellidos text;',
  'BEGIN',
  "  SELECT id_establecimiento INTO v_establecimiento",
  "  FROM public.usuarios WHERE rol = 'ADMIN' AND id_establecimiento IS NOT NULL LIMIT 1;",
  '',
  '  IF v_establecimiento IS NULL THEN',
  "    RAISE EXCEPTION 'No hay admin con establecimiento para asignar';",
  '  END IF;',
  '',
];

for (const r of rows) {
  const [nombre, apellidos] = separarNombre(r.nombre);
  const emailEscaped = r.email.replace(/'/g, "''");
  const nombreEscaped = nombre.replace(/'/g, "''");
  const apellidosEscaped = apellidos.replace(/'/g, "''");

  sqlLines.push(`  -- ${r.rut} - ${r.nombre}`);
  sqlLines.push(`  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = '${emailEscaped}') THEN`);
  sqlLines.push(`    INSERT INTO public.usuarios (uid, email, nombre, apellidos, rol, id_establecimiento, activo)`);
  sqlLines.push(`    VALUES (gen_random_uuid()::text, '${emailEscaped}', '${nombreEscaped}', '${apellidosEscaped}', 'PROFESOR', v_establecimiento, true);`);
  sqlLines.push(`    UPDATE public.funcionarios SET id_usuario = (SELECT id FROM public.usuarios WHERE email = '${emailEscaped}') WHERE correo_institucional = '${emailEscaped}';`);
  sqlLines.push(`    v_count := v_count + 1;`);
  sqlLines.push(`  END IF;`);
  sqlLines.push('');
}

sqlLines.push("  RAISE NOTICE 'Usuarios creados: %', v_count;");
sqlLines.push('END $$;');
sqlLines.push('');
sqlLines.push("-- Verificar");
sqlLines.push("SELECT COUNT(*) AS total FROM public.usuarios WHERE email LIKE '%andaliensur.cl';");

const outPath = resolve(__dirname, 'crear_usuarios_desde_csv.sql');
writeFileSync(outPath, sqlLines.join('\n'), 'utf-8');
console.log(`SQL generado: ${outPath}`);
console.log('');
console.log('Ejecutar en: https://supabase.com/dashboard/project/iyxubvtfhcmlivivdfpt/sql/new');
