import http from "../lib/http";
import { Id } from "../interfaces/common";
import { Service, ServicePayload, ServiceWithReviews } from "../interfaces/service";
import { CreateReviewDto, Review } from "../interfaces/review";

export async function listServices(params?: Record<string, any>): Promise<Service[]> {
  const { data } = await http.get<Service[]>("/services", { params });
  return data;
}

export async function createService(payload: ServicePayload): Promise<Service> {
  const { data } = await http.post<Service>("/services", payload);
  return data;
}

export async function getService(id: Id): Promise<ServiceWithReviews> {
  const { data } = await http.get<ServiceWithReviews>(`/services/${id}`);
  return data;
}

export async function updateService(
  id: Id,
  payload: Partial<ServicePayload>
): Promise<Service> {
  const { data } = await http.patch<Service>(`/services/${id}`, payload);
  return data;
}

export async function deleteService(id: Id): Promise<void> {
  await http.delete(`/services/${id}`);
}

export async function listServiceReviews(id: Id): Promise<Review[]> {
  const { data } = await http.get<Review[]>(`/services/${id}/reviews`);
  return data;
}

export async function createServiceReview(
  id: Id,
  payload: CreateReviewDto
): Promise<Review> {
  const { data } = await http.post<Review>(`/services/${id}/reviews`, payload);
  return data;
}
