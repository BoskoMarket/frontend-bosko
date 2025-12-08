import type { Purchase, Review } from "@/types/services";

export const MOCK_REVIEWS: Review[] = [
  {
    id: "rev-ana-1",
    serviceId: "ana-rivera",
    userId: "user-001",
    userName: "Carla M.",
    userAvatar:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=160&q=80",
    rating: 5,
    comment:
      "Ana entregó el proyecto antes de tiempo y documentó cada decisión técnica.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
  },
  {
    id: "rev-ana-2",
    serviceId: "ana-rivera",
    userId: "user-002",
    userName: "Luciano P.",
    rating: 5,
    comment: "Gran comunicación y código prolijo. La recomiendo siempre.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 21).toISOString(),
  },
  {
    id: "rev-martin-1",
    serviceId: "martin-costa",
    userId: "user-003",
    userName: "Valeria G.",
    rating: 4,
    comment: "Solucionó los cortes de internet en casa en menos de una hora.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    id: "rev-lucia-1",
    serviceId: "lucia-ortega",
    userId: "user-001",
    userName: "Carla M.",
    rating: 5,
    comment: "El brandbook quedó impecable y listo para desarrollo.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
  },
  {
    id: "rev-fede-1",
    serviceId: "federica-suarez",
    userId: "user-004",
    userName: "Gonzalo R.",
    rating: 5,
    comment: "Duplicó los leads en dos semanas. Seguiremos trabajando juntos.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
];

export const MOCK_PURCHASES: Purchase[] = [
  {
    id: "purchase-1",
    serviceId: "ana-rivera",
    userId: "user-001",
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
  },
  {
    id: "purchase-2",
    serviceId: "ana-rivera",
    userId: "user-002",
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString(),
  },
  {
    id: "purchase-3",
    serviceId: "martin-costa",
    userId: "user-003",
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
  },
  {
    id: "purchase-4",
    serviceId: "lucia-ortega",
    userId: "user-001",
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 22).toISOString(),
  },
  {
    id: "purchase-5",
    serviceId: "federica-suarez",
    userId: "user-004",
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(),
  },
];
