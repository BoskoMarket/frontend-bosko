export type Keyword = string;

export interface Photo {
  id: string;
  uri: string;
  description?: string;
}

export interface Service {
  id: string;
  userId: string;
  name: string;
  description: string;
  price?: number;
  area: string;
  availability: string;
  keywords: Keyword[];
  photos: Photo[];
  rating?: number;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  zone: string;
}

export interface SearchResult {
  user: User;
  service?: Service;
  score: number;
}

export interface Repository {
  listUsers(): Promise<User[]>;
  getUserById(id: string): Promise<User | undefined>;
  listServices(): Promise<Service[]>;
  getServiceByUserId(userId: string): Promise<Service | undefined>;
  createOrUpdateService(service: Omit<Service, "id"> & { id?: string }): Promise<Service>;
  deleteService(serviceId: string): Promise<void>;
  updateUser(user: User): Promise<User>;
  searchEntities(query: string): Promise<SearchResult[]>;
}
