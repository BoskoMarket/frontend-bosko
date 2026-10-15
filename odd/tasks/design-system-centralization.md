# Centralización del design system (rebrand-ready)

## Objetivo

Que todo el branding de Bosko (colores, tipografía, gradientes, sombras, nombre, assets) viva en `src/core/design-system/` y se pueda reemplazar ("montar / desmontar") cambiando un único archivo de marca, sin tocar pantallas.

## Problema

Auditoría 2026-10-05 (`app/` + `src/`):

- ~1091 literales hex/`rgba()` en 89 archivos; solo ~120 están dentro del design system → ~970 sueltos en pantallas.
- Gradientes de marca escritos a mano (`['#FF2D6F', '#850021', '#3C0014']`) en `OnBoarding.tsx`, `RegisterView.tsx`, etc.
- `fontFamily: 'Archivo_700Bold'` / `'JetBrainsMono_500Medium'` literales en todo `features/auth` en vez de `FONT_FAMILY`.
- `#EDEAF5` / `rgba(237,234,245,0.55)` copiados en vez de `tc.text` / `tc.textSub`.
- `TOKENS.color.bg/text/sub` son restos light-only que siguen existiendo.
- Brand primitives duplicados entre `tokens.ts`, `palette.ts` y `premium.ts`.
- Fuentes cargadas en `app/_layout.tsx` con nombres hardcodeados; `app.json` (nombre, icon, splash) fuera del sistema.
- "Bosko" aparece 37 veces en 30 archivos (copy + keys de storage).
- Sin guardia: nada impide reintroducir literales.

## Regla (vigente desde 2026-10-05)

Nada hardcodeado fuera de `src/core/design-system/`. Siempre tokens + componentes del DS. Si falta un token o un componente, se agrega al DS primero y después se usa. Documentada en `CLAUDE.md` → "Design system".

## Arquitectura objetivo

```
src/core/design-system/
  brand/
    brand.ts          ← ÚNICO archivo a cambiar en un rebrand: primitivos de color, fuentes, nombre, assets
    fonts.ts          ← mapa de fuentes (useFonts) derivado de brand
  palette.ts          ← semánticos dark/light, derivados de brand (tc.*)
  tokens.ts           ← radius, shadows, status, scrims — derivados de brand
  gradients.ts        ← presets derivados de brand
  premium.ts          ← derivado de brand
  typography.ts       ← FONT_FAMILY y TYPE_SCALE derivados de brand/fonts
  components/         ← todo primitivo reutilizable de UI
```

Capas: **primitivos (brand)** → **semánticos (palette/tokens/gradients)** → **componentes**. Las pantallas solo consumen semánticos y componentes, nunca primitivos.

Decisiones:

- Las keys de storage (`BOSKO_FAVORITES_v2`, theme, appLock, …) **no** se renombran en un rebrand: se aíslan en una constante `STORAGE_PREFIX` estable para no borrar datos de usuarios.
- El copy visible con el nombre de la app usa `BRAND.name`.
- `app.json` pasa a `app.config.ts`, que lee nombre / icon / splash / colores de `brand.ts`.
- Colores fijos que no dependen del tema (texto sobre video, sobre gradiente de marca) se modelan como tokens semánticos (`onPrimary`, `onMedia`, `scrim.*`), no como `'#fff'`.

## Guardia automática

Regla ESLint (`no-restricted-syntax`) fuera de `src/core/design-system/**`:

- literales `#rgb` / `#rrggbb` / `#rrggbbaa`, `rgb(`/`rgba(`/`hsl(`, y nombres (`'white'`, `'black'`)
- `fontFamily` con literal string

Arranca en `warn` (no rompe el build durante la migración) y pasa a `error` al cerrar la última feature.

## Checks

- Modo TDD: no configurado → checks funcionales.
- Por tarea: `npm run lint`, `npx tsc --noEmit`, `npm test`, conteo de violaciones de la regla (debe bajar, nunca subir), revisión visual dark + light de las pantallas tocadas.
- Final: violaciones = 0 con regla en `error`; "simulacro de rebrand" (cambiar `brand.ts` a una marca dummy y verificar que toda la app cambia).

## Entrega

Forecast: muy por encima de ~400 líneas → PRs encadenados, una tarea (o feature) por slice.

**Estrategia (decidida 2026-10-05): `ask-on-risk` → cadena apilada contra `dev`** (no `main`: `dev` está 28 commits adelante de `main`; esos commits ajenos ensuciarían el primer PR). Cada slice es una rama que sale de la anterior; los PRs se abren contra la rama previa (el primero contra `dev`) y se mergean en orden. Abrir PRs / push / merge: decisión del usuario.

| Slice | Rama | Base del PR | Commits | Estado |
|---|---|---|---|---|
| 1 — regla, brand layer, guardia | `feat/design-system-centralization` | `dev` | `570e447` `23c9164` `5cb9cb7` `4ce0c02` `c0caff3` | listo para PR |
| 2 — componentes DS (T3) | `feat/ds-t3-components` | `feat/design-system-centralization` | `fc05bf3` `4f6cb90` | listo para PR |
| 3 — migración auth (T4) | `feat/ds-t4-auth` | `feat/ds-t3-components` | `f778e7e` `e9b7e49` `62215d2` | listo para PR |
| 4 — componentes compartidos + premium theme-aware (T5) | `feat/ds-t5-shared` | `feat/ds-t4-auth` | `335c95a` `69a7162` `46f9c0c` `daae378` + docs | listo para PR |
| 5 — marketplace / servicesUser (T6) | `feat/ds-t6-services` | `feat/ds-t5-shared` | `416bb3a` `0505f99` `9fe6408` `b23700f` + docs | listo para PR |

