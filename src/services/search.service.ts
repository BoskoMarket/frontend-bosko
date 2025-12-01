import http from "../lib/http";
import { SearchResponse } from "../interfaces/search";

export async function search(query: string): Promise<SearchResponse> {
  const { data } = await http.get<SearchResponse>("/search", { params: { query } });
  return data;
}
