import React, { createContext, useCallback, useContext, useState } from "react";
import { extractApiError } from "../lib/errors";
import { Id } from "../interfaces/common";
import { Service, ServicePayload, ServiceWithReviews } from "../interfaces/service";
import {
  createService,
  createServiceReview,
  deleteService,
  getService,
  listServiceReviews,
  listServices,
  updateService,
} from "../services/services.service";
import { CreateReviewDto, Review } from "../interfaces/review";

interface ServicesState {
  services: Service[];
  loading: boolean;
  error: string | null;
  loadServices: (filters?: Record<string, any>) => Promise<void>;
  findService: (id: Id) => Service | undefined;
  fetchService: (id: Id) => Promise<ServiceWithReviews | null>;
  addService: (payload: ServicePayload) => Promise<Service | null>;
  editService: (id: Id, payload: Partial<ServicePayload>) => Promise<Service | null>;
  removeService: (id: Id) => Promise<void>;
  loadReviews: (id: Id) => Promise<Review[] | null>;
  addReview: (id: Id, payload: CreateReviewDto) => Promise<Review | null>;
}

const ServicesContext = createContext<ServicesState | undefined>(undefined);

export const ServicesProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadServices = useCallback(async (filters?: Record<string, any>) => {
    setLoading(true);
    setError(null);
    try {
      const data = await listServices(filters);
      setServices(data);
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const findService = useCallback(
    (id: Id) => services.find((service) => service.id === id),
    [services]
  );

  const fetchService = useCallback(async (id: Id) => {
    try {
      const data = await getService(id);
      setServices((prev) => {
        const exists = prev.some((service) => service.id === id);
        if (exists) {
          return prev.map((service) => (service.id === id ? data : service));
        }
        return [...prev, data];
      });
      return data;
    } catch (err) {
      setError(extractApiError(err));
      return null;
    }
  }, []);

  const addService = useCallback(async (payload: ServicePayload) => {
    try {
      const created = await createService(payload);
      setServices((prev) => [created, ...prev]);
      return created;
    } catch (err) {
      setError(extractApiError(err));
      return null;
    }
  }, []);

  const editService = useCallback(
    async (id: Id, payload: Partial<ServicePayload>) => {
      try {
        const updated = await updateService(id, payload);
        setServices((prev) => prev.map((service) => (service.id === id ? updated : service)));
        return updated;
      } catch (err) {
        setError(extractApiError(err));
        return null;
      }
    },
    []
  );

  const removeService = useCallback(async (id: Id) => {
    try {
      await deleteService(id);
      setServices((prev) => prev.filter((service) => service.id !== id));
    } catch (err) {
      setError(extractApiError(err));
    }
  }, []);

  const loadReviews = useCallback(async (id: Id) => {
    try {
      return await listServiceReviews(id);
    } catch (err) {
      setError(extractApiError(err));
      return null;
    }
  }, []);

  const addReview = useCallback(async (id: Id, payload: CreateReviewDto) => {
    try {
      return await createServiceReview(id, payload);
    } catch (err) {
      setError(extractApiError(err));
      return null;
    }
  }, []);

  return (
    <ServicesContext.Provider
      value={{
        services,
        loading,
        error,
        loadServices,
        findService,
        fetchService,
        addService,
        editService,
        removeService,
        loadReviews,
        addReview,
      }}
    >
      {children}
    </ServicesContext.Provider>
  );
};

export const useServices = () => {
  const context = useContext(ServicesContext);
  if (!context) {
    throw new Error("useServices debe usarse dentro de un ServicesProvider");
  }
  return context;
};
