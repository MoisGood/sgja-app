import openpyxl
import os

nombres_scraper = [
    "CONTRERAS BALLESTEROS AIDA VERONICA",
    "BURGOS FIGUEROA LEONEL",
    "DEL CANTO ORTIZ SANDRA",
    "GALLEGUILLOS VALENZUELA MARIA CRISTINA",
    "VELOSO FREDES OSCAR ARMANDO",
    "CAUTIVO BALTIERRA ELENA DEL CARMEN",
]

def normalizar(s):
    import re
    return re.sub(r'\s+', ' ', s.lower().strip())

for fname in ["User_Download_09062026_202209_File.xlsx", "User_Download_09062026_202122_File.xlsx"]:
    path = os.path.join(os.path.dirname(__file__), fname)
    wb = openpyxl.load_workbook(path, read_only=True)
    ws = wb.active
    for i, row in enumerate(ws.iter_rows(values_only=True)):
        if i == 0:
            continue
        first = str(row[0] or '').strip()
        last = str(row[1] or '').strip()
        email = str(row[2] or '').strip()
        full_excel = normalizar(f"{first} {last}")
        full_inv = normalizar(f"{last} {first}")
        
        for nombre in nombres_scraper:
            n = normalizar(nombre)
            if n == full_excel or n == full_inv:
                print(f"✅ Match: '{nombre}' -> [{first}] [{last}] -> {email}")
            elif n.startswith(full_excel) or full_excel.startswith(n):
                print(f"~ PARCIAL: '{nombre}' ~= '{first} {last}' -> {email}")
    wb.close()
