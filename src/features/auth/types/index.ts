import type { components } from '@/core/api/generated/schema';
// ── Tipos del módulo de autenticación ───────────────────────────────────────

/** Credenciales para iniciar sesión */
export type Credentials = components['schemas']['LoginDto'];

/** Payload para registrar un nuevo usuario */
export type RegisterUserPayload = components['schemas']['RegisterDto'];

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
}

/** Tokens + usuario devueltos por login, register o refresh */
export interface AuthResponse {
  accessToken:  string;
  refreshToken: string;
  user:         AuthUser;
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
  isLoading:                   boolean;
  error:                       string | null;
  login:                       (credentials: Credentials) => Promise<AuthResponse>;
  registerUser:                (data: RegisterUserPayload) => Promise<RegisterResponse>;
  verifyEmail:                 (email: string, code: string) => Promise<void>;
  loginWithGoogle:             (firebaseIdToken: string) => Promise<AuthResponse>;
  logout:                      () => Promise<void>;
  clearError:                  () => void;
}
