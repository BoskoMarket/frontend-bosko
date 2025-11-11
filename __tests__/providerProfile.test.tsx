import { render, waitFor } from "@testing-library/react-native";
import React from "react";

import { ProviderProfile } from "@/components/ProviderProfile";
import { ServicesProvider, useServices } from "@/context/ServicesContext";

function Prefetcher({ providerId }: { providerId: string }) {
  const services = useServices();
  React.useEffect(() => {
    services.fetchCategories();
    services.fetchServicesByCategory("cat-1");
    services.fetchServiceReviews("service-1");
    services.fetchProviderProfile(providerId);
  }, [providerId, services]);
  return <ProviderProfile providerId={providerId} />;
}

describe("ProviderProfile", () => {
  test("renders provider data and aggregates", async () => {
    const screen = render(
      <ServicesProvider>
        <Prefetcher providerId="provider-1" />
      </ServicesProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("María López")).toBeTruthy();
    });

    expect(screen.getByText(/Electricista profesional/)).toBeTruthy();
    expect(screen.getByText(/reseñas/)).toBeTruthy();
  });
});
