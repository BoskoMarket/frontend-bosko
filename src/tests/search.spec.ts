import { rankResults } from "@/src/shared/utils/ranking";
import { ServiceProvider, User } from "@/src/types";

const baseService = (overrides: Partial<ServiceProvider>): ServiceProvider => ({
  id: "provider",
  categoryId: "custom",
  name: "Nombre",
  title: "Servicio",
  summary: "Resumen",
  rating: 5,
  reviews: 10,
  location: "CABA",
  rate: { amount: 10, currency: "USD", unit: "hora" },
  avatar: "https://placehold.co/96x96",
  photo: "https://placehold.co/400x200",
  heroImage: "https://placehold.co/600x300",
  bio: "Bio",
  tags: ["custom"],
  recentWorks: [
    {
      id: "work-1",
      title: "Trabajo 1",
      image: "https://placehold.co/200",
      timeAgo: "1 semana",
    },
  ],
  ...overrides,
});

describe("rankResults", () => {
  const users: User[] = [
    { id: "ana", name: "Ana", avatar: "", bio: "", zone: "" },
    { id: "bruno", name: "Bruno", avatar: "", bio: "", zone: "" },
  ];
  const services: ServiceProvider[] = [
    baseService({
      id: "ana",
      name: "Ana",
      title: "Clases de Yoga",
      summary: "Yoga en casa",
      tags: ["yoga"],
    }),
    baseService({
      id: "bruno",
      name: "Bruno",
      title: "Jardinería",
      summary: "Cuidado de plantas",
      tags: ["plantas"],
    }),
  ];

  it("prioriza coincidencia en nombre de usuario", () => {
    const results = rankResults(users, services, "ana");
    expect(results[0].user.name).toBe("Ana");
  });

  it("devuelve vacío si no hay coincidencias", () => {
    expect(rankResults(users, services, "zzz")).toEqual([]);
  });
});
