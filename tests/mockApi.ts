import { ENDPOINTS } from "@/services/api";
import type {
  Category,
  Provider,
  Purchase,
  Review,
  Service,
} from "@/types/services";

interface MockDatabase {
  categories: Category[];
  services: Service[];
  providers: Provider[];
  reviews: Review[];
  purchases: Purchase[];
}

const createInitialDb = (): MockDatabase => ({
  categories: [
    {
      id: "cat-1",
      title: "Hogar",
      description: "Reparaciones y mantenimiento",
      accent: "#FEE2E2",
      icon: "🏠",
      servicesCount: 2,
    },
    {
      id: "cat-2",
      title: "Jardín",
      description: "Cuidado de espacios verdes",
      accent: "#DCFCE7",
      icon: "🌿",
      servicesCount: 1,
    },
  ],
  providers: [
    {
      id: "provider-1",
      name: "María López",
      title: "Electricista profesional",
      bio: "Experta en instalaciones eléctricas seguras y eficientes.",
      summary: "Ayudo a que tu hogar sea más seguro con instalaciones certificadas.",
      location: "Buenos Aires",
      avatar: "https://example.com/avatar-1.png",
      heroImage: "https://example.com/hero-1.jpg",
      tags: ["Electricidad", "Instalaciones", "Urgencias"],
      rate: { currency: "ARS", amount: 4500, unit: "hora" },
      specialties: ["Instalaciones", "Tableros"],
    },
    {
      id: "provider-2",
      name: "Carlos Pérez",
      title: "Jardinero urbano",
      bio: "Diseño y mantengo jardines en espacios reducidos.",
      summary: "Transformo balcones y terrazas en oasis verdes.",
      location: "Córdoba",
      avatar: "https://example.com/avatar-2.png",
      heroImage: "https://example.com/hero-2.jpg",
      tags: ["Paisajismo", "Huertas"],
      rate: { currency: "ARS", amount: 3800, unit: "hora" },
      specialties: ["Huertas", "Riego"],
    },
  ],
  services: [
    {
      id: "service-1",
      categoryId: "cat-1",
      providerId: "provider-1",
      title: "Instalación de luminarias",
      description: "Colocación y reemplazo de lámparas y plafones en el hogar.",
      providerName: "María López",
      rate: { currency: "ARS", amount: 4500, unit: "hora" },
      location: "Buenos Aires",
      thumbnail: "https://example.com/service-1.jpg",
      rating: 4.5,
      reviewsCount: 2,
    },
    {
      id: "service-2",
      categoryId: "cat-1",
      providerId: "provider-1",
      title: "Mantenimiento eléctrico",
      description: "Revisión general y detección de fallas en instalaciones.",
      providerName: "María López",
      rate: { currency: "ARS", amount: 6000, unit: "servicio" },
      location: "Buenos Aires",
      thumbnail: "https://example.com/service-2.jpg",
      rating: 4.8,
      reviewsCount: 1,
    },
    {
      id: "service-3",
      categoryId: "cat-2",
      providerId: "provider-2",
      title: "Diseño de jardín urbano",
      description: "Planificación y ejecución de jardines en balcones.",
      providerName: "Carlos Pérez",
      rate: { currency: "ARS", amount: 5200, unit: "proyecto" },
      location: "Córdoba",
      thumbnail: "https://example.com/service-3.jpg",
      rating: 4.9,
      reviewsCount: 0,
    },
  ],
  reviews: [
    {
      id: "review-1",
      serviceId: "service-1",
      userId: "user-1",
      userName: "Laura",
      rating: 5,
      comment: "Excelente trabajo y muy prolija.",
      createdAt: new Date("2024-05-10T10:00:00Z").toISOString(),
    },
    {
      id: "review-2",
      serviceId: "service-1",
      userId: "user-3",
      userName: "Federico",
      rating: 4,
      comment: "Llegó a tiempo y resolvió el problema.",
      createdAt: new Date("2024-05-12T14:30:00Z").toISOString(),
    },
  ],
  purchases: [
    {
      id: "purchase-1",
      serviceId: "service-1",
      userId: "user-1",
      status: "completed",
      purchasedAt: new Date("2024-05-05T09:00:00Z").toISOString(),
    },
    {
      id: "purchase-2",
      serviceId: "service-2",
      userId: "user-2",
      status: "pending",
      purchasedAt: new Date("2024-05-11T09:00:00Z").toISOString(),
    },
  ],
});

let dbState = createInitialDb();

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const resetDb = () => {
  dbState = createInitialDb();
};

export async function mockFetch(input: RequestInfo | URL, init?: RequestInit) {
  const url = typeof input === "string" ? new URL(input) : new URL(input.toString());
  const { pathname, searchParams } = url;
  const method = (init?.method ?? "GET").toUpperCase();

  await delay(1);

  if (pathname === new URL(ENDPOINTS.categories()).pathname && method === "GET") {
    return json(dbState.categories);
  }

  if (pathname === new URL(ENDPOINTS.servicesByCategory("dummy")).pathname && method === "GET") {
    const categoryId = searchParams.get("categoryId");
    const services = categoryId
      ? dbState.services.filter((service) => service.categoryId === categoryId)
      : dbState.services;
    return json(services);
  }

  if (pathname.startsWith(new URL(ENDPOINTS.providerById("dummy")).pathname.replace("dummy", "")) && method === "GET") {
    const providerId = pathname.split("/").pop();
    const provider = dbState.providers.find((item) => item.id === providerId);
    if (!provider) {
      return json({ message: "Provider not found" }, 404);
    }
    return json(provider);
  }

  if (pathname.includes("/reviews") && method === "GET") {
    const serviceId = pathname.split("/")[3];
    const reviews = dbState.reviews.filter((review) => review.serviceId === serviceId);
    return json(reviews);
  }

  if (pathname.includes("/reviews") && method === "POST") {
    const serviceId = pathname.split("/")[3];
    const body = init?.body ? JSON.parse(init.body as string) : {};
    const review: Review = {
      id: `review-${Date.now()}`,
      serviceId,
      userId: body.userId,
      userName: body.userName ?? "Usuario",
      rating: body.rating,
      comment: body.comment,
      createdAt: new Date().toISOString(),
    };
    dbState.reviews.push(review);
    return json(review, 201);
  }

  if (pathname.includes("/purchases") && method === "GET") {
    const segments = pathname.split("/");
    const userId = segments[segments.indexOf("users") + 1];
    const serviceId = searchParams.get("serviceId");
    const purchases = dbState.purchases.filter((purchase) => {
      const matchService = serviceId ? purchase.serviceId === serviceId : true;
      return purchase.userId === userId && matchService;
    });
    return json(purchases);
  }

  return json({ message: "Not found" }, 404);
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
