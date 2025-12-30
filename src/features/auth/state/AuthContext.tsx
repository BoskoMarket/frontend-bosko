import {
  checkUsernameAvailabilityService,
  loginService,
  registerUserService,
  refreshTokenService,
} from "@/features/auth/services/auth";
import {
  AuthResponse,
  Credentials,
  RegisterUserPayload,
} from "@/features/auth/types";
import { router } from "expo-router";
import { deleteItemAsync, getItemAsync, setItemAsync } from "expo-secure-store";
import { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
  login: (credentials: Credentials) => Promise<AuthResponse>;
  registerUser: (data: RegisterUserPayload) => Promise<AuthResponse>;
  checkUsernameAvailability: (username: string) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  authLoaded: boolean;
  authState: {
    token: string | null;
    refreshToken: string | null;
    userEmail: string | null;
    user: any | null;
  };
  clearError: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

const parseUser = (raw: string | null): AuthResponse | null => {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthResponse;
  } catch (error) {
    console.warn("Could not parse stored user", error);
    return null;
  }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [authState, setAuthState] = useState<{
    token: string | null;
    refreshToken: string | null;
    userEmail: string | null;
    user: any;
  }>({
    token: null,
    refreshToken: null,
    userEmail: null,
    user: null,
  });

  const persistSession = async (response: AuthResponse, email: string) => {
    console.log("💾 [AuthContext] Persisting session...");
    if (response.accessToken) {
      setAccessToken(response.accessToken);
      setRefreshToken(response.refreshToken);

      await setItemAsync("token", response.accessToken);
      await setItemAsync("refreshToken", response.refreshToken);
      await setItemAsync("userEmail", email);

      // Update authState so ProfileContext and other contexts can react
      console.log("✅ [AuthContext] Session persisted, updating authState");
      setAuthState({
        token: response.accessToken,
        refreshToken: response.refreshToken,
        userEmail: email,
        user: null, // API auth does not return user object
      });
    }
  };

  const loginFn = async ({ email, password }: Credentials) => {
    console.log("🔑 [AuthContext] Starting login...");
    setIsLoading(true);
    setError(null);
    try {
      const response = await loginService({ email, password });
      console.log("✅ [AuthContext] Login successful");

      await persistSession(response, email);
      return response;
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Error al iniciar sesión";
      setError(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const registerUser = async (data: RegisterUserPayload) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await registerUserService(data);

      await persistSession(response, data.email);
      return response;
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Error al registrar usuario";
      setError(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const checkUsernameAvailability = async (username: string) => {
    try {
      setError(null);
      const exists = await checkUsernameAvailabilityService(username);
      // La API devuelve true si existe, false si está disponible
      return exists;
    } catch (error: any) {
      const message =
        error.response?.data?.message || "No se pudo validar el usuario";
      setError(message);
      throw new Error(message);
    }
  };

  const logout = async () => {
    console.log("🚪 [AuthContext] Logging out...");
    await deleteItemAsync("token");
    await deleteItemAsync("refreshToken");
    await deleteItemAsync("userEmail");
    await deleteItemAsync("user");
    console.log("✅ [AuthContext] Cleared storage, updating authState");
    setAuthState({
      token: null,
      refreshToken: null,
      userEmail: null,
      user: null,
    });
    setAccessToken(null);
    setRefreshToken(null);
    console.log("✅ [AuthContext] Logout complete");
  };

  useEffect(() => {

    const checkAuth = async () => {
      console.log("🔍 [AuthContext] Checking auth on mount...");
      try {
        const savedToken = await getItemAsync("token");
        const savedRefreshToken = await getItemAsync("refreshToken");
        const savedUserEmail = await getItemAsync("userEmail");
        const savedUserRaw = await getItemAsync("user");
        const savedUser = parseUser(savedUserRaw);

        console.log("📦 [AuthContext] Stored credentials:", {
          hasToken: !!savedToken,
          hasRefreshToken: !!savedRefreshToken,
          email: savedUserEmail,
          hasUser: !!savedUser,
        });

        if (!savedToken || !savedRefreshToken) {
          console.log("❌ [AuthContext] No stored credentials found");
          setAuthLoaded(true);
          return;
        }

        console.log("✅ [AuthContext] Restoring session from storage");
        setAuthState({
          token: savedToken,
          refreshToken: savedRefreshToken,
          userEmail: savedUserEmail,
          user: savedUser,
        });

        setAuthLoaded(true);
      } catch (error) {
        console.error("Error en checkAuth:", error);
        await logout();
        setAuthLoaded(true);
      }
    };

    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        login: loginFn,
        registerUser,
        checkUsernameAvailability,
        isLoading,
        error,
        accessToken,
        refreshToken,
        authLoaded,
        authState,
        clearError: () => setError(null),
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
