import type {
  Category,
  Provider,
  Purchase,
  Review,
  Service,
} from "@/types/services";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const API_BASE_URL = "http://localhost:4000"; // TODO: cambiar cuando haya backend real

export const ENDPOINTS = {
  categories: () => `${API_BASE_URL}/categories`,
  servicesByCategory: (categoryId: string) =>
    `${API_BASE_URL}/services?categoryId=${categoryId}`,
  providerById: (providerId: string) => `${API_BASE_URL}/providers/${providerId}`,
  serviceReviews: (serviceId: string) =>
    `${API_BASE_URL}/services/${serviceId}/reviews`,
  addReview: (serviceId: string) =>
    `${API_BASE_URL}/services/${serviceId}/reviews`,
  userPurchases: (userId: string, serviceId?: string) =>
    `${API_BASE_URL}/users/${userId}/purchases${
      serviceId ? `?serviceId=${serviceId}` : ""
    }`,
} as const;

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    let payload: unknown;
    try {
      payload = await response.json();
    } catch (error) {
      payload = undefined;
    }

    const message =
      (typeof payload === "object" && payload && "message" in payload
        ? (payload as Record<string, unknown>).message
        : undefined) ||
      response.statusText ||
      "Request failed";

    throw new ApiError(String(message), response.status, payload);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function apiGet<T>(endpoint: string): Promise<T> {
  return request<T>(endpoint, { method: "GET" });
}

export async function apiPost<T, U>(endpoint: string, payload: U): Promise<T> {
  return request<T>(endpoint, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export const fetchCategories = () => apiGet<Category[]>(ENDPOINTS.categories());

export const fetchServicesByCategory = (categoryId: string) =>
  apiGet<Service[]>(ENDPOINTS.servicesByCategory(categoryId));

export const fetchProviderById = (providerId: string) =>
  apiGet<Provider>(ENDPOINTS.providerById(providerId));

export const fetchServiceReviews = (serviceId: string) =>
  apiGet<Review[]>(ENDPOINTS.serviceReviews(serviceId));

export const createServiceReview = (
  serviceId: string,
  payload: Pick<Review, "rating" | "comment" | "userId"> & { userName?: string }
) => apiPost<Review, typeof payload>(ENDPOINTS.addReview(serviceId), payload);

export const fetchUserPurchases = (userId: string, serviceId?: string) =>
  apiGet<Purchase[]>(ENDPOINTS.userPurchases(userId, serviceId));

