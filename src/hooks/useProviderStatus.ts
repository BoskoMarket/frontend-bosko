/**
 * useProviderStatus — deriva el estado de rol del usuario a partir de dos
 * fuentes de servidor ya existentes (profile.isProvider + KYC status), sin
 * agregar un flag nuevo. Reemplaza el booleano `isProvider` suelto que
 * ProfileScreen/DashboardScreen recalculaban cada uno por su lado.
 *
 * - 'client'   → nunca arrancó KYC, es un usuario común
 * - 'pending'  → arrancó KYC (en cualquier estado: en revisión, rechazado,
 *                vencido, etc.) pero todavía no está aprobado como prestador
 * - 'provider' → profile.isProvider === true (aprobado)
 */

import { useProfile } from '@/features/profile/state/ProfileContext';
import { useKYC } from '@/features/kyc/state/KYCContext';
import type { KYCStatus } from '@/features/kyc/types/kyc.types';

export type ProviderStatus = 'client' | 'pending' | 'provider';

export function useProviderStatus(): { status: ProviderStatus; kycStatus: KYCStatus; isLoading: boolean } {
  const { profile, isLoading: profileLoading } = useProfile();
  const { verification, loading: kycLoading } = useKYC();

  const isProvider = profile?.isProvider === true;
  const rawKyc = (verification?.status?.toLowerCase() ?? 'not_started') as KYCStatus;
  // Pending "vacío" (sin inquiry todavía) cuenta como not_started, no como en progreso
  const kycStatus: KYCStatus = rawKyc === 'pending' && !verification?.inquiryId ? 'not_started' : rawKyc;

  const status: ProviderStatus = isProvider ? 'provider' : kycStatus !== 'not_started' ? 'pending' : 'client';

  return { status, kycStatus, isLoading: profileLoading || kycLoading };
}
