import type { ComponentProps } from 'react';
import type { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { TOKENS } from '@/core/design-system';
import type { BadgeTone, ThemeColors } from '@/core/design-system';
import type { KYCStatus } from '../types/kyc.types';
import type { BackgroundCheckStatus } from '../services/background-check.service';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];
type IoniconName = ComponentProps<typeof Ionicons>['name'];

export interface KYCStatusInfo {
  title: string;
  description: string;
  icon: MaterialIconName;
  /** `Badge` tone (a `TOKENS.status` key, `brand` or `neutral`). */
  tone: BadgeTone;
  /** Short pill label used in the provider onboarding steps (none while not started). */
  badge?: string;
}

const IN_REVIEW: KYCStatusInfo = {
  title: 'En revisión',
  description: 'Tu documentación está siendo revisada. Te notificamos cuando esté listo.',
  icon: 'hourglass-empty',
  tone: 'progress',
  badge: 'En revisión',
};

const REJECTED: KYCStatusInfo = {
  title: 'Verificación rechazada',
  description: 'Hubo un problema con tus documentos. Podés volver a intentarlo.',
  icon: 'cancel',
  tone: 'cancelled',
  badge: 'Rechazado',
};

/** Single source of truth for how an identity-verification status is labelled and colored. */
export const KYC_STATUS: Record<KYCStatus, KYCStatusInfo> = {
  not_started: {
    title: 'Verificación no iniciada',
    description: 'Para publicar servicios y crear órdenes necesitás verificar tu identidad.',
    icon: 'shield',
    tone: 'brand',
  },
  in_progress: IN_REVIEW,
  pending: IN_REVIEW,
  approved: {
    title: '¡Verificado!',
    description: 'Tu identidad fue verificada exitosamente. Podés publicar servicios y crear órdenes.',
    icon: 'verified',
    tone: 'done',
    badge: 'Verificado',
  },
  rejected: REJECTED,
  declined: REJECTED,
  failed: {
    title: 'Error en verificación',
    description: 'Hubo un error técnico. Podés volver a intentarlo.',
    icon: 'error-outline',
    tone: 'cancelled',
    badge: 'Error',
  },
  expired: {
    title: 'Verificación vencida',
    description: 'Tu verificación expiró. Necesitás iniciar el proceso nuevamente.',
    icon: 'timer-off',
    tone: 'pending',
    badge: 'Vencido',
  },
};

export interface BackgroundCheckStatusInfo {
  label: string;
  icon: IoniconName;
  tone: BadgeTone;
}

/** Single source of truth for how a criminal-record certificate status is labelled and colored. */
export const BACKGROUND_CHECK_STATUS: Record<BackgroundCheckStatus, BackgroundCheckStatusInfo> = {
  NOT_SUBMITTED: { label: 'Sin enviar',  icon: 'document-outline', tone: 'neutral' },
  UNDER_REVIEW:  { label: 'En revisión', icon: 'time-outline',     tone: 'pending' },
  APPROVED:      { label: 'Aprobado',    icon: 'checkmark-circle', tone: 'done' },
  REJECTED:      { label: 'Rechazado',   icon: 'close-circle',     tone: 'cancelled' },
};

/** Resolves a `BadgeTone` to its foreground / translucent background pair (same rules as `Badge`). */
export function toneColors(tone: BadgeTone, tc: ThemeColors): { fg: string; bg: string } {
  if (tone === 'brand') return { fg: TOKENS.color.signal, bg: tc.accent };
  if (tone === 'neutral') return { fg: tc.textSub, bg: tc.surface2 };
  return TOKENS.status[tone];
}
