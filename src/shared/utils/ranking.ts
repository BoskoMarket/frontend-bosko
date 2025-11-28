import { SearchResult, ServiceProvider, User } from "@/src/types";
import { includes, normalize } from "./string";

const scoreNameMatch = (user: User, query: string) =>
  includes(user.name, query) ? 3 : 0;

const scoreServiceMatch = (service: ServiceProvider | undefined, query: string) => {
  if (!service) return 0;
  if (includes(service.title, query)) return 2.5;
  if (includes(service.summary, query)) return 1.5;
  if (service.tags.some((k) => includes(k, query))) return 1;
  if (includes(service.location, query)) return 0.75;
  if (includes(service.categoryId, query)) return 0.5;
  return 0;
};

export const rankResults = (
  users: User[],
  services: ServiceProvider[],
  query: string
): SearchResult[] => {
  if (!query.trim()) return [];
  const q = normalize(query);
  const servicesById = new Map(services.map((service) => [service.id, service]));
  return users
    .map((user) => {
      const service = servicesById.get(user.id);
      const score = scoreNameMatch(user, q) + scoreServiceMatch(service, q);
      return { user, service, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.user.name.localeCompare(b.user.name));
};
