# Mapa de navegación

Se completa durante la migración del design system (`odd/tasks/design-system-centralization.md`): cada pantalla migrada agrega sus salidas acá.

Diagrama navegable (generado a mano desde este mapa): [`odd/nav-flow.html`](nav-flow.html). Este archivo es la fuente de verdad; al cambiarlo, actualizar el bloque de datos al inicio del HTML. Tareas abiertas: `odd/tasks/navigation-fixes.md`.

Qué registrar por pantalla: cada `router.push/replace/back/navigate`, `<Link href>`, `<Redirect>`, guards de `_layout`, y aperturas de modales o URLs externas.

Validación: el destino tiene que existir como ruta en `app/` (respetando grupos `(tabs)` y params `[id]`). Si no existe, o los params no coinciden → estado ❌ y fila en "Enlaces rotos".

Estados: ✅ ok · ❌ roto · ⚠️ dudoso (ruta dinámica armada con string, param opcional, destino condicional).

## Estructura de tabs (2026-10-16)

5 tabs visibles con label, en este orden (Reels está oculto tras `FEATURES.reels`, pospuesto a la próxima versión; **Trabajos** ocupa su lugar) (el orden sale de los `Tabs.Screen` de `app/(tabs)/_layout.tsx`):

| # | Tab | Ruta | Notas por rol |
|---|---|---|---|
| 1 | Inicio | `/(tabs)` | Cliente: explorar (`ClientHome`). Proveedor: trabajo (`ProviderHome`). |
| - | ~~Reels~~ (oculto) | `/(tabs)/reels` | `href: null` mientras `FEATURES.reels` es `false`; la ruta redirige a `/(tabs)`. Sin slot en la barra. |
| 2 | Trabajos | `/(tabs)/works` | Feed público tipo mosaico de fotos de trabajos terminados (todos los roles), filtro por categoría. Tocar una foto abre `/work/[id]`. Vacío: cliente mensaje amable; proveedor "Subí tus primeros trabajos" → Mis trabajos. |
| 3 | Pedidos / Órdenes | `/(tabs)/orders` | Label "Órdenes" para proveedores. Abre en el segmento "Como proveedor" si es proveedor (un `?tab=` explícito gana). Badge = órdenes recibidas con status `pending`. |
| 4 | Mensajes | `/(tabs)/chat` | Badge = no leídos (`useUnreadTotal`). |
| 5 | Perfil | `/(tabs)/profile` | Grupo por rol: proveedor "Mi negocio", cliente "Mi actividad" (`profileSections.ts`). |

**La barra solo se ve en las 4 raíces de tab** (`shouldShowTabBar` en `CustomTabBar`): se oculta en pantallas anidadas del stack de Perfil y en el stack oculto `services`; la salida es el botón volver.

**Servicios ya no es un tab.** `app/(tabs)/services/*` sigue dentro de `(tabs)` con `href: null` en su `Tabs.Screen`: queda fuera de la barra pero sigue ruteable (catálogo, `category/[id]`, `provider/[id]`), así que los deep links y los `/(tabs)/services/...` existentes no cambian. `Tabs` usa `backBehavior="history"` para que el back desde una ruta oculta vuelva al tab de origen. `CustomTabBar` ignora rutas sin entrada en `TABS` o con `href: null` (el cálculo del pill usa solo los tabs visibles).

Cambios de destino de esta reestructura:

| Disparador | Antes | Ahora |
|---|---|---|
| Home cliente: "Contratar" (PathCard) | `/(tabs)/services` | `/search` |
| Home cliente: "Ver todas" (categorías), "Servicios populares", "Explorar categorías" | `/(tabs)/services` | `/(tabs)/services` (catálogo oculto, sin cambio) |
| Empty state "Explorar servicios" en Mensajes, Favoritos y Pedidos | `/(tabs)/services` | `/(tabs)` (Inicio) |
| Home proveedor: resumen de órdenes | `/(tabs)/orders?tab=provider` | sin cambio |
| Perfil proveedor: "Servicios", "Órdenes", "Reseñas" (acceso rápido; "Mis reels" oculto por `FEATURES.reels`) | `/(tabs)/profile/Services`, `/(tabs)/orders`, `/(tabs)/profile/my-reviews`, `/(tabs)/profile/my-reels` | grupo "Mi negocio": Mis servicios, Publicar servicio (`/service-form`), Mis trabajos (`/(tabs)/profile/my-works`), (Mis reels oculto), Mis reseñas, Verificación (`/(tabs)/profile/kyc`), Antecedentes, Plan (`/(tabs)/profile/plans`). "Órdenes" se quitó (es un tab). |
| Perfil cliente: "Mis pedidos", "Mensajes" (acceso rápido) + CTA "¿Querés ofrecer servicios?" | `/(tabs)/orders`, `/(tabs)/chat`, `/(tabs)/profile/become-provider` | grupo "Mi actividad": Favoritos (`/(tabs)/profile/favorites`), Convertirme en proveedor (`/(tabs)/profile/become-provider`) |
| Perfil: "Cambiar Contraseña" | grupo "Preferencias" | grupo "Seguridad" |

## Rutas existentes (`app/`)

