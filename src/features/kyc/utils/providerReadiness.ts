/**
 * Provider readiness truth table (pure).
 *
 * To publish a service a provider needs BOTH: KYC approved AND phone verified.
 * The background check is optional (trust badge only) and never part of this.
 *
 * kycApproved = isProvider || kycStatus === 'approved'
 * canPublish  = kycApproved && phoneVerified
 * nextStep    = !kycApproved -> 'kyc'; else !phoneVerified -> 'phone'; else 'service'
 */
import type { KYCStatus } from '../types/kyc.types';

export type ProviderStatus = 'client' | 'pending' | 'provider';
export type ReadinessStep = 'kyc' | 'phone' | 'service';

export interface ProviderReadinessInput {
  isProvider: boolean;
  kycStatus: KYCStatus;
  phoneVerified: boolean;
}

export interface ProviderReadiness {
  status: ProviderStatus;
  kycApproved: boolean;
  phoneVerified: boolean;
  canPublish: boolean;
  nextStep: ReadinessStep;
}

export function deriveProviderReadiness({ isProvider, kycStatus, phoneVerified }: ProviderReadinessInput): ProviderReadiness {
  const kycApproved = isProvider || kycStatus === 'approved';
  const status: ProviderStatus = isProvider ? 'provider' : kycStatus !== 'not_started' ? 'pending' : 'client';
  const canPublish = kycApproved && phoneVerified;
  const nextStep: ReadinessStep = !kycApproved ? 'kyc' : !phoneVerified ? 'phone' : 'service';
  return { status, kycApproved, phoneVerified, canPublish, nextStep };
}

export const BECOME_PROVIDER_ROUTE = '/(tabs)/profile/become-provider';
export const VERIFY_PHONE_ROUTE = '/(tabs)/profile/verify-phone';

/** Route of the pending step, or null when nothing is pending. */
export function routeForStep(step: ReadinessStep): string | null {
  if (step === 'kyc') return BECOME_PROVIDER_ROUTE;
  if (step === 'phone') return VERIFY_PHONE_ROUTE;
  return null;
}

const RANK: Record<ProviderStatus, number> = { client: 0, pending: 1, provider: 2 };

/**
 * Where the gate must send the user, or null to let them in.
 * Status below `min` -> become-provider (as before). With `requirePublish`,
 * a provider that cannot publish yet goes to its pending step.
 */
export function resolveGateRedirect(
  readiness: Pick<ProviderReadiness, 'status' | 'canPublish' | 'nextStep'>,
  min: ProviderStatus,
  requirePublish = false,
): string | null {
  if (RANK[readiness.status] < RANK[min]) return BECOME_PROVIDER_ROUTE;
  if (requirePublish && !readiness.canPublish) return routeForStep(readiness.nextStep);
  return null;
}
