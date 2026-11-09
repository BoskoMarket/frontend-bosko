# Bosko — Backend para PRD v1: tareas y contratos

Para el equipo de backend (`bosko-backend`, destino `main`). Deriva de `docs/PRD.md`. Todas las rutas llevan el prefijo `/api/v1`, usan el envelope habitual `{success,data,timestamp}` y los errores `{success:false,statusCode,code,message}`. Las migraciones son **aditivas** y las rutas existentes se conservan salvo donde se indica.

Base verificada en `bosko-backend` rama `feat/trabajos-feed`. Lo que no pude comprobar está marcado como «verificar».

## Reglas de arquitectura (respetar en cada tarea)

Dependencia: `Presentation → Application → Domain`, con `Infrastructure` implementando los puertos del dominio.

| Pieza | Dónde va |
|---|---|
| Entidades, value objects, errores de dominio | `src/domain/<modulo>/model`, `src/domain/<modulo>/errors`, `src/domain/shared/value-objects` |
| Interfaces de repositorio (puertos) | `src/domain/shared/repositories/<x>.repository.interface.ts` |
| Casos de uso | `src/application/<modulo>/use-cases/<accion>.usecase.ts`, una clase por acción |
| Consultas y DTO de lectura | `src/application/<modulo>/queries` |
| Controllers y DTO de entrada | `src/presentation/di/modules/<modulo>/<x>.controller.ts` y `dto/` |
| Repositorios Prisma | `src/infrastructure/persistence/prisma/repositories/<modulo>/` |
| Jobs programados | `src/application/<modulo>/*.job.ts` (patrón de `account-purge.job.ts`) o `src/infrastructure/notification/` para envíos |
| Cableado | `*.module.ts`: repositorios con token de clase (`{provide: IFooRepository, useClass: PrismaFooRepository}`); casos de uso con token de cadena (`{provide: 'FooUseCase', useClass: ...}`) y `@Inject('FooUseCase')` en el controller |

Reglas por tarea:
- El controller solo valida el DTO y delega en un caso de uso. Nada de lógica de negocio ni de Prisma en el controller.
- Toda regla de estado de orden vive en `order-status.vo.ts` (`getAllowedTransitions` es la única fuente de verdad), no repartida en casos de uso.
- Toda escritura que dispare un aviso inserta una fila en `notificationOutbox` **dentro de la misma transacción** que el cambio de negocio.
- Los jobs usan el patrón de `account-purge.job.ts`: bandera `running` contra solapamiento, `FOR UPDATE SKIP LOCKED` y operación idempotente.
- Cada tarea trae pruebas unitarias del caso de uso y, si toca transacciones o concurrencia, prueba en la suite PostgreSQL (`jest.integration.config.js`).

## Orden sugerido

| Fase | Tareas | Motivo |
|---|---|---|
| 1 | B1, B2, B3, B4 | Mercados, términos, ciclo de la orden y avisos. El frontend queda bloqueado sin ellas |
| 2 | B5, B6, B7, B8 | Moderación, bloqueo, suspensión y favoritos |
| 3 | B9, B10, B11, B12 | Reglas de publicación, soporte y contrato OpenAPI |

---

## B1 · Mercados por ciudad

**Modelo (Prisma, aditivo)**
- Nuevo `City { id String @id (slug: "tandil" | "barranquilla"), name, countryCode (AR | CO), currency (ARS | COP), phonePrefix (+54 | +57), documentTypes String[], isActive Boolean }`. Se carga por seed.
- `User.cityId` (FK a `City`, obligatorio para cuentas nuevas) y `Service.cityId` (copia del `cityId` del proveedor al crear, con índice, para filtrar sin join).
- `Service.priceCurrency` se fija a la moneda de la ciudad al crear (hoy el valor por defecto es `ARS`).

**Dominio y aplicación**
- Value object `city.vo.ts` y puerto `ICityRepository`.
- Caso de uso `list-cities.usecase.ts` (módulo nuevo `city`).
- `register.usecase.ts` recibe `cityId` y valida que exista y esté activa (`CITY_NOT_FOUND`, 400).
- `verify-phone.usecase.ts` rechaza un teléfono cuyo prefijo no coincida con el país de la ciudad (`PHONE_COUNTRY_MISMATCH`, 422).

