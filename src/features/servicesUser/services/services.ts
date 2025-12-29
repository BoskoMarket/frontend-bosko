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
  const { data } = await api.get<Service[]>("/services", { params });
  return data;
}

/**
 * fetchServiceById
 *
 * GET `/services/{id}`
 *
 * Retrieve detailed information about a single service by its ID.
 */
export async function fetchServiceById(id: string): Promise<Service> {
  const { data } = await api.get<Service>(`/services/${id}`);
  return data;
}
