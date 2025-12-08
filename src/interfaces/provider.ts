import { Id } from "./common";
import { Service } from "./service";

export interface ProviderRate {
  amount?: number;
  currency?: string;
  unit?: string;
}

export interface ProviderWork {
  id: Id;
  title?: string;
  image?: string;
  timeAgo?: string;
}

export interface Provider {
  id: Id;
  userId?: Id;
  name?: string;
  title?: string;
  summary?: string;
  bio?: string;
  categoryId?: Id;
  rating?: number;
  reviews?: number;
  reviewsCount?: number;
  location?: string;
  rate?: ProviderRate;
  avatar?: string;
  photo?: string;
  heroImage?: string;
  tags?: string[];
  recentWorks?: ProviderWork[];
  services?: Service[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ProviderServicePayload {
  title: string;
  description?: string;
  price?: number;
  // TODO: confirmar con backend estructura completa del payload
}
