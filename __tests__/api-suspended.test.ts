import axios, { AxiosError, AxiosResponse } from 'axios';
import api from '@/core/api/axiosinstance';
import { tokenStorage } from '@/core/auth/tokenStorage';

jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn(), deleteItemAsync: jest.fn() }));
beforeEach(async () => { await tokenStorage.clear(); await tokenStorage.save('old', 'refresh', 'user@example.test'); });
afterEach(() => { tokenStorage.setForceLogoutCallback(null); });

const reply = (config: any, data: unknown, status = 200): AxiosResponse => ({ config, data, status, statusText: '', headers: {} });
const unauthorized = (config: any) => new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined, reply(config, {}, 401));
const forbidden = (config: any, code: string, url?: string) => {
  const cfg = url ? { ...config, url } : config;
  return new AxiosError('Forbidden', 'ERR_BAD_REQUEST', cfg, undefined, reply(cfg, { success: false, statusCode: 403, code }, 403));
};

test('403 ACCOUNT_SUSPENDED cierra la sesión con motivo suspended sin intentar refrescar', async () => {
  const logout = jest.fn(); tokenStorage.setForceLogoutCallback(logout);
  const refresh = jest.fn(); axios.defaults.adapter = refresh;
  api.defaults.adapter = async config => { throw forbidden(config, 'ACCOUNT_SUSPENDED'); };
  await expect(api.get('/private')).rejects.toThrow('Forbidden');
  expect(logout).toHaveBeenCalledWith('suspended');
  expect(refresh).not.toHaveBeenCalled();
  expect(tokenStorage.getAccessToken()).toBeNull();
});

test('403 ACCOUNT_SUSPENDED en /auth/login también marca la suspensión', async () => {
  const logout = jest.fn(); tokenStorage.setForceLogoutCallback(logout);
  api.defaults.adapter = async config => { throw forbidden(config, 'ACCOUNT_SUSPENDED', '/auth/login'); };
  await expect(api.post('/auth/login', {})).rejects.toThrow('Forbidden');
  expect(logout).toHaveBeenCalledWith('suspended');
});

test('403 ACCOUNT_SUSPENDED al refrescar la sesión cierra con motivo suspended', async () => {
  const logout = jest.fn(); tokenStorage.setForceLogoutCallback(logout);
  axios.defaults.adapter = async config => { throw forbidden(config, 'ACCOUNT_SUSPENDED', '/auth/refresh-token'); };
  api.defaults.adapter = async config => { throw unauthorized(config); };
  await expect(api.get('/private')).rejects.toThrow('Forbidden');
  expect(logout).toHaveBeenCalledWith('suspended');
  expect(tokenStorage.getAccessToken()).toBeNull();
});

test('un 403 con otro código no es una suspensión', async () => {
  const logout = jest.fn(); tokenStorage.setForceLogoutCallback(logout);
  api.defaults.adapter = async config => { throw forbidden(config, 'FORBIDDEN'); };
  await expect(api.get('/private')).rejects.toThrow('Forbidden');
  expect(logout).not.toHaveBeenCalled();
  expect(tokenStorage.getAccessToken()).toBe('old');
});
