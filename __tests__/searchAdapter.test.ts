jest.mock("@/core/api/axiosinstance", () => ({ __esModule: true, default: { get: jest.fn() } }));

import { adaptSearchResponse, mapSearchProvider } from "@/features/search/services/search.service";

describe("search adapter", () => {
  it("adapts a service with nested provider and price object", () => {
    const res = adaptSearchResponse(
      {
        query: "plom",
        services: [
          {
            id: "svc-1",
            title: "Fix pipes",
            description: "Leaks",
            category: { id: "cat-1", name: "Plumbing" },
            provider: { id: "prov-9", firstName: "Ana", lastName: "Lopez" },
            price: { amount: "1500", currency: "ARS", unit: "hour" },
          },
        ],
      },
      "plom"
    );
    const svc = res.services[0];
    expect(svc.id).toBe("svc-1");
    expect(svc.providerId).toBe("prov-9");
    expect(svc.name).toBe("Ana Lopez");
    expect(svc.categoryName).toBe("Plumbing");
    expect(svc.rate).toEqual({ amount: 1500, currency: "ARS", unit: "hour" });
    expect(res.providers).toEqual([]);
    expect(res.categories).toEqual([]);
  });

  it("maps providers from firstName/lastName/avatarUrl", () => {
    expect(mapSearchProvider({ id: "u1", firstName: "Ana", lastName: "Lopez", avatarUrl: "https://x/a.png" })).toMatchObject({
      id: "u1",
      name: "Ana Lopez",
      avatar: "https://x/a.png",
    });
  });

  it("drops providers without id and keeps empty providerId for services without provider", () => {
    const res = adaptSearchResponse({ providers: [{ firstName: "No" }], services: [{ id: "s2", title: "x" }] });
    expect(res.providers).toEqual([]);
    expect(res.services[0].providerId).toBe("");
  });
});
