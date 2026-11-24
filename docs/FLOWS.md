# Bosko — Mapa de flujos (v1)

Reescrito el 2026-11-24 a partir de `docs/PRD.md` (sección 5) y de las rutas reales de `app/`. Sustituye al mapa anterior, que incluía Reels como pestaña, pagos simulados y planes. El detalle de errores por pantalla está en el PRD; el estado de verificación (qué se probó y qué no) está en `docs/STATUS.md`.

Roles: **client**, **pending** (inició KYC, sin aprobar) y **provider** (KYC aprobado), derivados en `useProviderStatus()`. Mercados: Tandil (ARS) y Barranquilla (COP); la ciudad se elige al registrarse.

El cliente paga al proveedor **fuera de la app**. Dentro de la app no hay checkout, planes ni Reels (`FEATURES.payments = false`, `FEATURES.reels = false` en `src/core/config/features.ts`): sus rutas redirigen a `/(tabs)`.

## 1. Estructura

Barra de pestañas (`CustomTabBar`): **Inicio · Trabajos · Pedidos (Órdenes para proveedores) · Mensajes · Perfil**. Reels existe como pestaña oculta (`href: null`). `services/*` se puede abrir por ruta, pero no es pestaña.

Guardas: `app/index.tsx` (puerta principal) → `(tabs)/_layout.tsx` (sin token va a `/login`) → `login/_layout.tsx` (con token va a `/(tabs)`). Una cuenta suspendida (403 `ACCOUNT_SUSPENDED`) va a `/suspended`.

## 2. Registro y acceso

| Ruta | Qué hace |
|---|---|
| `/login`, `/login/forgot-password` | Ingreso (email o Google) y recuperación |
| `/auth/verify-reset-code`, `/auth/reset-password` | Código por email y nueva contraseña |
| `/auth/verify-email` | Código de 6 dígitos (10 min), reenvío con espera de 60 s |
| `/auth/select-city` | Ciudad y términos para cuentas de Google o sin ciudad |
| `/terms` | Términos y condiciones (registro y Perfil) |
| `/welcome-video` | Video de bienvenida, una sola vez |

Flujo: onboarding → registro (ciudad y términos) → verificar email → video de bienvenida → Inicio.

## 3. Ser proveedor y publicar el servicio

1. Perfil → `profile/become-provider` → `profile/kyc/intro` → captura con Didit → `profile/kyc` (estado).
2. Verificar el teléfono (`profile/verify-phone`, Firebase): obligatorio para proveedores.
3. Estados KYC: `in_progress` → `pending` → `approved`. `rejected`/`declined` permiten reintento mientras queden intentos; `failed`/`expired` reintentan sin consumir intento; con intentos agotados se ofrece contactar a soporte por WhatsApp.
4. Antecedentes (`profile/background-check`) son opcionales y dan una insignia. Revisión admin: `/admin/background-check`.
5. Con `approved`: `profile/Services` y `/service-form`. **Un solo servicio** por proveedor (422 `SERVICE_LIMIT_REACHED`), con foto principal obligatoria; la categoría no cambia después de publicar.

## 4. Descubrir

- Inicio: categorías y destacados. Búsqueda en `/search`. Catálogo en `services/category/[id]` y `services/provider/[id]`.
- **Trabajos** (`(tabs)/works`): feed público de fotos de trabajos terminados. `/work/[id]` muestra el detalle, **Cotizar** y denunciar. El proveedor administra sus fotos en `profile/my-works` (máximo 30; con 3 denuncias se ocultan hasta revisión).
- Favoritos guardados en la cuenta: `profile/favorites`.

## 5. Orden

```
pending ──accept──> accepted ──start──> in_progress ──terminado──> awaiting_confirmation ──confirma / 3 días──> completed
   │                    │                    │                              │
   ├─ reject / vence 48 h                    │                              │
   ▼                    ▼                    ▼                              ▼
cancelled           cancelled             disputed                       disputed
```

Acciones por rol (`getOrderActions`, `src/features/orders/utils/orderActions.ts`):

