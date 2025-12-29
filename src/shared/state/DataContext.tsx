// import React, {
//   createContext,
//   ReactNode,
//   useCallback,
//   useContext,
//   useMemo,
//   useState,
// } from "react";
// import { apiClient } from "@/src/shared/api/client";
// import {
//   SearchResult,
//   ServiceProvider,
//   ServiceProviderInput,
//   User,
// } from "@/src/types";
// import { SERVICE_PROVIDERS } from "@/features/servicesUser/constants/serviceProviders";

// interface SearchState {
//   status: "idle" | "typing" | "done" | "empty";
//   query: string;
//   results: SearchResult[];
//   runSearch: (query: string) => Promise<void>;
// }

// interface ServiceManager {
//   service?: ServiceProvider;
//   createOrUpdate: (payload: ServiceProviderInput) => Promise<ServiceProvider>;
//   remove: () => Promise<void>;
//   refresh: () => Promise<void>;
// }

// interface CurrentUserState {
//   user?: User;
//   refresh: () => Promise<void>;
//   update: (updates: Partial<User>) => Promise<User | undefined>;
// }

// interface BoskoDataContextValue {
//   currentUserId: string;
//   search: SearchState;
//   serviceManager: ServiceManager;
//   currentUser: CurrentUserState;
//   getProfile: (
//     userId: string
//   ) => Promise<{ user?: User; service?: ServiceProvider }>;
// }

// const BoskoDataContext = createContext<BoskoDataContextValue | undefined>(
//   undefined
// );

// const DEFAULT_USER_ID = SERVICE_PROVIDERS[0]?.id ?? "provider-1";

// export const BoskoDataProvider = ({ children }: { children: ReactNode }) => {
//   const currentUserId = DEFAULT_USER_ID;
//   const [searchState, setSearchState] = useState<
//     Omit<SearchState, "runSearch">
//   >({
//     status: "idle",
//     query: "",
//     results: [],
//   });
//   const [service, setService] = useState<ServiceProvider | undefined>();
//   const [user, setUser] = useState<User | undefined>();

//   const loadCurrentUser = useCallback(async () => {
//     const [userData, serviceData] = await Promise.all([
//       apiClient.getUser(currentUserId),
//       apiClient.getServiceByUser(currentUserId),
//     ]);
//     setUser(userData);
//     setService(serviceData);
//   }, [currentUserId]);

//   React.useEffect(() => {
//     loadCurrentUser().catch(console.error);
//   }, [loadCurrentUser]);

//   const runSearch = useCallback(async (query: string) => {
//     if (!query.trim()) {
//       setSearchState({ status: "idle", query: "", results: [] });
//       return;
//     }
//     setSearchState((prev) => ({ ...prev, status: "typing", query }));
//     try {
//       const results = await apiClient.search(query);
//       setSearchState({
//         status: results.length ? "done" : "empty",
//         query,
//         results,
//       });
//     } catch (error) {
//       console.error("Search failed", error);
//       setSearchState({ status: "empty", query, results: [] });
//     }
//   }, []);

//   const createOrUpdate = useCallback(
//     async (payload: ServiceProviderInput) => {
//       const servicePayload = await apiClient.saveService(
//         currentUserId,
//         payload
//       );
//       setService(servicePayload);
//       return servicePayload;
//     },
//     [currentUserId]
//   );

//   const remove = useCallback(async () => {
//     if (!service) return;
//     await apiClient.deleteService(currentUserId);
//     setService(undefined);
//   }, [currentUserId, service]);

//   const refreshService = useCallback(async () => {
//     const fresh = await apiClient.getServiceByUser(currentUserId);
//     setService(fresh);
//   }, [currentUserId]);

//   const refreshUser = useCallback(async () => {
//     const fresh = await apiClient.getUser(currentUserId);
//     setUser(fresh);
//   }, [currentUserId]);

//   const updateUser = useCallback(
//     async (updates: Partial<User>) => {
//       if (!user) return undefined;
//       const updated = await apiClient.updateUser({ ...user, ...updates });
//       setUser(updated);
//       return updated;
//     },
//     [user]
//   );

//   const getProfile = useCallback(async (userId: string) => {
//     const [profileUser, profileService] = await Promise.all([
//       apiClient.getUser(userId),
//       apiClient.getServiceByUser(userId),
//     ]);
//     return { user: profileUser, service: profileService };
//   }, []);

//   const value: BoskoDataContextValue = useMemo(
//     () => ({
//       currentUserId,
//       search: { ...searchState, runSearch },
//       serviceManager: {
//         service,
//         createOrUpdate,
//         remove,
//         refresh: refreshService,
//       },
//       currentUser: { user, refresh: refreshUser, update: updateUser },
//       getProfile,
//     }),
//     [
//       currentUserId,
//       searchState,
//       runSearch,
//       service,
//       createOrUpdate,
//       remove,
//       refreshService,
//       user,
//       refreshUser,
//       updateUser,
//       getProfile,
//     ]
//   );

//   return (
//     <BoskoDataContext.Provider value={value}>
//       {children}
//     </BoskoDataContext.Provider>
//   );
// };

// export const useBoskoData = () => {
//   const ctx = useContext(BoskoDataContext);
//   if (!ctx) {
//     throw new Error("useBoskoData must be used inside BoskoDataProvider");
//   }
//   return ctx;
// };
