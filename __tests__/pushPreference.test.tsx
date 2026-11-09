import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockDeleteToken = jest.fn();
const mockRegister = jest.fn();
const mockSave = jest.fn();

jest.mock('@/features/auth/state/AuthContext', () => ({
  useAuth: () => ({ authState: { user: { id: 'u1' }, userEmail: 'a@b.c' }, isAuthenticated: true }),
}));
jest.mock('@/features/notifications/services/push-preferences', () => ({
  readPushPreference: jest.fn().mockResolvedValue(true),
  savePushPreference: (...a: unknown[]) => mockSave(...a),
  registerDeviceForPush: (...a: unknown[]) => mockRegister(...a),
}));
jest.mock('@/features/notifications/services/notifications.service', () => ({
  deletePushToken: (...a: unknown[]) => mockDeleteToken(...a),
}));

import { usePushPreference } from '@/hooks/queries/usePushPreference';

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
};

describe('usePushPreference', () => {
  beforeEach(() => jest.clearAllMocks());

  it('disabling deletes the push token and never registers the device', async () => {
    const { result } = renderHook(() => usePushPreference(), { wrapper });
    await act(async () => {
      await result.current.mutation.mutateAsync(false);
    });
    expect(mockDeleteToken).toHaveBeenCalledTimes(1);
    expect(mockRegister).not.toHaveBeenCalled();
    expect(mockSave).toHaveBeenCalledWith('u1', false);
  });

  it('enabling registers the device again and never deletes the token', async () => {
    const { result } = renderHook(() => usePushPreference(), { wrapper });
    await act(async () => {
      await result.current.mutation.mutateAsync(true);
    });
    await waitFor(() => expect(mockRegister).toHaveBeenCalledTimes(1));
    expect(mockDeleteToken).not.toHaveBeenCalled();
    expect(mockSave).toHaveBeenCalledWith('u1', true);
  });
});
