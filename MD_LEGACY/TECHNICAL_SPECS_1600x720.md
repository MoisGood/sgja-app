# 🎯 Especificaciones Técnicas - Resolución 1600x720

## 📐 Breakpoint: esDesktopMuyGrande (1600px - 1919px)

### Activación
```typescript
const esDesktopMuyGrande = anchoVentana >= 1600 && anchoVentana < 1920;
```

### Condición
```javascript
if (anchoVentana >= 1600) {
  // Se activa este breakpoint
  // Todos los valores se establecen a continuación
}
```

---

## 📏 Valores Aplicados en 1600x720

### 1. Contenedor Principal
```
padding:     32px          (Amplio)
max-width:   1400px        (Centrado horizontal)
margin:      0 auto        (Centrado)
backgroundColor: #F9FAFB  (Gris claro)
minHeight:   100vh         (Altura mínima de pantalla)
```

### 2. Tipografía

| Elemento | Tamaño | Uso |
|----------|--------|-----|
| Labels | **15px** | Etiquetas de formularios |
| Inputs | **15px** | Campos de texto |
| Títulos | **19px** | Encabezados de secciones |
| Iconos | **20px** | Botones de acciones |
| Celdas tabla | **15px** | Contenido de tabla |

**Legibilidad**: ✅ Excelente en pantalla de 1600x720

### 3. Espaciado

| Variable | Valor |
|----------|-------|
| `margenGrande` | 40px |
| `margenPequeno` | 20px |
| `paddingContenedor` | 32px |

### 4. Botones

| Propiedad | Valor |
|-----------|-------|
| minHeight | 44px |
| minWidth | 44px |
| padding | 8px 12px |
| Accesibilidad | ✅ Excelente |

### 5. Tabla

**Filaencabezado**:
- padding: 14px 16px
- fontSize: 15px (fontSizeLabel)
- Altura: Automática con padding

**Filas de datos**:
- padding: 14px 16px
- fontSize: 15px (fontSizeCelda)
- Altura: Automática

**Grid**:
- Columnas: Auto (adaptadas por contenido)
- Gap: 0px (separación vertical de filas)

### 6. Formularios

**Inputs/Selects**:
- padding: 10px 12px
- fontSize: 15px
- border: 1px solid #D1D5DB
- borderRadius: 6px
- backgroundColor: #FFFFFF

**Campos apilados en**:
- displayGrid: (responsive)
- gapDinámico: 16px (en desktop)

### 7. Pestañas

**botonPestana**:
- padding: 12px 20px
- fontSize: 15px (fontSizeLabel)
- backgroundColor: #F3F4F6
- borderBottom: 3px solid transparent

**botonPestanaActivo**:
- backgroundColor: #FFFFFF
- borderBottomColor: #1A3C6B

### 8. Mensajes y Avisos

**Mensaje de error**:
- padding: 12px
- backgroundColor: #FEE2E2
- color: #991B1B
- fontSize: 15px

**Mensaje de éxito**:
- padding: 12px
- backgroundColor: #DCFCE7
- color: #166534
- fontSize: 15px

---

## 🎨 Paleta de Colores

| Color | Uso |
|-------|-----|
| #255aa3ff | Encabezados de tabla |
| #1A3C6B | Botones primarios, bordes activos |
| #F9FAFB | Fondo contenedor |
| #F3F4F6 | Fondo secundario, botones no activos |
| #FFFFFF | Fondo inputs, fondo botones activos |
| #E5E7EB | Bordes, botones terciarios |
| #D1D5DB | Bordes inputs |
| #6B7280 | Texto terciario |
| #374151 | Texto primario |
| #1F2937 | Texto de énfasis |
| #10B981 | Éxito (check verde) |
| #DC2626 | Error (X roja) |
| #DBEAFE | Seleccionado/Hover |
| #93C5FD | Borde seleccionado |

---

## 📸 Apariencia en 1600x720

### Layout General
```
┌─────────────────────────────────────────────┐
│  32px padding                               │
│  ┌───────────────────────────────────────┐  │
│  │                                       │  │
│  │   SGJA - Registrar Justificación     │  │
│  │   font: 19px (grande y claro)        │  │
│  │                                       │  │
│  │   [Pestañas] [Pestañas]              │  │
│  │                                       │  │
│  │   BUSCAR                              │  │
│  │   ┌─────────────────────────────────┐ │  │
│  │   │ Ingresa RUT o nombre            │ │  │
│  │   └─────────────────────────────────┘ │  │
│  │   font: 15px (legible)                │  │
│  │                                       │  │
│  │   TABLA (toda visible sin scroll H)  │  │
│  │   ┌───────────────────────────────┐  │  │
│  │   │ Nombre  │ RUT  │ Curso │ Más │  │  │
│  │   ├───────────────────────────────┤  │  │
│  │   │ Datos   │ Datos│ Datos │ ⚙️   │  │  │
│  │   │ (15px)  │      │       │(20px)  │  │
│  │   └───────────────────────────────┘  │  │
│  │                                       │  │
│  │   [Botón] [Botón]                    │  │
│  │   44x44px mínimo                     │  │
│  │                                       │  │
│  └───────────────────────────────────────┘  │
│  32px padding (inferior)                    │
└─────────────────────────────────────────────┘

max-width: 1400px
centrado automáticamente
```

