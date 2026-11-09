# Bosko — PRD v1

Estado: borrador acordado en entrevista el 2026-11-08. Las decisiones están guardadas en Engram bajo `prd/bosko-v1/*`. Los flujos actuales del código están en `docs/FLOWS.md` (mapa retroactivo, desactualizado); este documento describe el producto objetivo de la versión 1.

## 1. Qué es Bosko

Marketplace móvil que conecta a clientes con proveedores de servicios a domicilio en su misma ciudad. Bosko **coordina** (solicitud, chat, seguimiento, reseñas) y **no cobra**: el cliente le paga directamente al proveedor, fuera de la app.

## 2. Alcance de v1

**Dentro**
- Cuenta única con dos modos (cliente y proveedor).
- Verificación del proveedor por KYC (Didit) y teléfono.
- Un servicio por proveedor, con foto principal.
- Galería **Trabajos** (fotos de trabajos terminados).
- Solicitud de cotización → orden → chat → cierre → reseña.
- Notificaciones push e internas, denuncias, bloqueo, suspensión.
- Dos mercados separados: Tandil (Argentina) y Barranquilla (Colombia).

**Fuera (próxima versión)**
- Pagos, checkout, planes y suscripciones.
- Reels (el código queda tras `FEATURES.reels = false`).
- Lectura offline y cola de envíos.
- Reseñas del proveedor hacia el cliente.
- Panel de administración de disputas.
- Filtros por precio y calificación mínima.
- Ubicación por GPS y filtro por barrio.

## 3. Roles

| Rol | Cómo se llega | Qué puede hacer |
|---|---|---|
| Cliente | Todo usuario registrado | Buscar, cotizar, chatear, cerrar órdenes, reseñar, guardar favoritos, denunciar |
| Proveedor pendiente | Inició el KYC y aún no fue aprobado | Lo mismo que un cliente; ve el estado del KYC |
| Proveedor | KYC aprobado y teléfono verificado | Además: publicar su servicio, subir fotos a Trabajos, aceptar o rechazar solicitudes |
| Admin | Asignado por el equipo | Revisar denuncias y fotos ocultas |

Una misma cuenta puede ser cliente y proveedor a la vez. No puede pedirse un servicio a sí misma (`CANNOT_ORDER_OWN_SERVICE`).

## 4. Mercados

| | Tandil | Barranquilla |
|---|---|---|
| País | Argentina | Colombia |
| Moneda | ARS | COP |
| Documento KYC | DNI | Cédula de ciudadanía |
| Prefijo de teléfono | +54 | +57 |

- La ciudad se elige al registrarse y define el mercado del usuario. No hay catálogo cruzado: cada usuario solo ve proveedores, precios y Trabajos de su ciudad.
- Cobertura: el proveedor atiende **toda su ciudad**. No hay barrios ni filtro por zona.
- Textos: español neutro, único para ambos mercados.
- Términos: un solo documento para ambos países, con aceptación al registrarse. **Riesgo abierto:** dos regímenes legales y revisión de las tiendas; sin verificación de edad ni versión por país. Conviene revisarlo con asesoría legal antes de publicar.

## 5. Flujos de principio a fin

### 5.1 Registro y acceso

1. Onboarding (primer uso) → registro (email y contraseña, o Google) con **elección de ciudad** y aceptación de términos.
2. Verificación de email por código de 6 dígitos (válido 10 minutos).
3. Video de bienvenida (una vez) → Inicio.

No hay acceso sin cuenta: `app/index.tsx` redirige a login si no hay sesión.

| Error | Qué ve el usuario |
|---|---|
| Credenciales inválidas | Mensaje claro, sin revelar si el email existe |
| Email ya registrado | Mensaje con enlace a iniciar sesión |
| Código vencido o inválido | Mensaje y botón "Reenviar código" con espera de 60 s (`POST /auth/resend-verification`, 429 por abuso) |
| Sesión revocada | Cierre de sesión y vuelta a login |
| Cuenta suspendida | Pantalla de suspensión (ver 5.9) |
| Sin conexión | Barra global "Sin conexión" (ver 5.10) |

### 5.2 Convertirse en proveedor

