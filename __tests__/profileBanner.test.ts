const mockPost = jest.fn();
const mockDelete = jest.fn();

jest.mock('@/core/api/axiosinstance', () => ({
  __esModule: true,
  default: {
    post: (...a: any[]) => mockPost(...a),
    delete: (...a: any[]) => mockDelete(...a),
  },
}));

import { uploadBanner, removeBanner } from '@/features/profile/services/profile';
import { getBannerErrorMessage } from '@/features/profile/utils/bannerErrors';

describe('banner service', () => {
  beforeEach(() => jest.clearAllMocks());

  it('posts the file to /users/me/banner in the "banner" multipart field', async () => {
    mockPost.mockResolvedValueOnce({ data: { bannerUrl: 'https://cdn.test/b.jpg' } });
    const res = await uploadBanner({ uri: 'file:///b.jpg', mimeType: 'image/jpeg' });
    expect(res).toEqual({ bannerUrl: 'https://cdn.test/b.jpg' });
    const [url, body, config] = mockPost.mock.calls[0];
    expect(url).toBe('/users/me/banner');
    expect(config.headers['Content-Type']).toBe('multipart/form-data');
    const parts = (body as any)._parts ?? [];
    if (parts.length) expect(parts[0][0]).toBe('banner');
  });

  it.each([
    ['image/png', 'banner.png'],
    ['image/webp', 'banner.webp'],
  ] as const)('preserves %s when uploading', async (mimeType, name) => {
    mockPost.mockResolvedValueOnce({ data: { bannerUrl: 'https://cdn.test/banner.jpg' } });
    await uploadBanner({ uri: 'file:///picture', mimeType });
    const parts = (mockPost.mock.calls[0][1] as any)._parts ?? [];
    if (parts.length) expect(parts[0][1]).toMatchObject({ type: mimeType, name });
  });

  it('removes the banner with DELETE /users/me/banner', async () => {
    mockDelete.mockResolvedValueOnce({ data: { bannerUrl: null }, status: 200 });
    await expect(removeBanner()).resolves.toEqual({ bannerUrl: null });
    expect(mockDelete).toHaveBeenCalledWith('/users/me/banner');
  });

  it.each([[undefined], [null], ['']])('returns bannerUrl null when the body is empty (%p)', async (body) => {
    mockDelete.mockResolvedValueOnce({ data: body, status: 204 });
    await expect(removeBanner()).resolves.toEqual({ bannerUrl: null });
  });
});

describe('getBannerErrorMessage', () => {
  const err = (status: number) => ({ response: { status } });

  it.each([404, 405, 501])('maps %s to a retry message', (s) => {
    expect(getBannerErrorMessage(err(s))).toMatch(/Intentá de nuevo/);
  });
  it('maps 413 to a size message', () => {
    expect(getBannerErrorMessage(err(413))).toMatch(/5 MB/);
  });
  it.each([400, 415])('maps %s to a format message', (s) => {
    expect(getBannerErrorMessage(err(s))).toMatch(/Formato no válido/);
  });
  it('never throws on unknown errors', () => {
    expect(typeof getBannerErrorMessage(undefined)).toBe('string');
    expect(typeof getBannerErrorMessage(new Error('x'))).toBe('string');
  });
});
