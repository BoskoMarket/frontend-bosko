# Manual Frontend: contrato de errores

Guía mínima para consumir errores HTTP de Bosko. El frontend debe decidir qué
hacer usando `code`, nunca el texto de `message`.

## Respuesta

```json
{
  "success": false,
  "statusCode": 422,
  "code": "ORDER_NOT_ACCEPTED",
  "message": "Order is not accepted",
  "details": [
    { "field": "email", "message": "email must be an email" }
  ],
  "timestamp": "2026-08-21T12:00:00.000Z",
  "requestId": "req-7f3c..."
}
```

| Campo | Uso |
| --- | --- |
| `success` | Siempre `false` en una respuesta de error. |
| `statusCode` | Status HTTP de la respuesta. |
| `code` | Código estable para lógica, traducciones y acciones. |
| `message` | Texto seguro de respaldo. No usar para lógica. |
| `details` | Array opcional de errores de validación por campo. |
| `timestamp` | Fecha ISO en la que se generó el error. |
| `requestId` | ID opcional para soporte y trazabilidad. |

El contrato no incluye `path` ni detalles internos. Los errores `5xx` se
sanitizan a `INTERNAL_ERROR`; el detalle real queda únicamente en logs y
Sentry.

## Reglas de uso

- Usar `code` como clave de traducción y comportamiento.
- Usar `message` solo como fallback cuando no exista una traducción local.
- Para errores de campos, iterar `details[]` y asociar cada `{field, message}`
  al input correspondiente. Los campos anidados usan rutas como
  `address.city`.
- `details` solo aparece para `VALIDATION_ERROR`; tratarlo como opcional.
- No mostrar `requestId` como mensaje al usuario; conservarlo para soporte.
- No reintentar automáticamente errores `400`, `403`, `404`, `409` ni `422`.
- En `401`, intentar renovar la sesión una sola vez; si falla, limpiar la
  sesión y volver a autenticar.
- En `429`, respetar el backoff del cliente antes de reintentar.
- En `500` y `502`, mostrar indisponibilidad y reintentar solo operaciones
  seguras. En pagos, consultar primero el estado antes de repetir una mutación.
- No depender de `message`, del nombre de la excepción ni de textos en inglés.

## Mapeo rápido por status

| HTTP | Acción sugerida |
| ---: | --- |
| `400` | Mostrar validación o error de solicitud; no reintentar sin cambios. |
| `401` | Renovar sesión una vez; si falla, cerrar sesión. |
| `403` | Mostrar pantalla de permisos o requisitos faltantes. |
| `404` | Mostrar recurso inexistente o actualizar la lista. |
| `409` | Informar conflicto y refrescar el recurso antes de continuar. |
| `413` | Reducir el body o archivo enviado. |
| `422` | Mostrar regla de negocio; no reintentar automáticamente. |
| `429` | Esperar y reintentar con backoff. |
| `500` | Mostrar error general y usar `requestId` para soporte. |
| `502` | Mostrar dependencia temporalmente indisponible; evitar duplicar pagos. |

## Códigos generales

| Código | HTTP | Descripción |
| --- | ---: | --- |
| `INTERNAL_ERROR` | 500 | Error interno no clasificado. |
| `DOMAIN_ERROR` | 400 | Error de dominio genérico. |
| `HTTP_ERROR` | 400 | Solicitud rechazada sin una clasificación específica. |
| `BAD_REQUEST` | 400 | Solicitud inválida. |
| `VALIDATION_ERROR` | 400 | Uno o más campos no cumplen las reglas. |
| `UNAUTHORIZED` | 401 | No autorizado. |
| `FORBIDDEN` | 403 | No hay permisos suficientes. |
| `NOT_FOUND` | 404 | No existe el recurso solicitado. |
| `CONFLICT` | 409 | Existe un conflicto con el estado actual. |
| `UNPROCESSABLE_ENTITY` | 422 | La solicitud viola una regla procesable. |
| `PAYLOAD_TOO_LARGE` | 413 | El payload supera el límite permitido. |
| `RATE_LIMITED` | 429 | Se alcanzó el límite de uso. |

## Identidad y autenticación

