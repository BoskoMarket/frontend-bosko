const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
if (!configuredUrl || !/^https?:\/\/[^\s/]+(?:\/[^\s]*)?$/.test(configuredUrl)) {
  throw new Error('Configura EXPO_PUBLIC_API_URL con una URL HTTP válida antes de iniciar Bosko.');
}
export const API_URL = configuredUrl.replace(/\/+$/, '');
if (!/\/api\/v1$/.test(new URL(API_URL).pathname)) {
  throw new Error('Configura EXPO_PUBLIC_API_URL con una URL que termine en /api/v1 antes de iniciar Bosko.');
}
// Decisión temporal del MVP: los pagos se simulan en este dispositivo.
export const PAYMENTS_MODE = 'mock' as const;

/** Web Client ID de Google Sign-In. Vacío hasta que se configure el proveedor en Firebase/Google Cloud. */
export const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';
