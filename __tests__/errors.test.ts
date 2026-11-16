import {
  extractApiError,
  getFormErrors,
  getRateLimitBackoffUntil,
  getRetryAfterMs,
  getRetryDelayMs,
  getSocketErrorMessage,
  getUserErrorMessage,
  shouldRetryRequest,
  VALIDATION_ERROR_MESSAGE,
} from '@/lib/errors';
import { DEFAULT_ERROR_MESSAGE, ERROR_MESSAGES } from '@/lib/error-messages';

test('getSocketErrorMessage maps catalog codes and falls back for unknown ones', () => {
  expect(getSocketErrorMessage({ code: 'RATE_LIMITED' })).toBe(ERROR_MESSAGES.RATE_LIMITED);
  expect(getSocketErrorMessage({ code: 'SOMETHING_NEW' })).toBe(DEFAULT_ERROR_MESSAGE);
});

const axiosError = (status?: number, data?: unknown, headers: Record<string, string> = {}) => ({
  isAxiosError: true,
  message: 'Request failed',
  response: status ? { status, data, headers } : undefined,
});

const validationError = (details: { field: string; message: string }[]) =>
  axiosError(400, { success: false, statusCode: 400, code: 'VALIDATION_ERROR', message: 'Bad', details });

test('distingue error de red de 5xx/429 sin envelope', () => {
  expect(extractApiError(axiosError()).code).toBe('NETWORK_ERROR');
  expect(extractApiError(axiosError(502, '<html>')).code).toBe('INTERNAL_ERROR');
  expect(extractApiError(axiosError(429, '')).code).toBe('RATE_LIMITED');
  expect(extractApiError(axiosError(413, '')).code).toBe('HTTP_ERROR');
});

test('asocia details[] a inputs conocidos y agrupa los desconocidos', () => {
  const err = validationError([
    { field: 'email', message: 'email must be an email' },
    { field: 'email', message: 'second message ignored' },
    { field: 'address.city', message: 'city is required' },
  ]);
  expect(getFormErrors(err, ['email', 'password'] as const)).toEqual({
    fields: { email: 'email must be an email' },
    general: 'city is required',
  });
});

test('un error que no es de validación va a general', () => {
  const { fields, general } = getFormErrors(axiosError(), ['email'] as const);
  expect(fields).toEqual({});
  expect(general).toMatch(/conexión/);
});

test('no reintenta errores de cliente; sí red, 429 y 5xx hasta 2 veces', () => {
  for (const status of [400, 401, 403, 404, 409, 422]) {
    expect(shouldRetryRequest(0, axiosError(status))).toBe(false);
  }
  expect(shouldRetryRequest(0, axiosError())).toBe(true);
  expect(shouldRetryRequest(1, axiosError(429))).toBe(true);
  expect(shouldRetryRequest(2, axiosError(500))).toBe(false);
});

test('backoff respeta Retry-After y tiene tope', () => {
  expect(getRetryAfterMs(axiosError(429, '', { 'retry-after': '5' }))).toBe(5000);
  expect(getRetryAfterMs(axiosError(429, ''))).toBeNull();
  expect(getRetryDelayMs(0, axiosError(429, '', { 'retry-after': '5' }))).toBe(5000);
  expect(getRetryDelayMs(1, axiosError(500))).toBe(2000);
  expect(getRetryDelayMs(10, axiosError(500))).toBe(30_000);
  expect(getRetryDelayMs(0, axiosError(429, '', { 'retry-after': '3600' }))).toBe(30_000);
});

test('no reintenta requests cancelados', () => {
  const cancelled = { isAxiosError: true, code: 'ERR_CANCELED', name: 'CanceledError', message: 'canceled' };
  expect(shouldRetryRequest(0, cancelled)).toBe(false);
});

test('pausa el polling tras 429: Retry-After con tope, 60 s por defecto, 0 si no es 429', () => {
  const now = 1_000_000;
  expect(getRateLimitBackoffUntil(axiosError(429, ''), now)).toBe(now + 60_000);
  expect(getRateLimitBackoffUntil(axiosError(429, '', { 'retry-after': '5' }), now)).toBe(now + 5000);
  expect(getRateLimitBackoffUntil(axiosError(429, '', { 'retry-after': '99999' }), now)).toBe(now + 300_000);
  expect(getRateLimitBackoffUntil(axiosError(500, ''), now)).toBe(0);
  expect(getRateLimitBackoffUntil(axiosError(), now)).toBe(0);
});

test('varios campos desconocidos usan copy genérico sin nombres de campo', () => {
  const err = validationError([
    { field: 'a.b', message: 'x' },
    { field: 'c.d', message: 'y' },
  ]);
  const { fields, general } = getFormErrors(err, ['email'] as const);
  expect(fields).toEqual({});
  expect(general).toBe(VALIDATION_ERROR_MESSAGE);
  expect(general).not.toMatch(/a\.b|c\.d/);
});

test('getUserErrorMessage shows only deduped detail messages, never field names', () => {
  const msg = getUserErrorMessage(validationError([
    { field: 'email', message: 'Email inválido' },
    { field: 'mail', message: 'Email inválido' },
    { field: 'password', message: 'Muy corta' },
  ]));
  expect(msg).toBe('Email inválido\nMuy corta');
  expect(msg).not.toMatch(/email:|password/);
});
