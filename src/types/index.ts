import { ServiceProvider } from "@/features/servicesUser/constants/serviceProviders";

export type { ServiceProvider };

export interface Photo {
  id: string;
  uri: string;
  description?: string;
}

export type ServiceProviderInput = Omit<ServiceProvider, "id"> & { id?: string };

export interface User {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  zone: string;
}

export interface SearchResult {
  user: User;
  service?: ServiceProvider;
  score: number;
}

export interface Repository {
  listUsers(): Promise<User[]>;
  getUserById(id: string): Promise<User | undefined>;
  listServices(): Promise<ServiceProvider[]>;
  getServiceByUserId(userId: string): Promise<ServiceProvider | undefined>;
  createOrUpdateService(userId: string, service: ServiceProviderInput): Promise<ServiceProvider>;
  deleteService(userId: string): Promise<void>;
  updateUser(user: User): Promise<User>;
  searchEntities(query: string): Promise<SearchResult[]>;
}
