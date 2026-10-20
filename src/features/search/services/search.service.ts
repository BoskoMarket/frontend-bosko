import api from "@/core/api/axiosinstance";
import { mapCategory, mapService } from "@/features/servicesUser/services/catalog";
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

/** Plain array or `{ data: [...] }` page; anything else counts as no results. */
function toList(value: unknown): any[] {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object" && Array.isArray((value as { data?: unknown }).data)) {
    return (value as { data: any[] }).data;
  }
  return [];
}

const hasId = (item: { id?: unknown }) => !!item?.id;

/** Adapts the backend SearchResultDto (nested provider, price object) to SearchResponse. */
export function adaptSearchResponse(raw: any, query = ""): SearchResponse {
  const isBareList = Array.isArray(raw);
  return {
    query: raw?.query ?? query,
    services: toList(isBareList ? raw : raw?.services)
      .filter(hasId)
      .map((s) => ({ ...mapService(s), categoryName: s?.category?.name ?? s?.categoryName })),
    providers: toList(isBareList ? [] : raw?.providers).map(mapSearchProvider).filter(hasId),
    categories: toList(isBareList ? [] : raw?.categories).filter(hasId).map(mapCategory),
  };
}

export async function search(query: string): Promise<SearchResponse> {
  const { data } = await api.get<any>("/search", { params: { q: query } });
  return adaptSearchResponse(data, query);
}
