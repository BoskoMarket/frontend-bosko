# Mapa de navegación

Se completa durante la migración del design system (`odd/tasks/design-system-centralization.md`): cada pantalla migrada agrega sus salidas acá.

Qué registrar por pantalla: cada `router.push/replace/back/navigate`, `<Link href>`, `<Redirect>`, guards de `_layout`, y aperturas de modales o URLs externas.

Validación: el destino tiene que existir como ruta en `app/` (respetando grupos `(tabs)` y params `[id]`). Si no existe, o los params no coinciden → estado ❌ y fila en "Enlaces rotos".

Estados: ✅ ok · ❌ roto · ⚠️ dudoso (ruta dinámica armada con string, param opcional, destino condicional).

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
| `/(tabs)/profile/upload-reel` | `app/(tabs)/profile/upload-reel.tsx` |
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
| `/welcome-video` | `app/welcome-video.tsx` |

Layouts: `app/(tabs)/_layout.tsx`, `app/(tabs)/profile/_layout.tsx`, `app/(tabs)/profile/kyc/_layout.tsx`, `app/(tabs)/services/_layout.tsx`, `app/_layout.tsx`, `app/auth/_layout.tsx`, `app/chat/_layout.tsx`, `app/login/_layout.tsx`, `app/orders/_layout.tsx`.

## Salidas por pantalla

| Pantalla (ruta) | Archivo | Disparador (UI) | Acción | Destino | Params | Estado |
|---|---|---|---|---|---|---|
| Gate (`/`) | `app/index.tsx` | Auth aún cargando | Render (sin navegar) | `AnimatedSplashScreen` (`onDone` es no-op) | - | ✅ |
| Gate (`/`) | `app/index.tsx` | Sesión activa | `<Redirect>` | `/(tabs)` | - | ✅ |
| Gate (`/`) | `app/index.tsx` | Sin sesión | Render inline | `OnBoarding` | - | ✅ |
| Onboarding (`/`) | `screens/OnBoarding.tsx:80` | "Saltar" / "Comenzar" (último slide) | `router.replace` | `/login` | - | ✅ |
| Onboarding (`/`) | `screens/OnBoarding.tsx:84` | `onboardingComplete` ya guardado | `<Redirect>` | `/login` | - | ✅ |
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
| Video de bienvenida (`/welcome-video`) | `screens/WelcomeVideoScreen.tsx:33` | `playToEnd`, timeout 8 s o "Saltar" | `router.replace` | `/(tabs)` | - | ✅ |
| Cambiar contraseña (`/(tabs)/profile/ChangePassword`) | `screens/ChangePasswordScreen.tsx:129` | Header atrás | `safeBack` | `router.back()` o fallback `/(tabs)/profile` | - | ✅ |
| Cambiar contraseña (`/(tabs)/profile/ChangePassword`) | `screens/ChangePasswordScreen.tsx:105` | "OK" del `Alert` de éxito | `Alert.alert` → `safeBack` | `router.back()` o fallback `/(tabs)/profile` | - | ✅ |
| Layout tabs (`/(tabs)/*`) | `app/(tabs)/_layout.tsx:25` | Sin sesión (guard) | `<Redirect>` | `/login` | - | ✅ |
| Layout raíz | `app/_layout.tsx:70` | Sin sesión y segmento protegido (`(tabs)`, `orders`, `chat`, `admin`, `service-form`, `search`) | `router.replace` (effect) | `/login` | - | ✅ |
| Rutas duplicadas | `app/login/LogInView.tsx`, `app/login/RegisterView.tsx` | - | Wrappers de ruta que renderizan la vista sin props | - | - | ⚠️ ver "Enlaces rotos / dudosos" |

## Enlaces rotos / dudosos

| Origen | Archivo:línea | Destino | Problema |
|---|---|---|---|
| Registro | `src/features/auth/screens/RegisterView.tsx:139` | `/auth/verify-email?email=…` | Href armado con template string en vez de `{ pathname, params }`; la ruta existe, pero no hay chequeo de tipos de params. |
| Login / Registro (rutas) | `app/login/LogInView.tsx`, `app/login/RegisterView.tsx` | `/login/LogInView`, `/login/RegisterView` | Rutas huérfanas (nadie navega ahí; `/login` ya muestra ambas vistas vía `LoginIndex`). Si se abren, `toRegister` queda `undefined`: "Registrarse", "Ingresar" y la flecha atrás del paso 1 no hacen nada. |
| Términos | `app/login/termsAndConditions.tsx` | `/login/termsAndConditions` | Sin entrada: ninguna pantalla enlaza a Términos (ni el registro ni el login). El banner de la pantalla asume que viene post-registro. |
| Verificar email / reseteo | `app/auth/_layout.tsx` | `/auth/*` | Sin guard inverso: un usuario autenticado puede abrir `/auth/verify-email` o `/auth/reset-password` por deep link. |
| Video de bienvenida | `app/welcome-video.tsx` | `/welcome-video` | Sin guard: se puede abrir por deep link sin sesión (termina en `/(tabs)` → redirige a `/login`) y sin el flag `WELCOME_VIDEO_PENDING_KEY`. |

## Pantallas sin entrada

Rutas de `app/` a las que no llega ningún enlace (huérfanas).

_Se completa en T13 cruzando "Rutas existentes" con la columna "Destino"._
