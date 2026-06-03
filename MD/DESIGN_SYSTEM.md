# 📋 SGJA - Sistema de Diseño

## 🎯 Identidad Visual

### Nombre del Sistema
**SGJA** - Sistema de Gestión de Justificaciones y Atrasos

### Institución
**Liceo de Niñas - Concepción**

### Misión de la App
"Gestión integral y transparente de justificaciones de atrasos e inasistencias"

---

## 🎨 Paleta de Colores

### Colores Primarios
```
Azul Principal:     #1A3C6B (Profesional, confiable)
Azul Claro:         #2D5A9F (Hover, énfasis)
Azul Muy Claro:     #E0F2FE (Fondo, backgrounds)
```

### Colores Secundarios (Estados)
```
Verde Éxito:        #10B981 (Aprobadas, completadas)
Amarillo Alerta:    #F59E0B (En revisión, pendientes)
Rojo Rechazo:       #DC2626 (Rechazadas, errores)
Gris Neutral:       #6B7280 (Textos secundarios)
```

### Fondo
```
Fondo Principal:    #FFFFFF (Blanco puro)
Fondo Secundario:   #F9FAFB (Gris muy claro)
Fondo Gradiente:    De #1A3C6B a #2D5A9F (Headers, Login)
```

---

## 🔤 Tipografía

### Fuentes
- **Familia Principal**: Inter, system-ui, sans-serif
- **Pesos**: 400 (Regular), 600 (Semibold), 700 (Bold)

### Tamaños
```
H1 (Títulos principales):    3.5rem (56px) - Font bold
H2 (Subtítulos):             2rem (32px) - Font bold
H3 (Secciones):              1.5rem (24px) - Font bold
Body:                        1rem (16px) - Font regular
Small:                       0.875rem (14px) - Font regular
Extra Small:                 0.75rem (12px) - Font regular
```

---

## 📏 Espaciado (Tailwind)

### Espacios Base
```
xs:  4px  (w-1, h-1)
sm:  8px  (w-2, h-2)
md:  16px (w-4, h-4)
lg:  24px (w-6, h-6)
xl:  32px (w-8, h-8)
2xl: 48px (w-12, h-12)
```

### Aplicación
```
Padding Cards:      p-6 (24px)
Padding Buttons:    px-6 py-3 (24px horizontal, 12px vertical)
Gap entre cards:    gap-4 (16px)
Gap entre elementos: gap-2 o gap-3
```

---

## 🔘 Componentes Base

### Botones
```
Primario (Acción principal):
- Background: #1A3C6B
- Hover: #2D5A9F
- Texto: Blanco, bold
- Padding: px-6 py-3
- Border-radius: rounded-lg (8px)
- Sombra: shadow-md en hover

Secundario (Cancelar):
- Background: #F9FAFB
- Hover: #E5E7EB
- Texto: #1F2937, semibold
- Border: 1px solid #D1D5DB

Peligro (Eliminar, Rechazar):
- Background: #FEE2E2
- Hover: #FECACA
- Texto: #DC2626, bold
- Border: 1px solid #FECACA
```

### Tarjetas (Cards)
```
Background: #FFFFFF
Border: 1px solid #E5E7EB
Border-radius: rounded-xl (12px)
Padding: p-6 (24px)
Box-shadow: shadow-sm
Hover: shadow-md
```

### Inputs
```
Background: #FFFFFF
Border: 1px solid #D1D5DB
Border-radius: rounded-lg (8px)
Padding: px-4 py-2.5
Focus: ring-2 ring-blue-500
Placeholder: text-gray-400
```

### Badges (Estados)
```
Aprobada:
  - Background: #ECFDF5
  - Color: #065F46
  - Font: bold, text-xs

En revisión:
  - Background: #FFFBEB
  - Color: #92400E
  - Font: bold, text-xs

Rechazada:
  - Background: #FEE2E2
  - Color: #991B1B
  - Font: bold, text-xs

Pendiente/Injustificada:
  - Background: #EFF6FF
  - Color: #1E40AF
  - Font: bold, text-xs
```

