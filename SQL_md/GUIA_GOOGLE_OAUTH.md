# 🔐 Guía: Habilitar Google OAuth en Supabase

## Problema
```
{
  "code": 400,
  "error_code": "validation_failed",
  "msg": "Unsupported provider: provider is not enabled"
}
```

## Solución: Habilitar Google OAuth

### Paso 1: Acceder a Supabase Dashboard
1. Ve a: https://app.supabase.com
2. Selecciona tu proyecto: `iyxubvtfhcmlivivdfpt`

### Paso 2: Ir a Configuración de Autenticación
- En el panel izquierdo: **Authentication** → **Providers**
- Busca **Google** en la lista

### Paso 3: Habilitar Google Provider
Necesitas crear un Proyecto en Google Cloud Console:

#### 3.1 Crear Proyecto en Google Cloud Console
1. Ve a: https://console.cloud.google.com
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la API de Google+ (o Google Identity Platform)
4. Crea credenciales OAuth 2.0:
   - Tipo: **Aplicación web**
   - URIs autorizados de redirección:
     ```
     https://iyxubvtfhcmlivivdfpt.supabase.co/auth/v1/callback
     ```
   - Copiar: **Client ID** y **Client Secret**

#### 3.2 Configurar en Supabase
1. En Supabase → Authentication → Providers → Google
2. Activar el toggle
3. Pegar:
   - **Client ID**: `(del paso anterior)`
   - **Client Secret**: `(del paso anterior)`
4. Guardar cambios

### Paso 4: Verificar Configuración
- Redirected URL debe estar en Supabase Settings → Authentication:
  ```
  Site URL: http://localhost:5173
  Redirect URLs: http://localhost:5173
  ```

---

## Alternativa: Login Temporal (Sin Google)

Si no quieres configurar Google ahora, puedes usar login manual en Supabase:

### Opción 1: Crear usuario con email/password
```sql
-- En Supabase SQL Editor
SELECT * FROM auth.users;
```

### Opción 2: Usar un usuario existente
Usuario de prueba que ya existe:
```
Email: profesor1@test.com
```

---

## Verificar que funciona

Una vez habilitado, ejecuta en la consola:
```javascript
const { data, error } = await window.supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: window.location.origin,
  }
});
console.log('OAuth iniciado:', data, error);
```

---

## Configuración Recomendada para Desarrollo

En **Supabase Settings → Authentication**:
```
Site URL: http://localhost:5173
Redirect URLs:
  - http://localhost:5173
  - http://localhost:5173/
  - http://localhost:3000
  (agregar las que necesites)
```

Para producción:
```
Site URL: https://tu-dominio.com
Redirect URLs:
  - https://tu-dominio.com
  - https://tu-dominio.com/
```
