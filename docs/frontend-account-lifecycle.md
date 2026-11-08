# Bosko — Baja y recuperación de cuenta

Contrato para Francisco. Frontend `dev`, backend PR separado hacia `main`. No incluye pagos ni cambios de KYC.

## Baja

`DELETE /api/v1/users/me`, Bearer JWT. Responde **200** con el wrapper habitual:

```json
{"success":true,"data":{"deletionScheduledAt":"2026-11-20T12:00:00.000Z"},"timestamp":"..."}
```

Body para cuenta con contraseña: `{"password":"contraseña actual"}`.
Body para Google: `{"googleIdToken":"Firebase ID token de una autenticación reciente"}`.

`GET /users/me` incluye `authProvider: "password" | "google"`. La sesión de Google debe haberse autenticado en los últimos cinco minutos: renovar un token silenciosamente no renueva `auth_time`. Se comprueba UID vinculado, proveedor Google y correo verificado. No se acepta la contraseña aleatoria interna de las cuentas Google.

El servidor valida todas las órdenes como cliente y prestador dentro de la transacción. `PENDING`, `ACCEPTED`, `IN_PROGRESS` y `DISPUTED` bloquean la baja. Completadas/canceladas no bloquean. La creación de órdenes y la baja bloquean las mismas filas de usuarios en orden determinista: no puede confirmarse una orden nueva para una cuenta que quedó desactivada por la operación concurrente.

La baja oculta perfil, servicios/publicaciones y reels, desactiva servicios, limpia token push, incrementa `authVersion`, revoca refresh sessions y emite el evento existente para desconectar sockets. No hay que confiar solamente en el chequeo local de órdenes. El frontend debe cerrar sesión únicamente tras confirmar éxito de la API.

Errores:

| HTTP | Código | Qué mostrar |
|---|---|---|
| 401 | `INVALID_PASSWORD` | Contraseña incorrecta |
| 401 | `REAUTH_FAILED` | Repetir autenticación de Google |
| 401 | `INVALID_CREDENTIALS` | Sesión revocada/cambio concurrente: iniciar sesión |
| 409 | `ACTIVE_ORDERS` | Resolver órdenes activas/disputas |
| 400 | `VALIDATION_ERROR` | Body/campos inválidos |
| 429 | contrato rate limit existente | Esperar antes de reintentar |

Límite de baja: tres intentos por IP/minuto además de los límites globales.

## Recuperación durante 30 días

No hay endpoint de recuperación nuevo: se usa `POST /auth/login` o `POST /auth/google` con credenciales válidas. Para recuperar por Google se exige también autenticación de los últimos cinco minutos. Antes del vencimiento, iniciar sesión reactiva la cuenta y crea una **sesión nueva**. Se recuperan únicamente los servicios que estaban activos al pedir la baja; los que ya estaban inactivos permanecen inactivos. No se reactivan sesiones ni tokens push anteriores. La disponibilidad permanece apagada hasta que el usuario la habilite.

El reset de contraseña puede usarse durante la ventana de recuperación de una cuenta de contraseña, sin reactivar ni ampliar el plazo por sí solo. Luego se inicia sesión normalmente. No cambia credenciales Google. Nunca se reactiva una cuenta mediante refresh, OTP de verificación inicial ni una contraseña incorrecta.

En el instante de vencimiento ya se rechaza recuperación, aunque el trabajo de purga todavía no haya corrido. Las cuentas dadas de baja por código antiguo, sin fecha explícita de recuperación, no se reactivan ni se purgan automáticamente con este cambio.

## Qué significa eliminación definitiva

Un trabajo cada cinco minutos procesa hasta 50 cuentas vencidas. Anonimiza el registro de cuenta, libera email/UID, elimina datos del perfil, datos KYC locales, notificaciones/sesiones y referencias de medios propios. Conserva un identificador interno anónimo para mantener integridad del historial de órdenes, conversaciones, reseñas y denuncias de otros participantes. **No borra todo el historial compartido ni las copias de seguridad existentes**, ni llama a Didit/Firebase para borrar datos en esos proveedores.

Las órdenes y conversaciones históricas pueden contener texto libre aportado previamente: no se promete borrar cada dato personal que alguien haya escrito allí. Ajustar los textos de la app para expresar este alcance y no prometer que desaparece todo dato de todos los sistemas.

Los objetos propios identificables se encolan para eliminación en almacenamiento en la misma transacción. Si almacenamiento falla, la cola persiste y reintenta; no se intenta borrar URLs externas ni objetos de otras cuentas. Objetos huérfanos de subidas anteriores sin referencia y eliminación remota en proveedores requieren una política adicional. Las URLs ya firmadas pueden existir hasta que el objeto se elimine o venza la firma.

La purga y recuperación se serializan por usuario y no pueden completar ambas sobre la misma cuenta. La purga es idempotente. No se extiende el plazo por reintentos.

## Alcance y pruebas

Migración aditiva `20261021000000_account_lifecycle`: fecha de eliminación programada, fecha de anonimización, snapshot de servicios activos y cola durable de medios. No modifica cuentas históricas ni borra datos en el despliegue; el trabajo solo procesa cuentas con la nueva fecha vencida.

Sin cambios de pagos/planes: no se cancelan cobros externos ni se promete perder/restaurar Premium. Revisar el aviso de Premium del frontend por separado.

Verificar en una cuenta de prueba: contraseña incorrecta; Google UID ajeno/token sin autenticación reciente; orden activa y disputa; baja correcta; sesión anterior rechazada; recuperación antes del plazo con servicio activo/inactivo; vencimiento sin recuperación. CI agrega comprobaciones PostgreSQL de revocación, restauración, carrera orden/baja, vencimiento, purga concurrente y reintento de almacenamiento. No se realizan bajas reales en producción para probar.
