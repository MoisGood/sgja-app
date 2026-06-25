import json

with open('colaboradores.json', encoding='utf-8') as f:
    data = json.load(f)

print(f'Total: {len(data)} registros\n')

for item in data[:5]:
    print(f'  {item["id"]:>8} | {item["rut"]:>15} | {item["nombre"][:35]:35s} | {item["email"][:30]:30s} | Activo: {item["activo"]}')

con_email = sum(1 for d in data if d['email'])
activos = sum(1 for d in data if d['activo'] == 'Si')
print(f'\nCon email: {con_email} | Activos en Google: {activos}')
