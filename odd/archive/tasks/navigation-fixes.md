# Navigation fixes — enlaces rotos, dudosos y pantallas huérfanas

**Rama:** a definir (nace de `feat/ds-t14-nav-diagram`; no implementar sobre la rama del diagrama)
**Espejo Engram:** `odd/navigation-fixes/tasks`
**TDD:** off (sin decisión explícita para esta feature). Checks: `npx tsc --noEmit -p .`, `npm test -- --runInBand`, `npm run lint`. Runner: jest (`jest-expo`).
**Origen:** T14 de `odd/tasks/design-system-centralization.md` (2026-11-02). Fuente de verdad: `odd/nav-map.md`; vista: `odd/nav-flow.html`.

## Objetivo

Cerrar cada ítem abierto de "Enlaces rotos / dudosos" y "Pantallas sin entrada" de `odd/nav-map.md`: o se arregla (fix puro), o se decide con producto (conectar vs borrar) y después se implementa.

## Problema

`odd/nav-flow.html` muestra 0 enlaces rotos, 10 dudosos (7 problemas distintos) y 6 pantallas huérfanas. Ninguno se arregló en el design system (fuera de alcance de T13/T14). Algunos son fixes mecánicos; otros dependen de una decisión de producto que **no** está tomada.

## Alcance

- Dentro: los 13 ítems de la tabla. Cada tarea es independiente (salvo que una decisión borre una ruta: actualizar `nav-map.md`, `nav-flow.html` y `CLAUDE.md` si la ruta figura ahí).
- Fuera: rediseño de pantallas, cambios de backend, el sistema de diseño.

## Restricciones

- Sin decisión de producto no se implementa la tarea correspondiente ("Decisión pendiente"): se pregunta de a una.
- Rutas tipadas: `router.push({ pathname, params })`, no template strings; sin `as any`.
- Al terminar cada tarea: actualizar `odd/nav-map.md` (fila y "Enlaces rotos"/"Pantallas sin entrada") y el bloque de datos de `odd/nav-flow.html`.
- Guía de tamaño ~400 líneas por tarea es solo heurística (no un tope).

## Tareas

