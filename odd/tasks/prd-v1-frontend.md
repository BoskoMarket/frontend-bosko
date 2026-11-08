# PRD v1 — tareas de frontend

Fuente: `docs/PRD.md`. El lado backend está en `docs/backend-prd-v1-contracts.md` (tareas `B1`–`B13`); aquí se referencia como `B#`.

Estado (2026-11-08): **F1 a F15 implementadas en la rama `feat/prd-v1`**; F16 parcial (documentación hecha; falta regenerar el OpenAPI cuando exista B13). Un solo escritor, un commit por tarea (Conventional Commits). Verificado con `tsc`, `eslint`, `lint:ds` y jest (los tests mockean la API: **nada se probó contra un backend real**, porque `B1`–`B13` no están construidas).

> **Orden de merge:** esta rama usa los contratos de `docs/backend-prd-v1-contracts.md`. Contra el backend actual, registrarse (`cityId` y términos), cerrar una orden (`/mark-done`, `/confirm`) y los favoritos de cuenta fallarían. Hay que desplegar el backend antes de mergear, o probar contra uno local.

| Tarea | Estado | Commit | Depende de |
|---|---|---|---|
| F1 Pagos y planes fuera de v1 | ✅ | `2f77ac4` | — |
| F2 Español neutro | ✅ | `47fa203` | — |
| F3 Formulario de servicio y precio | ✅ | `fe03bd2`, `e89b4a9` | B9 (reemplazar foto principal) |
| F4 Soporte por WhatsApp | ✅ | `35ca3e1` | B12 (número) |
| F5 Ciudad y registro | ✅ | `4d164e3` | B1, B2 |
| F6 Verificación del proveedor | ✅ | `db9ce09` | B10, B12 |
| F7 Ciclo de la orden | ✅ | `438ea68` | B3, B4 |
| F8 Disputas y soporte | ✅ | `10c097f` | B3, B7 |
| F9 Cuenta suspendida | ✅ | `10c097f` | B7 |
| F10 Bloqueo y denuncia en el chat | ✅ | `c65a932` | B6 |
| F11 Favoritos en la cuenta | ✅ | `c942e6d` | B8 |
| F12 Notificaciones nuevas | ✅ | `da0790b` | B4 |
| F13 Trabajos acotado a v1 | ✅ | `da0790b` | B5, B9 |
| F14 Errores de red y reintento | ✅ (`runWithRetry`; sin `ErrorState` porque ninguna pantalla mostraba un error pelado) | ver `git log` | — |
| F15 Copy de baja de cuenta | ✅ | ver `git log` | — |
| F16 Contratos y documentación | parcial: docs hechas; falta regenerar OpenAPI | — | B13 |

Desvíos respecto del plan original:
- `formatMoney` no se creó: `formatServicePrice` (design system) cubre el formato de precios con el código de moneda.
- No existe `KYCDocumentScreen`: `allowedDocumentTypes` se aplica en `KYCIntroScreen`.
- La fila «Usuarios bloqueados» está en las dos secciones de Perfil existentes (no hay sección de seguridad).
- El proveedor no puede abrir una disputa desde `awaiting_confirmation` (decisión abierta).
- Los favoritos locales anteriores no se migran: mencionarlo en las notas de la versión.
- El paso «Tu servicio» de la lista de BecomeProvider nunca se marca como hecho (la app no sabe si ya existe).

## Reglas de arquitectura (válidas para toda tarea)

- **Rutas** (`app/`) solo montan una pantalla de `src/features/<x>/screens`. Nada de lógica en `app/`.
- **Datos del servidor** → TanStack Query: servicio en `src/features/<x>/services`, hook en `src/hooks/queries` (consultas) o `src/hooks/mutations` (escrituras), claves en `src/core/query/queryKeys.ts`. Las mutaciones llevan el patrón optimista ya usado en órdenes (`onMutate` / `onError` / `onSettled`).
- **Estado de UI** → Zustand, solo si no hay una query que lo cubra. **Un store nuevo se discute antes de crearlo** (regla de CLAUDE.md). Este plan no crea ninguno.
- **Sesión** → solo `AuthContext`.
- **Diseño** → nada hardcodeado fuera de `src/core/design-system/`: tokens (`tc.*`, `TOKENS`, `SPACING`, `TYPE_SCALE`), componentes del DS (`Button`, `Text`, `Card`, `BottomSheet`, `ReasonDialog`, `EmptyState`, `ListRow`…). Si falta un componente, **se agrega primero al DS** y se exporta en el barrel.
- **Pantallas** siguen el tema claro/oscuro (`useThemeColors()`).
- **Textos** en español neutro (ver F2), nunca el nombre de la marca a mano (`BRAND_NAME`).
- Cada tarea cierra con: `tsc --noEmit`, `npm run lint`, `npm run lint:ds` en 0, y tests de la lógica nueva.
- Heurística de tamaño: unas 400 líneas de código nuevo por tarea. No es un tope.

