import { fireEvent, render } from "@testing-library/react-native";
import React from "react";

import ServicesScreen from "@/app/(tabs)/services/index";
import CategoryServicesScreen from "@/app/(tabs)/services/category/[id]";
import ProviderProfileScreen from "@/app/(tabs)/services/provider/[id]";
import { ServiceReviews } from "@/components/ServiceReviews";
import { ServicesProvider, useServices } from "@/context/ServicesContext";

function ProviderWrapper({ children }: { children: React.ReactNode }) {
  return <ServicesProvider>{children}</ServicesProvider>;
}

function PrefetchedProviderScreen() {
  const services = useServices();

  React.useEffect(() => {
    services.fetchCategories().catch(() => undefined);
    services.fetchServicesByCategory("cat-1").catch(() => undefined);
  }, [services]);

  return <ProviderProfileScreen />;
}

describe("Service flows", () => {
  beforeEach(() => {
    (global as any).__router.router.push.mockClear();
    (global as any).__router.setParams({});
  });

  test("user navigates categories and leaves a review", async () => {
    const {
      findByText,
      findByLabelText,
      getByLabelText,
    } = render(
      <ProviderWrapper>
        <ServicesScreen />
      </ProviderWrapper>
    );

    const firstCategory = await findByLabelText("Hogar");
    fireEvent.press(firstCategory);

    expect((global as any).__router.router.push).toHaveBeenCalledWith({
      pathname: "/services/category/[id]",
      params: { id: "cat-1" },
    });

    (global as any).__router.setParams({ id: "cat-1" });

    const {
      findByText: findCategoryText,
      findByLabelText: findCategoryLabel,
      getByLabelText: getCategoryLabel,
    } = render(
      <ProviderWrapper>
        <CategoryServicesScreen />
      </ProviderWrapper>
    );

    const openServiceButton = await findCategoryLabel(
      "Abrir servicio Instalación de luminarias"
    );
    fireEvent.press(openServiceButton);

    expect((global as any).__router.router.push).toHaveBeenLastCalledWith({
      pathname: "../provider/[id]",
      params: { id: "provider-1", serviceId: "service-1" },
    });

    (global as any).__router.setParams({ id: "provider-1", serviceId: "service-1" });

    const {
      findByText: findProviderText,
      findByLabelText: findProviderLabel,
      getByLabelText: getProviderLabel,
    } = render(
      <ProviderWrapper>
        <PrefetchedProviderScreen />
      </ProviderWrapper>
    );

    await findProviderText("María López");

    const commentInput = await findProviderLabel("Comentario");
    fireEvent.changeText(commentInput, "Muy buen trabajo en casa");

    const star = await findProviderLabel("Calificar con 4 estrellas");
    fireEvent.press(star);

    fireEvent.press(getProviderLabel("Publicar reseña"));

    await findProviderText("Muy buen trabajo en casa");
  });

  test("form is disabled when user has not purchased", async () => {
    const EligibleWrapper = ({ children }: { children: React.ReactNode }) => (
      <ProviderWrapper>
        {children}
      </ProviderWrapper>
    );

    const { findByText, findByLabelText, getByLabelText } = render(
      <EligibleWrapper>
        <PrefetchedReviews serviceId="service-1" />
      </EligibleWrapper>
    );

    await findByText("Solo podés dejar una reseña si contrataste este servicio.");

    const commentInput = await findByLabelText("Comentario");
    expect(commentInput.props.editable).toBe(false);
  });
});

function PrefetchedReviews({ serviceId }: { serviceId: string }) {
  const services = useServices();
  React.useEffect(() => {
    services.fetchServiceReviews(serviceId);
  }, [serviceId, services]);

  return (
    <ServiceReviews
      serviceId={serviceId}
      currentUserId="user-2"
      currentUserName="Carlos"
    />
  );
}
