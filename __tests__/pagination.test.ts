import { nextCollectionPage, readPaginatedCollection } from '@/core/api/collections';

describe('paginated collections', () => {
  it('keeps metadata and requests the next page when the total exceeds the current range', () => {
    const page = readPaginatedCollection<number>({ data: [1, 2], total: 5, page: 1, limit: 2 });
    expect(page).toEqual({ data: [1, 2], total: 5, page: 1, limit: 2 });
    expect(nextCollectionPage(page)).toBe(2);
    expect(nextCollectionPage({ ...page, data: [5], page: 3 })).toBeUndefined();
  });

  it('rejects an array or a page without metadata instead of hiding later pages', () => {
    expect(() => readPaginatedCollection([])).toThrow();
    expect(() => readPaginatedCollection({ data: [1] })).toThrow();
  });
});
