/** El interceptor ya retiró el envelope. Aquí solo se normaliza la paginación. */
export function readCollection<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object' && 'data' in data && Array.isArray(data.data)) return data.data as T[];
  throw new Error('El servidor devolvió una lista con un formato inesperado.');
}

export interface PaginatedCollection<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

/** The axios interceptor removes the outer envelope, not the pagination metadata. */
export function readPaginatedCollection<T>(value: unknown): PaginatedCollection<T> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('El servidor devolvió una página con un formato inesperado.');
  }
  const page = value as Partial<PaginatedCollection<T>>;
  if (!Array.isArray(page.data) || !Number.isFinite(page.total) ||
      !Number.isInteger(page.page) || !Number.isInteger(page.limit) ||
      page.page! < 1 || page.limit! < 1) {
    throw new Error('El servidor devolvió una página con un formato inesperado.');
  }
  return page as PaginatedCollection<T>;
}

export interface CursorCollection<T> {
  data: T[];
  nextCursor: string | null;
}

/** Strict reader for cursor pages: a missing list or a non-string cursor is a malformed response. */
export function readCursorCollection<T>(value: unknown): CursorCollection<T> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('El servidor devolvió una página con un formato inesperado.');
  }
  const page = value as { data?: unknown; nextCursor?: unknown };
  const cursor = page.nextCursor ?? null;
  if (!Array.isArray(page.data) || (cursor !== null && typeof cursor !== 'string')) {
    throw new Error('El servidor devolvió una página con un formato inesperado.');
  }
  return { data: page.data as T[], nextCursor: cursor };
}

/**
 * Flattens pages of a newest-first list. A new item can push an earlier one onto the next
 * page, so the same id may show up twice; the first occurrence wins.
 */
export function flattenUniqueById<T extends { id: string }>(pages: ReadonlyArray<{ data: readonly T[] }>): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const page of pages) {
    for (const item of page.data) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      out.push(item);
    }
  }
  return out;
}

export function nextCollectionPage<T>(page: PaginatedCollection<T>): number | undefined {
  return page.page * page.limit < page.total ? page.page + 1 : undefined;
}
