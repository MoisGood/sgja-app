import requests
import re

# Search multiple JS files for API endpoints
files = [
    'https://andaliensur.psgestion.cl/js/script.js?v=12.0.20220602',
    'https://andaliensur.psgestion.cl/js/routes.js?v=12.0.20220602',
    'https://andaliensur.psgestion.cl/js/funciones/submenu.js?v=12.0.20220602',
    'https://andaliensur.psgestion.cl/js/directives/directives.js?v=12.0.20220602',
    'https://andaliensur.psgestion.cl/js/bookstack.js?v=12.0.20220602',
]

headers = {'User-Agent': 'Mozilla/5.0'}

for url in files:
    try:
        r = requests.get(url, timeout=15, headers=headers)
        text = r.text
        # Find API calls: $http.get, $http.post, .get(, .post(, /api/
        apis = re.findall(r'(?:get|post|put|delete)\s*\(\s*["\']([^"\']+)["\']', text, re.IGNORECASE)
        apis += re.findall(r'["\'](/api/[^"\']+)["\']', text)
        apis += re.findall(r'["\'](https?://[^"\']+)["\']', text)
        if apis:
            print(f'\n=== {url.split("/")[-1]} ===')
            for a in sorted(set(apis)):
                if 'api' in a.lower() or a.startswith('/'):
                    print(f'  {a}')
    except Exception as e:
        print(f'Error {url}: {e}')
