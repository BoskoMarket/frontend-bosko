# Auditoría del frontend de Bosko

## Alcance y conclusión

Revisión local del 14 de septiembre de 2026, rama `dev`, HEAD `d9edd5b`, incluyendo los cambios sin commit que ya estaban en el workspace. Referencia: `Bosko_Auditoria_MVP_Productivo.docx`, que declara revisar `main` con corte al 15 de septiembre. Son alcances diferentes.

**Hay integración HTTP real en los módulos principales, pero no está todo conectado de extremo a extremo ni se puede dar el frontend por listo para beta con pagos.** El problema más importante es que iniciar un pago se interpreta como haberlo cobrado. También hay huecos de sesión, funciones incompletas y un typecheck fallido.

Esta revisión no ejecutó operaciones en la API productiva, pagos, KYC ni pruebas en un dispositivo. Los contratos actuales del backend y su despliegue no se verificaron independientemente. Los hallazgos del backend citados en el DOCX siguen siendo afirmaciones de ese documento.

## Mapa de integración

“Conectado” significa que existe un camino desde la pantalla hacia el servicio HTTP; no equivale a una prueba exitosa contra el backend actual.

| Módulo | Integración encontrada | Estado observado |
| --- | --- | --- |
| Autenticación | `/auth/login`, `/auth/register`, `/auth/verify-email`, `/auth/google`, recuperación y cambio de contraseña | Conectado; restauración sin validación inicial y reenvío de OTP pendiente. |
| Perfil y teléfono | `/users/me`, avatar, estadísticas, verificación Firebase | Conectado; ubicación descartada al guardar. |
| Catálogo y servicios | Categorías, listado, detalle, destacados, publicación, edición e imágenes | Conectado; contratos manuales y adaptadores defensivos. |
| Órdenes | Crear, listar, detalle, aceptar, rechazar, iniciar, completar, cancelar, disputar | Conectado; falta demostrar transiciones completas con backend. |
| Pagos | Iniciar, consultar estado, historial y ganancias | Parcial: checkout muestra éxito sin comprobar el estado. |
| Chat | Conversaciones, mensajes, multimedia, lectura y Socket.io | Conectado; problemas de ciclo de sesión, reconexión y contrato de eventos. |
| Identidad y antecedentes | `/identity/*`, SDK Didit, carga de antecedentes, aprobación administrativa | Conectado; inconsistencia de tipos en respuesta de inicio KYC. |
| Reseñas y seguimiento | Crear reseña, responder, reportar, listar y seguir usuarios | Llamadas implementadas; validación de contratos pendiente. |
| Reels | Feed, likes, comentarios, edición y borrado | Parcial: carga de archivos sin función implementada ni ruta encontrada. |
| Notificaciones | Registro de token Expo, lista, lectura, borrado y navegación | Conectado; reactivación del interruptor incompleta. |
| Planes | Consulta de planes, suscripción, cancelación e historial | Llamadas implementadas; no demuestra cobro de suscripción. |
| Favoritos | Zustand + AsyncStorage | Local al dispositivo; sin sincronización con API ni separación por cuenta. |

## Hallazgos priorizados

### 1. Alta: pago iniciado se presenta como pago exitoso

- `src/features/orders/screens/CheckoutScreen.tsx:95`: espera `initiate(order.id)` e inmediatamente navega a `/orders/payment-success`, ignorando el objeto de pago devuelto.
- `src/features/orders/screens/PaymentSuccessScreen.tsx:123`: muestra “¡Pago exitoso!” y afirma que el proveedor fue notificado; toma el importe de parámetros de navegación y no verifica el pago.
- `src/features/payments/services/payments.ts:47`: iniciar solamente llama a `POST /payments/initiate`.
- No se encontró apertura de checkout del proveedor ni reconciliación del retorno de pago en este flujo. Existe consulta de estado, pero no condiciona la confirmación visual.

Consecuencia: una respuesta HTTP exitosa con pago pendiente puede mostrarse como cobro confirmado. Debe acordarse la respuesta de inicio con backend, completar el checkout y mostrar éxito únicamente tras consultar un estado confirmado por el servidor.

### 2. Alta: socket y conversaciones sobreviven al logout

