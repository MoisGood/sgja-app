from supabase import create_client, Client

SUPABASE_URL = "https://iyxubvtfhcmlivivdfpt.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5eHVidnRmaGNtbGl2aXZkZnB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzMjUwNjgsImV4cCI6MjA5MTkwMTA2OH0.6nXx5oKcU8-gHNJCFBrrnzCYSwxPvVlOrSIp889GEW4"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Probar consulta simple
print("Probando consulta a usuarios...")
try:
    res = supabase.from_('usuarios').select('id, nombre').limit(5).execute()
    print(f"  Data: {res.data}")
    print(f"  Count: {len(res.data)}")
except Exception as e:
    print(f"  Error: {e}")

print("\nProbando consulta a equipos con lugar...")
try:
    res = supabase.from_('equipos').select('id_usuario, id_lugar').not_.is_('id_usuario', 'null').limit(5).execute()
    print(f"  Data: {res.data}")
except Exception as e:
    print(f"  Error: {e}")
