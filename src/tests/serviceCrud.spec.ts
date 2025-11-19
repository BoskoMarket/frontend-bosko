import { InMemoryRepository } from "@/src/shared/state/dataStore";

describe("service CRUD", () => {
  it("crea, edita y elimina servicio único", async () => {
    const repo = new InMemoryRepository();
    const base = await repo.createOrUpdateService({
      userId: "u-3",
      name: "Test",
      description: "Desc",
      area: "CABA",
      availability: "Lun",
      keywords: [],
      photos: [],
    });
    expect(base.name).toBe("Test");

    const updated = await repo.createOrUpdateService({
      ...base,
      description: "Nuevo",
    });
    expect(updated.description).toBe("Nuevo");

    await repo.deleteService(updated.id);
    const afterDelete = await repo.getServiceByUserId("u-3");
    expect(afterDelete).toBeUndefined();
  });
});
