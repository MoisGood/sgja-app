# Chat IA para Administración de Datos (Solo ADMIN)

Diseño detallado de un chat asistido por IA (Cloudflare Workers AI) dentro del perfil **ADMIN**, que permite **consultar** y **modificar** datos de la base de datos / tablas del sistema mediante lenguaje natural.

> Estado: **DISEÑO** (no implementado). Documento de referencia para desarrollo.

---

## 1. Objetivo

Permitir que un administrador haga consultas y cambios operativos a la base de datos a través de un chat conversacional, usando IA de Cloudflare para interpretar el lenguaje natural y ejecutar **operaciones predefinidas y seguras** contra Supabase.

**Casos objetivo (ejemplos del usuario):**

1. *"Necesito cambiar el horario, el cambio en fin: restar 30 minutos a todos."*
   → El chat confirma y aplica `hora_fin = hora_fin - 30 min` a todos los bloques.
2. *"Registra el atraso de un estudiante."*
   → Chat: *"Dime el RUT"*. Usuario: *"223231-2, hora 10:32"*. Chat: *"Listo"*.

---

## 2. Alcance

- **Solo rol ADMIN** puede ver y usar el chat.
- Aplica a los módulos existentes: Inspectoría (pases/justificaciones), Horarios (bloques), Establecimiento, Estudiantes.
- Las operaciones se limitan a un **catálogo cerrado de herramientas** (ver sección 7). **No se permite SQL libre generado por la IA.**
- El chat **no sustituye** a los mantenedores existentes; los complementa para acciones rápidas.

---

## 3. Arquitectura general

```
┌─────────────────────┐
│  Frontend (React)   │   Chat UI en Perfil ADMIN (móvil + escritorio)
│  sgja-app           │
└──────────┬──────────┘
           │ HTTPS + JWT de sesión
           ▼
┌─────────────────────┐
│  Worker Cloudflare  │   Orquestador: autoriza, enruta, ejecuta herramientas
│  (endpoint /chat)   │   · Service Role Key de Supabase (solo aquí)
│                     │   · Workers AI para interpretar lenguaje natural
└──────┬────────┬─────┘
       │        │
       │        └──►  Workers AI (Cloudflare) → { intención, parámetros, pregunta }
       │
       ▼
┌─────────────────────┐
│  Supabase           │   Solo se ejecutan operaciones de las "herramientas"
│  (REST / SQL)       │   con la Service Role Key (salta RLS, bajo control del Worker)
└─────────────────────┘
```

**Principio clave:** el frontend **nunca** tiene la Service Role Key ni ejecuta operaciones privilegiadas. Todo pasa por el Worker, que valida rol, traduce el mensaje a una herramienta y ejecuta.

---

## 4. Componentes

### 4.1 Frontend (React)

- Ubicación: componente `ChatAdminIA` montado solo cuando `rol === Rol.ADMIN`.
- Acceso: botón flotante (FAB) o pestaña dentro del perfil admin.
- Pantalla:
  - Lista de mensajes (usuario / asistente).
  - Campo de texto libre + botón enviar.
  - Indicador de "escribiendo…" mientras responde el Worker.
  - Estados: `confirmación pendiente` (botones Aceptar / Cancelar), `ejecutando`, `listo`, `error`.
- No almacena datos sensibles; el historial es efímero (por sesión) o guardado en localStorage con prefijo de usuario (opcional).

### 4.2 Worker Cloudflare

- Endpoint único: `POST /chat`.
- Responsabilidades:
  1. Validar autenticación (JWT de Supabase en header `Authorization`) y que el usuario sea **ADMIN** (consulta a tabla `usuarios`).
  2. Mantener la conversación: el Worker envía el **historial reciente** al LLM (contexto limitado a N mensajes).
  3. Obtener del LLM una decisión estructurada JSON (sección 6).
  4. Según la decisión:
     - `pregunta` → responder al usuario (el LLM redacta la pregunta).
     - `confirmacion` → devolver resumen + pausar hasta confirmación del usuario.
     - `ejecutar` (tras confirmación) → validar parámetros → llamar a Supabase.
  5. Registrar cada ejecución en la tabla de auditoría (sección 10).
