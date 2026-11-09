import type { components } from '@/core/api/generated/schema';
import type { UserCity } from '@/features/markets/types';
// ── Tipos del módulo de autenticación ───────────────────────────────────────

/** Credenciales para iniciar sesión */
export type Credentials = components['schemas']['LoginDto'];

/** Payload para registrar un nuevo usuario */
export type RegisterUserPayload = components['schemas']['RegisterDto'] & {
  cityId: string;
  acceptedTerms: true;
  termsVersion: string;
};

/** Extra fields the Google sign-in sends when the backend asked for them (CITY_REQUIRED). */
export interface GoogleSignupExtras {
  cityId: string;
  acceptedTerms: true;
  termsVersion: string;
}

/** Respuesta del endpoint POST /auth/register */
export interface RegisterResponse {
  message: string;
  userId:  string;
}

/** Usuario incluido en la respuesta de login/register */
export interface AuthUser {
  id:         string;
  email:      string;
  role:       string;
  isProvider: boolean;
  isVerified: boolean;
  kycStatus:  string;
  /** `null` = no city yet; `undefined` = the backend does not send it. */
  city?:      UserCity | null;
}

/** Tokens + usuario devueltos por login, register o refresh */
export interface AuthResponse {
  accessToken:  string;
  refreshToken: string;
  user:         AuthUser;
  /** true when this login cancelled a scheduled account deletion (grace period). */
  reactivated?: boolean;
}

/**
 * Wrapper genérico del servidor: todas las respuestas vienen como
 * { success, timestamp, data: <T> }
 */
export interface ApiResponse<T> {
  success:   boolean;
  timestamp: string;
  data:      T;
}

/**
 * Estado de autenticación almacenado en AuthContext.
 * `user` contiene los datos básicos devueltos por el login/register.
 */
export interface AuthState {
  token:        string | null;
  refreshToken: string | null;
  userEmail:    string | null;
  user:         AuthUser | null;
}

/** Contrato público del contexto de autenticación */
export interface AuthContextType {
  authState:                   AuthState;
  authLoaded:                  boolean;
  isAuthenticated:             boolean;
  /** True after a forced logout caused by a suspended account (routing state). */
  suspended:                   boolean;
  clearSuspended:              () => void;
  isLoading:                   boolean;
  error:                       string | null;
  login:                       (credentials: Credentials) => Promise<AuthResponse>;
  registerUser:                (data: RegisterUserPayload) => Promise<RegisterResponse>;
  verifyEmail:                 (email: string, code: string) => Promise<void>;
  loginWithGoogle:             (firebaseIdToken: string, extras?: GoogleSignupExtras) => Promise<AuthResponse>;
  logout:                      () => Promise<void>;
  clearError:                  () => void;
}
