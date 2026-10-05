# Bosko — Mapa de flujos (retroactivo)

Generado a partir del código real (`app/`, `src/features/`), no de un intake previo — la app ya está construida. Sirve como referencia para no romper flujos existentes al agregar features nuevas, y como base para futuras auditorías de estados faltantes (error/vacío/confirmación).

Roles: **client** (usuario común) · **pending** (inició KYC, no aprobado aún) · **provider** (KYC aprobado) — derivados en `useProviderStatus()`, nunca un flag suelto. Un usuario puede pasar de client → pending → provider, nunca al revés automáticamente (hay ruta de rechazo, ver KYC).

---

## 1. Auth

| Ruta | Screen | Rol | Qué hace |
|---|---|---|---|
| `/login` | `LogInView` | anónimo | Email/password + botón Google |
| `/login/RegisterView` | `RegisterView` | anónimo | Alta de cuenta + botón Google |
| `/login/forgot-password` | `ForgotPasswordScreen` | anónimo | Pide email para código de recuperación |
| `/auth/verify-reset-code` | `VerifyResetCodeScreen` | anónimo | Input de OTP recibido por email |
| `/auth/reset-password` | `ResetPasswordScreen` | anónimo | Nueva contraseña tras OTP válido |
| `/login/termsAndConditions` | `TermsAndConditionsScreen` | anónimo | T&C (requerido en registro) |
| `/auth/verify-email` | `VerifyEmailScreen` | recién registrado | Verificación de email post-registro |
| `/welcome-video` | `WelcomeVideoScreen` | recién registrado | Video de bienvenida (una sola vez) |
| — | `OnBoarding` | primer uso | Slides de onboarding (`OnBoardingSlide`) |
| `(tabs)/profile/ChangePassword` | `ChangePasswordScreen` (auth) | autenticado | Cambio de contraseña desde perfil |

**Guards** (3 capas, ver CLAUDE.md): `app/index.tsx` (gate primario) → `(tabs)/_layout.tsx` (redirect a `/login` si no hay token) → `login/_layout.tsx` (redirect a `/(tabs)` si ya autenticado).

**Estados conocidos**: refresh-token automático vía interceptor de axios (cola de requests concurrentes, logout forzado si el refresh falla — `axiosinstance.tsx`). Error de credenciales / email no verificado: manejo puntual, no auditado screen por screen en este pase.

---

## 2. Convertirse en proveedor (KYC)

Flujo lineal client → pending → provider.

| Ruta | Screen | Qué hace |
|---|---|---|
| `(tabs)/profile/become-provider` | `BecomeProviderScreen` | Entry point, explica el proceso |
| `(tabs)/profile/kyc/intro` | `KYCIntroScreen` | Explicación KYC antes de arrancar |
| `(tabs)/profile/kyc/document` | `KYCDocumentScreen` | Captura de documento (DNI/CEDULA/PASAPORTE/RUT) vía `@didit-protocol/sdk-react-native` |
| `(tabs)/profile/kyc/index` | `KYCStatusScreen` | Estado de la verificación en curso |
| `(tabs)/profile/background-check` | `BackgroundCheckScreen` | Antecedentes (posterior/paralelo a KYC) |
| `/admin/background-check` | `AdminBackgroundCheckScreen` | Vista admin para revisar antecedentes |
| — | `KYCRejectedScreen` | Estado terminal: rechazado, con motivo (`rejectionReason`) |

**Estados reales** (`KYCStatus`, `src/features/kyc/types/kyc.types.ts`): `not_started` · `in_progress` · `pending` · `approved` · `rejected` · `declined` · `failed` · `expired`. Todos tienen representación en `KYCStatusScreen`/`KYCRejectedScreen` salvo verificación puntual de `expired`/`declined`/`failed` — revisar que compartan copy con `rejected` o tengan mensaje propio.

**Retomable**: sí — `attemptCount`/`maxAttempts` en `KYCVerification` indica reintentos controlados, no hay reinicio total forzado.

---

## 3. Marketplace (descubrimiento)

| Ruta | Screen | Rol | Qué hace |
|---|---|---|---|
| `(tabs)/index` | `DashboardScreen` | todos | Home — categorías, destacados, CTA "hacete proveedor" (`ProviderCTA`) si es `client` |
| `(tabs)/services/index` | `ServicesScreen` | todos | Listado general de servicios |
| `(tabs)/services/category/[id]` | `CategoryServicesScreen` | todos | Servicios filtrados por categoría |
| `(tabs)/services/provider/[id]` | `ProviderProfileScreen` | todos | Perfil público de un proveedor (real, activo — reemplazó al viejo `/profile/[id]`, ver limpieza de deadcode) |
| `/search` | `SearchPage` | todos | Búsqueda con debounce (`useDebouncedValue`, 275ms) |
| `(tabs)/profile/favorites` | `FavoritesScreen` | todos | Favoritos (Zustand `favorites.store`, persist AsyncStorage) |

**Navegación a perfil de proveedor**: desde Dashboard, CategoryServices, Search y Reels — todas usan `router.push({ pathname: '/(tabs)/services/provider/[id]', params: { id, from } })`, con `from` para tracking de origen.

---

## 4. Servicio propio (rol provider)

