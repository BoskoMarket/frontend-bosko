import { Id } from "./common";
import { Review } from "./review";

export interface Service {
  id: Id;
  title: string;
  description?: string;
  price?: number;
  categoryId?: Id;
  categoryName?: string;
  category?: {
    id: Id;
    name?: string;
    description?: string;
    parentId?: Id | null;
  };
  providerId?: Id;
  provider?: {
    id: Id;
    firstName?: string;
    lastName?: string;
    username?: string;
    location?: string | null;
  };
  userId?: Id;
  image?: string | null;
  rating?: number;
  reviewCount?: number;
  location?: string;
  priceMin?: number;
  priceMax?: number;
  currency?: string;
  status?: string;
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
