/**
 * Maps the "you cannot publish yet" server errors (B10) to the message and
 * the step that fixes them. Returns null for any other error.
 */
import { extractApiError } from '@/lib/errors';
import { ERROR_MESSAGES } from '@/lib/error-messages';
import { BECOME_PROVIDER_ROUTE, VERIFY_PHONE_ROUTE } from './providerReadiness';

export interface PublishBlock {
  code: 'PHONE_NOT_VERIFIED' | 'IDENTITY_NOT_VERIFIED';
  message: string;
  route: string;
  ctaLabel: string;
}

export function getPublishBlock(error: unknown): PublishBlock | null {
  const { code } = extractApiError(error);
  if (code === 'PHONE_NOT_VERIFIED') {
    return {
      code,
      message: ERROR_MESSAGES.PHONE_NOT_VERIFIED,
      route: VERIFY_PHONE_ROUTE,
      ctaLabel: 'Verificar teléfono',
    };
  }
  if (code === 'IDENTITY_NOT_VERIFIED') {
    return {
      code,
      message: 'Verifica tu identidad para publicar tu servicio.',
      route: BECOME_PROVIDER_ROUTE,
      ctaLabel: 'Verificar identidad',
    };
  }
  return null;
}
