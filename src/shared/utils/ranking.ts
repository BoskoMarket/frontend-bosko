import { SearchResult, Service, User } from "@/src/types";
import { includes, normalize } from "./string";

const scoreNameMatch = (user: User, query: string) =>
  includes(user.name, query) ? 3 : 0;

const scoreServiceMatch = (service: Service | undefined, query: string) => {
  if (!service) return 0;
  if (includes(service.name, query)) return 2;
  if (includes(service.description, query)) return 1.5;
  if (service.keywords.some((k) => includes(k, query))) return 1;
  return 0;
};

export const rankResults = (
  users: User[],
  services: Service[],
  query: string
): SearchResult[] => {
  if (!query.trim()) return [];
  const q = normalize(query);
  return users
    .map((user) => {
      const service = services.find((s) => s.userId === user.id);
      const score = scoreNameMatch(user, q) + scoreServiceMatch(service, q);
      return { user, service, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.user.name.localeCompare(b.user.name));
};
