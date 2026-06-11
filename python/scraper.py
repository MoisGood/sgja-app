import asyncio
import json
import os
import re
from playwright.async_api import async_playwright
import openpyxl

USUARIO = "15684482"
CLAVE = "Supr3m02022"
DIR = os.path.dirname(os.path.abspath(__file__))
EXCEL_FILES = [
    "User_Download_09062026_202209_File.xlsx",
    "User_Download_09062026_202122_File.xlsx",
]

def normalizar(s):
    return re.sub(r'\s+', ' ', s.lower().strip())

def cargar_correos():
    """Retorna: set de todos los correos, y dict nombre_normalizado -> email"""
    todos = set()
    mapa = {}  # nombre_normalizado -> email
    for fname in EXCEL_FILES:
        path = os.path.join(DIR, fname)
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
            if email and first and last:
                todos.add(email)
                mapa[normalizar(f"{first} {last}")] = email
                mapa[normalizar(f"{last} {first}")] = email
        wb.close()
    return sorted(todos), mapa

async def scrape():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto("https://andaliensur.psgestion.cl", wait_until="networkidle", timeout=30000)
        await asyncio.sleep(2)
        await page.fill('#username', USUARIO)
        await page.fill('#password', CLAVE)
        await page.press('#password', 'Enter')
        await page.wait_for_timeout(3000)
        await page.goto("https://andaliensur.psgestion.cl/#/colaboradores", wait_until="networkidle", timeout=30000)
        await asyncio.sleep(2)
        try:
            await page.wait_for_selector("table#empleados2 tbody tr.ng-scope", timeout=20000)
        except:
            await browser.close()
            return []
        data = []
        visitadas = set()
        while True:
            for row in await page.query_selector_all("table#empleados2 tbody tr.ng-scope"):
                cells = await row.query_selector_all("td")
                if len(cells) >= 4:
                    eid = (await cells[1].inner_text()).strip()
                    if eid not in visitadas:
                        visitadas.add(eid)
                        data.append({
                            "id": eid,
                            "rut": (await cells[2].inner_text()).strip(),
                            "nombre": (await cells[3].inner_text()).strip(),
                        })
            sig = await page.query_selector("ul.pagination li:not(.disabled) a:has-text('Siguiente')")
            if sig and await sig.is_visible():
                await sig.click()
                await page.wait_for_timeout(2000)
            else:
                break
        await browser.close()
        return data

async def main():
    print("Cargando correos desde Excel...")
    correos, mapa_correos = cargar_correos()
    print(f"  {len(correos)} correos encontrados")

    print("Scraping colaboradores...")
    data = await scrape()
    print(f"  {len(data)} colaboradores")

    if not data:
        return

    # Pre-llenar email desde Excel si coincide
    for item in data:
        email = mapa_correos.get(normalizar(item['nombre']), '')
        item['email'] = email
        item['lugar'] = ''

    with open(os.path.join(DIR, "colaboradores.json"), "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    with open(os.path.join(DIR, "template.html"), "r", encoding="utf-8") as f:
        html = f.read()

    rows = ''
    for item in data:
        rows += (
            '<tr>'
            f'<td>{item["id"]}</td>'
            f'<td>{item["rut"]}</td>'
            f'<td>{item["nombre"]}</td>'
            f'<td><input class="email-input" value="{item["email"]}"></td>'
            '<td style="text-align:center"><input type="checkbox" class="activo-check"></td>'
            '</tr>'
        )

    html = html.replace('__TOTAL__', str(len(data)))
    html = html.replace('__ROWS__', rows)
    html = html.replace('__CORREOS_JSON__', json.dumps(correos))

    with open(os.path.join(DIR, "colaboradores.html"), "w", encoding="utf-8") as f:
        f.write(html)
    print("HTML listo: colaboradores.html")

if __name__ == "__main__":
    asyncio.run(main())
