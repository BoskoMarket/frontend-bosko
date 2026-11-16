import { AxiosError } from 'axios';
import api from '@/core/api/axiosinstance';
import { getClientRequestId } from '@/core/api/requestId';
import { tokenStorage } from '@/core/auth/tokenStorage';
import { reportApiError } from '@/lib/errorReporting';
import { captureError } from '@/core/monitoring/sentry';

jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn(), deleteItemAsync: jest.fn() }));
jest.mock('@/core/monitoring/sentry', () => ({ captureError: jest.fn() }));

test('the interceptor sends a uuid-shaped x-request-id', async () => {
  let sent: unknown;
  api.defaults.adapter = async config => {
    sent = config.headers['x-request-id'];
    return { config, data: {}, status: 200, statusText: '', headers: {} };
  };
  await api.get('/ping');
  expect(sent).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
});

test('reportApiError attaches client and server request ids', async () => {
  await tokenStorage.clear();
  api.defaults.adapter = async config => {
    throw new AxiosError('boom', 'ERR_BAD_RESPONSE', config, undefined,
      { config, data: { statusCode: 500, code: 'X', requestId: 'srv-1' }, status: 500, statusText: '', headers: {} });
  };
  const error = await api.get('/fail').catch(e => e);
  const clientId = getClientRequestId(error);
  expect(clientId).toBeTruthy();
  reportApiError(error);
  expect(captureError).toHaveBeenCalledWith(error, expect.objectContaining({ requestId: 'srv-1', clientRequestId: clientId }));
});
