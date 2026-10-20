import type { ServiceSummary } from "@/types/services";
import { Category } from "./category";
import { Id } from "./common";

export interface SearchProvider {
  id: Id;
  name: string;
  avatar?: string;
  title?: string;
  rating?: number;
  location?: string;
}

/** Client-shaped search results (adapted from the backend SearchResultDto). */
export interface SearchResponse {
  query: string;
  services: ServiceSummary[];
  providers: SearchProvider[];
  categories: Category[];
}