- `src/features/auth/state/AuthContext.tsx:74` y `:213`: logout normal y forzado limpian QueryClient y sesión; no desconectan Socket.io ni reinician `useChatStore`.
- `src/features/chat/screens/ChatScreen.tsx:468`: conecta con `authState.token`; el cleanup solamente elimina el listener de conexión.
- `src/features/chat/services/socket.service.ts:42`: si el socket está conectado, ignora cualquier nuevo token.
- La rotación de Axios guarda tokens en `tokenStorage`, pero no actualiza `authState.token` ni las credenciales del socket.

Consecuencia: al cambiar de cuenta, puede reutilizarse la conexión de la cuenta anterior. El listado y contador almacenados en Zustand también permanecen hasta que se sustituyan. La recepción efectiva de eventos depende de las revocaciones del backend; el defecto de limpieza del cliente sí está confirmado.

### 3. Alta: verificación técnica sin aprobar

`node node_modules/typescript/bin/tsc --noEmit` terminó con código 1. Incluye:

- Tipos globales de Jest ausentes y propiedades antiguas en pruebas de login.
- Resolución de módulos `BlurView` y `MotiView` con variantes por plataforma.
- `uploadReelWithFile` importado pero no exportado.
- `location` fuera de `UpdateProfilePayload`.
- `alreadyProvider` fuera de `StartVerificationResponse`.
- Imports relativos inválidos en el contexto heredado de búsqueda.
- Otros errores de referencias, iconos y tipos de estilos.

Un fallo de TypeScript no demuestra por sí solo que una build nativa falle: algunos problemas corresponden a configuración de tipos o código heredado. Sí demuestra que el chequeo actual no aprueba.

No se encontraron workflows de GitHub Actions en esta copia. El manifiesto no define scripts de typecheck ni lint. Solo hay dos archivos de pruebas. La ejecución de Jest se detalla al final.

### 4. Alta: desarrollo y preview usan producción

`eas.json:15`, `:25` y `:34` configuran la misma API para development, preview y production. Los canales EAS están separados, pero el destino de datos no lo está en esta configuración. Se necesita un entorno de staging real y verificar la configuración efectiva de cada build.

### 5. Media: importes inconsistentes en checkout

`CheckoutScreen.tsx:135` calcula una comisión fija de 5%, mientras `:100` envía al comprobante solamente `agreedPrice`. Por ejemplo, para un precio de 100, la pantalla propone 105 y el comprobante muestra 100. Moneda ARS y comisión están fijadas en UI; el importe cobrado realmente requiere verificación con backend. El desglose y el comprobante deben usar la misma fuente autoritativa.

### 6. Media: ubicación no se guarda

`src/features/users/screens/EditProfileScreen.tsx:81` entrega `location` a `updateProfile` y muestra éxito. `src/features/servicesUser/services/profile.ts:41` selecciona otros campos y excluye ubicación del PATCH. La ruta `app/(tabs)/profile/EditProfile.tsx` sí monta esta pantalla. Es una desconexión confirmada dentro del frontend, independientemente de que el backend admita o no ubicación.

### 7. Media: reenvío de código de registro sin implementar

`src/features/auth/screens/VerifyEmailScreen.tsx:128` no llama a la API. Solamente pide volver a registrarse con el mismo correo. No se verificó que ese procedimiento sea válido en el backend. Hace falta acordar el endpoint de reenvío y conectar el botón.

### 8. Media: publicación de reels incompleta

`src/features/reels/screens/ReelUploadScreen.tsx:22` y `:114` usan `uploadReelWithFile`, inexistente en el servicio. Se encontró `createReel` con una URL ya disponible, pero no el flujo de subida del archivo. Tampoco se encontró una ruta o consumidor que monte `ReelUploadScreen`. Feed y gestión de reels existentes no equivalen a publicación funcional.

### 9. Media: activar push no vuelve a registrar el dispositivo

`src/features/users/components/edit/EditNotifications.tsx:11` borra el token al desactivar, pero al activar solo modifica estado local. `src/hooks/usePushNotificationSetup.ts` registra al autenticarse; no depende del interruptor. Además, el interruptor siempre arranca en `true`, sin persistencia de preferencia.

### 10. Media: arranque y recuperación de red incompletos

- `AuthContext.tsx:88`: restaura una sesión por presencia de access y refresh token; no espera validación autoritativa antes de declararla autenticada.
- `src/core/config/env.ts:1`: la aserción `!` no valida que exista una URL. `socket.service.ts:20` usa inmediatamente `.replace` sobre esa variable.
- `src/core/query/queryClient.ts`: sin integración encontrada con `onlineManager`/`focusManager`. Hay usos de AppState para otros componentes, pero no para refrescar queries.
- Socket.io limita las reconexiones a cinco. Chat tiene polling de respaldo cuando se desconecta, por lo que esto no implica pérdida total del chat, pero no resuelve la recuperación permanente del socket.

