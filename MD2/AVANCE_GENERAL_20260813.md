# Avance General — 2026-08-13

## Resumen de cambios

### Módulo Matrículas (nuevo) — `src/pages/Matricula.tsx`
- Formulario de matrícula de nuevos estudiantes en 3 pasos: **1) Datos del estudiante**, **2) Datos del apoderado**, **3) Resumen y guardado**.
- Acceso: menú Inspectoría → **"Matrículas"** (roles ADMIN e INSPECTOR) → ruta `/inspectoria/matriculas` (`AppContent.tsx`, `Layout.tsx`).
- Guardado en la tabla `matriculas` vía `src/services/matricula.service.ts` (crear / guardar consentimientos / anular), con migración `supabase/migrations/043_create_matriculas.sql`.
- **Borrador local** en IndexedDB/`localStorage` (BORRADOR_KEY): se restaura al reingresar y se limpia al guardar.
- **Autocompletar (solo admin)**: botón ✨ que rellena el formulario con datos de prueba para validar el flujo.
- Tipos de matrícula (`MatriculaForm`, `ConsentimientoCasillaConfig`, etc.) en `src/types/index.ts`.

### Consentimientos Ley 21.719 (protección de datos)
- Sección posterior al guardado con **6 casillas** obligatorias/opcionales y su **"Ver detalle"** (derechos ARCO+, publicación de imágenes, etc.).
- La **última casilla** ("declaración de conocimiento") al marcarla **auto-marca todas las demás**; al desmarcarla, desmarca todas.
- Al marcar la última casilla aparece el bloque **"📄 Imprimir documentos para la firma del apoderado/a"** con los **2 PDF** (Autorización Uso de Imagen + Consentimiento Datos Personales). Se eliminó el link "Imprimir PDF" individual de cada casilla.
- Validación: no se puede guardar si falta una casilla obligatoria; el estado se persiste en `matriculas.consentimiento_aceptados`.

### PDF de consentimiento reales (rellenados por coordenadas)
- `src/services/consentimiento-pdf.service.ts` (`abrirPDFConsentimiento`): carga la plantilla real, rellena con jsPDF `fillFromData` en coordenadas predefinidas y abre el PDF para imprimir.
- Plantillas en `public/`:
  - `CONSENTIMIENTO PARA EL TRATAMIENTO DE DATOS PERSONALES.pdf`
  - `AUTORIZACIÓN PARA USO DE IMAGEN Y DIFUSIÓN INSTITUCIONAL.pdf`
- Fondos editables: `public/consentimiento_fondo-1.png`, `public/autorizacion_fondo-1.png`, vistas previas HTML (editor/vista previa).

### Región → Comuna (selects encadenados)
- Nuevo `src/data/comunas-chile.ts` con las 16 regiones y sus comunas.
- Selects encadenados en datos del estudiante y del apoderado: al cambiar región se **limpia la comuna**.
- Defaults: región **Biobío** / comuna **Concepción**.

### Electivos por nivel (1° y 2° Medio)
- Sección **"Solo Estudiantes de 1° y 2° Medio"** se habilita únicamente con `form.nivel` en `1` o `2`.
- Al cambiar a 3° o 4° Medio los electivos marcados se **limpian automáticamente**.

### PWA / íconos
- `public/manifest.json` e íconos `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` (reemplazan los `.svg` inexistentes).

## Archivos relevantes
| Archivo | Propósito |
|---------|-----------|
| `src/pages/Matricula.tsx` | Formulario de matrícula + flujo de consentimientos |
| `src/services/matricula.service.ts` | CRUD matrículas contra Supabase |
| `src/services/consentimiento-pdf.service.ts` | Relleno por coordenadas de los 2 PDF |
| `src/data/comunas-chile.ts` | Catálogo regiones → comunas |
| `supabase/migrations/043_create_matriculas.sql` | Tabla `matriculas` + RLS |
| `public/CONSENTIMIENTO ... .pdf`, `public/AUTORIZACIÓN ... .pdf` | Plantillas PDF reales |
| `src/AppContent.tsx`, `src/components/Layout.tsx`, `src/types/index.ts` | Ruta, menú y tipos |
| `public/manifest.json`, `public/icon-*.png`, `apple-touch-icon.png` | PWA |

## Verificación
- `npx tsc -b` limpio, `npx vite build` OK, `npx vitest run` → **12 archivos / 108 tests OK**.

## Estado git
- Cambios en working tree (módulo Matrículas + editor de formularios PDF) sin commit → **commit + push + deploy** en esta sesión.
- **Pendiente:** aplicar migración `043_create_matriculas.sql` en Supabase (no verificada remotamente por falta de token/Docker).

## Pendientes
- Aplicar/verificar migración 043 en Supabase.
- Probar flujo completo en producción (guardar → consentimientos → imprimir PDF → anular).
