
import { Id } from "../interfaces/common";
import { Service, ServicePayload, ServiceWithReviews } from "../interfaces/service";
import { CreateReviewDto, Review } from "../interfaces/review";
import api from "@/core/api/axiosinstance";

export async function listServices(params?: Record<string, any>): Promise<Service[]> {
  const { data } = await api.get<Service[]>("/services", { params });
  return data;
}

export async function createService(payload: ServicePayload): Promise<Service> {
  const { data } = await api.post<Service>("/services", payload);
  return data;
}

export async function getService(id: Id): Promise<ServiceWithReviews> {
  const { data } = await api.get<ServiceWithReviews>(`/services/${id}`);
  return data;
}

export async function updateService(
  id: Id,
  payload: Partial<ServicePayload>
): Promise<Service> {
  const { data } = await api.patch<Service>(`/services/${id}`, payload);
  return data;
}

export async function deleteService(id: Id): Promise<void> {
  await api.delete(`/services/${id}`);
}

export async function listServiceReviews(id: Id): Promise<Review[]> {
  const { data } = await api.get<Review[]>(`/services/${id}/reviews`);
  return data;
}

export async function createServiceReview(
  id: Id,
  payload: CreateReviewDto
): Promise<Review> {
  const { data } = await api.post<Review>(`/services/${id}/reviews`, payload);
  return data;
}