1. Perfil → "Ser proveedor" → introducción del KYC.
2. Captura del documento y selfie con Didit (documento según el país de la ciudad).
3. Verificación del teléfono (Firebase). **Obligatoria para proveedores.**
4. Estados: `in_progress` → `pending` → `approved`.
5. Con `approved`, el usuario puede crear su servicio.

| Estado | Qué ve |
|---|---|
| `rejected` / `declined` | Motivo y botón "Reintentar" mientras queden intentos |
| `failed` / `expired` | Mensaje distinto (error técnico o del proceso) y reintento que **no consume intento** |
| Intentos agotados | Mensaje y botón para contactar a soporte por **WhatsApp** |
| Sin conexión durante el KYC | El proceso es retomable: vuelve a `KYCStatusScreen` |

Los antecedentes penales son opcionales y dan una insignia de confianza. No bloquean la publicación.

### 5.3 Publicar el servicio

1. Perfil → "Mi servicio" → formulario: título (10 a 255 caracteres), descripción (mínimo 20), categoría, precio opcional "desde $X" (moneda de la ciudad) y **foto principal obligatoria**.
2. Aparece en el catálogo cuando cumple todo lo anterior.
3. Un proveedor tiene **un solo servicio**. Si intenta crear otro, el servidor responde 422 `SERVICE_LIMIT_REACHED` y la app avisa.
4. La categoría no se puede cambiar después de publicar.

| Error | Qué ve |
|---|---|
| Validación del formulario | Mensajes por campo antes de enviar |
| Falla la subida de la foto | Aviso "Servicio publicado / Cambios guardados, pero no se pudo subir la foto" y vuelta a editar |
| Límite de servicios | Aviso claro, sin intentar crear otro |

### 5.4 Trabajos (galería)

- Pestaña pública dentro de la app (siempre con sesión): fotos de trabajos terminados del mercado del usuario, filtro por categoría y scroll infinito.
- Tocar una foto abre el detalle con el proveedor y el botón **Cotizar**. Se puede **denunciar**. No hay likes ni comentarios.
- El proveedor sube, edita y borra sus fotos en "Mis trabajos". Límite: 30 por proveedor.
- Se publican al instante. Con **3 denuncias** distintas se ocultan automáticamente hasta que un admin las revise; el proveedor recibe un aviso.

| Error | Qué ve |
|---|---|
| Formato o tamaño inválido | "Formato no compatible" o límite de tamaño; la app redimensiona a 2048 px y reencoda |
| Límite de 30 fotos | Aviso con `POST_LIMIT_REACHED` |
| Muchas subidas seguidas | Aviso de espera (`RATE_LIMITED`, 5 por minuto) |
| Foto ocultada | Notificación y estado "oculta" en Mis trabajos |
| Sin conexión | Error claro y botón de reintento; el feed vuelve a cargar al reconectar |

### 5.5 Descubrir y elegir

- Inicio: categorías y destacados. Búsqueda por texto y por categoría.
- Orden: por calificación y cantidad de reseñas, con los verificados primero.
- Perfil del proveedor: servicio, fotos, reseñas, insignia de antecedentes, botón **Cotizar**.
- Favoritos guardados en la cuenta (se sincronizan entre dispositivos).

### 5.6 Solicitud y orden

Máquina de estados de la orden:

```
pending ──accept──> accepted ──start──> in_progress ──"terminado"──> awaiting_confirmation ──confirma / 3 días──> completed
   │                    │                    │                                  │
   ├─ reject / vence 48h│                    │                                  │
   ▼                    ▼                    ▼                                  ▼
cancelled           cancelled             disputed                          disputed
```

1. El cliente completa el formulario: descripción y fecha deseada (opcional). Se crea la orden `pending` y se abre el chat.
2. El proveedor acepta o rechaza. Si no responde en **48 horas**, la orden pasa a cancelada por falta de respuesta y el cliente recibe un aviso.
3. Cliente o proveedor pueden **cancelar con motivo** mientras la orden está `pending` o `accepted`.
4. El proveedor la inicia (`in_progress`). A partir de ahí solo se puede **abrir una disputa**.
5. Al terminar, el proveedor marca "terminado". El cliente confirma; si no responde en **3 días**, se cierra sola.
6. Al pasar a `completed`, el chat queda de solo lectura y se habilita la reseña.

