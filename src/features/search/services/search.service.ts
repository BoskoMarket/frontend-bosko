
import api from "@/core/api/axiosinstance";
import { SearchResponse } from "../../../interfaces/search";

export async function search(query: string): Promise<SearchResponse> {
  const { data } = await api.get<SearchResponse>("/search", { params: { query } });
  return data;
}