## Resumen y orden

| Fase | Tareas | Depende de backend |
|---|---|---|
| A · Solo frontend | F1, F2, F3, F4 | No (F4 muestra el botón de soporte solo si `/app/config` trae el número) |
| B · Con backend | F5 a F13 | Sí, cada una indica su `B#` |
| C · Cierre | F14, F15, F16 | Parcial |

Las tareas de la fase A se pueden empezar ya y no dependen de nadie.

---

## Fase A · Solo frontend

### F1 · Sacar pagos y planes de v1
- **Qué:** ocultar checkout, pago exitoso, métodos de pago, historial de pagos y planes. El código se conserva (igual que Reels).
- **Dónde:**
  - `src/core/config/features.ts`: agregar `payments: false` (y `plans: false`) junto a `reels`.
  - Rutas `app/orders/checkout.tsx`, `app/orders/payment-success.tsx`, `app/(tabs)/profile/plans.tsx` y la de Pagos: redirigen a `/(tabs)` o a la lista de órdenes cuando el flag es `false`, igual que `reels`.
  - `src/features/profile/utils/profileSections.ts`: quitar la fila `plan` y la de Pagos detrás del flag.
  - `OrderDetailScreen` y `OrdersListScreen`: quitar el botón «Pagar», el estado de pago (`PaymentStatus`) y cualquier texto de cobro.
  - `QuoteRequestScreen`: aclarar que el pago se acuerda directamente con el proveedor (aviso `NoticeBanner` de tipo `info`).
- **Tests:** `profileSections.test.ts` actualizado; test de redirección de las rutas con el flag en `false`; que no quede un botón «Pagar» renderizado.
- **Docs:** CLAUDE.md (sección de rutas y flags).

### F2 · Español neutro
- **Qué:** reescribir los textos con voseo («Podés», «Mejorá», «Iniciá», «Contactá», «Editá», «Tenés», «Querés»…) a un español neutro con «tú» implícito o forma impersonal. No hay voseo regional ni modismos.
- **Dónde:** barrido por feature, en este orden: `src/lib/error-messages.ts` y `src/lib/errors.ts` (mensajes compartidos) → `auth` → `orders` → `servicesUser` → `chat` → `works` → `profile` → `kyc` → `notifications` → `reports`.
- **Control:** un test `__tests__/neutralCopy.test.ts` que falla si encuentra formas de voseo en `src/` y `app/` (al estilo del test que ya prohíbe literales de diseño). Así el copy nuevo no vuelve a traer voseo.
- **Nota:** es un cambio transversal. Se hace en commits por feature y no mezclado con otra tarea.

### F3 · Formulario de servicio y precio
- **Qué:** foto principal **obligatoria**; precio opcional presentado como «Desde $X» o «A cotizar».
- **Dónde:**
  - `src/features/servicesUser/utils/serviceFormRules.ts` (y su test): la foto deja de ser opcional al crear. En edición basta con que el servicio ya tenga una.
  - `ServiceFormScreen`: la sección «Foto principal» marca el campo como requerido y muestra el error antes de enviar.
  - Función `formatServicePrice(price, currency)` en `src/features/servicesUser/utils/price.ts`, usada por `ServiceCard` (DS), `ProviderProfileScreen`, `SearchPage` y el detalle de Trabajos. Si no hay monto: «A cotizar». Muestra el código de moneda para no confundir ARS con COP.
  - Un solo servicio por proveedor: `MyServiceScreen` (`profile/Services`) muestra el servicio propio con «Editar» y oculta «Publicar servicio» cuando ya existe. Se quita la fila `publish-service` de `profileSections.ts` para quien ya tiene uno.
