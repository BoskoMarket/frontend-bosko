import api from "@/axiosinstance";
import type {
  AddReviewPayload,
  Category,
  ProviderProfile,
  Purchase,
  Review,
  ServiceSummary,
} from "@/types/services";

export type AddReviewRequest = AddReviewPayload & {
  userName?: string;
  userAvatar?: string;
};

export async function fetchCategories(): Promise<Category[]> {
  const { data } = await api.get<Category[]>("/categories");
  return data;
}

export async function fetchServicesByCategory(
  categoryId: string
): Promise<ServiceSummary[]> {
  const { data } = await api.get<ServiceSummary[]>(`/services`, {
    params: { categoryId: categoryId },
  });
  return data;
}

export async function fetchProviderProfile(
  providerId: string
): Promise<ProviderProfile> {
  const { data } = await api.get<ProviderProfile>(`/providers/${providerId}`);
  return data;
}

export async function fetchServiceReviews(serviceId: string): Promise<Review[]> {
  const { data } = await api.get<Review[]>(`/services/${serviceId}/reviews`);
  return data;
}

export async function addReview(
  payload: AddReviewRequest
): Promise<Review> {
  const { data } = await api.post<Review>(
    `/services/${payload.serviceId}/reviews`,
    payload
  );
  return data;
}

export async function fetchUserPurchases(
  userId: string,
  serviceId?: string
): Promise<Purchase[]> {
  const { data } = await api.get<Purchase[]>(
    `/users/${userId}/purchases`,
    { params: serviceId ? { serviceId } : undefined }
  );
  return data;
}

