import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { reportApiError } from '@/lib/errorReporting';
import { getRetryDelayMs, shouldRetryRequest } from '@/lib/errors';

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => reportApiError(error, { source: 'query', queryKey: query.queryKey }),
  }),
  mutationCache: new MutationCache({
    onError: (error, _vars, _ctx, mutation) =>
      reportApiError(error, { source: 'mutation', mutationKey: mutation.options.mutationKey }),
  }),
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,
      gcTime: 5 * 60 * 1000,
      // frontend-error-contract.md: sin retry en 400/401/403/404/409/422;
      // red, 429 y 5xx sí, con backoff que respeta Retry-After.
      retry: shouldRetryRequest,
      retryDelay: getRetryDelayMs,
      // Habilitado — networkFocus.ts conecta focusManager a AppState, así que
      // esto sí dispara al volver del background (ver setupQueryNetworkFocus).
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      // Nunca reintentar mutaciones solas: en pagos hay que consultar el estado antes de repetir.
      retry: 0,
    },
  },
});