**Contratos**

| Ruta | Cambio |
|---|---|
| `GET /cities` (pública) | `data: [{id,name,countryCode,currency,phonePrefix}]` solo ciudades activas |
| `POST /auth/register` | body agrega `cityId` (obligatorio) |
| `POST /auth/google` | si el usuario es nuevo y no trae `cityId` → 422 `CITY_REQUIRED`; el cliente completa con `PATCH /users/me/city` |
| `PATCH /users/me/city` | `{cityId}`. Solo permitido si `User.cityId` es null; si ya tiene ciudad → 409 `CITY_ALREADY_SET` (cambiarla es una operación de soporte) |
| `GET /users/me`, `GET /users/:id/public` | agregan `city: {id,name,currency}` |
| `GET /services`, `/services/featured`, `/services/me`, `/search`, `/posts/feed` | se acotan automáticamente a la ciudad del JWT. Con llamada anónima, `?cityId=` opcional |
| `POST /orders` | si cliente y proveedor son de ciudades distintas → 422 `CITY_MISMATCH` |

**Migración:** rellenar `cityId` de usuarios y servicios existentes. **Decisión abierta:** hasta ahora todo es Argentina, así que se propone `tandil`; confirmar antes de migrar.

**Pruebas:** register con ciudad inexistente; feed y búsqueda que no filtran otra ciudad; orden entre ciudades.

## B2 · Aceptación de términos

`User.termsVersion` y `privacyAcceptedAt` ya existen, pero no hay endpoint ni validación (verificado).

- `POST /auth/register` y `POST /auth/google` (usuario nuevo): body agrega `acceptedTerms: true` y `termsVersion: string`. Si falta o es `false` → 400 `TERMS_NOT_ACCEPTED`.
- Se guarda `termsVersion` y `privacyAcceptedAt = now()`.
- Caso de uso: ampliar `register.usecase.ts`; no crear controller nuevo.

## B3 · Ciclo de la orden

**Cambios en el dominio** (`order-status.vo.ts`, `order.entity.ts`, `invalid-order-transition.error.ts`)
- Nuevo estado `AWAITING_CONFIRMATION` en el enum de Prisma `OrderStatus` y en el value object.
- Transiciones nuevas, y las que se quitan:

| Desde | Rol | Hacia |
|---|---|---|
| PENDING | proveedor | ACCEPTED, CANCELLED |
| PENDING | cliente | CANCELLED |
| PENDING | sistema | CANCELLED (por vencimiento) |
| ACCEPTED | proveedor / cliente | CANCELLED |
| ACCEPTED | proveedor | IN_PROGRESS |
| IN_PROGRESS | proveedor | AWAITING_CONFIRMATION, DISPUTED |
| IN_PROGRESS | cliente | DISPUTED |
| AWAITING_CONFIRMATION | cliente | COMPLETED, DISPUTED |
| AWAITING_CONFIRMATION | sistema | COMPLETED (cierre automático) |
| AWAITING_CONFIRMATION | proveedor | DISPUTED (**decisión abierta 5**) |

  Se **quita** `IN_PROGRESS → CANCELLED` (para cancelar un trabajo en curso se abre una disputa). `COMPLETED`, `CANCELLED` y `DISPUTED` siguen siendo estados finales para las partes.
- Rol nuevo `system` en `canTransitionTo` para los jobs.

**Columnas nuevas en `Order` (aditivas):** `expiresAt` (= `createdAt + 48 h`, solo en PENDING), `doneAt`, `autoCloseAt` (= `doneAt + 3 días`), `closedBy` (`client` | `system`). `cancelledBy` acepta además `system`; `cancellationReason` admite el valor `NO_RESPONSE`.