- **Depende de:** B9 para reemplazar la foto principal (campo `main=true`). Hasta entonces agrega como hoy.
- **Tests:** reglas del formulario, formato de precio, un proveedor con servicio no ve «Publicar».

### F4 · Contacto con soporte (WhatsApp)
- **Qué:** botón reutilizable que abre WhatsApp con el soporte.
- **Dónde:**
  - `src/features/appConfig/services/appConfig.service.ts` y el tipo `AppConfig`: agregar `supportWhatsapp?: string` y `supportMessage?: string`.
  - `src/features/appConfig/components/SupportContactButton.tsx`: usa `Button` del DS y `Linking.openURL('https://wa.me/<número>?text=<mensaje>')`. Si no hay número, no se renderiza.
  - Usado en: `KYCRejectedScreen` y `KYCStatusScreen` (intentos agotados), el detalle de orden en `disputed`, la pantalla de cuenta suspendida (F9) y una fila «Soporte» en Perfil (`profileSections.ts`, sección común a ambos roles).
- **Depende de:** B12 para tener el número. No se hardcodea nada.
- **Tests:** el botón no aparece sin número; la URL se arma bien y se codifica el texto.

---

## Fase B · Con backend

### F5 · Ciudad y registro
- **Depende de:** B1, B2.
- **Qué:** elegir ciudad y aceptar términos al registrarse; mostrar precios en la moneda de la ciudad.
- **Pantallas y componentes**
  - `RegisterView` (`src/features/auth/screens`): paso nuevo «Tu ciudad» con la lista de `GET /cities` y un checkbox «Acepto los términos y la política de privacidad» con enlace a `/terms`. El registro envía `cityId`, `acceptedTerms` y `termsVersion`.
  - `CityPicker` en `src/features/auth/components/CityPicker.tsx`, hecho con `Chip` y `BottomSheet` del DS.
  - `app/auth/select-city.tsx` (nueva) → `src/features/auth/screens/SelectCityScreen.tsx`: para usuarios de Google nuevos sin ciudad. `app/index.tsx` redirige aquí si `user.city` es nulo.
- **Datos:** `src/features/markets/` (módulo nuevo y chico): `services/cities.service.ts`, `types.ts`, `utils/money.ts` con `formatMoney(amount, currency)`. Hook `src/hooks/queries/useCitiesQuery.ts`. Clave `QUERY_KEYS.cities` en `queryKeys.ts`. La ciudad del usuario viaja en el perfil (`useProfileQuery`), sin store nuevo.
- **Perfil:** `EditProfileScreen` muestra la ciudad como dato de solo lectura con la nota «Para cambiarla, contacta a soporte».
- **Teléfono:** `VerifyPhoneScreen` muestra el prefijo según la ciudad (`+54` o `+57`) y explica el error `PHONE_COUNTRY_MISMATCH`.
- **Términos:** constante `TERMS_VERSION` en `src/core/config/` (junto a `features.ts`); `TermsAndConditionsScreen` incluye la política de privacidad. Documento único para ambos países (decisión del PRD).
- **Errores:** `CITY_NOT_FOUND`, `CITY_REQUIRED`, `TERMS_NOT_ACCEPTED`, `CITY_MISMATCH` en `src/lib/error-messages.ts`.
- **Tests:** el registro no avanza sin ciudad ni términos; usuario Google sin ciudad es redirigido; formato de moneda ARS y COP.

### F6 · Verificación del proveedor (KYC y teléfono)
- **Depende de:** B10, B12.
- **Qué:** un recorrido claro: KYC → teléfono → publicar. Mensajes distintos por estado.
- **Pantallas y componentes**
  - `BecomeProviderScreen` pasa a mostrar una lista de pasos (`StepTimeline` del DS): 1 Identidad, 2 Teléfono, 3 Tu servicio, cada uno con su estado.
  - `src/hooks/useProviderStatus.ts`: agregar `phoneVerified` y `canPublish` (KYC aprobado y teléfono verificado). `useRequireProviderStatus` bloquea `ServiceFormScreen` si falta algo y redirige al paso pendiente.
  - `KYCDocumentScreen`: los tipos de documento salen de `allowedDocumentTypes` de `GET /identity/status` (B10), no de una lista fija.
  - `KYCStatusScreen` / `KYCRejectedScreen`: copy propio para `failed` y `expired` («Hubo un problema técnico, no se descontó ningún intento»), distinto de `rejected` y `declined` (muestran el motivo). Con intentos agotados: `SupportContactButton` (F4).
