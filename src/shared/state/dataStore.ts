import { Repository, SearchResult, Service, User } from "@/src/types";
import { rankResults } from "@/src/shared/utils/ranking";

const usersSeed: User[] = [
  {
    id: "u-1",
    name: "María Plomera",
    avatar: "https://placehold.co/96x96",
    bio: "Plomería eficiente para hogares y oficinas.",
    zone: "CABA",
  },
  {
    id: "u-2",
    name: "Bosko Jardinería",
    avatar: "https://placehold.co/96x96?text=J",
    bio: "Mantenimiento de parques con conciencia ambiental.",
    zone: "GBA Norte",
  },
  {
    id: "u-3",
    name: "Electricista Ana",
    avatar: "https://placehold.co/96x96?text=E",
    bio: "Instalaciones seguras y auditorías rápidas.",
    zone: "GBA Sur",
  },
];

const servicesSeed: Service[] = [
  {
    id: "s-1",
    userId: "u-1",
    name: "Reparaciones Express",
    description: "Urgencias de plomería en menos de 2hs.",
    price: 25000,
    area: "CABA",
    availability: "Lun-Dom",
    keywords: ["plomería", "urgente", "hogar"],
    rating: 4.9,
    photos: [
      { id: "p-1", uri: "https://placehold.co/400x200?text=plomeria" },
      { id: "p-2", uri: "https://placehold.co/400x200?text=grifos" },
    ],
  },
  {
    id: "s-2",
    userId: "u-2",
    name: "Jardines Urbanos",
    description: "Diseño de terrazas verdes y mantenimiento.",
    price: 18000,
    area: "GBA Norte",
    availability: "Lun-Vie",
    keywords: ["jardinería", "paisajismo"],
    rating: 4.7,
    photos: [
      { id: "p-3", uri: "https://placehold.co/400x200?text=jardin" },
    ],
  },
];

const clone = <T,>(value: T): T =>
  value === undefined ? (value as T) : JSON.parse(JSON.stringify(value));

export class InMemoryRepository implements Repository {
  private users: User[];
  private services: Service[];

  constructor(users: User[] = usersSeed, services: Service[] = servicesSeed) {
    this.users = clone(users);
    this.services = clone(services);
  }

  async listUsers() {
    return clone(this.users);
  }

  async getUserById(id: string) {
    return clone(this.users.find((user) => user.id === id));
  }

  async listServices() {
    return clone(this.services);
  }

  async getServiceByUserId(userId: string) {
    return clone(this.services.find((service) => service.userId === userId));
  }

  async createOrUpdateService(serviceInput: Omit<Service, "id"> & { id?: string }) {
    const id = serviceInput.id ?? `s-${Date.now()}`;
    const service: Service = { ...serviceInput, id };
    const existingIndex = this.services.findIndex((s) => s.id === id);

    if (existingIndex >= 0) {
      this.services[existingIndex] = service;
    } else {
      const serviceByUser = this.services.find((s) => s.userId === service.userId);
      if (serviceByUser) {
        this.services = this.services.map((s) =>
          s.userId === service.userId ? { ...service, id: s.id } : s
        );
      } else {
        this.services.push(service);
      }
    }
    return clone(service);
  }

  async deleteService(serviceId: string) {
    this.services = this.services.filter((service) => service.id !== serviceId);
  }

  async updateUser(user: User) {
    this.users = this.users.map((u) => (u.id === user.id ? user : u));
    return clone(user);
  }

  async searchEntities(query: string): Promise<SearchResult[]> {
    const users = await this.listUsers();
    const services = await this.listServices();
    return rankResults(users, services, query);
  }
}

export const repository = new InMemoryRepository();