Generado con `npm run routes:generate` (`scripts/generate-routes.cjs` → `.expo/types/router.d.ts`, ignorado por git, no se commitea) y contrastado con `git ls-files app`. 42 pantallas + 9 layouts (2026-11-02: se agregó `/dev/components`; se borraron `Payments`, `edit/[type]`, `kyc/document` y `orders/status`; `termsAndConditions` pasó de `/login/*` a `/terms`). Los grupos `(tabs)` no aparecen en la URL pública (`/(tabs)/profile` ≡ `/profile`).

| Ruta | Archivo |
|---|---|
| `/(tabs)/chat` | `app/(tabs)/chat.tsx` |
| `/(tabs)` | `app/(tabs)/index.tsx` |
| `/(tabs)/orders` | `app/(tabs)/orders.tsx` |
| `/(tabs)/profile/ChangePassword` | `app/(tabs)/profile/ChangePassword.tsx` |
| `/(tabs)/profile/EditProfile` | `app/(tabs)/profile/EditProfile.tsx` |
| `/(tabs)/profile/Services` | `app/(tabs)/profile/Services.tsx` |
| `/(tabs)/profile/background-check` | `app/(tabs)/profile/background-check.tsx` |
| `/(tabs)/profile/become-provider` | `app/(tabs)/profile/become-provider.tsx` |
| `/(tabs)/profile/delete-account` | `app/(tabs)/profile/delete-account.tsx` |
| `/(tabs)/profile/favorites` | `app/(tabs)/profile/favorites.tsx` |
| `/(tabs)/profile` | `app/(tabs)/profile/index.tsx` |
| `/(tabs)/profile/kyc` | `app/(tabs)/profile/kyc/index.tsx` |
| `/(tabs)/profile/kyc/intro` | `app/(tabs)/profile/kyc/intro.tsx` |
| `/(tabs)/profile/my-reels` | `app/(tabs)/profile/my-reels.tsx` |
| `/(tabs)/profile/my-reviews` | `app/(tabs)/profile/my-reviews.tsx` |
| `/(tabs)/profile/my-works` | `app/(tabs)/profile/my-works.tsx` |
| `/(tabs)/profile/plans` | `app/(tabs)/profile/plans.tsx` |
| `/(tabs)/profile/verify-phone` | `app/(tabs)/profile/verify-phone.tsx` |
| `/(tabs)/reels` | `app/(tabs)/reels.tsx` |
| `/(tabs)/works` | `app/(tabs)/works.tsx` |
| `/work/[id]` | `app/work/[id].tsx` |
| `/(tabs)/services/category/[id]` | `app/(tabs)/services/category/[id].tsx` |
| `/(tabs)/services` | `app/(tabs)/services/index.tsx` |
| `/(tabs)/services/provider/[id]` | `app/(tabs)/services/provider/[id].tsx` |
| `/admin/background-check` | `app/admin/background-check.tsx` |
| `/auth/reset-password` | `app/auth/reset-password.tsx` |
| `/auth/verify-email` | `app/auth/verify-email.tsx` |
| `/auth/verify-reset-code` | `app/auth/verify-reset-code.tsx` |
| `/dev/components` | `app/dev/components.tsx` |
| `/chat/[id]` | `app/chat/[id].tsx` |
| `/chat` | `app/chat/index.tsx` |
| `/` | `app/index.tsx` |
| `/login/forgot-password` | `app/login/forgot-password.tsx` |
| `/login` | `app/login/index.tsx` |
| `/orders/[id]` | `app/orders/[id].tsx` |
| `/orders/checkout` | `app/orders/checkout.tsx` |
| `/orders` | `app/orders/index.tsx` |
| `/orders/payment-success` | `app/orders/payment-success.tsx` |
| `/orders/quote` | `app/orders/quote.tsx` |
| `/orders/review` | `app/orders/review.tsx` |
| `/search` | `app/search.tsx` |
| `/terms` | `app/terms.tsx` |
| `/service-form` | `app/service-form.tsx` |
| `/upload-reel` | `app/upload-reel.tsx` |
| `/welcome-video` | `app/welcome-video.tsx` |

Layouts: `app/(tabs)/_layout.tsx`, `app/(tabs)/profile/_layout.tsx`, `app/(tabs)/profile/kyc/_layout.tsx`, `app/(tabs)/services/_layout.tsx`, `app/_layout.tsx`, `app/auth/_layout.tsx`, `app/chat/_layout.tsx`, `app/login/_layout.tsx`, `app/orders/_layout.tsx`.

## Salidas por pantalla

