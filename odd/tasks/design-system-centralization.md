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
| 3 — migración auth (T4) | `feat/ds-t4-auth` | `feat/ds-t3-components` | — | ⬜ |

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
| T4 | Migrar `features/auth` (~14 pantallas) | delegada | ⬜ |
| T5 | Migrar `src/components` + `src/core/components` compartidos (TabBar, ThemeToggle, ProviderCTA, Premium*, banners) | delegada | ⬜ |
| T6 | Migrar `features/servicesUser` (~16 archivos, incl. Dashboard, ServiceForm, ProviderProfile) | delegada | ⬜ |
| T7 | Migrar `features/orders` + `features/payments` + `features/plans` | delegada | ⬜ |
| T8 | Migrar `features/kyc` + `features/admin` | delegada | ⬜ |
| T9 | Migrar `features/profile` + `features/users` | delegada | ⬜ |
| T10 | Migrar `features/chat` + `features/reels` (media: tokens `onMedia`/`scrim`) | delegada | ⬜ |
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
- **No** mezclar en la migración: cambios de comportamiento, navegación nueva, prototipos o refactors grandes. La migración tiene que ser visualmente equivalente para poder verificarla; lo demás se convierte en tarea propia al final.

## Hallazgos

| Archivo:línea | Problema | Acción |
|---|---|---|
| `src/core/design-system/premium.ts` (`colorPrimary`) | `#850221` / `#5c0117` ≠ brand `#850021` / `#3C0014`; probable typo heredado de `Colors.ts`. Guardados aparte en `BRAND.colors.premium.*` | Decidir en T5 si se unifica (cambio visual mínimo) |
| `src/core/design-system/tokens.ts` | `TOKENS.color.success` === `mint` (duplicado) | Unificar en T13 |
| `src/features/auth/screens/VerifyEmailScreen.tsx:80-90` | Cajas OTP con `maxLength={1}`: pegar/autocompletar el código no funciona | T4: reemplazar por `OtpInput` |
| `src/features/servicesUser/components/CategoryChips.tsx:34` | Fondo blanco + borde `rgba(0,0,0,0.06)` fijos → se rompe en dark | T6: `Chip` |
| `src/features/chat/screens/ConversationsListScreen.tsx:116` | Borde `rgba(255,45,111,0.25)` hardcodeado | T10 |
| `src/features/profile/ProfileScreen.tsx:215` | Chevron con `tc.border` → casi invisible | T9: `ListRow` |
| `src/core/design-system/components/OtpInput` | Borrar un dígito del medio corre los siguientes a la izquierda (`value` string) | Aceptado; pasar a `string[]` si molesta |
| DS components (`Button`, `Card`, `IconCircle`, …) | En T3 dejaron de forzar look dark en light mode (ahora usan `tc.*`) | **Revisar visualmente en light** en T4 |

## Progreso / evidencia

- 2026-10-05: auditoría y plan.
- 2026-10-05 T1 ✅ `23c9164`: `brand/brand.ts` (`BRAND`), `brand/fonts.ts` (`FONT_ASSETS`), `color.ts` (`withAlpha`); palette/tokens/premium/typography/gradients sin literales (test lo verifica); nuevos `TOKENS.color.onPrimary`, `TOKENS.onMedia`, `TOKENS.scrim`; `TOKENS.color.bg/text/sub` `@deprecated`. Checks: `tsc` limpio, `lint` limpio, `designSystemBrand.test.ts` 7/7, `npm test` 9 suites / 33 tests OK. Diferencias solo de formato (`'#fff'`→`'#FFFFFF'`, rgba sin espacios, `0.0`→`0`); `PALETTE`/`TOKENS` perdieron `as const` (tipos `string`). RDD: off (global) → sin review nativa.

- 2026-10-05 T2 ✅ `5cb9cb7`: `no-restricted-syntax` en `warn` para `src/**` + `app/**` (excluye `src/core/design-system/**`): hex, `rgb/rgba/hsl` (literal y template), nombres de color en props `*color`/`tint`, `fontFamily` literal. Script `npm run lint:ds` (`scripts/count-ds-violations.mjs`). **Baseline: 1095 violaciones en 78 archivos.** `npm run lint` sigue en 0 errores (solo warnings). Top: ReelsScreen 67, DashboardScreen 58, ProfileScreen 48, OrderDetailScreen 40, DeleteAccountScreen 37.
- Nota para el nav-map: existe `scripts/generate-routes.cjs` (`npm run routes:generate`) → usarlo para listar "Rutas existentes".

- 2026-10-05 T3 ✅ `fc05bf3` `4f6cb90`: Input/EmptyState/Toast movidos a `design-system/components` (rutas viejas = re-export); nuevos `Divider`, `SectionHeader`, `Badge`, `Chip`, `Avatar`, `OtpInput`, `AuthCard`, `ListRow`; componentes existentes sin literales; `designSystemComponents.test.tsx` (34 tests, incluye guardia fs+regex de `components/**`). Inventario arriba. Ningún screen migrado. Checks: `tsc` limpio, `lint` 0 errores, `npm test` 10 suites / 67 tests OK. Cambios visuales menores: Toast usa `TOKENS.status.*`, EmptyState usa `Button`; nuevos `BRAND.colors.mintDeep`, `GRADIENTS.success`.

## Conteo de violaciones (`npm run lint:ds`)

| Después de | Total | Archivos |
|---|---|---|
| T2 (baseline) | 1095 | 78 |
| T3 | 1067 | 73 |

## Próximo paso

T4: migrar `features/auth` usando `AuthCard`, `Input`, `OtpInput`, `Button`, `IconCircle`.
