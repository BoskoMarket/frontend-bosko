import api from "@/axiosinstance";
import { getItemAsync, setItemAsync } from "expo-secure-store";

export interface Credentials {
  email: string;
  password: string;
}

export interface RegisterFormData {
    password: string;
    email: string;
    firstName: string;
    lastName: string;
    userName: string;
    phone: string;
    location: string;
    bio: string;
  };

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
export async function registerService(
  payload: RegisterFormData
): Promise<AuthResponse> {


  
  
  const response = await api.post<AuthResponse>("/auth/register", {
    name: payload.firstName,
    email: payload.email.trim(),
    userName: payload.userName,
    firstName: payload.firstName,
    lastName: payload.lastName,
    password: payload.password,
  });
  

  
  return response.data;
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
