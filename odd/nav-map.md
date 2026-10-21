# Mapa de navegación

Se completa durante la migración del design system (`odd/tasks/design-system-centralization.md`): cada pantalla migrada agrega sus salidas acá.

Qué registrar por pantalla: cada `router.push/replace/back/navigate`, `<Link href>`, `<Redirect>`, guards de `_layout`, y aperturas de modales o URLs externas.

Validación: el destino tiene que existir como ruta en `app/` (respetando grupos `(tabs)` y params `[id]`). Si no existe, o los params no coinciden → estado ❌ y fila en "Enlaces rotos".

Estados: ✅ ok · ❌ roto · ⚠️ dudoso (ruta dinámica armada con string, param opcional, destino condicional).

## Estructura de tabs (2026-10-16)

5 tabs con label visible, en este orden (el orden sale de los `Tabs.Screen` de `app/(tabs)/_layout.tsx`):

| # | Tab | Ruta | Notas por rol |
|---|---|---|---|
| 1 | Inicio | `/(tabs)` | Cliente: explorar (`ClientHome`). Proveedor: trabajo (`ProviderHome`). |
| 2 | Reels | `/(tabs)/reels` | - |
| 3 | Pedidos / Órdenes | `/(tabs)/orders` | Label "Órdenes" para proveedores. Abre en el segmento "Como proveedor" si es proveedor (un `?tab=` explícito gana). Badge = órdenes recibidas con status `pending`. |
| 4 | Mensajes | `/(tabs)/chat` | Badge = no leídos (`useUnreadTotal`). |
| 5 | Perfil | `/(tabs)/profile` | Grupo por rol: proveedor "Mi negocio", cliente "Mi actividad" (`profileSections.ts`). |

**La barra solo se ve en las 5 raíces de tab** (`shouldShowTabBar` en `CustomTabBar`): se oculta en pantallas anidadas del stack de Perfil y en el stack oculto `services`; la salida es el botón volver.

**Servicios ya no es un tab.** `app/(tabs)/services/*` sigue dentro de `(tabs)` con `href: null` en su `Tabs.Screen`: queda fuera de la barra pero sigue ruteable (catálogo, `category/[id]`, `provider/[id]`), así que los deep links y los `/(tabs)/services/...` existentes no cambian. `Tabs` usa `backBehavior="history"` para que el back desde una ruta oculta vuelva al tab de origen. `CustomTabBar` ignora rutas sin entrada en `TABS` o con `href: null` (el cálculo del pill usa solo los tabs visibles).

Cambios de destino de esta reestructura:

| Disparador | Antes | Ahora |
|---|---|---|
| Home cliente: "Contratar" (PathCard) | `/(tabs)/services` | `/search` |
| Home cliente: "Ver todas" (categorías), "Servicios populares", "Explorar categorías" | `/(tabs)/services` | `/(tabs)/services` (catálogo oculto, sin cambio) |
| Empty state "Explorar servicios" en Mensajes, Favoritos y Pedidos | `/(tabs)/services` | `/(tabs)` (Inicio) |
| Home proveedor: resumen de órdenes | `/(tabs)/orders?tab=provider` | sin cambio |
| Perfil proveedor: "Servicios", "Órdenes", "Reseñas", "Mis reels" (acceso rápido) | `/(tabs)/profile/Services`, `/(tabs)/orders`, `/(tabs)/profile/my-reviews`, `/(tabs)/profile/my-reels` | grupo "Mi negocio": Mis servicios, Publicar servicio (`/service-form`), Mis reels, Mis reseñas, Verificación (`/(tabs)/profile/kyc`), Antecedentes, Plan (`/(tabs)/profile/plans`). "Órdenes" se quitó (es un tab). |
| Perfil cliente: "Mis pedidos", "Mensajes" (acceso rápido) + CTA "¿Querés ofrecer servicios?" | `/(tabs)/orders`, `/(tabs)/chat`, `/(tabs)/profile/become-provider` | grupo "Mi actividad": Favoritos (`/(tabs)/profile/favorites`), Convertirme en proveedor (`/(tabs)/profile/become-provider`) |
| Perfil: "Cambiar Contraseña" | grupo "Preferencias" | grupo "Seguridad" |

## Rutas existentes (`app/`)

