import {
  NETWORK_ERROR_MESSAGE,
  getErrorKind,
  getLoadErrorMessage,
  getUserErrorMessage,
  isCancelledError,
  isNetworkError,
} from '@/lib/errors';
import { ERROR_MESSAGES } from '@/lib/error-messages';

const mockCaptureError = jest.fn();
jest.mock('@/core/monitoring/sentry', () => ({ captureError: (...a: unknown[]) => mockCaptureError(...a) }));
// eslint-disable-next-line import/first
import { reportApiError } from '@/lib/errorReporting';

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