| Estado | Cliente | Proveedor |
|---|---|---|
| `pending` | Cancelar | Aceptar, rechazar (vence a las 48 h) |
| `accepted` | Cancelar | Iniciar, cancelar |
| `in_progress` | Abrir disputa | Marcar terminado, abrir disputa |
| `awaiting_confirmation` | Confirmar, reportar problema (disputa) | Solo espera; se cierra sola a los 3 días |
| `completed` | Reseñar (una por orden) | — |
| `cancelled` por vencimiento | Cotizar a otro proveedor | Aviso "solicitud vencida" |

Rutas: `(tabs)/orders` (lista; abre en la pestaña de proveedor si el usuario es proveedor, `?tab=client|provider` manda), `/orders/quote` (nueva solicitud), `/orders/[id]` (detalle), `/orders/review`. Cancelar y rechazar piden motivo. Disputa: la resuelve soporte a mano por WhatsApp (`SupportContactButton`; el detalle de la orden muestra `DisputeSupportNotice`). Que el proveedor no pueda disputar desde `awaiting_confirmation` está marcado en el código como decisión de producto abierta.

`/orders/checkout` y `/orders/payment-success` siguen en el repositorio pero redirigen mientras `FEATURES.payments` sea `false`.

## 6. Chat

`(tabs)/chat` lista las conversaciones; `/chat/[id]` abre una (el `id` es el de la **orden**). No hay mensajes directos fuera de una orden.

- Texto, imagen, video (hasta 60 s) y audio. Indicador de escritura. Tiempo real por socket.io con polling de respaldo cada 10 s.
- Orden `completed` o `cancelled`: solo lectura (el servidor responde 409 `ORDER_CLOSED`). En `disputed` se puede escribir.
- Menú del chat: denunciar o bloquear al otro usuario. Bloqueados: `profile/blocked-users`.

## 7. Reseñas, denuncias y suspensión

- Solo el cliente califica al proveedor tras `completed`; el proveedor puede responder (`profile/my-reviews`).
- Se pueden denunciar usuarios, reseñas, fotos de Trabajos y reels (`ReportFlow`, `src/features/reports`). Las denuncias las revisa el equipo con la API de admin; no hay panel en la app.
- Suspensión total: `/suspended` con contacto de soporte; se cierra la sesión.

## 8. Perfil y cuenta

`profile/index` es el centro: editar perfil (`EditProfile`), verificar teléfono, favoritos, usuarios bloqueados, Mis trabajos (proveedor), Mis reseñas, términos y cambio de contraseña (`ChangePassword`). El modal global de notificaciones se monta en `app/_layout.tsx`. Hay un único interruptor de push.

**Eliminar cuenta** (`profile/delete-account`): pide contraseña o reautenticación reciente con Google (5 min); se bloquea con órdenes activas (`ACTIVE_ORDERS`); la cuenta queda oculta 30 días y se recupera al iniciar sesión; después se anonimiza (el historial compartido se conserva de forma anónima).

## 9. Fuera de v1 (código conservado)

| Qué | Dónde | Cómo reactivar |
|---|---|---|
| Reels (feed, Mis reels, subir reel) | `(tabs)/reels`, `profile/my-reels`, `/upload-reel`, `features/reels` | `FEATURES.reels = true` |
| Pagos, checkout, planes | `/orders/checkout`, `/orders/payment-success`, `profile/plans`, `features/payments`, `features/plans` | `FEATURES.payments = true` |

## 10. Huecos conocidos

Verificados al reescribir este mapa (2026-11-24). El resto está en `docs/STATUS.md`.

- El PRD (5.7) promete marca de error y reintento por mensaje en el chat; `ChatScreen.tsx` no tiene estado de envío por mensaje (solo carga fallida y avisos). Pendiente.
- `AdminBackgroundCheckScreen` siempre queda vacía: no existe endpoint de pendientes.
- Los flujos de orden se probaron contra producción solo por REST (2026-11-23); la interfaz, el socket y las notificaciones no se probaron en un dispositivo.
