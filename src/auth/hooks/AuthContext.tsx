import { login, register } from "@/src/auth/services/auth";
import { refreshTokenService } from "@/src/auth/services/auth";
import { router } from "expo-router";
import { deleteItemAsync, getItemAsync, setItemAsync } from "expo-secure-store";
import { createContext, useContext, useEffect, useState } from "react";

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

interface AuthContextType {
  login: (credentials: { email: string; password: string }) => Promise<any>;
  register: (data: FormData) => Promise<any>;
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
  user: AuthUser | null;
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
    user: AuthUser | null;
  }>({
    token: null,
    refreshToken: null,
    userEmail: null,
    user: null,
  });

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
    setIsLoading(true);
    setError(null);
    try {
      const response = await login({ email, password });

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

  const registerFn = async (data: FormData) => {
    setIsLoading(true);
    setError(null);
    try {
      const payload = {
        name: data.get("name") as string,
        email: data.get("email") as string,
        password: data.get("password") as string,
      };

      const response = await register(payload);

      if (response.accessToken) {
        setAccessToken(response.accessToken);
        setRefreshToken(response.refreshToken);

        const user = response.user ?? null;

        await setItemAsync("token", response.accessToken);
        await setItemAsync("refreshToken", response.refreshToken);
        await setItemAsync("userEmail", payload.email);
        await persistUser(user);

        setAuthState({
          token: response.accessToken,
          refreshToken: response.refreshToken,
          userEmail: payload.email,
          user,
        });
      }
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

  const logout = async () => {
    await deleteItemAsync("token");
    await deleteItemAsync("refreshToken");
    await deleteItemAsync("userEmail");
    await deleteItemAsync("user");
    setAuthState({ token: null, refreshToken: null, userEmail: null, user: null });
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
          user: savedUser,
        });

        setAuthLoaded(true);

        const refreshed = await refreshTokenService(savedRefreshToken);

        if (refreshed) {
          await setItemAsync("token", refreshed);
          setAuthState({
            token: refreshed,
            refreshToken: savedRefreshToken,
            userEmail: savedUserEmail,
            user: savedUser,
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
        register: registerFn,
        isLoading,
        error,
        accessToken,
        refreshToken,
        authLoaded,
        authState,
        user: authState.user,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
