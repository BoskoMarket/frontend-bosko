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

export function nextCollectionPage<T>(page: PaginatedCollection<T>): number | undefined {
  return page.page * page.limit < page.total ? page.page + 1 : undefined;
}
