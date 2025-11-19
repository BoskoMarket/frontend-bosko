import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";

import {
  fetchCategories as fetchCategoriesService,
  fetchProviderProfile as fetchProviderProfileService,
  fetchServiceReviews as fetchServiceReviewsService,
  fetchServicesByCategory as fetchServicesByCategoryService,
  fetchUserPurchases,
  addReview as addReviewService,
} from "@/services/catalog";
import type {
  AddReviewPayload,
  Category,
  ProviderProfile,
  Review,
  ServiceSummary,
} from "@/types/services";
import { fetchAllServices, fetchServiceById } from "@/services/services";
import {
  PlanType,
  Service,
  ServicePayload,
  createService as createMyService,
  deleteService as deleteMyService,
  getMyServices,
  updateService as updateMyService,
} from "@/services/service";
import { useAuth } from "./AuthContext";

interface ResourceState {
  loading: boolean;
  loaded: boolean;
  error: string | null;
}

const createResourceState = (
  overrides?: Partial<ResourceState>
): ResourceState => ({
  loading: false,
  loaded: false,
  error: null,
  ...overrides,
});

const mergeStatus = (
  current: ResourceState | undefined,
  patch: Partial<ResourceState>
): ResourceState => ({
  loading: patch.loading ?? current?.loading ?? false,
  loaded: patch.loaded ?? current?.loaded ?? false,
  error:
    patch.error !== undefined ? patch.error ?? null : current?.error ?? null,
});

type MarketplaceState = {
  categories: Category[];
  categoriesStatus: ResourceState;
  servicesByCategory: Record<string, ServiceSummary[]>;
  servicesById: Record<string, ServiceSummary>;
  servicesStatus: Record<string, ResourceState>;
  providers: Record<string, ProviderProfile>;
  providersStatus: Record<string, ResourceState>;
  reviewsByService: Record<string, Review[]>;
  reviewsStatus: Record<string, ResourceState>;
  providerRatings: Record<string, { averageRating: number; reviewsCount: number }>;
  purchasesByUser: Record<string, string[]>;
  eligibility: Record<string, Record<string, boolean>>;
};

type MarketplaceAction =
  | { type: "SET_CATEGORIES"; payload: Category[] }
  | { type: "SET_CATEGORIES_STATUS"; payload: Partial<ResourceState> }
  | {
      type: "SET_SERVICES";
      payload: { categoryId: string; services: ServiceSummary[] };
    }
  | {
      type: "SET_SERVICES_STATUS";
      payload: { categoryId: string; status: Partial<ResourceState> };
    }
  | { type: "SET_PROVIDER"; payload: ProviderProfile }
  | {
      type: "SET_PROVIDER_STATUS";
      payload: { providerId: string; status: Partial<ResourceState> };
    }
  | {
      type: "SET_REVIEWS";
      payload: { serviceId: string; reviews: Review[] };
    }
  | {
      type: "SET_REVIEWS_STATUS";
      payload: { serviceId: string; status: Partial<ResourceState> };
    }
  | {
      type: "UPDATE_SERVICE_METRICS";
      payload: { serviceId: string; averageRating: number; reviewsCount: number };
    }
  | {
      type: "SET_PROVIDER_RATING";
      payload: { providerId: string; averageRating: number; reviewsCount: number };
    }
  | { type: "SET_USER_PURCHASES"; payload: { userId: string; serviceIds: string[] } }
  | {
      type: "SET_REVIEW_ELIGIBILITY";
      payload: { serviceId: string; userId: string; canReview: boolean };
    };

const initialMarketplaceState: MarketplaceState = {
  categories: [],
  categoriesStatus: createResourceState(),
  servicesByCategory: {},
  servicesById: {},
  servicesStatus: {},
  providers: {},
  providersStatus: {},
  reviewsByService: {},
  reviewsStatus: {},
  providerRatings: {},
  purchasesByUser: {},
  eligibility: {},
};

