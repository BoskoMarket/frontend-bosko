
import type {
  AddReviewPayload,
  Category,
  ProviderProfile,
  Purchase,
  Review,
  ServiceSummary,
} from "@/types/services";
import { SERVICE_PROVIDERS, ServiceProvider } from "../constants/serviceProviders";
import { MOCK_PURCHASES, MOCK_REVIEWS } from "@/assets/fonts/mockServiceReviews";
import { SERVICE_CATEGORIES } from "../constants/serviceCategories";
import { ENDPOINTS } from "@/assets/fonts/api";

export type AddReviewRequest = AddReviewPayload & {
  userName?: string;
  userAvatar?: string;
};

const USE_MOCK_API = true;

let reviewStore: Review[] = [...MOCK_REVIEWS];

const providerIndex = new Map<string, ServiceProvider>(
  SERVICE_PROVIDERS.map((provider) => [provider.id, provider])
);

const delay = (ms = 220) => new Promise((resolve) => setTimeout(resolve, ms));

const toServiceSummary = (provider: ServiceProvider): ServiceSummary => ({
  id: provider.id,
  categoryId: provider.categoryId,
  providerId: provider.id,
  name: provider.name,
  title: provider.title,
  summary: provider.summary,
  thumbnail: provider.photo,
  location: provider.location,
  rate: provider.rate,
  averageRating: provider.rating,
  reviewsCount: provider.reviews,
});

const toProviderProfile = (provider: ServiceProvider): ProviderProfile => ({
  id: provider.id,
  serviceId: provider.id,
  categoryId: provider.categoryId,
  name: provider.name,
  title: provider.title,
  summary: provider.summary,
  bio: provider.bio,
  avatar: provider.photo,
  heroImage: provider.heroImage,
  location: provider.location,
  tags: provider.tags,
  recentWorks: provider.recentWorks,
  averageRating: provider.rating,
  reviewsCount: provider.reviews,
  rate: provider.rate,
});

const computeServicesCount = (categoryId: string) =>
  SERVICE_PROVIDERS.filter((provider) => provider.categoryId === categoryId).length;

export async function fetchCategories(): Promise<Category[]> {
  if (USE_MOCK_API) {
    await delay();
    return SERVICE_CATEGORIES.map((category) => ({
      ...category,
      servicesCount: computeServicesCount(category.id),
    }));
  }

  const response = await fetch(ENDPOINTS.categories());
  if (!response.ok) {
    throw new Error("No se pudieron cargar las categorías");
  }
  const data = (await response.json()) as Category[];
  return data;
}

export async function fetchServicesByCategory(
  categoryId: string
): Promise<ServiceSummary[]> {
  if (USE_MOCK_API) {
    await delay();
    return SERVICE_PROVIDERS.filter(
      (provider) => provider.categoryId === categoryId
    ).map(toServiceSummary);
  }

  const response = await fetch(ENDPOINTS.servicesByCategory(categoryId));
  if (!response.ok) {
    throw new Error("No se pudieron cargar los servicios de esta categoría");
  }
  const data = (await response.json()) as ServiceSummary[];
  return data;
}

export async function fetchProviderProfile(
  providerId: string
): Promise<ProviderProfile> {
  if (USE_MOCK_API) {
    await delay();
    const provider = providerIndex.get(providerId);
    if (!provider) {
      throw new Error("Prestador no encontrado");
    }
    return toProviderProfile(provider);
  }

  const response = await fetch(ENDPOINTS.providerById(providerId));
  if (!response.ok) {
    throw new Error("No se pudo cargar el perfil del prestador");
  }
  const data = (await response.json()) as ProviderProfile;
  return data;
}

export async function fetchServiceReviews(serviceId: string): Promise<Review[]> {
  if (USE_MOCK_API) {
    await delay();
    return reviewStore
      .filter((review) => review.serviceId === serviceId)
      .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
  }

  const response = await fetch(ENDPOINTS.serviceReviews(serviceId));
  if (!response.ok) {
    throw new Error("No se pudieron cargar las reseñas del servicio");
  }
  const data = (await response.json()) as Review[];
  return data;
}

export async function addReview(
  payload: AddReviewRequest
): Promise<Review> {
  if (USE_MOCK_API) {
    await delay();
    const newReview: Review = {
      id: `review-${Date.now()}`,
      serviceId: payload.serviceId,
      userId: payload.userId,
      userName: payload.userName ?? "Usuario",
      userAvatar: payload.userAvatar,
      rating: payload.rating,
      comment: payload.comment,
      createdAt: new Date().toISOString(),
    };
    reviewStore = [...reviewStore, newReview];
    return newReview;
  }

  const response = await fetch(ENDPOINTS.addReview(payload.serviceId), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("No se pudo enviar la reseña");
  }

  const data = (await response.json()) as Review;
  return data;
}

export async function fetchUserPurchases(
  userId: string,
  serviceId?: string
): Promise<Purchase[]> {
  if (USE_MOCK_API) {
    await delay();
    return MOCK_PURCHASES.filter((purchase) => {
      if (serviceId) {
        return purchase.userId === userId && purchase.serviceId === serviceId;
      }
      return purchase.userId === userId;
    });
  }

  const response = await fetch(ENDPOINTS.userPurchases(userId, serviceId));
  if (!response.ok) {
    throw new Error("No se pudieron verificar las contrataciones");
  }
  const data = (await response.json()) as Purchase[];
  return data;
}
