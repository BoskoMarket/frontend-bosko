
// import { Repository, SearchResult, ServiceProvider, User } from "@/src/types";
// import { rankResults } from "@/src/shared/utils/ranking";


// // const providerSeed: ServiceProvider[] = SERVICE_PROVIDERS.slice(0, 8);

// const usersSeed: User[] = providerSeed.map((provider) => ({
//   id: provider.id,
//   name: provider.name,
//   avatar: provider.avatar,
//   bio: provider.bio,
//   zone: provider.location,
// }));

// const servicesSeed: ServiceProvider[] = providerSeed.map((provider) => ({
//   ...provider,
// }));

// const clone = <T,>(value: T): T =>
//   value === undefined ? (value as T) : JSON.parse(JSON.stringify(value));

// export class InMemoryRepository implements Repository {
//   private users: User[];
//   private services: ServiceProvider[];

//   constructor(users: User[] = usersSeed, services: ServiceProvider[] = servicesSeed) {
//     this.users = clone(users);
//     this.services = clone(services);
//   }

//   async listUsers() {
//     return clone(this.users);
//   }

//   async getUserById(id: string) {
//     return clone(this.users.find((user) => user.id === id));
//   }

//   async listServices() {
//     return clone(this.services);
//   }

//   async getServiceByUserId(userId: string) {
//     return clone(this.services.find((service) => service.id === userId));
//   }

//   async createOrUpdateService(
//     userId: string,
//     serviceInput: Omit<ServiceProvider, "id"> & { id?: string }
//   ) {
//     const id = userId;
//     const service: ServiceProvider = { ...serviceInput, id };
//     const existingIndex = this.services.findIndex((s) => s.id === userId);

//     if (existingIndex >= 0) {
//       this.services[existingIndex] = service;
//     } else {
//       this.services.push(service);
//     }

//     if (!this.users.some((user) => user.id === userId)) {
//       this.users.push({
//         id: userId,
//         name: service.name,
//         avatar: service.avatar,
//         bio: service.bio,
//         zone: service.location,
//       });
//     }

//     return clone(service);
//   }

//   async deleteService(userId: string) {
//     this.services = this.services.filter((service) => service.id !== userId);
//   }

//   async updateUser(user: User) {
//     this.users = this.users.map((u) => (u.id === user.id ? user : u));
//     return clone(user);
//   }

//   async searchEntities(query: string): Promise<SearchResult[]> {
//     const users = await this.listUsers();
//     const services = await this.listServices();
//     return rankResults(users, services, query);
//   }
// }

// export const repository = new InMemoryRepository();
