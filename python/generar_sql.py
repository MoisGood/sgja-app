import csv, os, sys

DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(DIR, "colaboradores_seleccionados.csv")

def parsear_nombre(n):
    p = n.strip().split()
    if len(p) <= 2:
        return (p[-1] if len(p) >= 1 else '', p[0] if len(p) >= 1 else '')
    return (' '.join(p[2:]), ' '.join(p[:2]))

def escapar(s):
    return s.replace("'", "''")

if not os.path.exists(CSV_PATH):
    # Buscar en el directorio actual
    for f in os.listdir(DIR):
        if f.endswith('.csv') and 'seleccionado' in f.lower():
            CSV_PATH = os.path.join(DIR, f)
            break
    else:
        print("No se encuentra colaboradores_seleccionados.csv en python/")
        sys.exit(1)

print(f"Leyendo: {CSV_PATH}")

with open(CSV_PATH, encoding='utf-8-sig') as f:
    lines = [l.strip() for l in f if l.strip()]

if len(lines) < 2:
    print("CSV vacio")
    sys.exit(1)

header = lines[0].split(',')
idx_nombre = next((i for i, h in enumerate(header) if 'nombre' in h.lower()), -1)
idx_email = next((i for i, h in enumerate(header) if 'email' in h.lower() or 'correo' in h.lower()), -1)
idx_rut = next((i for i, h in enumerate(header) if 'rut' in h.lower()), -1)

if idx_nombre < 0 or idx_email < 0:
    print("CSV debe tener columnas: Nombre, Email")
    sys.exit(1)

sql_lines = []
sql_lines.append("-- ============================================================")
sql_lines.append("-- SQL generado para insertar solicitudes de registro")
sql_lines.append(f"-- Fuente: {os.path.basename(CSV_PATH)}")
sql_lines.append(f"-- Fecha: {__import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M')}")
sql_lines.append("-- ============================================================")
sql_lines.append("")
sql_lines.append("-- Ejecutar en Supabase SQL Editor")
sql_lines.append("")

total = 0
for i in range(1, len(lines)):
    cols = lines[i].split(',')
    if len(cols) <= max(idx_nombre, idx_email):
        continue
    nombre = cols[idx_nombre].strip()
    email = cols[idx_email].strip()
    if not nombre or not email:
        continue
    
    nombres, apellidos = parsear_nombre(nombre)
    uid = email  # usamos email como uid
    
    sql_lines.append(f"INSERT INTO solicitudes_registro (uid, nombre, apellidos, correo, estado)")
    sql_lines.append(f"VALUES ('{escapar(uid)}', '{escapar(nombres)}', '{escapar(apellidos)}', '{escapar(email)}', 'pendiente')")
    sql_lines.append(f"ON CONFLICT (uid) DO NOTHING;")
    sql_lines.append("")
    total += 1

sql_lines.append(f"-- Total: {total} registros")

sql_path = os.path.join(DIR, "insertar_solicitudes.sql")
with open(sql_path, "w", encoding="utf-8") as f:
    f.write('\n'.join(sql_lines))

print(f"\nSQL generado: {sql_path}")
print(f"Registros: {total}")
print("\nPara usar:")
print(f"1. Abri Supabase Dashboard -> SQL Editor")
print(f"2. Copia y pega el contenido de {os.path.basename(sql_path)}")
print(f"3. Ejecutalo")
