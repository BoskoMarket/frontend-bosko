/**
 * Pure copy + variant mapping for every identity-verification status.
 * Screens render this; they never branch on raw copy themselves.
 *
 * - rejected / declined -> the reviewer's reason + "Reintentar" while attempts remain
 *   (a retry after a rejection consumes an attempt).
 * - failed / expired    -> technical / process copy, retry NEVER consumes an attempt.
 * - rejected / declined with no attempts left -> exhausted copy + support contact.
 */
import type { KYCStatus } from '../types/kyc.types';

export type KycVariant =
  | 'not_started'
  | 'in_review'
  | 'approved'
  | 'rejected'
  | 'exhausted'
  | 'technical'
  | 'expired';

export interface KycCopy {
  variant: KycVariant;
  title: string;
  description: string;
  /** Retry button label, or null when no retry applies (approved, in review, exhausted). */
  retryLabel: string | null;
  /** Whether retrying counts against the attempt limit. */
  retryConsumesAttempt: boolean;
  /** Show the reviewer's `rejectionReason` (only for rejected / declined). */
  showReason: boolean;
  /** Show the support contact button (attempts exhausted). */
  showSupport: boolean;
  /** Extra line under the description, e.g. "No se descontó ningún intento." */
  note?: string;
}

export interface KycAttempts {
  attemptCount?: number;
  maxAttempts?: number;
}

export const DEFAULT_MAX_ATTEMPTS = 3;

export function hasAttemptsLeft(a?: KycAttempts | null): boolean {
  if (!a) return true;
  return (a.attemptCount ?? 0) < (a.maxAttempts ?? DEFAULT_MAX_ATTEMPTS);
}

const BASE = { retryLabel: null, retryConsumesAttempt: false, showReason: false, showSupport: false } as const;

export function getKycCopy(status: KYCStatus, attempts?: KycAttempts | null): KycCopy {
  switch (status) {
    case 'approved':
      return {
        ...BASE,
        variant: 'approved',
        title: '¡Verificado!',
        description: 'Tu identidad fue verificada exitosamente.',
      };
    case 'in_progress':
    case 'pending':
      return {
        ...BASE,
        variant: 'in_review',
        title: 'En revisión',
        description: 'Tu documentación está siendo revisada. Te notificamos cuando esté listo.',
      };
    case 'rejected':
    case 'declined': {
      if (!hasAttemptsLeft(attempts)) {
        return {
          ...BASE,
          variant: 'exhausted',
          title: 'Intentos agotados',
          description: 'Usaste todos los intentos de verificación. Contacta a soporte para que te ayudemos.',
          showReason: true,
          showSupport: true,
        };
      }
      return {
        ...BASE,
        variant: 'rejected',
        title: 'Verificación rechazada',
        description: 'Tu verificación de identidad no fue aprobada. Revisa el motivo y vuelve a intentarlo.',
        retryLabel: 'Reintentar',
        retryConsumesAttempt: true,
        showReason: true,
      };
    }
    case 'failed':
      return {
        ...BASE,
        variant: 'technical',
        title: 'Hubo un problema técnico',
        description: 'No pudimos completar tu verificación por un problema técnico. Puedes volver a intentarlo.',
        note: 'No se descontó ningún intento.',
        retryLabel: 'Reintentar',
      };
    case 'expired':
      return {
        ...BASE,
        variant: 'expired',
        title: 'El proceso venció',
        description: 'El tiempo para completar tu verificación terminó. Inicia el proceso de nuevo.',
        note: 'No se descontó ningún intento.',
        retryLabel: 'Reintentar',
      };
    case 'not_started':
    default:
      return {
        ...BASE,
        variant: 'not_started',
        title: 'Verificación no iniciada',
        description: 'Para publicar servicios necesitas verificar tu identidad y tu teléfono.',
      };
  }
}