| Pantalla (ruta) | Archivo | Disparador (UI) | Acción | Destino | Params | Estado |
|---|---|---|---|---|---|---|
| Gate (`/`) | `app/index.tsx` | Auth aún cargando | Render (sin navegar) | nada (el `BootSplash` de la raíz tapa la pantalla) | - | ✅ |
| Gate (`/`) | `app/index.tsx` | Sesión activa | `<Redirect>` | `/(tabs)` | - | ✅ |
| Gate (`/`) | `app/index.tsx` | Sin sesión | Render inline | `OnBoarding` | - | ✅ |
| Onboarding (`/`) | `screens/OnBoarding.tsx:79` | "Saltar" / "Comenzar" (último slide) | `router.replace` | `/login` | - | ✅ |
| Onboarding (`/`) | `screens/OnBoarding.tsx:83` | `onboardingComplete` ya guardado | `<Redirect>` | `/login` | - | ✅ |
| Layout login (`/login/*`) | `app/login/_layout.tsx:19` | Usuario ya autenticado (guard inverso) | `<Redirect>` | `/(tabs)` | - | ✅ |
| Login (`/login`) | `screens/LoginIndex.tsx` | Estado `showRegister` | Cambia vista local (no es ruta) | `LogInView` ⇄ `RegisterView` | - | ✅ |
| Login (`/login`) | `screens/LogInView.tsx:95` | "Ingresar" ok + flag `WELCOME_VIDEO_PENDING_KEY` | `router.replace` | `/welcome-video` | - | ✅ |
| Login (`/login`) | `screens/LogInView.tsx:97` | "Ingresar" ok | `router.replace` | `/(tabs)` | - | ✅ |
| Login (`/login`) | `screens/LogInView.tsx:110` | "Continuar con Google" ok | `router.replace` | `/(tabs)` | - | ✅ |
| Login (`/login`) | `screens/LogInView.tsx:186` | "¿Olvidaste tu contraseña?" | `router.push` | `/login/forgot-password` | - | ✅ |
| Login (`/login`) | `screens/LogInView.tsx` (prop `toRegister`) | "Registrarse" | Callback al padre → `showRegister=true` | `RegisterView` (vista local) | - | ✅ (rutas duplicadas eliminadas en `e971f5a`) |
| Registro (`/login`, vista) | `screens/RegisterView.tsx:138` | "Crear cuenta" (paso 4) ok | `router.push` | `/auth/verify-email` | `email` | ✅ (href tipado, `a7ce64c`) |
| Registro (`/login`, vista) | `screens/RegisterView.tsx` (último paso) | Texto "Al registrarte aceptás los **Términos y condiciones**" (solo paso 4) | `router.push` | `/terms` | - | ✅ (N2) |
| Registro (`/login`, vista) | `screens/RegisterView.tsx:159` | "Registrarse con Google" ok | `router.replace` | `/(tabs)` | - | ✅ |
| Registro (`/login`, vista) | `screens/RegisterView.tsx` (`handleBack`) | Flecha atrás en paso 1 | Callback `toRegister` → `showRegister=false` | `LogInView` (vista local) | - | ✅ |
| Registro (`/login`, vista) | `screens/RegisterView.tsx` (prop `toRegister`) | "Ingresar" (¿Ya tenés cuenta?) | Callback al padre → `showRegister=false` | `LogInView` (vista local) | - | ✅ |
| Registro (`/login`, vista) | `screens/RegisterView.tsx:150` | Error general de registro | `Alert.alert` (modal nativo) | - | - | ✅ |
| Recuperar contraseña (`/login/forgot-password`) | `screens/ForgotPasswordScreen.tsx:115` | Botón atrás | `safeBack` | `router.back()` o fallback `/login` | - | ✅ |
| Recuperar contraseña (`/login/forgot-password`) | `screens/ForgotPasswordScreen.tsx:95` | "Enviar código" ok | `router.push` | `/auth/verify-reset-code` | `email` | ✅ |
| Verificar email (`/auth/verify-email`) | `screens/VerifyEmailScreen.tsx:161` | Botón atrás | `safeBack` | `router.back()` o fallback `/login` | - | ✅ |
| Verificar email (`/auth/verify-email`) | `screens/VerifyEmailScreen.tsx:146` | "Ir a iniciar sesión" (tras verificar) | `logout()` + `router.replace` | `/login` | - | ✅ |
| Verificar código de reseteo (`/auth/verify-reset-code`) | `screens/VerifyResetCodeScreen.tsx:126` | Botón atrás | `safeBack` | `router.back()` o fallback `/login` | - | ✅ |
| Verificar código de reseteo (`/auth/verify-reset-code`) | `screens/VerifyResetCodeScreen.tsx:103` | "Continuar" | `router.push` | `/auth/reset-password` | `email`, `code` | ✅ |
| Nueva contraseña (`/auth/reset-password`) | `screens/ResetPasswordScreen.tsx:140` | Botón atrás | `safeBack` | `router.back()` o fallback `/login` | - | ✅ |
| Nueva contraseña (`/auth/reset-password`) | `screens/ResetPasswordScreen.tsx:126` | "Iniciar sesión" (éxito) | `router.replace` | `/login` | - | ✅ |
| Layout auth (`/auth/*`) | `app/auth/_layout.tsx` | Usuario ya autenticado al llegar (guard inverso, solo arranque en frío) | `<Redirect>` | `/(tabs)` | - | ✅ (N3) |
| Layout auth (`/auth/*`) | `app/auth/_layout.tsx` | Anónimo (o sesión iniciada estando en `/auth/*`, p.ej. el OTP de verify-email) | Stack con `presentation: "modal"` (verify-email, verify-reset-code, reset-password) | - | - | ✅ no redirige |
| Términos (`/terms`) | `screens/TermsAndConditionsScreen.tsx` | Botón atrás / "Entendido" | `safeBack` | `router.back()` o fallback `/login` (autenticado: el guard de `/login` lo manda a `/(tabs)`) | - | ✅ (informativa: sin banner de verificación ni checkbox) |
| Video de bienvenida (`/welcome-video`) | `screens/WelcomeVideoScreen.tsx:31` | `playToEnd`, timeout 8 s o "Saltar" | `router.replace` | `/(tabs)` | - | ✅ |
| Cambiar contraseña (`/(tabs)/profile/ChangePassword`) | `screens/ChangePasswordScreen.tsx:129` | Header atrás | `safeBack` | `router.back()` o fallback `/(tabs)/profile` | - | ✅ |
| Cambiar contraseña (`/(tabs)/profile/ChangePassword`) | `screens/ChangePasswordScreen.tsx:105` | "OK" del `Alert` de éxito | `Alert.alert` → `safeBack` | `router.back()` o fallback `/(tabs)/profile` | - | ✅ |
| Layout tabs (`/(tabs)/*`) | `app/(tabs)/_layout.tsx:25` | Sin sesión (guard) | `<Redirect>` | `/login` | - | ✅ |
| Layout raíz | `app/_layout.tsx:70` | Sin sesión y segmento protegido (`(tabs)`, `orders`, `chat`, `admin`, `service-form`, `search`, `upload-reel`) | `router.replace` (effect) | `/login` | - | ✅ |
| Tab bar (`/(tabs)/*`) | `src/components/CustomTabBar.tsx` (`onPress`) | Tap en un tab no enfocado (Inicio, Pedidos/Órdenes, Mensajes, Perfil) | `navigation.navigate` | `/(tabs)`, `/(tabs)/orders`, `/(tabs)/chat`, `/(tabs)/profile` | `route.params` | ✅ los 4 visibles existen en `app/(tabs)/_layout.tsx`; `services` está oculto (`href: null`) |
| Tab bar (`/(tabs)/*`) | `src/components/CustomTabBar.tsx` (`onPress`) | Tap en el tab ya enfocado con stack anidado | `StackActions.popToTop` | Raíz del stack del tab (ej. `/(tabs)/profile`) | - | ✅ |
| Perfil (`/(tabs)/profile`) | `src/features/profile/ProfileScreen.tsx:349` | Tap en el avatar del hero | `router.push` | `/(tabs)/profile/EditProfile` | - | ✅ |
| Perfil (`/(tabs)/profile`) | `src/features/profile/ProfileScreen.tsx:408` | "Editar perfil" (botón del hero) | `router.push` | `/(tabs)/profile/EditProfile` | - | ✅ |
| Perfil (`/(tabs)/profile`) | `src/features/profile/ProfileScreen.tsx` | "Editar Perfil" (grupo "Mi cuenta") | `router.push` | `/(tabs)/profile/EditProfile` | - | ✅ |
| Perfil (`/(tabs)/profile`) | `src/features/profile/ProfileScreen.tsx`, `profileSections.ts` (`INFO_SECTION`) | "Términos y condiciones" (grupo "Información", todos los roles) | `router.push` | `/terms` | - | ✅ (N2) |
| Editar perfil (`/(tabs)/profile/EditProfile`) | `src/features/users/screens/EditProfileScreen.tsx` | "Verificar" teléfono | `router.push` | `/(tabs)/profile/verify-phone` | - | ✅ |
| Proveedor (`/(tabs)/services/provider/[id]`) | `src/features/servicesUser/components/ServiceDetailModal.tsx:162` | "Solicitar Servicio" (modal de detalle) | cierra el modal + `router.push({ pathname, params })` | `/orders/quote` | `serviceId`, `serviceTitle`, `providerName` (los lee `QuoteRequestScreen`) | ✅ |
| Proveedor (`/(tabs)/services/provider/[id]`) | `src/features/servicesUser/components/ServiceDetailModal.tsx` | Abrir/cerrar detalle de servicio (lo monta `ProviderProfileScreen`) | `Modal` | - (modal, sin ruta) | - | ✅ |
| Auth gate de carga | `src/features/auth/state/AuthContext.tsx:263` | Error de sesión: "Reintentar conexión" / "Cerrar sesión" | `setAttempt` (re-valida) / `logout()` | - / `/login` (por el guard de `app/_layout.tsx`) | - | ✅ |
| Infra (`app/_layout.tsx`) | `src/core/components/BiometricLockGate.tsx`, `ErrorBoundary.tsx`, `OfflineBanner.tsx`, `UpdateBanner.tsx` | Bloqueo biométrico, error de render, sin conexión, update disponible | Overlays / `applyUpdate` | - (sin navegación) | - | ✅ |
| Home (`/(tabs)`) | `DashboardScreen.tsx` | Rol del perfil | Render (sin navegar) | `ClientHome` (cliente) o `ProviderHome` (proveedor). El Home se rediseñó: las filas antiguas de `DashboardScreen.tsx:3xx-5xx` estaban obsoletas y se reemplazaron por las de abajo | - | ✅ |
| Home cliente (`/(tabs)`) | `ClientHome.tsx:170,:200,:223` | Barra de búsqueda / CTA de búsqueda | `router.push` | `/search` | - | ✅ |
| Home cliente (`/(tabs)`) | `ClientHome.tsx:171,:211,:227,:261,:271` | "Ver todas" / "Ver todos" (Rubros) / "Servicios populares" / "Explorar categorías" | `router.push` | `/(tabs)/services` | - | ✅ |
| Home cliente (`/(tabs)`) | `ClientHome.tsx:174` | Tap en una categoría | `router.push` | `/(tabs)/services/category/[id]` | `id`, `from=home` | ✅ |
| Home cliente (`/(tabs)`) | `ClientHome.tsx:178` | Tap en un servicio popular (`ServiceCard`) | `router.push` | `/(tabs)/services/provider/[id]` | `id` (provider route id), `from=home` | ✅ |
| Home cliente (`/(tabs)`) | `ClientHome.tsx:161,:172,:308` | "Ofrecer" / "Quiero ofrecer servicios" (`RoleSelectionModal`) | `router.push` | `/(tabs)/profile/become-provider` | - | ✅ |
| Home cliente (`/(tabs)`) | `ClientHome.tsx:312` + `RoleSelectionModal.tsx` | Primera visita (flag `BOSKO_ROLE_MODAL_SEEN`) | `FullScreenModal` | - (modal, sin ruta) | - | ✅ |
| Home (`/(tabs)`) | `src/features/servicesUser/components/HomeTopBar.tsx:22` | Campana del header | abre `NotificationsModalRoot` (store `notificationsUI`) | - (modal global) | - | ✅ |
| Home proveedor (`/(tabs)`) | `ProviderHome.tsx:42` (+`:121`, `:142`, `:157`) | Resumen de solicitudes / "Ver todas" | `router.push` | `/(tabs)/orders` | `tab=provider` | ✅ |
| Home proveedor (`/(tabs)`) | `ProviderHome.tsx:43,:177` | Tap en una solicitud | `router.push` | `/orders/[id]` | `id` | ✅ |
| Home proveedor (`/(tabs)`) | `ProviderHome.tsx:44,:47,:163` | "Publicar servicio" (acción rápida / vacío) | `router.push` | `/service-form` | - | ✅ |
| Home proveedor (`/(tabs)`) | `ProviderHome.tsx:48,:49` | "Mis servicios" / "Subir reel" | `router.push` | `/(tabs)/profile/Services`, `/upload-reel` | - | ✅ |
| Servicios (`/(tabs)/services`) | `screens/ServicesScreen.tsx:80` | Tap en una categoría (`FeaturedCard`) | `router.push` | `/(tabs)/services/category/[id]` | `id` | ✅ |
| Servicios (`/(tabs)/services`) | `screens/ServicesScreen.tsx:99`, `:111` | Ícono de lupa / barra de búsqueda | `router.push` | `/search` | - | ✅ |
| Categoría (`/(tabs)/services/category/[id]`) | `screens/CategoryServicesScreen.tsx` | Tap en la tarjeta del profesional | `router.push` | `/(tabs)/services/provider/[id]` | `id` (`getProviderRouteId`) | ✅ |
| Categoría (`/(tabs)/services/category/[id]`) | `screens/CategoryServicesScreen.tsx` | "Cotizar" (dentro de la tarjeta) | `router.push` | `/orders/quote` | `serviceId`, `providerName`, `serviceTitle` (de ESE servicio) | ✅ (N7) |
| Categoría (`/(tabs)/services/category/[id]`) | `screens/CategoryServicesScreen.tsx:266-269` | Flecha atrás del hero | `router.replace` según `from` / `safeBack` | `/(tabs)` (`home`), `/(tabs)/profile/favorites` (`favorites`), `/search` (`search`), fallback `/(tabs)/services` | `from` | ✅ |
| Proveedor (`/(tabs)/services/provider/[id]`) | `screens/ProviderProfileScreen.tsx:100-103` | Flecha atrás (también en la vista de error) | `router.replace` según `from` / `safeBack` | `/(tabs)` (`home`), `/(tabs)/reels` (`reels`), `/search` (`search`), fallback `/(tabs)/services` | `from` | ✅ |
| Proveedor (`/(tabs)/services/provider/[id]`) | `screens/ProviderProfileScreen.tsx` | "Solicitar servicio" (footer), un solo servicio | `router.push` (`quoteHref`) | `/orders/quote` | `serviceId`, `providerName`, `serviceTitle` | ✅ (N6) |
| Proveedor (`/(tabs)/services/provider/[id]`) | `screens/ProviderProfileScreen.tsx` | "Solicitar servicio" (footer), varios servicios | `OptionSheet` (bottom sheet del DS) → elegir → `router.push` | `/orders/quote` | `serviceId` del elegido, `providerName`, `serviceTitle` | ✅ (N6) |
| Mis servicios (`/(tabs)/profile/Services`) | `screens/MyServiceScreen.tsx:96` | "Editar" en una tarjeta | `router.push` | `/service-form` | `serviceId` | ✅ |
| Mis servicios (`/(tabs)/profile/Services`) | `screens/MyServiceScreen.tsx:152`, `:176` | "Publicar" (header) / "Publicar primer servicio" (vacío) | `router.push` | `/service-form` | - | ✅ |
| Mis servicios (`/(tabs)/profile/Services`) | `screens/MyServiceScreen.tsx:147` | Botón atrás | `safeBack` | `router.back()` o fallback `/(tabs)/profile` | - | ✅ |
| Mis servicios (`/(tabs)/profile/Services`) | `screens/MyServiceScreen.tsx` (`handleDelete`) | "Eliminar" en una tarjeta | `Alert.alert` de confirmación + mutación | - (modal nativo) | - | ✅ |
| Mis servicios / Publicar | `MyServiceScreen.tsx:85`, `ServiceFormScreen.tsx:70` (`useRequireProviderStatus('provider')`) | Usuario sin status de proveedor | `router.replace` (guard) | `/(tabs)/profile/become-provider` | - | ✅ |
| Publicar servicio (`/service-form`) | `screens/ServiceFormScreen.tsx:239` | Botón atrás del header | `safeBack` | `router.back()` o fallback `/(tabs)/profile` | - | ✅ |
| Publicar servicio (`/service-form`) | `screens/ServiceFormScreen.tsx:221` | Guardar / publicar ok | `safeBack` | `router.back()` o fallback `/(tabs)/profile` | - | ✅ |
| Publicar servicio (`/service-form`) | `screens/ServiceFormScreen.tsx` (`handlePickImage`, galería) | "Foto principal" / "Agregar" | `ImagePicker` (selector nativo) | - | - | ✅ |
| Layout servicios (`/(tabs)/services/*`) | `app/(tabs)/services/_layout.tsx` | - | Stack (index, category/[id], provider/[id]) con colores `tc.*` | - | - | ✅ |
| Hero (sin uso) | `src/features/servicesUser/components/HeroCarousel.tsx:29` | "Explorar" | `router.push` | `/(tabs)/services` | - | ✅ (componente sin importadores, B26) |

