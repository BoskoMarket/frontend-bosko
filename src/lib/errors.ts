import { AxiosError } from "axios";
import { ERROR_MESSAGES, DEFAULT_ERROR_MESSAGE, type ErrorCode } from "./error-messages";

/** Detalle de error de validación por campo (ver frontend-error-contract.md) */
export interface ApiErrorDetail {
  field: string;
  message: string;
}

/** Respuesta de error del backend Bosko (frontend-error-contract.md) */
interface BackendErrorResponse {
  success: false;
  statusCode: number;
  code: string;
  message: string;
  details?: ApiErrorDetail[];
  timestamp: string;
  requestId?: string;
}

export interface ApiError {
  /** Código específico de la regla de negocio (ej: "INVALID_CREDENTIALS") */
  code: string;
  /** Mensaje original del backend (en inglés en producción) */
  serverMessage: string;
  /** Status HTTP */
  statusCode: number;
  /** Errores de validación por campo (solo en VALIDATION_ERROR) */
  details?: ApiErrorDetail[];
  /** ID de trazabilidad para soporte — nunca mostrar como mensaje al usuario */
  requestId?: string;
}

/**
 * Extrae { code, serverMessage, statusCode, details, requestId } del error,
 * sin traducir — la traducción la hace `getUserErrorMessage()`.
 */
export function extractApiError(error: unknown): ApiError {
  if ((error as AxiosError)?.isAxiosError) {
    const axiosError = error as AxiosError<BackendErrorResponse>;
    const data = axiosError.response?.data;

    if (data && typeof data === "object" && "code" in data) {
      return {
        code: data.code,
        serverMessage: data.message || axiosError.message,
        statusCode: data.statusCode || axiosError.response?.status || 500,
        details: data.details,
        requestId: data.requestId,
      };
    }

    // Error de red o respuesta sin el formato esperado
    return {
      code: "NETWORK_ERROR",
      serverMessage: axiosError.message,
      statusCode: axiosError.response?.status ?? 0,
    };
  }

  if (error instanceof Error) {
    return {
      code: "UNKNOWN_ERROR",
      serverMessage: error.message,
      statusCode: 0,
    };
  }

  return {
    code: "UNKNOWN_ERROR",
    serverMessage: "Ocurrió un error desconocido",
    statusCode: 0,
  };
}

/**
 * Devuelve el mensaje en español listo para mostrar al usuario.
 *
 * - `VALIDATION_ERROR` con `details[]`: arma un mensaje combinando cada
 *   `{field, message}` (el backend puede agregar campos que el cliente
 *   todavía no conoce sin romper el mapeo).
 * - `UNKNOWN_ERROR` (throw local, no viene del backend): usa el mensaje
 *   propio del `Error` en vez del genérico, porque ese texto lo escribió
 *   la app, no el server — no aplica la regla de "no confiar en message".
 * - `NETWORK_ERROR`: sin respuesta del server (offline, timeout).
 * - Resto: busca `code` en el catálogo; si no está, mensaje genérico.
 */
export function getUserErrorMessage(error: unknown): string {
  const { code, serverMessage, details } = extractApiError(error);

  if (code === "VALIDATION_ERROR" && details?.length) {
    return details.map((d) => `${d.field}: ${d.message}`).join("\n");
  }

  if (code === "NETWORK_ERROR") {
    return "No hay conexión con el servidor. Verificá tu internet e intentá de nuevo";
  }

  if (code === "UNKNOWN_ERROR") {
    return serverMessage || DEFAULT_ERROR_MESSAGE;
  }

  return ERROR_MESSAGES[code as ErrorCode] ?? DEFAULT_ERROR_MESSAGE;
}

/** Detalles de validación por campo, para asociarlos a inputs de un form. */
export function getFieldErrors(error: unknown): ApiErrorDetail[] {
  const { code, details } = extractApiError(error);
  return code === "VALIDATION_ERROR" ? (details ?? []) : [];
}
