import api from "@/axiosinstance";
import { getItemAsync, setItemAsync } from "expo-secure-store";

export interface Credentials {
  email: string;
  password: string;
}

export interface RegisterUserPayload extends Credentials {
  userName: string;
  firstName: string;
  lastName: string;
}

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
export async function registerUser(
  payload: RegisterUserPayload
): Promise<AuthResponse> {

  console.log(payload, "Soy el payload en el servicio");

  const { data } = await api.post<AuthResponse>("/auth/register", payload);

  console.log(data, "Data en el servicio");

  return data;
}

// NOTA: Este endpoint no está disponible en la API actual
// export async function checkEmailAvailability(email: string): Promise<boolean> {
//   const { data } = await api.get<AvailabilityResponse>("/user");
//   return data.available;
// }

/**
 * Verifica si un username está disponible
 * @returns true si el username YA EXISTE, false si está disponible
 */
export async function checkUsernameAvailability(
  username: string
): Promise<boolean> {
  const { data } = await api.get<boolean>(
    `/auth/username-exists/${username}`
  );
  // La API devuelve true si existe, false si está disponible
  return data;
}

// NOTA: Este endpoint no está disponible en la API actual
// export async function isPhoneUnique(phone: string): Promise<boolean> {
//   const { data } = await api.get<AvailabilityResponse>("/user/check-phone", {
//     params: { phone },
//   });
//   return data.available;
// }

/**
 * VALIDATE TOKEN
 * NOTA: Este endpoint no existe en la API actual
 */
// export const validateTokenService = async (): Promise<number | null> => {
//   try {
//     const token = await getItemAsync("token");
//     if (!token) return null;
//
//     const response = await api.post(
//       "/auth/validate",
//       {},
//       { headers: { Authorization: `Bearer ${token}` } }
//     );
//
//     return response.status;
//   } catch (error: any) {
//     if (error.response?.status === 401) {
//       return null;
//     }
//     console.error("Error inesperado validando token:", error);
//     return null;
//   }
// };

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
