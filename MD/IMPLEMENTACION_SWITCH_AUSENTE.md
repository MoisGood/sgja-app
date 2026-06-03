# 📋 Análisis: Nueva Lógica de Lista (Switch Ausente/Presente)

## 🎯 Cambios Requeridos

### **ANTES (Lógica Actual)**
```
Botón 1: ⏰ ATRASO
Botón 2: ❌ INASISTENCIA

Profesor registra tipo INMEDIATAMENTE cuando hace clic
```

### **DESPUÉS (Nueva Lógica con Switch)**
```
Switch: ⭕ AUSENTE (ON/OFF)
        ├─ OFF (encendido): Estudiante PRESENTE ✓
        └─ ON (apagado): Estudiante AUSENTE ✗

Profesor SOLO marca AUSENTE/PRESENTE
Sistema registra automáticamente en Firestore
Inspector VE la ausencia y DEFINE si es ATRASO o INASISTENCIA
```

---

## 🔄 Nuevo Flujo

```
TIMELINE:

08:00 ─────────────────────────────────
      Profesor abre lista en móvil
      │
      ├─► Estudiante 1: ✓ PRESENTE (switch OFF)
      ├─► Estudiante 2: ✗ AUSENTE (switch ON)
      ├─► Estudiante 3: ✓ PRESENTE (switch OFF)
      │
      └─► Firestore ACTUALIZA (crea ausencia para Est 2)

08:30 ─────────────────────────────────
      Estudiante 2 LLEGA
      │
      ├─► Inspector VE: "Est 2 - AUSENTE desde 08:00"
      │
      ├─► Inspector REGISTRA:
      │   ├─ Tipo: ATRASO (porque ahora es 08:30)
      │   ├─ Motivo: "Problema de transporte"
      │   └─ Estado: JUSTIFICADA
      │
      └─► Firestore: ACTUALIZA Solicitud
          └─ tipo = ATRASO
          └─ estado = JUSTIFICADA
          └─ motivo_descripcion = "Problema de transporte"

08:35 ─────────────────────────────────
      Profesor VE en su lista actualizada:
      
      Estudiante 2: ✗ AUSENTE (PERO GRIS/DESHABILITADO)
      └─ Mensaje: "Inspectoría (Usuario: Pedro Pérez)
                   ya modificó esta justificación como ATRASO"
      
      Profesor PUEDE VER pero NO PUEDE CAMBIAR
```

---

## 🗄️ Cambios en Base de Datos

### **Nueva Colección: `registros_lista`**

```typescript
// Firestore: /establecimientos/{id_est}/registros_lista/{fecha}_{bloque}

interface RegistroLista {
  id_registro: string;
  id_establecimiento: string;
  fecha: string;                    // 2026-04-05
  id_bloque: string;                // "bloque_1"
  nombre_bloque: string;            // "Bloque 1 (08:00-09:00)"
  id_profesor: string;              // Quién pasó la lista
  hora_inicio: string;              // 08:00
  hora_fin: string;                 // 09:00
  
  // Mapa de estudiantes
  estudiantes: {
    [id_estudiante: string]: {
      id_estudiante: string;
      nombre_completo: string;
      rut: string;
      estado: 'PRESENTE' | 'AUSENTE';  // ← El switch ON/OFF
      hora_registro: string;            // Cuándo se marcó
      
      // Campos para saber si inspector ya actuó
      justificada_por?: string;         // ID del inspector
      tipo_justificacion?: 'ATRASO' | 'INASISTENCIA';
      motivo_justificacion?: string;
      hora_justificacion?: string;
    }
  }
  
  actualizado_en: timestamp;
}
```

### **Cambios en Solicitud**

```typescript
export interface Solicitud {
  // Campos existentes...
  
  // Agregar estos:
  id_registro_lista?: string;          // ← Vinculado a RegistroLista
  origen: 'LISTA' | 'MANUAL';          // ← De dónde vino
  id_bloque: string;                   // ← Bloque afectado
  justificada_por?: string;            // ← Quién la justificó
  hora_justificacion?: string;         // ← Cuándo se justificó
}
```

---

## 💻 Cambios en Interfaz (Móvil - Profesor)

### **ANTES**
```
┌───────────────────────────────────────┐
│ 👤 Juan López                        │
│ RUT: 12345678-9                      │
│ Estado: PRESENTE                     │
│                                      │
│ [⏰ Atraso] [❌ Inasistencia]        │
└───────────────────────────────────────┘
```