**Casos de uso** (`src/application/order/use-cases/`)
- Nuevo `mark-order-done.usecase.ts` (reemplaza a `complete-order` en el flujo del proveedor).
- Nuevo `confirm-order.usecase.ts` (cliente; pasa a COMPLETED, fija `completedAt` y `closedBy = client`).
- Se retira `complete-order.usecase.ts` o se deja como alias interno de `confirm-order`.
- `cancel-order.usecase.ts` y `reject-order.usecase.ts`: `reason` obligatorio de 5 a 500 caracteres; si falta → 400 `VALIDATION_ERROR`.
- `dispute-order.usecase.ts`: ya requiere motivo; ahora válido también desde AWAITING_CONFIRMATION.

**Jobs** (`src/application/order/`, registrados en el módulo de órdenes)
- `order-expiry.job.ts`, cada 10 minutos: órdenes PENDING con `expiresAt <= now` → CANCELLED, `cancelledBy = system`, motivo `NO_RESPONSE`. Registra en `OrderStatusHistory` y encola `ORDER_EXPIRED` al cliente.
- `order-auto-close.job.ts`, cada 10 minutos: AWAITING_CONFIRMATION con `autoCloseAt <= now` → COMPLETED, `closedBy = system`. Encola `ORDER_AUTO_CLOSED` a ambos.
- Recordatorio opcional a las 24 h del cierre (`ORDER_AWAITING_CONFIRMATION` reenviado), en `order-reminder.job.ts`.

**Contratos**

| Ruta | Quién | Efecto |
|---|---|---|
| `PATCH /orders/:id/mark-done` | proveedor | IN_PROGRESS → AWAITING_CONFIRMATION; responde la orden |
| `PATCH /orders/:id/confirm` | cliente | AWAITING_CONFIRMATION → COMPLETED |
| `PATCH /orders/:id/complete` | — | **se retira** (la v1 no está publicada, no hace falta compatibilidad) |
| `PATCH /orders/:id/cancel`, `/reject` | ambos | body `{reason}` obligatorio |
| `POST /orders/:id/dispute` | ambos | body `{reason}`; válido desde IN_PROGRESS y AWAITING_CONFIRMATION |
| `GET /orders/:id`, `GET /orders/client`, `GET /orders/provider` | — | el objeto orden agrega `expiresAt`, `doneAt`, `autoCloseAt`, `closedBy`, `cancelledBy` |

Errores: 409 `INVALID_ORDER_TRANSITION` (ya existe) con `currentStatus` en `details`.

**Chat:** `send-message.usecase.ts`, `send-media.usecase.ts` y el evento `send_message` siguen rechazando solo COMPLETED y CANCELLED; AWAITING_CONFIRMATION y DISPUTED permiten escribir. `orderStatus` de `GET /conversations` devuelve `awaiting_confirmation`.

**Reseñas:** sin cambios; `create-review.usecase.ts` ya exige `COMPLETED`.

**Pruebas:** tabla completa de transiciones por rol; los dos jobs (incluida la carrera con una confirmación manual simultánea); idempotencia; el cierre bloquea el chat tras COMPLETED.

## B4 · Notificaciones

El agente detectó que el enum de Prisma (`NotificationType`) y el de dominio (`notification.entity.ts`) **no coinciden**. Primero unificarlos (verificar cómo mapea hoy el outbox), luego agregar los tipos.

Tipos nuevos: `ORDER_AWAITING_CONFIRMATION`, `ORDER_CANCELLED`, `ORDER_EXPIRED`, `ORDER_AUTO_CLOSED`, `ORDER_DISPUTED`, `POST_HIDDEN`, `REVIEW_REPLIED`, `PLATFORM_NEWS`.

| Evento | Destinatario | Tipo |
|---|---|---|
| mark-done | cliente | `ORDER_AWAITING_CONFIRMATION` |
| cancel / reject | la otra parte | `ORDER_CANCELLED` / `ORDER_REJECTED` |
| expiración | cliente | `ORDER_EXPIRED` |
| cierre automático | ambos | `ORDER_AUTO_CLOSED` |
| disputa abierta | la otra parte | `ORDER_DISPUTED` |
| foto oculta | dueño de la foto | `POST_HIDDEN` |
| respuesta a una reseña | autor de la reseña | `REVIEW_REPLIED` |
| difusión | por ciudad | `PLATFORM_NEWS` (ver B12, decisión abierta) |