### Elementos Clave
- ✅ Tabla completamente visible
- ✅ No hay scroll horizontal innecesario
- ✅ Fuentes grandes y legibles
- ✅ Espaciado amplio
- ✅ Botones accesibles
- ✅ Iconos claros (20px)

---

## 🔄 Cambio de Breakpoints

Si cambias el ancho de la ventana:

| Acción | Nuevo Breakpoint |
|--------|------------------|
| 1600 → 1500 | **esDesktopGrande** (valores diferentes) |
| 1600 → 1700 | **esDesktopMuyGrande** (mismo) |
| 1600 → 1920 | **es4K** (valores más grandes) |

Cada cambio automáticamente recalcula todos los valores.

---

## 🎯 Optimización Específica

### ¿Por qué 1600px es especial?

En 1600x720:
- ✅ La tabla cabe completamente horizontalmente
- ✅ Las fuentes son grandes pero no excesivas
- ✅ El espaciado es proporcionado (32px)
- ✅ Es una resolución común en:
  - Laptops 16:9 con zoom 125%
  - Monitores Full HD widescreen
  - Tablets horizontales grandes
  - Algunos notebooks de 15-17"

### Ventajas de este breakpoint
1. **Utilización de espacio**: Aprovecha el ancho disponible
2. **Legibilidad**: Fuentes del 15px son confortables
3. **Accesibilidad**: Botones de 44px son fáciles de hacer click
4. **Consistencia**: Proporción aurea entre padding y contenido

---

## 💻 Implementación en Código

### TypeScript (src/pages/RegistrarJustificacion.tsx)
```typescript
const esDesktopMuyGrande = anchoVentana >= 1600 && anchoVentana < 1920;

if (esDesktopMuyGrande) {
  paddingContenedor = '32px';
  margenGrande = '40px';
  margenPequeno = '20px';
  fontSizeLabel = '15px';
  fontSizeInput = '15px';
  fontSizeTitulo = '19px';
  fontSizeIcono = '20px';
  fontSizeCelda = '15px';
  minHeightButton = '44px';
  minWidthButton = '44px';
}

return {
  contenedor: {
    padding: paddingContenedor,     // 32px
    maxWidth: '1400px',             // Centrado
    margin: '0 auto',
    // ... más estilos que usan estas variables
  }
}
```

### CSS (src/pages/RegistrarJustificacion.css)
```css
/* DESKTOP GRANDE - 1600px (Full HD Wide) */
@media (min-width: 1600px) {
  .contenedor {
    padding: 32px;
    max-width: 1400px;
    margin: 0 auto;
  }
  
  .label {
    font-size: 15px;
  }
  
  .input {
    font-size: 15px;
    padding: 10px 12px;
  }
  
  .iconoProhibido {
    font-size: 20px;
  }
  
  /* ... más estilos adaptados para 1600px */
}
```

---

## ✨ Resultado Visual

En 1600x720 verás:

```
ANTES (solo 2 breakpoints):
- Fuentes pequeñas (14px)
- Padding normal (24px)
- Botones compactos (36px)

DESPUÉS (9 breakpoints):
- Fuentes grandes (15px) ✅
- Padding amplio (32px) ✅
- Botones accesibles (44px) ✅
```

---

## 📊 Comparación de Breakpoints

| Breakpoint | Ancho Mín | Padding | Font L | Font I | Font T | Font I | Min B |
|-----------|----------|---------|--------|--------|--------|--------|-------|
| Mobile S | 320px | 12px | 11px | 12px | 13px | 16px | 36px |
| Mobile | 375px | 14px | 12px | 13px | 14px | 16px | 36px |
| Mobile L | 480px | 16px | 12px | 14px | 15px | 16px | 36px |
| Tablet S | 600px | 18px | 13px | 14px | 16px | 17px | 40px |
| Tablet | 768px | 20px | 13px | 14px | 16px | 18px | 44px |
| Desktop | 1024px | 24px | 14px | 14px | 17px | 18px | 44px |
| Desktop G | 1280px | 24px | 14px | 15px | 18px | 19px | 44px |
| **Desktop MG** | **1600px** | **32px** | **15px** | **15px** | **19px** | **20px** | **44px** ⭐ |
| 4K | 1920px | 40px | 16px | 16px | 20px | 22px | 44px |

---

**Nota**: Todos estos valores se aplican automáticamente cuando el navegador detecta un ancho ≥ 1600px.

No es necesario configurar nada manualmente. La aplicación detecta el tamaño y se adapta.

---

**Versión**: 1.0
**Última actualización**: Ahora
**Breakpoint documentado**: esDesktopMuyGrande (1600px - 1919px)
