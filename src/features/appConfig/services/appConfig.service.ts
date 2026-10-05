/**
 * appConfig.service.ts — Config remota para gate de versión mínima / mantenimiento.
 *
 * GET /app/config — este endpoint todavía no existe en el backend (Bosko).
 * Hasta que se implemente, cualquier error (404, red, timeout) hace fail-open:
 * la app nunca se bloquea por falta de este endpoint, solo cuando el backend
 * responde explícitamente con maintenanceMode o minVersion.
 */
import api from '@/core/api/axiosinstance';

export interface AppConfig {
  /** Versión mínima requerida, formato "1.2.0". Debajo de esto, gate duro. */
  minVersion?: string;
  maintenanceMode?: boolean;
  maintenanceMessage?: string;
}

export async function fetchAppConfig(): Promise<AppConfig | null> {
  try {
    const { data } = await api.get<AppConfig>('/app/config');
    return data;
  } catch {
    return null;
  }
}
