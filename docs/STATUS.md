# Bosko frontend: project status

Last reviewed: 2026-11-24 (branch `docs/status-and-archive`, base `dev`). Every claim cites the file it comes from, or says "unverified".

## How to use this page

- Start here, then go to `docs/PRD.md` (product), `docs/FLOWS.md` (screens and order flow), `CLAUDE.md` (architecture and rules).
- Update this page in the same PR that closes or opens an item. Fill the Owner column when someone takes an item.
- History lives in `docs/archive/` and `odd/archive/` (closed tasks in `odd/archive/tasks/`). Do not treat archived files as current.
- Integration branch is `dev`; PRs target `dev`. `main` is far behind (`git rev-list --count origin/main..origin/dev` gave 360 on 2026-11-24).

## Done

| What | Evidence |
|---|---|
| PRD v1 frontend F1-F16 (cities, one service per provider, `awaiting_confirmation`, blocking, suspension, support button, neutral copy) | `odd/tasks/prd-v1-frontend.md`, PR #69; `docs/PRD.md` section 6 |
| Orders, chat and push refresh for both roles (T1-T8) | `odd/tasks/orders-flow-realtime.md`, PR #76 |
| Order REST flow verified against production: happy path, reject, cancel, dispute (2026-11-23, two test accounts) | `odd/tasks/orders-flow-realtime.md` |
| Backend gaps from that check recorded | PR #77 |
| Android adaptive icon uses the brand logo and color | PR #78 |
| Hidden tabs honored by the custom tab bar | `odd/tasks/tabs-profile-cover-android.md` T1, commit `8c23f28` |
| Android crop toolbar contrast fix (plugin) | same file, T2 code in commit `b9abdc5` (device check still open, see below) |
| Notifications pagination (`useInfiniteQuery`) and refresh error toast | `src/hooks/queries/useNotificationsQuery.ts`, `src/features/profile/ProfileScreen.tsx` |
| Design-system rule enforced by ESLint (`lint:ds`) | `CLAUDE.md`, `odd/archive/tasks/design-system-centralization.md` |
| Docs reorganized: closed tasks and old audits archived, FLOWS rewritten, BR requests reconciled | this branch |

## Open work

| # | Item | Source | Owner |
|---|---|---|---|
| 1 | Run the app on a real device with two accounts (see "Never verified" below) | `odd/tasks/orders-flow-realtime.md` | |
| 2 | B1: `GET /orders/:id` has no dispute reason or opener; the closure card cannot show it. Needs a backend field | `orders-flow-realtime.md` | |
| 3 | B2: no push reaches the client when the provider starts the job (`IN_PROGRESS`); confirm if intended | same | |
| 4 | B3: disputed test order `840d7796...` is unresolved (see contradiction in "Risks") | same | |
| 5 | Audit items 7, 10, 12, 13, 15-28 of the orders-flow audit (stale/offline notification handling, conversations source dedup, polling guards, dead code). The audit text is not in the repo: only these numbers are | same ("Out of scope") | |
| 6 | Android: rebuild and verify cover crop confirm/cancel (T2 unchecked) | `tabs-profile-cover-android.md` | |
| 7 | Android emulator: avatar/banner upload and favorite toggle (T3 unchecked; needs the task-owned local backend, not in this repo) | `local-profile-media.md` | |
| 8 | Chat: per-message sending/failed state with retry. Absent in `ChatScreen.tsx` although `docs/PRD.md` 5.7 promises it; failed media is lost; no upload progress or cancel | `odd/archive/ux-gaps.md` G63, G64 | |
| 9 | Backend: `orderId` in the `new_message` payload (BR09). Without it the push opens the chat list | `odd/backend-requests.md` | |
| 10 | Backend: load `APP_SUPPORT_WHATSAPP`; until then `SupportContactButton` hides | `docs/PRD.md` section 7 #1 | |
| 11 | Backend: pending background-check list for ADMIN (BR11); the admin screen is always empty | `AdminBackgroundCheckScreen.tsx`, BR11 | |
| 12 | Backend: `storeUrls` in `/app/config`; frontend: "Reintentar" on maintenance (G111) | BR06 | |
| 13 | Backend: provider pending count endpoint (BR07); app pages through all orders | BR07 | |
| 14 | Phone OTP: auto-submit when 6 digits are entered (not found in `VerifyPhoneScreen.tsx`) | G27 | |
| 15 | Search: recent searches (decided: keep them; none found in `src/`) | G107 | |
| 16 | Decided but not checked in code (unverified): required review comment, editable review, provider rates client (G101, G102); swipe-to-delete notifications (G97) | `odd/archive/ux-gaps.md` | |
| 17 | Dead code without importers (per `rg`): `HeroCarousel`, `OffersGrid`, `TopCarousel`, `servicesUser/components/ProviderProfile`, `constants/serviceProviders.ts`. `CategoryChips` and `StarRating` are imported only by a test | `odd/archive/backlog-fixes.md` | |
| 18 | Clean up `PAYMENTS_MODE = 'mock'` in `src/core/config/env.ts`: nothing else references it, and it says payments are simulated although payments are off | `env.ts` line 12 | |
| 19 | Firebase: register `com.boskoapp.mobile.dev` and `.preview` (the `development` and `preview` EAS profiles), then update `google-services.json` | see "Risks" | |
| 20 | Check the EAS preview build launched 2026-11-24 (id `a942ecf0-5851-4fd4-9bae-a0c351a77d89`); result unknown | session note | |