---

## 📱 Responsive Breakpoints

```
Mobile (xs):    < 640px   - Diseño apilado, full width
Tablet (md):    768px+    - 2 columnas
Desktop (lg):   1024px+   - Diseño completo
Desktop (xl):   1280px+   - Layout de 4+ columnas
```

---

## 🎯 Estructura de Páginas

### Login
```
Layout:
  - Fondo: Gradiente azul (from-blue-600 to-blue-800)
  - Card central: White, rounded-3xl, shadow-2xl
  - Logo: 📋 en caja azul (w-16 h-16)
  - Título: "SGJA" H1 bold
  - Subtítulo: "Justificaciones de Atrasos" (gray-600)
  - Institución: "Liceo de Niñas - Concepción"
  - Botón: Primario, full width, con spinner
```

### Dashboard
```
Header:
  - Título con gradiente azul
  - Descripción corta

Stats Grid:
  - grid-cols-1 sm:grid-cols-2 lg:grid-cols-4
  - Cards con:
    - Icono grande (emoji o icon)
    - Título de stat
    - Número prominente
    - Borde izquierdo con color del estado

Tablas:
  - Desktop: grid claro con columnas
  - Mobile: Tarjetas compactas
  - Hover sobre filas
  - Estados con badges
```

### Formularios
```
Estructura:
  - Grid cols-1 md:cols-2 (2 columnas en desktop)
  - Labels: bold, gris oscuro
  - Inputs: Bordered, con focus ring
  - Espaciado: gap-6

Errores/Éxito:
  - Alerta roja para errores (bg-red-50, border red-200)
  - Alerta verde para éxito (bg-green-50, border green-200)
  - Ícono + texto descriptivo
```

---

## 🎬 Animaciones

```
Transiciones estándar:    transition-all (200ms)
Hover buttons:            scale-105 on hover
Click:                    scale-95 on active
Loading spinner:          animate-spin
Fade in/out:             opacity, duration-300
```

---

## 💡 Principios de Diseño

1. **Consistencia**: Mismo color primario en toda la app
2. **Claridad**: Estados visuales claros (success, error, pending)
3. **Minimalismo**: Sin elementos innecesarios
4. **Accesibilidad**: Colores con suficiente contraste
5. **Responsive**: Funciona perfectamente en mobile y desktop
6. **Profesional**: Adecuado para contexto educativo/administrativo

---

## 🔧 Implementación en Tailwind

### Clase Global de Botón Primario
```jsx
className="px-6 py-3 bg-[#1A3C6B] text-white font-bold rounded-lg hover:bg-[#2D5A9F] transition-all shadow-md hover:shadow-lg"
```

### Clase de Card Estándar
```jsx
className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
```

### Clase de Input Estándar
```jsx
className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
```

---

## 📊 Ejemplo de Jerarquía Visual

```
Login Page:
┌─────────────────────────────────┐
│  [Fondo Gradiente Azul]         │
│  ┌───────────────────────────┐  │
│  │ White Card (shadow-2xl)   │  │
│  │ ┌─────────────────────┐   │  │
│  │ │  📋 (w-16 h-16)     │   │  │
│  │ └─────────────────────┘   │  │
│  │ SGJA (H1 Bold)            │  │
│  │ Justificaciones... (gray) │  │
│  │ Liceo de Niñas (smaller)  │  │
│  │ ─────────────────────     │  │
│  │ [🔐 Iniciar Sesión] (lg)  │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

---

## 🎓 Valores de la Institución (Reflejados en Diseño)

- **Profesionalismo**: Colores corporativos, tipografía clara
- **Confiabilidad**: Azul como color primario
- **Transparencia**: Información clara, fácil de leer
- **Accesibilidad**: Diseño responsive, legible
- **Eficiencia**: Interfaz intuitiva, rápida de usar

