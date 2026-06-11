import requests
import re

r = requests.get('https://andaliensur.psgestion.cl', 
    timeout=15, headers={'User-Agent': 'Mozilla/5.0'})
text = r.text

# Find all script tags content
for m in re.finditer(r'<script[^>]*>([^<]+)</script>', text):
    content = m.group(1).strip()
    if 'api' in content.lower() or 'url' in content.lower() or 'http' in content:
        print('=== SCRIPT ===')
        print(content[:500])
        print()

# Also search for any JSON config or data
for m in re.finditer(r'(URL_DE_TU_API|base_url|api_url|endpoint)\s*[:=]\s*["\']([^"\']+)["\']', text, re.IGNORECASE):
    print(f'Config: {m.group(1)} = {m.group(2)}')
