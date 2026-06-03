# 🔐 FASE 3: AUTENTICACIÓN - CONFIGURACIÓN EN SUPABASE

**Estado Anterior:** ✅ FASE 1 y 2 completadas  
**Actual:** FASE 3 - Configurar Supabase Auth  
**Tiempo estimado:** 15-20 minutos  
**Siguiente:** FASE 4 - Migración de Datos

---

## ✅ CHECKLIST RÁPIDO

```
Verifica en Supabase:
- [ ] Auth habilitado
- [ ] Email/Password configurado  
- [ ] Auto confirm users activado
- [ ] Trigger handle_new_user funcionando
- [ ] Primer usuario de prueba creado
```

---

## 🚀 PASO 1: CONFIGURAR SUPABASE AUTH EN DASHBOARD

### Ir a Authentication Settings

```
1. Abre: https://supabase.com/dashboard
2. Selecciona: Tu proyecto "SGJA-Production"
3. Lado izquierdo: Haz click en "Authentication"
4. Arriba: Click en "Settings"
```

### Configurar Site URL y Redirect URLs

```
Ir a: Authentication → Settings → URL Configuration

Site URL:
  - Desarrollo: http://localhost:5173
  - Producción: https://tudominio.com

Redirect URLs (agregar cada una):
  - http://localhost:5173/**
  - https://tudominio.com/**
  - https://sgja.vercel.app/**  (si usas Vercel)

Nota: El ** permite cualquier ruta de retorno
```

**Captura de pantalla aproximada:**
```
┌─ URL Configuration ─────────────────────┐
│                                         │
│ Site URL:                               │
│ http://localhost:5173                   │
│                                         │
│ Redirect URLs:                          │
│ ✅ http://localhost:5173/**             │
│ ✅ https://tudominio.com/**             │
│                                         │
│ [Save]                                  │
└─────────────────────────────────────────┘
```

---

## 🔐 PASO 2: HABILITAR EMAIL/PASSWORD

### Ir a Providers

```
1. Authentication → Providers
2. Buscar: Email/Password
3. Click en toggle para HABILITAR (verde)
```

**Configurar opciones:**

```
- Email confirmations:
  [ ] Require email confirmation
  ✅ Auto Confirm
  
- Secure Email Change (opcional):
  [ ] Require email change confirmation

- OTP (One-Time Password):
  [ ] Enable phone OTP
```

**Resultado:** Email/Password aparece como "ENABLED"

---

## 📨 PASO 3: PERSONALIZAR EMAIL DE BIENVENIDA (OPCIONAL)

```
1. Authentication → Email Templates
2. Seleccionar: "Confirm signup"
3. Personalizar contenido:
   - Asunto: "¡Bienvenido a SGJA!"
   - Mensaje: Agregar logo, instrucciones
   - Link de confirmación será automático
4. Click "Save"
```

**Ejemplo de template:**
```html
<h1>¡Bienvenido a SGJA!</h1>
<p>Gracias por registrarte en el Sistema de Gestión de Justificaciones.</p>
<p>Haz click abajo para confirmar tu email:</p>
<a href="{{ .ConfirmationURL }}">Confirmar Email</a>
<p>Si no te registraste, ignora este mensaje.</p>
```

---

## 🌐 PASO 4: CONFIGURAR SOCIALE (OPCIONAL - FASE FUTURA)

Por ahora **NO NECESARIO**, pero si quieres agregar Google/GitHub:

```
1. Authentication → Providers
2. Buscar: Google / GitHub
3. Click en toggle
4. Poner Client ID y Secret (desde Google/GitHub)
```

**Da para después**, enfoquémonos primero en Email.

---

## ✅ PASO 5: CREAR PRIMER USUARIO DE PRUEBA

### En Dashboard → Authentication → Users

```
1. Click en: "+ Generate user"
2. Llenar:
   - Email: admin@test.cl
   - Password: TempPassword123!
   - Auto send invite email: ✅ Checked
3. Click "Save user"
```

**Resultado:**
- ✅ Usuario creado en `auth.users`
- ✅ Email de confirmación enviado
- ✅ Debería aparecer automáticamente en tabla `usuarios`

---

## 🔧 PASO 6: VERIFICAR TRIGGER HANDLE_NEW_USER

### Comprobar que el usuario se creó en tabla usuarios

