import {
  deriveProviderReadiness,
  resolveGateRedirect,
  routeForStep,
  BECOME_PROVIDER_ROUTE,
  VERIFY_PHONE_ROUTE,
} from '@/features/kyc/utils/providerReadiness';
import { getPublishBlock } from '@/features/kyc/utils/publishErrors';
import { resolveDocumentTypes, formatDocumentTypes } from '@/features/kyc/utils/documentTypes';
import type { KYCStatus } from '@/features/kyc/types/kyc.types';

const ALL: KYCStatus[] = ['not_started', 'in_progress', 'pending', 'approved', 'rejected', 'declined', 'failed', 'expired'];

describe('deriveProviderReadiness truth table', () => {
  it.each(ALL.flatMap((k) => [true, false].flatMap((p) => [true, false].map((v) => [k, p, v] as const))))(
    'kyc=%s isProvider=%s phone=%s',
    (kycStatus, isProvider, phoneVerified) => {
      const r = deriveProviderReadiness({ isProvider, kycStatus, phoneVerified });
      const kycApproved = isProvider || kycStatus === 'approved';
      expect(r.kycApproved).toBe(kycApproved);
      expect(r.canPublish).toBe(kycApproved && phoneVerified);
      expect(r.nextStep).toBe(!kycApproved ? 'kyc' : !phoneVerified ? 'phone' : 'service');
      expect(r.status).toBe(isProvider ? 'provider' : kycStatus === 'not_started' ? 'client' : 'pending');
    },
  );

  it('needs both KYC and phone; the background check never matters', () => {
    expect(deriveProviderReadiness({ isProvider: true, kycStatus: 'approved', phoneVerified: false }).canPublish).toBe(false);
    expect(deriveProviderReadiness({ isProvider: false, kycStatus: 'approved', phoneVerified: true }).canPublish).toBe(true);
    expect(deriveProviderReadiness({ isProvider: false, kycStatus: 'pending', phoneVerified: true }).canPublish).toBe(false);
  });
});

describe('resolveGateRedirect', () => {
  const r = (isProvider: boolean, kycStatus: KYCStatus, phoneVerified: boolean) =>
    deriveProviderReadiness({ isProvider, kycStatus, phoneVerified });

  it('keeps the old behavior for clients below the minimum status', () => {
    expect(resolveGateRedirect(r(false, 'not_started', false), 'provider')).toBe(BECOME_PROVIDER_ROUTE);
    expect(resolveGateRedirect(r(false, 'not_started', false), 'provider', true)).toBe(BECOME_PROVIDER_ROUTE);
    expect(resolveGateRedirect(r(false, 'pending', false), 'pending')).toBeNull();
  });

  it('does not require phone unless requirePublish is set', () => {
    expect(resolveGateRedirect(r(true, 'approved', false), 'provider')).toBeNull();
  });

  it('sends to the pending step when it cannot publish', () => {
    expect(resolveGateRedirect(r(false, 'in_progress', false), 'pending', true)).toBe(BECOME_PROVIDER_ROUTE);
    expect(resolveGateRedirect(r(true, 'approved', false), 'provider', true)).toBe(VERIFY_PHONE_ROUTE);
  });

  it('lets a provider that can publish in', () => {
    expect(resolveGateRedirect(r(true, 'approved', true), 'provider', true)).toBeNull();
    expect(routeForStep('service')).toBeNull();
  });
});

describe('publish errors', () => {
  const apiError = (code: string) => ({
    isAxiosError: true,
    message: 'x',
    response: { status: 403, data: { success: false, statusCode: 403, code, message: 'm', timestamp: 't' } },
  });

  it('maps PHONE_NOT_VERIFIED to its message and the phone step', () => {
    expect(getPublishBlock(apiError('PHONE_NOT_VERIFIED'))).toMatchObject({
      message: 'Verifica tu teléfono para publicar tu servicio.',
      route: VERIFY_PHONE_ROUTE,
    });
  });

  it('maps IDENTITY_NOT_VERIFIED to the checklist', () => {
    expect(getPublishBlock(apiError('IDENTITY_NOT_VERIFIED'))?.route).toBe(BECOME_PROVIDER_ROUTE);
  });

  it('ignores other errors', () => {
    expect(getPublishBlock(apiError('SERVICE_LIMIT_REACHED'))).toBeNull();
    expect(getPublishBlock(new Error('boom'))).toBeNull();
  });
});

describe('document types', () => {
  it('falls back to today list when the backend sends nothing usable', () => {
    const def = ['DNI', 'CEDULA', 'PASAPORTE'];
    expect(resolveDocumentTypes(undefined)).toEqual(def);
    expect(resolveDocumentTypes([])).toEqual(def);
    expect(resolveDocumentTypes('DNI')).toEqual(def);
    expect(resolveDocumentTypes([1, ''])).toEqual(def);
  });

  it('shows only the allowed types', () => {
    expect(resolveDocumentTypes(['CEDULA'])).toEqual(['CEDULA']);
    expect(formatDocumentTypes(['DNI'])).toBe('DNI');
    expect(formatDocumentTypes(['DNI', 'CEDULA', 'PASAPORTE'])).toBe('DNI, Cédula o Pasaporte');
    expect(formatDocumentTypes(['CEDULA', 'PASAPORTE'])).toBe('Cédula o Pasaporte');
    expect(formatDocumentTypes(['CC'])).toBe('Cédula de ciudadanía');
  });
});