### 11. Contrato WebSocket: riesgo respaldado por el DOCX, pendiente de contrastar con backend actual

`socket.service.ts:66` trata `new_message_notification` como un `Message` completo. `ChatScreen.tsx:490` inserta el objeto directamente en la lista. Si el backend conserva el payload resumido descrito por el documento, faltan `id`, contenido y otros campos: se pueden insertar mensajes incompletos y fallar la deduplicación.

El tipo de `messages_read` exige `readBy`, pero el consumidor actual de `ChatScreen.tsx:766` solo usa `conversationId`. Por ello, la ausencia de `readBy` descrita por el informe no basta para afirmar una rotura funcional de esta pantalla.

### 12. Favoritos locales y contratos manuales

- `src/stores/favorites.store.ts:31` persiste con una clave global, no por usuario. Favoritos no se sincronizan entre dispositivos y permanecen al cambiar de cuenta.
- Listados de servicios y órdenes usan `any` y aceptan tanto listas directas como `data.data`, con fallback a `[]`. Hay varios tipos y servicios por dominio y no se encontró generación desde OpenAPI.
- Esto es deuda de contrato, no prueba de que todas esas peticiones fallen. Una respuesta paginada puede legítimamente conservar un campo `data` tras desempaquetar el envelope exterior.
- `frontend-error-contract.md` contempla `details` y `requestId`; `src/lib/errors.ts` no los conserva en `ApiError` y todavía declara `path`. Algunas pantallas siguen usando textos del servidor directamente. La adopción del contrato de errores está incompleta.

## Qué corregir del documento recibido

| Afirmación del DOCX | Evidencia local actual |
| --- | --- |
| Falta Sentry móvil | Ya existe dependencia, plugin Expo, inicialización en layout y captura desde ErrorBoundary. No se confirmó DSN efectivo, entrega de eventos ni source maps de una release. |
| Tests importan `@/context/AuthContext` | Ahora usan `@/features/auth/state/AuthContext`. Persisten otros errores; las rutas de login y registro son wrappers existentes. |
| Falta validación de sesión al arrancar | Confirmado. |
| Todos los ambientes usan producción | Confirmado en `eas.json`. |
| Falta integración de ciclo de red de React Query y reconexión limitada | Confirmado, con polling de respaldo en ChatScreen. |
| Duplicación de contratos y desempaquetado defensivo | Confirmado como riesgo; no debe declararse toda duplicación como fallo funcional. |
| Backend no compila, pagos/webhooks y backups con problemas | No verificado en esta auditoría local del frontend. |

## Orden de cierre propuesto

1. Acordar con backend el contrato completo del pago y quitar el éxito prematuro; unificar importes y comprobar estados pendiente, rechazado y confirmado.
2. Corregir logout, cambio de usuario y refresh del socket; validar que no sobrevivan conversaciones de otra cuenta.
3. Llevar typecheck y pruebas a verde y agregar CI; separar preview de producción.
4. Cerrar reenvío OTP, ubicación, subida de reels y preferencias push según el alcance de beta.
5. Validar con cuentas controladas en staging: registro → verificación → publicar servicio → solicitar → aceptar → chat → pagar en sandbox → completar → reseña. Incluir pérdida de red, sesión revocada, relanzamiento y cambio de cuenta.

## Verificaciones ejecutadas

- TypeScript: `node node_modules/typescript/bin/tsc --noEmit`, código de salida 1; errores descritos arriba.
- Pruebas: el primer `npm test -- --runInBand` se interrumpió al permanecer varios minutos sin resultados. La ejecución directa `node node_modules/jest/bin/jest.js --runInBand --runTestsByPath __tests__/login.test.tsx __tests__/register.test.tsx --watchman=false` sí terminó: **4 pruebas aprobadas y 1 fallida; 1 suite aprobada y 1 fallida**.
- La prueba fallida es el recorrido completo de registro: excede el timeout de 5000 ms. También aparecen avisos de actualizaciones animadas fuera de `act`. Esto no demuestra que el registro real falle, pero impide usar esa suite como evidencia de aprobación.
- Login aprobó sus dos pruebas existentes, que usan mocks y no validan la API real.
- No se ejecutó build nativa ni prueba E2E en dispositivo.

No se modificó código funcional durante esta revisión.