| Código | HTTP | Descripción |
| --- | ---: | --- |
| `AUTHENTICATION_FAILED` | 401 | Falta un token válido, expiró o fue revocado. |
| `AUTHENTICATION_REQUIRED` | 403 | La operación requiere autenticación. |
| `INVALID_CREDENTIALS` | 401 | Email o contraseña inválidos. |
| `INVALID_REFRESH_TOKEN` | 401 | El refresh token no es válido. |
| `TOKEN_REUSE_DETECTED` | 401 | Se detectó reutilización; volver a iniciar sesión. |
| `INVALID_RESET_CODE` | 400 | Código de recuperación inválido o expirado. |
| `MAX_RESET_ATTEMPTS_EXCEEDED` | 400 | Se superó el máximo de intentos de recuperación. |
| `INVALID_VERIFICATION_CODE` | 400 | Código de verificación inválido. |
| `VERIFICATION_CODE_EXPIRED` | 422 | El código de verificación expiró. |
| `MAX_VERIFY_ATTEMPTS_EXCEEDED` | 422 | Se superó el máximo de intentos de verificación. |
| `EMAIL_ALREADY_VERIFIED` | 422 | El email ya fue verificado. |
| `EMAIL_ALREADY_IN_USE` | 409 | El email ya está registrado. |
| `USERNAME_ALREADY_IN_USE` | 409 | El nombre de usuario ya está ocupado. |
| `IDENTITY_NOT_VERIFIED` | 403 | La operación requiere identidad verificada. |
| `IDENTITY_ALREADY_VERIFIED` | 422 | La identidad ya fue verificada. |
| `VERIFICATION_IN_PROGRESS` | 422 | Hay una verificación en curso. |
| `NO_PREVIOUS_VERIFICATION` | 422 | No existe una verificación anterior para reintentar. |
| `MAX_ATTEMPTS_EXCEEDED` | 422 | Se alcanzó el máximo de intentos. |
| `INVALID_FIREBASE_TOKEN` | 400 | Token de Firebase inválido o expirado. |
| `MISSING_PHONE_NUMBER` | 400 | El token no contiene teléfono verificado. |

## Validación, archivos y contenido

| Código | HTTP | Descripción |
| --- | ---: | --- |
| `INVALID_EMAIL_FORMAT` | 400 | El formato del email no es válido. |
| `INVALID_PHONE` | 400 | El teléfono no es válido. |
| `INVALID_LATITUDE` | 400 | La latitud está fuera de rango. |
| `INVALID_LONGITUDE` | 400 | La longitud está fuera de rango. |
| `INVALID_RATING` | 400 | La calificación debe ser un entero entre 1 y 5. |
| `INVALID_ORDER_STATUS` | 400 | Estado de orden inválido. |
| `INVALID_PAYMENT_STATUS` | 400 | Estado de pago inválido. |
| `INVALID_VERIFICATION_STATUS` | 400 | Estado de verificación inválido. |
| `CURRENCY_REQUIRED` | 400 | Falta la moneda requerida. |
| `AMOUNT_CANNOT_BE_NEGATIVE` | 400 | El monto no puede ser negativo. |
| `PASSWORD_TOO_SHORT` | 400 | La contraseña nueva es demasiado corta. |
| `INVALID_IMAGE_TYPE` | 400 | El tipo de imagen no está permitido. |
| `INVALID_FILE_TYPE` | 400 | El tipo de archivo no es válido. |
| `FILE_SIZE_EXCEEDED` | 400 | El archivo supera el tamaño permitido. |
| `UNSUPPORTED_FILE_TYPE` | 400 | El tipo de archivo no está soportado. |
| `UNKNOWN_FILE_TYPE` | 400 | No se pudo detectar el tipo de archivo. |
| `NO_FILE_UPLOADED` | 400 | Falta el archivo requerido. |
| `NO_FILES_UPLOADED` | 400 | Falta al menos un archivo requerido. |
| `EMPTY_MESSAGE_CONTENT` | 400 | El mensaje no puede estar vacío. |
| `EMPTY_REPLY_CONTENT` | 400 | La respuesta no puede estar vacía. |

## Permisos y roles

| Código | HTTP | Descripción |
| --- | ---: | --- |
| `NOT_SERVICE_OWNER` | 403 | Solo el dueño puede administrar el servicio. |
| `NOT_ORDER_PARTICIPANT` | 403 | El usuario no participa de la orden. |
| `NOT_ORDER_PROVIDER` | 403 | Solo el proveedor puede realizar la acción. |
| `NOT_ORDER_CLIENT` | 403 | Solo el cliente puede realizar la acción. |
| `NOT_CONVERSATION_PARTICIPANT` | 403 | El usuario no participa de la conversación. |
| `NOT_REVIEW_AUTHOR` | 403 | Solo el autor puede eliminar la review. |
| `NOT_REVIEWED_PROVIDER` | 403 | Solo el proveedor reseñado puede responder. |
| `NOT_REEL_OWNER` | 403 | Solo el dueño puede administrar el reel. |
| `PROVIDERS_ONLY` | 403 | La acción requiere un perfil proveedor. |

## Recursos no encontrados

