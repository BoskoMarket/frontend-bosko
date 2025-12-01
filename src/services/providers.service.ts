import http from "../lib/http";
import { Id } from "../interfaces/common";
import { Provider, ProviderServicePayload } from "../interfaces/provider";
import { Service } from "../interfaces/service";

export async function listProviders(params?: Record<string, any>): Promise<Provider[]> {
  const { data } = await http.get<Provider[]>("/provider", { params });
  return data;
}

export async function getProvider(id: Id): Promise<Provider> {
  const { data } = await http.get<Provider>(`/provider/${id}`);
  return data;
}

export async function listProviderServices(id: Id): Promise<Service[]> {
  const { data } = await http.get<Service[]>(`/provider/${id}/services`);
  return data;
}

export async function createProviderService(
  id: Id,
  payload: ProviderServicePayload
): Promise<Service> {
  const { data } = await http.post<Service>(`/provider/${id}/services`, payload);
  return data;
}