## Salidas adicionales (T14, 2026-11-02)

Derivadas de `rg` sobre `router.*` / `<Redirect>` / hrefs en `src/` y `app/` para completar el diagrama `odd/nav-flow.html`. Los números de línea de todo este documento pueden correrse por refactors: confirmar con `rg`.

| Pantalla (ruta) | Archivo | Disparador | Destino | Estado |
|---|---|---|---|---|
| Trabajos (`/(tabs)/works`) | `WorksFeedScreen.tsx` | Tocar foto / vacío proveedor: "Mis trabajos" | `/work/[id]`, `/(tabs)/profile/my-works` | ✅ |
| Trabajo (`/work/[id]`) | `WorkDetailScreen.tsx` | Fila del proveedor / "Cotizar" / reportar (oculto en fotos propias) | `/(tabs)/services/provider/[id]`, `/orders/quote` (`quoteHref`), `ReportFlow` | ✅ |
| Mis trabajos (`/(tabs)/profile/my-works`) | `MyWorksScreen.tsx` | Subir / editar / borrar foto; sin servicios: "Publicar servicio" | `WorkFormSheet`, `OptionSheet`, `/service-form` | ✅ |
| (oculto, `FEATURES.reels`) Reels (`/(tabs)/reels`) | `ReelsScreen.tsx:488`, `ReelsTopBar.tsx:35,:55` | Ir al proveedor (`from=reels`) / "Publicar reel" / lupa | `/(tabs)/services/provider/[id]`, `/upload-reel`, `/search` | ✅ |
| Buscar (`/search`) | `SearchPage.tsx:107,:127,:162` | Resultado categoría / profesional (`from=search`) | `/(tabs)/services/category/[id]`, `/(tabs)/services/provider/[id]` | ✅ |
| Pedidos (`/(tabs)/orders`) | `OrdersListScreen.tsx:144,:151,:152,:198` | Tap en orden / vacío: Explorar, Ver mi perfil, Publicar | `/orders/[id]`, `/(tabs)`, `/(tabs)/profile`, `/service-form` | ✅ |
| Detalle de orden (`/orders/[id]`) | `OrderDetailScreen.tsx:136,:250,:371` | Pagar / Chat / Calificar | `/orders/checkout`, `/chat/[id]`, `/orders/review` | ✅ |
| Checkout (`/orders/checkout`) | `CheckoutScreen.tsx:92` | Pago simulado ok | `/orders/payment-success` (replace) | ✅ |
| Pago exitoso (`/orders/payment-success`) | `PaymentSuccessScreen.tsx:78,:84` | Ver orden / Ir al inicio | `/orders/[id]`, `/(tabs)` (replace) | ✅ |
| Cotizar (`/orders/quote`) | `QuoteRequestScreen.tsx:100` | "Ver mis órdenes" tras solicitar | `/(tabs)/orders` (replace) | ✅ |
| Mensajes (`/(tabs)/chat`) | `ConversationsListScreen.tsx:102,:256` | Tap en conversación / vacío: Explorar | `/chat/[id]`, `/(tabs)` | ✅ |
| Chat (`/chat/[id]`) | `ChatScreen.tsx:975,:1008` | Ver orden (header / banner) | `/orders/[id]` | ✅ |
| Perfil (`/(tabs)/profile`) | `ProfileScreen.tsx:211,:356,:410,:425,:493,:501,:519,:534`, `profileSections.ts:29-35,:39-40` | Editar, chip KYC / become-provider, Favoritos, Convertirme, Cambiar clave, Notificaciones (modal), Component showcase (`__DEV__`), Borrar cuenta; filas por rol | rutas de Perfil + `/service-form` | ✅ |
| Convertirme en proveedor | `BecomeProviderScreen.tsx:266,:285,:296` | Verificación / Antecedentes / Publicar servicio | `/(tabs)/profile/kyc`, `/(tabs)/profile/background-check`, `/service-form` | ✅ |
| KYC (`/(tabs)/profile/kyc`) | `KYCStatusScreen.tsx:126,:137` | Iniciar / volver | `/(tabs)/profile/kyc/intro`, `/(tabs)/profile` | ✅ |
| (oculto, `FEATURES.reels`) Mis reels / Publicar reel | `MyReelsScreen.tsx:232,:262`, `ReelUploadScreen.tsx:228` | Publicar / "Ver mis reels" | `/upload-reel`, `/(tabs)/profile/my-reels` | ✅ |
| Favoritos | `FavoritesScreen.tsx:61,:182` | Tap favorito / vacío | `/(tabs)/services/category/[id]` (`from=favorites`), `/(tabs)` | ✅ |
| Borrar cuenta | `DeleteAccountScreen.tsx:245` | Orden activa que bloquea | `/orders/[id]` | ✅ |
| Notificaciones (modal) | `NotificationsScreen.tsx:160`, `notificationRoute.ts` | Tap en una notificación | `/chat/[id]`, `/orders/[id]`, `/(tabs)/profile/become-provider`, `/(tabs)/orders` (`Href` tipado, `eab57d2`) | ✅ |
| Push (`app/_layout.tsx`) | `app/_layout.tsx:77-89` | Tap en notificación push | `/orders/[id]`, `/chat/[id]`, notificaciones (modal) | ✅ |
| Compat | `app/orders/index.tsx:4`, `app/chat/index.tsx:4` | Deep link a `/orders` / `/chat` | `<Redirect>` a `/(tabs)/orders` / `/(tabs)/chat` | ✅ |