El payload `data` incluye siempre `orderId` cuando corresponde (cierra el hallazgo C21: hoy los push de chat traen solo `conversationId`). Los textos van en español neutro.

## B5 · Ocultamiento automático de fotos de Trabajos

**Modelo:** `Post.status` (`VISIBLE` | `HIDDEN`, por defecto `VISIBLE`), `Post.hiddenAt`, y restricción única `ContentReport (reporterId, targetType, targetId)` para contar denunciantes distintos (verificar que no exista ya).

**Lógica** (`src/application/report/use-cases/report-content.usecase.ts`)
- En la misma transacción de la denuncia, si `targetType = 'post'` y los denunciantes distintos con denuncia pendiente son ≥ 3: `Post.status = HIDDEN`, `hiddenAt = now()` y se encola `POST_HIDDEN`.
- Constante `POST_AUTO_HIDE_THRESHOLD = 3` en el dominio del reporte, no un número suelto.
- `post-visibility.ts` (existente) pasa a excluir `HIDDEN` del feed y de `GET /services/:id/posts` público.

**Contratos**
- `GET /services/:id/posts`: para el dueño devuelve también los ocultos con `status`; para los demás, solo `VISIBLE`.
- `PATCH /admin/reports/:id` con `{status:'dismissed'}`: si ya no quedan denuncias pendientes sobre ese post → `VISIBLE` otra vez. Con `{status:'actioned'}`: permanece `HIDDEN`.
- Nuevo `DELETE /posts/:id` por admin: ya existe para el dueño; permitir el rol ADMIN.

**Pruebas:** tercer denunciante distinto oculta; el mismo usuario denunciando tres veces no oculta; restauración; el feed no devuelve ocultos.

## B6 · Bloqueo de usuarios

**Modelo:** `UserBlock { blockerId, blockedId, createdAt }`, único por par.

**Dominio y aplicación:** puerto `IUserBlockRepository` (`src/domain/shared/repositories`), repositorio Prisma, casos de uso `block-user`, `unblock-user`, `list-blocked-users`.

**Contratos**

| Ruta | Respuesta |
|---|---|
| `POST /users/:id/block` | 204, idempotente. No se puede bloquear a uno mismo (400 `CANNOT_BLOCK_SELF`) |
| `DELETE /users/:id/block` | 204, idempotente |
| `GET /users/me/blocks?page&limit` | `data.{data:[{id,firstName,lastName,avatarUrl,blockedAt}],total,page,limit}` |

**Efectos** (se evalúan en ambas direcciones)
- `send-message`, `send-media` y `send_message` por socket: 403 `USER_BLOCKED`.
- `create-order.usecase.ts`: 403 `USER_BLOCKED`.
- `GET /conversations` y `GET /conversations/:orderId` agregan `blockedByMe` y `blockedMe` (booleanos). La conversación sigue legible.
- Las órdenes abiertas **no** se cancelan por un bloqueo (decisión abierta: ¿se informa a soporte?). Se propone que sigan su curso y solo se corte el chat.

## B7 · Suspensión y herramientas de soporte

**Modelo:** `User.suspendedAt`, `User.suspensionReason` (interno, nunca se devuelve al usuario).

**Casos de uso** (módulo `admin`)
- `suspend-user.usecase.ts` / `reinstate-user.usecase.ts`. Al suspender se reutiliza el mecanismo de la baja de cuenta: incrementar `authVersion`, revocar `RefreshSession`, emitir el evento que desconecta sockets, ocultar servicio y fotos del proveedor.
- `resolve-dispute.usecase.ts`: cierra una orden `DISPUTED` con resultado y notas, y registra el cambio en `OrderStatusHistory`.

**Contratos (ADMIN)**

| Ruta | Detalle |
|---|---|
| `PATCH /admin/users/:id/suspension` | `{suspended:boolean, reason:string}` → 200 |
| `GET /admin/orders?status=disputed&page&limit` | cola de disputas con ambas partes y los últimos mensajes |
| `POST /admin/orders/:id/resolve` | `{outcome:'completed'\|'cancelled', notes:string}`; notifica a ambas partes |

