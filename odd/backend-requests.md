# Pedidos al backend

Registro de **lo que el frontend necesita que el backend construya o confirme**. Cada entrada describe el contrato propuesto (método, ruta, auth, campos, validaciones, respuesta, errores) y cómo se comporta la app mientras el endpoint no exista, para poder pasarla tal cual al equipo de backend.

Formato: una entrada por pedido, con ID `BRxx`. Estados: ⬜ pendiente de backend · 🟡 en desarrollo · ✅ desplegado y verificado desde la app.

Relacionado: `odd/ux-gaps.md` (huecos de UX que originan estos pedidos).

---

## BR01 — Subir/quitar portada de perfil

**Estado:** ⬜ pendiente de backend · **Origen:** G10 (`odd/ux-gaps.md`) · **Frontend:** implementado

### Contexto

`GET /users/me` ya devuelve `bannerUrl`, y `ProfileScreen` lo muestra (con un degradé de marca como respaldo), pero no existe forma de subir, cambiar ni quitar la portada. El frontend ya tiene la pantalla y el cliente listos contra el contrato de abajo.

### 1. Subir o reemplazar portada

- **Método y ruta:** `POST /users/me/banner`
- **Auth:** JWT (Bearer), usuario autenticado. Aplica a su propio perfil.
- **Content-Type:** `multipart/form-data`
- **Campos del request:**
  - `banner` (archivo, obligatorio)
- **Validaciones:**
  - Tipos permitidos: `image/jpeg`, `image/png`, `image/webp`
  - Tamaño máximo: 5 MB
  - Proporción recomendada: 3:1 (la app recorta a 3:1 antes de enviar)
- **Procesamiento:** el servidor redimensiona a ~1500×500 y **reemplaza** la portada anterior (borrando el archivo previo).
- **Respuesta 200/201:**
  ```json
  { "bannerUrl": "https://..." }
  ```
  (Con el envelope habitual `{ success, timestamp, data }` el cliente ya desenvuelve `data`.)
- **Errores:**
  - `400` archivo ausente o inválido
  - `401` sin sesión
  - `413` archivo demasiado grande
  - `415` tipo de archivo no soportado

### 2. Quitar portada

- **Método y ruta:** `DELETE /users/me/banner`
- **Auth:** JWT (Bearer)
- **Efecto:** deja `bannerUrl = null` y elimina el archivo almacenado.
- **Respuesta:** `200 { "bannerUrl": null }` o `204` sin cuerpo (el cliente acepta ambas).
- **Errores:** `401` sin sesión. Si no hay portada, debería ser idempotente (200/204).

### 3. Lectura

- `GET /users/me` ya devuelve `bannerUrl` (string o `null`/ausente). Sin cambios.

### Notas

- El cliente no valida el tipo real del archivo: la validación definitiva debe estar en el servidor.
- El cliente envía siempre el archivo recortado y comprimido (calidad 0.8), con nombre `banner.jpg` y tipo `image/jpeg`.
- Se agradece confirmar si `bannerUrl` pasa por CDN con cache; el cliente refresca el perfil tras subir, pero un cambio de URL en cada subida evita imágenes viejas en cache.

### Estado del frontend

- Implementado y testeado contra el contrato propuesto.
- Archivos:
  - `src/features/profile/services/profile.ts` — `uploadBanner`, `removeBanner`
  - `src/hooks/queries/useProfileQuery.ts` — `useUploadBanner`, `useRemoveBanner` (actualizan y refrescan el perfil)
  - `src/features/profile/utils/bannerErrors.ts` — mapeo de errores a mensajes
  - `src/features/users/screens/EditProfileScreen.tsx` — sección "Portada" (vista previa 3:1, "Cambiar portada", "Quitar" con confirmación)
  - `__tests__/profileBanner.test.ts`, `__tests__/profile.test.tsx`
- **Comportamiento hasta que se despliegue:** si el servidor responde `404`, `405` o `501`, la app muestra "La portada todavía no está disponible." y no cambia nada. `413` muestra un mensaje de tamaño (máx. 5 MB); `400`/`415`, un mensaje de formato; cualquier otro error, el mensaje genérico. Nunca falla ni se cierra.
- **Al desplegar:** no hace falta tocar el frontend. Verificar subida, reemplazo y quitado desde la app y pasar este pedido a ✅.

---

## BR02 — Rechazar mensajes en órdenes finalizadas

### Contexto

Decisión de producto (G68): cuando una orden pasa a `completed` o `cancelled`, el chat queda en solo lectura. Con la orden en `disputed` el chat sigue abierto. El cliente oculta el campo de escritura según el estado de la orden, pero una regla solo en el frontend se puede saltear (versiones viejas de la app, llamadas directas a la API, socket). El servidor debe ser quien la haga cumplir.

### 1. Rechazar envíos en órdenes cerradas

Aplicar a todos los puntos de envío, con la misma regla:

- `POST /conversations/{conversationId}/messages` (texto)
- `POST /conversations/{conversationId}/media` (imagen, video, documento y audio)
- Envío de mensajes por socket (evento de envío de mensaje del gateway de chat)