| Código | HTTP | Descripción |
| --- | ---: | --- |
| `USER_NOT_FOUND` | 404 | Usuario inexistente. |
| `ORDER_NOT_FOUND` | 404 | Orden inexistente. |
| `PROVIDER_NOT_FOUND` | 404 | Proveedor inexistente. |
| `CLIENT_NOT_FOUND` | 404 | Cliente inexistente. |
| `SERVICE_NOT_FOUND` | 404 | Servicio inexistente. |
| `REEL_NOT_FOUND` | 404 | Reel inexistente. |
| `POST_NOT_FOUND` | 404 | Post inexistente. |
| `REVIEW_NOT_FOUND` | 404 | Review inexistente. |
| `CONVERSATION_NOT_FOUND` | 404 | Conversación inexistente. |
| `PLAN_NOT_FOUND` | 404 | Plan inexistente. |
| `PAYMENT_NOT_FOUND` | 404 | Pago inexistente. |
| `PAID_PAYMENT_NOT_FOUND` | 404 | No existe un pago acreditado para la orden. |
| `NO_PLAN_AVAILABLE` | 404 | No hay un plan disponible. |
| `NO_ACTIVE_SUBSCRIPTION` | 404 | No existe una suscripción activa. |

## Órdenes, servicios y suscripciones

| Código | HTTP | Descripción |
| --- | ---: | --- |
| `SERVICE_NOT_ACTIVE` | 422 | El servicio no está activo. |
| `CANNOT_ORDER_OWN_SERVICE` | 422 | No se puede contratar el propio servicio. |
| `ORDER_NOT_COMPLETED` | 422 | La orden todavía no está completada. |
| `ORDER_NOT_ACCEPTED` | 422 | La orden no fue aceptada. |
| `ORDER_DISPUTED` | 422 | La orden está en disputa. |
| `INVALID_ORDER_STATUS_TRANSITION` | 422 | El cambio de estado no está permitido. |
| `ORDER_STATUS_STALE` | 409 | La orden cambió mientras se procesaba. |
| `SERVICE_LIMIT_REACHED` | 422 | Se alcanzó el límite de servicios del plan. |
| `CANNOT_FOLLOW_SELF` | 422 | No se puede seguir al propio usuario. |
| `CANNOT_SUBSCRIBE_TO_FREE_PLAN` | 422 | No se puede suscribir al plan gratuito. |
| `NO_ACTIVE_SUBSCRIPTION` | 404 | No hay una suscripción activa. |
| `ALREADY_REVIEWED` | 409 | La orden ya fue reseñada por este usuario. |
| `REVIEW_ALREADY_HAS_REPLY` | 409 | La review ya tiene una respuesta. |
| `CANNOT_REPORT_OWN_REVIEW` | 400 | No se puede reportar la propia review. |

## Pagos y webhooks

| Código | HTTP | Descripción |
| --- | ---: | --- |
| `INSUFFICIENT_BALANCE` | 422 | El balance es insuficiente. |
| `PAYMENT_NOT_PAID` | 422 | El pago no está acreditado. |
| `PAYMENT_GATEWAY_ERROR` | 502 | Falló la pasarela de pagos. |
| `EXTERNAL_PROVIDER_ERROR` | 502 | Falló un proveedor externo. |
| `INVALID_WEBHOOK_SIGNATURE` | 401 | Firma de webhook inválida. |
| `INVALID_WEBHOOK_PAYLOAD` | 400 | Payload de webhook inválido. |
| `UNIDENTIFIABLE_WEBHOOK` | 400 | No se pudo identificar el evento. |

## Casos especiales de UI

### Validación de formularios

```ts
if (error.code === 'VALIDATION_ERROR') {
  for (const detail of error.details ?? []) {
    form.setError(detail.field, { message: detail.message });
  }
}
```

Si el backend agrega un campo que el cliente todavía no conoce, mostrar sus
detalles en un mensaje general sin romper el formulario.

### Sesión

- `INVALID_CREDENTIALS`: mostrar error de login sin revelar si existe el email.
- `INVALID_REFRESH_TOKEN` o `TOKEN_REUSE_DETECTED`: eliminar tokens locales y
  enviar al login.
- `AUTHENTICATION_FAILED`: intentar refresh una sola vez si la operación lo
  permite; después cerrar sesión.

### Pagos

Ante `PAYMENT_GATEWAY_ERROR`, `EXTERNAL_PROVIDER_ERROR` o un timeout, no asumir
que el pago falló ni repetir automáticamente una operación financiera. Mostrar
estado pendiente y consultar el estado de la orden/pago.

## Referencias

- [`error-response.contract.md`](./error-response.contract.md): contrato
  técnico completo del response.
- [`error-codes.md`](./error-codes.md): inventario endpoint → códigos y status.
- `src/domain/shared/errors/error-codes.ts`: catálogo de referencia del backend.

## No usar

- No depender de `message` para lógica ni traducciones permanentes.
- No mostrar `requestId` como error principal.
- No exponer detalles técnicos de providers, base de datos o infraestructura.
- No interpretar cualquier `5xx` como una operación financiera fallida.
- No agregar códigos frontend que no existan en el catálogo del backend.
