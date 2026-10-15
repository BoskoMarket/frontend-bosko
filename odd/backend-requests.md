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