## Enlaces rotos / dudosos

| Origen | Archivo:línea | Destino | Problema |
|---|---|---|---|
| Registro | `src/features/auth/screens/RegisterView.tsx:138` | `/auth/verify-email` | ✅ N1 (`a7ce64c`): href tipado `{ pathname, params }`. |
| Login / Registro (rutas) | `app/login/LogInView.tsx`, `app/login/RegisterView.tsx` | `/login/LogInView`, `/login/RegisterView` | ✅ removido en `e971f5a` (rutas huérfanas; `/login` ya muestra ambas vistas vía `LoginIndex`). |
| Términos | `app/terms.tsx` | `/terms` | ✅ N2: enlazada desde el último paso del registro y desde Perfil ("Información"). La ruta pasó de `/login/termsAndConditions` a `/terms` porque el guard inverso de `/login/*` redirigía a los autenticados. Pantalla neutral (sin banner ni checkbox). |
| Verificar email / reseteo | `app/auth/_layout.tsx` | `/auth/*` | ✅ N3: guard inverso en arranque en frío (autenticado → `/(tabs)`); la sesión iniciada estando en `/auth/*` no redirige (el OTP de `verify-email` la crea y la pantalla hace `logout()`). |
| Video de bienvenida | `app/welcome-video.tsx` | `/welcome-video` | ✅ N4 (`0077067`, `08d6982`): sin sesión → `/login`; sin flag `WELCOME_VIDEO_PENDING_KEY` → `/(tabs)`; una sola vez tras el registro. |
| Banner premium | `src/components/PremiumBanner.tsx` | (ícono de notificaciones) | ✅ removido en `e971f5a` (código muerto, sin importadores). |
| CTA proveedor / Promo | `src/components/ProviderCTA.tsx`, `src/features/servicesUser/components/PromoBanner.tsx` | `become-provider` / `plans` (inferidos) | ✅ removidos en `e971f5a` (código muerto, sin importadores). |
| Tarjeta profesional | `ProfesionalCard.tsx`, `ProfesionalCarousel.tsx` | "Reservar" | ✅ removidos en `e971f5a` (código muerto). También `FeaturesSection` y `CategoryVideoCarousel`. |
| Home | (era `DashboardScreen.tsx:521`) | `/(tabs)/profile` | ✅ Banner "¿Ofrecés servicios?" (B33) ya no existe tras el rediseño del Home (`ClientHome`/`ProviderHome`); `ClientHome` tiene "Ofrecer" → `become-provider`. Verificado 2026-11-02 (ver N5). |
| Proveedor | `ProviderProfileScreen.tsx` | `/orders/quote` | ✅ N6 (B35): un servicio → directo; varios → `OptionSheet` para elegir. |
| Categoría | `CategoryServicesScreen.tsx` | `/orders/quote` | ✅ N7 (B34): "Cotizar por chat" → "Cotizar", lleva a la cotización de ese servicio. |
| Pagos / Notificaciones | `notificationRoute.ts` | `/orders/[id]`, `/chat/[id]`, … | ✅ N8 (`eab57d2`): `Href` tipado sin `as any`. `PaymentsScreen` se borró (N9). |
| Publicar (ruta duplicada) | `app/(tabs)/profile/AddServices.tsx` | `/(tabs)/profile/AddServices` | ✅ removido en `e971f5a` (duplicaba `/service-form`; también su `Stack.Screen`). |

