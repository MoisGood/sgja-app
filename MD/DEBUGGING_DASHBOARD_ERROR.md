# 🔍 Guía de Debuggeo: Error "Error al cargar datos del dashboard"

## ¿Qué significa este error?

El error que ves en la imagen significa que uno de los dashboards intentó cargar datos de Firestore y falló. Esto puede ocurrir por varias razones.

---

## 📋 Causas Posibles

### 1. **Colecciones o Documentos No Existen en Firestore**
Si la base de datos Firestore no tiene la estructura esperada, las consultas fallarán.

**Solución**: Asegúrate de que existen las siguientes colecciones en Firestore:
- `solicitudes` - Debe contener documentos de solicitudes
- `usuarios` - Debe contener documentos de usuarios
- `estudiantes` - Debe contener documentos de estudiantes

### 2. **Permisos de Seguridad en Firestore**
Si las reglas de seguridad de Firestore no permiten lectura a los usuarios, las consultas fallarán.

**Archivo a revisar**: `firestore.rules`

### 3. **El ID del Establecimiento/Estudiante es "default"**
Cambié el código para usar `usuario.uid` en lugar de "default", pero si el usuario no tiene un uid válido, puede fallar.

---

## ✅ Cómo Verificar el Estado

### Paso 1: Abrir la Consola del Navegador
1. Abre la aplicación en tu navegador
2. Presiona `F12` para abrir Developer Tools
3. Ve a la pestaña **Console**

### Paso 2: Ver los Errores en Detalle
Los errores de Firestore aparecerán así:
```
Error al cargar datos del dashboard
FirebaseError: Missing or insufficient permissions...
```

### Paso 3: Revisar Firestore Console
1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Selecciona tu proyecto
3. Ve a **Firestore Database**
4. Verifica que existen colecciones con datos

---

## 🔧 Cambios Realizados para Mayor Robustez

He actualizado todos los dashboards para que:

1. **Capten errores gracefully**: Si Firestore falla, muestran datos vacíos en lugar de crashes
2. **Usen `.catch(() => [])`**: Para retornar arrays vacíos si la consulta falla
3. **Muestren mensajes claros**: "No hay solicitudes" en lugar de interfaces vacías

```typescript
// Antes (fallaba si Firestore tenía problemas):
const data = await obtenerUltimasSolicitudes(idEstablecimiento);

// Ahora (captura errores):
const data = await obtenerUltimasSolicitudes(idEstablecimiento).catch(() => []);
setSolicitudes(data || []);
```

---

## 🎯 Flujo del Dashboard (Inicio)

```
1. Usuario inicia sesión con Google
   ↓
2. AppContent.tsx verifica rol del usuario
   ↓
3. Según rol, renderiza:
   - ADMIN → DashboardAdmin
   - INSPECTOR → DashboardInspector
   - PROFESOR → DashboardProfesor
   - ESTUDIANTE → DashboardEstudiante
   - APODERADO → DashboardApoderado
   ↓
4. El dashboard intenta cargar datos de Firestore
   ↓
5. Si hay error → Muestra: "Error al cargar datos del dashboard"
   Si hay éxito → Muestra los datos en tabla/cards
   Si no hay datos → Muestra: "No hay solicitudes registradas"
```

---

## 📊 Props Pasadas a Cada Dashboard

| Dashboard | Props | Obtiene de |
|-----------|-------|-----------|
| Admin | `idEstablecimiento={usuario.uid}` | Firebase Auth |
| Inspector | `idEstablecimiento={usuario.uid}` | Firebase Auth |
| Profesor | `idEstablecimiento={usuario.uid}` | Firebase Auth |
| Estudiante | `idEstudiante={usuario.uid}` | Firebase Auth |
| Apoderado | `idEstudiantePupilo={usuario.uid}` | Firebase Auth |

---

## 🚨 Si el Error Persiste

### Opción 1: Revisar Firestore Rules
Ve a `firestore.rules` y asegúrate de que permite lectura:

```
match /databases/{database}/documents {
  match /{document=**} {
    allow read: if true;  // Permite lectura a todos
    allow write: if false; // Deniega escritura
  }
}
```

### Opción 2: Crear Datos de Demo
Agrega manualmente una solicitud a Firestore:

```
Collection: solicitudes
Document: test001
Fields:
  id_solicitud: "test001"
  id_estudiante: "est001"
  tipo: "ATRASO"
  estado: "Solicitada"
  fecha: (current timestamp)
  motivo_descripcion: "Retraso en transporte"
```

### Opción 3: Revisar Logs de Browser
1. Abre DevTools (F12)
2. Console tab
3. Busca mensajes de error rojo
4. Copia el error completo para debuggeo

---

## 📝 Resumen de Mejoras Realizadas

✅ Error handling mejorado en todos los dashboards  
✅ Cambio de "default" a `usuario.uid` como ID  
✅ Promesas de Firestore con `.catch()` para graceful degradation  
✅ Estados visuales claros (cargando, error, vacío)  
✅ Mensajes de error descriptivos  

---

## 🔗 Recursos Útiles

- [Firebase Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Security Rules Guide](https://firebase.google.com/docs/firestore/security/get-started)
- [Query Examples](https://firebase.google.com/docs/firestore/query-data/queries)

---

**Próximo Paso**: Importa datos de prueba a Firestore o revisa las Security Rules para permitir acceso correcto.
