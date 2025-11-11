export interface Category {
  id: string;
  title: string;
  description: string;
  accent: string;
  icon?: string;
  servicesCount?: number;
}

export interface ServicePrice {
  currency: string;
  amount: number;
  unit: string;
}

export interface Service {
  id: string;
  categoryId: string;
  providerId: string;
  title: string;
  description: string;
  providerName?: string;
  rate: ServicePrice;
  location: string;
  thumbnail?: string;
  rating?: number;
  reviewsCount?: number;
}

export interface Provider {
  id: string;
  name: string;
  title: string;
  bio: string;
  summary?: string;
  location: string;
  avatar: string;
  heroImage?: string;
  tags: string[];
  specialties?: string[];
  rate: ServicePrice;
  experience?: string;
}

export interface Review {
  id: string;
  serviceId: string;
  userId: string;
  userName?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Purchase {
  id: string;
  serviceId: string;
  userId: string;
  status: "pending" | "paid" | "completed" | "cancelled";
  purchasedAt: string;
}

export interface ReviewInput {
  serviceId: string;
  userId: string;
  userName?: string;
  rating: number;
  comment: string;
}

export interface ProviderAggregate {
  providerId: string;
  averageRating: number;
  totalReviews: number;
}

export type LoadingState = "idle" | "loading" | "success" | "error";
