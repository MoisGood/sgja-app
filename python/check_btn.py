import requests
from bs4 import BeautifulSoup

r = requests.get("https://andaliensur.psgestion.cl/pages/personas/login.html", 
    headers={"User-Agent": "Mozilla/5.0"})
soup = BeautifulSoup(r.text, 'lxml')

for btn in soup.find_all(['button', 'a']):
    click = btn.get('ng-click', '')
    text = btn.get_text(strip=True)
    if click:
        print(f'  <{btn.name}> ng-click="{click}" text="{text}"')
    elif text and 'ingres' in text.lower():
        print(f'  <{btn.name}> text="{text}" (posible boton login)')
