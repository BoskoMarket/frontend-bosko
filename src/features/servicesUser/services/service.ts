import api from "@/core/api/axiosinstance";

export type PlanType = "FREE" | "PLUS";

export interface Service {
  id?: string;
  title: string;
  description: string;
  price?: number | null;
  category: string | { id: string; name: string };
  image?: string | null;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ServicePayload {
  title: string;
  description: string;
  price?: number;
  categoryId: string;
  keywords?: string[];
}

function normalizePrice(price: any): number | null {
  if (price == null) return null;
  if (typeof price === 'object') return price.amount ?? null;
  if (typeof price === 'string') return parseFloat(price) || null;
  return price;
}

function normalizeService(s: any): Service {
  return {
    ...s,
    price: normalizePrice(s.price),
    image: s.images?.[0] ?? s.image ?? null,
  };
}

export async function getMyServices(): Promise<Service[]> {
  const { data } = await api.get<any>("/services/me");
  const raw: any[] = data?.data ?? (Array.isArray(data) ? data : []);
  return raw.map(normalizeService);
}

export async function createService(payload: ServicePayload): Promise<Service> {
  const { data } = await api.post<Service>("/services", payload);
  return data;
}

export async function updateService(
  id: string,
  payload: Partial<ServicePayload>
): Promise<Service> {
  const { data } = await api.patch<Service>(`/services/${id}`, payload);
  return data;
}

export async function deleteService(id: string): Promise<void> {
  await api.delete(`/services/${id}`);
}

/** Subir imágenes a un servicio — POST /services/:id/images (multipart, max 5) */
export async function uploadServiceImages(
  serviceId: string,
  imageUris: string[],
): Promise<{ imageUrls: string[] }> {
  const formData = new FormData();
  imageUris.forEach((uri, i) => {
    formData.append('images', {
      uri,
      type: 'image/jpeg',
      name: `service-image-${i}.jpg`,
    } as any);
  });

  const { data } = await api.post<{ imageUrls: string[] }>(
    `/services/${serviceId}/images`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data;
}
