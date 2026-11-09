/**
 * appConfig.service.ts — Config remota para gate de versión mínima / mantenimiento.
 *
 * GET /app/config — público, con la versión mínima, el modo mantenimiento y el contacto
 * de soporte. Cualquier error (404, red, timeout) hace fail-open: la app nunca se bloquea
 * por falta de este endpoint, solo cuando el backend responde explícitamente con
 * maintenanceMode o minVersion.
 */
import api from '@/core/api/axiosinstance';

export interface AppConfig {
  /** Versión mínima requerida, formato "1.2.0". Debajo de esto, gate duro. */
  minVersion?: string;
  maintenanceMode?: boolean;
  maintenanceMessage?: string;
  /** WhatsApp de soporte con prefijo de país, solo dígitos (ej. "5492494000000"). */
  supportWhatsapp?: string;
  /** Mensaje inicial sugerido para el chat de soporte. */
  supportMessage?: string;
}

/**
 * A 404 means the backend does not ship the endpoint: remember it for the session so
 * every gate check stops hitting it. Network/5xx errors stay transient and are retried.
 */
let endpointMissing = false;

export async function fetchAppConfig(): Promise<AppConfig | null> {
  if (endpointMissing) return null;
  try {
    const { data } = await api.get<AppConfig>('/app/config');
    return data;
  } catch (err) {
    if ((err as { response?: { status?: number } })?.response?.status === 404) endpointMissing = true;
    return null;
  }
}

/** Test hook: forget a remembered 404. */
export function resetAppConfigAvailability(): void {
  endpointMissing = false;
}
