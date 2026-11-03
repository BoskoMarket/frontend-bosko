import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

const mockCreate = jest.fn();
const mockPickerLaunch = jest.fn();
let mockPhotos: Record<string, any[]> = {};
const SERVICES = [
  { id: 's1', title: 'Plomería' },
  { id: 's2', title: 'Gasista' },
];
let mockServices = SERVICES;

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true },
}));
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: () => Promise.resolve({ status: 'granted' }),
  launchImageLibraryAsync: (...a: unknown[]) => mockPickerLaunch(...a),
  UIImagePickerPreferredAssetRepresentationMode: { Compatible: 'compatible' },
}));
jest.mock('@/hooks/useRequireProviderStatus', () => ({ useRequireProviderStatus: jest.fn() }));
jest.mock('@/hooks/queries/useMarketplaceQuery', () => ({
  useMyServices: () => ({
    data: { pages: [{ data: mockServices, total: mockServices.length, page: 1, limit: 20 }] },
    isPending: false,
    isError: false,
    refetch: jest.fn(),
  }),
}));
jest.mock('@/hooks/queries/useWorksQuery', () => ({
  useServicesWorks: (ids: string[]) => ids.map((id) => ({ data: mockPhotos[id] ?? [], isPending: false })),
  useCreateWork: () => ({ mutateAsync: (...a: unknown[]) => mockCreate(...a), isPending: false }),
  useUpdateWork: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useDeleteWork: () => ({ mutateAsync: jest.fn(), isPending: false }),
}));

import { toast } from '@/core/design-system';
import MyWorksScreen from '@/features/works/screens/MyWorksScreen';

const photos = (n: number, prefix = "p") =>
  Array.from({ length: n }, (_, i) => ({
    id: `${prefix}${i}`,
    imageUrl: 'https://cdn.test/p.jpg',
    thumbnailUrl: null,
    width: null,
    height: null,
    description: null,
    createdAt: '2026-11-03T12:00:00.000Z',
    likes: 0,
  }));

const apiError = (statusCode: number, code: string) => ({
  isAxiosError: true,
  message: code,
  response: { status: statusCode, data: { success: false, statusCode, code, message: code } },
});

let errorSpy: jest.SpyInstance;

beforeEach(() => {
  jest.clearAllMocks();
  mockPhotos = {};
  mockServices = SERVICES;
  errorSpy = jest.spyOn(toast, 'error').mockImplementation(() => undefined as any);
  jest.spyOn(toast, 'success').mockImplementation(() => undefined as any);
  mockPickerLaunch.mockResolvedValue({
    canceled: false,
    assets: [{ uri: 'file:///a.jpg', mimeType: 'image/jpeg', fileSize: 1000 }],
  });
});

describe('MyWorksScreen', () => {
  it('shows x/30 for the selected service and disables upload at the limit', async () => {
    mockPhotos = { s1: photos(30, "a"), s2: photos(2, "b") };
    const { getByText, queryByText } = render(<MyWorksScreen />);
    fireEvent.press(getByText('Plomería'));
    expect(getByText('30/30 fotos')).toBeTruthy();
    await act(async () => {
      fireEvent.press(getByText('Subir foto'));
    });
    expect(mockPickerLaunch).not.toHaveBeenCalled();

    fireEvent.press(getByText('Gasista'));
    expect(getByText('2/30 fotos')).toBeTruthy();
    expect(queryByText('30/30 fotos')).toBeNull();
  });

  it('asks which service when several and none is selected', async () => {
    const { getByText, findByText } = render(<MyWorksScreen />);
    await act(async () => {
      fireEvent.press(getByText('Subir foto'));
    });
    expect(await findByText('¿En qué servicio la subís?')).toBeTruthy();
  });

  it('rejects unsupported formats before uploading', async () => {
    mockPickerLaunch.mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///a.heic', mimeType: 'image/heic' }] });
    const { getByText } = render(<MyWorksScreen />);
    fireEvent.press(getByText('Plomería'));
    await act(async () => {
      fireEvent.press(getByText('Subir foto'));
    });
    expect(errorSpy).toHaveBeenCalledWith('Formato no válido', expect.any(String));
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('maps a 422 POST_LIMIT_REACHED from the server to a clear toast', async () => {
    mockCreate.mockRejectedValueOnce(apiError(422, 'POST_LIMIT_REACHED'));
    const { getByText, findByText } = render(<MyWorksScreen />);
    fireEvent.press(getByText('Plomería'));
    await act(async () => {
      fireEvent.press(getByText('Subir foto'));
    });
    fireEvent.press(await findByText('Publicar'));
    await waitFor(() =>
      expect(errorSpy).toHaveBeenCalledWith('No se pudo subir la foto', expect.stringMatching(/máximo de 30 fotos/)),
    );
    expect(mockCreate).toHaveBeenCalledWith({
      serviceId: 's1',
      file: { uri: 'file:///a.jpg', mimeType: 'image/jpeg' },
      description: '',
    });
  });

  it('invites to publish a service when the provider has none', () => {
    mockServices = [];
    const { getByText } = render(<MyWorksScreen />);
    expect(getByText('Primero publicá un servicio')).toBeTruthy();
  });
});
