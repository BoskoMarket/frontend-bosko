import axios, { AxiosError, AxiosResponse } from 'axios';
import api from '@/core/api/axiosinstance';
import { tokenStorage } from '@/core/auth/tokenStorage';

jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn(), deleteItemAsync: jest.fn() }));
beforeEach(async () => { await tokenStorage.clear(); await tokenStorage.save('old', 'refresh', 'user@example.test'); });
afterEach(() => { tokenStorage.setForceLogoutCallback(null); });
const reply = (config: any, data: unknown): AxiosResponse => ({ config, data, status: 200, statusText: 'OK', headers: {} });
const unauthorized = (config: any) => new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined, { ...reply(config, {}), status: 401 });

test('dos 401 concurrentes rotan una sola vez y reintentan con el token nuevo', async () => {
  let resolveRefresh!: (value: AxiosResponse) => void;
  let refreshConfig: any;
  const refresh = jest.fn(config => { refreshConfig = config; return new Promise<AxiosResponse>(resolve => { resolveRefresh = resolve; }); });
  axios.defaults.adapter = refresh;
  api.defaults.adapter = async config => {
    if (config.headers.Authorization === 'Bearer old') throw unauthorized(config);
    return reply(config, { success: true, data: { ok: true } });
  };
  const requests = Promise.all([api.get('/one'), api.get('/two')]);
  while (!resolveRefresh) await Promise.resolve();
  resolveRefresh(reply(refreshConfig, { data: { accessToken: 'new', refreshToken: 'new-refresh' } }));
  const responses = await requests;
  expect(refresh).toHaveBeenCalledTimes(1);
  expect(responses.map(res => res.data)).toEqual([{ ok: true }, { ok: true }]);
  expect(tokenStorage.getAccessToken()).toBe('new');
  expect(refreshConfig.timeout).toBe(30000);
});
test('un refresh tardío no restaura una sesión que ya cerró', async () => {
  let complete!: (value: AxiosResponse) => void;
  let config: any;
  axios.defaults.adapter = value => { config = value; return new Promise(resolve => { complete = resolve; }); };
  api.defaults.adapter = async value => { throw unauthorized(value); };
  const request = api.get('/private');
  const assertion = expect(request).rejects.toThrow('sesión cambió');
  while (!complete) await Promise.resolve();
  await tokenStorage.clear();
  complete(reply(config, { data: { accessToken: 'late', refreshToken: 'late-refresh' } }));
  await assertion;
  expect(tokenStorage.getAccessToken()).toBeNull();
});
test('un refresh revocado cierra la sesión', async () => {
  const logout = jest.fn(); tokenStorage.setForceLogoutCallback(logout);
  axios.defaults.adapter = async config => { throw unauthorized(config); };
  api.defaults.adapter = async config => { throw unauthorized(config); };
  await expect(api.get('/private')).rejects.toThrow('Unauthorized');
  expect(logout).toHaveBeenCalled();
  expect(tokenStorage.getAccessToken()).toBeNull();
});
test('un 401 de negocio no refresca ni reintenta', async () => {
  const refresh = jest.fn();
  axios.defaults.adapter = refresh;
  const calls = jest.fn();
  api.defaults.adapter = async config => {
    calls();
    const error = unauthorized(config);
    error.response!.data = { code: 'INVALID_PASSWORD' };
    throw error;
  };
  await expect(api.delete('/users/me', { data: { password: 'wrong' } })).rejects.toThrow('Unauthorized');
  expect(calls).toHaveBeenCalledTimes(1);
  expect(refresh).not.toHaveBeenCalled();
  expect(tokenStorage.getAccessToken()).toBe('old');
});
test('un error temporal de red conserva los tokens para reintentar', async () => {
  axios.defaults.adapter = async () => { throw new AxiosError('Network Error'); };
  api.defaults.adapter = async config => { throw unauthorized(config); };
  await expect(api.get('/private')).rejects.toThrow('Network Error');
  expect(tokenStorage.getRefreshToken()).toBe('refresh');
});
