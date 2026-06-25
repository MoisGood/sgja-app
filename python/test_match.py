import json
import openpyxl
import os
import re

def normalizar(s):
    return re.sub(r'\s+', ' ', s.lower().strip())

def cargar_emails_desde_excel():
    email_map = {}
    activos_map = {}
    
    for fname in ["User_Download_09062026_202209_File.xlsx", "User_Download_09062026_202122_File.xlsx"]:
        path = os.path.join(os.path.dirname(__file__), fname)
        if not os.path.exists(path):
            continue
        wb = openpyxl.load_workbook(path, read_only=True)
        ws = wb.active
        for i, row in enumerate(ws.iter_rows(values_only=True)):
            if i == 0:
                continue
            first = str(row[0] or '').strip()
            last = str(row[1] or '').strip()
            email = str(row[2] or '').strip()
            status = str(row[3] or '').strip()
            if email and first and last:
                # Guardar con nombre normalizado combinado
                nombre_completo = normalizar(f"{first} {last}")
                # Tambien guardar con apellido + nombre invertido (formato chileno)
                nombre_invertido = normalizar(f"{last} {first}")
                email_map[nombre_completo] = email
                email_map[nombre_invertido] = email
                activos_map[nombre_completo] = (status.lower() == 'active')
                activos_map[nombre_invertido] = (status.lower() == 'active')
        wb.close()
    return email_map, activos_map

email_map, activos_map = cargar_emails_desde_excel()

with open('colaboradores.json', encoding='utf-8') as f:
    data = json.load(f)

print(f"Total: {len(data)} registros\n")
coincidencias = 0

for item in data[:20]:
    nombre_norm = normalizar(item['nombre'])
    email = email_map.get(nombre_norm, '')
    if email:
        coincidencias += 1
        print(f'  ✅ {item["nombre"][:40]:40s} -> {email}')
    else:
        print(f'  ❌ {item["nombre"][:40]:40s} -> SIN COINCIDENCIA')

print(f"\nCoincidencias: {coincidencias}/{len(data[:20])}")
