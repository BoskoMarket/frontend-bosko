/**
 * auth.service — Llamadas HTTP del módulo de autenticación.
 *
 * El axiosinstance desempaqueta automáticamente el wrapper
 * { success, timestamp, data: T } → el código recibe T directamente.
 */

import api from '@/core/api/axiosinstance';
import type { AuthResponse, Credentials, RegisterResponse, RegisterUserPayload } from '../types';

export async function loginService(credentials: Credentials): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/login', credentials);
  return data;
}

export async function registerUserService(
  payload: RegisterUserPayload,
): Promise<RegisterResponse> {
  const { data } = await api.post<RegisterResponse>('/auth/register', payload);
  return data;
}

export async function verifyEmailService(email: string, code: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/verify-email', { email, code });
  return data;
}

/**
 * Login/registro con Google. El backend todavía NO tiene este endpoint (no
 * aparece en /api/docs-json al momento de escribir esto) — se asume el mismo
 * contrato { accessToken, refreshToken, user } que el resto de /auth, recibiendo
 * el idToken de Firebase (mismo patrón que verifyPhoneWithFirebase). Ajustar
 * ruta/body/shape de la respuesta en cuanto el backend lo publique.
 */
export async function loginWithGoogleService(firebaseIdToken: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/google', { idToken: firebaseIdToken });
  return data;
}

export async function changePasswordService(currentPassword: string, newPassword: string): Promise<void> {
  await api.patch('/users/me/password', { currentPassword, newPassword });
}

export async function forgotPasswordService(email: string): Promise<void> {
  await api.post('/auth/forgot-password', { email });
}

export async function resetPasswordService(email: string, code: string, newPassword: string): Promise<void> {
  await api.post('/auth/reset-password', { email, code, newPassword });
}

