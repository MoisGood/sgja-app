# 📋 Módulo de Gestión de Pases - SGJA

## Descripción

El módulo de **Gestión de Pases** permite a Administradores, Profesores e Inspectores crear, visualizar y gestionar solicitudes de atraso e inasistencia de estudiantes de forma centralizada.

## Características Principales

### 1️⃣ **Crear Pase**
- Seleccionar estudiante del establecimiento
- Autocompletar curso y RUT del estudiante
- Seleccionar tipo (Atraso/Inasistencia)
- Especificar fecha y hora
- Elegir motivo predefinido o "Otros" (máx 20 caracteres)
- Validación de campos requeridos
- Confirmación de éxito/error

### 2️⃣ **Ver Pases por Curso**
- Visualización paginada de pases
- Organización por curso
- Información: Estudiante, Tipo, Fecha/Hora, Motivo
- Acciones rápidas:
  - 📊 **Historial**: Ver últimos 10 atrasos del estudiante
  - ✕ **Anular**: Cambiar estado a "No presentada" (no elimina)
- Paginador con navegación anterior/siguiente

### 3️⃣ **Historial de Atrasos**
- Máximo últimos 10 atrasos del estudiante
- Información: Fecha, Hora, Motivo, Estado
- Calendario interactivo del mes actual
- Rango de búsqueda: 1 mes atrás, sin adelante
- Botón para volver a la lista de pases

## Flujo de Uso

```
┌─────────────────────────────────┐
│   Inicio: Gestión de Pases      │
├─────────────────────────────────┤
│ 3 Tabs principales:             │
│ ➕ Crear Pase                   │
│ 📋 Ver Pases                    │
│ 📊 Historial                    │
└─────────────────────────────────┘
        │
        ├─→ [Crear Pase]
        │   ├─ Seleccionar estudiante
        │   ├─ Ingresar fecha/hora
        │   ├─ Seleccionar motivo
        │   └─ Guardar
        │
        ├─→ [Ver Pases]
        │   ├─ Listar por curso
        │   ├─ Paginar
        │   ├─ Ver Historial (→ Historial)
        │   └─ Anular pase
        │
        └─→ [Historial]
            ├─ Últimos 10 atrasos
            ├─ Calendario 1 mes
            └─ Volver
```

## Estructura de Datos

### Solicitud (Pase)
```typescript
{
  id_solicitud:       string;
  id_establecimiento: string;
  id_estudiante:      string;
  id_profesor:        string;
  tipo:               "ATRASO" | "INASISTENCIA";
  fecha:              string;           // YYYY-MM-DD
  hora:               string;           // HH:MM
  estado:             EstadoSolicitud;  // Solicitada, En revisión, Aprobada, etc.
  motivo_codigo:      string | null;
  motivo_descripcion: string | null;
  observaciones:      string | null;
  respaldo_recibido:  boolean;
  tipo_respaldo:      string | null;
  id_token_qr:        string | null;
}
```

### MotivoJustificacion
```typescript
{
  id_motivo:             string;
  id_establecimiento:    string;
  codigo:                string;
  descripcion:           string;
  requiere_detalle:      boolean;
  activo:                boolean;
  orden:                 number;
}
```

## Estados de Solicitud

| Estado | Descripción |
|--------|------------|
| 🟡 Solicitada | Pase recién creado |
| 🔵 En revisión | Pendiente de aprobación |
| 🟢 Aprobada | Justificación aceptada |
| 🔴 Rechazada | Justificación rechazada |
| ⚪ No presentada | Anulada/cancelada |
| ⚫ Cerrada | Proceso finalizado |

## Acceso y Permisos

| Rol | Acceso | Acciones |
|-----|--------|---------|
| ADMIN | ✅ | Crear, Ver, Anular, Historial |
| INSPECTOR | ✅ | Crear, Ver, Anular, Historial |
| PROFESOR | ✅ | Crear, Ver, Anular, Historial |
| ESTUDIANTE | ❌ | No acceso |
| APODERADO | ❌ | No acceso |

## Navegación en Menú

```
📊 Inicio
📱 Panel QR (Inspector)
📖 Justificaciones
    ├─ Registrar              (Admin/Inspector)
    ├─ Ver Justificaciones    (Admin/Inspector)
    └─ Gestión de Pases       (Admin/Inspector/Profesor) ← NUEVO
⏰ Reportes
⚙️ Configuración
```

## Funcionalidades Técnicas

### Cargar Datos
- Estudiantes del establecimiento
- Motivos predefinidos ordenados por `orden`
- Solicitudes existentes del establecimiento

### Validaciones
- ✅ Estudiante requerido
- ✅ Motivo requerido
- ✅ Si "Otros": Motivo personalizado requerido (máx 20 caracteres)
- ✅ Campos de fecha/hora validados automáticamente por el navegador

### Paginación
- Sistema automático basado en cursos únicos
- Máximo 1 página por curso
- Navegación anterior/siguiente

### Calendario
- Mes actual
- Resalta día actual
- No permite seleccionar fechas (solo visualización)

### Anulación de Pases
- Soft delete: Marca estado como "No presentada"
- Confirma antes de procesar
- No elimina registro de la base de datos

