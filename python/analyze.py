import requests
import re

r = requests.get('https://andaliensur.psgestion.cl/js/script.js?v=12.0.20220602', 
    timeout=15, headers={'User-Agent': 'Mozilla/5.0'})
text = r.text

urls = re.findall(r'https?://[^"\']+', text)
for u in sorted(set(urls)):
    print(u)