| Error | Qué ve |
|---|---|
| Servicio ya no disponible | Mensaje y vuelta al catálogo |
| Orden ya cancelada o vencida | Detalle actualizado y acciones deshabilitadas |
| Transición inválida (409) | "La orden cambió de estado", con la vista refrescada |
| Fecha inválida | La fecha es opcional; se envía en formato ISO desde el selector |
| Sin conexión | Error claro y reintento; no se pierde el texto del formulario |

### 5.7 Chat

- Un chat por orden. Sin mensajes directos.
- Texto, imagen, video (hasta 60 s) y audio. Indicador de escritura. Tiempo real por socket con polling de respaldo.
- Menú del chat: **denunciar al usuario** y **bloquearlo**.
- Orden `completed` o `cancelled`: solo lectura (`ORDER_CLOSED`, 409). En `disputed` se puede escribir.

| Error | Qué ve |
|---|---|
| Mensaje no enviado | Marca de error en la burbuja y botón de reintento |
| `ORDER_CLOSED` | El chat pasa a solo lectura con aviso |
| Socket caído | Polling de respaldo y reconexión |
| Usuario bloqueado | No puede escribir; el bloqueo se informa sin detalles |

### 5.8 Cierre, reseñas y disputas

- **Reseña:** solo el cliente califica al proveedor (estrellas y comentario) después de `completed`. El proveedor puede responder. Una reseña por orden (`ALREADY_REVIEWED`). Cualquiera puede denunciar una reseña.
- **Disputa:** cualquiera de las dos partes la abre con motivo. La resuelve **soporte a mano por WhatsApp**: contacta a ambas partes y deja el resultado registrado. Como no hay dinero en la app, el resultado es de reputación (advertencia, suspensión o nota en la orden).

### 5.9 Denuncias y suspensión

- Se puede denunciar a un usuario, una reseña, una foto de Trabajos y un reel.
- Las denuncias llegan al panel admin (`/admin/reports`).
- **Suspensión total:** pantalla con motivo general y contacto de soporte por WhatsApp; se cierra la sesión y no se puede usar la app.

### 5.10 Notificaciones y estado de red

- **Avisos:** nueva solicitud, orden aceptada o rechazada, "terminado, confirmá", cierre automático, vencimiento, mensaje nuevo, resultado del KYC, foto ocultada, reseña recibida, respuesta a una reseña y novedades de la plataforma.
- Un único interruptor general. Al desactivarlo se borra el token; al activarlo se vuelve a registrar el dispositivo.
- Tocar un aviso de chat abre el hilo de esa orden.
- **Sin conexión:** barra global "Sin conexión". Al volver, las pantallas se actualizan solas. Las acciones fallan con mensaje claro y botón de reintento.

### 5.11 Baja de cuenta

- Perfil → "Eliminar cuenta": pide contraseña, o reautenticación reciente con Google (últimos 5 minutos).
- No se puede si hay órdenes activas (`ACTIVE_ORDERS`).
- La cuenta queda oculta 30 días y se puede recuperar iniciando sesión. Después se anonimiza.
- Los textos no deben prometer el borrado de todo dato: el historial compartido (órdenes, chats, reseñas) se conserva de forma anónima.

## 6. Distancia entre el PRD y el código

