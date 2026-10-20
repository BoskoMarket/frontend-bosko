import { extensionForMime, resolveImageMime } from '@/core/media/imageMime';

describe('resolveImageMime', () => {
  it('normalizes image/jpg to image/jpeg', () => {
    expect(resolveImageMime({ uri: 'file:///a', mimeType: 'image/jpg' })).toBe('image/jpeg');
  });
  it('keeps canonical MIME types', () => {
    expect(resolveImageMime({ uri: 'file:///a', mimeType: 'image/webp' })).toBe('image/webp');
  });
  it.each([
    ['file:///a.PNG?x=1', 'image/png'],
    ['file:///a.jpeg', 'image/jpeg'],
    ['file:///a.webp', 'image/webp'],
    ['file:///a.heic', 'image/heic'],
    ['file:///a.heif', 'image/heif'],
  ])('falls back to the extension for %s', (uri, mime) => {
    expect(resolveImageMime({ uri })).toBe(mime);
  });
  it('prefers fileName and returns undefined when unknown', () => {
    expect(resolveImageMime({ uri: 'file:///x', fileName: 'p.png' })).toBe('image/png');
    expect(resolveImageMime({ uri: 'file:///x.bmp' })).toBeUndefined();
  });
});

describe('extensionForMime', () => {
  it('maps MIME types to extensions', () => {
    expect(extensionForMime('image/jpeg')).toBe('jpg');
    expect(extensionForMime('image/png')).toBe('png');
    expect(extensionForMime('image/webp')).toBe('webp');
    expect(extensionForMime('image/unknown')).toBe('jpg');
  });
});
