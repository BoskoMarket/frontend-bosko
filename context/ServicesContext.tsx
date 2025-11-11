import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import {
  createServiceReview,
  fetchCategories,
  fetchProviderById,
  fetchServiceReviews,
  fetchServicesByCategory,
  fetchUserPurchases,
} from "@/services/api";
import type {
  Category,
  LoadingState,
  Provider,
  ProviderAggregate,
  Review,
  ReviewInput,
  Service,
} from "@/types/services";
import { useAuth } from "./AuthContext";
import type {
  PlanType,
  Service as ManagedService,
  ServicePayload,
} from "@/services/service";
import {
  createService as createMyService,
  deleteService as deleteMyService,
  getMyServices,
  updateService as updateMyService,
} from "@/services/service";

interface ServicesContextValue {
  categories: Category[];
  categoriesStatus: LoadingState;
  categoriesError?: string;
  servicesByCategory: Record<string, Service[]>;
  providers: Record<string, Provider | undefined>;
  reviewsByService: Record<string, Review[]>;
  fetchCategories: () => Promise<void>;
  fetchServicesByCategory: (categoryId: string) => Promise<void>;
  fetchProviderProfile: (providerId: string) => Promise<Provider | undefined>;
  fetchServiceReviews: (serviceId: string) => Promise<Review[]>;
  addReviewWithRating: (input: ReviewInput) => Promise<Review>;
  getServicesForCategory: (categoryId: string) => Service[];
  getServiceById: (serviceId: string) => Service | undefined;
  getProviderAggregate: (providerId: string) => ProviderAggregate;
  getReviewStatus: (serviceId: string) => LoadingState;
  getServicesStatus: (categoryId: string) => LoadingState;
  isUserEligibleForReview: (serviceId: string, userId: string) => Promise<boolean>;
  myServices: ManagedService[];
  myServicesLoading: boolean;
  currentPlan: PlanType;
  loadMyServices: () => Promise<void>;
  addService: (service: ServicePayload) => Promise<ManagedService>;
  editService: (
    id: string,
    updates: Partial<ServicePayload>
  ) => Promise<ManagedService>;
  removeService: (id: string) => Promise<void>;
}

type ServiceReview = Review & { optimistic?: boolean };

type ResourceState<T> = {
  status: LoadingState;
  error?: string;
  data: T;
};

type OptionalResourceState<T> = {
  status: LoadingState;
  error?: string;
  data?: T;
};

interface ServicesState {
  categories: ResourceState<Category[]>;
  servicesByCategory: Record<string, ResourceState<Service[]>>;
  providers: Record<string, OptionalResourceState<Provider>>;
  reviewsByService: Record<string, ResourceState<ServiceReview[]>>;
  purchasesEligibility: Record<string, Record<string, boolean>>;
  serviceIndex: Record<string, Service>;
}

type ServicesAction =
  | { type: "CATEGORIES_REQUEST" }
  | { type: "CATEGORIES_SUCCESS"; payload: Category[] }
  | { type: "CATEGORIES_FAILURE"; error: string }
  | { type: "SERVICES_REQUEST"; categoryId: string }
  | { type: "SERVICES_SUCCESS"; categoryId: string; services: Service[] }
  | { type: "SERVICES_FAILURE"; categoryId: string; error: string }
  | { type: "PROVIDER_REQUEST"; providerId: string }
  | { type: "PROVIDER_SUCCESS"; provider: Provider }
  | { type: "PROVIDER_FAILURE"; providerId: string; error: string }
  | { type: "REVIEWS_REQUEST"; serviceId: string }
  | { type: "REVIEWS_SUCCESS"; serviceId: string; reviews: Review[] }
  | { type: "REVIEWS_FAILURE"; serviceId: string; error: string }
  | { type: "ADD_REVIEW_OPTIMISTIC"; review: ServiceReview }
  | { type: "REPLACE_REVIEW"; serviceId: string; tempId: string; review: Review }
  | { type: "REMOVE_REVIEW"; serviceId: string; reviewId: string }
  | {
      type: "SET_PURCHASE_ELIGIBILITY";
      serviceId: string;
      userId: string;
      eligible: boolean;
    };

const idleResource = <T,>(data: T): ResourceState<T> => ({
  data,
  status: "idle",
});

const idleOptionalResource = <T,>(): OptionalResourceState<T> => ({
  status: "idle",
});

const ServicesContext = createContext<ServicesContextValue | undefined>(undefined);