Reglas:

- Si la orden vinculada está en `completed` o `cancelled`: rechazar y no persistir ni emitir el mensaje.
- Si está en `disputed`, `pending`, `accepted` o `in_progress`: permitir como hoy.
- Respuesta propuesta: `409 Conflict` con cuerpo `{ "code": "ORDER_CLOSED", "message": "La orden está cerrada y el chat es de solo lectura." }`. Por socket, un evento de error equivalente con el mismo `code`.
- Lectura (`GET` de conversaciones y mensajes, `PATCH .../read`) sigue permitida en órdenes cerradas.

El cliente trata `403`, `409` y `422` como "orden cerrada": muestra "No podés enviar mensajes en una orden finalizada." y vuelve a consultar la orden.

### 2. Estado de la orden en la lista de conversaciones

- `GET /conversations` y `GET /conversations/{orderId}` deberían incluir `orderStatus` (`pending | accepted | in_progress | completed | cancelled | disputed`).
- Hoy el cliente obtiene el estado con `GET /orders/{id}` al abrir el chat. En la lista no hay estado, así que no se muestra el badge "Finalizada" / "Cancelada" / "En disputa" (evitamos consultar una orden por fila).

### 3. Notificación `new_message`

- El payload `data` de la notificación `new_message` debe incluir `orderId` (hoy solo se observó `conversationId`). El cliente abre `/chat/{orderId}` (G72); sin `orderId` solo puede llevar a la lista de chats.

### Estado del frontend

- Implementado: oculta el campo de escritura (texto, adjuntos, micrófono) y muestra el aviso en órdenes `completed`/`cancelled`; aviso informativo en `disputed`. Estado desde `useOrder` (sin request extra), refrescado al volver el foco.
- Ya maneja el rechazo `403`/`409`/`422` del servidor en texto, multimedia y audio.
- El badge de la lista está listo y se activa solo cuando el payload trae `orderStatus` (`Conversation.orderStatus`).
- Archivos: `src/features/chat/constants/chatOrderRules.ts`, `src/features/chat/components/ChatOrderNotice.tsx`, `src/features/chat/screens/ChatScreen.tsx`, `src/features/chat/screens/ConversationsListScreen.tsx`, `__tests__/chatOrderStatus.test.tsx`.
- **Al desplegar:** verificar el rechazo por REST y por socket, y pasar este pedido a ✅.

---

## BR03 — Reportes de usuarios y contenido

**Estado:** ⬜ pendiente de backend · **Origen:** G69, G86 (`odd/ux-gaps.md`) · **Frontend:** implementado

### Contexto

Las tiendas de aplicaciones (Apple 1.2, política de contenido generado por usuarios de Google Play) exigen un mecanismo para reportar contenido y usuarios. Decisión de producto: por ahora **solo reportar** (el equipo de Bosko revisa); bloquear usuarios queda postergado. El frontend tiene un único flujo de reporte (hoja con motivo) usado en reels, reseñas, chat y perfil público.

### 1. Reportar un usuario (nuevo)

`POST /users/:id/report` — autenticado.

```json
{
  "reason": "harassment",
  "details": "Texto libre opcional (obligatorio si reason = other, máx. 500)",
  "context": { "type": "chat", "orderId": "uuid" }
}
```

- `context.type`: `chat` (requiere `orderId`; el reporte se hace desde el chat de esa orden) o `profile` (desde el perfil público).
- Respuesta: `201` sin cuerpo relevante.

### 2. Reportar un reel (existe)

`POST /reels/:id/report` hoy acepta solo `{ reason?: string }` (`ReportReelDto`). Hasta que acepte `details`, el cliente envía el código en `reason` y, si hay texto libre, `"<code>: <texto>"` (ej. `other: me escribió por fuera de la app`). Pedido: aceptar `{ reason, details? }` como en el resto; el cliente pasará a enviarlos por separado.

### 3. Reportar una reseña (existe)

`POST /reviews/:id/report` hoy no recibe cuerpo. Pedido: aceptar `{ reason, details? }`. El cliente ya lo envía; confirmar que el validador no rechace campos extra mientras no se despliegue (si responde `400`, la app muestra el error genérico y permite reintentar).

### 4. Motivos (`reason`)

Códigos estables, en inglés y en minúscula: `spam`, `inappropriate`, `harassment`, `fraud`, `impersonation`, `other`.

| Código | Texto en la app |
|---|---|
| `spam` | Spam o publicidad |
| `inappropriate` | Contenido inapropiado |
| `harassment` | Acoso o lenguaje ofensivo |
| `fraud` | Fraude o estafa |
| `impersonation` | Suplantación de identidad |
| `other` | Otro (requiere `details`) |

### 5. Validaciones

