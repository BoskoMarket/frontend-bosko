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
  INVALID_REFRESH_TOKEN: "Tu sesión expiró. Volvé a iniciar sesión",
  TOKEN_REUSE_DETECTED:
    "Detectamos un uso sospechoso de tu sesión. Volvé a iniciar sesión",
  AUTHENTICATION_FAILED: "No pudimos autenticarte. Volvé a intentarlo",
  INVALID_FIREBASE_TOKEN: "Error al verificar con Firebase. Reintentá",
  MISSING_PHONE_NUMBER: "No se pudo obtener tu número de teléfono",
} as const;

const REGISTER = {
  EMAIL_ALREADY_IN_USE: "Ese email ya está registrado. ¿Querés iniciar sesión?",
  USERNAME_ALREADY_IN_USE: "Ese nombre de usuario ya está ocupado",
} as const;

const VERIFICATION = {
  // Email OTP
  INVALID_VERIFICATION_CODE: "El código de verificación es incorrecto",
  VERIFICATION_CODE_EXPIRED: "El código expiró. Pedí uno nuevo",
  MAX_VERIFY_ATTEMPTS_EXCEEDED:
    "Demasiados intentos. Pedí un nuevo código de verificación",
  EMAIL_ALREADY_VERIFIED: "Tu email ya fue verificado",
  INVALID_RESET_CODE:
    "El código de recuperación es inválido o ya expiró. Pedí uno nuevo",
  MAX_RESET_ATTEMPTS_EXCEEDED:
    "Demasiados intentos de recuperación. Pedí un nuevo código",

  // Identity verification
  IDENTITY_ALREADY_VERIFIED: "Tu identidad ya fue verificada",
  MAX_ATTEMPTS_EXCEEDED:
    "Superaste el límite de intentos de verificación. Contactá a soporte",
  VERIFICATION_IN_PROGRESS:
    "Ya tenés una verificación en curso. Esperá a que termine",
  NO_PREVIOUS_VERIFICATION:
    "No hay una verificación anterior. Iniciá una nueva verificación",
  NO_BACKGROUND_CHECK_PENDING:
    "No hay una verificación de antecedentes pendiente para este usuario",
  BACKGROUND_CHECK_ALREADY_APPROVED:
    "La verificación de antecedentes ya fue aprobada",
  IDENTITY_NOT_VERIFIED:
    "Necesitás verificar tu identidad para realizar esta acción",
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
  INVALID_IMAGE_TYPE: "La imagen no es válida. Usá JPEG, PNG, WebP o GIF",
  AMOUNT_CANNOT_BE_NEGATIVE: "El monto no puede ser negativo",
  CURRENCY_REQUIRED: "La moneda es obligatoria",
  INVALID_LATITUDE: "La latitud debe estar entre -90 y 90",
  INVALID_LONGITUDE: "La longitud debe estar entre -180 y 180",
  INVALID_ORDER_STATUS: "El estado de la orden no es válido",
  INVALID_VERIFICATION_STATUS: "El estado de verificación no es válido",
  EMPTY_MESSAGE_CONTENT: "El mensaje no puede estar vacío",
  EMPTY_REPLY_CONTENT: "La respuesta no puede estar vacía",
  NO_FILE_UPLOADED: "Tenés que seleccionar un archivo",
  NO_FILES_UPLOADED: "Tenés que seleccionar al menos una imagen",
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
  PLAN_NOT_FOUND: "Plan no encontrado",
  NO_PLAN_AVAILABLE: "No hay ningún plan disponible en este momento",
  NO_ACTIVE_SUBSCRIPTION: "No tenés una suscripción activa",
  REVIEW_NOT_FOUND: "Reseña no encontrada",
  CONVERSATION_NOT_FOUND: "Conversación no encontrada",
  REEL_NOT_FOUND: "Reel no encontrado",
  POST_NOT_FOUND: "Publicación no encontrada",
} as const;

