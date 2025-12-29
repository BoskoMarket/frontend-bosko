import api from "@/src/shared/utils/axiosinstance";
import { getItemAsync, setItemAsync } from "expo-secure-store";

export interface Credentials {
  email: string;
  password: string;
}

export interface RegisterPayload extends Credentials {
  name: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user?: any;
}

/**
 * LOGIN
 */
export async function login(credentials: Credentials): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/login", credentials);

  return data;
}

/**
 * REGISTER
 */
export async function register(
  payload: RegisterPayload
): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/register", payload);
  
  return data;
}

/**
 * VALIDATE TOKEN
 */
export const validateTokenService = async (): Promise<number | null> => {
  try {
    const token = await getItemAsync("token");
    if (!token) return null;

    const response = await api.post(
      "/auth/validate",
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );


    return response.status;
  } catch (error: any) {
    if (error.response?.status === 401) {
      return null;
    }
    console.error("Error inesperado validando token:", error);
    return null;
  }
};

/**
 * REFRESH TOKEN
 */
export const refreshTokenService = async (
  oldRefreshToken: string | null
): Promise<string | null> => {
  try {
  

    const { data, status } = await api.post("/auth/refresh", {
      refreshToken: oldRefreshToken,
    });

   

    if (status === 200) {
      const { accessToken, refreshToken } = data;

      
        await setItemAsync("token", accessToken);
        await setItemAsync("refreshToken", refreshToken);
        return accessToken;
      
    }

    return data
  } catch (error) {
    console.error("Error refreshing token:", error);
    return null;
  }
  return null;
};
