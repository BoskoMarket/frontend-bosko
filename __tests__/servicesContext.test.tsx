import { act, render, waitFor } from "@testing-library/react-native";
import React from "react";

import { ServicesProvider, useServices } from "@/context/ServicesContext";

function withProvider(ui: React.ReactElement) {
  return render(<ServicesProvider>{ui}</ServicesProvider>);
}

function createConsumer(callback: (value: ReturnType<typeof useServices>) => void) {
  return function Consumer() {
    const value = useServices();
    React.useEffect(() => {
      callback(value);
    }, [value]);
    return null;
  };
}

describe("ServicesContext", () => {
  test("fetchCategories loads categories from API", async () => {
    let context: ReturnType<typeof useServices> | null = null;
    const onUpdate = (value: ReturnType<typeof useServices>) => {
      context = value;
    };

    withProvider(React.createElement(createConsumer(onUpdate)));

    await waitFor(() => {
      expect(context).not.toBeNull();
    });

    await act(async () => {
      await context!.fetchCategories();
    });

    await waitFor(() => {
      expect(context!.categories).toHaveLength(2);
    });
    expect(context!.categories[0].title).toBe("Hogar");
  });

  test("addReviewWithRating updates reviews and aggregates", async () => {
    let context: ReturnType<typeof useServices> | null = null;
    const onUpdate = (value: ReturnType<typeof useServices>) => {
      context = value;
    };

    withProvider(React.createElement(createConsumer(onUpdate)));

    await waitFor(() => context !== null);

    await act(async () => {
      await context!.fetchCategories();
      await context!.fetchServicesByCategory("cat-1");
      await context!.fetchProviderProfile("provider-1");
      await context!.fetchServiceReviews("service-1");
    });

    const before = context!.getProviderAggregate("provider-1");

    await act(async () => {
      await context!.addReviewWithRating({
        serviceId: "service-1",
        userId: "user-1",
        userName: "Cliente feliz",
        rating: 5,
        comment: "Excelente experiencia",
      });
    });

    const after = context!.getProviderAggregate("provider-1");
    expect(after.totalReviews).toBe(before.totalReviews + 1);
    expect(context!.reviewsByService["service-1"]).toHaveLength(
      before.totalReviews + 1
    );
  });

  test("addReviewWithRating rejects when user has no eligible purchase", async () => {
    let context: ReturnType<typeof useServices> | null = null;
    const onUpdate = (value: ReturnType<typeof useServices>) => {
      context = value;
    };

    withProvider(React.createElement(createConsumer(onUpdate)));

    await waitFor(() => context !== null);

    let error: unknown;
    await act(async () => {
      try {
        await context!.addReviewWithRating({
          serviceId: "service-1",
          userId: "user-2",
          userName: "Intruso",
          rating: 4,
          comment: "Buen servicio",
        });
      } catch (err) {
        error = err;
      }
    });

    expect(error).toMatchObject({ message: expect.stringContaining("Solo") });
  });
});
