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

    const status = axiosError.response?.status;

    // Sin respuesta del server: offline, timeout o DNS
    if (!status) {
      return { code: "NETWORK_ERROR", serverMessage: axiosError.message, statusCode: 0 };
    }

    // Respuesta sin el envelope esperado (proxy, gateway, rate limiter externo)
    return {
      code: status === 429 ? "RATE_LIMITED" : status >= 500 ? "INTERNAL_ERROR" : "HTTP_ERROR",
      serverMessage: axiosError.message,
      statusCode: status,
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
 * - `NETWORK_ERROR`: sin respuesta del server (offline, timeout). Un 5xx o
 *   429 sin envelope se normaliza a `INTERNAL_ERROR` / `RATE_LIMITED`.
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

export interface FormErrors<F extends string> {
  /** Mensaje por input conocido del formulario. */
  fields: Partial<Record<F, string>>;
  /** Mensaje general: errores que no son de campo o campos que el form no conoce. */
  general: string | null;
}

/**
 * Asocia `details[]` de un `VALIDATION_ERROR` a los inputs del formulario.
 * Los campos que el cliente todavía no conoce se agrupan en `general`, así el
 * backend puede sumar validaciones sin romper el form (frontend-error-contract.md).
 */
export function getFormErrors<F extends string>(
  error: unknown,
  knownFields: readonly F[],
): FormErrors<F> {
  const details = getFieldErrors(error);
  if (!details.length) return { fields: {}, general: getUserErrorMessage(error) };

  const fields: Partial<Record<F, string>> = {};
  const unknown: string[] = [];
  for (const { field, message } of details) {
    if ((knownFields as readonly string[]).includes(field)) {
      fields[field as F] ??= message;
    } else {
      unknown.push(`${field}: ${message}`);
    }
  }
  return { fields, general: unknown.length ? unknown.join("\n") : null };
}

/** Status que nunca se reintentan: repetir el request no cambia el resultado. */
const NON_RETRYABLE_STATUS = [400, 401, 403, 404, 409, 422];
const MAX_RETRY_DELAY_MS = 30_000;

/** Política de reintento para queries (operaciones seguras): red, 429 y 5xx. */
export function shouldRetryRequest(failureCount: number, error: unknown): boolean {
  const status = (error as AxiosError)?.response?.status;
  if (status && NON_RETRYABLE_STATUS.includes(status)) return false;
  return failureCount < 2;
}

/** Lee `Retry-After` (segundos o fecha HTTP) de un 429/503. */
export function getRetryAfterMs(error: unknown): number | null {
  const header = (error as AxiosError)?.response?.headers?.["retry-after"];
  if (header == null) return null;
  const value = String(header).trim();
  const seconds = Number(value);
  if (value !== "" && Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const date = Date.parse(value);
  return Number.isNaN(date) ? null : Math.max(0, date - Date.now());
}

/** Backoff exponencial; respeta `Retry-After` cuando el server lo manda. */
export function getRetryDelayMs(attemptIndex: number, error: unknown): number {
  const delay = getRetryAfterMs(error) ?? 1000 * 2 ** attemptIndex;
  return Math.min(delay, MAX_RETRY_DELAY_MS);
}
