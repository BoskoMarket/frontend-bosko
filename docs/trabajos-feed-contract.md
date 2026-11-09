# Bosko — Feed de Trabajos (pedido del frontend)

Pedido de contrato para backend. Frontend `dev`, backend PR hacia `main`. Reemplaza la tab de Reels (aplazados a la próxima versión) por **Trabajos**: galería de fotos de trabajos terminados; tocar una foto abre el servicio para pedir cotización. No cambia el flujo de cotización (lo sigue iniciando el cliente). No incluye pagos ni KYC.

Prefijo `/api/v1`. Respuestas con el wrapper habitual `{success:true,data:...,timestamp:...}`; errores `{success:false,statusCode,code,message}`.

## Qué existe hoy

El módulo `posts` ya expone (auditoría 2026-10-19, `posts.controller.ts`):

| Ruta | Auth | Estado en frontend |
|---|---|---|
| `GET /services/:id/posts` | Pública | Servicio escrito, sin pantalla |
| `POST /services/:id/posts` `{imageUrl, description?}` | JWT | Servicio escrito, sin pantalla |
| `POST /posts/:id/like` | JWT | Sin uso |
| `POST /posts/:id/comments` | JWT | Sin uso |

Falta un listado general y la subida de la imagen.

## 1. Feed general (nuevo)

`GET /posts/feed?limit=20&categoryId=<uuid>&cursor=<opaco>`. Pública (si hay JWT, se puede usar para `likedByMe`, opcional).

- `limit` máximo 50. `categoryId` opcional; sin él, todas las categorías.
- Orden: más recientes primero (`createdAt desc`, desempate por `id`).
- Excluir posts de servicios inactivos/eliminados y de proveedores suspendidos o con baja programada.
- Paginación por cursor (keyset), no por página: así los posts nuevos publicados mientras se hace scroll no duplican ni desplazan ítems. La primera llamada va sin `cursor`; la respuesta es `data.{data, nextCursor}`. `nextCursor` es una cadena opaca (base64url de `createdAt` + `id`, no se debe interpretar) y es `null` en la última página. Para la página siguiente se repite la misma consulta con `cursor=<nextCursor>`. No hay `total`, `page` ni `count`. Un cursor mal formado responde 400 `VALIDATION_ERROR`; `page` ya no se acepta (400).

Ítem:

```json
{
  "id": "uuid",
  "imageUrl": "https://...",
  "thumbnailUrl": "https://... | null",
  "width": 1080,
  "height": 1350,
  "description": "string | null",
  "createdAt": "2026-11-03T12:00:00.000Z",
  "likes": 0,
  "service": { "id": "uuid", "title": "string", "categoryId": "uuid", "categoryName": "string" },
  "provider": { "id": "uuid", "name": "string", "avatarUrl": "string | null", "rating": 4.8, "isVerified": true }
}
```

`provider.name` es nombre + apellido, el mismo dato que expone el perfil público (`GET /users/:id/public`: `firstName`, `lastName`).

`width`/`height` permiten armar la grilla tipo mosaico sin saltos de layout. Si no se pueden guardar, `null` y el frontend usa una proporción fija.

## 2. Subida de foto (cambio en `POST /services/:id/posts`)

Hoy recibe `imageUrl`, pero no hay endpoint para subir la imagen. Propuesta: aceptar multipart con campo `image` (JPEG/PNG/WebP, máximo 10 MiB) y `description` opcional (máximo 500 caracteres), igual que la portada (`POST /users/me/banner`). Devuelve 201 con el ítem del feed.

- Solo el dueño del servicio (proveedor) puede publicar: 403 `FORBIDDEN` si no.
- Límite sugerido: 30 posts por servicio; 422 `POST_LIMIT_REACHED`.
- Generar `thumbnailUrl` y medidas al procesar.

## 3. Borrar foto propia (nuevo)

`DELETE /posts/:id`, JWT, solo el dueño. 204 sin cuerpo. 404 `POST_NOT_FOUND`, 403 `FORBIDDEN`.

## 4. Denunciar foto (nuevo, recomendado)

`POST /posts/:id/report` `{reason, details?}` con los mismos motivos y reglas que reels (`spam`, `inappropriate`, `harassment`, `fraud`, `impersonation`, `other`; ventana de 24 h; 409 `ALREADY_REPORTED`; 422 `CANNOT_REPORT_SELF`). Que aparezca en la cola `/admin/reports` con destino `post`. Un feed público sin denuncias no es moderable.

## 5. Editar descripción (nuevo)

`PATCH /posts/:id` `{ "description": "string" }`, JWT, solo el dueño. Máximo 500 caracteres; cadena vacía (o solo espacios) la borra (`description: null`). Devuelve 200 con el ítem del feed. 404 `POST_NOT_FOUND`, 403 `FORBIDDEN`, 400 `VALIDATION_ERROR` (más de 500 o campo ausente). La foto y el orden no se pueden cambiar.

## Decisiones de producto (2026-11-03)

- Las fotos se publican de inmediato, sin aprobación previa.
- Límite de 30 fotos por servicio; la subida tiene un límite de 5 por minuto por IP (429 `RATE_LIMITED`; el throttler del backend cuenta por IP, igual que el banner).
- Las denuncias de fotos son solo para revisión en `/admin/reports`: no hay acción de ocultar/borrar desde moderación ni ocultamiento automático.

## Fuera de alcance (primera versión)

Likes y comentarios en el feed (los endpoints quedan, el frontend no los muestra todavía), feed personalizado, búsqueda por texto, video.

## Errores a mapear

| Caso | Respuesta |
|---|---|
| Archivo inválido o muy grande | 400 `INVALID_UPLOAD` / 413 |
| No es dueño del servicio | 403 `FORBIDDEN` |
| Límite de posts | 422 `POST_LIMIT_REACHED` |
| Post o servicio inexistente | 404 `POST_NOT_FOUND` / `SERVICE_NOT_FOUND` |
| Proceso ocupado o límite HTTP | 429 `UPLOAD_BUSY` / `RATE_LIMITED` |

## Lo que hará el frontend

Tab **Trabajos** (en lugar de Reels): grilla mosaico con filtro por categoría, carga infinita, vacío/error; detalle de la foto con proveedor y botón **Cotizar** (mismo flujo que el perfil del proveedor). Para proveedores: "Mis trabajos" para subir/borrar fotos por servicio. Denunciar con el `ReportFlow` existente.
