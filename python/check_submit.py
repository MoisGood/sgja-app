import requests
import re

r = requests.get("https://andaliensur.psgestion.cl/pages/personas/login.html", 
    headers={"User-Agent": "Mozilla/5.0"})

print("=== ng-submit ===")
for m in re.finditer(r'ng-submit="([^"]+)"', r.text):
    print(f'  ng-submit: {m.group(1)}')

print("\n=== form attributes ===")
for m in re.finditer(r'<form[^>]*>', r.text):
    print(f'  {m.group()}')

# Check controller
r2 = requests.get("https://andaliensur.psgestion.cl/js/controllers/personas/controllerLogin.js", 
    headers={"User-Agent": "Mozilla/5.0"})
for line in r2.text.split('\n'):
    if 'login' in line.lower() and ('$scope' in line or 'function' in line):
        print(f'\nController login: {line.strip()[:200]}')
