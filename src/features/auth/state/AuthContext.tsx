/**
 * AuthContext — Estado global de autenticación.
 *
 * Responsabilidades:
 *  - Restaurar la sesión desde SecureStore al iniciar la app
 *  - Exponer login, register y logout al árbol de componentes
 *  - Registrar el callback de logout forzado para el interceptor de axios
 *  - Indicar si la sesión ya fue comprobada (authLoaded) para que las
 *    pantallas protejan el acceso mientras se carga
 *
 * NO gestiona el perfil del usuario (eso lo hace ProfileContext).
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Button, SPACING, Text } from '@/core/design-system';
import axios from 'axios';
import { API_URL } from '@/core/config/env';
import { socketService } from '@/features/chat/services/socket.service';
import { useChatStore } from '@/stores/chat.store';
import { useFavoritesStore } from '@/stores/favorites.store';
import { QUERY_KEYS } from '@/core/query/queryKeys';
import { useThemeColors } from '@/stores/theme.store';
import { useQueryClient } from '@tanstack/react-query';
import { tokenStorage } from '@/core/auth/tokenStorage';
import {
  loginService,
  loginWithGoogleService,
  registerUserService,
  verifyEmailService,
} from '../services/auth';
import api from '@/core/api/axiosinstance';
import { getUserErrorMessage } from '@/lib/errors';
import type {
  AuthContextType,
  AuthResponse,
  AuthState,
  AuthUser,
  Credentials,
  RegisterResponse,
  RegisterUserPayload,
} from '../types';

// ── Estado vacío reutilizable ────────────────────────────────────────────────
const EMPTY_STATE: AuthState = {
  token: null,
  refreshToken: null,
  userEmail: null,
  user: null,
};

// ── Contexto ─────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Hook para consumir el contexto.
 * Lanza un error descriptivo si se usa fuera del provider.
 */
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}

// ── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();
  const [authState, setAuthState] = useState<AuthState>(EMPTY_STATE);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tc = useThemeColors();
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const clearLocalState = useCallback(() => {
    socketService.disconnect();
    useChatStore.getState().reset();
    void useFavoritesStore.getState().setAccount(null);
    void qc.cancelQueries();
    qc.clear();
    setAuthState(EMPTY_STATE);
  }, [qc]);

  useEffect(() => {
    tokenStorage.setForceLogoutCallback(clearLocalState);
    const unsubscribe = tokenStorage.subscribe(() => {
      const token = tokenStorage.getAccessToken();
      if (!token) { clearLocalState(); return; }
      setAuthState(current => current.token ? {
        ...current, token, refreshToken: tokenStorage.getRefreshToken(),
      } : current);
    });
    return () => { unsubscribe(); tokenStorage.setForceLogoutCallback(null); socketService.disconnect(); };
  }, [clearLocalState]);

  // /users/me valida la sesión; Axios refresca el token si hace falta.
  useEffect(() => {
    let active = true;
    setSessionError(null);
    (async () => {
      try {
        await tokenStorage.hydrate();
        if (tokenStorage.getAccessToken() && tokenStorage.getRefreshToken()) {
          const { data: user } = await api.get<AuthUser>('/users/me');
          if (!user?.id || !user.email) throw new Error('No se pudo validar el perfil de la sesión.');
          if (!active) return;
          await tokenStorage.save(tokenStorage.getAccessToken()!, tokenStorage.getRefreshToken()!, user.email);
          if (!active) return;
          qc.setQueryData(QUERY_KEYS.profile, user);
          setAuthState({ token: tokenStorage.getAccessToken(), refreshToken: tokenStorage.getRefreshToken(), userEmail: user.email, user });
        } else {
          await tokenStorage.clear();
        }
        if (active) setAuthLoaded(true);
      } catch (err) {
        if (!active) return;
        if (!tokenStorage.getAccessToken()) setAuthLoaded(true);
        else setSessionError(getUserErrorMessage(err));
      }
    })();
    return () => { active = false; };
  }, [attempt, qc]);

  useEffect(() => {
    if (authState.token) socketService.connect(authState.token);
  }, [authState.token]);
  useEffect(() => {
    void useFavoritesStore.getState().setAccount(authState.user?.id ?? null);
  }, [authState.user?.id]);

  // ── Login ──────────────────────────────────────────────────────────────
  const login = useCallback(async (credentials: Credentials): Promise<AuthResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await loginService(credentials);

      await tokenStorage.save(
        response.accessToken,
        response.refreshToken,
        credentials.email,
      );

      setAuthState({
        token: response.accessToken,
        refreshToken: response.refreshToken,
        userEmail: credentials.email,
        user: response.user ?? null,
      });

      return response;
    } catch (err: any) {
      setError(getUserErrorMessage(err));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Registro ───────────────────────────────────────────────────────────
  // POST /auth/register solo crea la cuenta y envía el OTP de verificación.
  // No devuelve tokens — el login real ocurre recién en verifyEmail().
  const registerUser = useCallback(
    async (data: RegisterUserPayload): Promise<RegisterResponse> => {
      setIsLoading(true);
      setError(null);

      try {
        return await registerUserService(data);
      } catch (err: any) {
        setError(getUserErrorMessage(err));
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // ── Verificación de email ─────────────────────────────────────────────
  // Completa el registro: valida el OTP y devuelve los tokens de sesión.
  const verifyEmail = useCallback(async (email: string, code: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await verifyEmailService(email, code);

      await tokenStorage.save(response.accessToken, response.refreshToken, email);

      setAuthState({
        token: response.accessToken,
        refreshToken: response.refreshToken,
        userEmail: email,
        user: response.user ?? null,
      });
    } catch (err: any) {
      setError(getUserErrorMessage(err));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Login con Google ──────────────────────────────────────────────────
  // Recibe el idToken de Firebase (ya autenticado con Google en el cliente,
  // ver handleGoogleSignIn en LogInView) y lo intercambia por la sesión propia.
  const loginWithGoogle = useCallback(async (firebaseIdToken: string): Promise<AuthResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await loginWithGoogleService(firebaseIdToken);

      await tokenStorage.save(response.accessToken, response.refreshToken, response.user?.email);

      setAuthState({
        token: response.accessToken,
        refreshToken: response.refreshToken,
        userEmail: response.user?.email ?? null,
        user: response.user ?? null,
      });

      return response;
    } catch (err: any) {
      setError(getUserErrorMessage(err));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Logout ─────────────────────────────────────────────────────────────
  const logout = useCallback(async (): Promise<void> => {
    const accessToken = tokenStorage.getAccessToken();
    const refreshToken = tokenStorage.getRefreshToken();
    const config = { headers: { Authorization: `Bearer ${accessToken}` }, timeout: 5000 };
    const revoke = accessToken ? Promise.allSettled([
      axios.delete(`${API_URL}/notifications/token`, config),
      axios.post(`${API_URL}/auth/logout`, { refreshToken }, config),
    ]) : Promise.resolve();
    clearLocalState();
    setSessionError(null);
    setAuthLoaded(true);
    try { await tokenStorage.clear(); } finally { await revoke; }
  }, [clearLocalState]);

  const clearError = useCallback(() => setError(null), []);

  // `isAuthenticated` es un booleano derivado, más cómodo para las guardas.
  const isAuthenticated = !!authState.token;

  if (!authLoaded) return (
    <View style={{ flex: 1, backgroundColor: tc.bg, justifyContent: 'center', padding: SPACING.xxl, gap: SPACING.lg }}>
      {sessionError ? <>
        <Text center>{sessionError}</Text>
        <Button label="Reintentar conexión" onPress={() => setAttempt(value => value + 1)} />
        <Button label="Cerrar sesión" variant="secondary" onPress={() => { void logout(); }} />
      </> : <ActivityIndicator accessibilityLabel="Validando sesión" color={tc.text} />}
    </View>
  );

  return (
    <AuthContext.Provider
      value={{
        authState,
        authLoaded,
        isAuthenticated,
        isLoading,
        error,
        login,
        registerUser,
        verifyEmail,
        loginWithGoogle,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
