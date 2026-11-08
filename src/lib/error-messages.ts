/**
 * Mapa de códigos de error del backend → mensajes para el usuario en español.
 *
 * Cada código corresponde al campo `code` que devuelve el backend en la respuesta
 * de error: { success: false, statusCode, code, message, details?, timestamp, requestId? }.
 *
 * Si un código no está mapeado, se usa un mensaje genérico.
 */

const AUTH = {
  INVALID_CREDENTIALS: "Email o contraseña incorrectos",
  INVALID_REFRESH_TOKEN: "Tu sesión expiró. Vuelve a iniciar sesión",
  TOKEN_REUSE_DETECTED:
    "Detectamos un uso sospechoso de tu sesión. Vuelve a iniciar sesión",
  AUTHENTICATION_FAILED: "No pudimos autenticarte. Vuelve a intentarlo",
  INVALID_FIREBASE_TOKEN: "Error al verificar con Firebase. Reintenta",
  MISSING_PHONE_NUMBER: "No se pudo obtener tu número de teléfono",
  ACCOUNT_SUSPENDED: "Tu cuenta está suspendida. Contacta a soporte",
} as const;

const REGISTER = {
  EMAIL_ALREADY_IN_USE: "Ese email ya está registrado. ¿Quieres iniciar sesión?",
  USERNAME_ALREADY_IN_USE: "Ese nombre de usuario ya está ocupado",
} as const;

const MARKET = {
  CITY_NOT_FOUND: "La ciudad elegida no está disponible. Elige otra",
  CITY_REQUIRED: "Elige tu ciudad para continuar",
  CITY_ALREADY_SET: "Tu ciudad ya está definida. Para cambiarla, contacta a soporte",
  TERMS_NOT_ACCEPTED:
    "Debes aceptar los términos y la política de privacidad para continuar",
  CITY_MISMATCH: "Este servicio no está disponible en tu ciudad.",
  PHONE_COUNTRY_MISMATCH: "El teléfono no corresponde al país de tu ciudad",
} as const;

const VERIFICATION = {
  // Email OTP
  INVALID_VERIFICATION_CODE: "El código de verificación es incorrecto",
  VERIFICATION_CODE_EXPIRED: "El código expiró. Pide uno nuevo",
  MAX_VERIFY_ATTEMPTS_EXCEEDED:
    "Demasiados intentos. Pide un nuevo código de verificación",
  EMAIL_ALREADY_VERIFIED: "Tu email ya fue verificado",
  INVALID_RESET_CODE:
    "El código de recuperación es inválido o ya expiró. Pide uno nuevo",
  MAX_RESET_ATTEMPTS_EXCEEDED:
    "Demasiados intentos de recuperación. Pide un nuevo código",

  // Identity verification
  IDENTITY_ALREADY_VERIFIED: "Tu identidad ya fue verificada",
  MAX_ATTEMPTS_EXCEEDED:
    "Superaste el límite de intentos de verificación. Contacta a soporte",
  VERIFICATION_IN_PROGRESS:
    "Ya tienes una verificación en curso. Espera a que termine",
  NO_PREVIOUS_VERIFICATION:
    "No hay una verificación anterior. Inicia una nueva verificación",
  NO_BACKGROUND_CHECK_PENDING:
    "No hay una verificación de antecedentes pendiente para este usuario",
  BACKGROUND_CHECK_ALREADY_APPROVED:
    "La verificación de antecedentes ya fue aprobada",
  IDENTITY_NOT_VERIFIED:
    "Necesitas verificar tu identidad para realizar esta acción",
  PHONE_NOT_VERIFIED: "Verifica tu teléfono para publicar tu servicio.",
} as const;

const PASSWORD = {
  INCORRECT_PASSWORD: "La contraseña actual es incorrecta",
  PASSWORD_TOO_SHORT: "La contraseña nueva debe tener al menos 8 caracteres",
} as const;

