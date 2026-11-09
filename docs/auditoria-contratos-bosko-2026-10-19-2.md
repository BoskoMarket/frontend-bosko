# Auditoría de contratos API de Bosko

Fecha: 19 de octubre de 2026 (Argentina) / 20 de octubre UTC. **Solo lectura.**

## Alcance y resultado

Frontend: [dev @ 92335531d4e4](https://github.com/BoskoMarket/frontend-bosko/tree/92335531d4e4868a566048ba4efe1a4e4028f53d). Backend: [main @ 989e9af33b79](https://github.com/GallosoGonzalo/bosko-backend/tree/989e9af33b7929662b77feb7683296330565f80b). Se fijaron estas revisiones para que los resultados sean reproducibles.

Se inventariaron **90 rutas del backend**, **95 ubicaciones de llamadas HTTP del frontend** y **85 combinaciones distintas de método/ruta consumidas**: 80 coinciden con rutas del servidor y 5 no existen. Hay **26 hallazgos: 6 de prioridad alta, 17 media y 3 baja**. La prioridad expresa impacto del contrato, no una calificación CVSS.

Se contrastaron controladores, DTO, casos de uso, servicios HTTP, hooks, pantallas, navegación, multipart, paginación, autenticación, respuestas y documentación OpenAPI. También se revisaron simulaciones locales y el contrato de chat. No se modificó código, no se crearon ramas/PR ni se ejecutaron escrituras contra la API. KYC se documenta únicamente donde afecta contratos; no se implementó ningún cambio.

## Actualización de estado — 2026-11-07

Cruce de los 26 hallazgos contra el frontend en `feat/trabajos-tab` (HEAD `cf06f47`; `tsc --noEmit` limpio). **Solo se leyó el código del frontend.** El backend no se volvió a inspeccionar: lo que se dice de él sale de los contratos de entrega `docs/backend-contract-fixes.md`, `frontend-app-config.md`, `frontend-account-lifecycle.md` y `frontend-media-reports.md`, y no está verificado contra `main` ni contra producción. Los 3 hallazgos marcados como «dependencia de backend» (C03, C07, C08) deben volver a probarse con el despliegue real.

Resumen: **16 resueltos en el frontend, 3 dependen de backend, 2 parciales (C09, C12), 5 abiertos (C11, C17, C24, C25, C26).**

| ID | Estado | Evidencia / pendiente |
|---|---|---|
| C01 | Resuelto | `fetchFeaturedServices` mapea con `mapService`; la navegación usa `getProviderRouteId` (`ClientHome`, `catalog`). |
| C02 | Resuelto | `SearchPage` navega con `getProviderRouteId` y deshabilita la fila si no hay ID. |
| C03 | Dependencia de backend | El frontend ya sube a `POST /reels/upload`. El contrato de entrega lo describe como implementado; falta probarlo contra el despliegue. Reels está oculto tras `FEATURES.reels = false`, así que no bloquea esta versión. |
| C04 | Resuelto en frontend | `deleteAccountService` envía `{password}` o `{googleIdToken}`, lee `authProvider` y trata `ACTIVE_ORDERS`/409. Backend: según `frontend-account-lifecycle.md`. Revisar los textos para no prometer que desaparece todo dato (ver «Qué significa eliminación definitiva» en ese doc). |
| C05 | Resuelto | `plan.service.ts` adapta `PlanDto` y arma `features` desde `maxServices` y los flags; ya no hay `features.map` sobre un campo ausente. |
| C06 | Resuelto en frontend | `resendVerificationService` llama a `POST /auth/resend-verification`. Falta confirmar la espera de 60 s y el manejo de 429 en `VerifyEmailScreen`. |
| C07 | Dependencia de backend | `POST/DELETE /users/me/banner` se consumen; el contrato de entrega dice que existen. Falta probarlo contra el despliegue. El comentario de `EditProfileScreen.tsx:3` sigue diciendo «propuesto». |
| C08 | Dependencia de backend | `reportUser` llama a `POST /users/:id/report`, que el contrato de entrega da por implementado. Sin probar. |
| C09 | Parcial | El frontend envía `{reason,details}`. El contrato de entrega lista `POST /reviews/:id/report` con body, pero no confirma que el motivo se persista. |
| C10 | Resuelto en frontend | El gate recuerda el 404 y abre la app (fail-open). Backend: `frontend-app-config.md` dice que el endpoint existe. Pendiente: actualizar el comentario de `appConfig.service.ts:4`, que dice que no existe. |
| C11 | **Abierto** | `payments.ts` sigue usando `simulatePayment`; `plan.service.ts` sigue usando AsyncStorage. Pagos y suscripciones son simulados. Sigue siendo el bloqueante principal para producción con cobro real. |
| C12 | Parcial | Órdenes, notificaciones y reels (feed y «mis reels») ya usan `useInfiniteQuery`. No se verificó la paginación de «mis reseñas», de reseñas del perfil público ni de `/services/me`. |
| C13 | Resuelto | `OrderDetailScreen` usa `order.review`; el contrato de entrega lo agrega a `GET /orders/:id`. |
| C14 | Resuelto en frontend | `chatOrderRules` usa `orderStatus` y maneja `ORDER_CLOSED`. Backend: según `backend-contract-fixes.md`. |
| C15 | Resuelto | `serviceFormRules.ts`: `TITLE_MIN = 10`, `TITLE_MAX = 255`. |
| C16 | Resuelto | En edición el selector queda `disabled` y el subtítulo dice «La categoría no se puede cambiar después de publicar». |
| C17 | **Abierto** | `uploadServiceImages` solo agrega imágenes. Los `catch` de `ServiceFormScreen.tsx` (~líneas 205-232) siguen tragándose el error y mostrando éxito aunque la foto no se haya subido. |
| C18 | Resuelto | `QuoteRequestScreen` usa selector de día/hora y `toScheduledIso`; la fecha es opcional. |
| C19 | Resuelto | `useReelsFeed(feed)` usa el tipo de feed en la query key y `getReelIsFollowing` lee `isFollowing` en la raíz. Reels está oculto por feature flag. |
| C20 | Resuelto | `isVideoUrl` comprueba solo el pathname, sin la query de la firma. |
| C21 | Resuelto en frontend | `notificationRoute` resuelve `conversationId` a orden antes de navegar. Si el backend no incluye `orderId` en el push, depende de esa resolución. |
| C22 | Resuelto | `uploadServiceImages` tipa `{ imageUrls: string[] }`. |
| C23 | Resuelto | `normalizeOrder` se aplica a las listas; se corrobora el detalle. No se revisó cada mutación individual. |
| C24 | **Abierto (sin verificar)** | `contracts:check` sigue comparando contra `docs/backend-openapi.json` local; el snapshot no se actualizó desde `49674a8`. Falta exportar el contrato real del backend. |
| C25 | **Abierto** | `useAddServiceWithPlanLimit` sigue infiriendo el plan desde `authState.user` y bloquea por `plan === 'FREE'`; no consume `/plans/my-plan` ni `maxServices`. |
| C26 | **Abierto** | `AdminBackgroundCheckScreen.tsx:147` sigue sin listado de pendientes («`GET /admin/background-check/pending` no está disponible»). La cola de antecedentes queda vacía. |

### Pendiente de verificar con cuentas de prueba

Registro con reenvío de OTP, baja y recuperación de cuenta (contraseña y Google), portada, subida y publicación de reels, denuncias de usuario/reseña/reel, chat con orden cerrada, y `GET /app/config`.

### Orden de cierre actualizado

1. C11: decidir si el lanzamiento incluye cobro real. Si no, retirar o rotular los recorridos de pagos y planes simulados; si sí, integrar el proveedor y confirmar el pago desde el servidor.
2. C25 y C17: leer el plan real y no ocultar fallos de subida de imágenes. Ambos son cambios chicos del frontend.
3. C24: regenerar `backend-openapi.json` desde el backend desplegable para que `contracts:check` sirva de algo.
4. C26: acordar el listado administrativo de antecedentes o esconder el panel.
5. Verificar con cuentas de prueba la lista anterior.
6. Limpiar comentarios obsoletos (C07, C10) y cerrar C09, C12 y C21 con el backend.

## El 404 observado en categorías

`GET /api/v1/categories` y `GET /api/v1/services?categoryId=<UUID válido>&page=1&limit=10` respondieron **200**. El mapeo de servicios de categoría transforma correctamente `provider.id` a `providerId`. No se reprodujo un 404 en esos endpoints. Sí se reprodujo **404 en `/api/v1/app/config`**, consultado al iniciar la app; destacados y búsqueda además generan IDs incorrectos al abrir perfiles. Sin el registro de la solicitud original no se puede atribuir aquel error a una causa única.

## Rutas llamadas que no existen en main

| Método y ruta | Recorrido | Hallazgo |
|---|---|---|
| `GET /app/config` | Inicio/configuración remota | C10 |
| `POST /users/me/banner` | Editar portada | C07 |
| `DELETE /users/me/banner` | Quitar portada | C07 |
| `POST /reels/upload` | Publicar video desde archivo; modalidad inicial | C03 |
| `POST /users/:id/report` | Denunciar usuario desde perfil/chat | C08 |

Banner, reportes y subida de reels están documentados como propuestas en `odd/backend-requests.md`: son dependencias pendientes expuestas en la interfaz. Eso no las convierte en endpoints implementados. El manejo de 404 con un aviso de indisponibilidad evita algunos errores visibles, pero el recorrido sigue sin funcionar.

## Hallazgos y evidencia

### C01 · Alta · Destacados se consumen como ServiceSummary y se navega con el ID incorrecto

**Contrato:** `GET /services/featured → GET /users/:id/public`.

El backend devuelve ServiceDto[]: id identifica el servicio y el proveedor está en provider.id. fetchFeaturedServices devuelve ese array sin mapearlo, aunque declara Promise<ServiceSummary[]>. ClientHome navega con item.providerId ?? item.id: al faltar providerId, envía el ID del servicio. También espera thumbnail, rate, name y categoryId, que no tienen la forma esperada.

**Impacto:** Al tocar un destacado se solicita el perfil de un usuario cuyo ID es en realidad de servicio. Puede responder USER_NOT_FOUND/404. Las tarjetas también pierden datos. Confirmado con la respuesta pública real (9 destacados, provider.id presente, providerId ausente) y reproducción local del consumo.

**Corrección propuesta:** Adaptar ServiceDto a ServiceSummary antes de mostrarlo y navegar exclusivamente con el ID validado de provider.id; no usar service.id como respaldo de user.id.

**Fuentes:** [src/features/servicesUser/services/services.ts:50](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/servicesUser/services/services.ts#L50); [src/features/servicesUser/screens/ClientHome.tsx:167](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/servicesUser/screens/ClientHome.tsx#L167); [src/application/service/use-cases/get-featured-services.usecase.ts:15](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/application/service/use-cases/get-featured-services.usecase.ts#L15).

### C02 · Alta · Búsqueda interpreta mal servicios y proveedores

**Contrato:** `GET /search → perfil público`.

search.service devuelve SearchResultDto sin adaptarlo. SearchPage espera providerId/userId en cada servicio, pero el backend devuelve provider.id. Su expresión de navegación termina en cadena vacía. Para proveedores espera name/avatar, pero recibe firstName/lastName/avatarUrl. price es un objeto en el servidor y un número según la interfaz del cliente.

**Impacto:** Los servicios encontrados pueden abrir /users//public; las filas de proveedores pueden carecer de nombre/foto y los precios no corresponden al tipo esperado. La consulta pública real de plomería devolvió dos servicios con provider.id y sin providerId.

**Corrección propuesta:** Unificar tipos y adaptar la respuesta de búsqueda; usar provider.id para servicios y construir el nombre/foto desde los campos reales.

**Fuentes:** [src/features/search/SearchPage.tsx:145](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/search/SearchPage.tsx#L145); [src/features/search/services/search.service.ts:5](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/search/services/search.service.ts#L5); [src/application/search/use-cases/search-all.usecase.ts:78](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/application/search/use-cases/search-all.usecase.ts#L78).

### C03 · Alta · La subida de reels desde el teléfono llama a una ruta inexistente

**Contrato:** `POST /reels/upload`.

ReelUploadScreen abre por defecto la modalidad de archivo. uploadReelVideo envía multipart con el campo video a /reels/upload; ningún controller de main declara esa ruta. Está documentada como propuesta BR04. La alternativa con enlace sí usa POST /reels, que existe.

**Impacto:** El recorrido principal para publicar desde galería/cámara no puede completarse. El frontend muestra un mensaje de función no disponible ante 404/405/501; manejar el error no implementa el servicio.

**Corrección propuesta:** Implementar el contrato de subida o no presentar la modalidad de archivo como disponible; mantener separada la publicación mediante URL.

**Fuentes:** [src/features/reels/services/reels.service.ts:150](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/reels/services/reels.service.ts#L150); [src/features/reels/screens/ReelUploadScreen.tsx:28](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/reels/screens/ReelUploadScreen.tsx#L28); [src/presentation/di/modules/reels/reels.controller.ts:83](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/reels/reels.controller.ts#L83).

### C04 · Alta · Baja de cuenta promete reautenticación, bloqueo de órdenes y recuperación que no existen

**Contrato:** `DELETE /users/me; GET /users/me; POST /auth/login`.

El cliente envía password o googleIdToken, espera ACTIVE_ORDERS/409 y anuncia 30 días recuperables y reactivación al iniciar sesión. El controller de DELETE no recibe Body: ignora las credenciales y el caso de uso solo ejecuta softDeleteAndRevokeSessions. No comprueba órdenes activas ni programa borrado definitivo ni reactivación. GET /users/me tampoco devuelve authProvider, por lo que el selector de reautenticación Google se trata como password por defecto.

**Impacto:** Una sesión autenticada puede solicitar la baja sin que se compruebe la contraseña que la UI pide. El usuario recibe una promesa de recuperación sin respaldo. Los controles locales de órdenes no sustituyen una validación del servidor y además solo conocen la primera página.

**Corrección propuesta:** Acordar un contrato real de baja: reautenticación, validación transaccional de órdenes, estado/fecha de borrado y recuperación, o ajustar explícitamente la experiencia a una baja sin esas promesas. Devolver authProvider si el cliente depende de ese dato.

**Fuentes:** [src/features/profile/services/profile.ts:111](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/profile/services/profile.ts#L111); [src/features/profile/utils/deleteAccountRules.ts:4](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/profile/utils/deleteAccountRules.ts#L4); [src/features/profile/screens/DeleteAccountScreen.tsx:68](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/profile/screens/DeleteAccountScreen.tsx#L68); [src/presentation/di/modules/users/users.controller.ts:113](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/users/users.controller.ts#L113); [src/application/user/use-cases/delete-account.usecase.ts:22](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/application/user/use-cases/delete-account.usecase.ts#L22).

### C05 · Alta · El contrato de planes puede romper la pantalla

**Contrato:** `GET /plans`.

El cliente espera price:number, currency, interval, description, highlighted y features:string[]. PlanDto devuelve price:{amount,currency}, type, maxServices y beneficios individuales. fetchPlans no los adapta. PlansScreen ejecuta plan.features.map y formatea plan.price como número.

**Impacto:** Con un PlanDto real, features.map lanza TypeError. Los precios y la periodicidad tampoco pueden deducirse del contrato actual. Reproducción local confirmada.

**Corrección propuesta:** Definir/adaptar el modelo de plan con sus beneficios y precio reales; no inventar periodicidad ni descripción comercial a partir de campos inexistentes.

**Fuentes:** [src/features/plans/services/plan.service.ts:21](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/plans/services/plan.service.ts#L21); [src/features/plans/screens/PlansScreen.tsx:232](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/plans/screens/PlansScreen.tsx#L232); [src/application/plan/queries/dto/plan.dto.ts:6](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/application/plan/queries/dto/plan.dto.ts#L6).

### C06 · Alta · El reenvío del OTP de registro no tiene recorrido válido

**Contrato:** `POST /auth/register y POST /auth/verify-email`.

VerifyEmailScreen.handleResend no llama a la API: recomienda registrarse de nuevo con el mismo email. El backend no tiene /auth/resend-verification y RegisterUseCase rechaza un email existente antes de emitir otro OTP. Forgot-password utiliza otra clave/código y no resuelve la verificación inicial.

**Impacto:** Cuando expira el OTP de registro, el usuario queda sin un mecanismo funcional de reenvío. Volver a registrarse, como recomienda la pantalla, termina en EMAIL_ALREADY_IN_USE.

**Corrección propuesta:** Acordar e implementar un reenvío de verificación con límites de abuso y retirar la recomendación de volver a registrar el mismo email.

**Fuentes:** [src/features/auth/screens/VerifyEmailScreen.tsx:100](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/auth/screens/VerifyEmailScreen.tsx#L100); [src/application/auth/use-cases/register.usecase.ts:37](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/application/auth/use-cases/register.usecase.ts#L37); [src/presentation/di/modules/auth/auth.controller.ts:86](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/auth/auth.controller.ts#L86).

### C07 · Media · La portada usa dos endpoints propuestos sin implementación

**Contrato:** `POST /users/me/banner; DELETE /users/me/banner`.

El cliente monta la edición de portada y envía multipart banner o DELETE. main solo dispone de avatar; no hay rutas de banner ni bannerUrl en UserProfileDto. BR01 reconoce la dependencia pendiente. El texto de BR01 que afirma que GET /users/me ya devuelve bannerUrl no coincide con el backend inspeccionado.

**Impacto:** Cambiar/quitar portada termina como no disponible; la lectura tampoco tiene una fuente de verdad para ese campo.

**Corrección propuesta:** Implementar el contrato completo de lectura/escritura de portada o mantener la función deshabilitada hasta que exista.

**Fuentes:** [src/features/profile/services/profile.ts:66](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/profile/services/profile.ts#L66); [src/features/users/screens/EditProfileScreen.tsx:61](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/users/screens/EditProfileScreen.tsx#L61); [src/application/user/queries/dto/user-profile.dto.ts:1](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/application/user/queries/dto/user-profile.dto.ts#L1).

### C08 · Media · Reportar usuarios llama a una ruta inexistente

**Contrato:** `POST /users/:id/report`.

ReportFlow desde perfil/chat usa reportUser con reason, details y context. main no expone esa ruta; BR03 la define como propuesta. El frontend captura 404/405/501 y comunica indisponibilidad.

**Impacto:** No se registra la denuncia del usuario aunque la interfaz permita iniciar el recorrido. No se ejecutó ningún POST para verificarlo, respetando solo lectura.

**Corrección propuesta:** Completar el contrato y la persistencia/moderación o no presentar el envío como operativo.

**Fuentes:** [src/features/reports/services/report.service.ts:22](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/reports/services/report.service.ts#L22); [src/features/servicesUser/screens/ProviderProfileScreen.tsx:127](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/servicesUser/screens/ProviderProfileScreen.tsx#L127); [src/presentation/di/modules/users/users.controller.ts:40](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/users/users.controller.ts#L40).

### C09 · Media · El motivo de reporte de una reseña se descarta

**Contrato:** `POST /reviews/:id/report`.

El cliente envía {reason,details?}; el controller no recibe el body y ReportReviewUseCase solo marca isReported=true. La ruta sí existe y puede responder con éxito sin guardar el motivo solicitado. No debe confundirse con un 404.

**Impacto:** Moderación pierde el contexto de la denuncia. El frontend da por enviado un contenido que el servidor no conserva.

**Corrección propuesta:** Acordar DTO/persistencia del reporte o ajustar la UI al simple marcado que soporta hoy el backend.

**Fuentes:** [src/features/reviews/services/review.service.ts:42](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/reviews/services/review.service.ts#L42); [src/presentation/di/modules/reviews/reviews.controller.ts:60](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/reviews/reviews.controller.ts#L60); [src/application/review/use-cases/report-review.usecase.ts:14](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/application/review/use-cases/report-review.usecase.ts#L14).

### C10 · Media · Configuración remota consultada al arrancar responde 404

**Contrato:** `GET /app/config`.

useAppGate y useAppConfigSettled consultan este endpoint desde la raíz. No existe en main; el servicio captura cualquier error y devuelve null, por lo que la aplicación queda abierta. Se confirmó en producción 404 NOT_FOUND: Cannot GET /api/v1/app/config.

**Impacto:** Genera un 404 durante el inicio, incluso mientras se muestra otra pantalla como categorías. Mantenimiento y versión mínima no están gobernados por el servidor. No prueba que este haya sido exactamente el 404 observado por el usuario.

**Corrección propuesta:** Implementar el contrato remoto o evitar solicitar una función ausente. Diferenciar endpoint no disponible de un error transitorio.

**Fuentes:** [src/features/appConfig/services/appConfig.service.ts:18](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/appConfig/services/appConfig.service.ts#L18); [src/features/appConfig/hooks/useAppGate.ts:18](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/appConfig/hooks/useAppGate.ts#L18); [app/_layout.tsx:26](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/app/_layout.tsx#L26).

### C11 · Media · Pagos y suscripciones siguen simulados en dev

**Contrato:** `Servicios de payments y plans; GET /plans/my-plan y GET /subscriptions/history sin consumo`.

payments.ts contiene comentarios que dicen llamar a /payments, pero ejecuta mockPayments/AsyncStorage. Suscribirse, cancelar, consultar plan e historial también operan localmente; solo el catálogo GET /plans es HTTP. No hay POST/DELETE /subscriptions ni módulo payments en main. El PR frontend #29 de retirada de pagos no forma parte del snapshot dev auditado.

**Impacto:** El plan/suscripción mostrado puede diferir del servidor y no modifica sus cupos. No se observó cobro real: la UI identifica estas pantallas como simulación. Estas referencias no se cuentan como llamadas HTTP a endpoints inexistentes.

**Corrección propuesta:** Separar claramente demo de producto real; integrar o retirar recorridos y comentarios obsoletos. Para lectura de plan/límites e historial usar los endpoints reales si esa es la funcionalidad deseada.

**Fuentes:** [src/features/payments/services/payments.ts:47](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/payments/services/payments.ts#L47); [src/features/plans/services/plan.service.ts:62](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/plans/services/plan.service.ts#L62); [src/presentation/di/modules/plans/plans.controller.ts:31](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/plans/plans.controller.ts#L31).

### C12 · Media · Varias listas solo muestran la primera página

**Contrato:** `GET /orders/client, /orders/provider, /services/me, /notifications, /reels/me y reseñas de proveedor`.

Órdenes y servicios propios normalizan a arrays y descartan total/page/limit; sus hooks no avanzan de página. Notificaciones fija useNotificationsQuery(1). Mis reels pide /reels/me sin page y espera un único array. Mis reseñas solicita la primera página y el perfil público limita reseñas a 10 sin carga adicional.

**Impacto:** Órdenes, publicaciones, reseñas y avisos anteriores quedan fuera de la UI. Los indicadores de solicitudes y bloqueos de baja derivados de estos arrays pueden ser incompletos. En órdenes/servicios/notificaciones el valor por defecto es 20; mis reels también usa PaginationDto=20.

**Corrección propuesta:** Conservar metadatos y usar paginación/infinite query o endpoints de agregados para contadores; no inferir totales globales del primer lote.

**Fuentes:** [src/hooks/queries/useOrdersQuery.ts:25](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/hooks/queries/useOrdersQuery.ts#L25); [src/features/notifications/state/NotificationsContext.tsx:34](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/notifications/state/NotificationsContext.tsx#L34); [src/features/servicesUser/services/service.ts:40](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/servicesUser/services/service.ts#L40); [src/features/reels/services/reels.service.ts:60](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/reels/services/reels.service.ts#L60); [src/shared/types/pagination.type.ts:22](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/shared/types/pagination.type.ts#L22).

### C13 · Media · El detalle de orden no informa la reseña ya dejada

**Contrato:** `GET /orders/:id`.

OrderDetailScreen decide ofrecer Calificar servicio con !order.review. GetOrderUseCase no incluye review ni consulta esa relación. Tras crear una reseña y volver a cargar la orden, ese campo sigue ausente.

**Impacto:** La interfaz vuelve a ofrecer calificar una orden ya calificada; el servidor rechazará el segundo intento con ALREADY_REVIEWED.

**Corrección propuesta:** Devolver la reseña del cliente o un flag reviewedByMe y consumirlo como parte del contrato del detalle.

**Fuentes:** [src/features/orders/screens/OrderDetailScreen.tsx:354](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/orders/screens/OrderDetailScreen.tsx#L354); [src/application/order/use-cases/get-order.usecase.ts:27](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/application/order/use-cases/get-order.usecase.ts#L27); [src/application/review/use-cases/create-review.usecase.ts:50](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/application/review/use-cases/create-review.usecase.ts#L50).

### C14 · Media · El cierre del chat depende del frontend

**Contrato:** `POST /conversations/:id/messages, POST /conversations/:id/media y evento send_message`.

El cliente declara chats completed/cancelled como solo lectura y maneja ORDER_CLOSED/409. SendMessageUseCase y SendMediaUseCase comprueban pertenencia a la conversación pero no consultan el estado de la orden. BR02 solicita esta regla pendiente; GET /conversations tampoco devuelve orderStatus, aunque el cliente lo contempla como opcional.

**Impacto:** Un cliente directo o una versión anterior puede seguir enviando en órdenes que la UI presenta como cerradas. Falta una regla de negocio de servidor, no una ruta HTTP nueva. No se enviaron mensajes durante la auditoría.

**Corrección propuesta:** Si la decisión de producto sigue vigente, aplicar una comprobación común y atómica en todos los canales de envío y devolver el código acordado; agregar el estado a las conversaciones.

**Fuentes:** [src/features/chat/constants/chatOrderRules.ts:17](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/chat/constants/chatOrderRules.ts#L17); [src/application/chat/use-cases/send-message.usecase.ts:31](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/application/chat/use-cases/send-message.usecase.ts#L31); [src/application/chat/use-cases/send-media.usecase.ts:30](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/application/chat/use-cases/send-media.usecase.ts#L30).

### C15 · Media · Validación del título de servicio difiere entre UI y DTO

**Contrato:** `POST /services y PATCH /services/:id`.

ServiceFormScreen solo exige un título no vacío. CreateServiceDto y UpdateServiceDto exigen longitud de 10 a 255. La descripción sí coincide en el mínimo de 20. La edición elimina categoryId antes de enviar, por lo que no corresponde atribuirle aquí un error 400 por campo extra.

**Impacto:** Un título corto que la UI permite enviar es rechazado con VALIDATION_ERROR/400. La UI tampoco impone todas las longitudes máximas del DTO.

**Corrección propuesta:** Compartir las reglas de validación y mostrar restricciones antes de enviar; conservar la validación del servidor.

**Fuentes:** [src/features/servicesUser/screens/ServiceFormScreen.tsx:149](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/servicesUser/screens/ServiceFormScreen.tsx#L149); [src/presentation/di/modules/services/dto/create-service.dto.ts:5](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/services/dto/create-service.dto.ts#L5); [src/presentation/di/modules/services/dto/update-service.dto.ts:6](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/services/dto/update-service.dto.ts#L6).

### C16 · Media · La edición permite elegir otra categoría pero no la guarda

**Contrato:** `PATCH /services/:id`.

El selector de categorías sigue habilitado en edición. handleSubmit quita categoryId del payload mediante destructuring. UpdateServiceDto no admite ese campo. No hay una operación actual para guardar ese cambio desde esta pantalla.

**Impacto:** El usuario puede cambiar la selección y recibir Servicio actualizado, pero la categoría conserva el valor anterior.

**Corrección propuesta:** Deshabilitar el cambio si es una restricción del producto o acordar e implementar su actualización en ambos lados.

**Fuentes:** [src/features/servicesUser/screens/ServiceFormScreen.tsx:189](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/servicesUser/screens/ServiceFormScreen.tsx#L189); [src/features/servicesUser/screens/ServiceFormScreen.tsx:287](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/servicesUser/screens/ServiceFormScreen.tsx#L287); [src/presentation/di/modules/services/dto/update-service.dto.ts:3](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/services/dto/update-service.dto.ts#L3).

### C17 · Media · Cambiar foto principal solo agrega otra imagen

**Contrato:** `POST /services/:id/images`.

ServiceFormScreen ofrece Foto principal / Cambiar foto y envía el archivo al endpoint de imágenes. main agrega las claves al array; no reemplaza ni reordena la primera. El catálogo toma images[0] como miniatura. Los errores de subida inicial/edición se capturan sin advertir que la imagen no se guardó.

**Impacto:** La nueva foto puede quedar al final y la foto principal anterior seguir apareciendo tras refrescar; también se puede anunciar éxito con una subida fallida.

**Corrección propuesta:** Acordar una operación de reemplazo/reordenamiento para foto principal y diferenciar guardado de servicio de errores de imágenes.

**Fuentes:** [src/features/servicesUser/screens/ServiceFormScreen.tsx:306](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/servicesUser/screens/ServiceFormScreen.tsx#L306); [src/features/servicesUser/services/catalog.ts:18](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/servicesUser/services/catalog.ts#L18); [src/infrastructure/persistence/prisma/repositories/service/prisma-service.repository.ts:247](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/infrastructure/persistence/prisma/repositories/service/prisma-service.repository.ts#L247).

### C18 · Media · La fecha deseada puede descartarse silenciosamente

**Contrato:** `POST /orders`.

La pantalla invita a ingresar texto como Sábado por la mañana y lo envía tal cual en scheduledDate. CreateOrderDto solo exige string; CreateOrderUseCase intenta new Date(value) y, si es inválida, guarda null.

**Impacto:** La solicitud puede responder con éxito perdiendo la fecha/hora que el usuario creyó comunicar en ese campo. No es necesariamente un 400: el backend actual descarta la fecha inválida.

**Corrección propuesta:** Elegir un contrato de fecha ISO con selector/validación o un campo separado de preferencia horaria en texto.

**Fuentes:** [src/features/orders/screens/QuoteRequestScreen.tsx:155](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/orders/screens/QuoteRequestScreen.tsx#L155); [src/presentation/di/modules/orders/dto/create-order.dto.ts:13](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/orders/dto/create-order.dto.ts#L13); [src/application/order/use-cases/create-order.usecase.ts:139](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/application/order/use-cases/create-order.usecase.ts#L139).

### C19 · Media · Siguiendo no consulta el feed ni consume el flag correcto

**Contrato:** `GET /reels y POST/DELETE /users/:id/follow`.

TopBar guarda siguiendo/parati únicamente en su estado local; useReelsFeed siempre llama a getReelsFeed(page,10) sin feed=following. El backend ya acepta ese filtro. Además, el feed devuelve isFollowing en la raíz de ReelDto pero la tarjeta inicializa reel.user.isFollowing.

**Impacto:** El tab no cambia los resultados de red y una persona ya seguida puede mostrarse como no seguida. Las rutas follow/unfollow sí existen y sus métodos son correctos.

**Corrección propuesta:** Conectar la selección al queryKey y al parámetro feed, y leer el flag del nivel correcto; sincronizar el cache al seguir/dejar de seguir.

**Fuentes:** [src/features/reels/screens/ReelsScreen.tsx:733](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/reels/screens/ReelsScreen.tsx#L733); [src/features/reels/screens/ReelsScreen.tsx:369](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/reels/screens/ReelsScreen.tsx#L369); [src/hooks/queries/useReelsQuery.ts:20](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/hooks/queries/useReelsQuery.ts#L20); [src/application/reel/use-cases/get-reels-feed.usecase.ts:68](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/application/reel/use-cases/get-reels-feed.usecase.ts#L68).

### C20 · Media · Las URLs firmadas de video no se detectan como video

**Contrato:** `POST /conversations/:id/media y GET /conversations/:id/messages`.

El backend clasifica videos como messageType=file y devuelve mediaUrl con firma en query string. ChatScreen detecta video con una expresión que exige .mp4/.mov/.avi/.webm al final de la URL completa.

**Impacto:** Una URL video.mp4?X-Amz-Signature=... no coincide; se renderiza como documento y no como video inline. Reproducción local confirmada con URL de firma de ejemplo.

**Corrección propuesta:** Usar metadata MIME/tipo explícita o analizar pathname de la URL sin query string.

**Fuentes:** [src/features/chat/screens/ChatScreen.tsx:235](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/chat/screens/ChatScreen.tsx#L235); [src/application/chat/use-cases/send-media.usecase.ts:58](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/application/chat/use-cases/send-media.usecase.ts#L58); [src/infrastructure/adapters/external/storage/s3-storage.service.ts:100](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/infrastructure/adapters/external/storage/s3-storage.service.ts#L100).

### C21 · Baja · El push de chat no incluye el identificador que usa la navegación

**Contrato:** `Payload NEW_MESSAGE / GET /notifications`.

El outbox guarda data:{conversationId}. getNotificationRoute requiere data.orderId para abrir /chat/[orderId] y deriva a la lista cuando falta. La app no debe usar directamente conversationId como si fuese orderId.

**Impacto:** Tocar un aviso abre la lista y no el hilo correspondiente. Es una degradación con fallback explícito, no un 404 actual de la ruta de chat.

**Corrección propuesta:** Incluir orderId en el aviso o resolver conversationId→orderId antes de navegar.

**Fuentes:** [src/features/notifications/utils/notificationRoute.ts:14](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/notifications/utils/notificationRoute.ts#L14); [src/infrastructure/persistence/prisma/repositories/chat/prisma-message.repository.ts:112](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/infrastructure/persistence/prisma/repositories/chat/prisma-message.repository.ts#L112).

### C22 · Baja · El cliente tipa images pero el upload devuelve imageUrls

**Contrato:** `POST /services/:id/images`.

uploadServiceImages declara Promise<{images:string[]}>. UploadServiceImagesUseCase retorna {imageUrls:string[]}. Las llamadas actuales de ServiceFormScreen esperan la finalización pero no leen el campo de respuesta.

**Impacto:** Hay una incompatibilidad real del contrato de tipos, hoy latente porque la respuesta no se utiliza para actualizar la lista. No se atribuye una caída actual a este nombre de campo.

**Corrección propuesta:** Unificar el nombre y agregar verificación de contrato antes de consumir el resultado.

**Fuentes:** [src/features/servicesUser/services/service.ts:67](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/servicesUser/services/service.ts#L67); [src/application/service/use-cases/upload-service-images.usecase.ts:61](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/application/service/use-cases/upload-service-images.usecase.ts#L61).

### C23 · Baja · Las respuestas de mutación de órdenes difieren del detalle

**Contrato:** `POST /orders y PATCH/POST de acciones de orden`.

El ensamblador de creación devuelve status mayúsculo y participantes anidados; varias mutaciones también exponen estados de dominio. GET /orders/:id normaliza a minúsculas e incluye clientId/providerId/serviceId. El cliente declara un único Order con esos IDs y estados minúsculos para todas las operaciones.

**Impacto:** La mayoría de acciones actuales ignoran la respuesta y refrescan el detalle, lo que limita el impacto inmediato. Es peligroso usar esas respuestas directamente para cache o lógica de rol/estado sin normalizarlas.

**Corrección propuesta:** Devolver un DTO uniforme o tipar por operación y convertir explícitamente las respuestas.

**Fuentes:** [src/features/orders/types/orders.types.ts:17](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/orders/types/orders.types.ts#L17); [src/application/order/queries/order.assembler.ts:14](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/application/order/queries/order.assembler.ts#L14); [src/application/order/use-cases/get-order.usecase.ts:37](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/application/order/use-cases/get-order.usecase.ts#L37).

### C24 · Media · El OpenAPI versionado en frontend contiene rutas fantasma y omite rutas reales

**Contrato:** `docs/backend-openapi.json y src/core/api/generated/schema.ts`.

El snapshot declara 95 pares método/ruta, frente a 90 en main: sobran 9 (7 de payments y POST/DELETE /subscriptions) y faltan 4 (POST /auth/google, GET /reels/me, PATCH /reels/:id y GET /services/:id). contracts:check regenera desde ese archivo local y comprueba su diff; no contrasta el contrato con main.

**Impacto:** CI puede estar verde con un contrato desactualizado. Los comentarios que afirman que /auth/google no existe son falsos para el backend auditado. Tampoco detecta los DTO manuales que se alejan de la API.

**Corrección propuesta:** Publicar/exportar el contrato del backend de la revisión desplegable y verificar compatibilidad con los consumidores, además de regenerar tipos.

**Fuentes:** [docs/backend-openapi.json:1](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/docs/backend-openapi.json#L1); [src/core/api/generated/schema.ts:544](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/core/api/generated/schema.ts#L544); [package.json:16](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/package.json#L16); [src/features/auth/services/auth.ts:29](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/auth/services/auth.ts#L29).

### C25 · Media · El cupo de servicios se calcula con una regla local distinta del servidor

**Contrato:** `GET /plans/my-plan no utilizado; POST /services`.

useAddServiceWithPlanLimit impide crear más de un servicio para FREE, infiriendo el plan desde propiedades del usuario. El backend usa maxServices de la tabla de planes y la capacidad está disponible en /plans/my-plan. El plan simulado localmente no cambia el planType del servidor.

**Impacto:** Si cambian los límites configurados, el cliente puede bloquear una operación válida o permitir el intento que el servidor rechazará. Con el límite FREE actual de uno no se acredita por sí solo un error visible; el desacople es del contrato/configuración.

**Corrección propuesta:** Consumir limits/maxServices/plan real y mantener el control atómico del backend como autoridad.

**Fuentes:** [src/features/servicesUser/hooks/useAddServiceWithPlanLimit.ts:32](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/servicesUser/hooks/useAddServiceWithPlanLimit.ts#L32); [src/application/plan/queries/dto/plan.dto.ts:31](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/application/plan/queries/dto/plan.dto.ts#L31); [src/infrastructure/persistence/prisma/repositories/service/prisma-service.repository.ts:180](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/infrastructure/persistence/prisma/repositories/service/prisma-service.repository.ts#L180).

### C26 · Media · El panel de antecedentes no puede poblar su cola

**Contrato:** `PATCH /admin/background-check/:userId existente; listado pendiente sin llamada`.

AdminBackgroundCheckScreen.load ejecuta setItems([]) porque falta un listado de pendientes. adminReview declara correctamente el PATCH, pero no hay items para invocarlo desde el panel. No se emite un GET inventado: solo aparece en un comentario como dependencia ausente.

**Impacto:** La administración puede verse vacía aunque haya solicitudes. La autorización ADMIN del PATCH sí está implementada; el problema aquí es el circuito de lectura pendiente.

**Corrección propuesta:** Acordar e implementar la consulta administrativa y sus datos/permisos, o no presentar una cola operativa.

**Fuentes:** [src/features/admin/screens/AdminBackgroundCheckScreen.tsx:145](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/admin/screens/AdminBackgroundCheckScreen.tsx#L145); [src/presentation/di/modules/admin/admin-background-check.controller.ts:17](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/admin/admin-background-check.controller.ts#L17).

## Endpoints sin consumidor activo identificado

Diez rutas no tienen llamada HTTP declarada en la app; otras seis tienen wrappers/hooks pero no se identificó una pantalla que los ejecute. Dos de las diez son infraestructura/integraciones externas y su ausencia en el frontend es correcta. La falta de referencias estáticas no prueba que una ruta sea prescindible para otros clientes.

| Ruta | Resultado |
|---|---|
| `GET /health` | Infraestructura: health check; no requiere pantalla. |
| `POST /identity/webhook` | Integración externa Didit; no debe llamarla la app. |
| `GET /plans/my-plan` | La app consulta un mock local (C11, C25). |
| `GET /subscriptions/history` | Historial local simulado (C11). |
| `DELETE /reviews/:id` | Sin llamada HTTP declarada. |
| `GET /search/services` | Sin llamada; la app usa GET /search. |
| `GET /search/providers` | Sin llamada; la app usa GET /search. |
| `GET /services/nearby` | Sin llamada HTTP declarada. |
| `GET /users/me/dashboard` | Sin llamada HTTP declarada. |
| `POST /users/me/become-provider` | Sin llamada HTTP declarada. |
| `GET /orders` | Wrapper fetchOrders sin consumidor identificado. |
| `GET /reviews/providers/:id/rating` | Wrapper fetchProviderRating sin consumidor identificado. |
| `GET /services/:id/posts` | Contexto/hooks de posts sin pantalla o provider montado identificado. |
| `POST /services/:id/posts` | Contexto/hooks de posts sin pantalla o provider montado identificado. |
| `POST /posts/:id/like` | Hook de posts sin consumidor identificado. |
| `POST /posts/:id/comments` | Contexto de posts sin montaje identificado. |

## Matriz completa del backend

Las rutas omiten el prefijo común `/api/v1`. “JWT” indica la protección global; no certifica por sí sola autorización sobre cada recurso. “Declarada” significa que existe una llamada en el código, no que todos sus recorridos sean alcanzables ni correctos. Para los desajustes de datos ver los hallazgos anteriores.

| Método y ruta | Acceso | Declaraciones frontend / observación | Controlador |
|---|---|---|---|
| `PATCH /admin/background-check/:userId` | JWT + ADMIN | [src/features/kyc/services/background-check.service.ts:32](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/kyc/services/background-check.service.ts#L32); panel vacío: C26 | [src/presentation/di/modules/admin/admin-background-check.controller.ts:17](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/admin/admin-background-check.controller.ts#L17) |
| `POST /auth/forgot-password` | Pública | [src/features/auth/services/auth.ts:45](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/auth/services/auth.ts#L45) | [src/presentation/di/modules/auth/auth.controller.ts:74](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/auth/auth.controller.ts#L74) |
| `POST /auth/google` | Pública | [src/features/auth/services/auth.ts:36](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/auth/services/auth.ts#L36) | [src/presentation/di/modules/auth/auth.controller.ts:42](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/auth/auth.controller.ts#L42) |
| `POST /auth/login` | Pública | [src/features/auth/services/auth.ts:12](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/auth/services/auth.ts#L12) | [src/presentation/di/modules/auth/auth.controller.ts:46](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/auth/auth.controller.ts#L46) |
| `POST /auth/logout` | Pública | [src/features/auth/state/AuthContext.tsx:269](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/auth/state/AuthContext.tsx#L269) | [src/presentation/di/modules/auth/auth.controller.ts:64](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/auth/auth.controller.ts#L64) |
| `POST /auth/refresh-token` | Pública | [src/core/api/axiosinstance.tsx:29](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/core/api/axiosinstance.tsx#L29) | [src/presentation/di/modules/auth/auth.controller.ts:58](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/auth/auth.controller.ts#L58) |
| `POST /auth/register` | Pública | [src/features/auth/services/auth.ts:19](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/auth/services/auth.ts#L19) | [src/presentation/di/modules/auth/auth.controller.ts:52](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/auth/auth.controller.ts#L52) |
| `POST /auth/reset-password` | Pública | [src/features/auth/services/auth.ts:49](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/auth/services/auth.ts#L49) | [src/presentation/di/modules/auth/auth.controller.ts:80](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/auth/auth.controller.ts#L80) |
| `POST /auth/verify-email` | Pública | [src/features/auth/services/auth.ts:24](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/auth/services/auth.ts#L24) | [src/presentation/di/modules/auth/auth.controller.ts:86](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/auth/auth.controller.ts#L86) |
| `GET /categories` | Pública | [src/features/servicesUser/services/catalog.ts:72](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/servicesUser/services/catalog.ts#L72) | [src/presentation/di/modules/posts/posts.controller.ts:30](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/posts/posts.controller.ts#L30) |
| `GET /conversations` | JWT | [src/features/chat/services/chat.service.ts:56](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/chat/services/chat.service.ts#L56) | [src/presentation/di/modules/chat/chat.controller.ts:51](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/chat/chat.controller.ts#L51) |
| `POST /conversations/:id/media` | JWT | [src/features/chat/services/chat.service.ts:98](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/chat/services/chat.service.ts#L98); [src/features/chat/services/chat.service.ts:109](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/chat/services/chat.service.ts#L109) | [src/presentation/di/modules/chat/chat.controller.ts:90](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/chat/chat.controller.ts#L90) |
| `GET /conversations/:id/messages` | JWT | [src/features/chat/services/chat.service.ts:72](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/chat/services/chat.service.ts#L72) | [src/presentation/di/modules/chat/chat.controller.ts:64](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/chat/chat.controller.ts#L64) |
| `POST /conversations/:id/messages` | JWT | [src/features/chat/services/chat.service.ts:80](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/chat/services/chat.service.ts#L80) | [src/presentation/di/modules/chat/chat.controller.ts:73](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/chat/chat.controller.ts#L73) |
| `PATCH /conversations/:id/read` | JWT | [src/features/chat/services/chat.service.ts:89](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/chat/services/chat.service.ts#L89) | [src/presentation/di/modules/chat/chat.controller.ts:82](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/chat/chat.controller.ts#L82) |
| `GET /conversations/:orderId` | JWT | [src/features/chat/services/chat.service.ts:62](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/chat/services/chat.service.ts#L62) | [src/presentation/di/modules/chat/chat.controller.ts:56](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/chat/chat.controller.ts#L56) |
| `GET /health` | Pública | Infraestructura: health check; no requiere pantalla. | [src/presentation/di/modules/health/health.controller.ts:23](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/health/health.controller.ts#L23) |
| `POST /identity/background-check` | JWT | [src/features/kyc/services/background-check.service.ts:15](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/kyc/services/background-check.service.ts#L15) | [src/presentation/di/modules/identity/identity.controller.ts:77](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/identity/identity.controller.ts#L77) |
| `GET /identity/background-check/status` | JWT | [src/features/kyc/services/background-check.service.ts:23](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/kyc/services/background-check.service.ts#L23) | [src/presentation/di/modules/identity/identity.controller.ts:72](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/identity/identity.controller.ts#L72) |
| `POST /identity/cancel` | JWT | [src/features/kyc/services/kyc.service.ts:32](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/kyc/services/kyc.service.ts#L32) | [src/presentation/di/modules/identity/identity.controller.ts:66](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/identity/identity.controller.ts#L66) |
| `POST /identity/retry` | JWT | [src/features/kyc/services/kyc.service.ts:27](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/kyc/services/kyc.service.ts#L27) | [src/presentation/di/modules/identity/identity.controller.ts:61](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/identity/identity.controller.ts#L61) |
| `POST /identity/start` | JWT | [src/features/kyc/services/kyc.service.ts:22](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/kyc/services/kyc.service.ts#L22) | [src/presentation/di/modules/identity/identity.controller.ts:51](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/identity/identity.controller.ts#L51) |
| `GET /identity/status` | JWT | [src/features/kyc/services/kyc.service.ts:13](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/kyc/services/kyc.service.ts#L13) | [src/presentation/di/modules/identity/identity.controller.ts:56](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/identity/identity.controller.ts#L56) |
| `POST /identity/webhook` | Pública | Integración externa Didit; no debe llamarla la app. | [src/presentation/di/modules/identity/identity.controller.ts:99](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/identity/identity.controller.ts#L99) |
| `DELETE /notifications` | JWT | [src/features/notifications/services/notifications.service.ts:62](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/notifications/services/notifications.service.ts#L62) | [src/presentation/di/modules/notifications/notifications.controller.ts:96](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/notifications/notifications.controller.ts#L96) |
| `GET /notifications` | JWT | [src/features/notifications/services/notifications.service.ts:28](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/notifications/services/notifications.service.ts#L28) | [src/presentation/di/modules/notifications/notifications.controller.ts:62](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/notifications/notifications.controller.ts#L62) |
| `DELETE /notifications/:id` | JWT | [src/features/notifications/services/notifications.service.ts:57](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/notifications/services/notifications.service.ts#L57) | [src/presentation/di/modules/notifications/notifications.controller.ts:88](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/notifications/notifications.controller.ts#L88) |
| `PATCH /notifications/:id/read` | JWT | [src/features/notifications/services/notifications.service.ts:42](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/notifications/services/notifications.service.ts#L42) | [src/presentation/di/modules/notifications/notifications.controller.ts:70](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/notifications/notifications.controller.ts#L70) |
| `PATCH /notifications/read-all` | JWT | [src/features/notifications/services/notifications.service.ts:52](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/notifications/services/notifications.service.ts#L52) | [src/presentation/di/modules/notifications/notifications.controller.ts:78](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/notifications/notifications.controller.ts#L78) |
| `DELETE /notifications/token` | JWT | [src/features/auth/state/AuthContext.tsx:268](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/auth/state/AuthContext.tsx#L268); [src/features/notifications/services/notifications.service.ts:67](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/notifications/services/notifications.service.ts#L67) | [src/presentation/di/modules/notifications/notifications.controller.ts:57](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/notifications/notifications.controller.ts#L57) |
| `POST /notifications/token` | JWT | [src/features/notifications/services/notifications.service.ts:47](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/notifications/services/notifications.service.ts#L47) | [src/presentation/di/modules/notifications/notifications.controller.ts:49](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/notifications/notifications.controller.ts#L49) |
| `GET /notifications/unread-count` | JWT | [src/features/notifications/services/notifications.service.ts:36](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/notifications/services/notifications.service.ts#L36) | [src/presentation/di/modules/notifications/notifications.controller.ts:83](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/notifications/notifications.controller.ts#L83) |
| `GET /orders` | JWT | Wrapper fetchOrders sin consumidor identificado. | [src/presentation/di/modules/orders/orders.controller.ts:66](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/orders/orders.controller.ts#L66) |
| `POST /orders` | JWT | [src/features/orders/services/orders.service.ts:48](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/orders/services/orders.service.ts#L48) | [src/presentation/di/modules/orders/orders.controller.ts:54](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/orders/orders.controller.ts#L54) |
| `GET /orders/:id` | JWT | [src/features/orders/services/orders.service.ts:42](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/orders/services/orders.service.ts#L42) | [src/presentation/di/modules/orders/orders.controller.ts:98](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/orders/orders.controller.ts#L98) |
| `PATCH /orders/:id/accept` | JWT | [src/features/orders/services/orders.service.ts:54](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/orders/services/orders.service.ts#L54) | [src/presentation/di/modules/orders/orders.controller.ts:106](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/orders/orders.controller.ts#L106) |
| `PATCH /orders/:id/cancel` | JWT | [src/features/orders/services/orders.service.ts:78](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/orders/services/orders.service.ts#L78) | [src/presentation/di/modules/orders/orders.controller.ts:139](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/orders/orders.controller.ts#L139) |
| `PATCH /orders/:id/complete` | JWT | [src/features/orders/services/orders.service.ts:72](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/orders/services/orders.service.ts#L72) | [src/presentation/di/modules/orders/orders.controller.ts:131](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/orders/orders.controller.ts#L131) |
| `POST /orders/:id/dispute` | JWT | [src/features/orders/services/orders.service.ts:84](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/orders/services/orders.service.ts#L84) | [src/presentation/di/modules/orders/orders.controller.ts:148](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/orders/orders.controller.ts#L148) |
| `PATCH /orders/:id/reject` | JWT | [src/features/orders/services/orders.service.ts:60](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/orders/services/orders.service.ts#L60) | [src/presentation/di/modules/orders/orders.controller.ts:114](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/orders/orders.controller.ts#L114) |
| `PATCH /orders/:id/start` | JWT | [src/features/orders/services/orders.service.ts:66](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/orders/services/orders.service.ts#L66) | [src/presentation/di/modules/orders/orders.controller.ts:123](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/orders/orders.controller.ts#L123) |
| `GET /orders/client` | JWT | [src/features/orders/services/orders.service.ts:30](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/orders/services/orders.service.ts#L30) | [src/presentation/di/modules/orders/orders.controller.ts:82](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/orders/orders.controller.ts#L82) |
| `GET /orders/provider` | JWT | [src/features/orders/services/orders.service.ts:36](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/orders/services/orders.service.ts#L36) | [src/presentation/di/modules/orders/orders.controller.ts:90](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/orders/orders.controller.ts#L90) |
| `GET /plans` | JWT | [src/features/plans/services/plan.service.ts:57](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/plans/services/plan.service.ts#L57) | [src/presentation/di/modules/plans/plans.controller.ts:26](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/plans/plans.controller.ts#L26) |
| `GET /plans/my-plan` | JWT | La app consulta un mock local (C11, C25). | [src/presentation/di/modules/plans/plans.controller.ts:31](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/plans/plans.controller.ts#L31) |
| `POST /posts/:id/comments` | JWT | Contexto de posts sin montaje identificado. | [src/presentation/di/modules/posts/posts.controller.ts:58](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/posts/posts.controller.ts#L58) |
| `POST /posts/:id/like` | JWT | Hook de posts sin consumidor identificado. | [src/presentation/di/modules/posts/posts.controller.ts:50](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/posts/posts.controller.ts#L50) |
| `GET /reels` | JWT | [src/features/reels/services/reels.service.ts:55](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/reels/services/reels.service.ts#L55) | [src/presentation/di/modules/reels/reels.controller.ts:56](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/reels/reels.controller.ts#L56) |
| `POST /reels` | JWT | [src/features/reels/services/reels.service.ts:73](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/reels/services/reels.service.ts#L73) | [src/presentation/di/modules/reels/reels.controller.ts:83](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/reels/reels.controller.ts#L83) |
| `DELETE /reels/:id` | JWT | [src/features/reels/services/reels.service.ts:79](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/reels/services/reels.service.ts#L79) | [src/presentation/di/modules/reels/reels.controller.ts:92](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/reels/reels.controller.ts#L92) |
| `PATCH /reels/:id` | JWT | [src/features/reels/services/reels.service.ts:67](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/reels/services/reels.service.ts#L67) | [src/presentation/di/modules/reels/reels.controller.ts:77](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/reels/reels.controller.ts#L77) |
| `GET /reels/:id/comments` | JWT | [src/features/reels/services/reels.service.ts:96](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/reels/services/reels.service.ts#L96) | [src/presentation/di/modules/reels/reels.controller.ts:111](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/reels/reels.controller.ts#L111) |
| `POST /reels/:id/comments` | JWT | [src/features/reels/services/reels.service.ts:107](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/reels/services/reels.service.ts#L107) | [src/presentation/di/modules/reels/reels.controller.ts:124](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/reels/reels.controller.ts#L124) |
| `DELETE /reels/:id/comments/:commentId` | JWT | [src/features/reels/services/reels.service.ts:116](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/reels/services/reels.service.ts#L116) | [src/presentation/di/modules/reels/reels.controller.ts:134](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/reels/reels.controller.ts#L134) |
| `POST /reels/:id/like` | JWT | [src/features/reels/services/reels.service.ts:86](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/reels/services/reels.service.ts#L86) | [src/presentation/di/modules/reels/reels.controller.ts:102](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/reels/reels.controller.ts#L102) |
| `POST /reels/:id/report` | JWT | [src/features/reels/services/reels.service.ts:130](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/reels/services/reels.service.ts#L130) | [src/presentation/di/modules/reels/reels.controller.ts:144](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/reels/reels.controller.ts#L144) |
| `GET /reels/me` | JWT | [src/features/reels/services/reels.service.ts:61](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/reels/services/reels.service.ts#L61) | [src/presentation/di/modules/reels/reels.controller.ts:72](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/reels/reels.controller.ts#L72) |
| `POST /reviews` | JWT | [src/features/reviews/services/review.service.ts:28](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/reviews/services/review.service.ts#L28) | [src/presentation/di/modules/reviews/reviews.controller.ts:44](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/reviews/reviews.controller.ts#L44) |
| `DELETE /reviews/:id` | JWT | Sin llamada HTTP declarada. | [src/presentation/di/modules/reviews/reviews.controller.ts:52](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/reviews/reviews.controller.ts#L52) |
| `POST /reviews/:id/reply` | JWT | [src/features/reviews/services/review.service.ts:34](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/reviews/services/review.service.ts#L34) | [src/presentation/di/modules/reviews/reviews.controller.ts:68](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/reviews/reviews.controller.ts#L68) |
| `POST /reviews/:id/report` | JWT | [src/features/reviews/services/review.service.ts:43](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/reviews/services/review.service.ts#L43) | [src/presentation/di/modules/reviews/reviews.controller.ts:60](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/reviews/reviews.controller.ts#L60) |
| `GET /reviews/providers/:id/rating` | Pública | Wrapper fetchProviderRating sin consumidor identificado. | [src/presentation/di/modules/reviews/reviews.controller.ts:87](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/reviews/reviews.controller.ts#L87) |
| `GET /reviews/providers/:id/reviews` | Pública | [src/features/servicesUser/screens/ProviderProfileScreen.tsx:152](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/servicesUser/screens/ProviderProfileScreen.tsx#L152); [src/features/servicesUser/services/catalog.ts:112](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/servicesUser/services/catalog.ts#L112); [src/features/servicesUser/services/reviews.ts:27](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/servicesUser/services/reviews.ts#L27) | [src/presentation/di/modules/reviews/reviews.controller.ts:78](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/reviews/reviews.controller.ts#L78) |
| `GET /search` | Pública | [src/features/search/services/search.service.ts:6](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/search/services/search.service.ts#L6) | [src/presentation/di/modules/search/search.controller.ts:20](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/search/search.controller.ts#L20) |
| `GET /search/providers` | Pública | Sin llamada; la app usa GET /search. | [src/presentation/di/modules/search/search.controller.ts:44](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/search/search.controller.ts#L44) |
| `GET /search/services` | Pública | Sin llamada; la app usa GET /search. | [src/presentation/di/modules/search/search.controller.ts:30](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/search/search.controller.ts#L30) |
| `GET /services` | Pública | [src/features/servicesUser/screens/ProviderProfileScreen.tsx:151](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/servicesUser/screens/ProviderProfileScreen.tsx#L151); [src/features/servicesUser/services/catalog.ts:82](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/servicesUser/services/catalog.ts#L82); [src/features/servicesUser/services/services.ts:29](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/servicesUser/services/services.ts#L29) | [src/presentation/di/modules/services/services.controller.ts:96](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/services/services.controller.ts#L96) |
| `POST /services` | JWT | [src/features/servicesUser/services/service.ts:47](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/servicesUser/services/service.ts#L47) | [src/presentation/di/modules/services/services.controller.ts:57](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/services/services.controller.ts#L57) |
| `DELETE /services/:id` | JWT | [src/features/servicesUser/services/service.ts:60](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/servicesUser/services/service.ts#L60) | [src/presentation/di/modules/services/services.controller.ts:87](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/services/services.controller.ts#L87) |
| `GET /services/:id` | Pública | [src/features/servicesUser/services/services.ts:41](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/servicesUser/services/services.ts#L41) | [src/presentation/di/modules/services/services.controller.ts:142](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/services/services.controller.ts#L142) |
| `PATCH /services/:id` | JWT | [src/features/servicesUser/services/service.ts:55](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/servicesUser/services/service.ts#L55) | [src/presentation/di/modules/services/services.controller.ts:73](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/services/services.controller.ts#L73) |
| `POST /services/:id/images` | JWT | [src/features/servicesUser/services/service.ts:77](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/servicesUser/services/service.ts#L77) | [src/presentation/di/modules/services/services.controller.ts:147](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/services/services.controller.ts#L147) |
| `GET /services/:id/posts` | Pública | Contexto/hooks de posts sin pantalla o provider montado identificado. | [src/presentation/di/modules/posts/posts.controller.ts:36](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/posts/posts.controller.ts#L36) |
| `POST /services/:id/posts` | JWT | Contexto/hooks de posts sin pantalla o provider montado identificado. | [src/presentation/di/modules/posts/posts.controller.ts:41](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/posts/posts.controller.ts#L41) |
| `GET /services/featured` | Pública | [src/features/servicesUser/services/services.ts:51](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/servicesUser/services/services.ts#L51) | [src/presentation/di/modules/services/services.controller.ts:121](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/services/services.controller.ts#L121) |
| `GET /services/me` | JWT | [src/features/servicesUser/services/service.ts:41](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/servicesUser/services/service.ts#L41) | [src/presentation/di/modules/services/services.controller.ts:107](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/services/services.controller.ts#L107) |
| `GET /services/nearby` | Pública | Sin llamada HTTP declarada. | [src/presentation/di/modules/services/services.controller.ts:127](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/services/services.controller.ts#L127) |
| `GET /subscriptions/history` | JWT | Historial local simulado (C11). | [src/presentation/di/modules/plans/plans.controller.ts:36](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/plans/plans.controller.ts#L36) |
| `DELETE /users/:id/follow` | JWT | [src/features/users/services/users.ts:28](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/users/services/users.ts#L28) | [src/presentation/di/modules/users/users.controller.ts:154](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/users/users.controller.ts#L154) |
| `POST /users/:id/follow` | JWT | [src/features/users/services/users.ts:23](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/users/services/users.ts#L23) | [src/presentation/di/modules/users/users.controller.ts:145](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/users/users.controller.ts#L145) |
| `GET /users/:id/public` | JWT | [src/features/servicesUser/screens/ProviderProfileScreen.tsx:150](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/servicesUser/screens/ProviderProfileScreen.tsx#L150); [src/features/servicesUser/services/catalog.ts:90](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/servicesUser/services/catalog.ts#L90); [src/features/users/services/users.ts:17](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/users/services/users.ts#L17) | [src/presentation/di/modules/users/users.controller.ts:140](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/users/users.controller.ts#L140) |
| `DELETE /users/me` | JWT | [src/features/profile/services/profile.ts:112](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/profile/services/profile.ts#L112) | [src/presentation/di/modules/users/users.controller.ts:113](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/users/users.controller.ts#L113) |
| `GET /users/me` | JWT | [src/features/auth/state/AuthContext.tsx:125](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/auth/state/AuthContext.tsx#L125); [src/features/profile/services/profile.ts:32](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/profile/services/profile.ts#L32) | [src/presentation/di/modules/users/users.controller.ts:69](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/users/users.controller.ts#L69) |
| `PATCH /users/me` | JWT | [src/features/profile/services/profile.ts:40](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/profile/services/profile.ts#L40); [src/features/profile/services/profile.ts:45](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/profile/services/profile.ts#L45) | [src/presentation/di/modules/users/users.controller.ts:74](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/users/users.controller.ts#L74) |
| `POST /users/me/avatar` | JWT | [src/features/profile/services/profile.ts:54](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/profile/services/profile.ts#L54) | [src/presentation/di/modules/users/users.controller.ts:82](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/users/users.controller.ts#L82) |
| `POST /users/me/become-provider` | JWT | Sin llamada HTTP declarada. | [src/presentation/di/modules/users/users.controller.ts:129](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/users/users.controller.ts#L129) |
| `GET /users/me/dashboard` | JWT | Sin llamada HTTP declarada. | [src/presentation/di/modules/users/users.controller.ts:108](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/users/users.controller.ts#L108) |
| `PATCH /users/me/password` | JWT | [src/features/auth/services/auth.ts:41](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/auth/services/auth.ts#L41) | [src/presentation/di/modules/users/users.controller.ts:118](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/users/users.controller.ts#L118) |
| `GET /users/me/stats` | JWT | [src/features/profile/services/profile.ts:95](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/profile/services/profile.ts#L95) | [src/presentation/di/modules/users/users.controller.ts:103](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/users/users.controller.ts#L103) |
| `POST /users/me/verify-phone` | JWT | [src/features/profile/services/profile.ts:100](https://github.com/BoskoMarket/frontend-bosko/blob/92335531d4e4868a566048ba4efe1a4e4028f53d/src/features/profile/services/profile.ts#L100) | [src/presentation/di/modules/users/users.controller.ts:134](https://github.com/GallosoGonzalo/bosko-backend/blob/989e9af33b7929662b77feb7683296330565f80b/src/presentation/di/modules/users/users.controller.ts#L134) |

## Documentación y simulaciones que no son tráfico HTTP

El OpenAPI guardado en el frontend contiene 95 operaciones frente a las 90 del backend auditado. Sobran nueve y faltan cuatro. `contracts:check` compara los tipos generados con ese mismo snapshot local, de modo que puede pasar aunque el servidor haya cambiado (C24).

| En el snapshot, ausentes del backend | En el backend, ausentes del snapshot |
|---|---|
| `POST /payments/initiate` | `POST /auth/google` |
| `POST /payments/webhook` | `GET /reels/me` |
| `POST /payments/release/:orderId` | `PATCH /reels/:id` |
| `POST /payments/refund/:orderId` | `GET /services/:id` |
| `GET /payments/order/:orderId` | — |
| `GET /payments/history` | — |
| `GET /payments/providers/me/earnings` | — |
| `POST /subscriptions` | — |
| `DELETE /subscriptions` | — |

Los servicios actuales de pagos/suscripciones ejecutan mocks de AsyncStorage. Los comentarios `/payments/*` y POST/DELETE `/subscriptions` no se contaron como llamadas HTTP emitidas ni se observó un cobro. El reenvío de OTP y el listado administrativo pendiente tampoco emiten las rutas que mencionan en comentarios. `/auth/google` sí existe en main, pese a comentarios obsoletos del frontend.

## Comprobaciones y límites

| Verificación de solo lectura | Resultado |
|---|---|
| GET producción `/categories` | 200; seis categorías |
| GET producción `/services?categoryId=<UUID válido>&page=1&limit=10` | 200; respuesta paginada con proveedor anidado |
| GET producción `/services/featured` | 200; nueve elementos, `provider.id`, sin `providerId` plano |
| GET producción `/search?q=plomer` | 200; dos servicios con proveedor anidado |
| GET producción `/app/config` | 404 NOT_FOUND |

Seis reproducciones locales ejecutaron funciones/expresiones del frontend con respuestas de contrato y transporte simulado; no enviaron escrituras a la API:

- **Destacados:** La navegación envía service-a; el proveedor real es provider-a.

- **Búsqueda:** Con ServiceDto la navegación usa id vacío, aunque provider.id existe.

- **Categoría:** El mapeo de servicios por categoría sí transforma provider.id correctamente.

- **Planes:** PlanDto no incluye features: features.map lanza TypeError.

- **Notificación de chat:** El payload actual con conversationId abre la lista, no el hilo.

- **Video de chat:** La URL firmada no se reconoce como video con la expresión actual.

En multipart coinciden actualmente `avatar`, `images` (máximo cinco), `file` de antecedentes y `file` de chat. La URL de Socket.IO elimina `/api/v1` para usar el host, compatible con la configuración del servidor. El contrato contempla entrada/salida de conversaciones, envío, lectura y escritura; `messages_delivered` se emite desde el servidor sin un listener de actualización identificado en el frontend, por lo que los recibos de entrega no tienen una actualización dedicada. La lectura sí cuenta con REST/eventos. No se detectó un desajuste demostrado de URL del socket.

Esta es una auditoría completa del inventario estático de estas revisiones y de sus consumidores identificados. No es una certificación de seguridad ni una prueba de todos los estados en ejecución: no se iniciaron sesiones ni se ejecutaron altas, pagos, bajas, uploads, reportes o cambios de estado en producción. Las rutas inexistentes se determinaron desde controladores; no se probaron con POST/DELETE. Las seis reproducciones usan fixtures y no equivalen a pruebas E2E de la app instalada. No se inspeccionaron secretos privados del despliegue ni clientes externos. La accesibilidad de pantallas se estimó por imports y referencias y se revisaron wrappers sin uso; no sustituye telemetría.

## Orden propuesto de corrección

1. Corregir adaptadores y navegación de destacados/búsqueda, y el modelo de planes (C01, C02, C05).
2. Acordar e implementar la baja de cuenta y recuperación de OTP (C04, C06).
3. Resolver capacidades expuestas sin endpoint: reels, portada, denuncias y configuración remota (C03, C07, C08, C10).
4. Alinear paginación, reseñas, cierre de chat y edición de servicios (C09, C12–C20).
5. Resolver el estado de las simulaciones de pagos/planes, actualizar OpenAPI y conectar controles reales de cupos y administración (C11, C24–C26).
6. Ajustar notificaciones y tipos de respuestas latentes (C21–C23).

No se aplicó ninguna de estas correcciones. El informe permite revisarlas antes de autorizar cambios.