Estado al 2026-11-09. **Frontend** = implementado en la rama `feat/prd-v1` (PR #69, apilado sobre #63–#68) y probado con la API simulada. **Backend** = implementado y mergeado a `main` en `bosko-backend` (PRs #36, #37 y #38; CI completo en verde, incluidos los tests de integración con PostgreSQL). **Nada se probó todavía en un dispositivo contra el backend real**: esa prueba manual sigue pendiente.

El frontend ya usa el OpenAPI real del backend (`docs/backend-openapi.json` y `src/core/api/generated/schema.ts` regenerados; `contracts:check` pasa). Desvíos del backend respecto del contrato: `docs/backend-prd-v1-contracts.md`, sección «Implementación».

| Tema | Frontend | Backend |
|---|---|---|
| Pagos y planes fuera de v1 | ✅ detrás de `FEATURES.payments` | — |
| Foto principal obligatoria | ✅ en `ServiceFormScreen` | ✅ B9: un servicio sin foto no aparece en el catálogo |
| Un servicio por proveedor | ✅ «Mi servicio» | ✅ B9: constante en lugar del límite por plan |
| Ciudad, mercados y términos | ✅ registro, Google y perfil de solo lectura | ✅ B1, B2 |
| Estado `awaiting_confirmation`, cierre automático y vencimiento de 48 h | ✅ | ✅ B3 (estado, rutas y dos jobs) |
| Ocultamiento automático por 3 denuncias | ✅ insignia en Mis trabajos | ✅ B5 |
| Bloqueo de usuarios | ✅ menú del chat y lista de bloqueados | ✅ B6 |
| Suspensión total | ✅ pantalla `/suspended` | ✅ B7 |
| Resolución de disputas por soporte | ✅ bloque con WhatsApp | ✅ B7 (API de admin para resolver) |
| Favoritos en la cuenta | ✅ (los locales no se migran) | ✅ B8 |
| KYC + teléfono para publicar; antecedentes opcionales | ✅ | ✅ B10 |
| Avisos nuevos | ✅ rutas e iconos | ✅ B4 |
| Copy en español neutro | ✅ con test que impide volver al voseo | — |
| Soporte por WhatsApp | ✅ `SupportContactButton` | ✅ B12 (falta cargar `APP_SUPPORT_WHATSAPP` en el servidor) |
| Errores de red con reintento | ✅ `runWithRetry` | — |
| Copy de baja de cuenta | ✅ | — |
| Búsqueda por calificación, verificados primero | sin cambios de UI | ✅ B11 |
| Contrato OpenAPI real | ✅ regenerado (F16) | ✅ B13 |
| Barra «Sin conexión», interruptor de push, denuncia desde el chat | ya existían | — |
| Panel admin de antecedentes | fuera de v1 (los antecedentes son opcionales) | — |

Detalle por tarea: `odd/tasks/prd-v1-frontend.md` (F1–F16) y `docs/backend-prd-v1-contracts.md` (B1–B13).

## 7. Decisiones abiertas

1. Número o enlace de WhatsApp de soporte.
2. Quién envía las "novedades de la plataforma" y por qué canal.
3. Cómo registra soporte el resultado de una disputa (no hay herramienta de admin para eso).
4. Qué ve el cliente durante los 3 días de `awaiting_confirmation`.
5. Si se puede abrir una disputa antes del cierre automático.
6. Revisión legal de términos y privacidad para Argentina y Colombia, y de la edad mínima.
7. Idioma y formato de moneda en pantallas (`$` ARS y `$` COP se parecen: conviene mostrar el código de moneda).

### Estado de las decisiones abiertas (2026-11-09)

| # | Estado |
|---|---|
| 1 | Pendiente de producto: cargar el número en `APP_SUPPORT_WHATSAPP` (backend). Sin él, el botón de soporte no tiene destino. |
| 2 | Resuelta técnicamente: `POST /admin/notifications/broadcast` (solo rol ADMIN) encola `PLATFORM_NEWS`, por ciudad opcional. Si no se quiere en v1, se deja sin uso. |
| 3 | Resuelta: soporte usa la API de admin (`GET /admin/orders?status=disputed`, `POST /admin/orders/:id/resolve`, `PATCH /admin/users/:id/suspension`). No hay panel; queda para la próxima versión. |
| 4 | Sin cambio: el cliente ve la orden en `awaiting_confirmation` con «Confirmar» y la fecha de cierre automático. |
| 5 | Resuelta con la propuesta: abre la disputa el cliente desde `awaiting_confirmation`; el proveedor no. |
| 6 | Pendiente: revisión legal de términos y privacidad (AR y CO) y de la edad mínima. |
| 7 | Pendiente de diseño: mostrar el código de moneda en pantallas. |
| Nueva | La migración de B1 asigna **todos** los usuarios y servicios existentes a `tandil`; confirmar antes de desplegar. |
| Nueva | El tipo de documento `CC` (Colombia) ya tiene etiqueta en el frontend («Cédula de ciudadanía»). Falta confirmar con Didit qué documentos acepta cada país. |
| Nueva | Diferido: recordatorio 24 h antes del cierre automático; vista de fotos propias cuando el KYC se revoca; limpieza del esquema de Prisma (tabla `payments` sigue en la base). |
