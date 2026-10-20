import { readCollection } from '@/core/api/collections';
/**
 * Service related API calls.
 *
 * The service endpoints represent jobs or offerings created by
 * professionals. Functions in this module allow the client to
 * fetch available services to show in explore feeds or detail
 * pages. Mutations related to the authenticated user live in
 * `services/service` so we avoid mixing concerns.
 */

import api from "@/core/api/axiosinstance";
import { Service } from "./service";
import type { ServiceSummary } from "@/types/services";
import { mapService } from "./catalog";

/**
 * fetchAllServices
 *
 * GET `/services`
 *
 * Retrieves a list of all services available on the platform. This
 * endpoint may optionally accept query parameters for filtering by
 * category, location, or keywords. Adjust the signature as needed
 * when you know the exact shape of the Swagger definition.
 */
export async function fetchAllServices(
  params?: Record<string, any>
): Promise<Service[]> {
  const { data } = await api.get<any>("/services", { params });
  return readCollection(data);
}

/**
 * fetchServiceById
 *
 * GET `/services/{id}`
 *
 * Retrieve detailed information about a single service by its ID.
 */
export async function fetchServiceById(id: string): Promise<Service> {
  const { data } = await api.get<any>(`/services/${id}`);
  const s = data?.data ?? data;
  return {
    ...s,
    price: s.price != null && typeof s.price === 'object' ? (s.price.amount ?? null) : s.price,
    image: s.images?.[0] ?? s.image ?? null,
  };
}

export async function fetchFeaturedServices(): Promise<ServiceSummary[]> {
  const { data } = await api.get<any>('/services/featured');
  return readCollection<any>(data).map(mapService);
}
