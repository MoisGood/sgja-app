# 🔗 Guía: Verificar Conexión a Supabase

## ✅ Estado Actual

Tu aplicación está corriendo localmente en:
- **URL**: http://localhost:5173/
- **Servidor**: Vite v8.0.0 ✅ Iniciado correctamente

### Credenciales de Supabase Configuradas
```
VITE_SUPABASE_URL=https://iyxubvtfhcmlivivdfpt.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_XkxWTTJrOAq0rNXbTLL0ew_4g-HcMBt
```

---

## 🔧 Problemas Detectados

El proyecto tiene algunos errores de TypeScript que necesitan corregirse:

1. **MantenedorRoles.tsx** - Funciones faltantes en firestore.ts
   - `crearRolPersonalizado`
   - `eliminarRolPersonalizado`
   - `verificarRolEnUso`
   - `verificarRolTienePaginasAsignadas`

2. **MobileLayout.tsx** - Variable `email` no definida

3. **useInactivityWarning.ts** - Errores de tipos en configuración

4. **MantenedorFuncionarios.tsx** - Funciones faltantes

5. **Seguridad.tsx** - Errores de configuración

6. **firestore.ts** - Error: `signUpWithPassword` debería ser `signInWithPassword`

7. **supabaseAuth.ts** - Error de tipo: null no es asignable a Rol

---

## 📋 Próximos Pasos

### Opción 1: Ejecutar Linting para ver todos los errores
```bash
npm run build
```

### Opción 2: Revisar y arreglar archivos específicos

1. **supabaseAuth.ts** - Revisar línea 148
2. **firestore.ts** - Revisar línea 142
3. **MobileLayout.tsx** - Revisar línea 61-63
4. **useInactivityWarning.ts** - Revisar línea 25-30

---

## 🧪 Verificar Conexión Manual

Abre la **Consola del Navegador** (F12 o Ctrl+Shift+K) y ejecuta:

```javascript
// Prueba simple de conexión
const { data, error } = await window.supabase.auth.getSession();
console.log('Sesión:', data?.session);
console.log('Error:', error);
```

O usa el componente de prueba:
```javascript
// En la consola del navegador:
window.toggleMonitor()  // Activa el monitor (para desarrollo)
```

---

## 📊 Verificar Supabase desde Terminal

```bash
# Instalar herramientas de Supabase
npm install -g supabase

# Verificar conexión (requiere credenciales de admin)
supabase projects list
```

---

## 🚀 Solución Recomendada

1. Ejecuta `npm run build` para ver todos los errores
2. Corrige los errores de TypeScript uno por uno
3. Recarga la página en http://localhost:5173/
4. Verifica los logs en la consola del navegador

---

## 📝 Notas

- El servidor de desarrollo está en modo **HMR** (Hot Module Replacement)
- Los cambios se recargan automáticamente
- Los errores de compilación pueden ser vistos en la consola
- La conexión a Supabase está correctamente configurada en `.env.local`
