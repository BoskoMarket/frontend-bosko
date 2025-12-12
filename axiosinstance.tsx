import axios from "axios";
import { deleteItemAsync, getItemAsync, setItemAsync } from "expo-secure-store";
import { API_URL } from "@/env";
import { refreshTokenService } from "./services/auth";

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  return config;
});

api.interceptors.request.use(
  async (request) => {
    const token = await getItemAsync("token");
    if (token) {
      request.headers.Authorization = `Bearer ${token}`;
    }
    return request;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = await getItemAsync("refreshToken");
      const newAccessToken = await refreshTokenService(refreshToken);

      if (newAccessToken) {
        await setItemAsync("token", newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } else {
        await deleteItemAsync("token");
        await deleteItemAsync("refreshToken");
        // router.replace('/login'); // opcional
      }
    }

    return Promise.reject(error);
  }
);

export default api;