Esto cubre la **decisión abierta 3** (cómo registra soporte el resultado) con API, sin construir un panel: soporte opera desde la herramienta que elija el equipo. Un panel queda para la próxima versión.

**Efecto para el usuario suspendido:** cualquier request autenticada, el login y el refresh responden 403 `ACCOUNT_SUSPENDED`. No se devuelve el motivo.

**Pruebas:** login y refresh de un suspendido; sockets desconectados; el servicio y las fotos desaparecen del catálogo y se restauran al reponer.

## B8 · Favoritos en la cuenta

**Modelo:** `Favorite { userId, serviceId, createdAt }`, único por `(userId, serviceId)`. Módulo nuevo `favorites` (domain, application, infrastructure, presentation).

**Contratos**

| Ruta | Respuesta |
|---|---|
| `GET /favorites?page&limit` | paginado `data.{data,total,page,limit}`; cada ítem es el `ServiceDto` con `provider`. Excluye servicios inactivos, sin foto, de otra ciudad o de proveedores suspendidos |
| `PUT /favorites/:serviceId` | 204, idempotente. 404 `SERVICE_NOT_FOUND` si no existe o no es visible |
| `DELETE /favorites/:serviceId` | 204, idempotente |

Como hay un solo servicio por proveedor, favorito de servicio equivale a favorito de proveedor.

## B9 · Un servicio por proveedor, visibilidad del catálogo

- `create-service.usecase.ts`: el límite deja de depender de `maxServices` del plan y pasa a una constante de dominio `MAX_SERVICES_PER_PROVIDER = 1`. Sigue devolviendo 422 `SERVICE_LIMIT_REACHED`.
- Predicado único de visibilidad `isCatalogVisible` en `src/application/service/queries`: `isActive && images.length >= 1 && provider no suspendido && provider KYC aprobado`. Lo usan `GET /services`, `/services/featured`, `/search`, `/favorites` y `/posts/feed`. Hoy esa lógica está repartida (verificar).
- Como el servicio se crea y la foto se sube en dos pasos (`POST /services`, luego `POST /services/:id/images`), un servicio sin foto simplemente no aparece en el catálogo hasta subirla.
- `POST /services/:id/images` pasa a **reemplazar** la imagen principal cuando se envía el campo `main=true` (cierra C17 del lado servidor); sin él, agrega como hoy.
- Respuesta de `POST /services/:id/images`: `{imageUrls: string[]}` (ya es así).

## B10 · Verificaciones previas a publicar

- `create-service.usecase.ts`: además de `IDENTITY_NOT_VERIFIED` (existente), exige `isPhoneVerified` → 403 `PHONE_NOT_VERIFIED`. Hoy no se aplica en ningún lado (verificado).
- `create-post.usecase.ts`: agregar el mismo control `IDENTITY_NOT_VERIFIED` (hoy solo valida que el servicio sea del usuario).
- `GET /identity/status` devuelve `allowedDocumentTypes` según la ciudad del usuario. **Verificar con Didit** qué tipos acepta para Colombia (cédula de ciudadanía) y para Argentina (DNI).

## B11 · Búsqueda y orden del catálogo

- `GET /search`, `GET /services` y `GET /services/featured`: orden por defecto `rating DESC, reviewsCount DESC`, con los proveedores verificados primero. Parámetro opcional `sort=rating|recent`.
- El precio se devuelve como `{amount|null, currency}` (hoy `price` es un objeto en el servidor). `amount: null` indica «a cotizar».
- Mantener `provider.id` como identificador del proveedor y **no** devolver `providerId` plano (los adaptadores del frontend ya lo resuelven).

## B12 · Configuración de arranque, soporte y difusión

- `GET /app/config` (ya existe) agrega `supportWhatsapp` (solo dígitos con prefijo del país, por ejemplo `5492494000000`) y `supportMessage` opcional. Variables de entorno `APP_SUPPORT_WHATSAPP` y `APP_SUPPORT_MESSAGE`. Así el número cambia sin publicar la app y se cierra la **decisión abierta 1** con solo cargar el número.
- Difusión de «novedades de la plataforma» (decisión abierta 2): `POST /admin/notifications/broadcast` con `{cityId?, title, body}` y rol ADMIN, que encola `PLATFORM_NEWS` para los usuarios de la ciudad. Si no se quiere en v1, retirar `PLATFORM_NEWS` del PRD.