const marketplaceReducer = (
  state: MarketplaceState,
  action: MarketplaceAction
): MarketplaceState => {
  switch (action.type) {
    case "SET_CATEGORIES":
      return {
        ...state,
        categories: action.payload,
      };
    case "SET_CATEGORIES_STATUS":
      return {
        ...state,
        categoriesStatus: mergeStatus(state.categoriesStatus, action.payload),
      };
    case "SET_SERVICES": {
      const { categoryId, services } = action.payload;
      const servicesById = { ...state.servicesById };
      services.forEach((service) => {
        servicesById[service.id] = service;
      });
      return {
        ...state,
        servicesByCategory: {
          ...state.servicesByCategory,
          [categoryId]: services,
        },
        servicesById,
      };
    }
    case "SET_SERVICES_STATUS": {
      const { categoryId, status } = action.payload;
      return {
        ...state,
        servicesStatus: {
          ...state.servicesStatus,
          [categoryId]: mergeStatus(state.servicesStatus[categoryId], status),
        },
      };
    }
    case "SET_PROVIDER": {
      const provider = action.payload;
      return {
        ...state,
        providers: {
          ...state.providers,
          [provider.id]: provider,
        },
        providerRatings: {
          ...state.providerRatings,
          [provider.id]: {
            averageRating: provider.averageRating,
            reviewsCount: provider.reviewsCount,
          },
        },
      };
    }
    case "SET_PROVIDER_STATUS": {
      const { providerId, status } = action.payload;
      return {
        ...state,
        providersStatus: {
          ...state.providersStatus,
          [providerId]: mergeStatus(state.providersStatus[providerId], status),
        },
      };
    }
    case "SET_REVIEWS": {
      const { serviceId, reviews } = action.payload;
      return {
        ...state,
        reviewsByService: {
          ...state.reviewsByService,
          [serviceId]: reviews,
        },
      };
    }
    case "SET_REVIEWS_STATUS": {
      const { serviceId, status } = action.payload;
      return {
        ...state,
        reviewsStatus: {
          ...state.reviewsStatus,
          [serviceId]: mergeStatus(state.reviewsStatus[serviceId], status),
        },
      };
    }
    case "UPDATE_SERVICE_METRICS": {
      const { serviceId, averageRating, reviewsCount } = action.payload;
      const service = state.servicesById[serviceId];
      if (!service) {
        return state;
      }
      const updatedService: ServiceSummary = {
        ...service,
        averageRating,
        reviewsCount,
      };
      const updatedServicesById = {
        ...state.servicesById,
        [serviceId]: updatedService,
      };
      const categoryServices = state.servicesByCategory[service.categoryId];
      return {
        ...state,
        servicesById: updatedServicesById,
        servicesByCategory: categoryServices
          ? {
              ...state.servicesByCategory,
              [service.categoryId]: categoryServices.map((item) =>
                item.id === serviceId ? updatedService : item
              ),
            }
          : state.servicesByCategory,
      };
    }
    case "SET_PROVIDER_RATING": {
      const { providerId, averageRating, reviewsCount } = action.payload;
      const provider = state.providers[providerId];
      return {
        ...state,
        providerRatings: {
          ...state.providerRatings,
          [providerId]: { averageRating, reviewsCount },
        },
        providers: provider
          ? {
              ...state.providers,
              [providerId]: {
                ...provider,
                averageRating,
                reviewsCount,
              },
            }
          : state.providers,
      };
    }
    case "SET_USER_PURCHASES": {
      const { userId, serviceIds } = action.payload;
      return {
        ...state,
        purchasesByUser: {
          ...state.purchasesByUser,
          [userId]: serviceIds,
        },
      };
    }
    case "SET_REVIEW_ELIGIBILITY": {
      const { serviceId, userId, canReview } = action.payload;
      const serviceEligibility = state.eligibility[serviceId] ?? {};
      return {
        ...state,
        eligibility: {
          ...state.eligibility,
          [serviceId]: {
            ...serviceEligibility,
            [userId]: canReview,
          },
        },
      };
    }
    default:
      return state;
  }
};

