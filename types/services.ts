export type Rate = {
  amount: number;
  currency: string;
  unit: string;
};

export type Category = {
  id: string;
  title: string;
  description: string;
  icon: string;
  accent: string;
  servicesCount?: number;
};

export type ServiceSummary = {
  id: string;
  categoryId: string;
  providerId: string;
  name: string;
  title: string;
  summary: string;
  thumbnail: string;
  location: string;
  rate: Rate;
  averageRating: number;
  reviewsCount: number;
};

export type ProviderProfile = {
  id: string;
  serviceId: string;
  categoryId: string;
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
};

export type Review = {
  id: string;
  serviceId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type Purchase = {
  id: string;
  serviceId: string;
  userId: string;
  completedAt: string;
};

export type AddReviewPayload = {
  serviceId: string;
  userId: string;
  rating: number;
  comment: string;
};
