const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
if (!configuredUrl || !/^https?:\/\/[^\s/]+(?:\/[^\s]*)?$/.test(configuredUrl)) {
  throw new Error('Configurá EXPO_PUBLIC_API_URL con una URL HTTP válida antes de iniciar Bosko.');
}
export const API_URL = configuredUrl.replace(/\/+$/, '');

/** Web Client ID de Google Sign-In. Vacío hasta que se configure el proveedor en Firebase/Google Cloud. */
export const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';

