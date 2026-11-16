import { reportApiError, resetErrorReportingDedupe, REPORT_DEDUPE_WINDOW_MS } from '@/lib/errorReporting';
import { captureError } from '@/core/monitoring/sentry';

jest.mock('@/core/monitoring/sentry', () => ({ captureError: jest.fn() }));

const serverError = (status = 500, code = 'INTERNAL_ERROR') => ({
  isAxiosError: true,
  message: 'boom',
  response: { status, data: { success: false, statusCode: status, code, message: 'x' } },
});

describe('reportApiError dedupe', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    resetErrorReportingDedupe();
    jest.clearAllMocks();
  });
  afterEach(() => jest.useRealTimers());

  it('reports a repeat of the same code, status and scope only once per window', () => {
    for (let i = 0; i < 5; i++) reportApiError(serverError(), { source: 'query', queryKey: 'orders' });
    expect(captureError).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(REPORT_DEDUPE_WINDOW_MS - 1);
    reportApiError(serverError(), { source: 'query', queryKey: 'orders' });
    expect(captureError).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(1);
    reportApiError(serverError(), { source: 'query', queryKey: 'orders' });
    expect(captureError).toHaveBeenCalledTimes(2);
  });

  it('keeps different codes, statuses and scopes apart', () => {
    reportApiError(serverError(500), { source: 'query', queryKey: 'orders' });
    reportApiError(serverError(500), { source: 'query', queryKey: 'chat' });
    reportApiError(serverError(503), { source: 'query', queryKey: 'orders' });
    reportApiError(serverError(500, 'OTHER'), { source: 'query', queryKey: 'orders' });
    expect(captureError).toHaveBeenCalledTimes(4);
  });

  it('stays bounded and still reports after many distinct signatures', () => {
    for (let i = 0; i < 300; i++) reportApiError(serverError(500, `C${i}`), { source: 'query' });
    expect(captureError).toHaveBeenCalledTimes(300);
    // The oldest signature was evicted, so it is reported again inside the window.
    reportApiError(serverError(500, 'C0'), { source: 'query' });
    expect(captureError).toHaveBeenCalledTimes(301);
  });

  it('still ignores 4xx', () => {
    reportApiError(serverError(400, 'VALIDATION_ERROR'));
    expect(captureError).not.toHaveBeenCalled();
  });
});
