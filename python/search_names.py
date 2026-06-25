import openpyxl
import os

nombres = ["CONTRE", "AIDA", "VERONICA", "BURGOS", "LEONEL", "SANDRA", "MARIA", "CRISTINA"]

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
        full = f"{first} {last}".lower()
        for n in nombres:
            if n.lower() in full:
                print(f"'{n}' encontrado en: [{first}] [{last}] -> {email}")
    wb.close()