interface ServicesContextValue {
  services: Service[];
  myServices: Service[];
  loading: boolean;
  myServicesLoading: boolean;
  currentPlan: PlanType;
  loadServices: (filters?: Record<string, unknown>) => Promise<void>;
  loadMyServices: () => Promise<void>;
  getService: (id: string) => Promise<Service | undefined>;
  addService: (service: ServicePayload) => Promise<Service>;
  editService: (
    id: string,
    updates: Partial<ServicePayload>
  ) => Promise<Service>;
  removeService: (id: string) => Promise<void>;
  categories: Category[];
  categoriesStatus: ResourceState;
  servicesStatus: Record<string, ResourceState>;
  providersStatus: Record<string, ResourceState>;
  reviewsStatus: Record<string, ResourceState>;
  fetchCategories: () => Promise<void>;
  fetchServicesByCategory: (categoryId: string) => Promise<ServiceSummary[]>;
  fetchProviderProfile: (
    providerId: string
  ) => Promise<ProviderProfile | undefined>;
  fetchServiceReviews: (serviceId: string) => Promise<Review[]>;
  addReviewWithRating: (payload: AddReviewPayload) => Promise<void>;
  getServicesForCategory: (categoryId: string) => ServiceSummary[];
  selectServiceById: (serviceId: string) => ServiceSummary | undefined;
  selectServiceByProvider: (
    providerId: string
  ) => ServiceSummary | undefined;
  getProviderById: (providerId: string) => ProviderProfile | undefined;
  getProviderRating: (
    providerId: string
  ) => { averageRating: number; reviewsCount: number };
  getReviewsForService: (serviceId: string) => Review[];
  canReviewService: (
    serviceId: string,
    userId: string
  ) => boolean | undefined;
  ensureCanReviewService: (
    serviceId: string,
    userId: string
  ) => Promise<boolean>;
}

const ServicesContext = createContext<ServicesContextValue | undefined>(undefined);

function normalizePlan(plan: unknown): PlanType {
  if (!plan || typeof plan !== "string") {
    return "FREE";
  }

  const value = plan.toLowerCase();
  if (value.includes("plus") || value.includes("premium") || value === "pro") {
    return "PLUS";
  }

  return "FREE";
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error) {
    return error.message;
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as any).message === "string"
  ) {
    return (error as any).message as string;
  }
  return fallback;
};

