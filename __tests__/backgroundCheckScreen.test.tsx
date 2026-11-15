import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

const mockGetStatus = jest.fn();

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('expo-router', () => ({ router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() } }));
jest.mock('expo-document-picker', () => ({ getDocumentAsync: jest.fn() }));
jest.mock('expo-image-picker', () => ({}));
jest.mock('@/hooks/useRequireProviderStatus', () => ({ useRequireProviderStatus: jest.fn() }));
jest.mock('@/components/AnimatedBackground', () => ({ AnimatedBackground: () => null }));
jest.mock('@/features/kyc/services/background-check.service', () => ({
  getBackgroundCheckStatus: (...a: unknown[]) => mockGetStatus(...a),
  uploadBackgroundCheck: jest.fn(),
}));

import BackgroundCheckScreen from '@/features/kyc/screens/BackgroundCheckScreen';

const serverError = { isAxiosError: true, message: 'x', response: { status: 500, data: {}, headers: {} } };

describe('BackgroundCheckScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows an error state with retry instead of a faked status, and no upload button', async () => {
    mockGetStatus.mockRejectedValueOnce(serverError);
    const { findByText, queryByText } = render(<BackgroundCheckScreen />);
    expect(await findByText('No pudimos cargar tu estado')).toBeTruthy();
    expect(queryByText('Subir certificado')).toBeNull();
  });

  it('retry reloads the status and shows the upload path once known', async () => {
    mockGetStatus.mockRejectedValueOnce(serverError).mockResolvedValueOnce({ status: 'NOT_SUBMITTED' });
    const { findByText } = render(<BackgroundCheckScreen />);
    fireEvent.press(await findByText('Reintentar'));
    await waitFor(async () => expect(await findByText('Subir certificado')).toBeTruthy());
    expect(mockGetStatus).toHaveBeenCalledTimes(2);
  });
});
