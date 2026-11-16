import {
  NETWORK_ERROR_MESSAGE,
  getErrorKind,
  getLoadErrorMessage,
  LOAD_ERROR_MESSAGES,
  VALIDATION_ERROR_MESSAGE,
  getUserErrorMessage,
  isCancelledError,
  isNetworkError,
} from '@/lib/errors';
import { ERROR_MESSAGES } from '@/lib/error-messages';

const mockCaptureError = jest.fn();
jest.mock('@/core/monitoring/sentry', () => ({ captureError: (...a: unknown[]) => mockCaptureError(...a) }));
// eslint-disable-next-line import/first
import { reportApiError, keyScope } from '@/lib/errorReporting';

const axiosError = (status?: number, data?: unknown) => ({
  isAxiosError: true,
  message: 'Request failed',
  response: status ? { status, data, headers: {} } : undefined,
});
const cancelled = { isAxiosError: true, name: 'CanceledError', code: 'ERR_CANCELED', message: 'canceled' };

describe('cancellation', () => {
  test('is not a network error nor an offline message', () => {
    expect(isCancelledError(cancelled)).toBe(true);
    expect(isNetworkError(cancelled)).toBe(false);
    expect(getUserErrorMessage(cancelled)).not.toBe(NETWORK_ERROR_MESSAGE);
    expect(isCancelledError(axiosError())).toBe(false);
  });
});

describe('getErrorKind / getLoadErrorMessage', () => {
  test('classifies by status', () => {
    expect(getErrorKind(cancelled)).toBe('cancelled');
    expect(getErrorKind(axiosError())).toBe('offline');
    expect(getErrorKind(axiosError(429, ''))).toBe('rate_limited');
    expect(getErrorKind(axiosError(403, { code: 'FORBIDDEN', statusCode: 403, message: 'x' }))).toBe('forbidden');
    expect(getErrorKind(axiosError(404, ''))).toBe('not_found');
    expect(getErrorKind(axiosError(502, ''))).toBe('server');
    expect(getErrorKind(new Error('boom'))).toBe('unknown');
  });

  test('only offline mentions the connection', () => {
    expect(getLoadErrorMessage(axiosError())).toBe(NETWORK_ERROR_MESSAGE);
    for (const e of [axiosError(429, ''), axiosError(404, ''), axiosError(500, ''), new Error('x'), cancelled]) {
      expect(getLoadErrorMessage(e)).not.toMatch(/conexi|internet/i);
    }
  });
});

describe('getLoadErrorMessage uses the backend code catalog', () => {
  const body = (code: string, statusCode: number, extra: object = {}) => ({ code, statusCode, message: 'x', ...extra });

  test('catalogued 409/422 codes keep their specific copy', () => {
    expect(getLoadErrorMessage(axiosError(409, body('UPLOAD_BUSY', 409)))).toBe(ERROR_MESSAGES.UPLOAD_BUSY);
    expect(getLoadErrorMessage(axiosError(422, body('ORDER_CLOSED', 422)))).toBe(ERROR_MESSAGES.ORDER_CLOSED);
  });

  test('suspended account keeps its copy', () => {
    expect(getLoadErrorMessage(axiosError(403, body('ACCOUNT_SUSPENDED', 403)))).toBe(ERROR_MESSAGES.ACCOUNT_SUSPENDED);
  });

  test('401 never says "sin permiso" and offers session copy', () => {
    const msg = getLoadErrorMessage(axiosError(401, body('UNAUTHORIZED', 401)));
    expect(msg).toBe(ERROR_MESSAGES.UNAUTHORIZED);
    expect(getLoadErrorMessage(axiosError(401, ''))).toBe(ERROR_MESSAGES.UNAUTHORIZED);
    expect(msg).not.toMatch(/permiso/i);
  });

  test('VALIDATION_ERROR gets generic copy without field names', () => {
    const e = axiosError(400, body('VALIDATION_ERROR', 400, { details: [{ field: 'limit', message: 'too big' }] }));
    expect(getLoadErrorMessage(e)).toBe(VALIDATION_ERROR_MESSAGE);
    expect(getLoadErrorMessage(e)).not.toMatch(/limit/);
  });

  test('generic codes and unknown codes fall back to kind copy, without mentioning the connection', () => {
    expect(getLoadErrorMessage(axiosError(403, body('FORBIDDEN', 403)))).toBe(LOAD_ERROR_MESSAGES.forbidden);
    expect(getLoadErrorMessage(axiosError(500, body('INTERNAL_ERROR', 500)))).toBe(LOAD_ERROR_MESSAGES.server);
    expect(getLoadErrorMessage(axiosError(418, body('SOMETHING_NEW', 418)))).toBe(LOAD_ERROR_MESSAGES.unknown);
  });
});

test('catalog has the required backend codes', () => {
  const required = [
    'POST_LIMIT_REACHED', 'INVALID_MEDIA', 'UPLOAD_BUSY', 'ORDER_CLOSED', 'REPORT_NOT_FOUND',
    'IDEMPOTENCY_KEY_REUSED', 'KYC_SESSION_PENDING', 'REAUTH_FAILED', 'INVALID_PASSWORD',
    'ACTIVE_ORDERS', 'ACCOUNT_INACTIVE', 'INVALID_ORDER_TRANSITION', 'INVALID_ORDER_STATUS_TRANSITION',
  ];
  for (const code of required) expect(ERROR_MESSAGES[code]).toBeTruthy();
});

describe('reportApiError', () => {
  beforeEach(() => mockCaptureError.mockClear());

  test('skips cancellations, offline and 4xx', () => {
    reportApiError(cancelled);
    reportApiError(axiosError());
    reportApiError(axiosError(404, { success: false, statusCode: 404, code: 'NOT_FOUND', message: 'x' }));
    expect(mockCaptureError).not.toHaveBeenCalled();
  });

  test('reports 5xx with requestId', () => {
    const err = axiosError(500, { success: false, statusCode: 500, code: 'INTERNAL_ERROR', message: 'x', requestId: 'r1' });
    reportApiError(err, { source: 'query' });
    expect(mockCaptureError).toHaveBeenCalledWith(
      err,
      expect.objectContaining({ requestId: 'r1', statusCode: 500, code: 'INTERNAL_ERROR', source: 'query' }),
    );
  });
});

describe('keyScope', () => {
  test('keeps only the first string segment', () => {
    expect(keyScope(['search', 'maria@example.com', { page: 2 }])).toBe('search');
    expect(keyScope([{ q: 'x' }])).toBeUndefined();
    expect(keyScope(undefined)).toBeUndefined();
  });
});
