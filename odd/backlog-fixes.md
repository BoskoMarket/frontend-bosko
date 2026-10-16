# Backlog de correcciones

Todo lo que **no se usa, está roto, no navega o es un stub**, encontrado durante la migración del design system (`odd/tasks/design-system-centralization.md`). No se corrige durante la migración (salvo trivial): se corrige después, en tareas propias.

Cada ítem dice **dónde está exactamente**, **qué hace hoy** y **qué debería hacer**. "Qué debería hacer" marcado *(propuesto)* es una inferencia del código: confirmar con producto antes de implementar.

Tipos: `sin-uso` · `roto` · `no-navega` · `stub` · `nav-guard` · `visual` · `deuda`.
Estados: ⬜ pendiente · 🟡 en curso · ✅ resuelto (con commit) · ❔ requiere decisión.

Los números de línea corresponden a la rama donde se registró (`Origen`); si el archivo se tocó después, buscar por el símbolo indicado.

| ID | Tipo | Dónde (archivo:línea · símbolo) | Qué hace hoy | Qué debería hacer | Origen | Estado |
|---|---|---|---|---|---|---|
| B01 | sin-uso | `src/components/PremiumBanner.tsx` (componente entero) | Nadie lo importa. | Montarlo donde corresponda (home/perfil de proveedor) o borrarlo. ❔ | T5 | ❔ |
| B02 | no-navega | `src/components/PremiumBanner.tsx:~44` · `Pressable` con ícono `notifications-outline` | Botón sin `onPress`: no hace nada. | Abrir el modal global de notificaciones (`NotificationsModalRoot`, montado en `app/_layout.tsx:18`, definido en `features/notifications/screens/NotificationsScreen.tsx`) con el mismo trigger que usa el resto de la app *(propuesto)*. | T5 | ⬜ |
| B03 | sin-uso | `src/components/ProviderCTA.tsx` (componente entero) | Nadie lo importa. | Montarlo para usuarios cliente (home/perfil) *(propuesto)* o borrarlo. ❔ | T5 | ❔ |
| B04 | no-navega | `src/components/ProviderCTA.tsx:78` · `PremiumButton onPress={() => { }}` | "Convertirme en Proveedor" es no-op. | `router.push('/(tabs)/profile/become-provider')`. | T5 | ⬜ |
| B05 | sin-uso | `src/components/FeaturesSection.tsx` (componente entero) | Nadie lo importa. | Montar o borrar. ❔ | T5 | ❔ |
| B06 | sin-uso | `src/components/CategoryVideoCarousel.tsx` (componente entero, callback `onSelectCategory(id)`) | Nadie lo importa. | Si se monta (home), tap → `/(tabs)/services/category/[id]` *(propuesto)*; si no, borrar. ❔ | T5 | ❔ |
| B07 | sin-uso | `src/features/servicesUser/components/PromoBanner.tsx` (componente entero) | Nadie lo importa. | Montar o borrar. ❔ | T5 | ❔ |
| B08 | no-navega | `src/features/servicesUser/components/PromoBanner.tsx:15` · `onPress={() => {}}` | "Suscribirme" es no-op. | `router.push('/(tabs)/profile/plans')`. | T5 | ⬜ |
| B09 | sin-uso | `src/features/servicesUser/components/ProfesionalCarousel.tsx` + `ProfesionalCard.tsx` | `ProfesionalCard` solo lo usa `ProfesionalCarousel`, y el carrusel no se monta en ningún lado. | Montar (home: profesionales destacados) o borrar ambos. ❔ | T5 | ❔ |
| B10 | no-navega | `src/features/servicesUser/components/ProfesionalCard.tsx:28` · `TouchableOpacity` "Reservar" | Sin `onPress`. | Ir al perfil del proveedor `/(tabs)/services/provider/[id]` o a `/orders/quote` con el servicio *(propuesto)*. | T5 | ⬜ |
| B11 | deuda | `src/features/servicesUser/components/ServiceDetailModal.tsx:49` · `formatRate` | Función declarada y sin uso; el modal no muestra el precio. | Mostrar el precio/tarifa en el modal *(propuesto)* o borrar `formatRate`. ❔ | T5 | ❔ |
| B12 | stub | `src/features/auth/screens/VerifyEmailScreen.tsx:101` · `handleResend` | No llama a ningún endpoint; `resending`/`cooldown` nunca se activan → "Reenviar en Ns" inalcanzable. | Llamar a `POST /auth/resend-verification` (falta en backend), activar cooldown 60s y toast de éxito/error. | T4 | ⬜ (bloqueado por backend) |
| B13 | visual | `src/features/auth/screens/VerifyEmailScreen.tsx:109` · `<AnimatedBackground>` solo en la vista de éxito | La vista del OTP no tiene el fondo animado que sí tienen éxito y el resto del flujo. | Montar `AnimatedBackground` también en la vista del OTP *(propuesto)*. | T4 | ⬜ |
| B14 | roto | `app/login/LogInView.tsx`, `app/login/RegisterView.tsx` (rutas) | Rutas huérfanas: renderizan las vistas sin props → "Registrarse", "Ingresar" y flecha atrás del paso 1 no hacen nada. `/login` ya muestra ambas vía `LoginIndex`. | Borrar ambos archivos de ruta. | T4 | ⬜ |
| B15 | deuda | `src/features/auth/screens/RegisterView.tsx:68,129` · prop `toRegister` | El prop se llama `toRegister` pero en Register significa "volver a login". | Renombrar a `toLogin` (y en `LoginIndex`). | T4 | ⬜ |
| B16 | deuda | `src/features/auth/screens/RegisterView.tsx:139` · `router.push(\`/auth/verify-email?email=…\`)` | Href armado como string. | `router.push({ pathname: '/auth/verify-email', params: { email } })`. | T4 | ⬜ |
| B17 | no-navega | `app/login/termsAndConditions.tsx` (ruta `/login/termsAndConditions`) | Ninguna pantalla enlaza a Términos. | Link "Términos y condiciones" en el paso final del registro (y opcional en login) → `/login/termsAndConditions`. | T4 | ⬜ |
| B18 | nav-guard | `app/auth/_layout.tsx` | Sin guard inverso: un usuario autenticado puede abrir `/auth/verify-email`, `/auth/verify-reset-code`, `/auth/reset-password` por deep link. | Revisar flujo: verify-email sí puede necesitar sesión (post-registro). Definir regla por pantalla y agregar `<Redirect>` donde aplique. ❔ | T4 | ❔ |
| B19 | nav-guard | `app/welcome-video.tsx` | Se puede abrir sin sesión y sin el flag `WELCOME_VIDEO_PENDING_KEY`. | Si no hay sesión → `<Redirect href="/login">`; si no hay flag → `/(tabs)`. | T4 | ⬜ |
| B20 | deuda | `src/core/design-system/tokens.ts:25` · `TOKENS.color.success` | Mismo valor que `mint` (duplicado). | Dejar uno como alias del otro o unificar. | T1 | ⬜ (T13) |
| B21 | visual | `src/core/design-system/components/OtpInput.tsx` | Borrar un dígito del medio corre los siguientes a la izquierda (`value` es string). | Mantener posición por caja (`value: string[]`). Aceptado por ahora. | T3 | ⬜ (baja) |
| B22 | visual | `src/features/servicesUser/components/CategoryChips.tsx:34` | Fondo blanco y borde fijos → se rompe en dark. | Usar `Chip` del DS. | T3 | ⬜ (se resuelve en T6) |
| B23 | visual | `src/features/profile/ProfileScreen.tsx:215` | Chevron con `tc.border` → casi invisible. | `ListRow` / `tc.textMuted`. | T3 | ⬜ (se resuelve en T9) |

## Pendientes de verificar en dispositivo (light + dark)

No son bugs confirmados: cambios visuales de la migración que hay que mirar.

| Origen | Qué mirar |
|---|---|
| T3 | `Button`, `Card`, `IconCircle`, etc. ya no fuerzan look dark en light |
| T4 | Pantallas auth en light; hero de Forgot centrado; wordmark login; divisor "o"; VerifyResetCode sin animación por caja; éxito de Reset con `IconCircle`; ChangePassword con `ScreenHeader` + `Card` |
| T5 | TabBar (`tc.surface`, antes `#141414` fijo); BrandMark en light; Splash/Onboarding/Welcome en light; ThemeToggle; ProfesionalCard; bottom sheet de EditProfile; ServiceDetailModal (BlurView tint + hero); pantalla de reintento de `AuthContext` |
