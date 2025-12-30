import api from "@/core/api/axiosinstance";
import { getItemAsync, setItemAsync } from "expo-secure-store";
import { AuthResponse, Credentials, RegisterUserPayload } from "../types";

/**
 * LOGIN
 */
export async function loginService(credentials: Credentials): Promise<AuthResponse> {

  console.log(credentials, "Credenciales");

  const { data } = await api.post<AuthResponse>("/auth/login", credentials);

  if (!data) {
    throw new Error("No data received from login");
  }

  return data;
}

/**
 * REGISTER
 */
export async function registerUserService(
  payload: RegisterUserPayload
): Promise<AuthResponse> {

  console.log(payload, "Soy el payload en el servicio");

  const { data } = await api.post<AuthResponse>("/auth/register", payload);

  console.log(data, "Data en el servicio");

  return data;
}

/**
 * Verifica si un username está disponible
 * @returns true si el username YA EXISTE, false si está disponible
 */
export async function checkUsernameAvailabilityService(
  username: string
): Promise<boolean> {
  const { data } = await api.get<boolean>(
    `/auth/username-exists/${username}`
  );
  // La API devuelve true si existe, false si está disponible
  return data;
}

/**
 * REFRESH TOKEN
 */
export const refreshTokenService = async (
  oldRefreshToken: string | null
): Promise<string | null> => {
  try {
    const { data, status } = await api.post<AuthResponse>("/auth/refresh", {
      refreshToken: oldRefreshToken,
    });

    if (status === 201 || status === 200) {
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
