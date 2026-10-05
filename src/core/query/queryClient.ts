import { QueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

/**
 * Reintento por status HTTP (frontend-error-contract.md → "Mapeo rápido por status"):
 * no reintentar 400/403/404/409/422, sí reintentar 429/5xx y errores de red.
 */
const shouldRetry = (failureCount: number, error: unknown) => {
  const status = (error as AxiosError)?.response?.status;
  if (status && [400, 401, 403, 404, 409, 422].includes(status)) return false;
  return failureCount < 2;
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: shouldRetry,
      // Habilitado — networkFocus.ts conecta focusManager a AppState, así que
      // esto sí dispara al volver del background (ver setupQueryNetworkFocus).
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});
