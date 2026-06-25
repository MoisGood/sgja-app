# 🔐 Guía: Prueba de Login con Google en Supabase

## Estado Actual
✅ Supabase conectado localmente
✅ Cliente Supabase inicializado
✅ Página de login funcional
✅ OAuth Google implementado

## Próximos Pasos

### PASO 1: Configurar Google OAuth en Supabase

1. Ve a **[Supabase Dashboard](https://app.supabase.com)**
2. Selecciona tu proyecto: `sgja`
3. Navega a: **Authentication** → **Providers**
4. Busca **Google**
5. Asegúrate de que esté habilitado ✅
6. Verifica el Redirect URL: `http://localhost:5173/`

### PASO 2: Habilitar Google OAuth en Supabase

Si aún no está configurado:

1. Ve a **Authentication** → **Providers** → **Google**
2. Habilita el toggle: ✅ Google
3. Los Client ID y Secret deberían estar configurados desde antes
4. Si no, tendrás que crear credenciales OAuth en Google Cloud Console

### PASO 3: Crear Usuario de Prueba en Base de Datos

Ejecuta este SQL en Supabase SQL Editor:

```sql
INSERT INTO usuarios (
  id,
  email,
  nombre_completo,
  rol,
  id_establecimiento,
  activo,
  creado_en
) VALUES (
  '550e8400-e29b-41d4-a716-446655550103',
  'tu-email@gmail.com',  -- Reemplaza con tu email real
  'Test Profesor',
  'PROFESOR',
  '18f3ec96-f15f-4787-a3ac-3c10f1cee55f',
  true,
  NOW()
);
```

**Importante:** El `email` debe ser el que uses para autenticarte con Google.

### PASO 4: Probar Login Localmente

1. Abre: `http://localhost:5173/`
2. Haz clic en botón: **"Continuar con Google"**
3. Auténticate con tu cuenta de Google
4. Deberías ver el Dashboard correspondiente a tu rol

## Solución de Problemas

### "Popup bloqueado"
- Verifica permisos de popup en el navegador
- Intenta en modo incógnito/privado

### "Redirección no válida"
- Asegúrate que `http://localhost:5173/` está en Redirect URLs de Supabase
- Reinicia el servidor: `npm run dev`

### "Usuario no encontrado"
- Verifica que el email en tabla `usuarios` coincide exactamente con el email de Google
- Asegúrate de que `activo = true`

### "Error de conexión"
- Verifica que `.env.local` tiene las credenciales de Supabase correctas
- Abre la consola del navegador (F12) para ver detalles del error

## Pasos Siguientes Después de Prueba Exitosa

1. ✅ Crear usuarios adicionales (Admin, Inspector, Estudiante)
2. ✅ Verificar dashboards por rol
3. ✅ Habilitar RLS policies en Supabase
4. ✅ Implementar funcionalidad de justificaciones
5. ✅ Desplegar a Vercel

## URLs Útiles

- **Supabase Dashboard:** https://app.supabase.com
- **Proyecto:** https://app.supabase.com/project/iyxubvtfhcmlivivdfpt
- **SQL Editor:** https://app.supabase.com/project/iyxubvtfhcmlivivdfpt/sql/new
- **Auth Users:** https://app.supabase.com/project/iyxubvtfhcmlivivdfpt/auth/users
