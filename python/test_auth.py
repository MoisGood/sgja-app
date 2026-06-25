from supabase import create_client, Client

SUPABASE_URL = "https://iyxubvtfhcmlivivdfpt.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5eHVidnRmaGNtbGl2aXZkZnB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzMjUwNjgsImV4cCI6MjA5MTkwMTA2OH0.6nXx5oKcU8-gHNJCFBrrnzCYSwxPvVlOrSIp889GEW4"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Intentar login con usuario admin de prueba del seed
try:
    # Datos de seed SQL_USUARIOS.sql
    res = supabase.auth.sign_in_with_password({
        "email": "admin@test.com",
        "password": "admin123"
    })
    print(f"Login OK: {res.user.email if res.user else 'N/A'}")
except Exception as e:
    print(f"Login falló: {e}")

# Ahora probar consulta
print("\nConsultando usuarios...")
try:
    res = supabase.from_('usuarios').select('id, nombre').limit(5).execute()
    print(f"  Data: {res.data}")
except Exception as e:
    print(f"  Error: {e}")
