import { useQuery } from '@tanstack/react-query';
import * as Application from 'expo-application';
import { QUERY_KEYS } from '@/core/query/queryKeys';
import { fetchAppConfig } from '../services/appConfig.service';

/** Compara "1.2.0" vs "1.10.3" por segmento numérico, no lexicográfico. */
function isBelowMinVersion(current: string, min: string): boolean {
  const c = current.split('.').map(Number);
  const m = min.split('.').map(Number);
  for (let i = 0; i < Math.max(c.length, m.length); i++) {
    const cv = c[i] ?? 0;
    const mv = m[i] ?? 0;
    if (cv !== mv) return cv < mv;
  }
  return false;
}

export type AppGateState =
  | { blocked: false }
  | { blocked: true; reason: 'maintenance'; message?: string }
  | { blocked: true; reason: 'outdated' };

/**
 * Gate de app — bloquea solo si el server confirma mantenimiento o versión
 * vieja. Nunca bloquea por error de red/endpoint inexistente (fail-open):
 * `enabled` corre en background sin afectar el arranque normal de la app.
 */
export function useAppGate(): AppGateState {
  const { data } = useQuery({
    queryKey: QUERY_KEYS.appConfig,
    queryFn: fetchAppConfig,
    staleTime: 5 * 60 * 1000,
    retry: 0,
  });

  if (!data) return { blocked: false };

  if (data.maintenanceMode) {
    return { blocked: true, reason: 'maintenance', message: data.maintenanceMessage };
  }

  const current = Application.nativeApplicationVersion;
  if (data.minVersion && current && isBelowMinVersion(current, data.minVersion)) {
    return { blocked: true, reason: 'outdated' };
  }

  return { blocked: false };
}