const GENERAL_INPUT = {
  INVALID_EMAIL_FORMAT: "El formato del email no es válido",
  INVALID_PHONE: "El número de teléfono no es válido",
  INVALID_RATING: "La calificación debe ser un número entero del 1 al 5",
  INVALID_FILE_TYPE: "El formato del archivo no es válido",
  INVALID_IMAGE_TYPE: "La imagen no es válida. Usa JPEG, PNG, WebP o GIF",
  AMOUNT_CANNOT_BE_NEGATIVE: "El monto no puede ser negativo",
  CURRENCY_REQUIRED: "La moneda es obligatoria",
  INVALID_LATITUDE: "La latitud debe estar entre -90 y 90",
  INVALID_LONGITUDE: "La longitud debe estar entre -180 y 180",
  INVALID_ORDER_STATUS: "El estado de la orden no es válido",
  INVALID_PAYMENT_STATUS: "El estado del pago no es válido",
  INVALID_VERIFICATION_STATUS: "El estado de verificación no es válido",
  EMPTY_MESSAGE_CONTENT: "El mensaje no puede estar vacío",
  EMPTY_REPLY_CONTENT: "La respuesta no puede estar vacía",
  NO_FILE_UPLOADED: "Tienes que seleccionar un archivo",
  NO_FILES_UPLOADED: "Tienes que seleccionar al menos una imagen",
  UNSUPPORTED_FILE_TYPE: "El tipo de archivo no está permitido",
  UNKNOWN_FILE_TYPE: "No se pudo detectar el tipo de archivo",
  FILE_SIZE_EXCEEDED: "El archivo es demasiado grande",
  UNSUPPORTED_IMAGE_TYPE: "El formato de imagen no está permitido",
} as const;

const NOT_FOUND = {
  USER_NOT_FOUND: "Usuario no encontrado",
  CLIENT_NOT_FOUND: "Cliente no encontrado",
  PROVIDER_NOT_FOUND: "Proveedor no encontrado",
  SERVICE_NOT_FOUND: "Servicio no encontrado",
  ORDER_NOT_FOUND: "Orden no encontrada",
  PAYMENT_NOT_FOUND: "Pago no encontrado",
  PAID_PAYMENT_NOT_FOUND: "No se encontró un pago realizado para esta orden",
  PLAN_NOT_FOUND: "Plan no encontrado",
  NO_PLAN_AVAILABLE: "No hay ningún plan disponible en este momento",
  NO_ACTIVE_SUBSCRIPTION: "No tienes una suscripción activa",
  REVIEW_NOT_FOUND: "Reseña no encontrada",
  CONVERSATION_NOT_FOUND: "Conversación no encontrada",
  REEL_NOT_FOUND: "Reel no encontrado",
  POST_NOT_FOUND: "Publicación no encontrada",
} as const;

const FORBIDDEN = {
  NOT_ORDER_PARTICIPANT: "No eres parte de esta orden",
  NOT_ORDER_PROVIDER: "Solo el proveedor puede realizar esta acción",
  NOT_CONVERSATION_PARTICIPANT:
    "No eres parte de esta conversación",
  NOT_REVIEWED_PROVIDER:
    "Solo el proveedor evaluado puede responder esta reseña",
  NOT_REVIEW_AUTHOR: "Solo puedes eliminar tus propias reseñas",
  NOT_SERVICE_OWNER: "No eres el dueño de este servicio",
  NOT_ORDER_CLIENT: "Solo el cliente puede iniciar el pago",
  NOT_REEL_OWNER: "No puedes eliminar un reel que no es tuyo",
  PROVIDERS_ONLY:
    "Solo los proveedores tienen acceso al panel de control",
  AUTHENTICATION_REQUIRED: "Necesitas iniciar sesión para continuar",
  SERVICE_LIMIT_REACHED:
    "Llegaste al límite de servicios. Mejora tu plan para crear más",
} as const;

