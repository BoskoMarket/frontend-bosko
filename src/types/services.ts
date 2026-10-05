export type Rate = {
  amount: number;
  currency: string;
  unit: string;
};

export type Category = {
  id: string;
  name: string;
  description: string;
  icon: string;
  accent: string;
  video?: string;
  servicesCount?: number;
};

export type ServiceSummary = {
  id: string;
  categoryId: string;
  categoryName?: string;
  providerId: string;
  name: string;
  title: string;
  summary: string;
  thumbnail?: string;
  images?: string[];
  location: string;
  rate: Rate;
  averageRating: number;
  reviewsCount: number;
  isAvailable?: boolean;
};

export type ProviderProfile = {
  id: string;
  serviceId: string;
  categoryId: string;
  categoryName?: string;
  name: string;
  title: string;
  summary: string;
  bio: string;
  avatar: string;
  heroImage: string;
  location: string;
  tags: string[];
  recentWorks: {
    id: string;
    title: string;
    image: string;
    timeAgo: string;
  }[];
  averageRating: number;
  reviewsCount: number;
  rate: Rate;
  isAvailable?: boolean;
};

export type Review = {
  id: string;
  serviceId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  reply?: string;
  createdAt: string;
};

export type AddReviewPayload = {
  orderId: string;
  rating: number;
  comment: string;
};
