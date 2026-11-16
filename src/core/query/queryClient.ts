import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { reportApiError, keyScope } from '@/lib/errorReporting';
import { getRetryDelayMs, shouldRetryRequest } from '@/lib/errors';

/**
 * Retry policy (single source of truth: src/lib/errors.ts).
 * - Queries (safe, idempotent): `shouldRetryRequest` + `getRetryDelayMs`. Retries network
 *   failures, 429 and 5xx up to 2 times; never 400/401/403/404/409/422 nor cancellations.
 *   Backoff is exponential (1s, 2s, ...) capped at 30s and honors `Retry-After`.
 * - Mutations: never retried automatically (payments must check state before repeating).
 *   The only repeat is user-driven: `runWithRetry` (src/lib/runWithRetry.ts) asks
 *   "Reintentar" for network failures only, re-running the same closure.
 * - Manual polling outside TanStack (chat list/messages): after a 429 pause polling with
 *   `getRateLimitBackoffUntil` (Retry-After, default 60s).
 */

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => reportApiError(error, { source: 'query', queryKey: keyScope(query.queryKey) }),
  }),
  mutationCache: new MutationCache({
    onError: (error, _vars, _ctx, mutation) =>
      reportApiError(error, { source: 'mutation', mutationKey: keyScope(mutation.options.mutationKey) }),
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
