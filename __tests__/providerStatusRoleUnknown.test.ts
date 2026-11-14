import { renderHook } from '@testing-library/react-native';

import { useProviderStatus } from '@/hooks/useProviderStatus';

let mockProfile: { isProvider: boolean } | null = null;
let mockKyc = { verification: null as null | { status: string }, loading: false, loadFailed: false, refresh: jest.fn() };

jest.mock('@/features/profile/state/ProfileContext', () => ({
  useProfile: () => ({ profile: mockProfile, isLoading: false }),
}));
jest.mock('@/features/kyc/state/KYCContext', () => ({ useKYC: () => mockKyc }));

describe('useProviderStatus.isRoleUnknown', () => {
  beforeEach(() => {
    mockProfile = { isProvider: false };
    mockKyc = { verification: null, loading: false, loadFailed: false, refresh: jest.fn() };
  });

  it('is unknown when KYC failed to load for a non-provider', () => {
    mockKyc.loadFailed = true;
    expect(renderHook(() => useProviderStatus()).result.current.isRoleUnknown).toBe(true);
  });

  it('stays known for a provider even if KYC failed to load', () => {
    mockProfile = { isProvider: true };
    mockKyc.loadFailed = true;
    expect(renderHook(() => useProviderStatus()).result.current.isRoleUnknown).toBe(false);
  });

  it('is known when KYC loaded', () => {
    expect(renderHook(() => useProviderStatus()).result.current.isRoleUnknown).toBe(false);
  });
});
