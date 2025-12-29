import { API_URL } from "@/core/config/env";
import axios from "axios";
import { getItemAsync } from "expo-secure-store";


const http = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

http.interceptors.request.use(async (config) => {
  try {
    const token = await getItemAsync("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // TODO: leer token directamente desde AuthContext cuando esté disponible
    }
  } catch (error) {
    console.warn("No se pudo leer el token almacenado", error);
  }

  return config;
});

export default http;