## Pantallas sin entrada

Rutas de `app/` a las que no llega ningún enlace (huérfanas).

Cruce de "Rutas existentes" contra los destinos de `router.*` / `<Redirect>` / `Link` en `src/` y `app/` (2026-11-02, T13). Ninguna ruta del código apunta a estas:

| Ruta | Archivo | Qué es | Decisión |
|---|---|---|---|
| `/terms` | `app/terms.tsx` | Términos y condiciones | **Se queda** (decisión de producto 2026-11-02). Cerrado (N2): enlazada desde el registro (último paso) y Perfil. |
| `/welcome-video` | `app/welcome-video.tsx` | Video de bienvenida | **Se queda** (decisión de producto). Sí tiene entrada: `LogInView` hace `replace` tras verificar email; guard por deep link cerrado (N4). |
| `/admin/background-check` | `app/admin/background-check.tsx` | Panel admin de antecedentes | Abierto: sin entrada en la UI (solo deep link; hay guard de rol en la pantalla). |
| `/orders` y `/chat` | `app/orders/index.tsx`, `app/chat/index.tsx` | Redirects a `/(tabs)/orders` y `/(tabs)/chat` | Se quedan: compat de deep links, no son pantallas. |

Borradas por decisión de producto (2026-11-02): `/(tabs)/profile/Payments` (N9, pagos aún no conectados), `/(tabs)/profile/edit/[type]` (N10, reemplazada por `EditProfile`), `/(tabs)/profile/kyc/document` (N11, Didit reemplazó la subida manual), `/orders/status` (N12, el detalle `/orders/[id]` ya tiene el timeline).