## Never verified on device

Only the REST order flow was exercised against production. The dev APK was built but never run (the emulator would not boot on the build machine). Jest tests mock the API.

- Push: token registration, foreground handling, tap routing, badges, cold-start chat opened from a push.
- Live socket, typing indicator, polling fallback.
- Didit KYC capture, Google login, Google re-authentication for account deletion, Firebase phone OTP.
- Light and dark visual checks of the migrated screens (`odd/archive/backlog-fixes.md`, section "Pendientes de verificar en dispositivo").
- Delivered backend contracts (BR01-BR06): none confirmed from the app (`odd/backend-requests.md`).

## Risks, ranked

1. **Nothing user-facing was run on a device.** The first real install may expose problems in push, auth, KYC and chat that tests cannot catch.
2. **Firebase config covers one package.** `google-services.json` lists only `com.boskoapp.mobile`; `app.config.ts` appends `.dev` and `.preview` for the other EAS profiles. Push, Google login and phone OTP in those builds depend on the packages being registered (unverified in the Firebase console).
3. **Disputes have no in-app resolution and the docs disagree.** `orders-flow-realtime.md` B3 says the API cannot resolve the test dispute; `docs/PRD.md` section 7 #3 says support uses `POST /admin/orders/:id/resolve`. Unresolved; check with the backend team.
4. **Support channel may be empty.** Without `APP_SUPPORT_WHATSAPP`, KYC-exhausted users and disputed orders have no contact button.
5. **Account deletion is untested end to end.** `odd/backend-requests.md` BR05 lists contradictions between the request and the delivered contract (`reactivated` flag, Google re-auth on recovery).
6. **Chat shows no send failure per message** (open item 8), and failed media is lost.
7. **Legal and data decisions pending** (next section), including the migration that assigns existing users to Tandil.
8. **Extra request with payments off:** `DeleteAccountScreen.tsx` line 91 calls `useMyPlan()` unconditionally, which requests `/plans/my-plan`. It only feeds the Premium warning. Unverified whether the backend still serves that route.

## Hidden by flags (code shipped)

`src/core/config/features.ts`: `FEATURES = { reels: false, payments: false }`. Routes redirect to `/(tabs)`.

| Flag | Hidden | Still in the repo |
|---|---|---|
| `reels` | Reels tab, "Mis reels", autoplay row, "Subir reel" | `app/(tabs)/reels.tsx`, `profile/my-reels`, `app/upload-reel.tsx`, `src/features/reels` |
| `payments` | Checkout, payment success, plans, "Plan" row, "Pagar" | `app/orders/checkout.tsx`, `payment-success.tsx`, `profile/plans`, `src/features/payments`, `src/features/plans` |

## Open product decisions

From `docs/PRD.md` section 7 unless noted.

- Support WhatsApp number (#1; backend variable not loaded).
- Legal review of terms and privacy for Argentina and Colombia, and the minimum age (#6; a single terms document for two legal regimes and an age check are not defined anywhere in the repo: unverified source).
- Show the currency code (ARS/COP) on screens (#7; pending design).
- The B1 migration assigns all existing users and services to `tandil`; confirm before deploying (PRD section 7, "Nueva").
- Which Didit identity documents apply per country (PRD 5.2 says "per the city's country"; the list is not documented).
- Can the provider open a dispute from `awaiting_confirmation`? PRD #5 says no (client only); the code comments it as open (`orderActions.ts`).
- Who sends "platform news" (#2): technically resolved by `POST /admin/notifications/broadcast`, unused in v1.

## Links

- Product: `docs/PRD.md`; flows: `docs/FLOWS.md`; navigation: `odd/nav-map.md`.
- Backend contracts: `docs/backend-prd-v1-contracts.md`, `docs/backend-contract-fixes.md`, `docs/frontend-media-reports.md`, `docs/frontend-account-lifecycle.md`, `docs/frontend-app-config.md`, `docs/trabajos-feed-contract.md`, `docs/frontend-error-contract.md`.
- Backend requests: `odd/backend-requests.md`.
- Active tasks: `odd/tasks/`. Archive: `docs/archive/`, `odd/archive/`.
