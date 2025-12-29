export const API_BASE_URL = "http://localhost:4000"; // TODO: cambiar cuando haya backend real

export const ENDPOINTS = {
  categories: () => `${API_BASE_URL}/categories`,
  servicesByCategory: (categoryId: string) =>
    `${API_BASE_URL}/services?categoryId=${encodeURIComponent(categoryId)}`,
  providerById: (providerId: string) =>
    `${API_BASE_URL}/providers/${encodeURIComponent(providerId)}`,
  serviceReviews: (serviceId: string) =>
    `${API_BASE_URL}/services/${encodeURIComponent(serviceId)}/reviews`,
  addReview: (serviceId: string) =>
    `${API_BASE_URL}/services/${encodeURIComponent(serviceId)}/reviews`,
  userPurchases: (userId: string, serviceId?: string) =>
    `${API_BASE_URL}/users/${encodeURIComponent(userId)}/purchases${
      serviceId ? `?serviceId=${encodeURIComponent(serviceId)}` : ""
    }`,
} as const;