Confirmadas con entrada: `works`, `work/[id]`, `my-works`, `dev/components` (Perfil > Preferencias, solo `__DEV__`), `kyc`, `kyc/intro`, `my-reels`, `my-reviews`, `favorites`, `plans`, `become-provider`, `verify-phone`, `delete-account`, `ChangePassword`, `EditProfile`, `Services`, `background-check`, `upload-reel`, `orders/{[id],checkout,quote,review,payment-success}`, `chat/[id]`, `auth/*`, `terms`, `login/forgot-password`, `search`, `service-form`.

## Cambios de navegación del PRD v1 (2026-11-08, rama `feat/prd-v1`)

`odd/nav-flow.html` no se regeneró en este cambio: este archivo es la fuente de verdad.

| Ruta / disparador | Cambio | Estado |
|---|---|---|
| `/orders/checkout`, `/orders/payment-success` | Redirigen a `/(tabs)/orders` mientras `FEATURES.payments` es `false`. Sin botón «Pagar» en `/orders/[id]` | ✅ |
| `/(tabs)/profile/plans` | Redirige a `/(tabs)/profile` mientras `FEATURES.payments` es `false`; sin fila «Plan» en Perfil | ✅ |
| Perfil proveedor «Mi negocio» | Mi servicio, Mis trabajos, Mis reseñas, Verificación de identidad, Antecedentes (opcional), Usuarios bloqueados. Se quitan «Publicar servicio» y «Plan» | ✅ |
| Perfil cliente «Mi actividad» | Favoritos, Convertirme en proveedor, Usuarios bloqueados | ✅ |
| Inicio proveedor: acciones rápidas | «Mi servicio» → `/(tabs)/profile/Services` (se quita «Publicar servicio»; el alta se hace desde ahí) | ✅ |
| `/(tabs)/profile/Services` | Muestra el servicio único; «Publicar» solo si todavía no tiene uno | ✅ |
| `/service-form` | Sin `canPublish` (KYC aprobado y teléfono verificado) redirige a `/(tabs)/profile/become-provider` o a `/(tabs)/profile/verify-phone` | ✅ |
| `/(tabs)/profile/become-provider` | Lista de pasos: Identidad → Teléfono → Tu servicio | ✅ |
| `/login/RegisterView` | Paso «Tu ciudad» y aceptación de términos | ✅ |
| `/auth/select-city` (nueva) | Alta con Google sin ciudad (`422 CITY_REQUIRED`) o cuenta con `city === null`; `app/index.tsx` redirige si `city === null` | ✅ |
| `/suspended` (nueva) | Destino de `403 ACCOUNT_SUSPENDED` (logout forzado con motivo); «Volver al inicio de sesión» → `/login` | ✅ |
| `/chat/[id]` ⋯ | Menú: denunciar (flujo existente) y bloquear/desbloquear | ✅ |
| `/(tabs)/profile/blocked-users` (nueva) | Lista de bloqueados con «Desbloquear» | ✅ |
| `/orders/[id]` | Acciones por estado y rol (matriz `getOrderActions`); en `disputed`, bloque de soporte por WhatsApp (URL externa `wa.me`) | ✅ |
| Notificaciones | `ORDER_*` → `/orders/[id]`; `POST_HIDDEN` → `/(tabs)/profile/my-works`; `REVIEW_REPLIED` → `/(tabs)/profile/my-reviews`; `PLATFORM_NEWS` sin destino | ✅ |
| Orden cancelada por el sistema (cliente) | «Cotizar a otro proveedor» → `/search` | ✅ |
