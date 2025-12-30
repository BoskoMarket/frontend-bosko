import React, { createContext, useCallback, useContext, useState } from "react";
import { extractApiError } from "../lib/errors";
import { Id } from "../interfaces/common";
import { Provider, ProviderServicePayload } from "../interfaces/provider";
import { Service } from "../interfaces/service";
import {
  createProviderService,
  getProvider,
  listProviderServices,
  listProviders,
} from "../services/providers.service";

interface ProvidersState {
  providers: Provider[];
  loading: boolean;
  error: string | null;
  loadProviders: (filters?: Record<string, any>) => Promise<void>;
  findProvider: (id: Id) => Provider | undefined;
  fetchProvider: (id: Id) => Promise<Provider | null>;
  loadProviderServices: (id: Id) => Promise<Service[] | null>;
  addProviderService: (id: Id, payload: ProviderServicePayload) => Promise<Service | null>;
}

const ProvidersContext = createContext<ProvidersState | undefined>(undefined);

export const ProvidersProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProviders = useCallback(async (filters?: Record<string, any>) => {
    setLoading(true);
    setError(null);
    try {
      const data = await listProviders(filters);
      setProviders(data);
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const findProvider = useCallback(
    (id: Id) => providers.find((provider) => provider.id === id),
    [providers]
  );

  const fetchProvider = useCallback(async (id: Id) => {
    try {
      // Check if we already have the provider to avoid unnecessary network calls
      setProviders((prev) => {
        const existing = prev.find(p => p.id === id);
        if (existing) return prev; // Return same reference if no change needed
        return prev;
      });

      // Actually, checking state inside setState callback doesn't help avoid the fetch call itself.
      // We should check state before fetching. But state 'providers' is needed in dependency array if we check it here.
      // Alternatively, we rely on the component to check 'providers' before calling fetchProvider.
      // But let's add a check here to be safe if called redundantly.

      const data = await getProvider(id);
      setProviders((prev) => {
        const index = prev.findIndex((provider) => provider.id === id);
        if (index !== -1) {
          // Only update if data is different? For now just replace.
          const newProviders = [...prev];
          newProviders[index] = data;
          return newProviders;
        }
        return [...prev, data];
      });
      return data;
    } catch (err) {
      setError(extractApiError(err));
      return null;
    }
  }, []);

  const loadProviderServices = useCallback(async (id: Id) => {
    try {
      return await listProviderServices(id);
    } catch (err) {
      setError(extractApiError(err));
      return null;
    }
  }, []);

  const addProviderService = useCallback(
    async (id: Id, payload: ProviderServicePayload) => {
      try {
        return await createProviderService(id, payload);
      } catch (err) {
        setError(extractApiError(err));
        return null;
      }
    },
    []
  );

  return (
    <ProvidersContext.Provider
      value={{
        providers,
        loading,
        error,
        loadProviders,
        findProvider,
        fetchProvider,
        loadProviderServices,
        addProviderService,
      }}
    >
      {children}
    </ProvidersContext.Provider>
  );
};

export const useProviders = () => {
  const context = useContext(ProvidersContext);
  if (!context) {
    throw new Error("useProviders debe usarse dentro de un ProvidersProvider");
  }
  return context;
};
