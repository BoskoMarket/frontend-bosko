import { useQuery } from '@tanstack/react-query';
import { buildWhatsappUrl } from '../utils/whatsapp';
import { APP_CONFIG_QUERY } from './useAppGate';

/**
 * Support contact served by GET /app/config (shares the cached gate query).
 * `url` is null until the backend provides a number, so the UI hides the action.
 */
export function useSupportContact(extraMessage?: string) {
  const { data } = useQuery(APP_CONFIG_QUERY);
  const message = [data?.supportMessage, extraMessage].filter(Boolean).join(' ');
  return { url: buildWhatsappUrl(data?.supportWhatsapp, message) };
}
