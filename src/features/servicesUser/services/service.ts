import api from "@/core/api/axiosinstance";

export type PlanType = "FREE" | "PLUS";

export interface Service {
  id?: string;
  title: string;
  description: string;
  price: number;
  category: string | { id: string; name: string };
  image?: string | null;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ServicePayload {
  title: string;
  description: string;
  price: number;
  category: string;
  image?: string | null;
}

export async function getMyServices(): Promise<Service[]> {
  const { data } = await api.get<Service[]>("/services/my");
  return data;
}

export async function createService(payload: ServicePayload): Promise<Service> {
  const { data } = await api.post<Service>("/services", payload);
  return data;
}

export async function updateService(
  id: string,
  payload: Partial<ServicePayload>
): Promise<Service> {
  const { data } = await api.put<Service>(`/services/${id}`, payload);
  return data;
}

export async function deleteService(id: string): Promise<void> {
  await api.delete(`/services/${id}`);
}
