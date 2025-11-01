<<<<<<< HEAD
import { login, registerService } from "@/services/auth";
import { refreshTokenService } from "@/services/auth";
import { router } from "expo-router";
import { deleteItemAsync, getItemAsync, setItemAsync } from "expo-secure-store";
import { createContext, use, useContext, useEffect, useState } from "react";

export interface AuthUser {
  id?: string;
  name?: string;
  email: string;
  avatarUrl?: string;
  plan?: string;
  subscriptionPlan?: string;
  subscription?: { plan?: string } | null;
  membership?: { name?: string } | null;
  planType?: string;
}
=======
import {
  login as loginService,
  registerUser as registerUserService,
  checkEmailAvailability as checkEmailAvailabilityService,
  checkUsernameAvailability as checkUsernameAvailabilityService,
  isPhoneUnique as isPhoneUniqueService,
  refreshTokenService,
  Credentials,
  RegisterUserPayload,
  AuthResponse,
} from "@/services/auth";
import { router } from "expo-router";
import { deleteItemAsync, getItemAsync, setItemAsync } from "expo-secure-store";
import { createContext, useContext, useEffect, useState } from "react";
>>>>>>> 7218bfcc5fc4857d767e9c338650cf6d30873ebf

interface AuthContextType {
  login: (credentials: Credentials) => Promise<AuthResponse>;
  registerUser: (data: RegisterUserPayload) => Promise<AuthResponse>;
  checkEmailAvailability: (email: string) => Promise<boolean>;
  checkUsernameAvailability: (username: string) => Promise<boolean>;
  isPhoneUnique: (phone: string) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  authLoaded: boolean;
  authState: {
    token: string | null;
    refreshToken: string | null;
    userEmail: string | null;
    user: AuthUser | null;
  };
<<<<<<< HEAD
  user: AuthUser | null;
  logout: () => Promise<void>;
=======
  clearError: () => void;
>>>>>>> 7218bfcc5fc4857d767e9c338650cf6d30873ebf
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

const parseUser = (raw: string | null): AuthUser | null => {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthUser;
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
  }>({
    token: null,
    refreshToken: null,
    userEmail: null,
  });

<<<<<<< HEAD
  const persistUser = async (user: AuthUser | null) => {
    if (user) {
      await setItemAsync("user", JSON.stringify(user));
    } else {
      await deleteItemAsync("user");
    }
  };

  const loginFn = async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) => {
=======
  const persistSession = async (response: AuthResponse, email: string) => {
    if (response.accessToken) {
      setAccessToken(response.accessToken);
      setRefreshToken(response.refreshToken);

      await setItemAsync("token", response.accessToken);
      await setItemAsync("refreshToken", response.refreshToken);
      await setItemAsync("userEmail", email);
    }
  };

  const loginFn = async ({ email, password }: Credentials) => {
>>>>>>> 7218bfcc5fc4857d767e9c338650cf6d30873ebf
    setIsLoading(true);
    setError(null);
    try {
      const response = await loginService({ email, password });

<<<<<<< HEAD
      if (response.accessToken) {
        setAccessToken(response.accessToken);
        setRefreshToken(response.refreshToken);

        const user = response.user ?? null;

        await setItemAsync("token", response.accessToken);
        await setItemAsync("refreshToken", response.refreshToken);
        await setItemAsync("userEmail", email);
        await persistUser(user);

        setAuthState({
          token: response.accessToken,
          refreshToken: response.refreshToken,
          userEmail: email,
          user,
        });
      }
=======
      await persistSession(response, email);
>>>>>>> 7218bfcc5fc4857d767e9c338650cf6d30873ebf
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

  const registerFn = async (data: RegisterUserPayload) => {
    setIsLoading(true);
    setError(null);
<<<<<<< HEAD

    try {
      const response = await registerService(data);

      if (response.accessToken) {
        setAccessToken(response.accessToken);
        setRefreshToken(response.refreshToken);

        await setItemAsync("token", response.accessToken);
        await setItemAsync("refreshToken", response.refreshToken);

        setAuthState({
          token: response.accessToken,
          refreshToken: response.refreshToken,
          userEmail: data.email,
        });

        return response;
      }
=======
    try {
      const response = await registerUserService(data);

      await persistSession(response, data.email);
      return response;
>>>>>>> 7218bfcc5fc4857d767e9c338650cf6d30873ebf
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Error al registrar usuario";
      setError(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const checkEmailAvailability = async (email: string) => {
    try {
      setError(null);
      return await checkEmailAvailabilityService(email);
    } catch (error: any) {
      const message =
        error.response?.data?.message || "No se pudo validar el correo";
      setError(message);
      throw new Error(message);
    }
  };

  const checkUsernameAvailability = async (username: string) => {
    try {
      setError(null);
      return await checkUsernameAvailabilityService(username);
    } catch (error: any) {
      const message =
        error.response?.data?.message || "No se pudo validar el usuario";
      setError(message);
      throw new Error(message);
    }
  };

  const checkPhoneUniqueness = async (phone: string) => {
    try {
      setError(null);
      return await isPhoneUniqueService(phone);
    } catch (error: any) {
      const message =
        error.response?.data?.message || "No se pudo validar el teléfono";
      setError(message);
      throw new Error(message);
    }
  };

  const logout = async () => {
    await deleteItemAsync("token");
    await deleteItemAsync("refreshToken");
    await deleteItemAsync("userEmail");
    await deleteItemAsync("user");
    setAuthState({
      token: null,
      refreshToken: null,
      userEmail: null,
    });
    setAccessToken(null);
    setRefreshToken(null);
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const savedToken = await getItemAsync("token");
        const savedRefreshToken = await getItemAsync("refreshToken");
        const savedUserEmail = await getItemAsync("userEmail");
        const savedUserRaw = await getItemAsync("user");
        const savedUser = parseUser(savedUserRaw);

        if (!savedToken || !savedRefreshToken || !savedUserEmail) {
          router.push("/login");
          await logout();
          return;
        }

        setAuthState({
          token: savedToken,
          refreshToken: savedRefreshToken,
          userEmail: savedUserEmail,
        });

        setAuthLoaded(true);

        const refreshed = await refreshTokenService(savedRefreshToken);

        if (refreshed) {
          await setItemAsync("token", refreshed);
          setAuthState({
            token: refreshed,
            refreshToken: savedRefreshToken,
            userEmail: savedUserEmail,
          });
        } else {
          console.warn("No se pudo refrescar el token.");
          await logout();
        }
      } catch (error) {
        console.error("Error en checkAuth:", error);
        await logout();
      } finally {
        setAuthLoaded(true);
      }
    };

    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        login: loginFn,
        registerUser: registerFn,
        checkEmailAvailability,
        checkUsernameAvailability,
        isPhoneUnique: checkPhoneUniqueness,
        isLoading,
        error,
        accessToken,
        refreshToken,
        authLoaded,
        authState,
<<<<<<< HEAD

        logout,
=======
        clearError: () => setError(null),
>>>>>>> 7218bfcc5fc4857d767e9c338650cf6d30873ebf
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
