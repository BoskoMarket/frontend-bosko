import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { useThemeStore } from '@/stores/theme.store';

const mockPost = jest.fn();
const mockCreateReel = jest.fn();
const mockPicker = {
  perm: jest.fn(),
  library: jest.fn(),
  camera: jest.fn(),
};

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() } }));
jest.mock('@/core/navigation/safeBack', () => ({ safeBack: jest.fn() }));
jest.mock('@/hooks/useRequireProviderStatus', () => ({ useRequireProviderStatus: jest.fn() }));
jest.mock('expo-video', () => ({
  VideoView: () => null,
  useVideoPlayer: () => ({}),
}));
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: (...a: any[]) => mockPicker.perm(...a),
  requestCameraPermissionsAsync: (...a: any[]) => mockPicker.perm(...a),
  launchImageLibraryAsync: (...a: any[]) => mockPicker.library(...a),
  launchCameraAsync: (...a: any[]) => mockPicker.camera(...a),
}));
jest.mock('@/core/api/axiosinstance', () => ({
  __esModule: true,
  default: { post: (...a: any[]) => mockPost(...a), get: jest.fn() },
}));
jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: jest.fn().mockResolvedValue(undefined) }),
}));

import ReelUploadScreen from '@/features/reels/screens/ReelUploadScreen';
import * as service from '@/features/reels/services/reels.service';
import { validateReelVideo } from '@/features/reels/constants/reelUploadRules';

const setMode = (mode: 'dark' | 'light') => act(() => { useThemeStore.getState().setMode(mode); });
const MB = 1024 * 1024;

describe('validateReelVideo', () => {
  it('accepts a 60 s, 100 MB video', () => {
    expect(validateReelVideo({ uri: 'f', duration: 60_000, fileSize: 100 * MB })).toBeNull();
  });
  it('rejects 61 s', () => {
    expect(validateReelVideo({ uri: 'f', duration: 61_000 })).toMatch(/60 segundos/);
  });
  it('rejects more than 100 MB', () => {
    expect(validateReelVideo({ uri: 'f', fileSize: 100 * MB + 1 })).toMatch(/100 MB/);
  });
  it('lets unknown size/duration through (backend validates)', () => {
    expect(validateReelVideo({ uri: 'f' })).toBeNull();
  });
});

describe('reels upload service', () => {
  beforeEach(() => mockPost.mockReset());

  it('posts multipart to /reels/upload with field "video" and reports progress', async () => {
    mockPost.mockImplementation(async (_url, _body, cfg) => {
      cfg.onUploadProgress({ loaded: 50, total: 100 });
      return { data: { videoUrl: 'https://cdn/x.mp4', duration: 12 } };
    });
    const appendSpy = jest.spyOn(FormData.prototype, 'append');
    const onProgress = jest.fn();
    const signal = new AbortController().signal;
    const res = await service.uploadReelVideo({ uri: 'file:///v.mov', mimeType: 'video/quicktime' }, { onProgress, signal });
    expect(res.videoUrl).toBe('https://cdn/x.mp4');
    const [url, body, cfg] = mockPost.mock.calls[0];
    expect(url).toBe('/reels/upload');
    expect(body).toBeInstanceOf(FormData);
    expect(cfg.signal).toBe(signal);
    expect(appendSpy).toHaveBeenCalledWith('video', expect.objectContaining({ uri: 'file:///v.mov', type: 'video/quicktime' }));
    appendSpy.mockRestore();
    expect(onProgress).toHaveBeenCalledWith(0.5);
  });

  it('classifies errors', () => {
    const http = (status: number) => ({ response: { status } });
    expect(service.classifyReelUploadError(http(404))).toBe('unavailable');
    expect(service.classifyReelUploadError(http(405))).toBe('unavailable');
    expect(service.classifyReelUploadError(http(501))).toBe('unavailable');
    expect(service.classifyReelUploadError(http(413))).toBe('tooLarge');
    expect(service.classifyReelUploadError(http(415))).toBe('format');
    expect(service.classifyReelUploadError(http(400))).toBe('format');
    expect(service.classifyReelUploadError({ code: 'ERR_NETWORK' })).toBe('network');
    expect(service.classifyReelUploadError({ code: 'ERR_CANCELED' })).toBe('cancelled');
    expect(service.REEL_UPLOAD_ERROR_MESSAGES.unavailable).toBe('La subida de videos todavía no está disponible.');
  });
});

describe('ReelUploadScreen', () => {
  beforeEach(() => {
    mockPost.mockReset();
    mockCreateReel.mockReset();
    mockPicker.perm.mockResolvedValue({ status: 'granted' });
    mockPicker.library.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///v.mp4', duration: 10_000, fileSize: 5 * MB, mimeType: 'video/mp4' }],
    });
  });

  it.each(['dark', 'light'] as const)('renders gallery and camera buttons in %s', (mode) => {
    setMode(mode);
    const { getByText, getByLabelText } = render(<ReelUploadScreen />);
    expect(getByText('Elegir de la galería')).toBeTruthy();
    expect(getByText('Grabar video')).toBeTruthy();
    expect(getByLabelText('Descripción')).toBeTruthy();
  });

  it('rejects a too-long video and keeps publish disabled', async () => {
    setMode('dark');
    mockPicker.library.mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///v.mp4', duration: 61_000 }] });
    const { getByText, queryByLabelText } = render(<ReelUploadScreen />);
    await act(async () => { fireEvent.press(getByText('Elegir de la galería')); });
    expect(queryByLabelText('Vista previa del video')).toBeNull();
    expect(getByText('Publicar reel').props.accessibilityState?.disabled ?? true).toBeTruthy();
  });

  it('disables publish while uploading, shows progress and allows cancel', async () => {
    setMode('dark');
    let release: () => void = () => {};
    mockPost.mockImplementation((_u, _b, cfg) => new Promise((_res, rej) => {
      cfg.onUploadProgress({ loaded: 30, total: 100 });
      release = () => rej({ code: 'ERR_CANCELED' });
      cfg.signal.addEventListener('abort', release);
    }));
    const { getByText, queryByText, findByText, getByLabelText } = render(<ReelUploadScreen />);
    await act(async () => { fireEvent.press(getByText('Elegir de la galería')); });
    await waitFor(() => expect(getByLabelText('Vista previa del video')).toBeTruthy());
    await act(async () => { fireEvent.press(getByText('Publicar reel')); });
    expect(await findByText('Subiendo video… 30%')).toBeTruthy();
    expect(getByLabelText('Progreso de la subida')).toBeTruthy();
    // publish button is in loading state (label hidden, not pressable) and only one upload started
    expect(queryByText('Publicar reel')).toBeNull();
    expect(mockPost).toHaveBeenCalledTimes(1);
    await act(async () => { fireEvent.press(getByText('Cancelar subida')); });
    await waitFor(() => expect(getByText('Publicar reel')).toBeTruthy());
  });

  it('shows the "not available yet" message on 404', async () => {
    setMode('light');
    mockPost.mockRejectedValue({ response: { status: 404 } });
    const { getByText, findByText } = render(<ReelUploadScreen />);
    await act(async () => { fireEvent.press(getByText('Elegir de la galería')); });
    await act(async () => { fireEvent.press(getByText('Publicar reel')); });
    expect(await findByText('La subida de videos todavía no está disponible.')).toBeTruthy();
  });
});
