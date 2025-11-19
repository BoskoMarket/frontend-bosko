import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { apiClient } from "@/src/shared/api/client";
import { SearchResult, Service, User } from "@/src/types";

interface SearchState {
  status: "idle" | "typing" | "done" | "empty";
  query: string;
  results: SearchResult[];
  runSearch: (query: string) => Promise<void>;
}

interface ServiceManager {
  service?: Service;
  createOrUpdate: (payload: Omit<Service, "id" | "userId">) => Promise<Service>;
  remove: () => Promise<void>;
  refresh: () => Promise<void>;
}

interface CurrentUserState {
  user?: User;
  refresh: () => Promise<void>;
  update: (updates: Partial<User>) => Promise<User | undefined>;
}

interface BoskoDataContextValue {
  currentUserId: string;
  search: SearchState;
  serviceManager: ServiceManager;
  currentUser: CurrentUserState;
  getProfile: (userId: string) => Promise<{ user?: User; service?: Service }>;
}

const BoskoDataContext = createContext<BoskoDataContextValue | undefined>(undefined);

export const BoskoDataProvider = ({ children }: { children: ReactNode }) => {
  const currentUserId = "u-1";
  const [searchState, setSearchState] = useState<Omit<SearchState, "runSearch">>({
    status: "idle",
    query: "",
    results: [],
  });
  const [service, setService] = useState<Service | undefined>();
  const [user, setUser] = useState<User | undefined>();

  const loadCurrentUser = useCallback(async () => {
    const [userData, serviceData] = await Promise.all([
      apiClient.getUser(currentUserId),
      apiClient.getServiceByUser(currentUserId),
    ]);
    setUser(userData);
    setService(serviceData);
  }, [currentUserId]);

  React.useEffect(() => {
    loadCurrentUser().catch(console.error);
  }, [loadCurrentUser]);

  const runSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchState({ status: "idle", query: "", results: [] });
      return;
    }
    setSearchState((prev) => ({ ...prev, status: "typing", query }));
    const results = await apiClient.search(query);
    setSearchState({
      status: results.length ? "done" : "empty",
      query,
      results,
    });
  }, []);

  const createOrUpdate = useCallback(
    async (payload: Omit<Service, "id" | "userId">) => {
      const servicePayload = await apiClient.saveService({ ...payload, userId: currentUserId });
      setService(servicePayload);
      return servicePayload;
    },
    [currentUserId]
  );

  const remove = useCallback(async () => {
    if (!service) return;
    await apiClient.deleteService(service.id);
    setService(undefined);
  }, [service]);

  const refreshService = useCallback(async () => {
    const fresh = await apiClient.getServiceByUser(currentUserId);
    setService(fresh);
  }, [currentUserId]);

  const refreshUser = useCallback(async () => {
    const fresh = await apiClient.getUser(currentUserId);
    setUser(fresh);
  }, [currentUserId]);

  const updateUser = useCallback(
    async (updates: Partial<User>) => {
      if (!user) return undefined;
      const updated = await apiClient.updateUser({ ...user, ...updates });
      setUser(updated);
      return updated;
    },
    [user]
  );

  const getProfile = useCallback(async (userId: string) => {
    const [profileUser, profileService] = await Promise.all([
      apiClient.getUser(userId),
      apiClient.getServiceByUser(userId),
    ]);
    return { user: profileUser, service: profileService };
  }, []);

  const value: BoskoDataContextValue = useMemo(
    () => ({
      currentUserId,
      search: { ...searchState, runSearch },
      serviceManager: { service, createOrUpdate, remove, refresh: refreshService },
      currentUser: { user, refresh: refreshUser, update: updateUser },
      getProfile,
    }),
    [
      currentUserId,
      searchState,
      runSearch,
      service,
      createOrUpdate,
      remove,
      refreshService,
      user,
      refreshUser,
      updateUser,
      getProfile,
    ]
  );

  return <BoskoDataContext.Provider value={value}>{children}</BoskoDataContext.Provider>;
};

export const useBoskoData = () => {
  const ctx = useContext(BoskoDataContext);
  if (!ctx) {
    throw new Error("useBoskoData must be used inside BoskoDataProvider");
  }
  return ctx;
};
