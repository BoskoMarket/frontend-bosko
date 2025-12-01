import { AxiosError } from "axios";

export function extractApiError(error: unknown): string {
  if ((error as AxiosError)?.isAxiosError) {
    const axiosError = error as AxiosError<{ message?: string; error?: string }>;
    const message =
      axiosError.response?.data?.message ||
      axiosError.response?.data?.error ||
      axiosError.message;
    return message || "Ocurrió un error al comunicar con el servidor";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Ocurrió un error desconocido";
}