## Inventario de componentes (T3)

Muestra (rg + lectura parcial de LogInView, VerifyEmailScreen, ProfileScreen, ConversationsListScreen, DashboardScreen, CategoryChips, KYCStatusScreen, FavoritesScreen). Conteos aproximados sobre `src/** app/**`.

| Patrón repetido a mano | Ocurrencias | Decisión |
|---|---|---|
| Tarjeta de vidrio de auth (wrapper `cardGlow` + `cardShadow` + BlurView + borde) | login/register/forgot/reset/verify-email/verify-reset (~6 pantallas, estilo copiado idéntico) | **`AuthCard`** (nuevo) |
| Casillas de código OTP (`TextInput` x6 + refs + backspace) | VerifyEmail, VerifyResetCode, VerifyPhone (3) | **`OtpInput`** (nuevo, controlado, soporta pegar) |
| Avatar foto o inicial con gradiente + punto online | Conversations, Profile, Chat, Search, Dashboard, ProfesionalCard, Reviews, Admin (~12 archivos) | **`Avatar`** (nuevo) |
| Pill de estado con `TOKENS.status.*` fg/bg | 16 archivos (KYC, órdenes, favoritos, planes, admin…) | **`Badge`** (nuevo; `tone` = clave de `TOKENS.status` | brand | neutral) |
| Chips de filtro/categoría | ~15 archivos (CategoryChips, Search, Dashboard, ServiceForm…) | **`Chip`** (nuevo) |
| Fila de ajustes (ícono + label + chevron / badge) | ProfileScreen (3), Search, Favorites, RoleSelectionModal… (8 archivos con chevron-forward) | **`ListRow`** (nuevo) |
| Título de sección + link "Ver todo" | 10 archivos (`sectionTitle`/`sectionLink`) | **`SectionHeader`** (nuevo) |
| Separador `height: 1` | 7 archivos | **`Divider`** (nuevo) |
| `TextInput` suelto | 21 archivos (varios son multilínea/búsqueda/chat) | `Input` movido al DS; los `TextInput` de chat/search/multilínea no se fuerzan: se migran caso a caso en T4–T11 |
| CTA con gradiente de marca (`LinearGradient colors={GRADIENTS.brand}`) | 29 archivos | **`Button` primary ya cubre el botón**; las tarjetas-CTA (ProviderCTA, PromoBanner) son composiciones propias → se dejan, solo tokens |
| Empty state, toast | 8 y 7 usos | **`EmptyState`**, **`toast`/`ToastRoot`** movidos al DS (ruta vieja re-exporta) |
| `OfflineBanner` / `UpdateBanner` | 1 uso c/u (`_layout`) | **No se mueven**: dependen de infra (`onlineManager`, `useAppUpdates`). Se quedan en `core/components`, solo se les sacaron los literales |
| `ErrorBoundary`, `BiometricLockGate`, `BlurView`, `MotiView`, `AppBackground`, `RadialBlob` | infra / wrappers de plataforma | **No se mueven** (infra o shim de plataforma, no UI genérica) |
| `BrandMark` (logo) | no hay patrón repetido en la muestra | **Diferido**: se crea en T12 junto con `BRAND.name` |