function servicesReducer(state: ServicesState, action: ServicesAction): ServicesState {
  switch (action.type) {
    case "CATEGORIES_REQUEST":
      return {
        ...state,
        categories: { ...state.categories, status: "loading", error: undefined },
      };
    case "CATEGORIES_SUCCESS":
      return {
        ...state,
        categories: { status: "success", error: undefined, data: action.payload },
      };
    case "CATEGORIES_FAILURE":
      return {
        ...state,
        categories: { ...state.categories, status: "error", error: action.error },
      };
    case "SERVICES_REQUEST":
      return {
        ...state,
        servicesByCategory: {
          ...state.servicesByCategory,
          [action.categoryId]: {
            data: state.servicesByCategory[action.categoryId]?.data ?? [],
            status: "loading",
          },
        },
      };
    case "SERVICES_SUCCESS": {
      const nextIndex = { ...state.serviceIndex };
      action.services.forEach((service) => {
        nextIndex[service.id] = service;
      });
      return {
        ...state,
        servicesByCategory: {
          ...state.servicesByCategory,
          [action.categoryId]: {
            data: action.services,
            status: "success",
          },
        },
        serviceIndex: nextIndex,
      };
    }
    case "SERVICES_FAILURE":
      return {
        ...state,
        servicesByCategory: {
          ...state.servicesByCategory,
          [action.categoryId]: {
            data: state.servicesByCategory[action.categoryId]?.data ?? [],
            status: "error",
            error: action.error,
          },
        },
      };
    case "PROVIDER_REQUEST":
      return {
        ...state,
        providers: {
          ...state.providers,
          [action.providerId]: {
            ...state.providers[action.providerId],
            status: "loading",
            error: undefined,
          },
        },
      };
    case "PROVIDER_SUCCESS":
      return {
        ...state,
        providers: {
          ...state.providers,
          [action.provider.id]: {
            status: "success",
            data: action.provider,
          },
        },
      };
    case "PROVIDER_FAILURE":
      return {
        ...state,
        providers: {
          ...state.providers,
          [action.providerId]: {
            ...state.providers[action.providerId],
            status: "error",
            error: action.error,
          },
        },
      };
    case "REVIEWS_REQUEST":
      return {
        ...state,
        reviewsByService: {
          ...state.reviewsByService,
          [action.serviceId]: {
            data: state.reviewsByService[action.serviceId]?.data ?? [],
            status: "loading",
          },
        },
      };
    case "REVIEWS_SUCCESS":
      return {
        ...state,
        reviewsByService: {
          ...state.reviewsByService,
          [action.serviceId]: {
            data: action.reviews,
            status: "success",
          },
        },
      };
    case "REVIEWS_FAILURE":
      return {
        ...state,
        reviewsByService: {
          ...state.reviewsByService,
          [action.serviceId]: {
            data: state.reviewsByService[action.serviceId]?.data ?? [],
            status: "error",
            error: action.error,
          },
        },
      };
    case "ADD_REVIEW_OPTIMISTIC": {
      const current = state.reviewsByService[action.review.serviceId]?.data ?? [];
      return {
        ...state,
        reviewsByService: {
          ...state.reviewsByService,
          [action.review.serviceId]: {
            data: [...current, action.review],
            status: "success",
          },
        },
      };
    }
    case "REPLACE_REVIEW": {
      const current = state.reviewsByService[action.serviceId]?.data ?? [];
      return {
        ...state,
        reviewsByService: {
          ...state.reviewsByService,
          [action.serviceId]: {
            data: current.map((review) =>
              review.id === action.tempId ? action.review : review
            ),
            status: "success",
          },
        },
      };
    }
    case "REMOVE_REVIEW": {
      const current = state.reviewsByService[action.serviceId]?.data ?? [];
      return {
        ...state,
        reviewsByService: {
          ...state.reviewsByService,
          [action.serviceId]: {
            data: current.filter((review) => review.id !== action.reviewId),
            status: "success",
          },
        },
      };
    }
    case "SET_PURCHASE_ELIGIBILITY":
      return {
        ...state,
        purchasesEligibility: {
          ...state.purchasesEligibility,
          [action.userId]: {
            ...(state.purchasesEligibility[action.userId] ?? {}),
            [action.serviceId]: action.eligible,
          },
        },
      };
    default:
      return state;
  }
}

const initialState: ServicesState = {
  categories: idleResource<Category[]>([]),
  servicesByCategory: {},
  providers: {},
  reviewsByService: {},
  purchasesEligibility: {},
  serviceIndex: {},
};

function buildAggregate(state: ServicesState, providerId: string): ProviderAggregate {
  const services = Object.values(state.servicesByCategory)
    .flatMap((entry) => entry.data)
    .filter((service) => service.providerId === providerId);

  const allReviews = services.flatMap((service) =>
    state.reviewsByService[service.id]?.data ?? []
  );

  if (allReviews.length === 0) {
    return {
      providerId,
      averageRating: 0,
      totalReviews: 0,
    };
  }

  const total = allReviews.reduce((sum, review) => sum + review.rating, 0);
  const average = total / allReviews.length;

  return {
    providerId,
    averageRating: Math.round(average * 10) / 10,
    totalReviews: allReviews.length,
  };
}

