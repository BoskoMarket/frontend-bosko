/** Small RFC4122-v4-shaped id; good enough for log correlation (not security sensitive). */
export function createRequestId(): string {
  const cryptoApi = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (typeof cryptoApi?.randomUUID === 'function') return cryptoApi.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, ch => {
    const r = Math.floor(Math.random() * 16);
    return (ch === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export const REQUEST_ID_HEADER = 'x-request-id';

/** Client request id sent with the failed request (set by the axios interceptor), if any. */
export function getClientRequestId(error: unknown): string | undefined {
  const headers = (error as { config?: { headers?: Record<string, unknown> & { get?: (n: string) => unknown } } })?.config?.headers;
  if (!headers) return undefined;
  const value = typeof headers.get === 'function' ? headers.get(REQUEST_ID_HEADER) : headers[REQUEST_ID_HEADER];
  return typeof value === 'string' && value ? value : undefined;
}