## Componentes Utilizados

### Componentes Internos
- `Card`: Componente de contenedor con título y descripción
- `CalendarioSimple`: Pequeño calendario del mes actual

### Hooks
- `useState`: Manejo de estados del formulario y UI
- `useEffect`: Carga inicial de datos

### Servicios Firestore
- `obtenerEstudiantesDelEstablecimiento()`
- `obtenerMotivosDelEstablecimiento()`
- `obtenerSolicitudesDelEstablecimiento()`
- `crearSolicitud()`
- `actualizarSolicitud()`

## Rutas y Componentes

| Ruta | Componente | Archivo |
|------|-----------|---------|
| `/gestion-pases` | `GestionPases` | `src/pages/GestionPases.tsx` |

## Integración

### En `AppContent.tsx`
```typescript
import GestionPases from './pages/GestionPases';

// En renderizarDashboard()
case '/gestion-pases':
  return (rol === 'ADMIN' || rol === 'PROFESOR' || rol === 'INSPECTOR') 
    ? <GestionPases idEstablecimiento={idEstablecimiento} rol={rol} /> 
    : null;
```

### En `Layout.tsx`
Se añadió a la estructura de menú bajo "Justificaciones":
```typescript
{
  icono: <ClipboardList size={20}/>,
  etiqueta: 'Gestión de Pases',
  ruta: '/gestion-pases',
  roles: [Rol.ADMIN, Rol.INSPECTOR, Rol.PROFESOR]
}
```

## Estilos y UI

### Colores
- 🔵 Primario: `#1A3C6B` (Azul oscuro)
- ⚪ Gris claro: `#F9FAFB` (Fondo)
- 🟤 Bordes: `#E5E7EB` (Gris medio)
- 🔴 Error: `#FEE2E2` / `#991B1B` (Rojo)
- 🟢 Éxito: `#DCFCE7` / `#166534` (Verde)

### Layout Responsivo
- Grid para formularios (3 columnas para fecha/hora/tipo)
- Tabla con 4 columnas (Estudiante, Tipo, Motivo, Acciones)
- Estilos inline con React CSSProperties

## Flujo de Creación de Pase

1. **Usuario selecciona estudiante** desde dropdown
2. **Curso y RUT se autorellenan** automáticamente
3. **Usuario elige tipo**: Atraso/Inasistencia
4. **Usuario establece fecha y hora**
5. **Usuario selecciona motivo**:
   - Si elige "Otros": aparece campo texto (máx 20 caracteres)
6. **Sistema valida** todos los campos requeridos
7. **Al guardar**:
   - Se genera ID único: `sol_${timestamp}_${random}`
   - Se resuelve el motivo final (predefinido o personalizado)
   - Se crea documento en Firestore con estado "Solicitada"
   - Formulario se limpia
   - Se recarga la lista de pases
   - Muestra confirmación de éxito

## Próximas Mejoras (Opcional)

- [ ] Filtrado avanzado por fecha rango
- [ ] Exportar pases a Excel/PDF
- [ ] Notificaciones por correo al crear pase
- [ ] Integración con QR para validación
- [ ] Dashboard de estadísticas de atrasos
- [ ] Gráficos de atrasos por estudiante/motivo
- [ ] Alertas si estudiante excede límite de atrasos
- [ ] Descarga de reporte por período
- [ ] Búsqueda global de pases
- [ ] Historial con más filtros (por motivo, período, estado)

## Testing Manual

### 1. Crear un Pase
```
1. Ir a Justificaciones → Gestión de Pases
2. Click tab "Crear Pase"
3. Seleccionar estudiante: "Juan Pérez"
4. Tipo: "Atraso"
5. Fecha: Hoy
6. Hora: 08:15
7. Motivo: "ENFERMEDAD"
8. Click "Crear Pase"
✅ Debe mostrar "Pase creado exitosamente"
```

### 2. Ver Pases por Curso
```
1. Click tab "Ver Pases"
2. Debe listar pases por curso
3. Click "Historial" en un pase
✅ Debe ir a tab Historial con datos del estudiante
```

### 3. Anular Pase
```
1. En tab "Ver Pases"
2. Click "Anular" en un pase
3. Confirmar en modal
✅ Estado debe cambiar a "No presentada"
```

### 4. Ver Historial
```
1. Click "Historial" desde "Ver Pases"
2. Debe mostrar últimos 10 atrasos
3. Calendario debe mostrar mes actual
✅ Botón "Volver" regresa a Ver Pases
```

## Archivos Modificados

- ✅ `src/pages/GestionPases.tsx` - Nuevo componente principal
- ✅ `src/AppContent.tsx` - Agregada ruta `/gestion-pases`
- ✅ `src/components/Layout.tsx` - Agregado item en menú

## Comandos Útiles

```bash
# Compilar proyecto
npm run build

# Ver errores de TypeScript
npm run build 2>&1

# Regenerar datos de prueba
node scripts/seed-data.cjs
```

---

**Última actualización**: 23 de marzo de 2026
**Versión**: 1.0.0
**Estado**: ✅ Completo y funcional
