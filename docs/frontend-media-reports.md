# Bosko — Portada, subida de reels y denuncias

Contrato para Francisco. Complementa `docs/backend-contract-fixes.md` (OTP, chat cerrado y reseña en orden). Backend: `GallosoGonzalo/bosko-backend`, destino `main`. Frontend: integrar en `dev`.

Todas las rutas usan el prefijo `/api/v1` y requieren Bearer JWT. Las respuestas con cuerpo conservan `{success:true,data:...,timestamp:...}`. Los errores usan `{success:false,statusCode,code,message,...}`. Un 204 no tiene cuerpo.

## Qué conectar en frontend

| Función | Request | Respuesta |
|---|---|---|
| Subir/reemplazar portada | `POST /users/me/banner`, multipart `banner` | 201, `data.bannerUrl` |
| Quitar portada | `DELETE /users/me/banner` | 200, `data.bannerUrl = null` |
| Leer portada | `GET /users/me`, `GET /users/:id/public` | Agregan `bannerUrl: string \| null` |
| Subir video de reel | `POST /reels/upload`, multipart `video`, `thumbnail` opcional | 201, `data.{videoUrl,thumbnailUrl,duration}` |
| Publicar reel | `POST /reels`, JSON con `videoUrl` de la subida | 201, reel creado |
| Denunciar usuario | `POST /users/:id/report`, JSON de abajo | 201, confirmación |
| Denunciar reseña | `POST /reviews/:id/report`, `{reason,details?}` | 201, sin datos relevantes |
| Denunciar reel | `POST /reels/:id/report`, `{reason,details?}` | 204, sin cuerpo |
| Cola de moderación, solo ADMIN | `GET /admin/reports?page=1&limit=20&status=pending` | 200, `data.{data,total,page,limit}` |
| Revisar denuncia, solo ADMIN | `PATCH /admin/reports/:id`, `{status,notes?}` | 200, denuncia actualizada |

## 1. Portada

- Campo de archivo exacto: **`banner`**. JPEG, PNG o WebP, hasta **5 MiB**. Se valida el contenido, no solo el nombre/MIME declarado.
- El servidor decodifica, recorta a 3:1 y genera un JPEG de **1500 × 500**. GIF no está permitido. Las imágenes con dimensiones superiores a 40 millones de píxeles se rechazan.
- Cada reemplazo tiene una clave/URL distinta. La clave anterior se elimina después de actualizar el perfil. Los reemplazos y borrados simultáneos se serializan para no borrar la portada que quedó activa.
- Quitar una portada inexistente es idempotente. La respuesta siempre deja `bannerUrl: null`.
- Actualizar el perfil devuelve también `bannerUrl`. Después de subir/quitar, invalidar/refrescar la query del perfil. Mostrar el fondo de respaldo si vale null.
- No enviar `bannerUrl` en PATCH del perfil: se modifica exclusivamente por los endpoints dedicados.
- La limpieza del objeto anterior es de mejor esfuerzo: una falla de almacenamiento queda registrada y no revierte el cambio de portada ya confirmado.

## 2. Reels: subir y después publicar

Se conserva el flujo de dos pasos que ya implementa la app:

1. `POST /reels/upload`: multipart con **`video`** obligatorio, MP4 o MOV; **`thumbnail`** JPEG/PNG opcional.
2. Tomar `data.videoUrl` y usarlo en el `POST /reels` existente, junto con `description`, `tags` y `music` si corresponde.
3. Invalidar/refrescar feed y publicaciones propias tras publicar.

Ejemplo de respuesta de subida:

```json
{
  "success": true,
  "data": {
    "videoUrl": "https://storage.boskoapp.site/...mp4?...firma...",
    "thumbnailUrl": "https://storage.boskoapp.site/...jpg?...firma...",
    "duration": 42.5
  },
  "timestamp": "..."
}
```

Límites y comportamiento:

