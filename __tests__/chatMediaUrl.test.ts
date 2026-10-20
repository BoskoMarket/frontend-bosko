import { isVideoUrl } from '@/features/chat/utils/mediaUrl';

describe('isVideoUrl', () => {
  it('detects a plain video URL', () => {
    expect(isVideoUrl('https://storage.boskoapp.site/chat/clip.mp4')).toBe(true);
  });

  it('detects a signed video URL with a query string', () => {
    expect(
      isVideoUrl('https://storage.boskoapp.site/chat/clip.MOV?X-Amz-Algorithm=AWS4&X-Amz-Signature=abc123'),
    ).toBe(true);
  });

  it('ignores the extension inside the query string', () => {
    expect(isVideoUrl('https://storage.boskoapp.site/chat/photo.jpg?name=clip.mp4')).toBe(false);
  });

  it('returns false for images and empty values', () => {
    expect(isVideoUrl('https://storage.boskoapp.site/chat/photo.jpg?sig=1')).toBe(false);
    expect(isVideoUrl(undefined)).toBe(false);
    expect(isVideoUrl('')).toBe(false);
  });
});