- **Los antecedentes** pasan a ser una insignia opcional: `BackgroundCheckScreen` deja de presentarse como requisito y `ProviderProfileScreen` muestra la insignia si está aprobado.
- **Tests:** `canPublish` en cada combinación; cada estado del KYC muestra su copy; el gate redirige.

### F7 · Ciclo de la orden
- **Depende de:** B3, B4.
- **Qué:** reflejar `awaiting_confirmation`, vencimiento de 48 h, cierre automático de 3 días y cancelación solo hasta el inicio.
- **Datos**
  - `orders.types.ts`: `OrderStatus` agrega `'awaiting_confirmation'`; el tipo `Order` agrega `expiresAt`, `doneAt`, `autoCloseAt`, `closedBy`, `cancelledBy`. `normalizeOrder` los mapea.
  - `orders.service.ts`: `markOrderDone(id)` (`PATCH /orders/:id/mark-done`) y `confirmOrder(id)` (`PATCH /orders/:id/confirm`); se retira el uso de `/complete`.
  - `useOrdersQuery.ts`: mutaciones `useMarkOrderDone` y `useConfirmOrder` con el patrón optimista y reversión.
  - `src/features/orders/constants/orderStatus.ts`: etiqueta, tono e icono de `awaiting_confirmation` («Esperando confirmación»).
- **Pantallas:** todo en `OrderDetailScreen`, que ya concentra las acciones por rol.

| Estado | Cliente ve | Proveedor ve |
|---|---|---|
| `pending` | «Esperando respuesta. Vence el {fecha}» + Cancelar | Aceptar / Rechazar + «Responde antes de {fecha}» |
| `accepted` | Cancelar | Iniciar / Cancelar |
| `in_progress` | Abrir disputa (sin Cancelar) | **Marcar como terminado** / Abrir disputa |
| `awaiting_confirmation` | **Confirmar trabajo** / Reportar un problema (disputa) + «Se cierra solo el {fecha}» | «Esperando la confirmación del cliente» |
| `completed` | **Calificar** si aún no calificó | Reseña recibida / Responder |
| `cancelled` por `system` | «Cancelada por falta de respuesta del proveedor» + «Cotizar a otro proveedor» | Aviso de que venció |

  - Cancelar y rechazar abren `ReasonDialog` (DS) con el motivo obligatorio de 5 a 500 caracteres.
  - `OrdersListScreen`: chip de estado nuevo y, para el cliente, indicador de órdenes por confirmar (como el contador de pendientes del proveedor).
  - `chatOrderRules.ts`: `awaiting_confirmation` permite escribir.
- **Tests:** matriz estado × rol de acciones visibles; cuenta regresiva y fechas; cancelación del sistema; reversión optimista.

### F8 · Disputas y soporte
- **Depende de:** B3, B7, F4.
- **Qué:** que la disputa tenga un siguiente paso visible.
- **Dónde:** `OrderDetailScreen` en estado `disputed`: bloque con «Soporte revisará el caso. Te contactaremos por WhatsApp» y `SupportContactButton` con mensaje prellenado con el id de la orden. `orders.service.ts` ya tiene `disputeOrder`; el motivo pasa por `ReasonDialog`. Resultado de soporte: la orden pasa a `completed` o `cancelled` y llega la notificación (F12).
- **Tests:** el botón aparece solo en `disputed`; el mensaje incluye el id.

### F9 · Cuenta suspendida
- **Depende de:** B7, F4.
- **Qué:** pantalla de suspensión total.
- **Dónde**
  - `app/suspended.tsx` (raíz del stack) → `src/features/auth/screens/SuspendedAccountScreen.tsx`, sobre `AuthBackdrop` del DS, con `SupportContactButton`.
  - `src/core/api/axiosinstance.tsx`: ante 403 `ACCOUNT_SUSPENDED`, usar el callback de logout forzado (`tokenStorage.setForceLogoutCallback`) con motivo `suspended`. `AuthContext` limpia sesión, cola, chat y socket (ya lo hace) y navega a `/suspended`.
  - `app/index.tsx` y `login/_layout.tsx`: no deben mandar al usuario de vuelta a las pestañas mientras `suspended` esté activo.
