import csv, os, json, re
from supabase import create_client

SUPABASE_URL = "https://iyxubvtfhcmlivivdfpt.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5eHVidnRmaGNtbGl2aXZkZnB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzMjUwNjgsImV4cCI6MjA5MTkwMTA2OH0.6nXx5oKcU8-gHNJCFBrrnzCYSwxPvVlOrSIp889GEW4"
DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(DIR, "colaboradores_seleccionados.csv")

def parsear_nombre(n):
    p = n.strip().split()
    if len(p) <= 2:
        return (p[-1], p[0]) if len(p) == 2 else (p[0], '')
    return (' '.join(p[2:]), ' '.join(p[:2]))

def leer_csv():
    if not os.path.exists(CSV_PATH):
        print(f"Archivo no encontrado: {CSV_PATH}")
        print("Primero descarga el CSV desde colaboradores.html (marca checkboxes y descarga)")
        return []
    with open(CSV_PATH, encoding='utf-8-sig') as f:
        return list(csv.DictReader(f))

async def main():
    data = leer_csv()
    if not data:
        return

    print(f"Procesando {len(data)} solicitudes de registro...")
    
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    ok = 0
    err = 0
    for row in data:
        email = row.get('Email', '').strip()
        nombre = row.get('Nombre', '').strip()
        if not email or not nombre:
            err += 1
            continue
        
        nombres, apellidos = parsear_nombre(nombre)
        
        try:
            # Intentar signup para obtener uid
            # Si el usuario ya existe, el signup falla pero podemos usar el email como uid
            res = supabase.from_('solicitudes_registro').insert({
                'uid': email,
                'nombre': nombres,
                'apellidos': apellidos,
                'correo': email,
                'estado': 'pendiente',
            }).execute()
            
            if res.data:
                ok += 1
                print(f"  OK: {nombre[:40]:40s} -> {email}")
            else:
                err += 1
                print(f"  FALL: {nombre[:40]:40s}")
        except Exception as e:
            err += 1
            msg = str(e)
            if 'duplicate' in msg.lower() or 'already exists' in msg.lower():
                print(f"  DUP: {nombre[:40]:40s} -> ya existe")
                ok += 1
                err -= 1
            else:
                print(f"  ERR: {nombre[:40]:40s} -> {msg[:60]}")

    print(f"\nResultado: {ok} insertados, {err} errores")

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
