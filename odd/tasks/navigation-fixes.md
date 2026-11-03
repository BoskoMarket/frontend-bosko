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
| N2 | `/login/termsAndConditions` (`app/login/termsAndConditions.tsx`, `TermsAndConditionsScreen.tsx:39,:76`) no tiene entrada: ni login ni registro la enlazan. La pantalla asume que viene post-registro. **Decisión pendiente:** ¿dónde se enlaza (checkbox/texto en el paso final del registro, pie del login, fila en Perfil) y con qué copy? Producto ya decidió que la pantalla se queda. | Decisión pendiente | ⬜ | ⬜ | ⬜ |
| N3 | `/auth/*` sin guard inverso (`app/auth/_layout.tsx`): un usuario autenticado abre `verify-email`, `verify-reset-code` o `reset-password` por deep link. Ojo: `VerifyEmailScreen.tsx:42,:146` llama `logout()` al terminar, lo que sugiere que el registro deja una sesión activa durante `verify-email`; un guard ciego rompería ese flujo. **Decisión pendiente:** ¿qué hace un autenticado en cada pantalla (redirigir a `/(tabs)`, o permitir `verify-email` si el email no está verificado)? | Decisión pendiente | ⬜ | ⬜ | ⬜ |
| N4 | `/welcome-video` (`app/welcome-video.tsx`, `WelcomeVideoScreen.tsx:31`) sin guard: se abre por deep link sin sesión (termina en `/(tabs)` → `/login`) y sin el flag `WELCOME_VIDEO_PENDING_KEY` (`src/features/auth/constants.ts:4`). Fix: redirigir a `/login` sin sesión. **Decisión (producto, 2026-11-02): una sola vez, después del registro.** Sin sesión → `/login`; sin flag → `/(tabs)`; `LogInView` ya no consume el flag, lo borra `WelcomeVideoScreen` al terminar o saltar. | Fix + decisión menor | inline | ✅ | `0077067`, `08d6982` |
| N5 | B33 banner "¿Ofrecés servicios? Empezar ahora" (`DashboardScreen.tsx:521` en el mapa): **ya no existe** (el Home se rediseñó en `ClientHome`/`ProviderHome`; `rg "Ofrecés"` sin resultados; `ClientHome.tsx:308` ofrece "Ofrecer" → `become-provider`). Tarea: confirmar en dispositivo y cerrar B33 en `odd/backlog-fixes.md`. **Decisión pendiente (opcional):** ¿`ProviderHome` necesita algún CTA equivalente? | Verificación + doc | ⬜ | ⬜ | ⬜ |
| N6 | B35: `ProviderProfileScreen.tsx:292-299` (nav-map decía `:228`) siempre manda `services[0]` a `/orders/quote` aunque el proveedor tenga varios servicios. **Decisión pendiente:** ¿selector de servicio antes de cotizar, o el footer abre el detalle (`ServiceDetailModal`) para elegir? | Decisión pendiente | ⬜ | ⬜ | ⬜ |
| N7 | B34: el texto "Cotizar por chat" (`CategoryServicesScreen.tsx:149`; el Home ya no lo muestra) lleva al perfil del proveedor (`:269`), no a un chat. El chat es por orden (no hay DMs libres), así que no se puede abrir un chat antes de cotizar. **Decisión pendiente:** cambiar el texto ("Ver perfil" / "Cotizar") o cambiar el flujo. | Decisión pendiente | ⬜ | ⬜ | ⬜ |
| N8 | Hrefs armados con string en notificaciones: `src/features/notifications/utils/notificationRoute.ts:23-27` (`/chat/${orderId}`, `/orders/${orderId}`, …) consumidos con `router.push(route as any)` en `NotificationsScreen.tsx:160` y `app/_layout.tsx:85`. Fix: que `getNotificationRoute` devuelva `Href` tipado (`{ pathname, params }`), sin `as any`; mantener tests de `notificationRoute`. | Fix puro | inline | ✅ | `eab57d2` |
| N9 | `/(tabs)/profile/Payments` (`app/(tabs)/profile/Payments.tsx`, `PaymentsScreen.tsx`) huérfana: ninguna fila de Perfil la enlaza. Además `PaymentsScreen.tsx:86` usa `router.push` con template string hacia `/orders/<orderId>`. **Decisión pendiente:** conectar (¿fila en "Mi actividad"? ¿solo cliente?) o borrar (los pagos son simulados). Si se conecta, el fix del href string es puro. | Decisión pendiente | ⬜ | ⬜ | ⬜ |
| N10 | `/(tabs)/profile/edit/[type]` (`app/(tabs)/profile/edit/[type].tsx`, `ProfileEditScreen`) huérfana: editor legado por tipo, reemplazado por `EditProfile`. Su componente `EditMail.tsx:23` empuja a `ChangePassword`. **Decisión pendiente:** borrar (candidato) o conectar. Si se borra: quitar ruta, `ProfileEditScreen`, componentes `edit/*` sin otro uso y sus tests. | Decisión pendiente | ⬜ | ⬜ | ⬜ |
| N11 | `/(tabs)/profile/kyc/document` (`app/(tabs)/profile/kyc/document.tsx`, `KYCDocumentScreen.tsx:138` vuelve a `/kyc`) huérfana: `KYCStatus`/`KYCIntro` no la enlazan. **Decisión pendiente:** ¿el flujo Didit la reemplazó (borrar) o falta el paso de subida de documentos (conectar desde `kyc/intro`)? | Decisión pendiente | ⬜ | ⬜ | ⬜ |
| N12 | `/orders/status` (`app/orders/status.tsx`, `OrderStatusScreen.tsx:257,:265` → `/orders/[id]`, `/chat/[id]`) huérfana: el detalle vive en `/orders/[id]`. **Decisión pendiente:** ¿es el seguimiento (timeline) que debería vivir dentro del detalle (borrar la ruta) o una pantalla propia a enlazar desde `OrderDetail`? | Decisión pendiente | ⬜ | ⬜ | ⬜ |
| N13 | `/admin/background-check` (`app/admin/background-check.tsx`, `AdminBackgroundCheckScreen.tsx:167`) sin entrada en la UI: solo deep link; hay guard de rol dentro de la pantalla, pero no en `app/_layout.tsx` por rol. **Decisión pendiente:** ¿entrada para admins (fila en Perfil visible solo con rol admin) o se deja solo por deep link (documentarlo)? | Decisión pendiente | ⬜ | ⬜ | ⬜ |

Resumen: fixes puros N1, N8 · fix + decisión menor N4 · verificación N5 · decisión pendiente N2, N3, N6, N7, N9, N10, N11, N12, N13.

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

## Próximo paso

1. Actualizar `odd/nav-map.md` y `odd/nav-flow.html` (N1, N8, N4 cerrados). 2. Preguntar a producto, de a una, N2/N3/N6/N7 (flujo de usuario) y luego N9–N13 (conectar vs borrar). 3. N5: verificar en dispositivo y cerrar B33.
