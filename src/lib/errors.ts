import axios, { AxiosError } from "axios";
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
  if (isCancelledError(error)) {
    return { code: "REQUEST_CANCELLED", serverMessage: (error as Error).message ?? "canceled", statusCode: 0 };
  }

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

export const NETWORK_ERROR_MESSAGE =
  "No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.";

export const CANCELLED_ERROR_MESSAGE = "La solicitud se canceló.";

/** Generic copy for a VALIDATION_ERROR that cannot be tied to a visible input (never shows field names). */
export const VALIDATION_ERROR_MESSAGE = "Revisa los datos e inténtalo de nuevo.";

/** true cuando el request fue abortado por la app (AbortController / CanceledError), no por la red. */
export function isCancelledError(error: unknown): boolean {
  const e = error as { code?: string; name?: string } | null | undefined;
  if (!e || typeof e !== "object") return false;
  return axios.isCancel(error) || e.code === "ERR_CANCELED" || e.name === "CanceledError";
}

/** true cuando el request no llegó al servidor (sin respuesta: offline, timeout, DNS). */
export function isNetworkError(error: unknown): boolean {
  if (isCancelledError(error)) return false;
  const e = error as AxiosError | undefined;
  if (!e?.isAxiosError) return false;
  if (e.code === "ERR_NETWORK" || e.code === "ECONNABORTED" || e.code === "ETIMEDOUT") return true;
  return !e.response;
}

/**
 * Devuelve el mensaje en español listo para mostrar al usuario.
 *
 * - `VALIDATION_ERROR` con `details[]`: arma un mensaje combinando cada
 *   `message` (sin duplicados y sin nombres de campo crudos).
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
    // Messages only, deduped: raw backend field names never reach the user.
    return [...new Set(details.map((d) => d.message))].join("\n");
  }

  if (code === "NETWORK_ERROR") {
    return NETWORK_ERROR_MESSAGE;
  }

  if (code === "REQUEST_CANCELLED") {
    return CANCELLED_ERROR_MESSAGE;
  }

  if (code === "UNKNOWN_ERROR") {
    return serverMessage || DEFAULT_ERROR_MESSAGE;
  }

  return ERROR_MESSAGES[code as ErrorCode] ?? DEFAULT_ERROR_MESSAGE;
}

export type ErrorKind =
  | "cancelled"
  | "offline"
  | "rate_limited"
  | "forbidden"
  | "not_found"
  | "server"
  | "unknown";

/** Clasifica un error para elegir el estado de UI (offline vs. server vs. permisos, etc.). */
export function getErrorKind(error: unknown): ErrorKind {
  if (isCancelledError(error)) return "cancelled";
  const { code, statusCode } = extractApiError(error);
  if (code === "NETWORK_ERROR") return "offline";
  if (code === "RATE_LIMITED" || statusCode === 429) return "rate_limited";
  if (statusCode === 401 || statusCode === 403) return "forbidden";
  if (statusCode === 404) return "not_found";
  if (statusCode >= 500) return "server";
  return "unknown";
}

export const LOAD_ERROR_MESSAGES: Record<Exclude<ErrorKind, "cancelled">, string> = {
  offline: NETWORK_ERROR_MESSAGE,
  rate_limited: "Hiciste demasiadas solicitudes. Espera un momento e intenta de nuevo.",
  forbidden: "No tienes permiso para ver este contenido.",
  not_found: "Este contenido ya no está disponible.",
  server: "Tuvimos un problema en el servidor. Intenta de nuevo más tarde.",
  unknown: "No pudimos cargar la información. Intenta de nuevo.",
};

/** Generic transport/status codes: their kind-based copy fits a load state better. */
const KIND_COPY_CODES = new Set(["FORBIDDEN", "NOT_FOUND", "INTERNAL_ERROR", "RATE_LIMITED", "HTTP_ERROR"]);

/**
 * Message for failed load states. A catalogued backend code (400/409/422, ACCOUNT_SUSPENDED,
 * session errors...) keeps its specific copy; otherwise the kind-based copy applies.
 * Only `offline` talks about the connection and a 401 never says "no permission".
 */
export function getLoadErrorMessage(error: unknown): string {
  const kind = getErrorKind(error);
  if (kind === "cancelled") return CANCELLED_ERROR_MESSAGE;
  if (kind === "offline") return NETWORK_ERROR_MESSAGE;
  const { code, statusCode } = extractApiError(error);
  if (code === "VALIDATION_ERROR") return VALIDATION_ERROR_MESSAGE;
  if (!KIND_COPY_CODES.has(code) && code !== "UNKNOWN_ERROR") {
    const catalogued = ERROR_MESSAGES[code as ErrorCode];
    if (catalogued) return catalogued;
  }
  if (statusCode === 401) return ERROR_MESSAGES.UNAUTHORIZED;
  return LOAD_ERROR_MESSAGES[kind];
}

/** Catalog copy for a bare `{ code }` payload (WS error events carry no HTTP envelope). */
export function getSocketErrorMessage(error: { code: string }): string {
  return ERROR_MESSAGES[error.code as ErrorCode] ?? DEFAULT_ERROR_MESSAGE;
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
      unknown.push(message);
    }
  }
  // Never surface raw field names: a lone unknown detail keeps its message, several get generic copy.
  const general = unknown.length === 0 ? null : unknown.length === 1 ? unknown[0] : VALIDATION_ERROR_MESSAGE;
  return { fields, general };
}

/** Status que nunca se reintentan: repetir el request no cambia el resultado. */
const NON_RETRYABLE_STATUS = [400, 401, 403, 404, 409, 422];
const MAX_RETRY_DELAY_MS = 30_000;

/** Política de reintento para queries (operaciones seguras): red, 429 y 5xx. */
export function shouldRetryRequest(failureCount: number, error: unknown): boolean {
  // A cancelled request is intentional (screen left, superseded): never retry it.
  if (isCancelledError(error)) return false;
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

const DEFAULT_POLL_BACKOFF_MS = 60_000;
const MAX_POLL_BACKOFF_MS = 5 * 60_000;

/**
 * Pausa para polling manual (no TanStack) tras un 429: devuelve el timestamp hasta el cual
 * no hay que volver a pedir, o 0 si el error no es de rate limit. Respeta `Retry-After`
 * (tope 5 min); sin header, 60 s.
 */
export function getRateLimitBackoffUntil(error: unknown, now: number = Date.now()): number {
  if (getErrorKind(error) !== "rate_limited") return 0;
  const wait = getRetryAfterMs(error) ?? DEFAULT_POLL_BACKOFF_MS;
  return now + Math.min(wait, MAX_POLL_BACKOFF_MS);
}

/** Backoff exponencial; respeta `Retry-After` cuando el server lo manda. */
export function getRetryDelayMs(attemptIndex: number, error: unknown): number {
  const delay = getRetryAfterMs(error) ?? 1000 * 2 ** attemptIndex;
  return Math.min(delay, MAX_RETRY_DELAY_MS);
}