Generado con `npm run routes:generate` (`scripts/generate-routes.cjs` → `.expo/types/router.d.ts`, ignorado por git, no se commitea) y contrastado con `git ls-files app`. 48 pantallas + 9 layouts. Los grupos `(tabs)` no aparecen en la URL pública (`/(tabs)/profile` ≡ `/profile`).

| Ruta | Archivo |
|---|---|
| `/(tabs)/chat` | `app/(tabs)/chat.tsx` |
| `/(tabs)` | `app/(tabs)/index.tsx` |
| `/(tabs)/orders` | `app/(tabs)/orders.tsx` |
| `/(tabs)/profile/AddServices` | `app/(tabs)/profile/AddServices.tsx` |
| `/(tabs)/profile/ChangePassword` | `app/(tabs)/profile/ChangePassword.tsx` |
| `/(tabs)/profile/EditProfile` | `app/(tabs)/profile/EditProfile.tsx` |
| `/(tabs)/profile/Payments` | `app/(tabs)/profile/Payments.tsx` |
| `/(tabs)/profile/Services` | `app/(tabs)/profile/Services.tsx` |
| `/(tabs)/profile/background-check` | `app/(tabs)/profile/background-check.tsx` |
| `/(tabs)/profile/become-provider` | `app/(tabs)/profile/become-provider.tsx` |
| `/(tabs)/profile/delete-account` | `app/(tabs)/profile/delete-account.tsx` |
| `/(tabs)/profile/edit/[type]` | `app/(tabs)/profile/edit/[type].tsx` |
| `/(tabs)/profile/favorites` | `app/(tabs)/profile/favorites.tsx` |
| `/(tabs)/profile` | `app/(tabs)/profile/index.tsx` |
| `/(tabs)/profile/kyc/document` | `app/(tabs)/profile/kyc/document.tsx` |
| `/(tabs)/profile/kyc` | `app/(tabs)/profile/kyc/index.tsx` |
| `/(tabs)/profile/kyc/intro` | `app/(tabs)/profile/kyc/intro.tsx` |
| `/(tabs)/profile/my-reels` | `app/(tabs)/profile/my-reels.tsx` |
| `/(tabs)/profile/my-reviews` | `app/(tabs)/profile/my-reviews.tsx` |
| `/(tabs)/profile/plans` | `app/(tabs)/profile/plans.tsx` |
| `/(tabs)/profile/verify-phone` | `app/(tabs)/profile/verify-phone.tsx` |
| `/(tabs)/reels` | `app/(tabs)/reels.tsx` |
| `/(tabs)/services/category/[id]` | `app/(tabs)/services/category/[id].tsx` |
| `/(tabs)/services` | `app/(tabs)/services/index.tsx` |
| `/(tabs)/services/provider/[id]` | `app/(tabs)/services/provider/[id].tsx` |
| `/admin/background-check` | `app/admin/background-check.tsx` |
| `/auth/reset-password` | `app/auth/reset-password.tsx` |
| `/auth/verify-email` | `app/auth/verify-email.tsx` |
| `/auth/verify-reset-code` | `app/auth/verify-reset-code.tsx` |
| `/chat/[id]` | `app/chat/[id].tsx` |
| `/chat` | `app/chat/index.tsx` |
| `/` | `app/index.tsx` |
| `/login/LogInView` | `app/login/LogInView.tsx` |
| `/login/RegisterView` | `app/login/RegisterView.tsx` |
| `/login/forgot-password` | `app/login/forgot-password.tsx` |
| `/login` | `app/login/index.tsx` |
| `/login/termsAndConditions` | `app/login/termsAndConditions.tsx` |
| `/orders/[id]` | `app/orders/[id].tsx` |
| `/orders/checkout` | `app/orders/checkout.tsx` |
| `/orders` | `app/orders/index.tsx` |
| `/orders/payment-success` | `app/orders/payment-success.tsx` |
| `/orders/quote` | `app/orders/quote.tsx` |
| `/orders/review` | `app/orders/review.tsx` |
| `/orders/status` | `app/orders/status.tsx` |
| `/search` | `app/search.tsx` |
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
| Login (`/login`) | `screens/LogInView.tsx:94` | "Ingresar" ok + flag `WELCOME_VIDEO_PENDING_KEY` | `router.replace` | `/welcome-video` | - | ✅ |
| Login (`/login`) | `screens/LogInView.tsx:96` | "Ingresar" ok | `router.replace` | `/(tabs)` | - | ✅ |
| Login (`/login`) | `screens/LogInView.tsx:109` | "Continuar con Google" ok | `router.replace` | `/(tabs)` | - | ✅ |
| Login (`/login`) | `screens/LogInView.tsx:185` | "¿Olvidaste tu contraseña?" | `router.push` | `/login/forgot-password` | - | ✅ |
| Login (`/login`) | `screens/LogInView.tsx` (prop `toRegister`) | "Registrarse" | Callback al padre → `showRegister=true` | `RegisterView` (vista local) | - | ⚠️ no-op si se abre como ruta `/login/LogInView` (sin prop) |
| Registro (`/login`, vista) | `screens/RegisterView.tsx:139` | "Crear cuenta" (paso 4) ok | `router.push` (string armado) | `/auth/verify-email` | `email` (query en el string, `encodeURIComponent`) | ⚠️ href string, no objeto |
| Registro (`/login`, vista) | `screens/RegisterView.tsx:160` | "Registrarse con Google" ok | `router.replace` | `/(tabs)` | - | ✅ |
| Registro (`/login`, vista) | `screens/RegisterView.tsx` (`handleBack`) | Flecha atrás en paso 1 | Callback `toRegister` → `showRegister=false` | `LogInView` (vista local) | - | ⚠️ no-op si se abre como ruta `/login/RegisterView` |
| Registro (`/login`, vista) | `screens/RegisterView.tsx` (prop `toRegister`) | "Ingresar" (¿Ya tenés cuenta?) | Callback al padre → `showRegister=false` | `LogInView` (vista local) | - | ⚠️ idem |
| Registro (`/login`, vista) | `screens/RegisterView.tsx:150` | Error general de registro | `Alert.alert` (modal nativo) | - | - | ✅ |
| Recuperar contraseña (`/login/forgot-password`) | `screens/ForgotPasswordScreen.tsx:116` | Botón atrás | `safeBack` | `router.back()` o fallback `/login` | - | ✅ |
| Recuperar contraseña (`/login/forgot-password`) | `screens/ForgotPasswordScreen.tsx:96` | "Enviar código" ok | `router.push` | `/auth/verify-reset-code` | `email` | ✅ |
| Verificar email (`/auth/verify-email`) | `screens/VerifyEmailScreen.tsx:139` | Botón atrás | `safeBack` | `router.back()` o fallback `/login` | - | ✅ |
| Verificar email (`/auth/verify-email`) | `screens/VerifyEmailScreen.tsx:124` | "Ir a iniciar sesión" (tras verificar) | `logout()` + `router.replace` | `/login` | - | ✅ |
| Verificar código de reseteo (`/auth/verify-reset-code`) | `screens/VerifyResetCodeScreen.tsx:127` | Botón atrás | `safeBack` | `router.back()` o fallback `/login` | - | ✅ |
| Verificar código de reseteo (`/auth/verify-reset-code`) | `screens/VerifyResetCodeScreen.tsx:104` | "Continuar" | `router.push` | `/auth/reset-password` | `email`, `code` | ✅ |
| Nueva contraseña (`/auth/reset-password`) | `screens/ResetPasswordScreen.tsx:141` | Botón atrás | `safeBack` | `router.back()` o fallback `/login` | - | ✅ |
| Nueva contraseña (`/auth/reset-password`) | `screens/ResetPasswordScreen.tsx:127` | "Iniciar sesión" (éxito) | `router.replace` | `/login` | - | ✅ |
| Layout auth (`/auth/*`) | `app/auth/_layout.tsx` | - | Stack con `presentation: "modal"` (verify-email, verify-reset-code, reset-password) | - | - | ⚠️ sin guard inverso (usuario autenticado puede abrir `/auth/*` por deep link) |
| Términos (`/login/termsAndConditions`) | `screens/TermsAndConditionsScreen.tsx:39` | Botón atrás | `safeBack` | `router.back()` o fallback `/login` | - | ✅ |
| Términos (`/login/termsAndConditions`) | `screens/TermsAndConditionsScreen.tsx:76` | "Volver al inicio" | `router.replace` | `/login` | - | ✅ |
| Video de bienvenida (`/welcome-video`) | `screens/WelcomeVideoScreen.tsx:31` | `playToEnd`, timeout 8 s o "Saltar" | `router.replace` | `/(tabs)` | - | ✅ |
| Cambiar contraseña (`/(tabs)/profile/ChangePassword`) | `screens/ChangePasswordScreen.tsx:129` | Header atrás | `safeBack` | `router.back()` o fallback `/(tabs)/profile` | - | ✅ |
| Cambiar contraseña (`/(tabs)/profile/ChangePassword`) | `screens/ChangePasswordScreen.tsx:105` | "OK" del `Alert` de éxito | `Alert.alert` → `safeBack` | `router.back()` o fallback `/(tabs)/profile` | - | ✅ |
| Layout tabs (`/(tabs)/*`) | `app/(tabs)/_layout.tsx:25` | Sin sesión (guard) | `<Redirect>` | `/login` | - | ✅ |
| Layout raíz | `app/_layout.tsx:70` | Sin sesión y segmento protegido (`(tabs)`, `orders`, `chat`, `admin`, `service-form`, `search`, `upload-reel`) | `router.replace` (effect) | `/login` | - | ✅ |
| Rutas duplicadas | `app/login/LogInView.tsx`, `app/login/RegisterView.tsx` | - | Wrappers de ruta que renderizan la vista sin props | - | - | ⚠️ ver "Enlaces rotos / dudosos" |
| Tab bar (`/(tabs)/*`) | `src/components/CustomTabBar.tsx` (`onPress`) | Tap en un tab no enfocado (Inicio, Reels, Pedidos/Órdenes, Mensajes, Perfil) | `navigation.navigate` | `/(tabs)`, `/(tabs)/reels`, `/(tabs)/orders`, `/(tabs)/chat`, `/(tabs)/profile` | `route.params` | ✅ los 5 existen en `app/(tabs)/_layout.tsx`; `services` está oculto (`href: null`) |
| Tab bar (`/(tabs)/*`) | `src/components/CustomTabBar.tsx` (`onPress`) | Tap en el tab ya enfocado con stack anidado | `StackActions.popToTop` | Raíz del stack del tab (ej. `/(tabs)/profile`) | - | ✅ |
| Perfil (`/(tabs)/profile`) | `src/features/profile/ProfileScreen.tsx:349` | Tap en el avatar del hero | `router.push` | `/(tabs)/profile/EditProfile` | - | ✅ |
| Perfil (`/(tabs)/profile`) | `src/features/profile/ProfileScreen.tsx:408` | "Editar perfil" (botón del hero) | `router.push` | `/(tabs)/profile/EditProfile` | - | ✅ |
| Perfil (`/(tabs)/profile`) | `src/features/profile/ProfileScreen.tsx` | "Editar Perfil" (grupo "Mi cuenta") | `router.push` | `/(tabs)/profile/EditProfile` | - | ✅ |
| Editar perfil (`/(tabs)/profile/EditProfile`) | `src/features/users/screens/EditProfileScreen.tsx` | "Verificar" teléfono | `router.push` | `/(tabs)/profile/verify-phone` | - | ✅ |
| Proveedor (`/(tabs)/services/provider/[id]`) | `src/features/servicesUser/components/ServiceDetailModal.tsx:162` | "Solicitar Servicio" (modal de detalle) | cierra el modal + `router.push({ pathname, params })` | `/orders/quote` | `serviceId`, `serviceTitle`, `providerName` (los lee `QuoteRequestScreen`) | ✅ |
| Proveedor (`/(tabs)/services/provider/[id]`) | `src/features/servicesUser/components/ServiceDetailModal.tsx` | Abrir/cerrar detalle de servicio (lo monta `ProviderProfileScreen`) | `Modal` | - (modal, sin ruta) | - | ✅ |
| Banner premium (sin uso) | `src/components/PremiumBanner.tsx:35` | Ícono de búsqueda | `router.push` | `/search` | - | ✅ (componente sin importadores) |
| Banner premium (sin uso) | `src/components/PremiumBanner.tsx` | Ícono de notificaciones | `Pressable` sin `onPress` | - | - | ⚠️ no navega a ningún lado |
| CTA proveedor (sin uso) | `src/components/ProviderCTA.tsx:78` | "Convertirme en Proveedor" | `onPress={() => {}}` (no-op) | debería ir a `/(tabs)/profile/become-provider` | - | ⚠️ no navega (componente sin importadores) |
| Promo (sin uso) | `src/features/servicesUser/components/PromoBanner.tsx` | "Suscribirme" | `onPress={() => {}}` (no-op) | debería ir a `/(tabs)/profile/plans` | - | ⚠️ no navega (componente sin importadores) |
| Tarjeta profesional (sin uso) | `src/features/servicesUser/components/ProfesionalCard.tsx` | "Reservar" | `TouchableOpacity` sin `onPress` | - | - | ⚠️ no navega (solo lo importa `ProfesionalCarousel`, que no tiene importadores) |
| Carrusel de categorías (sin uso) | `src/components/CategoryVideoCarousel.tsx` | Tap en una categoría | callback `onSelectCategory(id)` | decide el padre (nadie lo monta) | `id` | ⚠️ sin importadores |
| Auth gate de carga | `src/features/auth/state/AuthContext.tsx:263` | Error de sesión: "Reintentar conexión" / "Cerrar sesión" | `setAttempt` (re-valida) / `logout()` | - / `/login` (por el guard de `app/_layout.tsx`) | - | ✅ |
| Infra (`app/_layout.tsx`) | `src/core/components/BiometricLockGate.tsx`, `ErrorBoundary.tsx`, `OfflineBanner.tsx`, `UpdateBanner.tsx` | Bloqueo biométrico, error de render, sin conexión, update disponible | Overlays / `applyUpdate` | - (sin navegación) | - | ✅ |
| Home (`/(tabs)`) | `src/features/servicesUser/screens/DashboardScreen.tsx:364` | Barra "Buscar servicios, profesionales…" | `router.push` | `/search` | - | ✅ |
| Home (`/(tabs)`) | `DashboardScreen.tsx:375`, `:433` | "Ver todo" de Categorías / Servicios populares | `router.push` | `/(tabs)/services` | - | ✅ |
| Home (`/(tabs)`) | `DashboardScreen.tsx:334` | Tap en una categoría | `router.push` | `/(tabs)/services/category/[id]` | `id`, `from=home` | ✅ |
| Home (`/(tabs)`) | `DashboardScreen.tsx:198` | Tap en servicio popular (`FeaturedCard`) | `router.push` | `/(tabs)/services/provider/[id]` | `id` (`providerId ?? id`), `from=home` | ✅ (⚠️ el CTA dice "Cotizar por chat", ver B34) |
| Home (`/(tabs)`) | `DashboardScreen.tsx:500` | CTA del hero (Explorar / Publicar / Ver pedidos) | `router.push(slide.route)` | `/(tabs)/services`, `/service-form` (solo proveedor), `/(tabs)/orders` | - | ✅ |
| Home (`/(tabs)`) | `DashboardScreen.tsx:327-330` | Quick actions Buscar / Pedidos / Mensajes / Publicar (solo proveedor) | `router.push` | `/search`, `/(tabs)/orders`, `/(tabs)/chat`, `/service-form` | - | ✅ |
| Home (`/(tabs)`) | `DashboardScreen.tsx:521` | Banner "¿Ofrecés servicios? Empezar ahora" (solo si `isProvider`) | `router.push` | `/(tabs)/profile` | - | ⚠️ audiencia/destino no coinciden (B33) |
| Home (`/(tabs)`) | `DashboardScreen.tsx:276` | "Quiero ofrecer servicios" en `RoleSelectionModal` | cierra el modal + `router.push` | `/(tabs)/profile/become-provider` | - | ✅ |
| Home (`/(tabs)`) | `DashboardScreen.tsx` + `RoleSelectionModal.tsx` | Primera visita del cliente / "Busco un servicio" / cerrar | `FullScreenModal` (flag `BOSKO_ROLE_MODAL_SEEN`) | - (modal, sin ruta) | - | ✅ |
| Home (`/(tabs)`) | `DashboardScreen.tsx` (`openNotifications`) | Campana del header | abre `NotificationsModalRoot` (store `notificationsUI`) | - (modal global) | - | ✅ |
| Servicios (`/(tabs)/services`) | `screens/ServicesScreen.tsx:80` | Tap en una categoría (`FeaturedCard`) | `router.push` | `/(tabs)/services/category/[id]` | `id` | ✅ |
| Servicios (`/(tabs)/services`) | `screens/ServicesScreen.tsx:99`, `:111` | Ícono de lupa / barra de búsqueda | `router.push` | `/search` | - | ✅ |
| Categoría (`/(tabs)/services/category/[id]`) | `screens/CategoryServicesScreen.tsx:245` | Tap en un profesional | `router.push` | `/(tabs)/services/provider/[id]` | `id` (`providerId ?? id`) | ✅ (⚠️ texto "Cotizar por chat", B34) |
| Categoría (`/(tabs)/services/category/[id]`) | `screens/CategoryServicesScreen.tsx:266-269` | Flecha atrás del hero | `router.replace` según `from` / `safeBack` | `/(tabs)` (`home`), `/(tabs)/profile/favorites` (`favorites`), `/search` (`search`), fallback `/(tabs)/services` | `from` | ✅ |
| Proveedor (`/(tabs)/services/provider/[id]`) | `screens/ProviderProfileScreen.tsx:100-103` | Flecha atrás (también en la vista de error) | `router.replace` según `from` / `safeBack` | `/(tabs)` (`home`), `/(tabs)/reels` (`reels`), `/search` (`search`), fallback `/(tabs)/services` | `from` | ✅ |
| Proveedor (`/(tabs)/services/provider/[id]`) | `screens/ProviderProfileScreen.tsx:228` | "Solicitar servicio" (footer) | `router.push` | `/orders/quote` | `serviceId` (`services[0]`), `providerName`, `serviceTitle` | ⚠️ siempre el primer servicio (B35) |
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
| Ruta huérfana | `app/(tabs)/profile/AddServices.tsx` | - | Registrada solo en `profile/_layout.tsx`; renderiza `ServiceFormScreen` | - | - | ⚠️ nadie navega ahí (B36) |

