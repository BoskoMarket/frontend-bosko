import { dialog, toast } from '@/core/design-system';
import { getUserErrorMessage, isNetworkError, NETWORK_ERROR_MESSAGE } from './errors';

export type RetryResult<T> = { ok: true; value: T } | { ok: false; error: unknown };

export interface RunWithRetryOptions {
  /** Short title for the failure ("No se pudo enviar la solicitud"). */
  title: string;
  /** Presents non-network errors. Defaults to an error toast with the mapped message. */
  onError?: (error: unknown) => void;
  /** Overrides the network-failure message shown in the retry prompt. */
  networkMessage?: (error: unknown) => string;
}

/**
 * Runs `action`; when it fails because of the network it asks "¿Reintentar?" and re-runs the
 * SAME closure (same input) until it succeeds or the user cancels. Callers keep their form
 * state untouched, so nothing typed is lost. Other errors go to `onError` and are not retried.
 */
export async function runWithRetry<T>(
  action: () => Promise<T>,
  { title, onError, networkMessage }: RunWithRetryOptions,
): Promise<RetryResult<T>> {
  for (;;) {
    try {
      return { ok: true, value: await action() };
    } catch (error) {
      if (!isNetworkError(error)) {
        if (onError) onError(error);
        else toast.error(title, getUserErrorMessage(error));
        return { ok: false, error };
      }
      const retry = await dialog.confirm({
        title,
        message: networkMessage ? networkMessage(error) : NETWORK_ERROR_MESSAGE,
        confirmLabel: 'Reintentar',
        cancelLabel: 'Cancelar',
      });
      if (!retry) return { ok: false, error };
    }
  }
}
