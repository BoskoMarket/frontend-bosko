import { getKycCopy, hasAttemptsLeft } from '@/features/kyc/utils/kycCopy';
import { buildProviderSteps, currentStep } from '@/features/kyc/utils/providerSteps';
import { deriveProviderReadiness } from '@/features/kyc/utils/providerReadiness';
import type { KYCStatus } from '@/features/kyc/types/kyc.types';

const ALL: KYCStatus[] = ['not_started', 'in_progress', 'pending', 'approved', 'rejected', 'declined', 'failed', 'expired'];
const LEFT = { attemptCount: 1, maxAttempts: 3 };
const NONE = { attemptCount: 3, maxAttempts: 3 };

describe('getKycCopy', () => {
  it.each(ALL)('has title and description for %s', (status) => {
    const c = getKycCopy(status, LEFT);
    expect(c.title).toBeTruthy();
    expect(c.description).toBeTruthy();
  });

  it('maps statuses to variants', () => {
    expect(getKycCopy('not_started').variant).toBe('not_started');
    expect(getKycCopy('in_progress').variant).toBe('in_review');
    expect(getKycCopy('pending').variant).toBe('in_review');
    expect(getKycCopy('approved').variant).toBe('approved');
    expect(getKycCopy('rejected', LEFT).variant).toBe('rejected');
    expect(getKycCopy('declined', LEFT).variant).toBe('rejected');
    expect(getKycCopy('failed', LEFT).variant).toBe('technical');
    expect(getKycCopy('expired', LEFT).variant).toBe('expired');
  });

  it('rejected / declined show the reason and a retry that consumes an attempt', () => {
    (['rejected', 'declined'] as const).forEach((s) => {
      const c = getKycCopy(s, LEFT);
      expect(c).toMatchObject({ showReason: true, retryLabel: 'Reintentar', retryConsumesAttempt: true, showSupport: false });
    });
  });

  it('failed / expired have distinct copy and a retry that does not consume an attempt', () => {
    const failed = getKycCopy('failed', LEFT);
    const expired = getKycCopy('expired', LEFT);
    const rejected = getKycCopy('rejected', LEFT);
    expect(failed.title).not.toBe(expired.title);
    expect(failed.title).not.toBe(rejected.title);
    expect(expired.title).not.toBe(rejected.title);
    [failed, expired].forEach((c) => {
      expect(c).toMatchObject({ retryLabel: 'Reintentar', retryConsumesAttempt: false, showReason: false });
      expect(c.note).toBe('No se descontó ningún intento.');
    });
    expect(failed.description).toMatch(/técnico/);
    expect(expired.description).toMatch(/tiempo/);
  });

  it('failed / expired never go to the exhausted state', () => {
    expect(getKycCopy('failed', NONE).variant).toBe('technical');
    expect(getKycCopy('expired', NONE).showSupport).toBe(false);
  });

  it('exhausted attempts show support and no retry', () => {
    (['rejected', 'declined'] as const).forEach((s) => {
      const c = getKycCopy(s, NONE);
      expect(c).toMatchObject({ variant: 'exhausted', showSupport: true, retryLabel: null });
    });
    expect(hasAttemptsLeft(NONE)).toBe(false);
    expect(hasAttemptsLeft(undefined)).toBe(true);
  });

  it('approved / in review / not started offer no retry', () => {
    (['approved', 'in_progress', 'pending', 'not_started'] as const).forEach((s) => {
      expect(getKycCopy(s).retryLabel).toBeNull();
    });
  });
});

describe('buildProviderSteps (BecomeProvider step states)', () => {
  const build = (isProvider: boolean, kycStatus: KYCStatus, phoneVerified: boolean) =>
    buildProviderSteps(deriveProviderReadiness({ isProvider, kycStatus, phoneVerified }), kycStatus, LEFT);
  const statuses = (steps: ReturnType<typeof build>) => steps.map((s) => s.status);

  it('lists identity, phone, service in order', () => {
    expect(build(false, 'not_started', false).map((s) => s.label)).toEqual(['Identidad', 'Teléfono', 'Tu servicio']);
  });

  it('starts at identity', () => {
    const steps = build(false, 'not_started', false);
    expect(statuses(steps)).toEqual(['active', 'pending', 'pending']);
    expect(currentStep(steps)?.cta).toEqual({ label: 'Iniciar verificación', route: '/(tabs)/profile/kyc' });
  });

  it('keeps identity current while in review or failed, with the right CTA', () => {
    expect(currentStep(build(false, 'pending', false))?.cta?.label).toBe('Ver estado');
    expect(currentStep(build(false, 'failed', false))?.cta?.label).toBe('Reintentar');
    expect(currentStep(build(false, 'rejected', false))?.cta?.label).toBe('Reintentar');
  });

  it('moves to phone once KYC is approved', () => {
    const steps = build(true, 'approved', false);
    expect(statuses(steps)).toEqual(['done', 'active', 'pending']);
    expect(currentStep(steps)?.cta?.route).toBe('/(tabs)/profile/verify-phone');
  });

  it('moves to the service when both are done', () => {
    const steps = build(true, 'approved', true);
    expect(statuses(steps)).toEqual(['done', 'done', 'active']);
    expect(currentStep(steps)?.cta?.route).toBe('/service-form');
  });

  it('shows phone done while identity is still pending', () => {
    expect(statuses(build(false, 'pending', true))).toEqual(['active', 'done', 'pending']);
  });
});
