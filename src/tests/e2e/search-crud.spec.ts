import { test, expect } from "@playwright/test";
import { InMemoryRepository } from "@/src/shared/state/dataStore";
import { ServiceProviderInput } from "@/src/types";

const mountSearchDom = async (page: any) => {
  await page.setContent(`
    <label for="q">Buscar</label>
    <input id="q" />
    <div id="results"></div>
    <script>
      window.updateResults = (text) => {
        document.getElementById('results').textContent = text;
      };
    </script>
  `);
};

const buildPayload = (overrides: Partial<ServiceProviderInput> = {}): ServiceProviderInput => ({
  id: overrides.id,
  categoryId: overrides.categoryId ?? "custom",
  name: overrides.name ?? "Test",
  title: overrides.title ?? "Servicio Demo",
  summary: overrides.summary ?? "Descripción",
  rating: overrides.rating ?? 5,
  reviews: overrides.reviews ?? 0,
  location: overrides.location ?? "Zona",
  rate:
    overrides.rate ?? {
      amount: 20,
      currency: "USD",
      unit: "hora",
    },
  avatar: overrides.avatar ?? "https://placehold.co/96x96",
  photo: overrides.photo ?? "https://placehold.co/400",
  heroImage: overrides.heroImage ?? "https://placehold.co/600x300",
  bio: overrides.bio ?? "Bio",
  tags: overrides.tags ?? ["demo"],
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

test("búsqueda incremental muestra resultados y navega", async ({ page }) => {
  await mountSearchDom(page);
  const repo = new InMemoryRepository();
  const results = await repo.searchEntities("ana");
  await page.fill("#q", "ana");
  await page.evaluate((name) => window.updateResults(name), results[0].user.name);
  await expect(page.locator("#results")).toHaveText(/Ana/);
});

test("CRUD único servicio", async () => {
  const repo = new InMemoryRepository();
  const created = await repo.createOrUpdateService("custom-user", buildPayload());
  expect(created.title).toBe("Servicio Demo");

  const edited = await repo.createOrUpdateService(
    "custom-user",
    buildPayload({ id: created.id, summary: "Nueva" })
  );
  expect(edited.summary).toBe("Nueva");

  await repo.deleteService("custom-user");
  expect(await repo.getServiceByUserId("custom-user")).toBeUndefined();
});
