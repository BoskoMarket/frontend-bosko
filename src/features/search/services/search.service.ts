import api from "@/core/api/axiosinstance";
import { mapService } from "@/features/servicesUser/services/catalog";
import type { SearchProvider, SearchResponse } from "../../../interfaces/search";

export function mapSearchProvider(p: any): SearchProvider {
  const rating = parseFloat(p?.rating ?? p?.averageRating);
  return {
    id: p?.id,
    name: [p?.firstName, p?.lastName].filter(Boolean).join(" ") || p?.username || p?.name || "",
    avatar: p?.avatarUrl ?? p?.avatar ?? undefined,
    title: p?.title ?? undefined,
    rating: Number.isFinite(rating) ? rating : undefined,
    location: p?.location ?? undefined,
  };
}

/** Adapts the backend SearchResultDto (nested provider, price object) to SearchResponse. */
export function adaptSearchResponse(raw: any, query = ""): SearchResponse {
  const rawServices: any[] = Array.isArray(raw) ? raw : raw?.services ?? [];
  const rawProviders: any[] = Array.isArray(raw) ? [] : raw?.providers ?? [];
  return {
    query: raw?.query ?? query,
    services: rawServices.map((s) => ({ ...mapService(s), categoryName: s?.category?.name ?? s?.categoryName })),
    providers: rawProviders.map(mapSearchProvider).filter((p) => !!p.id),
    categories: Array.isArray(raw) ? [] : raw?.categories ?? [],
  };
}

export async function search(query: string): Promise<SearchResponse> {
  const { data } = await api.get<any>("/search", { params: { q: query } });
  return adaptSearchResponse(data, query);
}