export const ServicesProvider = ({ children }: { children: ReactNode }) => {
  const { authState } = useAuth();
  const [state, dispatch] = useReducer(servicesReducer, initialState);
  const [myServices, setMyServices] = useState<ManagedService[]>([]);
  const [myServicesLoading, setMyServicesLoading] = useState(false);

  const currentPlan = useMemo<PlanType>(() => {
    const userPlan =
      authState?.user?.plan ??
      authState?.user?.subscriptionPlan ??
      authState?.user?.subscription?.plan ??
      authState?.user?.membership?.name ??
      authState?.user?.planType;

    if (!userPlan || typeof userPlan !== "string") {
      return "FREE";
    }

    const normalized = userPlan.toLowerCase();
    if (
      normalized.includes("plus") ||
      normalized.includes("premium") ||
      normalized === "pro"
    ) {
      return "PLUS";
    }

    return "FREE";
  }, [authState?.user]);

  const fetchCategoriesAction = useCallback(async () => {
    if (state.categories.status === "loading") {
      return;
    }

    dispatch({ type: "CATEGORIES_REQUEST" });
    try {
      const categories = await fetchCategories();
      dispatch({ type: "CATEGORIES_SUCCESS", payload: categories });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudieron cargar las categorías";
      dispatch({ type: "CATEGORIES_FAILURE", error: message });
    }
  }, [state.categories.status]);

  const fetchServicesAction = useCallback(
    async (categoryId: string) => {
      const current = state.servicesByCategory[categoryId];
      if (current?.status === "loading") {
        return;
      }

      dispatch({ type: "SERVICES_REQUEST", categoryId });
      try {
        const services = await fetchServicesByCategory(categoryId);
        dispatch({ type: "SERVICES_SUCCESS", categoryId, services });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "No se pudieron cargar los servicios";
        dispatch({ type: "SERVICES_FAILURE", categoryId, error: message });
      }
    },
    [state.servicesByCategory]
  );

  const fetchProviderAction = useCallback(
    async (providerId: string) => {
      const current = state.providers[providerId];
      if (current?.status === "loading" || current?.status === "success") {
        return current.data;
      }

      dispatch({ type: "PROVIDER_REQUEST", providerId });
      try {
        const provider = await fetchProviderById(providerId);
        dispatch({ type: "PROVIDER_SUCCESS", provider });
        return provider;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "No se pudo cargar el perfil";
        dispatch({ type: "PROVIDER_FAILURE", providerId, error: message });
        return undefined;
      }
    },
    [state.providers]
  );

  const fetchReviewsAction = useCallback(
    async (serviceId: string) => {
      const current = state.reviewsByService[serviceId];
      if (current?.status === "loading") {
        return current.data ?? [];
      }

      dispatch({ type: "REVIEWS_REQUEST", serviceId });
      try {
        const reviews = await fetchServiceReviews(serviceId);
        dispatch({ type: "REVIEWS_SUCCESS", serviceId, reviews });
        return reviews;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "No se pudieron cargar las reseñas";
        dispatch({ type: "REVIEWS_FAILURE", serviceId, error: message });
        return state.reviewsByService[serviceId]?.data ?? [];
      }
    },
    [state.reviewsByService]
  );

  const ensureEligibility = useCallback(
    async (serviceId: string, userId: string) => {
      const cached = state.purchasesEligibility[userId]?.[serviceId];
      if (typeof cached === "boolean") {
        return cached;
      }

      try {
        const purchases = await fetchUserPurchases(userId, serviceId);
        const eligible = purchases.some((purchase) =>
          ["paid", "completed"].includes(purchase.status)
        );
        dispatch({
          type: "SET_PURCHASE_ELIGIBILITY",
          serviceId,
          userId,
          eligible,
        });
        return eligible;
      } catch (error) {
        dispatch({
          type: "SET_PURCHASE_ELIGIBILITY",
          serviceId,
          userId,
          eligible: false,
        });
        return false;
      }
    },
    [state.purchasesEligibility]
  );

  const addReviewWithRating = useCallback(
    async (input: ReviewInput) => {
      if (input.rating < 1 || input.rating > 5) {
        throw new Error("La calificación debe estar entre 1 y 5 estrellas");
      }

      const eligible = await ensureEligibility(input.serviceId, input.userId);
      if (!eligible) {
        const error = new Error(
          "Solo los usuarios que contrataron el servicio pueden dejar una reseña"
        );
        (error as Error & { code?: string }).code = "NOT_ELIGIBLE";
        throw error;
      }

      const optimisticId = `tmp-${Date.now()}`;
      const optimisticReview: ServiceReview = {
        id: optimisticId,
        serviceId: input.serviceId,
        userId: input.userId,
        userName: input.userName,
        comment: input.comment,
        rating: input.rating,
        createdAt: new Date().toISOString(),
        optimistic: true,
      };

      dispatch({ type: "ADD_REVIEW_OPTIMISTIC", review: optimisticReview });

      try {
        const created = await createServiceReview(input.serviceId, input);
        dispatch({
          type: "REPLACE_REVIEW",
          serviceId: input.serviceId,
          tempId: optimisticId,
          review: created,
        });
        return created;
      } catch (error) {
        dispatch({
          type: "REMOVE_REVIEW",
          serviceId: input.serviceId,
          reviewId: optimisticId,
        });
        throw error;
      }
    },
    [ensureEligibility]
  );

  const getServicesForCategory = useCallback(
    (categoryId: string) => state.servicesByCategory[categoryId]?.data ?? [],
    [state.servicesByCategory]
  );

  const getServiceById = useCallback(
    (serviceId: string) => state.serviceIndex[serviceId],
    [state.serviceIndex]
  );

  const getProviderAggregate = useCallback(
    (providerId: string) => buildAggregate(state, providerId),
    [state]
  );

  const getReviewStatus = useCallback(
    (serviceId: string) => state.reviewsByService[serviceId]?.status ?? "idle",
    [state.reviewsByService]
  );

  const getServicesStatus = useCallback(
    (categoryId: string) => state.servicesByCategory[categoryId]?.status ?? "idle",
    [state.servicesByCategory]
  );

  const isUserEligibleForReview = useCallback(
    (serviceId: string, userId: string) => ensureEligibility(serviceId, userId),
    [ensureEligibility]
  );

  const loadMyServices = useCallback(async () => {
    setMyServicesLoading(true);
    try {
      const services = await getMyServices();
      setMyServices(services);
    } finally {
      setMyServicesLoading(false);
    }
  }, []);

  const addService = useCallback(
    async (payload: ServicePayload) => {
      if (currentPlan === "FREE" && myServices.length >= 1) {
        const error = new Error("PLAN_LIMIT_REACHED");
        throw error;
      }

      const created = await createMyService(payload);
      setMyServices((prev) => [...prev, created]);
      return created;
    },
    [currentPlan, myServices.length]
  );

  const editService = useCallback(
    async (id: string, updates: Partial<ServicePayload>) => {
      const updated = await updateMyService(id, updates);
      setMyServices((prev) => prev.map((service) => (service.id === id ? updated : service)));
      return updated;
    },
    []
  );

  const removeService = useCallback(async (id: string) => {
    await deleteMyService(id);
    setMyServices((prev) => prev.filter((service) => service.id !== id));
  }, []);

  useEffect(() => {
    loadMyServices().catch(() => undefined);
  }, [loadMyServices]);

  const value = useMemo<ServicesContextValue>(
    () => ({
      categories: state.categories.data,
      categoriesStatus: state.categories.status,
      categoriesError: state.categories.error,
      servicesByCategory: Object.fromEntries(
        Object.entries(state.servicesByCategory).map(([key, resource]) => [
          key,
          resource.data,
        ])
      ),
      providers: Object.fromEntries(
        Object.entries(state.providers).map(([key, resource]) => [
          key,
          resource.data,
        ])
      ),
      reviewsByService: Object.fromEntries(
        Object.entries(state.reviewsByService).map(([key, resource]) => [
          key,
          resource.data,
        ])
      ),
      fetchCategories: fetchCategoriesAction,
      fetchServicesByCategory: fetchServicesAction,
      fetchProviderProfile: fetchProviderAction,
      fetchServiceReviews: fetchReviewsAction,
      addReviewWithRating,
      getServicesForCategory,
      getServiceById,
      getProviderAggregate,
      getReviewStatus,
      getServicesStatus,
      isUserEligibleForReview,
      myServices,
      myServicesLoading,
      currentPlan,
      loadMyServices,
      addService,
      editService,
      removeService,
    }),
    [
      state,
      fetchCategoriesAction,
      fetchServicesAction,
      fetchProviderAction,
      fetchReviewsAction,
      addReviewWithRating,
      getServicesForCategory,
      getServiceById,
      getProviderAggregate,
      getReviewStatus,
      getServicesStatus,
      isUserEligibleForReview,
      myServices,
      myServicesLoading,
      currentPlan,
      loadMyServices,
      addService,
      editService,
      removeService,
    ]
  );

  return <ServicesContext.Provider value={value}>{children}</ServicesContext.Provider>;
};

export const useServices = () => {
  const context = useContext(ServicesContext);
  if (!context) {
    throw new Error("useServices debe usarse dentro de ServicesProvider");
  }
  return context;
};
