import { Id } from "./common";

export interface Review {
  id: Id;
  rating: number;
  comment?: string;
  userId?: Id;
  serviceId?: Id;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateReviewDto {
  rating: number;
  comment?: string;
  // TODO: confirmar con backend si se requiere título u otros campos
}