| ID | Tarea | Tipo | Route | Status | Evidence |
|---|---|---|---|---|---|
| N1 | Registro: el `router.push` con template string hacia `/auth/verify-email?email=…` en `src/features/auth/screens/RegisterView.tsx:138` (nav-map decía `:139`) → `router.push({ pathname: '/auth/verify-email', params: { email } })`. La ruta existe; falta el chequeo de tipos de params. | Fix puro | inline | ✅ | `a7ce64c` |
| N2 | `/login/termsAndConditions` sin entrada. Decisión de producto 2026-11-02: la pantalla se queda y se enlaza (a) desde el último paso del registro (texto "Al registrarte aceptás los Términos y condiciones", con el nombre tocable) y (b) desde una fila "Términos y condiciones" en Perfil (grupo "Información", todos los roles, `INFO_SECTION`). La ruta se movió a `/terms` (`app/terms.tsx`): bajo `/login/*` el guard inverso redirigía a `/(tabs)` a los autenticados que venían de Perfil. La pantalla se hizo neutral: sin banner de verificación de email ni checkbox (no hacían nada) y "Entendido" vuelve con `safeBack`. | Decisión implementada | inline | ✅ | `0673906` |
| N3 | `/auth/*` sin guard inverso. Decisión de producto 2026-11-02: autenticado en `verify-reset-code` / `reset-password` → `/(tabs)`. `verify-email`: el registro NO deja sesión (`POST /auth/register` no devuelve tokens; la sesión nace en `verifyEmail()` y la pantalla hace `logout()` al final), así que un autenticado que llega a `/auth/*` ya tiene el email verificado → también `/(tabs)`. Guard en `app/auth/_layout.tsx` solo en arranque en frío (ref `authenticatedOnArrival`, mismo patrón que `login/_layout`); la sesión iniciada estando en la pantalla (OTP de verify-email) no redirige. No hay flag de email verificado en el cliente (`AuthUser.isVerified` es verificación de identidad), no hace falta. Renderiza `null` mientras `authLoaded=false`. | Decisión implementada | inline | ✅ | `7031822` |
| N4 | `/welcome-video` (`app/welcome-video.tsx`, `WelcomeVideoScreen.tsx:31`) sin guard: se abre por deep link sin sesión (termina en `/(tabs)` → `/login`) y sin el flag `WELCOME_VIDEO_PENDING_KEY` (`src/features/auth/constants.ts:4`). Fix: redirigir a `/login` sin sesión. **Decisión (producto, 2026-11-02): una sola vez, después del registro.** Sin sesión → `/login`; sin flag → `/(tabs)`; `LogInView` ya no consume el flag, lo borra `WelcomeVideoScreen` al terminar o saltar. | Fix + decisión menor | inline | ✅ | `0077067`, `08d6982` |
| N5 | B33 banner "¿Ofrecés servicios? Empezar ahora" (`DashboardScreen.tsx:521` en el mapa): **ya no existe** (el Home se rediseñó en `ClientHome`/`ProviderHome`; `rg "Ofrecés"` sin resultados; `ClientHome.tsx:308` ofrece "Ofrecer" → `become-provider`). Tarea: confirmar en dispositivo y cerrar B33 en `odd/backlog-fixes.md`. **Decisión pendiente (opcional):** ¿`ProviderHome` necesita algún CTA equivalente? | Verificación + doc | ⬜ | ⬜ | ⬜ |
| N6 | B35: `ProviderProfileScreen` cotizaba siempre `services[0]`. Decisión de producto 2026-11-02: 1 servicio → directo; varios → bottom sheet para elegir; 0 → sin botón (como antes). Lógica pura en `servicesUser/utils/quoteRoute.ts` (`resolveQuoteTarget`, `quoteHref`); sheet genérica nueva en el DS: `OptionSheet` (exportada en el barrel). | Decisión implementada | inline | ✅ | `21b2b66` |
| N7 | B34: "Cotizar por chat" en `CategoryServicesScreen`. Decisión de producto 2026-11-02: renombrar a "Cotizar" y llevar a `/orders/quote` con ESE servicio (`quoteHref`); tocar el resto de la tarjeta sigue yendo al perfil del proveedor. No había otro CTA "Cotizar por chat" (`git grep`). | Decisión implementada | inline | ✅ | `c649f59` |
| N8 | Hrefs armados con string en notificaciones: `src/features/notifications/utils/notificationRoute.ts:23-27` (`/chat/${orderId}`, `/orders/${orderId}`, …) consumidos con `router.push(route as any)` en `NotificationsScreen.tsx:160` y `app/_layout.tsx:85`. Fix: que `getNotificationRoute` devuelva `Href` tipado (`{ pathname, params }`), sin `as any`; mantener tests de `notificationRoute`. | Fix puro | inline | ✅ | `eab57d2` |
| N9 | `/(tabs)/profile/Payments` huérfana. Decisión de producto 2026-11-02: borrar (pagos aún no conectados). Se borraron la ruta, su `Stack.Screen` y `PaymentsScreen`. `PaymentContext`, `mockPayments` y los hooks de `usePaymentsQuery` se quedan (los usa el checkout / PR #29). | Borrado | inline | ✅ | `625fab6` |
| N10 | `/(tabs)/profile/edit/[type]` huérfana. Decisión de producto 2026-11-02: borrar. Se borraron la ruta, `ProfileEditScreen` y `users/components/edit/*` (`EditDescription`, `EditMail`, `EditNotifications`, `EditPayments`, `EditPhoto`) con sus tests. `ChangePassword` se queda: la enlaza `ProfileScreen` ("Seguridad"). | Borrado | inline | ✅ | `67b6e51` |
| N11 | `/(tabs)/profile/kyc/document` huérfana. Decisión de producto 2026-11-02: borrar (Didit reemplazó la subida manual). Se borraron la ruta, su `Stack.Screen` y `KYCDocumentScreen`. | Borrado | inline | ✅ | `e3f94b1` |
| N12 | `/orders/status` huérfana. Decisión de producto 2026-11-02: borrar (el detalle `/orders/[id]` ya tiene el timeline). Se borraron la ruta, su `Stack.Screen` y `OrderStatusScreen`. Nota (no se porta): `OrderStatusScreen` tenía polling cada 10 s y estimaciones de tiempo/contacto que el detalle no muestra. | Borrado | inline | ✅ | `1c96b20` |
| N13 | `/admin/background-check` (`app/admin/background-check.tsx`, `AdminBackgroundCheckScreen.tsx:167`) sin entrada en la UI: solo deep link; hay guard de rol dentro de la pantalla, pero no en `app/_layout.tsx` por rol. **Decisión pendiente:** ¿entrada para admins (fila en Perfil visible solo con rol admin) o se deja solo por deep link (documentarlo)? | Decisión pendiente | ⬜ | ⬜ | ⬜ |

Resumen: hechos N1, N2, N3, N4, N6, N7, N8, N9, N10, N11, N12 · pendientes N5 (verificar en dispositivo) y N13 (decisión).

## Criterios de aceptación

- Cada ítem cerrado deja de aparecer en "Enlaces rotos / dudosos" / "Pantallas sin entrada" de `odd/nav-map.md` y `odd/nav-flow.html` (0 dudosos, 0 huérfanas salvo las que producto decida mantener).
- Sin `router.push` con template string ni `as any` en navegación.
- Rutas borradas: sin referencias sueltas (`rg`), `npm run routes:generate` sin la ruta.
- `tsc`, `npm test`, `npm run lint` verdes.

## Checks

`npx tsc --noEmit -p .` · `npm test -- --runInBand` · `npm run lint` · `rg "as any" src/features/notifications` · revisar `odd/nav-flow.html` (abrir y filtrar "Solo problemas").

## Progreso

- 2026-11-02: documento creado desde T14. Sin tareas iniciadas.
- 2026-11-02: N1, N8 y N4 hechos en `fix/navigation-typed-hrefs` (`a7ce64c`, `eab57d2`, `0077067`, `08d6982`). `typedRoutes: true` en `app.config.ts`; `getNotificationRoute`/`resolveNotificationRoute` devuelven `Href`, sin `as any`. N4: guard de sesión + flag `WELCOME_VIDEO_PENDING_KEY` (lectura async sin flash). Checks: tsc 0, lint 0, lint:ds 0, jest 54 suites / 639 tests verdes. Pendiente: actualizar `odd/nav-map.md` y `odd/nav-flow.html` para N1/N8/N4.
- 2026-11-02: decisiones de producto implementadas en `feat/navigation-decisions` (apilada sobre `fix/navigation-typed-hrefs`): N9, N10, N11, N12 (borrados), N2, N3, N6, N7. Checks: `tsc` 0, `lint` 0, `lint:ds` 0, jest 57 suites / 636 tests verdes. `odd/nav-map.md` y `odd/nav-flow.html` actualizados (0 dudosos, 1 huérfana: N13).

## Próximo paso

1. N5: verificar en dispositivo el banner B33 y cerrarlo en `odd/backlog-fixes.md`. 2. N13 (`/admin/background-check`): decidir entrada para admins, después de PR #62. 3. Verificar en dispositivo los flujos nuevos: términos desde registro y Perfil, selector de servicio al cotizar, guard `/auth/*`.
