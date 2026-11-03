const mockGet = jest.fn();
const mockPost = jest.fn();
const mockPatch = jest.fn();
const mockDelete = jest.fn();

jest.mock('@/core/api/axiosinstance', () => ({
  __esModule: true,
  default: {
    get: (...a: any[]) => mockGet(...a),
    post: (...a: any[]) => mockPost(...a),
    patch: (...a: any[]) => mockPatch(...a),
    delete: (...a: any[]) => mockDelete(...a),
  },
}));

import {
  createWork,
  deleteWork,
  fetchServiceWorks,
  fetchWorksFeed,
  reportWork,
  updateWork,
} from '@/features/works/services/works.service';
import { flattenWorksPages, getNextWorksCursor } from '@/hooks/queries/useWorksQuery';
import { getWorkErrorMessage } from '@/features/works/utils/workErrors';
import { checkWorkImage } from '@/features/works/utils/workImage';
import { splitIntoColumns, workRatio } from '@/features/works/utils/masonry';

const apiError = (statusCode: number, code: string) => ({
  isAxiosError: true,
  message: code,
  response: { status: statusCode, data: { success: false, statusCode, code, message: code } },
});

let appendSpy: jest.SpyInstance;
const appended = () => appendSpy.mock.calls as any[][];

beforeEach(() => {
  jest.clearAllMocks();
  appendSpy = jest.spyOn(FormData.prototype, 'append');
});
afterEach(() => appendSpy.mockRestore());

describe('works service', () => {
  it('requests the feed with limit and no cursor on the first page', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [], nextCursor: null } });
    const page = await fetchWorksFeed({});
    expect(mockGet).toHaveBeenCalledWith('/posts/feed', { params: { limit: 20 } });
    expect(page).toEqual({ data: [], nextCursor: null });
  });

  it('sends the cursor and category on the next page', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [], nextCursor: 'c2' } });
    await fetchWorksFeed({ cursor: 'c1', categoryId: 'cat-1' });
    expect(mockGet.mock.calls[0][1].params).toEqual({ limit: 20, categoryId: 'cat-1', cursor: 'c1' });
  });

  it('reads the photos of a service from a list or a paginated envelope', async () => {
    mockGet.mockResolvedValueOnce({ data: [{ id: 'p1' }] });
    expect(await fetchServiceWorks('s1')).toEqual([{ id: 'p1' }]);
    expect(mockGet).toHaveBeenCalledWith('/services/s1/posts');
    mockGet.mockResolvedValueOnce({ data: { data: [{ id: 'p2' }] } });
    expect(await fetchServiceWorks('s1')).toEqual([{ id: 'p2' }]);
  });

  it('uploads multipart with the "image" field and the trimmed description', async () => {
    mockPost.mockResolvedValueOnce({ data: { id: 'p1' } });
    await createWork('s1', { file: { uri: 'file:///a.png', mimeType: 'image/png' }, description: '  Baño listo  ' });
    const [url, body, config] = mockPost.mock.calls[0];
    expect(url).toBe('/services/s1/posts');
    expect(config.headers['Content-Type']).toBe('multipart/form-data');
    const parts = appended();
    expect(parts[0][0]).toBe('image');
    expect(parts[0][1]).toMatchObject({ uri: 'file:///a.png', type: 'image/png', name: 'work.png' });
    expect(parts[1]).toEqual(['description', 'Baño listo']);
  });

  it('omits an empty description', async () => {
    mockPost.mockResolvedValueOnce({ data: { id: 'p1' } });
    await createWork('s1', { file: { uri: 'file:///a.jpg', mimeType: 'image/jpeg' }, description: '   ' });
    expect(appended().map((p) => p[0])).toEqual(['image']);
  });

  it('patches, deletes and reports a post', async () => {
    mockPatch.mockResolvedValueOnce({ data: { id: 'p1', description: 'x' } });
    await updateWork('p1', 'x');
    expect(mockPatch).toHaveBeenCalledWith('/posts/p1', { description: 'x' });

    mockDelete.mockResolvedValueOnce({ status: 204 });
    await deleteWork('p1');
    expect(mockDelete).toHaveBeenCalledWith('/posts/p1');

    mockPost.mockResolvedValueOnce({ status: 204 });
    await reportWork('p1', 'spam', 'details');
    expect(mockPost).toHaveBeenCalledWith('/posts/p1/report', { reason: 'spam', details: 'details' });
  });
});

describe('feed hook helpers', () => {
  it('uses nextCursor as the next page param and stops on null', () => {
    expect(getNextWorksCursor({ data: [], nextCursor: 'abc' })).toBe('abc');
    expect(getNextWorksCursor({ data: [], nextCursor: null })).toBeUndefined();
  });

  it('flattens pages without repeating ids', () => {
    const item = (id: string) => ({ id }) as any;
    const flat = flattenWorksPages([
      { data: [item('a'), item('b')], nextCursor: 'x' },
      { data: [item('b'), item('c')], nextCursor: null },
    ]);
    expect(flat.map((i) => i.id)).toEqual(['a', 'b', 'c']);
  });
});

describe('work errors', () => {
  it.each([
    [422, 'POST_LIMIT_REACHED', /máximo de 30/],
    [429, 'RATE_LIMITED', /muchas fotos/],
    [429, 'UPLOAD_BUSY', /procesando otra foto/],
    [400, 'INVALID_UPLOAD', /JPG, PNG o WebP/],
    [400, 'INVALID_MEDIA', /JPG, PNG o WebP/],
    [413, 'PAYLOAD_TOO_LARGE', /10 MB/],
    [403, 'FORBIDDEN', /propios servicios/],
  ])('maps %s %s to Spanish copy', (status, code, expected) => {
    expect(getWorkErrorMessage(apiError(status, code))).toMatch(expected);
  });

  it('never throws on unknown errors', () => {
    expect(typeof getWorkErrorMessage(new Error('boom'))).toBe('string');
    expect(typeof getWorkErrorMessage(null)).toBe('string');
  });
});

describe('image preflight', () => {
  it('accepts JPEG, PNG and WebP up to 10 MiB', () => {
    expect(checkWorkImage({ uri: 'file:///a.jpg', mimeType: 'image/jpg', fileSize: 1000 })).toEqual({
      ok: true,
      file: { uri: 'file:///a.jpg', mimeType: 'image/jpeg' },
    });
  });
  it('rejects HEIC and oversize files', () => {
    expect(checkWorkImage({ uri: 'file:///a.heic', mimeType: 'image/heic' }).ok).toBe(false);
    expect(checkWorkImage({ uri: 'file:///a.png', mimeType: 'image/png', fileSize: 10 * 1024 * 1024 + 1 }).ok).toBe(false);
  });
});

describe('masonry', () => {
  it('uses a fixed ratio without dimensions and clamps extremes', () => {
    expect(workRatio({ width: null, height: null })).toBeCloseTo(0.8);
    expect(workRatio({ width: 100, height: 1000 })).toBeCloseTo(0.6);
    expect(workRatio({ width: 1000, height: 1000 })).toBe(1);
  });
  it('puts the next item in the shortest column', () => {
    const tall = { id: 'tall', width: 1, height: 2 };
    const short = { id: 'short', width: 2, height: 1 };
    const cols = splitIntoColumns([tall, short, short, short]);
    expect(cols[0].map((i) => i.id)).toEqual(['tall']);
    expect(cols[1].map((i) => i.id)).toEqual(['short', 'short', 'short']);
  });
});
