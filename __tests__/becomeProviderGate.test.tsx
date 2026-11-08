import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

const mockPush = jest.fn();
const mockReplace = jest.fn();
let mockStatus: any;

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('expo-router', () => ({
  router: { push: (...a: unknown[]) => mockPush(...a), replace: (...a: unknown[]) => mockReplace(...a), back: jest.fn() },
}));
jest.mock('@/hooks/useProviderStatus', () => ({ useProviderStatus: () => mockStatus }));
jest.mock('@/features/kyc/state/KYCContext', () => ({
  useKYC: () => ({ refresh: jest.fn(), verification: { attemptCount: 0, maxAttempts: 3 } }),
}));
jest.mock('@/components/AnimatedBackground', () => ({ AnimatedBackground: () => null }));

import { BecomeProviderScreen } from '@/features/kyc/screens/BecomeProviderScreen';
import { useRequireProviderStatus } from '@/hooks/useRequireProviderStatus';

const base = {
  status: 'pending',
  kycStatus: 'pending',
  kycApproved: false,
  phoneVerified: false,
  canPublish: false,
  nextStep: 'kyc',
  isLoading: false,
};

function Gate({ min, requirePublish }: { min: 'client' | 'pending' | 'provider'; requirePublish?: boolean }) {
  useRequireProviderStatus(min, { requirePublish });
  return null;
}

beforeEach(() => {
  mockPush.mockClear();
  mockReplace.mockClear();
});

describe('BecomeProviderScreen checklist', () => {
  it('shows the three steps and the identity CTA first', () => {
    mockStatus = { ...base, status: 'client', kycStatus: 'not_started' };
    const { getByText } = render(<BecomeProviderScreen />);
    expect(getByText('1. Identidad')).toBeTruthy();
    expect(getByText('2. Teléfono')).toBeTruthy();
    expect(getByText('3. Tu servicio')).toBeTruthy();
    fireEvent.press(getByText('Iniciar verificación'));
    expect(mockPush).toHaveBeenCalledWith('/(tabs)/profile/kyc');
  });

  it('points to the phone step once KYC is approved', () => {
    mockStatus = { ...base, status: 'provider', kycStatus: 'approved', kycApproved: true, nextStep: 'phone' };
    const { getByText } = render(<BecomeProviderScreen />);
    fireEvent.press(getByText('Verificar teléfono'));
    expect(mockPush).toHaveBeenCalledWith('/(tabs)/profile/verify-phone');
  });

  it('offers the service form when it can publish', () => {
    mockStatus = {
      ...base, status: 'provider', kycStatus: 'approved', kycApproved: true, phoneVerified: true, canPublish: true, nextStep: 'service',
    };
    const { getByText } = render(<BecomeProviderScreen />);
    fireEvent.press(getByText('Crear servicio'));
    expect(mockPush).toHaveBeenCalledWith('/service-form');
  });
});

describe('useRequireProviderStatus gate', () => {
  it('redirects a provider without a verified phone to verify-phone when publishing', () => {
    mockStatus = { ...base, status: 'provider', kycApproved: true, nextStep: 'phone' };
    render(<Gate min="provider" requirePublish />);
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/profile/verify-phone');
  });

  it('redirects an unapproved KYC to the checklist when publishing', () => {
    mockStatus = { ...base, status: 'pending', nextStep: 'kyc' };
    render(<Gate min="pending" requirePublish />);
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/profile/become-provider');
  });

  it('keeps the old redirect for plain clients', () => {
    mockStatus = { ...base, status: 'client', kycStatus: 'not_started', nextStep: 'kyc' };
    render(<Gate min="provider" />);
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/profile/become-provider');
  });

  it('does nothing while loading or when allowed', () => {
    mockStatus = { ...base, isLoading: true, status: 'client' };
    render(<Gate min="provider" requirePublish />);
    mockStatus = { ...base, status: 'provider', canPublish: true, nextStep: 'service' };
    render(<Gate min="provider" requirePublish />);
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