- **Tests:** un 403 `ACCOUNT_SUSPENDED` limpia la sesión y navega; la pantalla ofrece soporte.

### F10 · Bloqueo y denuncia desde el chat
- **Depende de:** B6.
- **Qué:** menú del chat con denunciar y bloquear; lista de bloqueados.
- **Pantallas y componentes**
  - `ChatScreen` agrega un botón de menú (⋯) en su cabecera que abre `ChatActionsSheet` (`src/features/chat/components/ChatActionsSheet.tsx`, sobre `BottomSheet` del DS): «Denunciar a {nombre}» (abre el `ReportFlow` existente, hoy ya cableado a `reportUser`) y «Bloquear / Desbloquear». Bloquear pide confirmación con `ConfirmDialog`.
  - `src/features/users/services/users.ts` (donde ya viven `follow`/`unfollow`): `blockUser`, `unblockUser`, `fetchBlockedUsers`.
  - `src/hooks/mutations/useBlockMutations.ts` (patrón de `useFollowMutations.ts`) y `useBlockedUsersQuery` en `src/hooks/queries/`.
  - Estado en el chat: aviso `ChatOrderNotice` («Bloqueaste a este usuario» / «No puedes enviar mensajes a este usuario») y el campo de texto deshabilitado según `blockedByMe` y `blockedMe` de la conversación.
  - Pantalla nueva «Usuarios bloqueados»: `app/(tabs)/profile/blocked-users.tsx` → `src/features/users/screens/BlockedUsersScreen.tsx`, con `ListRow` y botón «Desbloquear». Entrada en `profileSections.ts`, sección de seguridad.
- **Errores:** `USER_BLOCKED` y `CANNOT_BLOCK_SELF` en `error-messages.ts`.
- **Tests:** el campo se deshabilita según los banderines; bloquear invalida las queries del chat; la lista se actualiza.

### F11 · Favoritos en la cuenta
- **Depende de:** B8.
- **Qué:** pasar de un store local a datos del servidor.
- **Dónde**
  - `src/features/favorites/services/favorites.service.ts` (`GET`, `PUT`, `DELETE`) y `src/hooks/queries/useFavoritesQuery.ts` (consulta infinita) con mutación optimista de alternar.
  - `useIsFavorite(serviceId)` se calcula desde la caché de la query, con la misma firma pública que hoy para no tocar las pantallas que lo usan.
  - Se **elimina** `src/stores/favorites.store.ts` y su persistencia. Sin migración de los favoritos locales (se explica en las notas de la versión).
  - `FavoritesScreen` (`profile/favorites`) pasa a consumir la query infinita, con `EmptyState` y estado de error con reintento.
- **Tests:** alternar es optimista y se revierte si falla; la lista pagina; el corazón refleja la caché.

### F12 · Notificaciones nuevas
- **Depende de:** B4.
- **Qué:** tipos nuevos, rutas y textos.
- **Dónde:** `src/features/notifications/utils/notificationRoute.ts` y `NotificationsScreen`.

| Tipo | Destino al tocar |
|---|---|
| `ORDER_AWAITING_CONFIRMATION`, `ORDER_CANCELLED`, `ORDER_EXPIRED`, `ORDER_AUTO_CLOSED`, `ORDER_DISPUTED` | `/orders/[id]` con `orderId` |
| `POST_HIDDEN` | `/(tabs)/profile/my-works` |
| `REVIEW_REPLIED` | `/(tabs)/profile/my-reviews` |
| `PLATFORM_NEWS` | sin ruta, solo se lee |

  - Iconos y etiquetas por tipo. El interruptor general de push ya funciona (`usePushPreference` registra y borra el token); solo se agrega un test de regresión.
- **Tests:** un caso por tipo en el test de rutas; un tipo desconocido no rompe la lista.