### **DESPUÉS**
```
┌───────────────────────────────────────┐
│ 👤 Juan López                        │
│ RUT: 12345678-9                      │
│                                      │
│ ✓ PRESENTE        ✗ AUSENTE         │
│  (OFF)             (ON)              │
│  ◯────────○       ◯────────●        │
│                                      │
│ [Cambiar estado]                     │
└───────────────────────────────────────┘

┌───────────────────────────────────────┐
│ 👤 María García                      │
│ RUT: 98765432-1                      │
│                                      │
│ ✓ PRESENTE        ✗ AUSENTE         │
│  (OFF)             (ON - BLOQUEADO) │
│  ◯────────◯       ◯────────●        │
│                   (GRIS)             │
│                                      │
│ ⚠️ Inspectoría (Marisa López)       │
│    ya modificó como ATRASO           │
└───────────────────────────────────────┘
```

---

## 🔧 Cambios en Código

### **1. Componente Switch Ausente/Presente**

```typescript
interface SwitchAusenteProps {
  idEstudiante: string;
  estado: 'PRESENTE' | 'AUSENTE';
  bloqueado: boolean;
  justificadoPor?: string;
  tipoJustificacion?: string;
  onChange: (nuevoEstado: 'PRESENTE' | 'AUSENTE') => void;
}

function SwitchAusente({
  idEstudiante,
  estado,
  bloqueado,
  justificadoPor,
  tipoJustificacion,
  onChange,
}: SwitchAusenteProps) {
  const esAusente = estado === 'AUSENTE';

  return (
    <div style={styles.containerSwitch}>
      {/* Switch Visual */}
      <div style={{
        ...styles.switchContainer,
        ...(bloqueado && styles.switchBloqueado),
      }}>
        {/* Lado PRESENTE */}
        <div style={{
          ...styles.switchSide,
          ...(!esAusente && styles.switchSideActivo),
        }}>
          ✓ PRESENTE
        </div>

        {/* Slider */}
        <button
          onClick={() => !bloqueado && onChange(esAusente ? 'PRESENTE' : 'AUSENTE')}
          disabled={bloqueado}
          style={{
            ...styles.switchSlider,
            ...(esAusente && styles.switchSliderActivo),
            ...(bloqueado && styles.switchSliderBloqueado),
          }}
        >
          ●
        </button>

        {/* Lado AUSENTE */}
        <div style={{
          ...styles.switchSide,
          ...(esAusente && styles.switchSideActivo),
        }}>
          ✗ AUSENTE
        </div>
      </div>

      {/* Mensaje si está bloqueado */}
      {bloqueado && justificadoPor && (
        <div style={styles.mensajeBloqueado}>
          ⚠️ Inspectoría ({justificadoPor}) ya modificó como {tipoJustificacion}
        </div>
      )}
    </div>
  );
}
```

### **2. Lógica en DashboardProfesor.tsx**