Cambios al DS existente en esta tarea: sacados todos los literales de `Button`, `Card`, `IconCircle`, `NoticeBanner`, `StepTimeline`, `ScreenHeader`, `Skeleton` (ahora theme-aware vía `tc.*`; en dark el resultado es el mismo, en light dejan de verse "siempre oscuros"). Nuevo token `BRAND.colors.mintDeep` → `TOKENS.color.mintDeep` + `GRADIENTS.success`. `Toast` pasa de los verdes/rojos propios (#22C55E/#EF4444/#F59E0B) a `TOKENS.status.*` (cambio visual menor). `EmptyState` usa `Button` en vez de su CTA a mano (cambio visual menor).

## Tareas

| ID | Tarea | Ruta | Estado |
|----|-------|------|--------|
| T0 | Regla en `CLAUDE.md` + memoria; este plan | inline | ✅ |
| T1 | Capa de marca: `brand/brand.ts` + `fonts.ts`; `palette`/`tokens`/`gradients`/`premium`/`typography` derivan de brand; marcar `TOKENS.color.bg/text/sub` como `@deprecated` (129 usos en ~25 archivos → se eliminan en cada feature, borrado final en T13); agregar semánticos faltantes (`onPrimary`, `onMedia`, `scrim.*`); `app/_layout.tsx` usa `fonts.ts` | delegada (2+ archivos no triviales) | ✅ `23c9164` |
| T2 | Guardia ESLint en `warn` + script de conteo de violaciones (baseline registrado aquí) | inline | ✅ `5cb9cb7` |
| T3 | Inventario y alta de componentes faltantes en el DS: `Input` (mover desde `core/components`), `GradientButton`/variante brand de `Button`, `Chip`, `Badge/StatusPill`, `Avatar`, `OtpInput`, `AuthCard`, `EmptyState`, `Toast`, banners, `BrandMark` | delegada | ✅ |
| T4 | Migrar `features/auth` (~14 pantallas) | delegada | ✅ `f778e7e` `e9b7e49` |
| T5 | Migrar `src/components` + `src/core/components` compartidos (TabBar, ThemeToggle, ProviderCTA, Premium*, banners) + pasar Splash / Onboarding / WelcomeVideo a theme-aware (regla "todo sigue el tema") | delegada | ✅ `335c95a` `69a7162` `46f9c0c` `daae378` |
| T6 | Migrar `features/servicesUser` (~16 archivos, incl. Dashboard, ServiceForm, ProviderProfile) | delegada | ✅ `416bb3a` `0505f99` `9fe6408` `b23700f` |
| T7 | Migrar `features/orders` + `features/payments` + `features/plans` | delegada | ✅ `59a3718` `10e2f45` `ef13490` |
| T8 | Migrar `features/kyc` + `features/admin` | delegada | ✅ `8c9f027` `897e045` `e92653e` |
| T9 | Migrar `features/profile` + `features/users` (+ registro de faltantes UX `odd/ux-gaps.md`) | delegada | ✅ `a5d10d7` `34e36a7` `3bc12a0` `6e6599f` `4d4b69a` `253ca7b` |
| T10 | Migrar `features/chat` + `features/reels` (media: tokens `onMedia`/`scrim`) | delegada | ✅ `55a83b4` `a255c83` `e0347d0` `8ec52a1` `4bfbd12` |
| T11 | Migrar resto: reviews, notifications, search, favorites, appConfig, `serviceCategories.ts` | delegada | ⬜ |
| T12 | Nombre de marca: `BRAND.name` en copy, `STORAGE_PREFIX` estable, `app.json` → `app.config.ts` desde brand | delegada | ⬜ |
| T13 | ESLint a `error`, violaciones = 0, simulacro de rebrand, actualizar `CLAUDE.md`; cerrar `nav-map.md` (pantallas huérfanas) | inline | ⬜ |
| T14 | Diagrama navegable del flujo (estilo prototipo Figma) generado desde `odd/nav-map.md` + tareas para los enlaces rotos | delegada | ⬜ |

## Cómo retomar (si se corta la sesión)

1. `git switch feat/design-system-centralization` y `git log --oneline dev..HEAD` → qué tareas ya tienen commit.
2. Leer este archivo: tabla de tareas (estado) + "Progreso / evidencia" + "Próximo paso".
3. Engram: `mem_search "design-system-centralization"` → observación `odd/design-system-centralization/tasks`.
4. Si una tarea quedó a medias (`🟡`): `git status` / `git diff` para ver lo no commiteado; terminarla antes de abrir otra.
5. Conteo de violaciones (desde T2): `npm run lint:ds` → comparar contra el último valor registrado abajo.

Estados: ⬜ pendiente · 🟡 en curso · ✅ hecho (con commit) · ⛔ bloqueado.
Cada tarea se cierra con: checks verdes → commit → actualizar tabla + progreso + próximo paso acá y en Engram.

## Política de "mientras estamos ahí"

Al migrar cada pantalla ya se lee el archivo entero, así que anotar problemas sale casi gratis:

- **Siempre**: registrar en "Hallazgos" bugs, UX rotos, código muerto o pantallas sin entrada de navegación (archivo:línea + 1 línea de descripción).
- **Arreglar en el momento** solo lo trivial y local (≤ ~10 líneas, sin decisión de producto): typo, color que falla en light/dark, `key` faltante, import muerto. Va en un commit `fix(...)` separado del de migración.
- **Mapa de navegación**: por cada pantalla migrada, registrar todas sus salidas (push/replace/back, `Link`, `Redirect`, guards, modales, URLs externas) en `odd/nav-map.md` y validar que el destino exista en `app/`. Rotos → sección "Enlaces rotos" de ese archivo (no se arreglan en la migración salvo que sea trivial).
- **Backlog de correcciones** (decisión del usuario 2026-10-05): todo lo que **no se usa, está roto, no navega o es un stub** va a `odd/backlog-fixes.md` con ID `Bnn`, archivo:línea + símbolo exacto, qué hace hoy y qué debería hacer (marcar *(propuesto)* si es inferencia). No se corrige en la migración salvo trivial; se corrige después. Verificar antes de anotar (ej. buscar importadores) — no inventar.
- **No** mezclar en la migración: cambios de comportamiento, navegación nueva, prototipos o refactors grandes. La migración tiene que ser visualmente equivalente para poder verificarla; lo demás se convierte en tarea propia al final.

## Hallazgos

| Archivo:línea | Problema | Acción |
|---|---|---|
| `src/core/design-system/premium.ts` (`colorPrimary`) | `#850221` / `#5c0117` ≠ brand `#850021` / `#3C0014`; probable typo heredado de `Colors.ts`. Guardados aparte en `BRAND.colors.premium.*` | ✅ Resuelto en T5: `PREMIUM_PALETTE.*.primary/primaryDark` = brand |
| `src/core/design-system/tokens.ts` | `TOKENS.color.success` === `mint` (duplicado) | Unificar en T13 |
| `src/features/auth/screens/VerifyEmailScreen.tsx:80-90` | Cajas OTP con `maxLength={1}`: pegar/autocompletar el código no funciona | T4: reemplazar por `OtpInput` |
| `src/features/servicesUser/components/CategoryChips.tsx:34` | Fondo blanco + borde `rgba(0,0,0,0.06)` fijos → se rompe en dark | T6: `Chip` |
| `src/features/chat/screens/ConversationsListScreen.tsx:116` | Borde `rgba(255,45,111,0.25)` hardcodeado | T10 |
| `src/features/profile/ProfileScreen.tsx:215` | Chevron con `tc.border` → casi invisible | T9: `ListRow` |
| `src/core/design-system/components/OtpInput` | Borrar un dígito del medio corre los siguientes a la izquierda (`value` string) | Aceptado; pasar a `string[]` si molesta |
| DS components (`Button`, `Card`, `IconCircle`, …) | En T3 dejaron de forzar look dark en light mode (ahora usan `tc.*`) | **Revisar visualmente en light** en T4 → pendiente de verificación en dispositivo (pantallas auth ahora siguen el tema, ver Progreso T4) |
| `src/features/auth/components/OnBoardingSlide.tsx` | Componente sin ningún import en `src/` ni `app/` (código muerto; el onboarding real es `screens/OnBoarding.tsx`). Se migró igual a tokens para no dejar violaciones | ✅ Borrado en T5 (`daae378`) |
| `src/features/auth/screens/VerifyEmailScreen.tsx` (`handleResend`) | Stub: no llama a ningún endpoint (TODO backend `POST /auth/resend-verification`); `resending` y `cooldown` nunca se activan → la UI de "Reenviar en Ns" es inalcanzable | Tarea propia cuando el backend exponga el endpoint |
| `src/features/auth/screens/VerifyEmailScreen.tsx` | La vista del OTP no monta `AnimatedBackground` (la de éxito sí) → fondo distinto entre ambos estados; las demás pantallas del flujo sí lo tienen | Decidir si se agrega (cambio visual) |
| `src/features/auth/screens/LoginIndex.tsx` + `app/login/LogInView.tsx` / `RegisterView.tsx` | Rutas duplicadas huérfanas; el prop `toRegister` de `RegisterView` en realidad "vuelve a login" (nombre engañoso) y sin él los botones no hacen nada | Borrar las 2 rutas o renombrar prop (T13 / tarea propia) |
| `src/features/auth/screens/ForgotPasswordScreen.tsx` | El círculo hero (icono llave) quedaba alineado a la izquierda del bloque (sin `alignSelf`); al migrar a `IconCircle` quedó centrado | Verificar en dispositivo (se asume que era un bug) |
| `src/features/auth/state/AuthContext.tsx:263-266` | Pantalla de "Reintentar conexión / Cerrar sesión" usa `Button` nativo de RN (sin estilo del DS) y `Text` suelto | ✅ Resuelto en T5: `Button`/`Text` del DS |
| `src/components/BrandMark.tsx`, `src/components/AnimatedBackground.tsx` | Siguen con literales (`#EDEAF5`, `#850021`, `rgb(255,45,111)`…); las pantallas auth los usan | ✅ Resuelto en T5 (BrandMark ahora sigue el tema: tinta `tc.text`) |
| `src/components/{PremiumBanner,ProviderCTA,FeaturesSection,CategoryVideoCarousel}.tsx`, `src/features/servicesUser/components/{PromoBanner,ProfesionalCard,ProfesionalCarousel}.tsx` | Sin importadores (código muerto; `ProfesionalCard` solo lo usa `ProfesionalCarousel`). Migrados igual a tokens/tema. Varios botones sin navegación (`onPress` no-op / ausente), ver `odd/nav-map.md` | Borrar o conectar (T6 / T13) |
| `src/features/servicesUser/components/ServiceDetailModal.tsx` | `formatRate` declarada y sin uso; estilos `priceRow/priceLabel/priceValue` sin uso (se eliminaron al migrar) | Decidir si el modal debe mostrar el precio (T6) |
| `__tests__/designSystemComponents.test.tsx:175` | `tsc` fallaba por `n` implícito (error ya existente desde T4: `tsc` no estaba limpio) | ✅ Corregido en T5 (`46f9c0c`) |
| Auth flow (`/auth/*`, `/welcome-video`, `/login/termsAndConditions`) | Sin guard inverso / sin entrada de navegación; detalle en `odd/nav-map.md` → "Enlaces rotos / dudosos" | Tarea de navegación (T14) |

## Progreso / evidencia

- 2026-10-05: auditoría y plan.
- 2026-10-05 T1 ✅ `23c9164`: `brand/brand.ts` (`BRAND`), `brand/fonts.ts` (`FONT_ASSETS`), `color.ts` (`withAlpha`); palette/tokens/premium/typography/gradients sin literales (test lo verifica); nuevos `TOKENS.color.onPrimary`, `TOKENS.onMedia`, `TOKENS.scrim`; `TOKENS.color.bg/text/sub` `@deprecated`. Checks: `tsc` limpio, `lint` limpio, `designSystemBrand.test.ts` 7/7, `npm test` 9 suites / 33 tests OK. Diferencias solo de formato (`'#fff'`→`'#FFFFFF'`, rgba sin espacios, `0.0`→`0`); `PALETTE`/`TOKENS` perdieron `as const` (tipos `string`). RDD: off (global) → sin review nativa.

- 2026-10-05 T2 ✅ `5cb9cb7`: `no-restricted-syntax` en `warn` para `src/**` + `app/**` (excluye `src/core/design-system/**`): hex, `rgb/rgba/hsl` (literal y template), nombres de color en props `*color`/`tint`, `fontFamily` literal. Script `npm run lint:ds` (`scripts/count-ds-violations.mjs`). **Baseline: 1095 violaciones en 78 archivos.** `npm run lint` sigue en 0 errores (solo warnings). Top: ReelsScreen 67, DashboardScreen 58, ProfileScreen 48, OrderDetailScreen 40, DeleteAccountScreen 37.
- Nota para el nav-map: existe `scripts/generate-routes.cjs` (`npm run routes:generate`) → usarlo para listar "Rutas existentes".

- 2026-10-05 T3 ✅ `fc05bf3` `4f6cb90`: Input/EmptyState/Toast movidos a `design-system/components` (rutas viejas = re-export); nuevos `Divider`, `SectionHeader`, `Badge`, `Chip`, `Avatar`, `OtpInput`, `AuthCard`, `ListRow`; componentes existentes sin literales; `designSystemComponents.test.tsx` (34 tests, incluye guardia fs+regex de `components/**`). Inventario arriba. Ningún screen migrado. Checks: `tsc` limpio, `lint` 0 errores, `npm test` 10 suites / 67 tests OK. Cambios visuales menores: Toast usa `TOKENS.status.*`, EmptyState usa `Button`; nuevos `BRAND.colors.mintDeep`, `GRADIENTS.success`.

- 2026-10-05 T4 ✅ `f778e7e` `e9b7e49`: las 12 pantallas de `features/auth/screens` + `OnBoardingSlide` migradas (0 violaciones en auth). Nuevo en el DS: `AuthBackdrop` (root con gradiente bg→vino + glow pulsante; `forceDark`), `BackButton`, `GRADIENTS.glow/glowFaint/backdrop(tc)`, `PALETTE.*.bgWine` (+ `BRAND.colors.*.wine`), `Button.iconPosition`; tests en `designSystemComponents`/`designSystemBrand`. Cambios de uso: tarjetas → `AuthCard`, OTP → `OtpInput` (arregla pegar el código en VerifyEmail/VerifyResetCode), inputs de ChangePassword → `Input`, CTAs → `Button` (Google = `variant="secondary"`), heroes → `IconCircle`, banner de Términos → `NoticeBanner`. **Decisión de tema**: Login/Register/Forgot/Verify*/Reset/Terms/ChangePassword ahora siguen el tema (`tc.*`; antes fijos `#0A0910`+blur dark, y el `Input` ya era theme-aware → en light se veía mal); Splash/Onboarding/WelcomeVideo son intencionalmente siempre-dark (`PALETTE.dark` / `TOKENS.onMedia`). Diferencias visuales menores (a verificar en dispositivo): wordmark de login `#EDEAF5` en vez de `#fff`; Splash `#07060C`→`#0A0910` y glow con la misma curva que login; botón Google 56px y con opacidad al cargar; divisor "o" más tenue (`tc.divider`); VerifyResetCode ya no anima caja por caja (fade del bloque OTP); éxito de Reset usa `IconCircle` success (gradiente) en vez del check plano; onboarding: CTA es `Button` (gradiente 2 stops, sin spring propio) y título con Archivo; ChangePassword usa `ScreenHeader` + `Card` y pierde el borde de foco propio (lo da `Input`). Checks: `tsc` limpio, `lint` 0 errores, `npm test` 10 suites / 73 tests (+6 en DS respecto a T3: 67), `lint:ds` **835** (−232, auth = 0). Nav-map: 34 salidas mapeadas, 0 rotas, 5 dudosas (`odd/nav-map.md`).

## Conteo de violaciones (`npm run lint:ds`)

| Después de | Total | Archivos |
|---|---|---|
| T2 (baseline) | 1095 | 78 |
| T3 | 1067 | 73 |
| T4 | 835 | 61 |
| T5 | 765 | 47 |
| T6 | 561 | 33 |
| T7 | 385 | 25 |
| T8 | 275 | 18 |
| T9 | 152 | 9 |
| T10 | 37 | 5 |

- 2026-10-05 T5 ✅ `335c95a` `69a7162` `46f9c0c` `daae378`: **Premium theme-aware**: `PREMIUM` (siempre dark) reemplazado por `PREMIUM_PALETTE.dark/.light` + `usePremiumColors()` (en `theme.store.ts`, exportado por el barrel) + `PREMIUM_SHADOWS` estáticas; `BRAND.colors.premium` ahora trae `gold/goldDeep/onGold` + `dark/light` (background, card, cardEnd, panel, panelEnd, goldText). `gold` en light = `#7A5800` (contraste >= 4.5:1, con test); `goldFill/goldFillEnd/onGold` iguales en ambos temas. `primary/primaryDark` = brand (hallazgo `#850221` resuelto, cambio visual mínimo). Otros añadidos al DS: `TOKENS.color.shadow`, `TOKENS.blurTint`, `PALETTE.*.switchTrack` (+ `BRAND.colors.dark.track`); `PaletteColors`/`PremiumColors` ensanchados a `string` (para pasar `tc`/`pc` a `createStyles`). `AuthBackdrop.forceDark` eliminado (sin usos). Migrados (0 violaciones): AnimatedBackground, BrandMark (tinta `tc.text`), CategoryVideoCarousel, CustomTabBar (barra `tc.surface`, íconos `tc.text`, badge `TOKENS.color.error`), FeaturesSection, PremiumBanner, PremiumButton, ProviderCTA, ThemeToggle, `BlurView.android`, EditProfileModal, ProfesionalCard (ahora `tc.surface`), PromoBanner, ServiceDetailModal (BlurView tint según tema, hero con `onMedia/scrim`); `AuthContext` retry usa `Button`/`Text` del DS; Splash/Onboarding/WelcomeVideo theme-aware (Welcome: "Saltar" sobre video con `scrim`/`onMedia`; Onboarding: `StatusBar` cambia con el tema). `core/components` restante (AppBackground, OfflineBanner, UpdateBanner, RadialBlob, ErrorBoundary, BiometricLockGate) ya estaba limpio desde T3: sin cambios. `OnBoardingSlide` borrado (sin importadores). Tests: `sharedComponents.test.tsx` (hook premium cambia con el modo, render dark/light, guardia de literales en `src/components` y `src/core/components`) + premium en `designSystemBrand`. Checks: `tsc` limpio, `lint` 0 errores, `npm test` 11 suites / 79 tests, `lint:ds` **765** (-70, todos los archivos de T5 = 0). Nav-map: +15 filas (tab bar, modales, CTAs sin navegación), 0 rotas, 3 filas dudosas nuevas. **Verificar en dispositivo (dark + light)**: tab bar (barra `tc.surface`; antes siempre `#141414`), BrandMark (tinta `tc.text`, oscura en light), Splash/Onboarding/Welcome en light, ThemeToggle (iconos con `TOKENS.status.progress.fg` / `TOKENS.color.warning`), ProfesionalCard (fondo según tema), Editar perfil (bottom sheet premium en light: footer, inputs Paper), ServiceDetailModal en light (BlurView), AuthContext retry.

- 2026-10-05 **Decisión del usuario:** todas las pantallas siguen tema claro y oscuro (se aprueba el cambio de T4 en auth). Única excepción: texto/íconos **sobre video o imagen** usan `TOKENS.onMedia` / `scrim` por legibilidad, no por tema. Splash, Onboarding y WelcomeVideo (hoy siempre dark) pasan a theme-aware en T5. `PREMIUM` (siempre dark por diseño) contradice la regla → resolver en T5.

- 2026-10-05 T6 ✅ `416bb3a` `0505f99` `9fe6408` `b23700f`: `features/servicesUser` (6 pantallas + 13 componentes/constantes) y `app/(tabs)/services/_layout.tsx` con 0 violaciones (`TOKENS.color.bg/text` deprecados fuera de ese layout). **DS**: `BRAND.colors.rating` → `TOKENS.color.rating` (estrellas), `TOKENS.color.info`, `BRAND.colors.hero.aurora/midnight` → `GRADIENTS.aurora/midnight` (banners del hero con texto blanco), `TOKENS.onMedia` ampliado (`textMuted`, `solid`, `fillFaint`, `fill`, `fillStrong`, `border`) para glass/burbujas sobre gradiente/imagen, `Input` ahora soporta `multiline` y fusiona `style` (antes `style` pisaba los estilos internos). **Uso de DS**: Dashboard usa `SectionHeader`/`Button` (reintentar) y su `StatusBar`, notif/quick actions/skeleton siguen el tema; ServicesScreen/CategoryServices reemplazan sus `Shimmer` locales por `Skeleton`; ServiceForm = `FormCard` (`Card`) + `Input` + `Chip` + `Button` (se resuelve B22 vía `CategoryChips` → `Chip`); ProviderProfileScreen retry = `Button`; FeaturedCard "VERIFICADO" = `Badge`; `StatusBar` theme-aware en Dashboard/Categoría/Proveedor. Se borraron estilos muertos (ServicesScreen `card/countBadge/iconBg/...`, MyService `emptyState/primaryButton/...`). Fix aparte (`b23700f`): corazón/chevron/estrellas vacías con `tc.border` invisibles → `tc.textMuted` (B37). Tests: `servicesUser.test.tsx` (guardia de literales sobre `src/features/servicesUser`, `app/(tabs)/services`, `service-form`, `(tabs)/index` sin comentarios; StarRating/CategoryChips en dark+light), `Input` multiline en `designSystemComponents`, tokens nuevos en `designSystemBrand`. Checks: `tsc` limpio, `lint` 0 errores, `npm test` 12 suites / 119 tests, `lint:ds` **561** (-204; todos los archivos de T6 = 0). Nav-map: +28 filas, 0 rotas, 4 dudosas nuevas (B33–B36). Backlog: B24–B37 (B22 ✅; B37 ✅). **Verificar en dispositivo (dark + light)**: ver fila T6 en `odd/backlog-fixes.md`.

- 2026-10-14 T7 ✅ `59a3718` `10e2f45` `ef13490`: `features/orders` (6 pantallas + `constants/orderStatus.ts`: label + tono `TOKENS.status` por estado), `features/payments` (PaymentsScreen) y `features/plans` (PlansScreen) con 0 violaciones. **DS**: `Card.contentStyle` (estilos del contenedor interno). Tests: `orders.test.tsx` (cada estado mapea a un tono válido, `Badge` por estado en dark+light, `Card.contentStyle`, guardia de literales sobre orders/payments/plans + rutas `app/` asociadas). Fix: regex `/\\/g` mal escapado en el test (rompía la suite). Checks: `tsc` sin errores en archivos de T7, `npm test` 13 suites / 152 tests (una corrida previa mostró fallos fuera de orders que no se repitieron → posible flakiness por un worker que no cierra), `lint:ds` **385** en 25 archivos (-176). **Pendiente: verificar en dispositivo (dark + light)** checkout, detalle/estado de orden, cotización, pago exitoso, pagos y planes (sumado a lo pendiente de T4–T6).

- 2026-10-14 T8 ✅ `8c9f027` `897e045` `e92653e` (rama `feat/ds-t8-kyc`, apilada sobre `feat/ds-t7-orders`): `features/kyc` (6 pantallas) + `features/admin` (AdminBackgroundCheck) con 0 violaciones; rutas `app/(tabs)/profile/{background-check,become-provider,kyc/*}` y `app/admin/**` ya estaban limpias. **DS**: `NoticeBanner` variante `error` (reemplaza 3 banners de error hechos a mano). Nuevo `kyc/constants/kycStatus.ts` (`KYC_STATUS`, `BACKGROUND_CHECK_STATUS`, `toneColors()`), antes mapeado a mano en 3 pantallas. Headers → `ScreenHeader`; CTAs → `Button`; selector de documento → `Chip`; avatar admin → `Avatar`; pasos de BecomeProvider → `Card` + `Badge`. Admin ahora sigue el tema (antes solo light). Tests: `kyc.test.tsx` (guardia de literales + renders) y `NoticeBanner error` en `designSystemComponents`. Checks: `npm test` 14 suites / 180 tests, `tsc` 0 errores, eslint 0 errores en archivos tocados, `lint:ds` **275** en 18 archivos (-110). **Verificar en dispositivo (dark + light)**: headers sin botón con caja; tipografía Archivo en títulos; botones DS sin escala al presionar; selector de documento (Chip con gradiente); KYCRejected (rojo `TOKENS.color.error`, motivo en `tc.text`); ícono hero de KYCIntro ahora centrado (antes quedaba a la izquierda por un estilo no aplicado); Admin en light/dark con badge de conteo en el header. **Decisiones abiertas**: (1) ¿variante `pending` en `NoticeBanner`? (hoy nota local "en revisión" en BackgroundCheck); (2) ¿variante outlined-danger en `Button`? (hoy "Rechazar" del admin es `Pressable` local); (3) `StepTimeline` no encaja con fila número+ícono+texto de KYCIntro → fila local con tokens.

- 2026-10-14 T9 ✅ `a5d10d7` `34e36a7` `3bc12a0` `6e6599f` `4d4b69a` `253ca7b` (rama `feat/ds-t9-profile`, apilada sobre T8): `features/profile` + `features/users` con 0 violaciones. **DS**: `Button variant="dangerOutline"`, `NoticeBanner variant="pending"` (resuelven decisiones abiertas 1 y 2 de T8: "Rechazar" del admin y nota "en revisión" de BackgroundCheck ya los usan), `ScreenHeader` back con `accessibilityLabel="Volver"`. **Nuevo registro `odd/ux-gaps.md`** (decisión del usuario: en cada tarea detectar lo que falta en los flujos): 55 faltantes → 28 ✅ implementados, 20 ❔ requieren decisión de producto, 7 ⬜; 12 preguntas abiertas al final del doc. Fixes: validación de formato de teléfono, confirmación antes de borrar cuenta, límite de intentos KYC tomado de `verification.maxAttempts` del backend. Tests: `profile.test.tsx` (guardia + renders dark/light). Checks: `npm test` 15 suites / 228 tests (2 corridas iguales), `tsc` 0, eslint 0, `lint:ds` **152** en 9 archivos (-123). **Verificar en dispositivo (dark + light)**: filas de ajustes uniformes (`ListRow`, sin tintes por fila), `Avatar` con anillo, `StatusBar` según tema (antes siempre light), EditProfile con `ScreenHeader` + `Card` (sin header blur), VerifyPhone con `OtpInput` de 6 cajas y sin bandera 🇦🇷, borrar cuenta paso 1 = `Button danger` sólido. **Riesgo detectado**: "Rechazar" del admin usa `Alert.prompt` (solo iOS) → en Android no se puede rechazar (G50).

- 2026-10-15 T9 (seguimiento) ✅ `79ad4e0` `8bbbb06` `cfe1a52`: **Decisión del usuario**: un solo editor de perfil = `EditProfileScreen` (`/(tabs)/profile/EditProfile`); `EditProfileModal` borrado. "Editar perfil", fila "Mi cuenta" y tap en avatar navegan a la pantalla; teléfono/verificar/ubicación ahora alcanzables; al guardar se invalida la query de perfil. El modal nunca editó portada y no hay endpoint de portada en el schema → G10 ❔ (¿endpoint de portada o quitar `bannerUrl`?). G50 ✅: "Rechazar" del admin usa `ReasonDialog` (nuevo en el DS, multiplataforma; antes `Alert.prompt` solo iOS). Checks: `npm test` 15 suites / 236 tests, `tsc` 0, `lint:ds` 152 (sin cambio).

- 2026-10-15 T10 ✅ `55a83b4` `a255c83` `e0347d0` `8ec52a1` `4bfbd12` (rama `feat/ds-t10-chat-reels`, apilada sobre T9): `features/chat` + `features/reels` con 0 violaciones; lógica de socket/REST/polling/auto-scroll y `chat.store` sin tocar. **DS**: `TOKENS.onMedia.canvas`, `TOKENS.scrim.heavy`, `TOKENS.color.onPrimarySub/onPrimaryDim`. UX gaps G56–G89 en `odd/ux-gaps.md`: implementados error+retry (chat, feed, comentarios, MyReels), banner de tiempo real caído, anti doble envío, permisos denegados → "abrir ajustes", aviso de video >60 s, nota de voz <1 s descartada, toasts, a11y labels, botón de orden en header navega, búsqueda de reels abre `/search`, **doble tap like ahora se persiste** (antes no llegaba al servidor). ⬜: G63 reintento por mensaje, G64 progreso/cancelar subida, G72 deep link de notificación a chat (push usa `orderId`, NotificationsScreen usa `conversationId`). ❔: chat al cerrar orden (G68), reportar/bloquear (G69/G86), subida de reels (G87), tab "Siguiendo" (G83), autoplay con datos (G84), límites/moderación (G70/G71/G88). Checks: `npm test` 16 suites / 271 tests, `tsc` 0, eslint 0, `lint:ds` **37** en 5 archivos (-115). **Verificar en dispositivo**: burbujas propias (`onPrimary`), avatares DS en chat/lista, overlays de reels sobre video, estados de carga/vacío/error de reels en negro en ambos temas (intencional).

- 2026-10-15 seguimiento T10 ✅ `f0a9216` `560cfc6` `576217d`: **Portada** (G10, decisión del usuario: frontend contra endpoint propuesto): sección "Portada" en EditProfile (preview 3:1, cambiar/quitar con confirmación, 404/405/501 → "todavía no está disponible"); contrato BR01 en nuevo `odd/backend-requests.md`. **G72 confirmado y corregido**: lista de notificaciones abría `/chat/{conversationId}` (y antes la rama genérica `orderId` mandaba a `/orders/...`); ahora `getNotificationRoute` → `/chat/{data.orderId}`, sin `orderId` → `/(tabs)/chat`. ❔ backend debe confirmar que `new_message` trae `data.orderId`. **Decisión del usuario G68**: chat de orden completada/cancelada pasa a solo lectura con aviso "Orden finalizada" (opción B); disputa: pendiente de confirmar. Checks: 18 suites / 289 tests, `tsc` 0, `lint:ds` 37.

- 2026-10-15 G68 ✅ `78430a8` `7f65807` `ed8adb4`: chat solo lectura para órdenes completadas/canceladas; en disputa sigue abierto con aviso `pending` (decisión del usuario). Regla única en `chat/constants/chatOrderRules.ts`, aviso `ChatOrderNotice`; estado vía `useOrder` ya existente (sin request extra), refetch al volver a la pantalla. Rechazo de envío solo con 409 `ORDER_CLOSED` (`ed8adb4` corrige versión que tomaba 403/422). Badge en lista listo pero depende de `orderStatus` en payload (BR02). Checks: 19 suites / 306 tests, `tsc` 0.

- 2026-10-15 G69/G86 ✅ `b4da6bd` `776a035` `7f9783f`: **Decisión del usuario: solo reportar** (bloquear postergado). `ReportSheet` en el DS + `src/features/reports/` (motivos con códigos, `ReportFlow`, `canReport`, mapeo de errores 404/405/501 → "todavía no están disponibles", 409 → "Ya reportaste esto."). Superficies: reels, reseñas (perfil público), chat ("Reportar usuario"), perfil de proveedor ("Reportar perfil"); nunca sobre contenido propio. `POST /users/:id/report` propuesto (BR03). Nuevos gaps G90 (reportar mensaje/comentario puntual), G91 (el que reporta no recibe resultado). Checks: 20 suites / 329 tests, `tsc` 0, `lint:ds` 37.
- 2026-10-15 **Decisión del usuario G87**: reels se suben desde galería/cámara (no solo link HTTPS); límites 60 s y 100 MB; requiere endpoint de subida (BR04).

- 2026-10-15 G87 frontend ✅ `60ec559` `3cc07af`: ReelUpload con "Elegir de la galería" / "Grabar video", validación 60 s / 100 MB, preview, progreso + cancelar (`ProgressBar` nuevo en el DS; G64 ✅ para reels, chat pendiente), errores mapeados; link HTTPS conservado como opción secundaria. Endpoint `POST /reels/upload` propuesto (BR04). Alerta de permisos compartida en `src/lib/permissionAlert.ts`. Checks: 21 suites / 343 tests, `tsc` 0, `lint:ds` 37.
- 2026-10-15 **Decisión del usuario G84**: reels con autoplay siempre por defecto + ajuste en perfil "solo con Wi-Fi" (opción C). Pendiente: confirmar store de preferencias (regla 6 de `CLAUDE.md`).

- 2026-10-15 G84 ✅ `a628c19` `2037907`: **Decisión del usuario**: store nuevo `src/stores/preferences.store.ts` (`reelsAutoplay: 'always' | 'wifi'`, persist `BOSKO_PREFERENCES_v1`); fila "Reproducción automática de reels" en Perfil > Preferencias; con "solo Wi-Fi" + datos el reel queda en pausa con botón play (`useConnectionType` vía netinfo; desconocido = Wi-Fi). Detalle menor: doble tap en reel bloqueado también lo reproduce.
- 2026-10-15 Borrar cuenta ✅ `89fe269` `ff7ca12`: **Decisiones del usuario**: (1) órdenes activas (pending/accepted/in_progress + disputed) bloquean el borrado con lista y links; Premium solo avisa; (2) período de gracia de 30 días (desactiva, reactivación al volver a iniciar sesión, toast "Reactivamos tu cuenta" si login trae `reactivated`); (3) usuarios de Google confirman con re-login de Google (`useGoogleReauth`, `authProvider` en perfil). Contrato BR05. Pendiente: anonimizar vs borrar reseñas/mensajes en la purga (backend/producto), exportación de datos, rate limit de intentos de contraseña (G20). Checks: 23 suites / 383 tests, `tsc` 0, `lint:ds` 37.

## Próximo paso

0. Siguientes ❔ de `odd/ux-gaps.md` (en curso: G37 cambio de teléfono verificado). Luego T11 (notifications, reviews, search, favorites: 37 violaciones restantes).
1. Responder las preguntas ❔ de `odd/ux-gaps.md` (de a una) e implementar las que queden definidas.
2. T10: migrar `features/chat` + `features/reels` (ReelsScreen 67, ChatScreen 33, MyReels 10, ConversationsList 5) aplicando también el registro de faltantes UX. Antes: verificar en dispositivo (dark + light) T4–T9.