const FORBIDDEN = {
  NOT_ORDER_PARTICIPANT: "No sos parte de esta orden",
  NOT_ORDER_PROVIDER: "Solo el proveedor puede realizar esta acción",
  NOT_CONVERSATION_PARTICIPANT:
    "No sos parte de esta conversación",
  NOT_REVIEWED_PROVIDER:
    "Solo el proveedor evaluado puede responder esta reseña",
  NOT_REVIEW_AUTHOR: "Solo podés eliminar tus propias reseñas",
  NOT_SERVICE_OWNER: "No sos el dueño de este servicio",
  NOT_ORDER_CLIENT: "Solo el cliente puede realizar esta acción",
  NOT_REEL_OWNER: "No podés eliminar un reel que no es tuyo",
  PROVIDERS_ONLY:
    "Solo los proveedores tienen acceso al panel de control",
  AUTHENTICATION_REQUIRED: "Necesitás iniciar sesión para continuar",
  SERVICE_LIMIT_REACHED:
    "Llegaste al límite de servicios. Mejorá tu plan para crear más",
} as const;

const ORDER = {
  SERVICE_NOT_ACTIVE: "Este servicio ya no está activo",
  CANNOT_ORDER_OWN_SERVICE: "No podés contratar tu propio servicio",
  ORDER_NOT_COMPLETED:
    "La orden debe estar completada antes de realizar esta acción",
  ORDER_NOT_ACCEPTED:
    "La orden debe ser aceptada por el proveedor antes de continuar",
  ORDER_DISPUTED: "No se puede realizar esta acción sobre una orden en disputa",
  INVALID_ORDER_STATUS_TRANSITION: "Ese cambio de estado no está permitido",
  ORDER_STATUS_STALE:
    "La orden cambió mientras se procesaba. Actualizá y volvé a intentar",
} as const;

const INTEGRATION = {
  EXTERNAL_PROVIDER_ERROR:
    "Un servicio externo no respondió. Intentá de nuevo en unos minutos",
  INVALID_WEBHOOK_SIGNATURE:
    "Firma de webhook inválida. Verificá la configuración del servicio externo",
  INVALID_WEBHOOK_PAYLOAD:
    "El webhook recibido no contiene los datos esperados",
  UNIDENTIFIABLE_WEBHOOK: "No se pudo identificar el evento del webhook",
} as const;

const PLAN = {
  CANNOT_SUBSCRIBE_TO_FREE_PLAN:
    "Ya tenés el plan gratuito. Mejorá tu plan para acceder a más beneficios",
} as const;

const SOCIAL = {
  CANNOT_FOLLOW_SELF: "No podés seguirte a vos mismo",
  ALREADY_REVIEWED: "Ya dejaste una reseña para este pedido",
  REVIEW_ALREADY_HAS_REPLY: "Esta reseña ya tiene una respuesta",
  CANNOT_REPORT_OWN_REVIEW: "No podés reportar tu propia reseña",
} as const;

/** Códigos genéricos que agrupan errores no clasificados por status HTTP. */
const GENERIC = {
  BAD_REQUEST: "La solicitud no es válida",
  DOMAIN_ERROR: "No se pudo completar la operación",
  HTTP_ERROR: "La solicitud fue rechazada",
  UNAUTHORIZED: "Necesitás iniciar sesión para continuar",
  FORBIDDEN: "No tenés permiso para realizar esta acción",
  NOT_FOUND: "No se encontró el recurso solicitado",
  CONFLICT: "Hay un conflicto con el estado actual. Actualizá e intentá de nuevo",
  UNPROCESSABLE_ENTITY: "No se pudo procesar la solicitud",
  PAYLOAD_TOO_LARGE: "El archivo o solicitud es demasiado grande",
  RATE_LIMITED: "Hiciste demasiadas solicitudes. Esperá un momento e intentá de nuevo",
  INTERNAL_ERROR: "Ocurrió un error en el servidor. Intentá de nuevo más tarde",
} as const;

export const ERROR_MESSAGES: Record<string, string> = {
  ...GENERIC,
  ...AUTH,
  ...REGISTER,
  ...VERIFICATION,
  ...PASSWORD,
  ...GENERAL_INPUT,
  ...NOT_FOUND,
  ...FORBIDDEN,
  ...ORDER,
  ...INTEGRATION,
  ...PLAN,
  ...SOCIAL,
};

export type ErrorCode = keyof typeof ERROR_MESSAGES;

export const DEFAULT_ERROR_MESSAGE =
  "Ocurrió un error inesperado. Intentá de nuevo";