- Variables de entorno del Worker:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY` (secret)
  - `AI_BINDING` (Workers AI)

### 4.3 Workers AI (Cloudflare)

- Modelo de chat recomendado: un modelo de razonamiento ligero con **tool calling / JSON mode** (p. ej. `@cf/meta/llama-3.x` o el que esté disponible en Workers AI con output JSON estructurado).
- Función: convertir el mensaje del usuario + historial en un **JSON** con la intención, la herramienta y los parámetros (sección 6).
- Alternativa más robusta: en lugar de que el LLM escriba SQL, que elija entre un **catálogo fijo de herramientas**; el Worker mapea cada herramienta a código SQL/operación **escrito a mano** (whitelist).

---

## 5. Flujo de una consulta (paso a paso)

### Ejemplo 2: "Registra el atraso de un estudiante"

1. Usuario (ADMIN): *"Registra el atraso de un estudiante"*.
2. Worker → Workers AI → JSON:
   ```json
   {
     "tipo": "pregunta",
     "necesita": ["rut", "hora"],
     "mensaje": "Dime el RUT del estudiante y la hora del atraso (HH:mm)."
   }
   ```
3. Chat responde al usuario: *"Dime el RUT y la hora"*.
4. Usuario: *"223231-2, hora 10:32"*.
5. Worker → Workers AI → JSON:
   ```json
   {
     "tipo": "confirmacion",
     "herramienta": "registrar_atraso",
     "parametros": { "rut": "223231-2", "hora": "10:32", "fecha": "2026-08-03" },
     "resumen": "Registrar atraso de RUT 223231-2 a las 10:32 (Bloque 3). ¿Confirmas?"
   }
   ```
6. El chat muestra el resumen con botones **Aceptar / Cancelar**.
7. Usuario acepta → Worker valida parámetros → ejecuta `crearSolicitud` + `justificarAtraso` (o la operación equivalente) → inserta auditoría.
8. Chat: *"Listo ✅ Se registró el atraso de …"*.

### Ejemplo 1: "Restar 30 minutos al horario"

1. Usuario: *"Cambiar el horario: restar 30 minutos a la hora fin de todos"*.
2. Workers AI → JSON:
   ```json
   {
     "tipo": "confirmacion",
     "herramienta": "ajustar_horario_bloques",
     "parametros": { "campo": "hora_fin", "operacion": "restar", "minutos": 30, "alcance": "todos" },
     "resumen": "Se restarán 30 min a la hora_fin de los 9 bloques activos. ¿Confirmas?"
   }
   ```
3. Confirmación obligatoria (cambio masivo).
4. Worker ejecuta:
   `UPDATE bloques_horarios SET hora_fin = hora_fin - interval '30 minutes' WHERE activo = true;`
5. Auditoría + respuesta *"Listo ✅ …"*.

---

## 6. Formato de decisión del LLM (JSON)

El Workers AI debe responder siempre JSON válido con uno de estos 3 tipos:

```jsonc
{
  "tipo": "pregunta",          // necesita más datos
  "necesita": ["rut", "hora"], // campos faltantes
  "mensaje": "Dime el RUT y la hora…",
  "herramienta": null,
  "parametros": null,
  "resumen": null
}
```

```jsonc
{
  "tipo": "confirmacion",      // lista para ejecutar, pide OK
  "herramienta": "registrar_atraso",
  "parametros": { "rut": "223231-2", "hora": "10:32", "fecha": "2026-08-03" },
  "resumen": "Registrar atraso de … ¿Confirmas?",
  "es_masivo": false,          // true obliga confirmación SIEMPRE
  "es_destructivo": false
}
```

```jsonc
{
  "tipo": "ejecutar",          // solo tras confirmación del usuario
  "herramienta": "registrar_atraso",
  "parametros": { "rut": "223231-2", "hora": "10:32", "fecha": "2026-08-03" }
}
```

> El Worker **nunca** ejecuta `ejecutar` sin que haya pasado por `confirmacion` (estado por conversación).

---

## 7. Catálogo de herramientas (whitelist inicial)

| Herramienta | Descripción | Parámetros | Confirmación |
|---|---|---|---|
| `registrar_atraso` | Crea solicitud de atraso para un estudiante (busca por RUT) | `rut`, `hora`, `fecha` (opcional, default hoy) | No (1 registro) |
| `registrar_inasistencia` | Crea solicitud de inasistencia (con/sin motivo) | `rut`, `fecha`, `motivo?`, `bloques[]?` | No |
| `justificar_atraso` | Marca atraso como justificado | `id_solicitud` o `rut`+`fecha` | No |
| `anular_pase` | Anula un pase existente | `id_solicitud` | Sí (destructivo) |
| `ajustar_horario_bloques` | Ajusta hora_inicio/hora_fin de bloques | `campo`, `operacion` (sumar/restar), `minutos`, `alcance` (todos/por bloque) | **Sí, siempre** (masivo) |
| `consultar_estudiante` | Devuelve datos del estudiante + últimas solicitudes | `rut` o `nombre` | No (solo lectura) |
| `consultar_horario` | Devuelve bloques del establecimiento | `establecimiento?` | No (solo lectura) |
| `consultar_solicitudes` | Lista solicitudes filtradas (fecha/curso/estado) | `fecha?`, `curso?`, `estado?` | No (solo lectura) |

**Reglas del catálogo:**
- La IA **solo elige** `herramienta` + `parametros`; **no genera SQL**.
- Cada herramienta tiene un mapeo **hardcodeado** en el Worker hacia una función Supabase existente (reusar `crearSolicitud`, `justificarAtraso`, `actualizarBloqueHorario`, etc.).
- Cualquier herramienta que toque más de N registros se marca `es_masivo` y **siempre exige confirmación**.

---

## 8. Seguridad

1. **Solo ADMIN**: el Worker verifica que el `auth.uid()` del JWT corresponda a un usuario `rol = 'ADMIN'` y `activo = true` en la tabla `usuarios` antes de responder cualquier cosa. Si no, `403`.
2. **Service Role Key solo en el Worker**: nunca viaja al frontend ni al repo (secret de Cloudflare).
3. **Sin SQL libre**: el LLM no escribe SQL. Solo selecciona herramientas del catálogo.
4. **Confirmación en 2 pasos**: toda acción de escritura pasa por `confirmacion` → `ejecutar`. Las masivas/destructivas lo exigen siempre.
5. **Validación de parámetros en el Worker**: tipos, rangos, formatos (RUT, HH:mm, fechas) antes de llamar a Supabase. Rechazar parámetros desconocidos.
6. **Rate limiting**: límite por usuario/hora en el Worker (p. ej. 30 mensajes/hora) para evitar abuso.
7. **Auditoría**: toda ejecución se registra (sección 10).
8. **Contexto acotado**: solo se envía al LLM el historial reciente + nombres de herramientas; **nunca** datos masivos ni claves.

---

## 9. Estado de la conversación

El Worker mantiene el estado mínimo por conversación en memoria / KV (Cloudflare KV opcional):

```jsonc
{
  "sessionId": "…",
  "userId": "…",
  "ultimaConfirmacion": {
    "herramienta": "ajustar_horario_bloques",
    "parametros": { "…": "…" },
    "resumen": "…"
  },
  "contextoPendiente": { "necesita": ["rut"] }
}
```

- `confirmacion` pendiente expira a los 2 minutos (si no responde, se cancela).
- Solo puede haber una confirmación pendiente a la vez.

---

## 10. Auditoría (tabla sugerida)

```sql
CREATE TABLE IF NOT EXISTS chat_admin_auditoria (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_usuario  UUID NOT NULL REFERENCES usuarios(id),
  sesion_id   TEXT,
  mensaje     TEXT,              -- lo que escribió el admin
  herramienta TEXT,
  parametros  JSONB,
  resultado   TEXT,              -- ok | error
  detalle     JSONB,             -- respuesta / error técnico
  creado_en   TIMESTAMP DEFAULT now()
);
```

- RLS: solo lectura para ADMIN; escritura vía Service Role (el Worker inserta).
- Esto permite responder *"¿qué cambios hice por chat?"* y auditar ante errores.

---

## 11. Manejo de errores

| Caso | Respuesta del chat |
|---|---|
| RUT no encontrado | *"No encontré un estudiante con RUT 223231-2. Verifica e intenta de nuevo."* |
| Hora fuera de horario (antes de 8:00 / después de 17:00) | *"La hora 10:32 está fuera del horario válido (08:00–17:00)."* |
| Bloque ya registrado para ese estudiante | *"Ese estudiante ya tiene un registro en ese bloque."* |
| Confimación expirada | *"La confirmación expiró. Repite la solicitud."* |
| Supabase devuelve error | Devuelve mensaje amigable + registra `detalle` en auditoría |
| Modelo IA no responde JSON válido | Reintenta 1 vez; si falla, *"No pude interpretar la solicitud."* |

---

## 12. Plan de implementación (fases)

1. **Fase 1 – Esqueleto**: endpoint `POST /chat` en el Worker, auth ADMIN, respuesta fija de eco (sin IA). Botón FAB de chat en perfil admin. *(validación de infraestructura)*
2. **Fase 2 – IA con solo lectura**: integrar Workers AI con catálogo de herramientas de consulta (`consultar_estudiante`, `consultar_horario`, `consultar_solicitudes`). Sin escrituras.
3. **Fase 3 – Escrituras con confirmación**: `registrar_atraso`, `registrar_inasistencia`, `justificar_atraso`, `anular_pase`. Confirmación en 2 pasos.
4. **Fase 4 – Masivos**: `ajustar_horario_bloques` con confirmación obligatoria + preview ("se afectarán 9 bloques").
5. **Fase 5 – Endurecimiento**: auditoría, rate limiting, tests de seguridad, mensajes de error pulidos.

---

## 13. Costos y límites (Workers AI)

- Workers AI tiene un plan gratuito con cuotas diarias (modelos de chat: unidades gratuitas por día). Para un uso administrativo (decenas de mensajes/día) suele ser más que suficiente.
- Alternativas si se necesita más control: usar el modelo de Cloudflare y mantener el catálogo de herramientas (recomendado), o un endpoint propio.

---

## 14. Decisiones pendientes (para definir antes de implementar)

- [ ] ¿El historial del chat se guarda (localStorage) o es efímero?
- [ ] ¿Se exponen también herramientas de **gestión de usuarios** (crear/desactivar) o solo datos?
- [ ] ¿El chat funciona también desde el **escritorio** o solo móvil? (recomendado: ambos, componente compartido)
- [ ] ¿Modelo de Workers AI a usar según disponibilidad del proyecto?
- [ ] ¿Confirmación también para cambios de 1 registro o solo masivos? (recomendado: escritura siempre confirma si hay `resumen`)
- [ ] ¿Auditar también las **consultas** o solo las **escrituras**? (recomendado: solo escrituras)
