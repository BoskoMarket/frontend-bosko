import { repository } from "@/src/shared/state/dataStore";
import {
  Repository,
  SearchResult,
  ServiceProvider,
  ServiceProviderInput,
  User,
} from "@/src/types";

class ApiClient {
  constructor(private repo: Repository) {}

  search = (query: string): Promise<SearchResult[]> => this.repo.searchEntities(query);
  listUsers = (): Promise<User[]> => this.repo.listUsers();
  getUser = (id: string): Promise<User | undefined> => this.repo.getUserById(id);
  getServiceByUser = (userId: string): Promise<ServiceProvider | undefined> =>
    this.repo.getServiceByUserId(userId);
  saveService = (userId: string, service: ServiceProviderInput) =>
    this.repo.createOrUpdateService(userId, service);
  deleteService = (userId: string) => this.repo.deleteService(userId);
  updateUser = (user: User) => this.repo.updateUser(user);
}

export const apiClient = new ApiClient(repository);
