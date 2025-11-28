import { InMemoryRepository } from "@/src/shared/state/dataStore";
import { ServiceProviderInput } from "@/src/types";

const buildPayload = (overrides: Partial<ServiceProviderInput> = {}): ServiceProviderInput => ({
  id: overrides.id,
  categoryId: overrides.categoryId ?? "custom",
  name: overrides.name ?? "Test",
  title: overrides.title ?? "Servicio Test",
  summary: overrides.summary ?? "Desc",
  rating: overrides.rating ?? 5,
  reviews: overrides.reviews ?? 0,
  location: overrides.location ?? "CABA",
  rate:
    overrides.rate ?? {
      amount: 10,
      currency: "USD",
      unit: "hora",
    },
  avatar: overrides.avatar ?? "https://placehold.co/96x96",
  photo: overrides.photo ?? "https://placehold.co/400x200",
  heroImage: overrides.heroImage ?? "https://placehold.co/600x300",
  bio: overrides.bio ?? "Bio",
  tags: overrides.tags ?? ["custom"],
  recentWorks:
    overrides.recentWorks ??
    [
      {
        id: "work-1",
        title: "Trabajo",
        image: "https://placehold.co/200",
        timeAgo: "1 semana",
      },
    ],
});

describe("service CRUD", () => {
  it("crea, edita y elimina servicio único", async () => {
    const repo = new InMemoryRepository();
    const base = await repo.createOrUpdateService("custom-user", buildPayload());
    expect(base.title).toBe("Servicio Test");

    const updated = await repo.createOrUpdateService(
      "custom-user",
      buildPayload({ id: base.id, summary: "Nuevo" })
    );
    expect(updated.summary).toBe("Nuevo");

    await repo.deleteService("custom-user");
    const afterDelete = await repo.getServiceByUserId("custom-user");
    expect(afterDelete).toBeUndefined();
  });
});
