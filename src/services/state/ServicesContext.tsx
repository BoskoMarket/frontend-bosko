import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
  useCallback,
} from "react";
import { fetchAllServices, fetchServiceById } from "../services/services";
import {
  getMyServices,
  createService as createMyService,
  updateService as updateMyService,
  deleteService as deleteMyService,
  Service,
  ServicePayload,
  PlanType,
} from "../services/service";
import { useAuth } from "@/auth/state/AuthContext";

interface ServicesState {
  services: Service[];
  myServices: Service[];
  loading: boolean;
  myServicesLoading: boolean;
  currentPlan: PlanType;
  loadServices: (filters?: Record<string, any>) => Promise<void>;
  loadMyServices: () => Promise<void>;
  getService: (id: string) => Promise<Service | undefined>;
  addService: (service: ServicePayload) => Promise<Service>;
  editService: (
    id: string,
    updates: Partial<ServicePayload>
  ) => Promise<Service>;
  removeService: (id: string) => Promise<void>;
}

const ServicesContext = createContext<ServicesState | undefined>(undefined);

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

export const ServicesProvider = ({ children }: { children: ReactNode }) => {
  const { authState } = useAuth();
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

  const loadServices = useCallback(async (filters?: Record<string, any>) => {
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

  const editService = useCallback(
    async (id: string, updates: Partial<ServicePayload>) => {
      const updated = await updateMyService(id, updates);
      setMyServices((prev) => prev.map((s) => (s.id === id ? updated : s)));
      return updated;
    },
    []
  );

  const removeService = useCallback(async (id: string) => {
    await deleteMyService(id);
    setMyServices((prev) => prev.filter((s) => s.id !== id));
  }, []);

  useEffect(() => {
    loadMyServices().catch((err) => console.error(err));
  }, [loadMyServices]);

  const value: ServicesState = {
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
  };

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