### F13 · Trabajos acotado a v1
- **Depende de:** B5, B9.
- **Qué:** un servicio por proveedor, límite de 30 por proveedor, fotos ocultas.
- **Dónde**
  - `MyWorksScreen` (`features/works`): sin selector de servicio (hay uno); contador global x/30.
  - Fotos con `status = HIDDEN`: etiqueta «Oculta por denuncias, en revisión» y sin acciones de edición. `Badge` del DS con tono de advertencia.
  - `WorkDetailScreen`: ya oculta Cotizar y denunciar en las fotos propias; sin likes ni comentarios (decisión del PRD, nada que agregar).
  - Feed: sin cambios de UI; el backend acota por ciudad (B1).
- **Tests:** contador global; foto oculta no editable; mapa de errores sin cambios.

---

## Fase C · Cierre

### F14 · Errores de red y reintento
- **Qué:** que toda acción fallida por red ofrezca reintentar. La barra «Sin conexión» (`OfflineBanner`) y la integración con `onlineManager`/`focusManager` (`src/core/query/networkFocus.ts`) **ya existen** y no se tocan.
- **Dónde:** auditar las mutaciones principales (crear solicitud, subir foto, enviar reseña, marcar terminado, confirmar, bloquear) y asegurar que el error de red muestre mensaje claro más acción «Reintentar», sin perder lo que el usuario escribió. Si hace falta un estado de error de pantalla completa reutilizable, **agregar `ErrorState` al DS** (variante de `EmptyState`, con botón de reintento) antes de usarlo.
- **Tests:** por mutación, el error de red conserva el formulario y ofrece reintento.

### F15 · Baja de cuenta y términos
- **Qué:** copy de `DeleteAccountScreen` ajustado al alcance real (el historial compartido se conserva de forma anónima, no se promete borrar todo). Se conserva el flujo: contraseña o reautenticación reciente con Google, bloqueo por `ACTIVE_ORDERS`.
- **Tests:** el copy no contiene la promesa de borrado total.

### F16 · Contratos y documentación
- **Depende de:** B13.
- **Qué:** copiar el `openapi.json` real a `docs/backend-openapi.json`, correr `npm run contracts:generate` y dejar `contracts:check` en verde contra el contrato correcto. Actualizar `docs/FLOWS.md`, `odd/nav-map.md`, `odd/nav-flow.html` y la sección de rutas de CLAUDE.md con las rutas nuevas (`auth/select-city`, `suspended`, `profile/blocked-users`) y las ocultas (`orders/checkout`, `orders/payment-success`, `profile/plans`).

---

## Rutas nuevas y modificadas (resumen)

| Ruta | Acción | Pantalla |
|---|---|---|
| `app/auth/select-city.tsx` | nueva | `SelectCityScreen` (auth) |
| `app/suspended.tsx` | nueva | `SuspendedAccountScreen` (auth) |
| `app/(tabs)/profile/blocked-users.tsx` | nueva | `BlockedUsersScreen` (users) |
| `app/orders/checkout.tsx`, `app/orders/payment-success.tsx`, `app/(tabs)/profile/plans.tsx`, Pagos | ocultas por flag | — |
| `app/orders/[id].tsx` | cambia | acciones por estado y rol (F7, F8) |
| `app/chat/[id].tsx` | cambia | menú de acciones (F10) |
| `app/(tabs)/profile/Services.tsx`, `app/service-form.tsx` | cambian | un solo servicio, foto obligatoria (F3) |

No se agregan pestañas ni stores de Zustand nuevos. La barra sigue siendo Inicio · Trabajos · Pedidos/Órdenes · Mensajes · Perfil.

## Tareas de Perfil (`profileSections.ts`) tras el plan

- **Proveedor, «Mi negocio»:** Mi servicio, Mis trabajos, Mis reseñas, Verificación de identidad, Antecedentes (opcional), Soporte.
- **Cliente, «Mi actividad»:** Favoritos, Mis reseñas, Usuarios bloqueados, Soporte.
- Salen: Plan, Pagos, Mis reels y Subir reel (ya ocultos por flag).

## Decisiones abiertas que tocan al frontend

1. Qué ve el cliente durante los 3 días de `awaiting_confirmation` más allá de la cuenta regresiva (propuesto en F7).
2. Si el proveedor puede abrir una disputa desde `awaiting_confirmation` (B3).
3. Número de WhatsApp de soporte (B12).
4. Si «novedades de la plataforma» entra en v1 (B12); si no, se saca de F12.
5. Revisión legal de los términos únicos y de la edad mínima (PRD, sección 4).
