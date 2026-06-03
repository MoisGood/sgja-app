# 🔐 Habilitar Google OAuth en Supabase

## Error Recibido
```
{"code":400,"error_code":"validation_failed","msg":"Unsupported provider: provider is not enabled"}
```

Este error significa que **Google OAuth no está habilitado** en tu proyecto Supabase.

## SOLUCIÓN

### OPCIÓN A: Usar Email/Password (Rápido - Sin Google)

Cambia `Login.tsx` para usar email/password en lugar de Google OAuth:

```typescript
// En lugar de Google OAuth, usar email/password
const handleLogin = async () => {
  setCargando(true);
  setError(null);
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: 'profesor1@andaliensur.cl',
      password: 'Test@12345',
    });
    
    if (error) throw error;
    console.log('✅ Login exitoso');
  } catch (e) {
    setError(e.message);
    setCargando(false);
  }
};
```

### OPCIÓN B: Habilitar Google OAuth en Supabase (Recomendado)

#### Paso 1: Ir a Supabase Dashboard
1. Abre: https://app.supabase.com
2. Inicia sesión con tu cuenta
3. Selecciona el proyecto: **sgja** (iyxubvtfhcmlivivdfpt)

#### Paso 2: Configurar Google OAuth
1. En el menú lateral, ve a: **Authentication** → **Providers**
2. Busca **Google** en la lista
3. Haz clic en **Google**
4. Cambia el toggle a: **✅ ENABLED** (verde)

#### Paso 3: Verificar Configuración
1. En el mismo panel, verifica:
   - ✅ **Authorized redirect URLs** debe incluir:
     ```
     http://localhost:5173/
     http://localhost:5173/auth/callback
     ```
   - Si no está, cópialas en el campo correspondiente

#### Paso 4: Guardar Cambios
1. Haz clic en **Save** (botón en la parte inferior)
2. Verifica que el toggle de Google esté en verde ✅

#### Paso 5: Probar Localmente
1. Vuelve a `http://localhost:5173/`
2. Haz clic en "Continuar con Google"
3. Deberías ver el popup de Google para autenticarte

## Si aún hay error...

Si el error persiste:

1. **Recarga la página:** `Ctrl+Shift+R` (fuerza recarga sin cache)
2. **Reinicia el servidor:** 
   ```powershell
   npm run dev
   ```
3. **Limpia cookies:**
   - Abre DevTools (F12)
   - Application → Cookies → Supabase → Elimina todas
   - Recarga la página

## Alternativa: Login con Email/Password

Si Google sigue sin funcionar, podemos hacer un **login simple con email/password**:

1. Insertar usuario de prueba en Supabase Auth
2. Cambiar Login.tsx para mostrar formulario email/password
3. El usuario ingresa credenciales y listo

¿Cuál prefieres?