- Subir y publicar requiere **prestador** (`isProvider = true`). El backend lo verifica; una cuenta cliente recibe 403 `PROVIDER_REQUIRED`.
- Video: hasta **100 MiB**, duración real **mayor que cero y hasta 60 segundos**, resolución de entrada hasta 3840×2160 píxeles en total. Thumbnail opcional: hasta **5 MiB**.
- El servidor inspecciona y decodifica el archivo. Rechaza contenido corrupto y duración excesiva; no confía en la duración del selector ni recorta silenciosamente videos largos.
- Se convierte a MP4 H.264/AAC, máximo 1280 en cada dimensión y 30 fps. Se genera thumbnail JPEG de 720×1280 si no se adjunta uno.
- La API no descarga URLs remotas para procesarlas: las herramientas solo leen archivos locales. La subida usa disco temporal y elimina los archivos al terminar, incluso si falla el procesamiento.
- El proxy permite estos tamaños únicamente en esta ruta; cliente y proxy admiten hasta cinco minutos. El procesamiento tiene tiempo máximo y concurrencia limitada.
- La respuesta de subida **no publica** el reel. El segundo POST es necesario.
- No reutilizar la subida de otra cuenta ni inventar una URL de almacenamiento: se comprueba que exista un registro de subida validada del mismo usuario. Si no corresponde: 400 `INVALID_UPLOAD`.
- En base de datos se guardan claves internas, no firmas temporales. Crear, editar y consultar reels devuelve URLs firmadas renovadas; thumbnail y duración se incluyen cuando existen. En reels antiguos/enlaces externos pueden ser null.
- Los enlaces externos **HTTPS** siguen admitidos en POST /reels. No se descargan ni se valida su duración desde el servidor; `duration` queda null. URLs HTTP dejan de admitirse.
- Las URLs firmadas de medios propios duran siete días: refrescar el feed/perfil para renovarlas, no usarlas como identificadores permanentes.
- Una subida abandonada antes de publicar queda registrada y almacenada; este cambio no incorpora una tarea automática de purga de esas subidas.

## 3. Denuncias

Motivos estables: `spam`, `inappropriate`, `harassment`, `fraud`, `impersonation`, `other`.

- `reason`: obligatorio, uno de los códigos anteriores.
- `details`: opcional, hasta 500 caracteres; obligatorio y no vacío si `reason = other`.
- No se puede denunciarse a uno mismo ni contenido propio.
- Máximo una denuncia por reportante y destino en una ventana móvil de **24 horas**. Incluye solicitudes simultáneas. Pasada la ventana se puede volver a denunciar.
- No se notifica al denunciado ni se publica la identidad del reportante. El contenido no se oculta ni se elimina automáticamente.

Usuario desde perfil:

```json
{ "reason": "spam", "context": { "type": "profile" } }
```

Usuario desde chat:

```json
{
  "reason": "harassment",
  "details": "Descripción opcional",
  "context": { "type": "chat", "orderId": "UUID de la orden" }
}
```

En denuncias de usuarios, `context` es obligatorio. Para chat, `orderId` debe ser UUID y ambos usuarios deben ser participantes de esa orden; no sirve una orden ajena. Para perfil no enviar `orderId`.

Reels y reseñas:

```json
{ "reason": "other", "details": "Descripción de lo ocurrido" }
```

El backend acepta también el formato ya enviado por el frontend de reels: `{"reason":"other: Descripción de lo ocurrido"}`. Para código nuevo conviene enviar los campos separados. Las reseñas ahora **guardan motivo y detalle**, además de marcar `isReported`; antes esos datos se ignoraban.

### Moderación

Solo ADMIN puede listar o actualizar denuncias. Listado paginado, límite máximo 100; `status` admite `pending`, `reviewed`, `dismissed`. Si se omite, lista todos los estados. Se devuelven destino, propietario, reportante, motivo, detalle, contexto, fecha y estado. Estos datos no se agregan a perfiles ni feeds públicos.

PATCH admite `status: "reviewed" | "dismissed"` y `notes` opcional de hasta 2000 caracteres. Registra administrador y fecha de revisión. Revisar una denuncia no sanciona automáticamente a la cuenta ni borra contenido: la resolución operativa queda a cargo del equipo.

Los reportes históricos de reels se conservan en la nueva cola. Los motivos que nunca se guardaron en reseñas antiguas no pueden recuperarse.

## Errores para mapear

