import { STORAGE_PREFIX } from '@/core/config/storage';
/** AsyncStorage key: seteada al verificar el email por primera vez, consumida
 *  en el próximo login exitoso para mostrar WelcomeVideoScreen una única vez. */
export const WELCOME_VIDEO_PENDING_KEY = `${STORAGE_PREFIX}_WELCOME_VIDEO_PENDING`;
