import requests
from bs4 import BeautifulSoup

r = requests.get("https://andaliensur.psgestion.cl/pages/personas/login.html", 
    headers={"User-Agent": "Mozilla/5.0"})
soup = BeautifulSoup(r.text, 'lxml')

print("=== Form inputs ===")
for inp in soup.find_all(['input', 'button', 'form']):
    name = inp.get('name','')
    model = inp.get('ng-model','')
    click = inp.get('ng-click','')
    type_v = inp.get('type','')
    pid = inp.get('id','')
    placeholder = inp.get('placeholder','')
    if model or click or (name and type_v != 'hidden'):
        print(f'  <{inp.name} id="{pid}" name="{name}" type="{type_v}" ng-model="{model}" ng-click="{click}" placeholder="{placeholder}">')

print("\n=== Any form tags ===")
for f in soup.find_all('form'):
    print(f'  <form action="{f.get("action","")}" method="{f.get("method","")}">')
