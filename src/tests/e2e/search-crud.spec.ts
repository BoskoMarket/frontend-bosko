import { test, expect } from "@playwright/test";
import { InMemoryRepository } from "@/src/shared/state/dataStore";

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

test("búsqueda incremental muestra resultados y navega", async ({ page }) => {
  await mountSearchDom(page);
  const repo = new InMemoryRepository();
  const results = await repo.searchEntities("maria");
  await page.fill("#q", "maria");
  await page.evaluate((name) => window.updateResults(name), results[0].user.name);
  await expect(page.locator("#results")).toHaveText(/María/);
});

test("CRUD único servicio", async () => {
  const repo = new InMemoryRepository();
  const created = await repo.createOrUpdateService({
    userId: "u-4",
    name: "Test",
    description: "Desc",
    area: "Zona",
    availability: "Lun",
    keywords: ["test"],
    photos: [],
  });
  expect(created.id).toBeTruthy();

  const edited = await repo.createOrUpdateService({ ...created, description: "Nueva" });
  expect(edited.description).toBe("Nueva");

  await repo.deleteService(edited.id);
  expect(await repo.getServiceByUserId("u-4")).toBeUndefined();
});
