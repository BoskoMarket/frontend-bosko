import { Id } from "./common";
import { Review } from "./review";

export interface Service {
  id: Id;
  title: string;
  description?: string;
  price?: number;
  categoryId?: Id;
  categoryName?: string;
  providerId?: Id;
  userId?: Id;
  image?: string | null;
  rating?: number;
  reviewCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ServicePayload {
  title: string;
  description?: string;
  price?: number;
  categoryId?: Id;
  image?: string | null;
  // TODO: confirmar con backend otros campos requeridos
}

export interface ServiceWithReviews extends Service {
  reviews?: Review[];
}
