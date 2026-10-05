/**
 * tokenStorage — Módulo singleton para gestión centralizada de tokens.
 *
 * Responsabilidades:
 *  - Leer/escribir/borrar tokens en SecureStore (persistencia entre sesiones)
 *  - Mantener un cache en memoria para evitar lecturas repetidas a SecureStore
 *    en cada request HTTP (SecureStore es async y agrega latencia)
 *  - Exponer un callback de logout forzado que el interceptor de axios invoca
 *    cuando el refresh token expira, sin crear dependencia circular con AuthContext
 */

import {
  deleteItemAsync,
  getItemAsync,
  setItemAsync,
} from 'expo-secure-store';

// ── Claves de SecureStore ────────────────────────────────────────────────────
const KEYS = {
  ACCESS_TOKEN:  'token',
  REFRESH_TOKEN: 'refreshToken',
  USER_EMAIL:    'userEmail',
} as const;

// ── Cache en memoria ─────────────────────────────────────────────────────────
// Se inicializa vacío y se hidrata desde SecureStore al arrancar la app.
// Siempre se actualiza en paralelo con SecureStore cuando cambian los tokens.
let _cache: {
  accessToken:  string | null;
  refreshToken: string | null;
  userEmail:    string | null;
} = {
  accessToken:  null,
  refreshToken: null,
  userEmail:    null,
};

// Callback registrado por AuthProvider para forzar el cierre de sesión
// cuando el refresh token expira (invocado desde el interceptor de axios).
let _onForceLogout: (() => void) | null = null;
let sessionVersion = 0;
const listeners = new Set<() => void>();
let writes: Promise<unknown> = Promise.resolve();
const persist = (operation: () => Promise<unknown>): Promise<void> => {
  const result = writes.catch(() => {}).then(operation);
  writes = result;
  return result.then(() => {});
};
const notify = () => listeners.forEach(listener => listener());

// ── API pública ──────────────────────────────────────────────────────────────
export const tokenStorage = {

  // ── Getters síncronos (desde cache) ───────────────────────────────────────
  getAccessToken:  (): string | null => _cache.accessToken,
  getRefreshToken: (): string | null => _cache.refreshToken,
  getUserEmail:    (): string | null => _cache.userEmail,
  getSessionVersion: (): number => sessionVersion,
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },

  /**
   * Carga los tokens desde SecureStore al cache en memoria.
   * Debe llamarse una sola vez al arrancar la app (en AuthProvider).
   */
  async hydrate(): Promise<void> {
    const version = sessionVersion;
    await writes;
    const [accessToken, refreshToken, userEmail] = await Promise.all([
      getItemAsync(KEYS.ACCESS_TOKEN), getItemAsync(KEYS.REFRESH_TOKEN), getItemAsync(KEYS.USER_EMAIL),
    ]);
    if (version === sessionVersion) _cache = { accessToken, refreshToken, userEmail };
  },

  /**
   * Persiste un nuevo par de tokens (tras login o refresh).
   * Actualiza cache y SecureStore en paralelo.
   */
  async save(
    accessToken:  string,
    refreshToken: string,
    email?:       string,
  ): Promise<void> {
    _cache.accessToken  = accessToken;
    _cache.refreshToken = refreshToken;
    if (email) _cache.userEmail = email;
    notify();
    await persist(() => Promise.all([
      setItemAsync(KEYS.ACCESS_TOKEN,  accessToken),
      setItemAsync(KEYS.REFRESH_TOKEN, refreshToken),
      ...(email ? [setItemAsync(KEYS.USER_EMAIL, email)] : []),
    ]));
  },

  /**
   * Reemplaza solo el access token tras un silent refresh.
   * El refresh token no cambia en este caso.
   */
  async updateAccessToken(accessToken: string): Promise<void> {
    _cache.accessToken = accessToken;
    notify();
    await persist(() => setItemAsync(KEYS.ACCESS_TOKEN, accessToken));
  },

  /**
   * Borra todos los datos de sesión (logout).
   */
  async clear(): Promise<void> {
    sessionVersion++;
    _cache = { accessToken: null, refreshToken: null, userEmail: null };
    notify();
    await persist(() => Promise.all([
      deleteItemAsync(KEYS.ACCESS_TOKEN),
      deleteItemAsync(KEYS.REFRESH_TOKEN),
      deleteItemAsync(KEYS.USER_EMAIL),
    ]));
  },

  // ── Comunicación con AuthContext (sin dependencia circular) ───────────────

  /** AuthProvider llama a esto en su montaje para registrar el logout forzado. */
  setForceLogoutCallback(fn: (() => void) | null): void {
    _onForceLogout = fn;
  },

  /** Llamado por el interceptor de axios cuando el refresh token expira. */
  triggerForceLogout(): void {
    _onForceLogout?.();
  },
};