## B13 · Contrato OpenAPI publicado

Cierra el hallazgo C24 de la auditoría. Exportar `openapi.json` desde el backend desplegable en cada merge a `main` y publicarlo como artefacto de CI. El frontend lo copia a `docs/backend-openapi.json` y corre `npm run contracts:generate`. Hoy el snapshot del frontend tiene rutas fantasma de pagos y suscripciones.

## Resumen de endpoints

| Ruta | Estado | Tarea |
|---|---|---|
| `GET /cities` | nueva | B1 |
| `PATCH /users/me/city` | nueva | B1 |
| `PATCH /orders/:id/mark-done` | nueva | B3 |
| `PATCH /orders/:id/confirm` | nueva | B3 |
| `PATCH /orders/:id/complete` | se retira | B3 |
| `POST /users/:id/block`, `DELETE /users/:id/block`, `GET /users/me/blocks` | nuevas | B6 |
| `PATCH /admin/users/:id/suspension` | nueva | B7 |
| `GET /admin/orders`, `POST /admin/orders/:id/resolve` | nuevas | B7 |
| `GET /favorites`, `PUT /favorites/:serviceId`, `DELETE /favorites/:serviceId` | nuevas | B8 |
| `POST /admin/notifications/broadcast` | nueva (opcional) | B12 |
| `POST /auth/register`, `POST /auth/google` | cambian el body | B1, B2 |
| `GET /app/config`, `GET /users/me`, `GET /users/:id/public`, `GET /services/:id/posts`, `GET /conversations*`, `GET /orders*`, `GET /identity/status` | cambian la respuesta | B1, B3, B5, B6, B10, B12 |

## Decisiones abiertas que tocan al backend

1. Ciudad a la que migran los datos existentes (se propone `tandil`).
2. ¿Puede un usuario cambiar de ciudad? Se propone que no en v1 (solo soporte).
3. Disputa desde `AWAITING_CONFIRMATION`: ¿también la puede abrir el proveedor?
4. Qué pasa con las órdenes abiertas cuando una parte bloquea a la otra.
5. Si la difusión de novedades entra en v1.

## Implementación (2026-11-09)

B1–B13 están implementadas y mergeadas a `main` de `bosko-backend` (PRs #36 Trabajos, #38 dependencias y #37 PRD v1). Seguimiento por tarea, evidencia y desvíos: `odd/tasks/prd-v1-backend.md` en ese repositorio. CI completo en verde, con los tests de integración contra PostgreSQL.

Desvíos respecto del contrato de arriba (el frontend ya los contempla):

- El error de transición sigue siendo `INVALID_ORDER_STATUS_TRANSITION` (422), con `details.currentStatus`.
- `POST /auth/google` acepta `cityId` opcional; un usuario nuevo sin ciudad recibe 422 `CITY_REQUIRED` y no se crea nada.
- `GET /notifications` devuelve el tipo detallado (`ORDER_CANCELLED`, `NEW_MESSAGE`, …) en lugar de las categorías gruesas.
- El proveedor no puede abrir una disputa desde `awaiting_confirmation`. `reason` de 5 a 500 caracteres también en disputas.
- `SERVICE_LIMIT_REACHED` pasó a 422 (antes 403). `price` se devuelve como `{amount|null, currency}`; `null` se guarda como 0 y significa «a cotizar».
- `actioned` se acepta como alias del estado guardado `reviewed` en `PATCH /admin/reports/:id`.
- Los administradores no se pueden suspender (422 `CANNOT_SUSPEND_ADMIN`); las órdenes abiertas no se tocan al suspender.
- `content_reports` necesitó una migración extra para aceptar `post` como `target_type` (`20261103000100`).

Diferido: recordatorio 24 h antes del cierre automático (necesita columna «recordatorio enviado»), difusión idempotente ante reintentos, esquema de Prisma desalineado con la base (tabla `payments`).
