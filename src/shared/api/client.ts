import { repository } from "@/src/shared/state/dataStore";
import { Repository, SearchResult, Service, User } from "@/src/types";

class ApiClient {
  constructor(private repo: Repository) {}

  search = (query: string): Promise<SearchResult[]> => this.repo.searchEntities(query);
  listUsers = (): Promise<User[]> => this.repo.listUsers();
  getUser = (id: string): Promise<User | undefined> => this.repo.getUserById(id);
  getServiceByUser = (userId: string): Promise<Service | undefined> =>
    this.repo.getServiceByUserId(userId);
  saveService = (service: Omit<Service, "id"> & { id?: string }) =>
    this.repo.createOrUpdateService(service);
  deleteService = (serviceId: string) => this.repo.deleteService(serviceId);
  updateUser = (user: User) => this.repo.updateUser(user);
}

export const apiClient = new ApiClient(repository);