```typescript
// Estado para tracking de cambios
const [estadosEstudiantes, setEstadosEstudiantes] = useState<
  Record<string, {
    estado: 'PRESENTE' | 'AUSENTE';
    bloqueado: boolean;
    justificadoPor?: string;
    tipoJustificacion?: string;
  }>
>({});

// Cargar lista existente para este bloque
const cargarRegistroLista = async (bloque: string) => {
  const registroLista = await obtenerRegistroLista(
    idEstablecimiento,
    new Date().toISOString().split('T')[0],
    bloque
  );

  if (registroLista?.estudiantes) {
    const nuevoEstados: typeof estadosEstudiantes = {};
    
    registroLista.estudiantes.forEach((est) => {
      nuevoEstados[est.id_estudiante] = {
        estado: est.estado,
        bloqueado: !!est.justificada_por,
        justificadoPor: est.justificada_por,
        tipoJustificacion: est.tipo_justificacion,
      };
    });

    setEstadosEstudiantes(nuevoEstados);
  }
};

// Manejador de cambio de estado
const handleCambiarEstado = async (
  idEstudiante: string,
  nuevoEstado: 'PRESENTE' | 'AUSENTE'
) => {
  // No permitir cambiar si está bloqueado
  const estadoActual = estadosEstudiantes[idEstudiante];
  if (estadoActual?.bloqueado) {
    setError('Inspectoría ya ha justificado esta ausencia');
    return;
  }

  try {
    // Actualizar Firestore (registros_lista)
    await actualizarRegistroLista({
      id_establecimiento: idEstablecimiento,
      fecha: new Date().toISOString().split('T')[0],
      id_bloque: bloqueActual,
      id_estudiante: idEstudiante,
      nuevoEstado,
      id_profesor: profesorActual,
    });

    // Actualizar estado local
    setEstadosEstudiantes({
      ...estadosEstudiantes,
      [idEstudiante]: {
        ...estadoActual,
        estado: nuevoEstado,
      },
    });

    // Si cambió a AUSENTE, crear Solicitud INJUSTIFICADA
    if (nuevoEstado === 'AUSENTE') {
      await crearSolicitud({
        id_solicitud: `lista_${idEstudiante}_${Date.now()}`,
        id_establecimiento: idEstablecimiento,
        id_estudiante: idEstudiante,
        id_profesor: profesorActual,
        tipo: TipoRegistro.ATRASO, // Defecto, inspector cambia
        fecha: new Date().toISOString().split('T')[0],
        hora: new Date().toTimeString().slice(0, 5),
        estado: EstadoSolicitud.INJUSTIFICADA,
        origen: 'LISTA',
        id_bloque: bloqueActual,
        // ... otros campos
      });
    }
  } catch (err) {
    setError('Error al actualizar estado');
  }
};
```

---

## 🎨 Estilos CSS

```typescript
const styles = {
  containerSwitch: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  
  switchContainer: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: '20px',
    padding: '4px',
    height: '40px',
    position: 'relative',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },

  switchBloqueado: {
    backgroundColor: '#e5e5e5',
    cursor: 'not-allowed',
    opacity: 0.7,
  },

  switchSide: {
    flex: 1,
    textAlign: 'center',
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#666',
    transition: 'all 0.3s ease',
    userSelect: 'none',
  },

  switchSideActivo: {
    color: '#fff',
  },

  switchSlider: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#fff',
    color: '#666',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    transform: 'translateX(0)',
  },

  switchSliderActivo: {
    backgroundColor: '#dc2626',
    color: '#fff',
    transform: 'translateX(calc(100% + 4px))',
  },

  switchSliderBloqueado: {
    cursor: 'not-allowed',
    backgroundColor: '#d1d5db',
  },

  mensajeBloqueado: {
    fontSize: '11px',
    color: '#dc2626',
    fontWeight: 'bold',
    padding: '4px 8px',
    backgroundColor: '#fee2e2',
    borderRadius: '4px',
    textAlign: 'center',
  },
};
```

---

## ✅ Checklist de Implementación

### **FASE 1: Base de Datos**
- [ ] Crear colección `registros_lista`
- [ ] Agregar campos a `Solicitud`
- [ ] Crear funciones Firestore para CRUD de `registros_lista`

### **FASE 2: Componentes**
- [ ] Crear componente `SwitchAusente`
- [ ] Integrar en vista móvil (DashboardProfesor)
- [ ] Estilos responsivos

### **FASE 3: Lógica**
- [ ] Cargar registro lista existente
- [ ] Actualizar registro lista en tiempo real
- [ ] Crear Solicitud cuando marca AUSENTE
- [ ] Bloquear switch cuando inspector justifica

### **FASE 4: Inspector**
- [ ] Ver estudiantes AUSENTES
- [ ] Seleccionar tipo (ATRASO/INASISTENCIA)
- [ ] Actualizar registro lista (bloquea switch)
- [ ] Guardar tipo y motivo en Solicitud

### **FASE 5: Testing**
- [ ] Móvil
- [ ] Desktop
- [ ] Sincronización tiempo real
- [ ] Deploy

---

## 📊 Estimado

| Fase | Tiempo |
|------|--------|
| BD + Funciones | 1h |
| Componentes | 1.5h |
| Lógica | 2h |
| Inspector | 1.5h |
| Testing | 1h |
| **TOTAL** | **7h** |

---

## 🎯 Resultado Final

```
✅ Profesor: Solo marca PRESENTE/AUSENTE con switch
✅ Inspector: Define tipo (ATRASO/INASISTENCIA) + motivo
✅ Profesor: Ve bloqueado cuando inspector actúa
✅ Sistema: Auditoría completa de quién hizo qué
✅ Tiempo Real: Sincronización instantánea
```
