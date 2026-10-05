import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { API_URL } from '@/core/config/env';
import { tokenStorage } from '@/core/auth/tokenStorage';
import type { ApiResponse, AuthResponse } from '@/features/auth/types';

const TIMEOUT = 30_000;
type SessionConfig = InternalAxiosRequestConfig & { _retry?: boolean; _sessionVersion?: number };
const api = axios.create({ baseURL: API_URL, timeout: TIMEOUT });
let refreshing: { version: number; promise: Promise<string> } | null = null;

export function unwrapResponse<T>(response: AxiosResponse<T>): AxiosResponse<T> {
  const body = response.data;
  if (body && typeof body === 'object' && 'success' in body && 'data' in body) {
    return { ...response, data: body.data as T };
  }
  return response;
}

export async function refreshSession(): Promise<string> {
  const version = tokenStorage.getSessionVersion();
  if (refreshing?.version === version) return refreshing.promise;
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) {
    tokenStorage.triggerForceLogout();
    throw new Error('La sesión expiró. Iniciá sesión nuevamente.');
  }
  const promise = (async () => {
    try {
      const { data } = await axios.post<ApiResponse<AuthResponse>>(
        `${API_URL}/auth/refresh-token`, { refreshToken }, { timeout: TIMEOUT },
      );
      const refreshed = data.data;
      if (!refreshed?.accessToken || !refreshed?.refreshToken) throw new Error('Respuesta de sesión inválida.');
      if (version !== tokenStorage.getSessionVersion()) throw new axios.CanceledError('La sesión cambió.');
      await tokenStorage.save(refreshed.accessToken, refreshed.refreshToken);
      if (version !== tokenStorage.getSessionVersion()) throw new axios.CanceledError('La sesión cambió.');
      return refreshed.accessToken;
    } catch (error) {
      const status = (error as AxiosError).response?.status;
      if (version === tokenStorage.getSessionVersion() && (status === 401 || status === 403)) {
        // La UI se cierra inmediatamente, aunque falle el almacenamiento del dispositivo.
        tokenStorage.triggerForceLogout();
        await tokenStorage.clear();
      }
      throw error;
    } finally {
      if (refreshing?.version === version) refreshing = null;
    }
  })();
  refreshing = { version, promise };
  return promise;
}

api.interceptors.request.use((config: SessionConfig) => {
  const version = tokenStorage.getSessionVersion();
  if (config._sessionVersion !== undefined && config._sessionVersion !== version) {
    throw new axios.CanceledError('La sesión cambió.');
  }
  config._sessionVersion = version;
  const token = tokenStorage.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  else delete config.headers.Authorization;
  config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
  return config;
});

api.interceptors.response.use(response => {
  const config = response.config as SessionConfig;
  if (config._sessionVersion !== tokenStorage.getSessionVersion()) throw new axios.CanceledError('La sesión cambió.');
  return unwrapResponse(response);
}, async (error: AxiosError) => {
  const original = error.config as SessionConfig | undefined;
  if (!original || original.url?.startsWith('/auth/') || error.response?.status !== 401 || original._retry) throw error;
  if (original._sessionVersion !== tokenStorage.getSessionVersion()) throw new axios.CanceledError('La sesión cambió.');
  original._retry = true;
  const token = tokenStorage.getAccessToken();
  // Una respuesta 401 tardía de la credencial anterior no rota por segunda vez.
  if (!token || original.headers.Authorization === `Bearer ${token}`) await refreshSession();
  return api(original);
});
export default api;
