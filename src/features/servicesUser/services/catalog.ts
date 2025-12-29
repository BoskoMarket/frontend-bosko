import type {
  AddReviewPayload,
  Category,
  ProviderProfile,
  Purchase,
  Review,
  ServiceSummary,
} from "@/types/services";
import api from "@/core/api/axiosinstance";

export type AddReviewRequest = AddReviewPayload & {
  userName?: string;
  userAvatar?: string;
};

export async function fetchCategoriesService(): Promise<Category[]> {
  const { data } = await api.get<Category[]>("/categories");
  return data;
}

export async function fetchServicesByCategoryService(
  categoryId: string
): Promise<ServiceSummary[]> {
  const { data } = await api.get<ServiceSummary[]>(`/services`, {
    params: { categoryId: categoryId },
  });
  return data;
}

export async function fetchProviderProfileService(
  providerId: string
): Promise<ProviderProfile> {
  const { data } = await api.get<ProviderProfile>(`/providers/${providerId}`);
  return data;
}

export async function fetchServiceReviewsService(serviceId: string): Promise<Review[]> {
  const { data } = await api.get<Review[]>(`/services/${serviceId}/reviews`);
  return data;
}

export async function addReviewService(
  payload: AddReviewRequest
): Promise<Review> {
  const { data } = await api.post<Review>(
    `/services/${payload.serviceId}/reviews`,
    payload
  );
  return data;
}

export async function fetchUserPurchasesService(
  userId: string,
  serviceId?: string
): Promise<Purchase[]> {
  const { data } = await api.get<Purchase[]>(
    `/users/${userId}/purchases`,
    { params: serviceId ? { serviceId } : undefined }
  );
  return data;
}

