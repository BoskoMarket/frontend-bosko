import api from "@/axiosinstance";
import { getItemAsync, setItemAsync } from "expo-secure-store";

export interface Credentials {
  email: string;
  password: string;
}

<<<<<<< HEAD
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
=======
export interface RegisterUserPayload extends Credentials {
  fullName: string;
  username: string;
  nationality: string;
  countryOfResidence: string;
  phone: string;
}
>>>>>>> 7218bfcc5fc4857d767e9c338650cf6d30873ebf

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user?: any;
}

interface AvailabilityResponse {
  available: boolean;
  message?: string;
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
export async function registerUser(
  payload: RegisterUserPayload
): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/user", payload);

  return data;
}

export async function checkEmailAvailability(email: string): Promise<boolean> {
  const { data } = await api.get<AvailabilityResponse>("/user/check-email", {
    params: { email },
  });

  return data.available;
}

export async function checkUsernameAvailability(
  username: string
): Promise<boolean> {
  const { data } = await api.get<AvailabilityResponse>(
    "/user/check-username",
    {
      params: { username },
    }
  );

  return data.available;
}

export async function isPhoneUnique(phone: string): Promise<boolean> {
  const { data } = await api.get<AvailabilityResponse>("/user/check-phone", {
    params: { phone },
  });

  return data.available;
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

    return null;
  } catch (error) {
    console.error("Error refreshing token:", error);
    return null;
  }
};
