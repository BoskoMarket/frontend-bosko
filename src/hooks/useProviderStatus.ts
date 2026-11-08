/**
 * useProviderStatus — deriva el estado de rol del usuario a partir de dos
 * fuentes de servidor ya existentes (profile + KYC status), sin agregar un
 * flag nuevo.
 *
 * - 'client'   → nunca arrancó KYC, es un usuario común
 * - 'pending'  → arrancó KYC (en cualquier estado) pero todavía no está aprobado
 * - 'provider' → profile.isProvider === true (aprobado)
 *
 * Además expone `phoneVerified` y `canPublish` (KYC aprobado Y teléfono
 * verificado). La tabla de verdad vive en `deriveProviderReadiness`.
 * Los antecedentes penales son opcionales y no entran acá.
 */

import { useProfile } from '@/features/profile/state/ProfileContext';
import { useKYC } from '@/features/kyc/state/KYCContext';
import type { KYCStatus } from '@/features/kyc/types/kyc.types';
import {
  deriveProviderReadiness,
  type ProviderReadiness,
  type ProviderStatus,
  type ReadinessStep,
} from '@/features/kyc/utils/providerReadiness';

export { deriveProviderReadiness };
export type { ProviderStatus, ProviderReadiness, ReadinessStep };

export function useProviderStatus(): {
  status: ProviderStatus;
  kycStatus: KYCStatus;
  kycApproved: boolean;
  phoneVerified: boolean;
  canPublish: boolean;
  nextStep: ReadinessStep;
  isLoading: boolean;
} {
  const { profile, isLoading: profileLoading } = useProfile();
  const { verification, loading: kycLoading } = useKYC();

  const rawKyc = (verification?.status?.toLowerCase() ?? 'not_started') as KYCStatus;
  // Pending "vacío" (sin inquiry todavía) cuenta como not_started, no como en progreso
  const kycStatus: KYCStatus = rawKyc === 'pending' && !verification?.inquiryId ? 'not_started' : rawKyc;

  const { status, kycApproved, phoneVerified, canPublish, nextStep } = deriveProviderReadiness({
    isProvider: profile?.isProvider === true,
    kycStatus,
    phoneVerified: profile?.isPhoneVerified === true,
  });

  return { status, kycStatus, kycApproved, phoneVerified, canPublish, nextStep, isLoading: profileLoading || kycLoading };
}