const ORDER = {
  SERVICE_NOT_ACTIVE: "Este servicio ya no está activo",
  CANNOT_ORDER_OWN_SERVICE: "No puedes contratar tu propio servicio",
  ORDER_NOT_COMPLETED:
    "La orden debe estar completada antes de realizar esta acción",
  ORDER_NOT_ACCEPTED:
    "La orden debe ser aceptada por el proveedor antes de pagar",
  ORDER_DISPUTED: "No se puede liberar el pago de una orden en disputa",
  INVALID_ORDER_STATUS_TRANSITION: "Ese cambio de estado no está permitido",
  INVALID_ORDER_TRANSITION: "La orden cambió de estado. Actualizamos la vista.",
  ORDER_STATUS_STALE:
    "La orden cambió mientras se procesaba. Actualiza y vuelve a intentar",
} as const;

const PAYMENT = {
  INSUFFICIENT_BALANCE: "El balance es insuficiente para esta operación",
  PAYMENT_NOT_PAID: "El pago aún no fue realizado",
  PAYMENT_GATEWAY_ERROR:
    "Error al procesar el pago. Intenta de nuevo en unos minutos",
  EXTERNAL_PROVIDER_ERROR:
    "Un servicio externo no respondió. Intenta de nuevo en unos minutos",
  INVALID_WEBHOOK_SIGNATURE:
    "Firma de webhook inválida. Verifica la configuración del proveedor de pagos",
  INVALID_WEBHOOK_PAYLOAD:
    "El webhook recibido no contiene los datos esperados",
  UNIDENTIFIABLE_WEBHOOK: "No se pudo identificar el evento del webhook",
} as const;

const PLAN = {
  CANNOT_SUBSCRIBE_TO_FREE_PLAN:
    "Ya tienes el plan gratuito. Mejora tu plan para acceder a más beneficios",
} as const;

const SOCIAL = {
  CANNOT_FOLLOW_SELF: "No puedes seguirte a ti mismo",
  ALREADY_REVIEWED: "Ya dejaste una reseña para este pedido",
  REVIEW_ALREADY_HAS_REPLY: "Esta reseña ya tiene una respuesta",
  CANNOT_REPORT_OWN_REVIEW: "No puedes reportar tu propia reseña",
} as const;

/** Códigos genéricos que agrupan errores no clasificados por status HTTP. */
const GENERIC = {
  BAD_REQUEST: "La solicitud no es válida",
  DOMAIN_ERROR: "No se pudo completar la operación",
  HTTP_ERROR: "La solicitud fue rechazada",
  UNAUTHORIZED: "Necesitas iniciar sesión para continuar",
  FORBIDDEN: "No tienes permiso para realizar esta acción",
  NOT_FOUND: "No se encontró el recurso solicitado",
  CONFLICT: "Hay un conflicto con el estado actual. Actualiza e intenta de nuevo",
  UNPROCESSABLE_ENTITY: "No se pudo procesar la solicitud",
  PAYLOAD_TOO_LARGE: "El archivo o solicitud es demasiado grande",
  RATE_LIMITED: "Hiciste demasiadas solicitudes. Espera un momento e intenta de nuevo",
  INTERNAL_ERROR: "Ocurrió un error en el servidor. Intenta de nuevo más tarde",
} as const;

export const ERROR_MESSAGES: Record<string, string> = {
  ...GENERIC,
  ...AUTH,
  ...REGISTER,
  ...MARKET,
  ...VERIFICATION,
  ...PASSWORD,
  ...GENERAL_INPUT,
  ...NOT_FOUND,
  ...FORBIDDEN,
  ...ORDER,
  ...PAYMENT,
  ...PLAN,
  ...SOCIAL,
};

export type ErrorCode = keyof typeof ERROR_MESSAGES;

export const DEFAULT_ERROR_MESSAGE =
  "Ocurrió un error inesperado. Intenta de nuevo";
