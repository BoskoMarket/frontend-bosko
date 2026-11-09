import api from '@/core/api/axiosinstance';
import { readPaginatedCollection, type PaginatedCollection } from '@/core/api/collections';
import { mapService } from '@/features/servicesUser/services/catalog';
import type { ServiceSummary } from '@/types/services';

/** GET /favorites?page&limit: the account's favorite services, newest first. */
export async function fetchFavorites(page = 1, limit = 20): Promise<PaginatedCollection<ServiceSummary>> {
  const { data } = await api.get<unknown>('/favorites', { params: { page, limit } });
  const result = readPaginatedCollection<unknown>(data);
  return { ...result, data: result.data.map(mapService) };
}

/** PUT /favorites/:serviceId (204, idempotent). 404 SERVICE_NOT_FOUND when the service is gone. */
export async function addFavorite(serviceId: string): Promise<void> {
  await api.put(`/favorites/${encodeURIComponent(serviceId)}`);
}

/** DELETE /favorites/:serviceId (204, idempotent). */
export async function removeFavorite(serviceId: string): Promise<void> {
  await api.delete(`/favorites/${encodeURIComponent(serviceId)}`);
}
