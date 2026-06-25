import asyncio
from playwright.async_api import async_playwright

URL = "https://andaliensur.psgestion.cl/#/colaboradores"

async def debug():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        # Capturar requests de red
        page.on("response", lambda r: print(f"[{r.status}] {r.url[:100]}"))
        
        await page.goto(URL, wait_until="networkidle", timeout=30000)
        await asyncio.sleep(3)
        
        # Ver qué hay en la página
        titulo = await page.title()
        print(f"\nTitle: {titulo}")
        
        html = await page.content()
        # Buscar indicios de login o tabla
        if "login" in html.lower():
            print("→ Parece página de login")
        if "colaboradores" in html.lower():
            print("→ Palabra 'colaboradores' encontrada")
        
        # Ver si hay tabla
        tabla = await page.query_selector("table#empleados2")
        if tabla:
            print("→ Tabla #empleados2 encontrada")
            html_tabla = await tabla.inner_html()
            print(f"  HTML: {html_tabla[:300]}")
        else:
            print("→ Tabla #empleados2 NO encontrada")
            # Ver body
            body = await page.query_selector("body")
            if body:
                texto = await body.inner_text()
                print(f"  Body text (first 500): {texto[:500]}")
        
        await browser.close()

asyncio.run(debug())