## Enlaces rotos / dudosos

| Origen | Archivo:línea | Destino | Problema |
|---|---|---|---|
| Registro | `src/features/auth/screens/RegisterView.tsx:139` | `/auth/verify-email?email=…` | Href armado con template string en vez de `{ pathname, params }`; la ruta existe, pero no hay chequeo de tipos de params. |
| Login / Registro (rutas) | `app/login/LogInView.tsx`, `app/login/RegisterView.tsx` | `/login/LogInView`, `/login/RegisterView` | Rutas huérfanas (nadie navega ahí; `/login` ya muestra ambas vistas vía `LoginIndex`). Si se abren, `toRegister` queda `undefined`: "Registrarse", "Ingresar" y la flecha atrás del paso 1 no hacen nada. |
| Términos | `app/login/termsAndConditions.tsx` | `/login/termsAndConditions` | Sin entrada: ninguna pantalla enlaza a Términos (ni el registro ni el login). El banner de la pantalla asume que viene post-registro. |
| Verificar email / reseteo | `app/auth/_layout.tsx` | `/auth/*` | Sin guard inverso: un usuario autenticado puede abrir `/auth/verify-email` o `/auth/reset-password` por deep link. |
| Video de bienvenida | `app/welcome-video.tsx` | `/welcome-video` | Sin guard: se puede abrir por deep link sin sesión (termina en `/(tabs)` → redirige a `/login`) y sin el flag `WELCOME_VIDEO_PENDING_KEY`. |
| Banner premium | `src/components/PremiumBanner.tsx` | (ícono de notificaciones) | Botón sin `onPress`; además el componente no tiene importadores. |
| CTA proveedor / Promo | `src/components/ProviderCTA.tsx:78`, `src/features/servicesUser/components/PromoBanner.tsx` | `become-provider` / `plans` (inferidos) | `PremiumButton` con `onPress` no-op; ninguno de los dos tiene importadores. |
| Tarjeta profesional | `src/features/servicesUser/components/ProfesionalCard.tsx` | "Reservar" | Sin `onPress`; solo la usa `ProfesionalCarousel`, que no se monta en ningún lado. |
| Home | `DashboardScreen.tsx:521` | `/(tabs)/profile` | Banner "¿Ofrecés servicios?" se muestra solo a proveedores y no lleva a `become-provider` ni a publicar (B33). |
| Proveedor | `ProviderProfileScreen.tsx:228` | `/orders/quote` | Siempre cotiza `services[0]` (B35). |
| Home / Categoría | `DashboardScreen.tsx:195`, `CategoryServicesScreen.tsx:141` | `/(tabs)/services/provider/[id]` | CTA "Cotizar por chat" lleva al perfil, no al chat (B34). |
| Publicar (ruta duplicada) | `app/(tabs)/profile/AddServices.tsx` | `/(tabs)/profile/AddServices` | Sin entrada: nadie enlaza (B36); duplica `/service-form`. |

## Pantallas sin entrada

Rutas de `app/` a las que no llega ningún enlace (huérfanas).

_Se completa en T13 cruzando "Rutas existentes" con la columna "Destino"._