| Caso | HTTP / código | Acción frontend |
|---|---|---|
| Sesión ausente/vencida | 401, contrato auth existente | Renovar sesión/iniciar sesión |
| Solo prestadores | 403 `PROVIDER_REQUIRED` | No ofrecer publicación a cuenta cliente |
| Archivo ausente | 400 `NO_FILE_UPLOADED` | Pedir seleccionar archivo |
| Archivo corrupto o video largo | 400 `INVALID_MEDIA` | Pedir formato válido y video ≤60 s |
| Tamaño excesivo | 413 (`FILE_SIZE_EXCEEDED` o `PAYLOAD_TOO_LARGE` desde la API; el proxy puede responder sin JSON) | Mostrar límite correspondiente |
| MIME de video no admitido | 415 `UNSUPPORTED_MEDIA_TYPE` | Pedir MP4/MOV |
| Subida inexistente/ajena | 400 `INVALID_UPLOAD` | Repetir subida con la cuenta actual |
| Motivo/detalle/contexto inválido | 400 `INVALID_REPORT` o `VALIDATION_ERROR` | Revisar formulario |
| Denuncia propia | 422 `CANNOT_REPORT_SELF`; reseña conserva 400 `CANNOT_REPORT_OWN_REVIEW` | Ocultar opción sobre contenido propio |
| Ya denunciado en 24 h | 409 `ALREADY_REPORTED` | Mostrar “Ya reportaste esto” |
| Orden ajena en denuncia | 403 `NOT_ORDER_PARTICIPANT` | No confirmar envío; revisar contexto |
| Destino inexistente | 404 `USER_NOT_FOUND`, `REEL_NOT_FOUND` o `REVIEW_NOT_FOUND` | Refrescar y avisar que no está disponible |
| Proceso ocupado o límite HTTP | 429 `UPLOAD_BUSY` o `RATE_LIMITED` | Permitir reintento con espera |
| Cola sin permisos | 403 `FORBIDDEN` | Acceso exclusivo ADMIN |

Límites HTTP por IP: cinco subidas de portada, tres de video y diez denuncias por ruta cada minuto, además del límite global. El procesamiento pesado admite dos trabajos simultáneos por instancia; responder 429 no significa que el contenido se haya guardado.

## Comprobaciones para Francisco

1. Subir, reemplazar y quitar portada; cerrar/abrir perfil propio y público, comprobar URL nueva y respaldo al quitar.
2. Subir un MP4/MOV corto, publicar y reproducir desde feed y “Mis reels”; comprobar thumbnail. Probar corrupto, >60 s y >100 MiB.
3. Denunciar desde perfil, chat, reseña y reel; probar `other` sin detalle y envío duplicado. Mostrar éxito solo si la API lo confirmó.
4. Comprobar que una cuenta cliente no puede subir/publicar y que solo ADMIN accede a moderación.
5. Mantener las correcciones del MD anterior: reenvío OTP, error `ORDER_CLOSED` y `order.review`.

## Despliegue y alcance

Incluye una migración aditiva para portada, metadata de reels, registro de subidas y denuncias. El contenedor incorpora FFmpeg/FFprobe y el CD actualiza el proxy; no requiere nuevas variables de entorno. El código anterior puede seguir funcionando contra las columnas/tablas nuevas si se hace rollback de aplicación.

No modifica el frontend. No incluye KYC, baja/recuperación de cuenta, configuración remota ni eliminación de simulaciones de pagos. Las pruebas con cuentas y archivos se ejecutan en CI aislado; la verificación de producción usa salud, lecturas públicas y rechazo de accesos sin sesión, sin modificar cuentas reales.

La salud (`GET /api/v1/health`) agrega `data.revision`, con el commit de la imagen desplegada. CD comprueba que coincida tanto dentro del contenedor como en la URL pública antes de dar el deploy por correcto; una discrepancia hace fallar la comprobación y activa el rollback.

En el VPS existente se conserva el Nginx del host y los volúmenes activos de PostgreSQL/Redis/MinIO. CD reemplaza solo la API del proyecto Compose existente, guarda un backup de la base antes de migrar y restaura la imagen y entorno realmente activos si falla. El ajuste de subida modifica únicamente el virtual host de API y conserva los demás sitios.

