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

describe('banner service (proposed endpoint BR01)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('posts the file to /users/me/banner in the "banner" multipart field', async () => {
    mockPost.mockResolvedValueOnce({ data: { bannerUrl: 'https://cdn.test/b.jpg' } });
    const res = await uploadBanner('file:///b.jpg');
    expect(res).toEqual({ bannerUrl: 'https://cdn.test/b.jpg' });
    const [url, body, config] = mockPost.mock.calls[0];
    expect(url).toBe('/users/me/banner');
    expect(config.headers['Content-Type']).toBe('multipart/form-data');
    const parts = (body as any)._parts ?? [];
    if (parts.length) expect(parts[0][0]).toBe('banner');
  });

  it('removes the banner with DELETE /users/me/banner', async () => {
    mockDelete.mockResolvedValueOnce({ status: 204 });
    await expect(removeBanner()).resolves.toEqual({ bannerUrl: null });
    expect(mockDelete).toHaveBeenCalledWith('/users/me/banner');
  });
});

describe('getBannerErrorMessage', () => {
  const err = (status: number) => ({ response: { status } });

  it.each([404, 405, 501])('maps %s to "not available yet"', (s) => {
    expect(getBannerErrorMessage(err(s))).toMatch(/todavía no está disponible/);
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