```sql
-- Ejecutar en SQL Editor:
SELECT id, uid, email, nombre_completo, rol, activo 
FROM usuarios 
WHERE email = 'admin@test.cl';

-- Resultado esperado:
-- id          | uuid
-- uid         | (same as auth.users id)
-- email       | admin@test.cl
-- nombre_completo | admin@test.cl (por defecto)
-- rol         | PROFESOR (por defecto)
-- activo      | true
```

**Si NO aparece:**
1. Verificar que trigger `handle_new_user` existe:
   ```sql
   SELECT * FROM information_schema.triggers 
   WHERE trigger_name = 'on_auth_user_created';
   ```
2. Si no existe, ejecutar script `SQL_SUPABASE_FASE2_AUTENTICACION.sql` de nuevo

---

## 🔑 PASO 7: COPIAR CREDENCIALES PARA .ENV

Necesitas guardar en tu archivo `.env`:

```bash
# En la raíz del proyecto, archivo: .env.local

# Supabase
VITE_SUPABASE_URL=https://xxxxx.supabase.co    ← Copiar de Settings
VITE_SUPABASE_ANON_KEY=eyJhbGc...               ← Copiar de Settings
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...       ← Guardar SEGURO (solo backend)
```

**Dónde copiar:**
```
1. Supabase Dashboard → Settings → API
2. Copiar:
   - Project URL
   - anon public key
   - service_role secret (⚠️ SECRETO - NO en GitHub)
```

---

## 🧪 PASO 8: TESTING LOCAL

### Probar que todo funciona en React

```bash
# Terminal 1: Iniciar app
npm run dev

# Terminal 2: Ver requests (opcional)
npm run debug  # si existe
```

**En app, buscar:**
1. Formulario de login
2. Intentar login con admin@test.cl / TempPassword123!
3. ¿Funciona? ✅
4. ¿Redirige a dashboard? ✅
5. ¿userData cargado? ✅

---

## 📋 VERIFICACIÓN FINAL

Ejecutar en **Supabase SQL Editor:**

```sql
-- Ver usuarios de auth
SELECT id, email, created_at FROM auth.users;

-- Ver usuarios en tabla usuarios
SELECT id, uid, email, rol FROM usuarios;

-- Verificar que se relacionan:
-- El uid de auth.users debe ser igual al uid de usuarios

-- Via función:
SELECT obtener_usuario_actual();  -- Retorna null si no hay login

-- Probar función en React después de login:
const usuario = await supabase.rpc('obtener_usuario_actual');
console.log(usuario);  // Debería mostrar datos del usuario logeado
```

---

## 🎯 PRÓXIMO PASO: FASE 4 - MIGRACIÓN DE DATOS

Una vez que verificaste todo:

```
✅ FASE 3 completada:
   - Auth configurado
   - Usuario de prueba creado
   - Trigger funcionando
   - Credentials en .env
   
⏳ SIGUIENTE: FASE 4 - Migración de datos desde Firestore
   - Exportar datos de Firestore
   - Importar a Supabase
   - Validar integridad
   
Tiempo: 30-60 minutos
```

---

## ⚠️ TROUBLESHOOTING

### Error: "Email confirmation required"
```
Solución: En Settings → Email confirmations
Cambiar a "Auto Confirm"
```

### Error: "Invalid URL configuration"
```
Solución: Verificar URLs sin typos
Debe ser: http://localhost:5173/** (con //**)
NO: http://localhost:5173/*
```

### Usuario no aparece en tabla usuarios
```
Solución: Verificar trigger
SELECT * FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created';

Si falta, ejecutar script SQL_SUPABASE_FASE2_AUTENTICACION.sql
```

### No puedo logearse en app
```
Solución: Verificar .env.local
- VITE_SUPABASE_URL sin espacios
- VITE_SUPABASE_ANON_KEY correcto
- Reiniciar: npm run dev
```

---

## 📞 RESUMEN

| Item | Estado |
|------|--------|
| Auth configurado | ✅ SI |
| Email/Password habilitado | ✅ SI |
| URL configuration | ✅ SI |
| Primer usuario creado | ✅ SI |
| Trigger funcionando | ✅ SI |
| Credenciales en .env | ✅ SI |
| Listo para migración | ✅ SI |

---

**¿Completaste todo?** → **Avanzamos a FASE 4: Migración de Datos**

¿Algún error? → Revisa troubleshooting arriba