export const ServicesProvider = ({ children }: { children: ReactNode }) => {
  const { authState } = useAuth();
  const [state, dispatch] = useReducer(
    marketplaceReducer,
    initialMarketplaceState
  );
  const [services, setServices] = useState<Service[]>([]);
  const [myServices, setMyServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [myServicesLoading, setMyServicesLoading] = useState<boolean>(false);

  const currentPlan = useMemo<PlanType>(() => {
    const userPlan =
      authState?.user?.plan ??
      authState?.user?.subscriptionPlan ??
      authState?.user?.subscription?.plan ??
      authState?.user?.membership?.name ??
      authState?.user?.planType;

    return normalizePlan(userPlan);
  }, [authState?.user]);

  const fetchCategories = useCallback(async () => {
    const { categoriesStatus } = state;
    if (categoriesStatus.loading) {
      return;
    }
    dispatch({
      type: "SET_CATEGORIES_STATUS",
      payload: { loading: true, error: null },
    });
    try {
      const data = await fetchCategoriesService();
      dispatch({ type: "SET_CATEGORIES", payload: data });
      dispatch({
        type: "SET_CATEGORIES_STATUS",
        payload: { loading: false, loaded: true, error: null },
      });
    } catch (error) {
      dispatch({
        type: "SET_CATEGORIES_STATUS",
        payload: {
          loading: false,
          error: getErrorMessage(error, "No se pudieron cargar las categorías"),
        },
      });
      throw error;
    }
  }, [state.categoriesStatus]);

  const fetchServicesByCategory = useCallback(
    async (categoryId: string) => {
      const status = state.servicesStatus[categoryId];
      if (status?.loading) {
        return state.servicesByCategory[categoryId] ?? [];
      }

      dispatch({
        type: "SET_SERVICES_STATUS",
        payload: { categoryId, status: { loading: true, error: null } },
      });
      try {
        const data = await fetchServicesByCategoryService(categoryId);
        dispatch({
          type: "SET_SERVICES",
          payload: { categoryId, services: data },
        });
        dispatch({
          type: "SET_SERVICES_STATUS",
          payload: {
            categoryId,
            status: { loading: false, loaded: true, error: null },
          },
        });
        return data;
      } catch (error) {
        const message = getErrorMessage(
          error,
          "No se pudieron cargar los servicios"
        );
        dispatch({
          type: "SET_SERVICES_STATUS",
          payload: { categoryId, status: { loading: false, error: message } },
        });
        throw error;
      }
    },
    [state.servicesByCategory, state.servicesStatus]
  );

  const fetchProviderProfile = useCallback(
    async (providerId: string) => {
      const status = state.providersStatus[providerId];
      if (status?.loading) {
        return state.providers[providerId];
      }

      dispatch({
        type: "SET_PROVIDER_STATUS",
        payload: { providerId, status: { loading: true, error: null } },
      });
      try {
        const data = await fetchProviderProfileService(providerId);
        dispatch({ type: "SET_PROVIDER", payload: data });
        dispatch({
          type: "SET_PROVIDER_STATUS",
          payload: {
            providerId,
            status: { loading: false, loaded: true, error: null },
          },
        });
        return data;
      } catch (error) {
        const message = getErrorMessage(
          error,
          "No se pudo cargar el perfil del prestador"
        );
        dispatch({
          type: "SET_PROVIDER_STATUS",
          payload: { providerId, status: { loading: false, error: message } },
        });
        throw error;
      }
    },
    [state.providers, state.providersStatus]
  );

  const applyReviewAggregates = useCallback(
    (serviceId: string, reviews: Review[]) => {
      const service = state.servicesById[serviceId];
      const fallbackAverage = service?.averageRating ?? 0;
      const fallbackCount = service?.reviewsCount ?? 0;
      const count = reviews.length;
      const average =
        count > 0
          ? Number(
              (
                reviews.reduce((acc, review) => acc + review.rating, 0) /
                count
              ).toFixed(2)
            )
          : fallbackAverage;
      const reviewsCount = count > 0 ? count : fallbackCount;
      dispatch({
        type: "UPDATE_SERVICE_METRICS",
        payload: { serviceId, averageRating: average, reviewsCount },
      });
      const providerId =
        service?.providerId ||
        Object.values(state.providers).find(
          (provider) => provider.serviceId === serviceId
        )?.id;
      if (providerId) {
        dispatch({
          type: "SET_PROVIDER_RATING",
          payload: { providerId, averageRating: average, reviewsCount },
        });
      }
    },
    [state.providers, state.servicesById]
  );

  const fetchServiceReviews = useCallback(
    async (serviceId: string) => {
      const status = state.reviewsStatus[serviceId];
      if (status?.loading) {
        return state.reviewsByService[serviceId] ?? [];
      }

      dispatch({
        type: "SET_REVIEWS_STATUS",
        payload: { serviceId, status: { loading: true, error: null } },
      });
      try {
        const data = await fetchServiceReviewsService(serviceId);
        dispatch({ type: "SET_REVIEWS", payload: { serviceId, reviews: data } });
        dispatch({
          type: "SET_REVIEWS_STATUS",
          payload: {
            serviceId,
            status: { loading: false, loaded: true, error: null },
          },
        });
        applyReviewAggregates(serviceId, data);
        return data;
      } catch (error) {
        const message = getErrorMessage(
          error,
          "No se pudieron cargar las reseñas"
        );
        dispatch({
          type: "SET_REVIEWS_STATUS",
          payload: { serviceId, status: { loading: false, error: message } },
        });
        throw error;
      }
    },
    [applyReviewAggregates, state.reviewsByService, state.reviewsStatus]
  );

  const ensureCanReviewService = useCallback(
    async (serviceId: string, userId: string) => {
      const eligibility = state.eligibility[serviceId]?.[userId];
      if (typeof eligibility === "boolean") {
        return eligibility;
      }

      try {
        const purchases = await fetchUserPurchases(userId, serviceId);
        const purchasedServiceIds = purchases.map((purchase) => purchase.serviceId);
        dispatch({
          type: "SET_USER_PURCHASES",
          payload: { userId, serviceIds: purchasedServiceIds },
        });
        const canReview = purchasedServiceIds.includes(serviceId);
        dispatch({
          type: "SET_REVIEW_ELIGIBILITY",
          payload: { serviceId, userId, canReview },
        });
        return canReview;
      } catch (error) {
        dispatch({
          type: "SET_REVIEW_ELIGIBILITY",
          payload: { serviceId, userId, canReview: false },
        });
        throw error;
      }
    },
    [state.eligibility]
  );

  const addReviewWithRating = useCallback(
    async (payload: AddReviewPayload) => {
      const { serviceId, userId, rating, comment } = payload;
      if (rating < 1 || rating > 5) {
        throw new Error("La calificación debe estar entre 1 y 5");
      }

      const canReview = await ensureCanReviewService(serviceId, userId);
      if (!canReview) {
        throw new Error(
          "Solo quienes contrataron el servicio pueden dejar una reseña"
        );
      }

      const previousReviews = state.reviewsByService[serviceId] ?? [];
      const optimisticReview: Review = {
        id: `temp-${Date.now()}`,
        serviceId,
        userId,
        userName: authState.user?.name ?? "Usuario",
        userAvatar: authState.user?.avatarUrl ?? undefined,
        rating,
        comment,
        createdAt: new Date().toISOString(),
      };

      const optimisticList = [...previousReviews, optimisticReview];
      dispatch({
        type: "SET_REVIEWS_STATUS",
        payload: { serviceId, status: { loading: true, error: null } },
      });
      dispatch({
        type: "SET_REVIEWS",
        payload: { serviceId, reviews: optimisticList },
      });
      applyReviewAggregates(serviceId, optimisticList);

      try {
        const created = await addReviewService({
          ...payload,
          userName: optimisticReview.userName,
          userAvatar: optimisticReview.userAvatar,
        });
        const confirmed = optimisticList.map((review) =>
          review.id === optimisticReview.id ? created : review
        );
        dispatch({
          type: "SET_REVIEWS",
          payload: { serviceId, reviews: confirmed },
        });
        dispatch({
          type: "SET_REVIEWS_STATUS",
          payload: { serviceId, status: { loading: false, loaded: true, error: null } },
        });
        applyReviewAggregates(serviceId, confirmed);
      } catch (error) {
        dispatch({
          type: "SET_REVIEWS",
          payload: { serviceId, reviews: previousReviews },
        });
        dispatch({
          type: "SET_REVIEWS_STATUS",
          payload: {
            serviceId,
            status: {
              loading: false,
              error: getErrorMessage(error, "No se pudo enviar la reseña"),
            },
          },
        });
        applyReviewAggregates(serviceId, previousReviews);
        throw error;
      }
    },
    [
      applyReviewAggregates,
      authState.user?.avatarUrl,
      authState.user?.name,
      ensureCanReviewService,
      state.reviewsByService,
    ]
  );

  const loadServices = useCallback(async (filters?: Record<string, unknown>) => {
    setLoading(true);
    try {
      const data = await fetchAllServices(filters);
      setServices(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMyServices = useCallback(async () => {
    setMyServicesLoading(true);
    try {
      const data = await getMyServices();
      setMyServices(data);
    } finally {
      setMyServicesLoading(false);
    }
  }, []);

  const getService = useCallback(async (id: string) => {
    try {
      const service = await fetchServiceById(id);
      return service;
    } catch (err) {
      console.error("Failed to fetch service", err);
      return undefined;
    }
  }, []);

  const addService = useCallback(
    async (service: ServicePayload) => {
      if (currentPlan === "FREE" && myServices.length >= 1) {
        const error = new Error("PLAN_LIMIT_REACHED");
        throw error;
      }

      const newService = await createMyService(service);
      setMyServices((prev) => [...prev, newService]);
      return newService;
    },
    [currentPlan, myServices.length]
  );

  const editService = useCallback(async (id: string, updates: Partial<ServicePayload>) => {
    const updated = await updateMyService(id, updates);
    setMyServices((prev) => prev.map((s) => (s.id === id ? updated : s)));
    return updated;
  }, []);

  const removeService = useCallback(async (id: string) => {
    await deleteMyService(id);
    setMyServices((prev) => prev.filter((s) => s.id !== id));
  }, []);

  // useEffect(() => {
  //   loadMyServices().catch((err) => console.error(err));
  // }, [loadMyServices]);

  const getServicesForCategory = useCallback(
    (categoryId: string) => state.servicesByCategory[categoryId] ?? [],
    [state.servicesByCategory]
  );

  const selectServiceById = useCallback(
    (serviceId: string) => state.servicesById[serviceId],
    [state.servicesById]
  );

  const selectServiceByProvider = useCallback(
    (providerId: string) =>
      Object.values(state.servicesById).find(
        (service) => service.providerId === providerId
      ),
    [state.servicesById]
  );

  const getProviderById = useCallback(
    (providerId: string) => state.providers[providerId],
    [state.providers]
  );

  const getProviderRating = useCallback(
    (providerId: string) => {
      const rating = state.providerRatings[providerId];
      if (rating) {
        return rating;
      }
      const provider = state.providers[providerId];
      if (provider) {
        return {
          averageRating: provider.averageRating,
          reviewsCount: provider.reviewsCount,
        };
      }
      const service = selectServiceByProvider(providerId);
      if (service) {
        return {
          averageRating: service.averageRating,
          reviewsCount: service.reviewsCount,
        };
      }
      return { averageRating: 0, reviewsCount: 0 };
    },
    [selectServiceByProvider, state.providerRatings, state.providers]
  );

  const getReviewsForService = useCallback(
    (serviceId: string) => state.reviewsByService[serviceId] ?? [],
    [state.reviewsByService]
  );

  const canReviewService = useCallback(
    (serviceId: string, userId: string) => state.eligibility[serviceId]?.[userId],
    [state.eligibility]
  );

  const value = useMemo<ServicesContextValue>(
    () => ({
      services,
      myServices,
      loading,
      myServicesLoading,
      currentPlan,
      loadServices,
      loadMyServices,
      getService,
      addService,
      editService,
      removeService,
      categories: state.categories,
      categoriesStatus: state.categoriesStatus,
      servicesStatus: state.servicesStatus,
      providersStatus: state.providersStatus,
      reviewsStatus: state.reviewsStatus,
      fetchCategories,
      fetchServicesByCategory,
      fetchProviderProfile,
      fetchServiceReviews,
      addReviewWithRating,
      getServicesForCategory,
      selectServiceById,
      selectServiceByProvider,
      getProviderById,
      getProviderRating,
      getReviewsForService,
      canReviewService,
      ensureCanReviewService,
    }),
    [
      addReviewWithRating,
      addService,
      canReviewService,
      currentPlan,
      editService,
      ensureCanReviewService,
      fetchCategories,
      fetchProviderProfile,
      fetchServiceReviews,
      fetchServicesByCategory,
      getProviderById,
      getProviderRating,
      getReviewsForService,
      getService,
      getServicesForCategory,
      loadMyServices,
      loadServices,
      loading,
      myServices,
      myServicesLoading,
      removeService,
      selectServiceById,
      selectServiceByProvider,
      services,
      state.categories,
      state.categoriesStatus,
      state.providersStatus,
      state.reviewsStatus,
      state.servicesStatus,
    ]
  );

  return (
    <ServicesContext.Provider value={value}>
      {children}
    </ServicesContext.Provider>
  );
};

export const useServices = () => {
  const context = useContext(ServicesContext);
  if (context === undefined) {
    throw new Error("useServices must be used within a ServicesProvider");
  }
  return context;
};