- No se puede reportar a uno mismo ni el contenido propio (usuario, reel o reseña): `403`/`422` con código `CANNOT_REPORT_SELF` (la reseña ya tiene `CANNOT_REPORT_OWN_REVIEW`).
- Límite: 1 reporte por destino y por usuario cada 24 h. Si se repite: `409` con código `ALREADY_REPORTED`; la app muestra "Ya reportaste esto."
- `reason` obligatorio y dentro de la lista; `details` obligatorio si `reason = other`, máximo 500 caracteres.
- Destino inexistente: `404` con su código habitual.

### 6. Revisión y notificaciones

- Hace falta una cola de revisión para el equipo (admin): destino, motivo, detalle, contexto (orden), reportante y fecha, con estado (pendiente / revisado / descartado).
- **No se notifica nada al usuario reportado**, ni se revela quién reportó.

### Estado del frontend

- Implementado y testeado contra el contrato propuesto: hoja de reporte reutilizable (`ReportSheet` en el design system) y flujo común con toasts de éxito/error y protección de doble envío.
- Puntos de entrada: reels (menú "Más opciones" → "Reportar contenido", oculto en reels propios), reseñas del perfil público ("Reportar reseña", oculto en reseñas propias), chat de la orden (menú → "Reportar usuario"), perfil público (menú → "Reportar perfil", oculto en el propio).
- Archivos: `src/core/design-system/components/ReportSheet.tsx`, `src/features/reports/` (motivos, servicio `reportUser`, `ReportFlow`, mapeo de errores, `canReport`), `reels.service.ts`, `review.service.ts`, `ChatScreen.tsx`, `ProviderProfileScreen.tsx`, `__tests__/reports.test.tsx`.
- **Comportamiento hasta que se despliegue:** si `POST /users/:id/report` responde `404`, `405` o `501`, la app muestra "Los reportes todavía no están disponibles." y cierra la hoja. `409` muestra "Ya reportaste esto."; cualquier otro error, un aviso con posibilidad de reintentar. Nunca falla ni se cierra.
- **Al desplegar:** verificar los cuatro puntos de entrada y pasar este pedido a ✅.

---

## BR04 — Subida de videos para reels

**Estado:** ⬜ pendiente de backend · **Origen:** G87, G64 (`odd/ux-gaps.md`) · **Frontend:** implementado

### Contexto

Hoy un reel solo se puede publicar con un enlace HTTPS a un video ya alojado (`POST /reels` con `videoUrl`), algo que un prestador común no puede hacer. Decisión de producto: el prestador elige un video de su galería o lo graba con la cámara. Límites: **60 segundos** y **100 MB**.

### 1. Subir el video (nuevo)

`POST /reels/upload` — autenticado, rol prestador. `multipart/form-data`:

| Campo | Tipo | Notas |
|---|---|---|
| `video` | archivo | Obligatorio. `video/mp4` o `video/quicktime` (mov). Máx. 100 MB. |
| `thumbnail` | archivo | Opcional. Imagen `jpeg`/`png`. |

Respuesta `201`:

```json
{ "videoUrl": "https://cdn.…/reels/abc.mp4", "thumbnailUrl": "https://cdn.…/reels/abc.jpg", "duration": 42.5 }
```

- El servidor valida la **duración real** (≤ 60 s); el cliente solo la valida con lo que informa el selector.
- Errores: `400` (archivo ausente, video corrupto o más largo de 60 s), `413` (más de 100 MB), `415` (formato no admitido).

### 2. Crear el reel (existe)

El cliente llama luego a `POST /reels` con `{ videoUrl, description, tags }`, sin cambios. Se eligió el flujo en dos pasos porque `createReel` ya recibe una URL y el enlace manual sigue funcionando.

Alternativa válida: un único `POST /reels` multipart. Implicaría cambiar el contrato actual y dejar de aceptar `videoUrl`.

### 3. Recomendación

Para archivos de hasta 100 MB conviene una **URL prefirmada** (`POST /reels/upload-url` devuelve la URL de almacenamiento y el cliente sube directo): evita pasar el video por la API, admite reanudar y reduce timeouts. Si se adopta, el cliente solo cambia `uploadReelVideo`.

### Estado del frontend

- Implementado contra el contrato propuesto: elegir de la galería o grabar, vista previa, subida con porcentaje y cancelación, publicar bloqueado mientras sube, y el enlace HTTPS como opción avanzada.
- Validación previa en el cliente: más de 60 s o más de 100 MB se rechaza con un aviso antes de subir. Si el tamaño no se conoce, lo resuelve el `413` del servidor.
- **Comportamiento hasta que se despliegue:** `404`, `405` o `501` muestran "La subida de videos todavía no está disponible."; `413` indica el máximo de 100 MB; `400`/`415` piden un MP4 o MOV de hasta 60 s; un corte de red permite reintentar.
- Archivos: `src/features/reels/services/reels.service.ts` (`uploadReelVideo`), `src/features/reels/constants/reelUploadRules.ts`, `src/features/reels/screens/ReelUploadScreen.tsx`, `__tests__/reelUpload.test.tsx`.
- **Al desplegar:** probar desde la app con un video de 60 s, uno de 61 s y uno de más de 100 MB, y pasar este pedido a ✅.
