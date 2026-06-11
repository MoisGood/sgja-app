import csv, os
DIR = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(DIR, 'colaboradores_seleccionados.csv'), 'w', newline='', encoding='utf-8-sig') as f:
    w = csv.writer(f)
    w.writerow(['ID','Rut','Nombre','Email'])
    w.writerow(['1','12345678-9','TEST USUARIO EJEMPLO','test@example.com'])
print('CSV de prueba creado')
