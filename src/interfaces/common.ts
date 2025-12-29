export interface ApiError {
  status: number;
  message: string;
  details?: unknown;
}

export type Id = string;

export interface PaginationMeta {
  total?: number;
  page?: number;
  limit?: number;
}