| Ruta | Screen | Qué hace |
|---|---|---|
| `(tabs)/profile/Services` | `MyServiceScreen` | Gestión del/los servicio(s) propios |
| `(tabs)/profile/AddServices` | `ServiceFormScreen` | Alta de servicio |
| `/service-form` (modal) | `ServiceFormScreen` | Edición (mismo componente, ruta modal) |

**Gate**: `useRequireProviderStatus()` — bloquea acceso si el rol no es `provider`.

---

## 5. Órdenes (pedido de servicio)

Estados reales (`OrderStatus`, `src/features/orders/types/orders.types.ts`): `pending → accepted → in_progress → completed`, con salidas a `cancelled` o `disputed` en cualquier punto antes de `completed`.

| Ruta | Screen | Rol | Qué hace |
|---|---|---|---|
| `(tabs)/orders` | `OrdersListScreen` | cliente y proveedor (vista distinta, `role` en `Order`) | Lista de órdenes propias |
| `/orders/quote` | `QuoteRequestScreen` | cliente | Pedir cotización a un proveedor |
| `/orders/checkout` | `CheckoutScreen` | cliente | Checkout tras acordar precio |
| `/orders/payment-success` | `PaymentSuccessScreen` | cliente | Confirmación de pago |
| `/orders/[id]` | `OrderDetailScreen` | ambos | Detalle completo de una orden |
| `/orders/status` | `OrderStatusScreen` | ambos | Tracking de estado en curso |
| `/orders/review` | `ReviewScreen` | cliente | Dejar reseña tras `completed` |

**Confirmaciones esperables** (no auditadas línea a línea): cancelar orden (`RejectOrderPayload`/`cancellationReason`) y abrir disputa (`DisputeOrderPayload`/`disputeReason`) son acciones con motivo obligatorio — deberían tener modal de confirmación + input de texto, revisar que `OrderDetailScreen` lo cubra.

**Optimistic UI**: ya implementado en 6 mutations de órdenes (onMutate/onError/onSettled + rollback + toast, según CLAUDE.md cambios recientes) — patrón a repetir en mutations nuevas del módulo.

---

## 6. Chat

| Ruta | Screen | Qué hace |
|---|---|---|
| `(tabs)/chat` | `ConversationsListScreen` | Lista de conversaciones (ligadas a una orden — no hay DMs libres) |
| `/chat/[id]` | `ChatScreen` | Chat 1:1, `id` = `orderId` |

Real-time vía socket.io con poll de respaldo cada 10s si el socket está desconectado (`socketReady` en `chat.store`). Soporta texto, imagen, video (≤60s), audio (long-press). Indicador de escritura animado.

---

## 7. Pagos y planes

| Ruta | Screen | Qué hace |
|---|---|---|
| `(tabs)/profile/Payments` | `PaymentsScreen` | Métodos de pago / historial |
| `(tabs)/profile/plans` | `PlansScreen` | Planes/suscripción |

---

## 8. Reels

| Ruta | Screen | Qué hace |
|---|---|---|
| `(tabs)/reels` | `ReelsScreen` | Feed de reels de proveedores |
| `(tabs)/profile/my-reels` | `MyReelsScreen` | Grilla de reels propios (rol provider) — likes/comentarios, editar descripción/tags, eliminar |
| `/(tabs)/profile/upload-reel` | `ReelUploadScreen` | Publicar reel por enlace HTTPS (rol provider) |

---

## 9. Reseñas

| Ruta | Screen | Qué hace |
|---|---|---|
| `(tabs)/profile/my-reviews` | `MyReviewsScreen` | Reseñas recibidas/hechas por el usuario |
| `/orders/review` | `ReviewScreen` | Dejar reseña (ver Órdenes) |

---

## 10. Perfil y cuenta

| Ruta | Screen | Qué hace |
|---|---|---|
| `(tabs)/profile/index` | `ProfileScreen` (`features/profile/ProfileScreen.tsx`) | Perfil propio — hub de todo lo demás |
| `(tabs)/profile/EditProfile` | `EditProfileScreen` | Edición de perfil |
| `(tabs)/profile/edit/[type]` | `ProfileEditScreen` | Edición por campo (foto/descripción/pagos/notificaciones/email — componentes en `features/users/components/edit/`) |
| `(tabs)/profile/verify-phone` | `VerifyPhoneScreen` | Verificación de teléfono (Firebase) |
| `(tabs)/profile/delete-account` | `DeleteAccountScreen` | Baja de cuenta — **requerido por Apple**, ya existe ✅ |

**Notificaciones**: `NotificationsScreen` (modal global, `NotificationsModalRoot` en `_layout.tsx`), estado en `notificationsUI.store` + `useNotificationsQuery`.

---

## Gaps detectados al mapear (no bloquean nada, quedan anotados)

- No hay estado "primera vez sin datos" documentado explícitamente para `OrdersListScreen`/`MyReviewsScreen`/`FavoritesScreen` — verificar que cada uno tenga `EmptyState` propio y no solo lista vacía sin CTA.
- `KYCStatus` tiene 3 estados terminales distintos de éxito (`expired`, `declined`, `failed`) además de `rejected` — confirmar que cada uno tenga copy diferenciado en `KYCStatusScreen`/`KYCRejectedScreen` y no un mensaje genérico que confunda "rechazado" con "expiró, reintentá".
- Cancelación/disputa de orden: confirmar que el modal de motivo (`RejectOrderPayload`/`DisputeOrderPayload`) existe y no es un simple `Alert.alert` de confirmación sin input.
