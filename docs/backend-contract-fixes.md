# Contratos de verificación, chat y reseñas

Cambios aditivos para coordinar con frontend. Prefijo común: `/api/v1`.

## Reenvío de verificación de registro

`POST /auth/resend-verification`, público, body JSON `{ "email": "usuario@ejemplo.com" }`.
Respuesta HTTP 200 dentro del envelope habitual:

```json
{
  "success": true,
  "data": { "message": "If the account requires verification, a verification code has been sent." },
  "timestamp": "..."
}
```

El correo se normaliza. La respuesta es la misma para cuentas inexistentes, verificadas, borradas o que agotaron el límite de envío. No devuelve userId, OTP ni tokens. Para una cuenta pendiente se genera un código de seis dígitos válido por diez minutos; reemplaza el anterior y reinicia sus intentos. Se verifica mediante el endpoint existente `POST /auth/verify-email` con `{email,code}`. No se debe volver a registrar el mismo correo para reenviar.

Límites: una emisión por cuenta cada 60 segundos, hasta cinco en una ventana de una hora iniciada con el primer reenvío; el sexto no envía correo y conserva la respuesta genérica. La exclusión de reenvíos concurrentes usa Redis SET NX EX. El endpoint además tiene throttle HTTP por IP de tres solicitudes por minuto (429 al superarlo). El frontend debe ofrecer una espera de 60 segundos, sin interpretar 200 como confirmación de existencia de la cuenta. Un error SMTP tampoco revela si existe; permite reintentar al vencer la espera. La verificación original sigue limitada a cinco intentos por código. Redis debe estar disponible; sus fallos no habilitan envíos sin límite.

## Chat de órdenes cerradas

Tanto `POST /conversations/:id/messages`, `POST /conversations/:id/media` como el evento Socket.IO `send_message` rechazan la escritura en órdenes `completed` y `cancelled`.

HTTP devuelve 409 con `code: "ORDER_CLOSED"` y el mensaje `La orden está cerrada y el chat es de solo lectura.` dentro del envelope de error habitual. Socket.IO emite `error` con `{code,message}` y no emite una confirmación `message_received` para ese envío. El cliente debe refrescar el estado y dejar el chat en solo lectura.

En `pending`, `accepted`, `in_progress` y **`disputed`** se puede escribir. La lectura del historial permanece disponible para participantes. La pertenencia a la conversación se valida antes de exponer el estado.

La regla se comprueba al entrar al caso de uso y otra vez dentro de la transacción que guarda el mensaje, bloqueando la fila de la orden. Así se serializa con el cierre concurrente de la orden. Un envío que ya obtuvo el bloqueo puede terminar antes del cierre; una escritura posterior al cierre se rechaza sin mensaje ni notificación. Si la orden se cerró mientras se subía un archivo, se intenta eliminar el objeto recién subido; una falla de esa limpieza no cambia el 409 original. Los mensajes de sistema de las transiciones siguen siendo generados por su propia transacción.

`GET /conversations` y `GET /conversations/:orderId` agregan `orderStatus` en minúsculas; no hay que deducirlo de la última burbuja. Es un snapshot: siempre rige el estado al guardar el mensaje. Si una relación inválida impide conocer el estado, puede devolverse null en lectura y la escritura falla cerrada.

## Reseña en detalle de orden

`GET /orders/:id` agrega `review: null` si el cliente no calificó, o `{ "id": "...", "rating": 5, "comment": "..." }` con su reseña existente. Ambos participantes autorizados reciben la reseña del cliente de esa orden. El resto del contrato se conserva.

Frontend puede usar `order.review` para ocultar Calificar y mostrar la calificación ya realizada. Tras crear una reseña debe invalidar/refrescar el detalle; el backend conserva la protección contra reseñas duplicadas.

## Alcance

No requiere migraciones ni cambios de variables. No modifica el frontend. Portada, subida de reels, denuncias, recuperación/baja de cuenta y KYC quedan fuera de este cambio.

Pruebas: regresiones unitarias para OTP vencido y sustitución de código, concurrencia y límites de envío, chat cerrado/abierto/en disputa, medios cerrados durante upload, error de socket y reseña por participante. La suite PostgreSQL comprueba rechazo transaccional, cierre concurrente, ausencia de mensaje/outbox y lectura de reseña persistida.
