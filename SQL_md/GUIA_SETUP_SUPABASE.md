# 🔧 Guía: Conectar SGJA a Supabase

## ⚠️ Problema Encontrado
El registro de usuarios estaba fallando con error: **"Database error saving new user"**

### Causas
1. El trigger de autenticación no estaba configurado
2. La tabla `establecimientos` estaba vacía
3. Las RLS policies no estaban configuradas correctamente

---

## ✅ Solución Paso a Paso

### Paso 1: Ejecutar SQL en Supabase

1. Ve a tu proyecto en [Supabase](https://app.supabase.com)
2. Abre **SQL Editor** (en la izquierda, debajo de "Desarrollo")
3. **Haz clic en "Create a new query"**
4. Copia TODO el contenido del archivo:
   ```
   SETUP_SUPABASE_COMPLETO.sql
   ```
5. **Pega** el contenido completo en el editor
6. **Haz clic en "Run"** (Ejecutar)
7. Deberías ver `✅ Setup completado` al final

### Paso 2: Verificar que se ejecutó correctamente

En el SQL Editor, ejecuta esta query de verificación:

```sql
SELECT 'Establecimientos:' as info, COUNT(*) as total FROM establecimientos
UNION ALL
SELECT 'Usuarios:', COUNT(*) FROM usuarios;
```

Deberías ver:
- **Establecimientos: 1** 
- **Usuarios: 0** (todavía sin usuarios)

### Paso 3: Probar el Registro

1. Vuelve a la aplicación SGJA (http://localhost:5173)
2. Haz clic en **"¿No tienes cuenta? Regístrate"**
3. Llena el formulario:
   - Email: `testadmin@test.com`
   - Contraseña: `TestPassword123!`
4. Haz clic en **"Registrarse"**

### Paso 4: Verificar el Usuario fue Creado

En Supabase SQL Editor, ejecuta:

```sql
SELECT uid, email, nombre_completo, rol, activo 
FROM usuarios 
WHERE email = 'testadmin@test.com';
```

Deberías ver un registro con `activo = false` (porque es nuevo usuario).

### Paso 5: Activar el Usuario (Para Admin)

Para que puedas acceder, un admin debe activar el usuario. Ejecuta en SQL:

```sql
UPDATE usuarios 
SET activo = true, rol = 'ADMIN'
WHERE email = 'testadmin@test.com';
```

### Paso 6: Probar Login

1. Vuelve a la app y haz clic en **"¿Ya tienes cuenta? Inicia sesión"**
2. Ingresa:
   - Email: `testadmin@test.com`
   - Contraseña: `TestPassword123!`
3. Haz clic en **"Iniciar sesión"**

✅ Deberías ver el Dashboard de Admin

---

## 🔍 Troubleshooting

### Error: "invalid_credentials" o "invalid_grant"
- Verifica que la contraseña sea correcta
- El usuario debe estar registrado en Supabase Auth (`auth.users`)

### Error: "user_not_found"  
- Verifica que el usuario esté en la tabla `usuarios`
- Ejecuta: `SELECT * FROM usuarios WHERE email = 'tu-email';`

### Error: "Database error saving new user"
- Vuelve a ejecutar el SQL_SETUP completo
- Verifica que `establecimientos` tenga un registro
- Verifica que el trigger esté creado: 
  ```sql
  SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
  ```

### El login se queda cargando infinitamente
- Abre DevTools (F12) → Console
- Mira los logs para identificar qué está fallando
- Verifica la conexión a Supabase

---

## 📝 Archivos Importantes

```
.env.local                                    ← Tiene credenciales de Supabase
SETUP_SUPABASE_COMPLETO.sql                  ← SQL para configurar todo
src/pages/Login.tsx                           ← Componente de login
src/lib/supabase.ts                           ← Cliente de Supabase
src/hooks/useAuth.ts                          ← Hook de autenticación
```

---

## 🎯 Próximos Pasos (Después de que el login funcione)

1. [ ] Crear más usuarios de prueba por rol (ADMIN, INSPECTOR, PROFESOR, etc)
2. [ ] Configurar las políticas RLS para cada rol
3. [ ] Implementar autenticación con Google OAuth
4. [ ] Migrar datos de Firebase a Supabase
5. [ ] Implementar notificaciones y logs

---

**¿Necesitas ayuda con algo?** Avísame qué error ves o en qué paso te atascas.
